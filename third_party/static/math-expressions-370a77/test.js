var Expression = require ('./lib/math-expressions.js');

var g = Expression.fromTeX('\\cos \\theta * \\cos \\theta');
var g = Expression.fromTeX('\\ln (3^x)');
var g = Expression.fromTeX('\\log (3)');

var f = Expression.fromTeX('\\cos^2\\theta');
var f = Expression.fromText('ln 3');

console.log( f.tex() );
console.log( g.tex() );

// var f = Expression.fromText('theta + a');

console.log(f.equals(g));
