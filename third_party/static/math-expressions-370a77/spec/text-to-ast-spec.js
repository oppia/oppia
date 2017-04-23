var astToText = require('../lib/parser').ast.to.text;
var textToAst = require('../lib/parser').text.to.ast;
var _ = require('underscore');

// BADBAD: The remaining bug is that expressions aren't sufficiently
// greedy which causes things like |x| |y| |z| to parse incorrectly.

describe("text to ast", function() {
    var trees = {
	'1+x+3': ['+',1,'x',3],
	"1 + + x": ['+',1,'x'],
	"1 + - x": ['+',1,['~','x']],
	"1 - - x": ['-',1,['~','x']],	
	"1 + + x/2": ['+',1,['/','x',2]],
	'1-x-3': ['-',1,'x',3],	
	'x^2': ['^', 'x', 2],
	'-x^2': ['~',['^', 'x', 2]],
	'x*y*z': ['*','x','y','z'],
	'x*y*z*w': ['*','x','y','z','w'],
	'(x*y)*(z*w)': ['*','x','y','z','w'],		
	'|x|': ['abs','x'],
	'a!': ['factorial','a'],	
	'theta': 'theta',
	'xtheta': ['*','x','theta'],
	'cos(theta)': ['cos','theta'],
	'xyzw': ['*','x', 'y', 'z', 'w'],
	'x!': ['factorial','x'],	
	'|sin|x||': ['abs', ['sin', ['abs', 'x']]],	
    };

    _.each( _.keys(trees), function(string) {
	it("parses " + string, function() {
	    expect(textToAst(string)).toEqual(trees[string]);
	});	
    });    
    
    var inputs = [
	'3+4',
	'1/2',
	'-2',
	'x!',
	'17!',
	'(x+1)!',
	'(x^2+1)!',
	'x^2',
	'sin x',
	'sin 3',
	'cos x',
	'cos 3',
	'tan x',
	'tan 3',
	'sec x',
	'sec 3',
	'theta',
	'csc x',
	'csc 3',		
	'arcsin x',
	'arcsin 3',
	'arccos x',
	'arccos 3',
	'arctan x',
	'arctan 3',
	'arccsc x',
	'arccsc 3',
	'arcsec x',
	'arcsec 3',
	'arccot x',
	'arccot 3',
	'log x',
	'log 3',
	'log(exp x)',
	'e^x',
	'sqrt x',
	'sqrt 4',
	'1/sqrt 3',	
	'1/sqrt(-x)',
	'1+2+3',	
	'x+y+z',	
	'sin(3x)',
	'sin^2(3x)',
	'sin^2 x + cos^2 x',
	'sin^2 x / cos^2 x',
	'sin^3 (x+y+z)',
	'sqrt(x+y+z)',
	'sqrt(sqrt x)',
	'sqrt(1/(x+y))',
	'log(-x^2)',
	'|3|',
	'sin |x|',
	'3+(-4)',
	'|sin|x||',
	'|sin||x|||',
	'||x|+|y|+|z||',
	'x!',
	'n!',
	'(n+1)!',
	'(n-1)!',
	'infinity',
    ];

    _.each( inputs, function(input) {
	it(input, function() {
	    expect(astToText(textToAst(input)).replace(/ /g,'')).toEqual(input.replace(/ /g,''));
	});	
    });

    _.each( inputs, function(input) {
	it(input, function() {
	    expect(astToText(textToAst(astToText(textToAst(input)))).replace(/ /g,'')).toEqual(input.replace(/ /g,''));
	});	
    });    
});
