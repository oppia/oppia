/*
 * convert AST to a complex-valued javascript function
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


var ComplexNumber = require('./complex-number').ComplexNumber;

var complex_math_functions = {
    "+": function(operands) { var result = new ComplexNumber(0,0); operands.forEach(function(v,i) { result = result.sum( v ); }); return result; },
    "-": function(operands) { var result = operands[0]; operands.slice(1).forEach(function(v,i) { result = result.subtract( v ); }); return result; },
    "~": function(operands) { var result = new ComplexNumber(0,0); operands.forEach(function(v,i) { result = result.subtract( v ); }); return result; },
    "*": function(operands) { var result = operands[0]; operands.slice(1).forEach(function(v,i) { result = result.multiply( v ); }); return result; },
    "/": function(operands) { var result = operands[0]; operands.slice(1).forEach(function(v,i) { result = result.divide( v ); }); return result; },

    "sin": function(operands) { return operands[0].sin(); },
    "cos": function(operands) { return operands[0].cos(); },
    "tan": function(operands) { return operands[0].tan(); },
    "arcsin": function(operands) { return operands[0].arcsin(); },
    "arccos": function(operands) { return operands[0].arccos(); },
    "arctan": function(operands) { return operands[0].arctan(); },
    "arccsc": function(operands) { return operands[0].reciprocal().arcsin(); },
    "arcsec": function(operands) { return operands[0].reciprocal().arccos(); },
    "arccot": function(operands) { return operands[0].reciprocal().arctan(); },

    "csc": function(operands) { return operands[0].csc(); },
    "sec": function(operands) { return operands[0].sec(); },
    "cot": function(operands) { return operands[0].cot(); },

    "sqrt": function(operands) { return operands[0].power( new ComplexNumber(0.5,0) ); },
    "log": function(operands) { return operands[0].log(); },
    "ln": function(operands) { return operands[0].log(); },    
    "exp": function(operands) { return operands[0].exp(); },
    
    "factorial": function(operands) { return operands[0].factorial(); },
    "gamma": function(operands) { return operands[0].gamma(); },
    
    "^": function(operands) { return operands[0].power(operands[1]); },
    "abs": function(operands) {return operands[0].power(new ComplexNumber(2,0)).log().multiply(new ComplexNumber(.5,0)).exp();},
    "apply": function(operands) { return NaN; },
};

function complex_evaluate_ast(tree, bindings) {
    if (typeof tree === 'string') {
	if (tree === "e")
	    return new ComplexNumber( Math.E, 0 );

	if (tree === "pi")
	    return new ComplexNumber( Math.PI, 0 );

	if (tree === "i")
	    return new ComplexNumber( 0, 1 );

	if (tree in bindings)
	    return bindings[tree];
	
	return tree;
    }    

    if (typeof tree === 'number') {
	return new ComplexNumber( tree, 0 );
    }

    if (("real" in tree) && ("imaginary" in tree))
	return tree;
    
    var operator = tree[0];
    var operands = tree.slice(1);

    if (operator in complex_math_functions) {
	return complex_math_functions[operator]( operands.map( function(v,i) { return complex_evaluate_ast(v,bindings); } ) );
    }
    
    return new ComplexNumber( NaN,NaN );
}

function astToComplexFunction(tree) {
    return function(bindings) { return complex_evaluate_ast( tree, bindings ); };
}

exports.astToComplexFunction = astToComplexFunction;
