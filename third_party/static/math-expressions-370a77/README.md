# math-expressions

Math-expressions is client- or server-side JavaScript library for
parse expressions like `sin^2 (x^3)` and do some basic computer
algebra with them, like symbolic differentiation and numerically
identifying equivalent expressions.

# Demo of client-side use

There is a [demo available](https://rawgit.com/kisonecat/math-expressions/master/demo/index.html) which focuses on the equality testing.

# Code Example

Include the script in `build/math-expressions.js` on your page.

```HTML
<script type="text/javascript" src="math-expressions.js"></script>`
```

This adds `MathExpression` to the global namespace, so you can then perform the following parsing and equality-testing.

```JavaScript
var f = MathExpression.fromText("sin^2 (x^3)");

console.log(f.tex());

var g = MathExpression.fromText("sin^2 x + cos^2 x");
var h = MathExpression.fromText("1");

console.log( g.equals(h) );

var g = MathExpression.fromText("x + x^2");
var h = MathExpression.fromText("x + x^3");

console.log( g.equals(h) );
```

For server-side use, you can load the package as usual via `var MathExpression = require('math-expressions');`.

# Installation

The pre-built library is stored in `build/math-expressions.js`.  This
is packaged in a "unified" module format, so it can be treated as an
AMD-style or a CommonJS-style module (and imported via a module loader
like RequireJS).  If you are not using a module loader, you can import
it via

```HTML
<script type="text/javascript" src="math-expressions.js"></script>`
```

to add `MathExpression` to the global namespace.

# API Reference

## Expression constructors

### MathExpression.fromText(string)

Convert `string` to expression through the text parser.  For example, `var f = MathExpression.fromText('x^2');` will result in `f` representing the expression `x^2`.  Then `f.evaluate({x:3})` is 9.

This is often used for student-facing text, considering that even `MathExpression.fromText('sin^2 x')` does the right thing and produces the square of the sine function.  Exceptions are thrown when `string` does not parse.

### MathExpression.fromLatex(string)

Convert `string` to an expression through the LaTeX parser.  For example, `var f = MathExpression.fromLatex('\\frac{x+1}{2}');` will result in `f` representing the expression `(x+1)/2`.  Then `f.evaluate({x:3})` is 2.

## Expression methods

### expression.toString()

Produce a textual representation of `expression`.  For example, `MathExpression.fromText( f.toString() )` recreates `f`.

### expression.toLatex()

Produce a LaTeX representation of `expression`.  For example, if `f` is `MathExpression.fromText('x^10')`, then `f.toLatex()` is `x^{10}` since LaTeX requires braces for exponents.

### expression.variables()

Return the list of variables used in `expression`.  For example,  if `f` is `MathExpression.fromText('x + cos(y)')`, then `f.variables()` is `['x','y']`.

### expression.equals(another)

Determine whether `expression` and `another` represent the "same" expression.

The current algorithm randomly samples the two expressions in a neighborhood of the real line of the complex plane and demands approximate numeric equality most of the time for random assignments to the variables.  This is, quite admittedly, not a perfect algorithm, and it is likely to be replaced in a future version of this library.

### expression.derivative(variable)

Symbolically differentiate `expression` with respect to the given `variable`.  For example, if `f` is `MathExpression.fromText('x^10')`, then `f.derivative('x')` is `10 x^9`.

# Tests

Assuming you have `git clone`ed the repository and `npm install`ed to
populate `node_modules` with jasmine, you can then run the tests with
`npm test`.

Most of the tests are used to determine if `expression.equals(another)` does the expected thing on student input.

# License

Math-expressions is dual-licensed under GPLv3 and under Apache Version 2.0.
