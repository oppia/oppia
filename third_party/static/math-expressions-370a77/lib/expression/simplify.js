/****************************************************************/
// replace variables in an AST by another AST
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

function tree_match( haystack, needle ) {
    var match = {};

    if (typeof needle === 'string') {
	match[needle] = haystack;
	return match;
    }

    if (typeof haystack === 'number') {
	if (typeof needle === 'number') {
	    if (needle === haystack) {
		return {};
	    }
	}

	return null;
    }

    if (typeof haystack === 'string') {
	if (typeof needle === 'string') {
	    match[needle] = haystack;
	    return match;
	}

	return null;
    }

    var haystack_operator = haystack[0];
    var haystack_operands = haystack.slice(1);

    var needle_operator = needle[0];
    var needle_operands = needle.slice(1);

    if (haystack_operator === needle_operator) {
	if (haystack_operands.length >= needle_operands.length) {
	    var matches = {}

	    needle_operands.forEach( function(i) {
		var new_matches = tree_match( haystack_operands[i], needle_operands[i] );
		
		if (new_matches === null) {
		    matches = null;
		}

		if (matches != null) {
		    matches = $.extend( matches, new_matches );
		}
	    } );

	    if (matches != null) {
		matches = $.extend( matches, { remainder: haystack_operands.slice( needle_operands.length ) } );
	    }

	    return matches;
	}

	return null;
    }

    return null;
};

function subtree_matches(haystack, needle) {
    if (typeof haystack === 'number') {
	return (typeof needle === 'string');
    }    
    
    if (typeof haystack === 'string') {
	return (typeof needle === 'string');
    }    

    var match = tree_match( haystack, needle );
    if (match != null) {
	return true;
    }

    var operator = haystack[0];
    var operands = haystack.slice(1);

    var any_matches = false;

    $.each( operands, function(i) {
	if (subtree_matches(operands[i], needle))
	    any_matches = true;
    } );

    return any_matches;
};

function replace_subtree(haystack, needle, replacement) {
    if (typeof haystack === 'number') {
	return haystack;
    }    
    
    if (typeof haystack === 'string') {
	if (typeof needle === 'string')
	    if (needle === haystack)
		return replacement;
	
	return haystack;
    }    

    var match = tree_match( haystack, needle );
    if (match != null) {
	return substitute_ast( replacement, match ).concat( match.remainder );
    }

    var operator = haystack[0];
    var operands = haystack.slice(1);

    return [operator].concat( operands.map( function(v,i) { return replace_subtree(v, needle, replacement); } ) );
};

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

function remove_identity( tree, op, identity ) {
    if (typeof tree === 'number') {
	return tree;
    }    
    
    if (typeof tree === 'string') {
	return tree;
    }    

    var operator = tree[0];
    var operands = tree.slice(1);
    operands = operands.map( function(v,i) { return remove_identity(v, op, identity); } );

    if (operator == op) {
	operands = operands.filter( function (a) { return a != identity; });
	if (operands.length == 0)
	    operands = [identity];

	if (operands.length == 1)
	    return operands[0];
    }

    return [operator].concat( operands );
}

function remove_zeroes( tree ) {
    if (typeof tree === 'number') {
	return tree;
    }    
    
    if (typeof tree === 'string') {
	return tree;
    }    

    var operator = tree[0];
    var operands = tree.slice(1);
    operands = operands.map( function(v,i) { return remove_zeroes(v); } );

    if (operator === "*") {
	for( var i=0; i<operands.length; i++ ) {
	    if (operands[i] === 0)
		return 0;
	}
    }

    return [operator].concat( operands );
}

function collapse_unary_minus( tree ) {
    if (typeof tree === 'number') {
	return tree;
    }    
    
    if (typeof tree === 'string') {
	return tree;
    }    

    var operator = tree[0];
    var operands = tree.slice(1);
    operands = operands.map( function(v,i) { return collapse_unary_minus(v); } );

    if (operator == "~") {
	if (typeof operands[0] === 'number')
	    return -operands[0];
    }

    return [operator].concat( operands );
}

exports.simplify = function() {
    this.tree = associate_ast( this.tree, '+' );
    this.tree = associate_ast( this.tree, '-' );
    this.tree = associate_ast( this.tree, '*' );
    this.tree = remove_identity( this.tree, '*', 1 );
    this.tree = collapse_unary_minus( this.tree );
    this.tree = remove_zeroes( this.tree );
    this.tree = remove_identity( this.tree, '+', 0 );
};
