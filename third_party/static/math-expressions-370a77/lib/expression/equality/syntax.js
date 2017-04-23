var _ = require('underscore');

// MIT license'd code
// credit: http://stackoverflow.com/questions/9960908/permutations-in-javascript
function anyPermutation(permutation, callback) {
    var length = permutation.length,
	c = Array(length).fill(0),
	i = 1;
    
    if (callback(permutation))
	return true;
    
    while (i < length) {
	if (c[i] < i) {
	    var k = (i % 2) ? c[i] : 0,
		p = permutation[i];
	    permutation[i] = permutation[k];
	    permutation[k] = p;
	    ++c[i];
	    i = 1;
	    if (callback(permutation))
		return true;
	} else {
	    c[i] = 0;
	    ++i;
	}
    }

    return false;
}

function compareTree(left, right) {
    if ((typeof left === 'number') || (typeof right === 'number')) {
	if ((typeof right !== 'number') || (typeof right !== 'number')) {	
	    return false;
	}

	return (left === right);
    }    

    if ((typeof left === 'string') || (typeof right === 'string')) {
	if ((typeof right !== 'string') || (typeof right !== 'string')) {
	    return false;
	}

	return (left === right);
    }    
    
    var leftOperator = left[0];
    var leftOperands = left.slice(1);

    var rightOperator = right[0];
    var rightOperands = right.slice(1);    

    if (leftOperator != rightOperator)
	return false;
    var operator = leftOperator;

    if (leftOperands.length != rightOperands.length)
	return false;

    // We do permit permutations
    if ((operator === '+') || (operator === '*')) {
	return anyPermutation( leftOperands, function(permutedOperands) {
	    return (_.every( _.zip( permutedOperands, rightOperands ),
			     function(pair) {
				 return compareTree( pair[0], pair[1] );
			     }));
	});
    }
    
    return (_.every( _.zip( leftOperands, rightOperands ),
		     function(pair) {
			 return compareTree( pair[0], pair[1] );
		     }));
}

    

exports.equals = function (other) {
    return compareTree( this.tree, other.tree );
};
