exports.equalUpToSign = function(correct) {
    var expression = this;
    var root = expression.tree;
    var stack = [[root]];
    var pointer = 0;
    var tree;
    var i;

    /* Unfortunately the root is handled separately */
    expression.tree = ['~', root];
    var equals = expression.equals(correct);
    expression.tree = root;

    if (equals) return true;

    while (tree = stack[pointer++]) {
	tree = tree[0];
	
	if (typeof tree === 'number') {
	    continue;
	}    

	if (typeof tree === 'string') {
	    continue;
	}

	for (i = 1; i < tree.length; i++) {
            stack.push([tree[i]]);
	    tree[i] = ['~', tree[i]];
	    equals = expression.equals(correct);
	    tree[i] = tree[i][1];

	    if (equals) return true;
	}
    }

    return false;
}    
