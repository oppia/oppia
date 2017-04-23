exports.integrateNumerically = function(x,a,b) {
    var intervals = 100;
    var total = 0.0;
    var bindings = new Object();
    
    for( var i=0; i < intervals; i++ ) {
	var sample_point = a + ((b - a) * (i + 0.5) / intervals);
	bindings[x] = sample_point;
	total = total + this.evaluate( bindings );
    }
    
    return total * (b - a) / intervals;
};
