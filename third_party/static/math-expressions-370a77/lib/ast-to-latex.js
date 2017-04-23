/*
 * convert AST to LaTeX code
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
    "*": function(operands) { return operands.join( " \\, " ); },
    "/": function(operands) { return "\\frac{" + operands[0] + "}{" + operands[1] + "}"; },
    "^": function(operands) { return operands[0]  + "^{" + operands[1] + "}"; },
    "sin": function(operands) { return "\\sin " + operands[0]; },
    "cos": function(operands) { return "\\cos " + operands[0]; },
    "tan": function(operands) { return "\\tan " + operands[0]; },
    "arcsin": function(operands) { return "\\arcsin " + operands[0]; },
    "arccos": function(operands) { return "\\arccos " + operands[0]; },
    "arctan": function(operands) { return "\\arctan " + operands[0]; },
    "arccsc": function(operands) { return "\\arccsc " + operands[0]; },
    "arcsec": function(operands) { return "\\arcsec " + operands[0]; },
    "arccot": function(operands) { return "\\arccot " + operands[0]; },
    "csc": function(operands) { return "\\csc " + operands[0]; },
    "sec": function(operands) { return "\\sec " + operands[0]; },
    "cot": function(operands) { return "\\cot " + operands[0]; },
    "log": function(operands) { return "\\log " + operands[0]; },
    "exp": function(operands) { return "e^{" + operands[0] + "}"; },
    "ln": function(operands) { return "\\ln " + operands[0]; },
    "sqrt": function(operands) { return "\\sqrt{" + operands[0] + "}"; },
    "factorial": function(operands) { return operands[0] + "!"; },
    "gamma": function(operands) { return "\\Gamma " + operands[0]; },
    "abs": function(operands) { return "\\left|" + operands[0] + "\\right|"; },
    "factorial": function(operands) { return operands[0] + "!"; },    
    "apply": function(operands) { return operands[0] + "(" + operands[1] + ")"; },
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
	return operators[operator]( operands.map( function(v,i) { return term(v); } ) );
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
    
    if ((operator == '*') || (operator == '/')) {
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

function isFunctionSymbol( symbol )
{
    var functionSymbols = ['sin', 'cos', 'tan', 'csc', 'sec', 'cot', 'arcsin', 'arccos', 'arctan', 'arccsc', 'arcsec', 'arccot', 'log', 'ln', 'exp', 'sqrt', 'factorial', 'gamma', 'abs'];
    return (functionSymbols.indexOf(symbol) != -1);
}

function isGreekLetterSymbol( symbol )
{
    var greekSymbols = ['pi', 'theta', 'theta', 'Theta', 'alpha', 'nu', 'beta', 'xi', 'Xi', 'gamma', 'Gamma', 'delta', 'Delta', 'pi', 'Pi', 'epsilon', 'epsilon', 'rho', 'rho', 'zeta', 'sigma', 'Sigma', 'eta', 'tau', 'upsilon', 'Upsilon', 'iota', 'phi', 'phi', 'Phi', 'kappa', 'chi', 'lambda', 'Lambda', 'psi', 'Psi', 'omega', 'Omega'];
    return (greekSymbols.indexOf(symbol) != -1);
}


function factor(tree) {
    if (typeof tree === 'string') {
	if (isGreekLetterSymbol(tree)) return "\\" + tree;
	if (tree == "infinity") return "\\infty";
	return tree;
    }    
    
    if (typeof tree === 'number') {
	return tree;
    }
    
    var operator = tree[0];
    var operands = tree.slice(1);	

    if (operator == 'sqrt') {
	return operators[operator]( operands.map( function(v,i) { return expression(v); } ) );
    }

    if (operator == 'gamma') {
	return operators[operator]( operands.map( function(v,i) { return '\\left(' + expression(v) + '\\right)'; } ) );
    }    

    if (isFunctionSymbol(operator)) {
	return operators[operator]( operands.map( function(v,i) { return factor(v); } ) );
    }

    // Display trig functions in a more reasonable format
    if (operator === "^") {
	if (operands[0][0] === "sin")
	    return "\\sin^{" + factor(operands[1]) + "} " + factorWithParensIfNeeded(operands[0][1]);
	if (operands[0][0] === "cos")
	    return "\\cos^{" + factor(operands[1]) + "} " + factorWithParensIfNeeded(operands[0][1]);
	if (operands[0][0] === "tan")
	    return "\\tan^{" + factor(operands[1]) + "} " + factorWithParensIfNeeded(operands[0][1]);
	if (operands[0][0] === "sec")
	    return "\\sec^{" + factor(operands[1]) + "} " + factorWithParensIfNeeded(operands[0][1]);
	if (operands[0][0] === "csc")
	    return "\\csc^{" + factor(operands[1]) + "} " + factorWithParensIfNeeded(operands[0][1]);
	if (operands[0][0] === "cot")
	    return "\\cot^{" + factor(operands[1]) + "} " + factorWithParensIfNeeded(operands[0][1]);

	return operators[operator]( operands.map( function(v,i) { return factor(v); } ) );
    }

    if (operator == '~') {
	return operators[operator]( operands.map( function(v,i) { return factor(v); } ) );
    }

    return '\\left(' + expression(tree) + '\\right)';
}

function factorWithParensIfNeeded(tree) {
    return factor(tree);
}


function astToText(tree) {
    return expression(tree);
}

exports.astToLatex = astToText;
