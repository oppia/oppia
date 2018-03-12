"use strict"

const htmlparser = require("htmlparser2")
const TransformableString = require("./TransformableString")

function iterateScripts(code, options, onChunk) {
  if (!code) return

  const xmlMode = options.xmlMode
  const isJavaScriptMIMEType = options.isJavaScriptMIMEType || (() => true)
  let index = 0
  let inScript = false
  let nextType = null
  let nextEnd = null

  function emitChunk(type, end, lastChunk) {
    // Ignore empty chunks
    if (index !== end) {
      // Keep concatenating same type chunks
      if (nextType !== null && nextType !== type) {
        onChunk({
          type: nextType,
          start: index,
          end: nextEnd,
        })
        index = nextEnd
      }

      nextType = type
      nextEnd = end

      if (lastChunk) {
        onChunk({
          type: nextType,
          start: index,
          end: nextEnd,
        })
      }
    }

  }

  const parser = new htmlparser.Parser({

    onopentag (name, attrs) {
      // Test if current tag is a valid <script> tag.
      if (name !== "script") {
        return
      }

      if (attrs.type && !isJavaScriptMIMEType(attrs.type)) {
        return
      }

      inScript = true
      emitChunk("html", parser.endIndex + 1)
    },

    oncdatastart () {
      if (inScript) {
        emitChunk("cdata start", parser.startIndex + 9)
        emitChunk("script", parser.endIndex - 2)
        emitChunk("cdata end", parser.endIndex + 1)
      }
    },

    onclosetag (name) {
      if (name !== "script" || !inScript) {
        return
      }

      inScript = false

      const endSpaces = code.slice(index, parser.startIndex).match(/[ \t]*$/)[0].length
      emitChunk("script", parser.startIndex - endSpaces)
    },

    ontext () {
      if (!inScript) {
        return
      }

      emitChunk("script", parser.endIndex + 1)
    },

  }, {
    xmlMode: xmlMode === true,
  })

  parser.parseComplete(code)

  emitChunk("html", parser.endIndex + 1, true)
}

function computeIndent(descriptor, previousHTML, slice) {
  if (!descriptor) {
    const indentMatch = /[\n\r]+([ \t]*)/.exec(slice)
    return indentMatch ? indentMatch[1] : ""
  }

  if (descriptor.relative) {
    return previousHTML.match(/([^\n\r]*)<[^<]*$/)[1] + descriptor.spaces
  }

  return descriptor.spaces
}

function* dedent(indent, slice) {
  let hadNonEmptyLine = false
  const re = /(\r\n|\n|\r)([ \t]*)(.*)/g

  while (true) {
    const match = re.exec(slice)
    if (!match) break

    const newLine = match[1]
    const lineIndent = match[2]
    const lineText = match[3]

    const isEmptyLine = !lineText
    const isFirstNonEmptyLine = !isEmptyLine && !hadNonEmptyLine

    const badIndentation =
      // Be stricter on the first line
      isFirstNonEmptyLine ?
        indent !== lineIndent :
        lineIndent.indexOf(indent) !== 0

    if (!badIndentation) {
      yield {
        type: "dedent",
        from: match.index + newLine.length,
        to: match.index + newLine.length + indent.length,
      }
    }
    else if (isEmptyLine) {
      yield {
        type: "empty",
      }
    }
    else {
      yield {
        type: "bad-indent",
      }
    }

    if (!isEmptyLine) {
      hadNonEmptyLine = true
    }
  }
}

function extract(code, indentDescriptor, xmlMode, isJavaScriptMIMEType) {
  const badIndentationLines = []
  const transformedCode = new TransformableString(code)
  let lineNumber = 1
  let previousHTML = ""

  iterateScripts(code, { xmlMode, isJavaScriptMIMEType }, (chunk) => {
    const slice = code.slice(chunk.start, chunk.end)

    if (chunk.type === "html" || chunk.type === "cdata start" || chunk.type === "cdata end") {
      const newLinesRe = /(?:\r\n|\n|\r)([^\r\n])?/g
      let lastEmptyLinesLength = 0
      while (true) {
        const match = newLinesRe.exec(slice)
        if (!match) break
        lineNumber += 1
        lastEmptyLinesLength = !match[1] ? lastEmptyLinesLength + match[0].length : 0
      }
      transformedCode.replace(chunk.start, chunk.end - lastEmptyLinesLength, "/* HTML */")
      if (chunk.type === "html") previousHTML = slice
    }
    else if (chunk.type === "script") {
      for (const action of dedent(computeIndent(indentDescriptor, previousHTML, slice), slice)) {
        lineNumber += 1
        if (action.type === "dedent") {
          transformedCode.replace(chunk.start + action.from, chunk.start + action.to, "")
        } else if (action.type === "bad-indent") {
          badIndentationLines.push(lineNumber)
        }
      }
    }
  })

  return {
    code: transformedCode,
    badIndentationLines,
  }
}

module.exports = extract
