var parser = require('../parser');
var textToAst = parser.text.to.ast;
var astToLatex = parser.ast.to.latex;

var Expression = require('../math-expressions');

function clean_ast(ast) {
    return Expression.fromAst(ast).tree;
}

var derivatives = {
    "sin": textToAst('cos x'),
    "cos": textToAst('-(sin x)'),
    "tan": textToAst('(sec x)^2'),
    "cot": textToAst('-((csc x)^2)'),
    "sec": textToAst('(sec x)*(tan x)'),
    "csc": textToAst('-(csc x)*(cot x)'),
    "sqrt": textToAst('1/(2*sqrt(x))'),
    "log": textToAst('1/x'),
    "ln": textToAst('1/x'),    
    "arcsin": textToAst('1/sqrt(1 - x^2)'),
    "arccos": textToAst('-1/sqrt(1 - x^2)'),
    "arctan": textToAst('1/(1 + x^2)'),
    "arccsc": textToAst('-1/(sqrt(-1/x^2 + 1)*x^2)'),
    "arcsec": textToAst('1/(sqrt(-1/x^2 + 1)*x^2)'),
    "arccot": textToAst('-1/(1 + x^2)'),
    "abs": textToAst('abs(x)/x'),
};

function substitute_ast(tree, bindings) {
    if (typeof tree === 'number') {
	return tree;
    }    
    
    if (typeof tree === 'string') {
	if (tree in bindings)
	    return bindings[tree];
	
	return tree;
    }    
    
    var operator = tree[0];
    var operands = tree.slice(1);
    
    var result = [operator].concat( operands.map( function(v,i) { return substitute_ast(v,bindings); } ) );
    return result;
};

function leaves( tree ) {
    if (typeof tree === 'number') {
	return [tree];
    }

    if (typeof tree === 'string') {
	return [tree];
    }    

    var operator = tree[0];
    var operands = tree.slice(1);

    return operands.map( function(v,i) { return leaves(v); } )
	.reduce( function(a,b) { return a.concat(b); } );
}

function variables_in_ast( tree ) {
    var result = leaves( tree );

    result = result.filter( function(v,i) {
	return (typeof v === 'string') && (v != "e") && (v != "pi");
    });

    result = result.filter(function(itm,i,a){
	return i==result.indexOf(itm);
    });
    
    return result;
}

function derivative_of_ast(tree,x,story) {
    var ddx = '\\frac{d}{d' + x + '} ';

    // Derivative of a constant
    if (typeof tree === 'number') {
	story.push( 'The derivative of a constant is zero, that is, \\(' + ddx + astToLatex(tree) + ' = 0\\).' );
	return 0;
    }

    // Derivative of a more complicated constant 
    if ((variables_in_ast(tree)).indexOf(x) < 0) {
	story.push( 'The derivative of a constant is zero, that is, \\(' + ddx + astToLatex(tree) + ' = 0\\).' );
	return 0;
    }	

    // Derivative of a variable
    if (typeof tree === 'string') {
	if (x === tree) {
	    story.push( 'We know the derivative of the identity function is one, that is, \\(' + ddx + astToLatex(tree) + ' = 1\\).' );
	    return 1;
	}
	
	story.push( 'As far as \\(' + astToLatex(x) + '\\) is concerned, \\(' + astToLatex(tree) + '\\) is constant, so ' + ddx + astToLatex(tree) + ' = 0\\).' );
	return 0;
    }
    
    var operator = tree[0];
    var operands = tree.slice(1);

    // derivative of sum is sum of derivatives
    if ((operator === '+') || (operator === '-') || (operator === '~')) {
	story.push( 'Using the sum rule, \\(' + ddx + astToLatex( tree ) + ' = ' + (operands.map( function(v,i) { return ddx + astToLatex(v); } )).join( ' + ' ) + '\\).' );
	var result = [operator].concat( operands.map( function(v,i) { return derivative_of_ast(v,x,story); } ) );
	result = clean_ast(result);
	story.push( 'So using the sum rule, \\(' + ddx + astToLatex( tree ) + ' = ' + astToLatex(result) + '\\).' );
	return result;
    }
    
    // product rule
    if (operator === '*') {
	var non_numeric_operands = [];
	var numeric_operands = [];

	for( var i=0; i<operands.length; i++ ) {
	    if ((typeof operands[i] === 'number') || ((variables_in_ast(operands[i])).indexOf(x) < 0)) {
		any_numbers = true;
		numeric_operands.push( operands[i] );
	    } else {
		non_numeric_operands.push( operands[i] );
	    } 
	}

	if (numeric_operands.length > 0) {
	    if (non_numeric_operands.length == 0) {
		story.push( 'Since the derivative of a constant is zero, \\(' + ddx + astToLatex( tree ) + ' = 0.\\)' );
		var result = 0;
		return result;
	    }

	    var remaining = ['*'].concat( non_numeric_operands );
	    if (non_numeric_operands.length == 1) 
		remaining = non_numeric_operands[0];



	    if (remaining === x) {
		story.push( 'By the constant multiple rule, \\(' + ddx + astToLatex( tree ) + ' = ' + (numeric_operands.map( function(v,i) { return astToLatex(v); } )).join( ' \\cdot ' ) + '\\).' );
		var result = ['*'].concat( numeric_operands );
		result = clean_ast(result);
		return result;
	    }

	    story.push( 'By the constant multiple rule, \\(' + ddx + astToLatex( tree ) + ' = ' + (numeric_operands.map( function(v,i) { return astToLatex(v); } )).join( ' \\cdot ' ) + ' \\cdot ' + ddx + '\\left(' + astToLatex(remaining) + '\\right)\\).' );

	    var d = derivative_of_ast(remaining,x,story);
	    var result = ['*'].concat( numeric_operands.concat( [d] ) );
	    result = clean_ast(result);
	    story.push( 'And so \\(' + ddx + astToLatex( tree ) + ' = ' + astToLatex(result) + '\\).' );
	    return result;
	}

	story.push( 'Using the product rule, \\(' + ddx + astToLatex( tree ) + ' = ' +
		    (operands.map( function(v,i) {
			return (operands.map( function(w,j) {
			    if (i == j)
				return ddx + '\\left(' + astToLatex(v) + '\\right)';
			    else
				return astToLatex(w);
			})).join( ' \\cdot ' ) })).join( ' + ' ) + '\\).' );

	var inner_operands = operands.slice();

	var result = ['+'].concat( operands.map( function(v,i) {
	    return ['*'].concat( inner_operands.map( function(w,j) {
		if (i == j) {
		    var d = derivative_of_ast(w,x,story);
		    // remove terms that have derivative 1
		    if (d === 1)
			return null;

		    return d;
		} else {
		    return w;
		}
	    } ).filter( function(t) { return t != null; } ) );
	} ) );
	result = clean_ast(result);
	story.push( 'So using the product rule, \\(' + ddx + astToLatex( tree ) + ' = ' + astToLatex(result) + '\\).' );

	return result;
    }
    
    // quotient rule
    if (operator === '/') {
	var f = operands[0];
	var g = operands[1];

	if ((variables_in_ast(g)).indexOf(x) < 0) {
	    story.push( 'By the constant multiple rule, \\(' + ddx + astToLatex( tree ) + ' = ' + astToLatex(['/', 1, g]) + ' \\cdot ' + ddx + '\\left(' + astToLatex(f) + '\\right)\\).' );

	    var df = derivative_of_ast(f,x,story);		
	    var quotient_rule = textToAst('(1/g)*d');
	    var result = substitute_ast( quotient_rule, { "d": df, "g": g } );
	    result = clean_ast(result);
	    story.push( 'So \\(' + ddx + astToLatex( tree ) + ' = ' + astToLatex(result) + '\\).' );
	    
	    return result;		
	}

	if ((variables_in_ast(f)).indexOf(x) < 0) {
	    if (f !== 1) {
		story.push( 'By the constant multiple rule, \\(' + ddx + astToLatex( tree ) + ' = ' + astToLatex(f) + ' \\cdot ' + ddx + '\\left(' + astToLatex(['/',1,g]) + '\\right)\\).' );
	    }

	    story.push( 'Since \\(\\frac{d}{du} \\frac{1}{u}\\) is \\(\\frac{-1}{u^2}\\), the chain rule gives \\(' + ddx + astToLatex( tree ) + ' = ' + astToLatex(f) + '\\cdot \\frac{-1}{ ' + astToLatex(g) + '^2' + '} \\cdot ' + ddx + astToLatex( g ) + "\\)." );

	    var a = derivative_of_ast(g,x,story);

	    var quotient_rule = textToAst('f * (-a/(g^2))');
	    var result = substitute_ast( quotient_rule, { "f": f, "a": a, "g": g } );
	    result = clean_ast(result);
	    story.push( 'So since \\(\\frac{d}{du} \\frac{1}{u}\\) is \\(\\frac{-1}{u^2}\\), the chain rule gives \\(' + ddx + astToLatex( tree ) + ' = ' + astToLatex(result) + '\\).' );

	    return result;
	}

	story.push( 'Using the quotient rule, \\(' + ddx + astToLatex( tree ) + ' = \\frac{' + ddx + '\\left(' + astToLatex(f) + '\\right) \\cdot ' + astToLatex(g) + ' - ' + astToLatex(f) + '\\cdot ' + ddx + '\\left(' + astToLatex(g) + '\\right)}{ \\left( ' + astToLatex(g) + ' \\right)^2} \\).' );

	var a = derivative_of_ast(f,x,story);
	var b = derivative_of_ast(g,x,story);
	var f_prime = a;
	var g_prime = b;

	var quotient_rule = textToAst('(a * g - f * b)/(g^2)');

	var result = substitute_ast( quotient_rule, { "a": a, "b": b, "f": f, "g": g } );
	result = clean_ast(result);
	story.push( 'So using the quotient rule, \\(' + ddx + astToLatex( tree ) + ' = ' + astToLatex(result) + '\\).' );

	return result;
    }
    
    // power rule
    if (operator === '^') {
	var base = operands[0];
	var exponent = operands[1];
	
	if ((variables_in_ast(exponent)).indexOf(x) < 0) {
	    if ((typeof base === 'string') && (base === 'x')) {
		if (typeof exponent === 'number') {
		    var power_rule = textToAst('n * (f^m)');
		    var result = substitute_ast( power_rule, { "n": exponent, "m": exponent - 1, "f": base } );
		    result = clean_ast(result);
		    story.push( 'By the power rule, \\(' + ddx + astToLatex( tree ) + ' = ' + astToLatex( exponent ) + ' \\cdot \\left(' + astToLatex( base ) + '\\right)^{' + astToLatex( ['-', exponent, 1] ) + '}\\).' );
		    return result;
		}

		var power_rule = textToAst('n * (f^(n-1))');
		var result = substitute_ast( power_rule, { "n": exponent, "f": base } );
		result = clean_ast(result);
		story.push( 'By the power rule, \\(' + ddx + astToLatex( tree ) + ' = ' + astToLatex( exponent ) + ' \\cdot \\left(' + astToLatex( base ) + '\\right)^{' + astToLatex( ['-', exponent, 1] ) + '}\\).' );

		return result;
	    }

	    if (exponent != 1) {
		story.push( 'By the power rule and the chain rule, \\(' + ddx + astToLatex( tree ) + ' = ' + astToLatex( exponent ) + ' \\cdot \\left(' + astToLatex( base ) + '\\right)^{' + astToLatex( ['-', exponent, 1] ) + '} \\cdot ' + ddx + astToLatex( base ) + '\\).' );
	    }

	    var a = derivative_of_ast(base,x,story);

	    if (exponent === 1)
		return a;

	    if (typeof exponent === 'number') {
		var power_rule = textToAst('n * (f^m) * a');
		var result = substitute_ast( power_rule, { "n": exponent, "m": exponent - 1, "f": base, "a" : a } );
		result = clean_ast(result);
		story.push( 'So by the power rule and the chain rule, \\(' + ddx + astToLatex( tree ) + ' = ' + astToLatex(result) + '\\).' );
		return result;
	    }

	    var power_rule = textToAst('n * (f^(n-1)) * a');
	    var result = substitute_ast( power_rule, { "n": exponent, "f": base, "a" : a } );
	    result = clean_ast(result);
	    story.push( 'So by the power rule and the chain rule, \\(' + ddx + astToLatex( tree ) + ' = ' + astToLatex(result) + '\\).' );
	    return result;
	}
	
	if (base === 'e') {
	    if ((typeof exponent === 'string') && (exponent === x)) {
		var power_rule = textToAst('e^(f)');
		var result = substitute_ast( power_rule, { "f": exponent } );
		result = clean_ast(result);
		story.push( 'The derivative of \\(e^' + astToLatex( x ) + '\\) is itself, that is, \\(' + ddx + astToLatex( tree ) + ' = ' + astToLatex( tree ) + '\\).' );

		return result;
	    }
	    
	    story.push( 'Using the rule for \\(e^x\\) and the chain rule, we know \\(' + ddx + astToLatex( tree ) + ' = ' + astToLatex( tree ) + ' \\cdot ' + ddx + astToLatex( exponent ) + '\\).' );

	    var power_rule = textToAst('e^(f)*d');

	    var d = derivative_of_ast(exponent,x,story);
	    var result = substitute_ast( power_rule, { "f": exponent, "d": d } );
	    result = clean_ast(result);
	    story.push( 'So using the rule for \\(e^x\\) and the chain rule, \\(' + ddx + astToLatex( tree ) + ' = ' + astToLatex(result) + '\\).' );
	    return result;
	}
	
	if (typeof base === 'number') {
	    if ((typeof exponent === 'string') && (exponent === x)) {
		var power_rule = textToAst('a^(f) * log(a)');
		var result = substitute_ast( power_rule, { "a": base, "f": exponent } );
		result = clean_ast(result);
		story.push( 'The derivative of \\(a^' + astToLatex( x ) + '\\) is \\(a^{' + astToLatex( x ) + '} \\, \\log a\\), that is, \\(' + ddx + astToLatex( tree ) + ' = ' + astToLatex( result ) + '\\).' );

		return result;
	    }

	    var exp_rule = textToAst('a^(f) * log(a)');
	    var partial_result = substitute_ast( exp_rule, { "a": base, "f": exponent } );

	    story.push( 'Using the rule for \\(a^x\\) and the chain rule, we know \\(' + ddx + astToLatex( tree ) + ' = ' + astToLatex( partial_result ) + ' \\cdot ' + ddx + astToLatex( exponent ) + '\\).' );

	    var power_rule = textToAst('a^(b)*log(a)*d');
	    var d = derivative_of_ast(exponent,x,story);
	    var result = substitute_ast( power_rule, { "a": base, "b": exponent, "d": d } );
	    result = clean_ast(result);
	    story.push( 'So using the rule for \\(a^x\\) and the chain rule, \\(' + ddx + astToLatex( tree ) + ' = ' + astToLatex(result) + '\\).' );
	    return result;		
	}
	
	// general case of a function raised to a function
	var f = base;
	var g = exponent;

	story.push( "Recall the general rule for exponents, namely that \\(\\frac{d}{dx} u(x)^{v(x)} = u(x)^{v(x)} \\cdot \\left( v'(x) \\cdot \\log u(x) + \\frac{v(x) \\cdot u'(x)}{u(x)} \\right)\\).  In this case, \\(u(x) = " +  astToLatex( f ) + "\\) and \\(v(x) = " + astToLatex( g ) + "\\)." );

	var a = derivative_of_ast(f,x,story);
	var b = derivative_of_ast(g,x,story);

	var power_rule = textToAst('(f^g)*(b * log(f) + (g * a)/f)');
	var result = substitute_ast( power_rule, { "a": a, "b": b, "f": f, "g": g } );
	result = clean_ast(result);
	story.push( 'So by the general rule for exponents, \\(' + ddx + astToLatex( tree ) + ' = ' + astToLatex(result) + '\\).' );
	return result;
    }

    if (operator === "apply") {
	var input = operands[1];

	story.push( 'By the chain rule, \\(' + ddx + astToLatex( tree ) + ' = ' + astToLatex(substitute_ast( ["apply",operands[0] + "'","x"], { "x": input } )) + " \\cdot " + ddx + astToLatex(input)  + '\\).' );	    

	var result = ['*',
		      substitute_ast( ["apply",operands[0] + "'","x"], { "x": input } ),
		      derivative_of_ast( input, x, story )];
	result = clean_ast(result);		
	story.push( 'So by the chain rule, \\(' + ddx + astToLatex( tree ) + ' = ' + astToLatex(result) + '\\).' );
	return result;	    
    }

    // chain rule
    if (operator in derivatives) {
	var input = operands[0];

	if (typeof input == "number") {
	    var result = 0;
	    story.push( 'The derivative of a constant is zero so \\(' + ddx + astToLatex( tree ) + ' = ' + astToLatex(result) + '\\).' );
	    return result;		
	} else if ((typeof input == "string") && (input == x)) {
	    var result = ['*',
			  substitute_ast( derivatives[operator], { "x": input } )];
	    result = clean_ast(result);
	    story.push( 'It is the case that \\(' + ddx + astToLatex( tree ) + ' = ' + astToLatex(result) + '\\).' );
	    return result;
	} else if ((typeof input == "string") && (input != x)) {
	    var result = 0;
	    story.push( 'Since the derivative of a constant is zero, \\(' + ddx + astToLatex( tree ) + ' = ' + astToLatex(result) + '\\).' );
	    return result;
	} else {
	    story.push( 'Recall \\(\\frac{d}{du}' + astToLatex( [operator, 'u'] ) + ' = ' +
			astToLatex( derivative_of_ast( [operator, 'u'], 'u', [] ) ) + '\\).' );

	    story.push( 'By the chain rule, \\(' + ddx + astToLatex( tree ) + ' = ' + astToLatex(substitute_ast( derivatives[operator], { "x": input } )) + " \\cdot " + ddx + astToLatex(input)  + '\\).' );	    

	    var result = ['*',
			  substitute_ast( derivatives[operator], { "x": input } ),
			  derivative_of_ast( input, x, story )];
	    result = clean_ast(result);		
	    story.push( 'So by the chain rule, \\(' + ddx + astToLatex( tree ) + ' = ' + astToLatex(result) + '\\).' );
	    return result;
	}
    }
    
    return 0;
};

/****************************************************************/
//
// The "story" that the differentiation code produces can be somewhat repetitive
//
// Here we fix this
//

function lowercaseFirstLetter(string)
{
    return string.charAt(0).toLowerCase() + string.slice(1);
}

function simplify_story( story ) {
    // remove neighboring duplicates
    for (var i = story.length - 1; i >= 1; i--) {
	if (story[i] == story[i-1])
	    story.splice( i, 1 );
    }

    // Make it seem obvious that I know I am repeating myself
    for (var i = 0; i < story.length; i++ ) {
	for( var j = i + 1; j < story.length; j++ ) {
	    if (story[i] == story[j]) {
		story[j] = 'Again, ' + lowercaseFirstLetter( story[j] );
	    }
	}
    }

    return story;
};

exports.derivative = function(x) {
    var story = [];
    return Expression.fromAst(derivative_of_ast( this.tree, x, story ));
};

exports.derivative_story = function(x) {
    var story = [];
    derivative_of_ast( this.tree, x, story );
    story = simplify_story( story );
    return story;
};

exports.derivativeStory = exports.derivative_story;
