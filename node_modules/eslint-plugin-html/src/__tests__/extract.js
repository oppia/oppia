/*eslint-env es6*/
/*eslint no-sparse-arrays: 0*/

"use strict"
const extract = require("../extract")

function dedent(str) {
  if (str[0] === "\n") str = str.slice(1)

  const indent = str.match(/([\t ]*)\S/)
  if (indent) {
    str = str.replace(new RegExp(`^${indent[1]}`, "mg"), "")

    if (indent[1].endsWith("  ")) {
      // Remove the last line indentation (under-indented by 2 spaces)
      str = str.replace(new RegExp(`${indent[1].slice(0, -2)}$`), "")
    }
  }

  return str
}

const html = "/* HTML */"

function test(params) {
  const infos = extract(
    dedent(params.input),
    params.indent,
    params.xmlMode,
    params.isJavaScriptMIMEType
  )
  expect(infos.code.toString()).toBe(dedent(params.output))
  expect(infos.badIndentationLines).toEqual(params.badIndentationLines || [])
}

it("extract simple javascript", () => {
  test({
    input: `
      some html
      <script>var foo = 1;</script>
      other
    `,
    output: `
      ${html}var foo = 1;${html}
    `,
  })
})

it("extract indented javascript", () => {
  test({
    input: `
      some html
      <script>
        var foo = 1;
      </script>
      other
    `,
    output: `
      ${html}
      var foo = 1;
      ${html}
    `,
  })
})

it("extract javascript with first line next to the script tag", () => {
  test({
    input: `
      some html
      <script>var foo = 1;
        var baz = 1;
      </script>
      other
    `,
    output: `
      ${html}var foo = 1;
      var baz = 1;
      ${html}
    `,
  })
})

it("extract javascript with last line next to the script tag", () => {
  test({
    input: `
      some html
      <script>
        var foo = 1;
        var baz = 1;</script>
      other
    `,
    output: `
      ${html}
      var foo = 1;
      var baz = 1;${html}
    `,
  })
})

it("extract multiple script tags", () => {
  test({
    input: `
      some html
      <script>
        var foo = 1;
      </script>
      other
      <script>
        var bar = 1;
      </script>
    `,
    output: `
      ${html}
      var foo = 1;
      ${html}
      var bar = 1;
      ${html}
    `,
  })
})

it("trim last line spaces", () => {
  test({
    input: `
      some html
        <script>
          var foo = 1;
        </script>
      other
    `,
    output: `
      ${html}
      var foo = 1;
      ${html}
    `,
  })
})

it("extract script containing 'lower than' characters correctly (#1)", () => {
  test({
    input: `
      <script>
        if (a < b) { doit(); }
      </script>
    `,
    output: `
      ${html}
      if (a < b) { doit(); }
      ${html}
    `,
  })
})


it("extract empty script tag (#7)", () => {
  test({
    input: `
      <script></script>
    `,
    output: `
      ${html}${html}
    `,
  })
})

const prefixes = ["text/",
                "text/x-",
                "application/",
                "application/x-"]

const types = ["javascript", "babel"]

for (const prefix of prefixes) {
  for (const type of types) {
    const tag = `${prefix}${type}`

    it(`extracts a script tag with type=${tag}`, () => {
      test({
        input: `
          some html
          <script type="${tag}">var foo = 1;</script>
          other
        `,
        output: `
          ${html}var foo = 1;${html}
        `,
      })
    })
  }
}

it("collects bad indentations", () => {
  test({
    input: `
      <script>
        a;
      a;
       a;
      </script>
    `,
    output: `
      ${html}
      a;
      a;
       a;
      ${html}
    `,
    badIndentationLines: [ 3, 4 ],
  })
})

describe("indent option", () => {
  it("absolute indent with spaces", () => {
    test({
      input: `
        <head>
          <script>
            a;
          a;
        a;
          </script>
        </head>
      `,
      indent: {
        spaces: "  ",
      },
      output: `
        ${html}
            a;
        a;
        a;
        ${html}
      `,
      badIndentationLines: [ 3, 5 ],
    })
  })

  it("relative indent with spaces", () => {
    test({
      input: `
        <head>
          <script>
            a;
          a;
        a;
          </script>
        </head>
      `,
      indent: {
        spaces: "  ",
        relative: true,
      },
      output: `
        ${html}
        a;
          a;
        a;
        ${html}
      `,
      badIndentationLines: [ 4, 5 ],
    })
  })

  it("absolute indent with tabs", () => {
    test({
      input: `
        <head>
        \t<script>
        \t\ta;
        \ta;
        a;
        \t</script>
        </head>
      `,
      indent: {
        spaces: "\t",
      },
      output: `
        ${html}
        \t\ta;
        a;
        a;
        ${html}
      `,
      badIndentationLines: [ 3, 5 ],
    })
  })

  it("relative indent with tabs", () => {
    test({
      input: `
        <head>
        \t<script>
        \t\ta;
        \ta;
        a;
        \t</script>
        </head>
      `,
      indent: {
        spaces: "\t",
        relative: true,
      },
      output: `
        ${html}
        a;
        \ta;
        a;
        ${html}
      `,
      badIndentationLines: [ 4, 5 ],
    })
  })
})

it("works with crlf new lines", () => {
  test({
    input: "<p>\r\n</p>\r\n<script>\r\n  foo;\r\nbar;\r\n    baz;\r\n</script>\r\n",
    output: `${html}\r\nfoo;\r\nbar;\r\n  baz;\r\n${html}\r\n`,
    badIndentationLines: [ 5 ],
  })
})

it("works with CDATA", () => {
  test({
    input: `
    <script>
      a;
      <![CDATA[
      b;
      ]]>
      c;
    </script>`,
    xmlMode: true,
    output: `
      ${html}
      a;
      ${html}
      b;
      ${html}
      c;
      ${html}`,
  })
})

it("handles the isJavaScriptMIMEType option", () => {
  test({
    input: `
    <script>
      a
    </script>

    <script type="foo/bar">
      b
    </script>

    <script type="foo/baz">
      c
    </script>
    `,
    isJavaScriptMIMEType(type) { return type === "foo/bar" },
    output: `
    ${html}
    a
    ${html}
    b
    ${html}
    `,
  })
})

it("keeps empty lines after the last html tags", () => {
  test({
    input: `
    <script>
      a
    </script>


    `,
    output: `
    ${html}
    a
    ${html}


    `,
  })
})

it("handles empty input", () => {
  test({
    input: "",
    output: "",
  })
})
