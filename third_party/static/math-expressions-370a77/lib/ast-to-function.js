/*
 * convert AST to a real-valued javascript function
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




var math_functions = {
    "+": function(operands) { var result = 0; operands.forEach(function(x) { result += x; }); return result; },
    "-": function(operands) { var result = operands[0]; operands.slice(1).forEach(function(x) { result -= x; }); return result; },
    "*": function(operands) { var result = operands[0]; operands.slice(1).forEach(function(x) { result *= x; }); return result; },
    "/": function(operands) { var result = operands[0]; operands.slice(1).forEach(function(x) { result /= x; }); return result; },
    "~": function(operands) { var result = 0; operands.forEach(function(x) { result -= x; }); return result; },
    "sin": function(operands) { return Math.sin(operands[0]); },
    "cos": function(operands) { return Math.cos(operands[0]); },
    "tan": function(operands) { return Math.tan(operands[0]); },
    "arcsin": function(operands) { return Math.asin(operands[0]); },
    "arccos": function(operands) { return Math.acos(operands[0]); },
    "arctan": function(operands) { return Math.atan(operands[0]); },
    "arccsc": function(operands) { return Math.asin(1.0/operands[0]); },
    "arcsec": function(operands) { return Math.acos(1.0/operands[0]); },
    "arccot": function(operands) { return Math.atan(1.0/operands[0]); },
    "csc": function(operands) { return 1.0/Math.sin(operands[0]); },
    "sec": function(operands) { return 1.0/Math.cos(operands[0]); },
    "cot": function(operands) { return 1.0/Math.tan(operands[0]); },
    "sqrt": function(operands) { return Math.sqrt(operands[0]); },
    "log": function(operands) { return Math.log(operands[0]); },
    "ln": function(operands) { return Math.log(operands[0]); },    
    "exp": function(operands) { return Math.exp(operands[0]); },    
    "^": function(operands) { return Math.pow(operands[0], operands[1]); },
    "abs": function(operands) { return Math.abs(operands[0]); },
    
    "factorial": function(operands) { return (new ComplexNumber(operands[0],0)).factorial().real_part(); },
    "gamma": function(operands) { return (new ComplexNumber(operands[0],0)).gamma().real_part(); },
    
    "apply": function(operands) { return NaN; },
};

function evaluate_ast(tree, bindings) {
    if (typeof tree === 'number') {
	return tree;
    }

    if (typeof tree === 'string') {
	if (tree === "e")
	    return Math.E;

	if (tree === "pi")
	    return Math.PI;

	if (tree in bindings)
	    return bindings[tree];
	
	return tree;
    }    
    
    var operator = tree[0];
    var operands = tree.slice(1);

    if (operator in math_functions) {
	return math_functions[operator]( operands.map( function(v,i) { return evaluate_ast(v,bindings); } ) );
    }
    
    return NaN;
}

function astToFunction(tree) {
    return function(bindings) { return evaluate_ast( tree, bindings ); };
}

exports.astToFunction = astToFunction;
