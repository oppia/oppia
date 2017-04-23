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

exports.variables = function() {
    return variables_in_ast( this.tree );
};

