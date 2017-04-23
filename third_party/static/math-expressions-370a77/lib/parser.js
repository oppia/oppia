/*
 * compute transitive closure of the many math expression parsers
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

kinds = ['mml', 'text', 'latex', 'ast', 'glsl', 'function', 'complexFunction'];

// define the basic converters
converters = {
    mml: {
	to: {
	    latex: require('./mml-to-latex').mmlToLatex,
	}
    },
    latex: {
	to: { 
	    ast: require('./latex-to-ast').latexToAst,
	}
    },
    text: {
	to: { 
	    ast: require('./text-to-ast').textToAst,
	}
    },
    ast: {
	to: {
	    text: require('./ast-to-text').astToText,
	    latex: require('./ast-to-latex').astToLatex,
	    glsl:  require('./ast-to-glsl').astToGlsl,
	    function:  require('./ast-to-function').astToFunction,
	    complexFunction: require('./ast-to-complex-function').astToComplexFunction,
	    signature: require('./ast-to-finite-field').astToSignature,
	}
    }
};

// compute the transitive closure
var foundNew = true;

while( foundNew ) {
    foundNew = false;
    
    kinds.forEach( function(a) {
	if (a in converters) {
	    kinds.forEach( function(b) {
		if ((b in converters) && (b in converters[a].to)) {
		    kinds.forEach( function(c) {
			if ((c in converters[b].to) && (!(c in converters[a].to))) {
			    foundNew = true;
			    converters[a].to[c] = function(x) { return (converters[b].to[c])( (converters[a].to[b])(x) ); };
			}
		    });
		}
	    });
	}
    });
}

// export the converters
kinds.forEach( function(a) {
    exports[a] = converters[a];
});
