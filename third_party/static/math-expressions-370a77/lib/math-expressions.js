var parser = require('./parser');

function Expression (ast) {
    this.tree = ast;
    this.simplify();
}

function extend(object) {
    // arguments object is NOT an array
    var args = Array.prototype.slice.call(arguments, 1);
    
    args.forEach( 
	function(rhs) {
            if (rhs) {
		for (var property in rhs) {
                    object[property] = rhs[property];
		}
            }
	});
    
    return object;
}

/* Load methods from various modules */
extend( Expression.prototype,
	require('./expression/printing.js' ),
	require('./expression/differentiation.js' ),
	require('./expression/integration.js' ),
	require('./expression/variables.js' ),
	require('./expression/equality.js' ),
	require('./expression/sign-error.js' ),
	require('./expression/evaluation.js' ),
	require('./expression/simplify.js' )
      );

/****************************************************************/
/* Factory methods */

function parseText(string) {
    return new Expression( parser.text.to.ast(string) );
};

function parseLatex(string) {
    return new Expression( parser.latex.to.ast(string) );
};

function parseMml(string) {
    return new Expression( parser.mml.to.ast(string) );
};

exports.fromText = parseText;
exports.parse = parseText;
exports.fromLaTeX = parseLatex;
exports.fromLatex = parseLatex;
exports.fromTeX = parseLatex;
exports.fromTex = parseLatex;
exports.fromMml = parseMml;
exports.parse_tex = parseLatex;

exports.fromAst = function(ast) {
    return new Expression( ast );
};
