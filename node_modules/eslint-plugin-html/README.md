eslint-plugin-html
==================

[![Build Status](https://travis-ci.org/BenoitZugmeyer/eslint-plugin-html.svg?branch=master)](https://travis-ci.org/BenoitZugmeyer/eslint-plugin-html)

This [`ESLint`](http://eslint.org) plugin extracts and lints scripts from HTML files.

Only script tags with no type attribute or a type attribute containing a MIME type known to
represent JavaScript such as `text/javascript` or `application/javascript`, or `text/babel` will be
linted.


Usage
-----

Simply install via `npm install --save-dev eslint-plugin-html` and add the plugin to your ESLint
configuration. See
[ESLint documentation](http://eslint.org/docs/user-guide/configuring#configuring-plugins).

Example:

```javascript
{
    "plugins": [
        "html"
    ]
}
```

Note: by default, when executing the `eslint` command on a directory, only `.js` files will be
linted. You will have to specify extra extensions with the `--ext` option. Example: `eslint --ext
.html,.js src` will lint both `.html` and `.js` files in the `src` directory. See [ESLint
documentation](http://eslint.org/docs/user-guide/command-line-interface#ext).

XML support
-----------

This plugin parses HTML and XML markup slightly differently, mainly when considering `CDATA`
sections:
* in XML, any data inside a `CDATA` section will be considered as raw text (not XML) and the `CDATA`
  delimiter will be droped ;
* in HTML, there is no such thing for `<script>` tags: the `CDATA` delimiter is considered as normal
  text and thus, part of the script.


Settings
--------

### `html/html-extensions`

By default, this plugin will only consider files ending with those extensions as HTML: `.erb`,
`.handlebars`, `.hbs`, `.htm`, `.html`, `.mustache`, `.nunjucks`, `.php`, `.tag`, `.twig`, `.vue`,
`.we`. You can set your own list of HTML extensions by using this setting. Example:

```javascript
{
    "plugins": [ "html" ],
    "settings": {
        "html/html-extensions": [".html", ".we"],  // consider .html and .we files as HTML
    }
}
```


### `html/xml-extensions`

By default, this plugin will only consider files ending with those extensions as XML: `.xhtml`,
`.xml`. You can set your own list of XML extensions by using this setting. Example:

```javascript
{
    "plugins": [ "html" ],
    "settings": {
        "html/xml-extensions": [".html"],  // consider .html files as XML
    }
}
```


### `html/indent`

By default, the code between `<script>` tags is dedented according to the first non-empty line. The
setting `html/indent` allows to ensure that every script tags follow an uniform indentation. Like
the `indent` rule, you can pass a number of spaces, or `"tab"` to indent with one tab. Prefix this
value with a `+` to be relative to the `<script>` tag indentation. Example:

```javascript
{
    "plugins": [ "html" ],
    "settings": {
        "html/indent": "0",   // code should start at the beginning of the line (no initial indentation).
        "html/indent": "+2",  // indentation is the <script> indentation plus two spaces.
        "html/indent": "tab", // indentation is one tab at the beginning of the line.
    }
}
```


### `html/report-bad-indent`

By default, this plugin won't warn if it encounters a problematic indentation (ex: a line is under
indented). If you want to make sure the indentation is correct, use the `html/report-bad-indent` in
conjunction with the `indent` rule. Pass `"warn"` or `1` to display warnings, `"error"` or `2` to
display errors. Example:

```javascript
{
    "plugins": [ "html" ],
    "settings": {
        "html/report-bad-indent": "error",
    }
}
```


### `html/javascript-mime-types`

By default, the code between `<script>` tags is considered as JavaScript code only if there is no
`type` attribute or if its value matches the pattern
`/^(application|text)\/(x-)?(javascript|babel|ecmascript-6)$/i`. You can customize the types that
should be considered as JavaScript by providing one or multiple MIME types. If a MIME type starts
with a `/`, it will be considered as a regular expression. Example:

```javascript
{
    "plugins": [ "html" ],
    "settings": {
        "html/javascript-mime-types": ["text/javascript", "text/jsx"],  // also use script tags with a "text/jsx" type attribute
        "html/javascript-mime-types": "/^text\\/(javascript|jsx)$/",    // same thing
    }
}
```
