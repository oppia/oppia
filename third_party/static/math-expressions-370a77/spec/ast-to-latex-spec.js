var _ = require('underscore');
var textToLatex = require('../lib/parser').text.to.latex;

describe("ast to latex", function() {
    var texts = {
	'1+x+3': '1 + x + 3',
	'1-x-3': '1 - x - 3',
	'1 + x^2 + 3x^5': '1 + x^{2} + 3 \\, x^{5}',
	'|x|': '\\left|x\\right|',
	'sin^2 x': '\\sin^{2} x',
	'log x': '\\log x',
	'log |x|': '\\log \\left|x\\right|',
	'ln x': '\\ln x',
	'ln |x|': '\\ln \\left|x\\right|',
	'sin^2 (3x)': '\\sin^{2} \\left(3 \\, x\\right)',
	'sin x': '\\sin x',
	'x!': 'x!',
	'17!': '17!',
	'sqrt(-x)': '\\sqrt{-x}',
	'x^y z': 'x^{y} \\, z',
	'2^(2^x)': '2^{2^{x}}',
	'(2^x)^y': '\\left( 2^x \\right)^{y}',
	'x^(2y) z': 'x^{2 \\, y} \\, z',
	'n!': 'n!',
	'gamma(z)': '\\Gamma \\left(z\\right)',
	'gamma(pi z)': '\\Gamma \\left(\\pi \\, z\\right)',
	'1/(x^2 + x + 1)': '\\frac{1}{x^{2} + x + 1}',
	'oo': '\\infty',	
    };

    _.each( _.keys(texts), function(text) {
	it("converts " + text + " into " + texts[text], function() {
	    expect(textToLatex(text)).toEqual(texts[text]);
	});	
    });    
        
});
