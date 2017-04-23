exports.equalsViaComplex = require('./equality/complex.js').equals;
exports.equalsViaSyntax = require('./equality/syntax.js').equals;

exports.equals = function(other) {
    if (this.equalsViaSyntax(other)) {
	return true;
    } else if (this.equalsViaComplex(other)) {
	return true;
    } else {
	return false;
    }
};
