var astToLatex = require('../lib/parser').ast.to.latex;
var latexToAst = require('../lib/parser').latex.to.ast;
var _ = require('underscore');

describe("latex to ast", function() {
    var trees = {
	'\\frac{1}{2} x': ['*',['/',1,2],'x'],	
	'1+x+3': ['+',1,'x',3],
	'1-x-3': ['-',1,'x',3],	
	'x^2': ['^', 'x', 2],
	'\\log x': ['log', 'x'],
	'\\ln x': ['ln', 'x'],
	'-x^2': ['~',['^', 'x', 2]],
	'|x|': ['abs','x'],
	'|\\sin|x||': ['abs', ['sin', ['abs', 'x']]],	
    };

    _.each( _.keys(trees), function(string) {
	it("parses " + string, function() {
	    expect(latexToAst(string)).toEqual(trees[string]);
	});	
    });    
    
    var inputs = [
	'3+4',
	'x!',
	'17!',
	'(x+1)!',
	'(x^2+1)!',	
	'\\frac{1}{2}',
	'-2',
	'x^{2}',
	'\\sin x',
	'\\theta',	
	'\\theta^{2}',
	'\\sin 3',
	'\\cos x',
	'\\cos 3',
	'\\tan x',
	'\\tan 3',
	'\\sec x',
	'\\sec 3',
	'\\csc x',
	'\\csc 3',		
	'\\arcsin x',
	'\\arcsin 3',
	'\\arccos x',
	'\\arccos 3',
	'\\arctan x',
	'\\arctan 3',
	'\\arccsc x',
	'\\arccsc 3',
	'\\arcsec x',
	'\\arcsec 3',
	'\\arccot x',
	'\\arccot 3',
	'\\log x',
	'\\log 3',
	'\\log e^{x}',
	'e^{x}',
	'\\sqrt{x}',
	'\\sqrt{4}',
	'\\frac{1}{\\sqrt{3}}',	
	'\\frac{1}{\\sqrt{-x}}',
	'\\sin\\left(3\\,x\\right)',
	'\\sin\\left (3\\,x\\right )',  // this really gets written...	
	'\\sin^{2}\\left(3\\,x\\right)',
	'\\sin^{2}x+\\cos^{2}x',
	'\\frac{\\sin^{2}x}{\\cos^{2}x}',
	'\\sin^{3}\\left(x+y\\right)',
	'\\sin^{3}\\left  (x+y\\right  )',	
	'\\sqrt{x+y}',
	'\\sqrt{\\sqrt{x}}',
	'\\sqrt{\\frac{1}{x+y}}',
	'\\log(-x^{2})',
	'\\left|3\\right|',
	'\\sin\\left|x\\right|',
	'\\left|\\sin\\left|x\\right|\\right|',
	'|\\sin||x|||',
	'||x|+|y|+|z||',
    ];

    function clean(text) {
	return text
	    .replace(/\\left/g,'')
	    .replace(/\\right/g,'')
	    .replace(/\\ln/g,'\\log')
	    .replace(/ /g,'');
    }

    _.each( inputs, function(input) {
	it(input, function() {
	    expect(clean(astToLatex(latexToAst(input)))).toEqual(clean(input));
	});	
    });
    /*
    _.each( inputs, function(input) {
	it(input, function() {
	    expect(astToText(textToAst(astToText(textToAst(input)))).replace(/ /g,'')).toEqual(input.replace(/ /g,''));
	});	
    });    */
});
