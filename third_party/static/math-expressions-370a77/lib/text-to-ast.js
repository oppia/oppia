/*
 * recursive descent parser for math expressions 
 *
 * Copyright 2014-2015 by Jim Fowler <kisonecat@gmail.com>
 *
 * This file is part of a math-expressions library
 * 
 * math-expressions is free software: you can redistribute
 * it and/or modify it under the terms of the GNU General Public
 * License as published by the Free Software Foundation, either
 * version 3 of the License, or at your option any later version.
 * 
 * math-expressions is distributed in the hope that it
 * will be useful, but WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 * 
 */

/* Grammar: 

   expression =
    expression '+' term | 
    expression '-' term |
    term

   term =
    term '*' factor |
    term nonMinusFactor |
    term '/' factor |
    factor

   nonMinusFactor =
    '(' expression ')' |
    number | 
    variable |
    function factor |
    function '(' expression ')' |
    function '^' factor factor |
    nonMinusFactor '^' factor |
    nonMinusFactor '!'

   factor = 
    '-' factor |
    nonMinusFactor |
    '|' expression '|'

*/



var Parser = require('./lexers/text').Parser;
var lexer = new Parser();

/****************************************************************/
/* setup the lexer */

lexer.parse('');
lexer = lexer.lexer;

var symbol = '';

function advance() {
    symbol = lexer.lex();
    
    if (symbol == 4)
	symbol = 'EOF';
    
    return symbol;
}

function yytext() {
    return lexer.yytext;
}

/****************************************************************/
/* grammar */

function expression() {
    var lhs = term();
    
    while ((symbol == '+') || (symbol == '-')) {
	var operation = false;
	
	if (symbol == '+')
	    operation = '+';
	
	if (symbol == '-')
	    operation = '-';
	
	advance();
	
	var rhs = term();
	
	lhs = [operation, lhs, rhs];
    }
    
    return lhs;
}

function isGreekLetterSymbol( symbol )
{
    var greekSymbols = ['pi', 'theta', 'theta', 'Theta', 'alpha', 'nu', 'beta', 'xi', 'Xi', 'gamma', 'Gamma', 'delta', 'Delta', 'pi', 'Pi', 'epsilon', 'epsilon', 'rho', 'rho', 'zeta', 'sigma', 'Sigma', 'eta', 'tau', 'upsilon', 'Upsilon', 'iota', 'phi', 'phi', 'Phi', 'kappa', 'chi', 'lambda', 'Lambda', 'psi', 'Psi', 'omega', 'Omega'];
    return (greekSymbols.indexOf(symbol) != -1);
}

function isFunctionSymbol( symbol )
{
    var functionSymbols = ['SIN', 'COS', 'TAN', 'CSC', 'SEC', 'COT', 'ARCSIN', 'ARCCOS', 'ARCTAN', 'ARCCSC', 'ARCSEC', 'ARCCOT', 'LOG', 'LN', 'EXP', 'SQRT', 'ABS', 'GAMMA'];
    return (functionSymbols.indexOf(symbol) != -1);
}    

function term() {
    var lhs = factor();

    var keepGoing = false;
    
    do {
	keepGoing = false;
	
	if (symbol == '*') {
	    advance();
	    lhs = ['*', lhs, factor()];
	    keepGoing = true;
	} else if (symbol == '/') {
	    advance();
	    lhs = ['/', lhs, factor()];
	    keepGoing = true;
	} else {
	    rhs = nonMinusFactor();
	    if (rhs !== false) {
		lhs = ['*', lhs, rhs];
		keepGoing = true;
	    }
	}
    } while( keepGoing );
    
    return lhs;
}

function factor() {
    if (symbol == '-') {
	advance();
	return ['~', factor()];
    }

    if (symbol == '|') {
	advance();
	
	var result = expression();
	result = ['abs', result];
	    
	if (symbol != '|') {
	    throw 'Expected |';
	}
	advance();	    
	return result;
    }
    
    return nonMinusFactor();
}

function nonMinusFactor() {
    var result = false;
    
    if (symbol == 'NUMBER') {
	result = parseFloat( yytext() );
	advance();
    } else if (symbol == 'VAR') {
	result = yytext();
	advance();
    } else if (symbol == 'infinity') {
	result = symbol;
	advance();		
    } else if (isGreekLetterSymbol(symbol)) {
	result = symbol;
	advance();
    } else if (isFunctionSymbol(symbol)) {
	var functionName = symbol.toLowerCase();
	advance();

	if (symbol == '(') {
	    advance();
	    var parameter = expression();
	    if (symbol != ')') {
		throw 'Expected )';
	    }
	    advance();

	    result = [functionName, parameter];
	} else if (symbol == '^') {
	    advance();
	    var power = factor();
	    var parameter = factor();
	    result = ['^', [functionName, parameter], power];
	} else {
	    result = [functionName, factor()];
	}
    } else if (symbol == '(') {
	advance();
	result = expression();
	if (symbol != ')') {
	    throw 'Expected )';	    
	}
	advance();
    }
    
    if (symbol == '^') {
	advance();
	return ['^', result, factor()];
    }

    if (symbol == '!') {
	advance();
	return ['factorial', result];
    }
    
    return result;
}

// Without reassociating, a string like "1+2+3" is parsed into "(1+2)+3" which doesn't display very well.
function associate_ast( tree, op ) {
    if (typeof tree === 'number') {
	return tree;
    }    
    
    if (typeof tree === 'string') {
	return tree;
    }    
    
    var operator = tree[0];
    var operands = tree.slice(1);
    operands = operands.map( function(v,i) { 
	return associate_ast(v, op); } );
    
    if (operator == op) {
	var result = [];
	
	for( var i=0; i<operands.length; i++ ) {
	    if ((typeof operands[i] !== 'number') && (typeof operands[i] !== 'string') && (operands[i][0] === op)) {
		result = result.concat( operands[i].slice(1) );
	    } else {
		result.push( operands[i] );
	    }
	}
	
	operands = result;
    }
    
    return [operator].concat( operands );
}

function clean_ast( tree ) {
    tree = associate_ast( tree, '+' );
    tree = associate_ast( tree, '-' );
    tree = associate_ast( tree, '*' );
    return tree;
}

function parse(input) {
    lexer.setInput(input);
    advance();
    return clean_ast(expression());
}

exports.textToAst = parse;
