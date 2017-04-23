## Guppy-specific Modificiations: 

This is a modified version of KaTeX with the \rule style slightly
changed to get the desired cursor appearance.  Specifically, the
following lines were added to buildHTML.js under groupTypes.rule:

````
rule.style.marginRight = "-1px";
rule.style.marginLeft = "0px";
rule.style.borderLeftWidth = "1px";
````

Further, since we don't want the cursor to modify the appearance of
anything else, we give `\rule` elements a `cursor` class add a lot of
CSS rules like:

```
.mbin + .cursor + .mop {/* Same stuff as for .mbin + .mop */}
```

Finally, the type of a given element can be influenced by the type of
the element immediately before this.  When the cursor is right before
an element, we want that element's type to be influenced by the
element that is normally immediately before it.  In this case, that's
the element that is two elements prior.  So we plumb through the code
the element that is two elements prior as well as the previous one and
include logic that says "If the previous element is the cursor, ignore
it and consider instead the element preceeding it for making these
decisions".

A future project will be to explore implementing some KaTeX command
like `\cursor` which is a 1px line of zero width and and the normal
character height for whatever container it is within.

# [<img src="https://khan.github.io/KaTeX/katex-logo.svg" width="130" alt="KaTeX">](https://khan.github.io/KaTeX/) [![Build Status](https://travis-ci.org/Khan/KaTeX.svg?branch=master)](https://travis-ci.org/Khan/KaTeX)

KaTeX is a fast, easy-to-use JavaScript library for TeX math rendering on the web.

 * **Fast:** KaTeX renders its math synchronously and doesn't need to reflow the page. See how it compares to a competitor in [this speed test](http://jsperf.com/katex-vs-mathjax/).
 * **Print quality:** KaTeX’s layout is based on Donald Knuth’s TeX, the gold standard for math typesetting.
 * **Self contained:** KaTeX has no dependencies and can easily be bundled with your website resources.
 * **Server side rendering:** KaTeX produces the same output regardless of browser or environment, so you can pre-render expressions using Node.js and send them as plain HTML.

KaTeX supports all major browsers, including Chrome, Safari, Firefox, Opera, and IE 8 - IE 11.

## Usage

You can [download KaTeX](https://github.com/khan/katex/releases) and host it on your server or include the `katex.min.js` and `katex.min.css` files on your page directly from a CDN:

```html
<link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/KaTeX/0.3.0/katex.min.css">
<script src="//cdnjs.cloudflare.com/ajax/libs/KaTeX/0.3.0/katex.min.js"></script>
```

#### In-browser rendering

Call `katex.render` with a TeX expression and a DOM element to render into:

```js
katex.render("c = \\pm\\sqrt{a^2 + b^2}", element);
```

If KaTeX can't parse the expression, it throws a `katex.ParseError` error.

#### Server side rendering or rendering to a string

To generate HTML on the server or to generate an HTML string of the rendered math, you can use `katex.renderToString`:

```js
var html = katex.renderToString("c = \\pm\\sqrt{a^2 + b^2}");
// '<span class="katex">...</span>'
```

Make sure to include the CSS and font files, but there is no need to include the JavaScript. Like `render`, `renderToString` throws if it can't parse the expression.

#### Rendering options

You can provide an object of options as the last argument to `katex.render` and `katex.renderToString`. Available options are:

- `displayMode`: `boolean`. If `true` the math will be rendered in display mode, which will put the math in display style (so `\int` and `\sum` are large, for example), and will center the math on the page on its own line. If `false` the math will be rendered in inline mode. (default: `false`)

For example:

```js
katex.render("c = \\pm\\sqrt{a^2 + b^2}", element, { displayMode: true });
```

#### Automatic rendering of math on a page

Math on the page can be automatically rendered using the auto-render extension. See [the Auto-render README](contrib/auto-render/README.md) for more information.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

## License

KaTeX is licensed under the [MIT License](http://opensource.org/licenses/MIT).
