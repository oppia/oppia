module.exports = function(name) {
    return function(message) {
	console.log( name + ": ", message );
    };
};
