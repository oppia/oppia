/*
 * convert AST to a finite field function
 *
 * Copyright 2014-2016 by Jim Fowler <kisonecat@gmail.com>
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

var numberTheory = require('number-theory');
var ZmodN = require('./z-mod-n.js');

var PRIME = 10739999; // a very safe prime

var levelFunctions = {
    "+": function(operands) { return operands.reduce( function(x,y) { return x.add(y); } ) },
    "*": function(operands) { return operands.reduce( function(x,y) { return x.multiply(y); } ) },
    "/": function(operands) { return operands.reduce( function(x,y) { return x.divide(y); } ) },
    "-": function(operands) { return operands.reduce( function(x,y) { return x.subtract(y); } ) },
    "~": function(operands) { return operands.reduce( function(x,y) { return x.subtract(y); },
						      new ZmodN( [0], operands[0].modulus ) ) },
    "sqrt": function(operands) { return operands[0].sqrt(); },

    "abs": function(operands) { return (operands[0].multiply( operands[0] ).sqrt()); },
    
    // These aren't implemented for Gonnet's signature
    "factorial": function(operands) { return ZmodN( [NaN], NaN ); },
    "gamma": function(operands) { return ZmodN( [NaN], NaN ); }
};

var deeperFunctions = {
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

    "log": function(operands) { return operands[0].log(); },

    "apply": function(operands) { return NaN; },
};

// Determine whether a is a primitive root of Z mod m
function isPrimitiveRoot( a, m ) {
    var b = numberTheory.logMod( numberTheory.primitiveRoot(m), a, m );

    if (isNaN(b)) {
	return false;
    } else {
	return true;
    }
}

function signature_evaluate_ast(tree, bindings, modulus, level) {
    if (typeof tree === 'string') {
	if (tree === "e") {
	    return new ZmodN( [numberTheory.primitiveRoot(modulus)], modulus );
	}
	
	if (tree === "pi") {
	    if (modulus % 2 == 0)
		return new ZmodN( [modulus/2], modulus );
	    else
		// Probably a really bad idea
		return new ZmodN( [NaN], NaN );
	}
	
	if (tree === "i")
	    return new ZmodN( [0], 1 );

	if (tree in bindings)
	    return new ZmodN( [bindings[tree]], modulus );
	
	return tree;
    }    

    if (typeof tree === 'number') {
	return new ZmodN( [tree], modulus );
    }

    var operator = tree[0];
    var operands = tree.slice(1);

    if (operator == "exp") {
	var base = signature_evaluate_ast("e", {}, modulus, level);
	console.log("base=", base );
	console.log("phi=", numberTheory.eulerPhi(modulus) );
	console.log("operand=", operands[0] );
	var exponent = signature_evaluate_ast(operands[0], bindings, numberTheory.eulerPhi(modulus), level + 1);
	console.log("exponent=", exponent );		
	return base.power( exponent );	
    }

    if (operator == "sin") {
	var root = numberTheory.primitiveRoot(modulus);
	var g = new ZmodN( [root], modulus );
	var i = new ZmodN( [numberTheory.powerMod( root, numberTheory.eulerPhi(modulus) / 4, modulus)], modulus );
	var x = signature_evaluate_ast(operands[0], bindings, numberTheory.eulerPhi(modulus), level + 1);
	return ( g.power( x ).subtract( g.power( x.negate() ) ) ).divide( i.add(i) );
    }

    if (operator == "cos") {
	var g = new ZmodN( [numberTheory.primitiveRoot(modulus)], modulus );
	var x = signature_evaluate_ast(operands[0], bindings, numberTheory.eulerPhi(modulus), level + 1);
	return ( g.power( x ).add( g.power( x.negate() ) ) ).divide( new ZmodN( [2], modulus ) );
    }

    if (operator == "log") {
	var e = numberTheory.primitiveRoot(modulus);
	
	var k = 1;
	while( ! ( numberTheory.isProbablyPrime( k * modulus + 1 ) && isPrimitiveRoot( e, k * modulus + 1 ) ) )
	    k = k + 1;
	
	var q = k * modulus + 1;

	//var x = signature_evaluate_ast(operands[0], bindings, q, level - 1);
	var x = signature_evaluate_ast(operands[0], bindings, modulus, level);

	console.log( "is root = ", isPrimitiveRoot( e, q ) );
	console.log( "q=", q , "= ", k, "*", modulus, "+1");
	console.log( "isprime(q)=", numberTheory.isProbablyPrime(e) );
	console.log( "e=", e );
	console.log( "x=", x );
	console.log( "log = ", 
		     numberTheory.logMod(x.values[0], e, q) )
		
	console.log( "inv = ", numberTheory.powerMod( e,
						      numberTheory.logMod(x.values[0], e, q),
						      modulus ) );

	return new ZmodN(
	    x.values.map( function(x) {
		return numberTheory.logMod(x, numberTheory.primitiveRoot(modulus), q) % (modulus);
	    }),
	    modulus );
    }
    
    if (operator == "^") {
	var base = signature_evaluate_ast(operands[0], bindings, modulus, level);
	console.log( "base = ", base );	
	var exponent = signature_evaluate_ast(operands[1], bindings, numberTheory.eulerPhi(modulus), level + 1);
	console.log( "exponent = ", exponent );	
	return base.power( exponent );
    }    
    
    if (operator in levelFunctions) {
	return levelFunctions[operator]( operands.map( function(v,i) { return signature_evaluate_ast(v,bindings,modulus, level); } ) );
    }
    
    return new ZmodN( [NaN], NaN );
}

function astToSignature(tree, modulus) {
    return function(bindings) { return signature_evaluate_ast( tree, bindings, modulus, 0 ); };
}

exports.astToSignature = astToSignature;

