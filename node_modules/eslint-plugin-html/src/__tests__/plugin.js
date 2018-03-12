"use strict"

const path = require("path")
const CLIEngine = require("eslint").CLIEngine
const plugin = require("..")

const isESLint2 = require("eslint/package.json").version.startsWith("2.")

function execute(file, baseConfig) {
  if (!baseConfig) baseConfig = {}

  const cli = new CLIEngine({
    extensions: ["html"],
    baseConfig: {
      settings: baseConfig.settings,
      rules: Object.assign({
        "no-console": 2,
      }, baseConfig.rules),
    },
    ignore: false,
    useEslintrc: false,
    fix: baseConfig.fix,
  })
  cli.addPlugin("html", plugin)
  const results = cli.executeOnFiles([path.join(__dirname, "fixtures", file)]).results[0]
  return baseConfig.fix ? results : results && results.messages
}

it("should extract and remap messages", () => {
  const messages = execute("simple.html")

  expect(messages.length, 5)

  const hasEndPosition = messages[0].endLine !== undefined

  expect(messages[0].message).toBe("Unexpected console statement.")
  expect(messages[0].line).toBe(8)
  expect(messages[0].column).toBe(7)
  if (hasEndPosition) {
    expect(messages[0].endLine).toBe(8)
    expect(messages[0].endColumn).toBe(18)
  }

  expect(messages[1].message).toBe("Unexpected console statement.")
  expect(messages[1].line).toBe(14)
  expect(messages[1].column).toBe(7)
  if (hasEndPosition) {
    expect(messages[1].endLine).toBe(14)
    expect(messages[1].endColumn).toBe(18)
  }

  expect(messages[2].message).toBe("Unexpected console statement.")
  expect(messages[2].line).toBe(20)
  expect(messages[2].column).toBe(3)
  if (hasEndPosition) {
    expect(messages[2].endLine).toBe(20)
    expect(messages[2].endColumn).toBe(14)
  }

  expect(messages[3].message).toBe("Unexpected console statement.")
  expect(messages[3].line).toBe(25)
  expect(messages[3].column).toBe(11)
  if (hasEndPosition) {
    expect(messages[3].endLine).toBe(25)
    expect(messages[3].endColumn).toBe(22)
  }

  expect(messages[4].message).toBe("Unexpected console statement.")
  expect(messages[4].line).toBe(28)
  expect(messages[4].column).toBe(13)
  if (hasEndPosition) {
    expect(messages[4].endLine).toBe(28)
    expect(messages[4].endColumn).toBe(24)
  }
})

it("should report correct line numbers with crlf newlines", () => {
  const messages = execute("crlf-newlines.html")

  expect(messages.length).toBe(1)

  expect(messages[0].message).toBe("Unexpected console statement.")
  expect(messages[0].line).toBe(8)
  expect(messages[0].column).toBe(7)
})

describe("html/indent setting", () => {
  it("should automatically compute indent when nothing is specified", () => {
    const messages = execute("indent-setting.html", {
      rules: {
        indent: [2, 2],
      },
    })

    expect(messages.length).toBe(0)
  })

  it("should work with a zero absolute indentation descriptor", () => {
    const messages = execute("indent-setting.html", {
      rules: {
        indent: [2, 2],
      },

      settings: {
        "html/indent": 0,
      },
    })

    expect(messages.length).toBe(3)

    // Only the first script is correctly indented (aligned on the first column)

    expect(messages[0].message).toMatch(/Expected indentation of 0 .* but found 2\./)
    expect(messages[0].line).toBe(16)

    expect(messages[1].message).toMatch(/Expected indentation of 0 .* but found 6\./)
    expect(messages[1].line).toBe(22)

    expect(messages[2].message).toMatch(/Expected indentation of 0 .* but found 10\./)
    expect(messages[2].line).toBe(28)
  })

  it("should work with a non-zero absolute indentation descriptor", () => {
    const messages = execute("indent-setting.html", {
      rules: {
        indent: [2, 2],
      },

      settings: {
        "html/indent": 2,
      },
    })

    expect(messages.length).toBe(7)

    // The first script is incorrect since the second line gets dedented
    expect(messages[0].message).toMatch(/Expected indentation of 2 .* but found 0\./)
    expect(messages[0].line).toBe(11)

    // The second script is correct.

    expect(messages[1].message).toMatch(/Expected indentation of 0 .* but found 6\./)
    expect(messages[1].line).toBe(22)

    expect(messages[2].message).toMatch(/Expected indentation of 8 .* but found 6\./)
    expect(messages[2].line).toBe(23)

    expect(messages[3].message).toMatch(/Expected indentation of 6 .* but found 4\./)
    expect(messages[3].line).toBe(24)


    expect(messages[4].message).toMatch(/Expected indentation of 0 .* but found 10\./)
    expect(messages[4].line).toBe(28)

    expect(messages[5].message).toMatch(/Expected indentation of 12 .* but found 10\./)
    expect(messages[5].line).toBe(29)

    expect(messages[6].message).toMatch(/Expected indentation of 10 .* but found 8\./)
    expect(messages[6].line).toBe(30)
  })

  it("should work with relative indentation descriptor", () => {
    const messages = execute("indent-setting.html", {
      rules: {
        indent: [2, 2],
      },

      settings: {
        "html/indent": "+2",
      },
    })

    expect(messages.length).toBe(4)

    // The first script is correct since it can't be dedented, but follows the indent
    // rule anyway.

    expect(messages[0].message).toMatch(/Expected indentation of 0 .* but found 2\./)
    expect(messages[0].line).toBe(16)

    // The third script is correct.

    expect(messages[1].message).toMatch(/Expected indentation of 0 .* but found 10\./)
    expect(messages[1].line).toBe(28)

    expect(messages[2].message).toMatch(/Expected indentation of 12 .* but found 4\./)
    expect(messages[2].line).toBe(29)

    expect(messages[3].message).toMatch(/Expected indentation of 10 .* but found 2\./)
    expect(messages[3].line).toBe(30)
  })
})

describe("html/report-bad-indent setting", () => {
  it("should report under-indented code with auto indent setting", () => {
    const messages = execute("report-bad-indent-setting.html", {
      settings: {
        "html/report-bad-indent": true,
      },
    })

    expect(messages.length).toBe(1)

    expect(messages[0].message).toBe("Bad line indentation.")
    expect(messages[0].line).toBe(10)
    expect(messages[0].column).toBe(1)
  })

  it("should report under-indented code with provided indent setting", () => {
    const messages = execute("report-bad-indent-setting.html", {
      settings: {
        "html/report-bad-indent": true,
        "html/indent": "+4",
      },
    })

    expect(messages.length).toBe(3)

    expect(messages[0].message).toBe("Bad line indentation.")
    expect(messages[0].line).toBe(9)
    expect(messages[0].column).toBe(1)

    expect(messages[1].message).toBe("Bad line indentation.")
    expect(messages[1].line).toBe(10)
    expect(messages[1].column).toBe(1)

    expect(messages[2].message).toBe("Bad line indentation.")
    expect(messages[2].line).toBe(11)
    expect(messages[2].column).toBe(1)
  })
})

describe("xml support", () => {
  it("consider .html files as HTML", () => {
    const messages = execute("cdata.html")

    expect(messages.length).toBe(1)

    expect(messages[0].message).toBe("Parsing error: Unexpected token <")
    expect(messages[0].fatal).toBe(true)
    expect(messages[0].line).toBe(10)
    expect(messages[0].column).toBe(7)
  })

  it("can be forced to consider .html files as XML", () => {
    const messages = execute("cdata.html", {
      settings: {
        "html/xml-extensions": [".html"],
      },
    })

    expect(messages.length).toBe(1)

    expect(messages[0].message).toBe("Unexpected console statement.")
    expect(messages[0].line).toBe(11)
    expect(messages[0].column).toBe(9)
  })

  it("consider .xhtml files as XML", () => {
    const messages = execute("cdata.xhtml")

    expect(messages.length).toBe(1)

    expect(messages[0].message).toBe("Unexpected console statement.")
    expect(messages[0].line).toBe(13)
    expect(messages[0].column).toBe(9)
  })

  it("can be forced to consider .xhtml files as HTML", () => {
    const messages = execute("cdata.xhtml", {
      settings: {
        "html/html-extensions": [".xhtml"],
      },
    })

    expect(messages.length).toBe(1)

    expect(messages[0].message).toBe("Parsing error: Unexpected token <")
    expect(messages[0].fatal).toBe(true)
    expect(messages[0].line).toBe(12)
    expect(messages[0].column).toBe(7)
  })
})

describe("lines-around-comment and multiple scripts", () => {
  it("should not warn with lines-around-comment if multiple scripts", () => {
    const messages = execute("simple.html", {
      "rules": {
        "lines-around-comment": ["error", { "beforeLineComment": true }],
      },
    })

    expect(messages.length).toBe(5)
  })
})

describe("fix", () => {
  it("should remap fix ranges", () => {
    const messages = execute("fix.html", {
      "rules": {
        "no-extra-semi": ["error"],
      },
    })

    expect(messages.length).toBe(1)
    expect(messages[0].fix.range).toEqual([ 54, 55 ])
  })

  it("should fix errors", () => {
    const result = execute("fix.html", {
      rules: {
        "no-extra-semi": ["error"],
      },
      fix: true,
    })

    expect(result.output).toBe(`<!DOCTYPE html>
<html lang="en">
  <script>
    foo();
  </script>
</html>
`)
    expect(result.messages.length).toBe(0)
  })

  it("should fix errors in files with BOM", () => {
    const result = execute("fix-bom.html", {
      rules: {
        "no-extra-semi": ["error"],
      },
      fix: true,
    })

    expect(result.output).toBe(`\uFEFF<!DOCTYPE html>
<html lang="en">
  <script>
    foo();
  </script>
</html>
`)
    expect(result.messages.length).toBe(0)
  })

  describe("eol-last rule", () => {
    it("should work with eol-last always", () => {
      const result = execute("fix.html", {
        rules: {
          "eol-last": ["error"],
          "no-extra-semi": ["error"],
        },
        fix: true,
      })

      expect(result.output).toBe(`<!DOCTYPE html>
<html lang="en">
  <script>
    foo();
  </script>
</html>
`)
      expect(result.messages.length).toBe(0)
    })

    it("should work with eol-last never", () => {
      // ESLint 2 did not remove the last new line if any
      if (isESLint2) return
      const result = execute("fix.html", {
        rules: {
          "eol-last": ["error", "never"],
        },
        fix: true,
      })

      expect(result.output).toBe(`<!DOCTYPE html>
<html lang="en">
  <script>
    foo();;
  </script>
</html>`)
      expect(result.messages.length).toBe(0)
    })
  })
})

describe("html/javascript-mime-types", () => {
  it("ignores unknown mime types by default", () => {
    const messages = execute("javascript-mime-types.html")

    expect(messages.length).toBe(2)

    expect(messages[0].ruleId).toBe("no-console")
    expect(messages[0].line).toBe(8)

    expect(messages[1].ruleId).toBe("no-console")
    expect(messages[1].line).toBe(12)
  })

  it("specifies a list of valid mime types", () => {
    const messages = execute("javascript-mime-types.html", {
      settings: {
        "html/javascript-mime-types": ["text/foo"],
      },
    })

    expect(messages.length, 2)

    expect(messages[0].ruleId).toBe("no-console")
    expect(messages[0].line).toBe(8)

    expect(messages[1].ruleId).toBe("no-console")
    expect(messages[1].line).toBe(16)
  })

  it("specifies a regexp of valid mime types", () => {
    const messages = execute("javascript-mime-types.html", {
      settings: {
        "html/javascript-mime-types": "/^(application|text)\/foo$/",
      },
    })

    expect(messages.length).toBe(3)

    expect(messages[0].ruleId).toBe("no-console")
    expect(messages[0].line).toBe(8)

    expect(messages[1].ruleId).toBe("no-console")
    expect(messages[1].line).toBe(16)

    expect(messages[2].ruleId).toBe("no-console")
    expect(messages[2].line).toBe(20)
  })
})
