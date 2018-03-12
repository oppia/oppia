"use strict"

const path = require("path")
const extract = require("./extract")

const defaultHTMLExtensions = [
  ".erb",
  ".handlebars",
  ".hbs",
  ".htm",
  ".html",
  ".mustache",
  ".nunjucks",
  ".php",
  ".tag",
  ".twig",
  ".vue",
  ".we",
]

const defaultXMLExtensions = [
  ".xhtml",
  ".xml",
]

// Disclaimer:
//
// This is not a long term viable solution. ESLint needs to improve its processor API to
// provide access to the configuration before actually preprocess files, but it's not
// planed yet. This solution is quite ugly but shouldn't alter eslint process.
//
// Related github issues:
// https://github.com/eslint/eslint/issues/3422
// https://github.com/eslint/eslint/issues/4153

iterateESLintModules(patch)

function iterateESLintModules(fn) {
  if (!require.cache || Object.keys(require.cache).length === 0) {
    // Jest is replacing the node "require" function, and "require.cache" isn't available here.
    return fn({
      eslint: require("eslint/lib/eslint"),
      SourceCodeFixer: require("eslint/lib/util/source-code-fixer"),
    })
  }

  let found = false
  const needle = path.join("lib", "eslint.js")
  for (const key in require.cache) {
    if (key.endsWith(needle)) {
      const sourceCodeFixerKey = path.join(key, "..", "util", "source-code-fixer.js")

      const eslint = require.cache[key]
      const SourceCodeFixer = require.cache[sourceCodeFixerKey]

      if (eslint.exports && typeof eslint.exports.verify === "function" &&
        SourceCodeFixer && SourceCodeFixer.exports) {
        fn({ eslint: eslint.exports, SourceCodeFixer: SourceCodeFixer.exports })
        found = true
      }
    }
  }

  if (!found) {
    throw new Error("eslint-plugin-html error: It seems that eslint is not loaded. " +
                    "If you think it is a bug, please file a report at " +
                    "https://github.com/BenoitZugmeyer/eslint-plugin-html/issues")
  }
}

function filterOut(array, excludeArray) {
  if (!excludeArray) return array
  return array.filter((item) => excludeArray.indexOf(item) < 0)
}

function compileRegExp(re) {
  const tokens = re.split("/")
  if (tokens.shift()) { // Ignore first token
    throw new Error(`Invalid regexp: ${re}`)
  }
  const flags = tokens.pop()
  return new RegExp(tokens.join("/"), flags)
}

function getPluginSettings(settings) {

  const htmlExtensions = settings["html/html-extensions"] ||
      filterOut(defaultHTMLExtensions, settings["html/xml-extensions"])

  const xmlExtensions = settings["html/xml-extensions"] ||
      filterOut(defaultXMLExtensions, settings["html/html-extensions"])

  let reportBadIndent
  switch (settings["html/report-bad-indent"]) {
    case undefined: case false: case 0: case "off":
      reportBadIndent = 0
      break
    case true: case 1: case "warn":
      reportBadIndent = 1
      break
    case 2: case "error":
      reportBadIndent = 2
      break
    default:
      throw new Error("Invalid value for html/report-bad-indent, " +
        "expected one of 0, 1, 2, \"off\", \"warn\" or \"error\"")
  }

  const parsedIndent = /^(\+)?(tab|\d+)$/.exec(settings["html/indent"])
  const indent = parsedIndent && {
    relative: parsedIndent[1] === "+",
    spaces: parsedIndent[2] === "tab" ? "\t" : " ".repeat(parsedIndent[2]),
  }

  const javaScriptMIMETypes = settings["html/javascript-mime-types"] ?
    (
      Array.isArray(settings["html/javascript-mime-types"]) ?
        settings["html/javascript-mime-types"] :
        [settings["html/javascript-mime-types"]]
    ).map((s) => s.startsWith("/") ? compileRegExp(s) : s) :
    [/^(application|text)\/(x-)?(javascript|babel|ecmascript-6)$/i]

  function isJavaScriptMIMEType(type) {
    return javaScriptMIMETypes.some((o) => typeof o === "string" ? type === o : o.test(type))
  }

  return {
    htmlExtensions,
    xmlExtensions,
    indent,
    reportBadIndent,
    isJavaScriptMIMEType,
  }
}

function patch(modules) {
  const eslint = modules.eslint
  const SourceCodeFixer = modules.SourceCodeFixer

  const sourceCodeForMessages = new WeakMap()

  const verify = eslint.verify
  eslint.verify = function (textOrSourceCode, config, filenameOrOptions, saveState) {
    const localVerify = (code) => verify.call(this, code, config, filenameOrOptions, saveState)

    let messages
    const filename = typeof filenameOrOptions === "object" ?
      filenameOrOptions.filename :
      filenameOrOptions
    const extension = path.extname(filename || "")

    const pluginSettings = getPluginSettings(config.settings || {})
    const isHTML = pluginSettings.htmlExtensions.indexOf(extension) >= 0
    const isXML = !isHTML && pluginSettings.xmlExtensions.indexOf(extension) >= 0

    if (typeof textOrSourceCode === "string" && (isHTML || isXML)) {
      const currentInfos = extract(
        textOrSourceCode,
        pluginSettings.indent,
        isXML,
        pluginSettings.isJavaScriptMIMEType
      )

      messages = remapMessages(
        localVerify(String(currentInfos.code)),
        currentInfos.code,
        pluginSettings.reportBadIndent,
        currentInfos.badIndentationLines
      )
      sourceCodeForMessages.set(messages, textOrSourceCode)
    }
    else {
      messages = localVerify(textOrSourceCode)
    }

    return messages
  }

  const applyFixes = SourceCodeFixer.applyFixes
  SourceCodeFixer.applyFixes = function (sourceCode, messages) {
    const originalSourceCode = sourceCodeForMessages.get(messages)
    // The BOM is always included in the HTML, which is removed by the extract process
    return applyFixes.call(
      this,
      originalSourceCode === undefined ? sourceCode : { text: originalSourceCode, hasBOM: false },
      messages
    )
  }

}

function remapMessages(messages, code, reportBadIndent, badIndentationLines) {
  const newMessages = []

  for (const message of messages) {
    const location = code.originalLocation(message)

    // Ignore messages if they were in transformed code
    if (location) {
      Object.assign(message, location)

      // Map fix range
      if (message.fix && message.fix.range) {
        message.fix.range = [
          code.originalIndex(message.fix.range[0]),
          code.originalIndex(message.fix.range[1]),
        ]
      }

      // Map end location
      if (message.endLine && message.endColumn) {
        const endLocation = code.originalLocation({
          line: message.endLine,
          column: message.endColumn,
        })
        if (endLocation) {
          message.endLine = endLocation.line
          message.endColumn = endLocation.column
        }
      }

      newMessages.push(message)
    }
  }

  if (reportBadIndent) {
    badIndentationLines.forEach((line) => {
      newMessages.push({
        message: "Bad line indentation.",
        line,
        column: 1,
        ruleId: "(html plugin)",
        severity: reportBadIndent === true ? 2 : reportBadIndent,
      })
    })
  }

  newMessages.sort((ma, mb) => {
    return ma.line - mb.line || ma.column - mb.column
  })

  return newMessages
}
