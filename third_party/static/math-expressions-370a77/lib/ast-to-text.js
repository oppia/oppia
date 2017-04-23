/*
 * convert syntax trees back to plain text representations
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



var operators = {
    "+": function(operands) { return operands.join( ' + ' ); },
    "-": function(operands) { return operands.join( ' - ' ); },
    "~": function(operands) { return "-" + operands.join( ' - ' ); },
    "*": function(operands) { return operands.join( " " ); },
    "/": function(operands) { return "" + operands[0] + "/" + operands[1]; },
    "^": function(operands) { return operands[0]  + "^" + operands[1] + ""; },
    "sin": function(operands) { return "sin " + operands[0]; },
    "cos": function(operands) { return "cos " + operands[0]; },
    "tan": function(operands) { return "tan " + operands[0]; },
    "arcsin": function(operands) { return "arcsin " + operands[0]; },
    "arccos": function(operands) { return "arccos " + operands[0]; },
    "arctan": function(operands) { return "arctan " + operands[0]; },
    "arccsc": function(operands) { return "arccsc " + operands[0]; },
    "arcsec": function(operands) { return "arcsec " + operands[0]; },
    "arccot": function(operands) { return "arccot " + operands[0]; },
    "csc": function(operands) { return "csc " + operands[0]; },
    "sec": function(operands) { return "sec " + operands[0]; },
    "cot": function(operands) { return "cot " + operands[0]; },
    "log": function(operands) { return "log " + operands[0]; },
    "exp": function(operands) { return "exp " + operands[0]; },    
    "ln": function(operands) { return "ln " + operands[0]; },
    "sqrt": function(operands) { return "sqrt " + operands[0] + ""; },
    "abs": function(operands) { return "|" + operands[0] + "|"; },
    "apply": function(operands) { return operands[0] + "(" + operands[1] + ")"; },
    "factorial": function(operands) { return operands[0] + "!"; },
};

/*    
   expression =
    expression '+' term |
    expression '-' term |
    term
*/

function expression(tree) {
    if ((typeof tree === 'string') || (typeof tree === 'number')) {
	return term(tree);	
    }
    
    var operator = tree[0];
    var operands = tree.slice(1);
    
    if ((operator == '+') || (operator == '-')) {
	return operators[operator]( operands.map( function(v,i) { return factorWithParenthesesIfNegated(v); } ));
    }
    
    return term(tree);
}

/*
  term =
  term '*' factor |
  term nonMinusFactor |
  term '/' factor |
  factor
*/

function term(tree) {
    if ((typeof tree === 'string') || (typeof tree === 'number')) {
	return factor(tree);	
    }
    
    var operator = tree[0];
    var operands = tree.slice(1);

    if (operator == '*') {
	return operators[operator]( operands.map( function(v,i) {
	    var result = factorWithParenthesesIfNegated(v);
	    
	    if (result.toString().match( /^[0-9]/ ) && (i > 0))
		return ' * ' + result;
	    else
		return result;
	}));
    }
    
    if (operator == '/') {
	return operators[operator]( operands.map( function(v,i) { return factor(v); } ) );
    }
    
    return factor(tree);	
}

/*
  factor =
  '(' expression ')' |
  number | 
  variable |
  function factor |
  factor '^' factor
  '-' factor |
  nonMinusFactor
*/

function isGreekLetterSymbol( symbol )
{
    var greekSymbols = ['pi', 'theta', 'theta', 'Theta', 'alpha', 'nu', 'beta', 'xi', 'Xi', 'gamma', 'Gamma', 'delta', 'Delta', 'pi', 'Pi', 'epsilon', 'epsilon', 'rho', 'rho', 'zeta', 'sigma', 'Sigma', 'eta', 'tau', 'upsilon', 'Upsilon', 'iota', 'phi', 'phi', 'Phi', 'kappa', 'chi', 'lambda', 'Lambda', 'psi', 'Psi', 'omega', 'Omega'];
    return (greekSymbols.indexOf(symbol) != -1);
}

function isFunctionSymbol( symbol )
{
    var functionSymbols = ['sin', 'cos', 'tan', 'csc', 'sec', 'cot', 'arcsin', 'arccos', 'arctan', 'arccsc', 'arcsec', 'arccot', 'log', 'ln', 'exp', 'sqrt', 'abs', 'factorial'];
    return (functionSymbols.indexOf(symbol) != -1);
}

function factor(tree) {
    if (typeof tree === 'string') {
	return tree;
    }    
    
    if (typeof tree === 'number') {
	return tree;
    }
    
    var operator = tree[0];
    var operands = tree.slice(1);	

    // Absolute value doesn't need any special parentheses handling, but its operand is really an expression
    if (operator === "abs") {
	return operators[operator]( operands.map( function(v,i) { return expression(v); } ));
    } else if (isFunctionSymbol(operator)) {
	if ((operator == 'factorial') && ((operands[0].toString().length == 1) || (operands[0].toString().match( /^[0-9]*$/ ))))
	    return operators[operator]( operands );
	    
	return operators[operator]( operands.map( function(v,i) {
	    // Function operands get parens if they are longer than a single character,
	    // unless they already start with a parenthesis or |
	    var result = factor(v);
	    if ((result.toString().length > 1) && (!(result.toString().match( /^\(/))) && (!(result.toString().match( /^\|/))))
		return '(' + result.toString() + ')';
	    else
		return result;
	}));
    }
    
    // Display trig functions in a more reasonable format
    if (operator === "^") {
	if (operands[0][0] === "sin")
	    return "sin^" + factor(operands[1]) + " " + factor(operands[0][1]);
	if (operands[0][0] === "cos")
	    return "cos^" + factor(operands[1]) + " " + factor(operands[0][1]);
	if (operands[0][0] === "tan")
	    return "tan^" + factor(operands[1]) + " " + factor(operands[0][1]);
	if (operands[0][0] === "sec")
	    return "sec^" + factor(operands[1]) + " " + factor(operands[0][1]);
	if (operands[0][0] === "csc")
	    return "csc^" + factor(operands[1]) + " " + factor(operands[0][1]);
	if (operands[0][0] === "cot")
	    return "cot^" + factor(operands[1]) + " " + factor(operands[0][1]);
    }
    
    if (operator === "^") {
	return operators[operator]( operands.map( function(v,i) { return factor(v); } ) );
    }
    
    if (operator == '~') {
	return operators[operator]( operands.map( function(v,i) { return factor(v); } ) );
    }
    
    return '(' + expression(tree) + ')';
}

function factorWithParenthesesIfNegated(tree)
{
    var result = factor(tree);

    if (result.toString().match( /^-/ ))
	return '(' + result.toString() + ')';

    // else
    return result;
}

function astToText(tree) {
    return expression(tree);
}

exports.astToText = astToText;
