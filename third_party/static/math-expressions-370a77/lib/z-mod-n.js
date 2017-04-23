var numberTheory = require('number-theory');

var PRIME = 10739999; // a very safe prime

function flatten(array) {
    return array.reduce(function(a, b) {
	return a.concat(b);
    }, []);
}

var ZmodN = (function() {
    function ZmodN(values, modulus) {
        this.values = values;
	this.modulus = modulus;
    }

    ZmodN.prototype.apply = function(other, callback, modulus) {
	if (modulus == undefined)
	    modulus = numberTheory.gcd( this.modulus, other.modulus );
	    
	return new ZmodN(
	    flatten( this.values.map( function(x) { return other.values.map( function(y) {
		return (modulus + callback( x, y )) % modulus;
	    } ) } ) ),
	    modulus );
    };
    
    ZmodN.prototype.add = function(other) {
	return this.apply( other, function(x,y) { return x+y; } );
    };

    ZmodN.prototype.power = function(other) {
	var modulus = this.modulus;
	
	if (other.modulus != numberTheory.eulerPhi(modulus))
	    return new ZmodN( [NaN], NaN );
	else
	    return this.apply( other, function(x,y) { return numberTheory.powerMod( x, y, modulus ); },
			       modulus );
    };        
    
    ZmodN.prototype.subtract = function(other) {
	return this.apply( other, function(x,y) { return x-y; } );	    
    };

    ZmodN.prototype.multiply = function(other) {
	var modulus = numberTheory.gcd( this.modulus, other.modulus );
	return this.apply( other, function(x,y) { return numberTheory.multiplyMod( x, y, modulus ); } );
    };

    ZmodN.prototype.inverse = function() {
	var modulus = this.modulus;
	return new ZmodN(
	    this.values.map( function(x) { return numberTheory.inverseMod( x, modulus ); } ),
	    this.modulus );
    };

    ZmodN.prototype.negate = function() {
	var modulus = this.modulus;
	return new ZmodN(
	    this.values.map( function(x) { return modulus - x; } ),
	    this.modulus );
    };    
    
    ZmodN.prototype.divide = function(other) {
	var m = numberTheory.gcd( this.modulus, other.modulus );

	var values = flatten( flatten( this.values.map( function(b) { return other.values.map( function(a) {
	    // This is totally wrong, but it is what we want for the signatures to handle terms like pi/2
	    if (b % a == 0)
		return [b/a];
	    
	    var d = numberTheory.gcd( a, m );
			       
	    if (b % d != 0) return [];
			       
	    var ad = a / d;
	    var bd = b / d;
			       
	    var x0 = numberTheory.multiplyMod( bd, numberTheory.inverseMod( ad, m ), m );

	    var results = [];
			       
	    var i;
	    for( i=0; i<d; i++ ) {
		results.unshift( x0 + numberTheory.multiplyMod(i, m/d, m) );
	    }
	    
	    return results;
	} ) } ) ) );

	return new ZmodN( values, m );
    };

    ZmodN.prototype.sqrt = function() {
	var modulus = this.modulus;
	return new ZmodN(
	    flatten( this.values.map( function(x) { return numberTheory.squareRootMod( x, modulus ); } ) ),
	    this.modulus );
    };

    ZmodN.prototype.toString = function() {
	return '{' + this.values.toString() + '}/' + this.modulus.toString();
    };
    
    return ZmodN;
})();

/*
var one = new ZmodN( [1], 17 );
console.log( one.toString() );
var two = one.add( one );
console.log( two.toString() );
var three = two.add( one );
console.log( three.toString() );
console.log( numberTheory.multiplyMod( 3, 3, 17 ) );
console.log( (two.add(two)).sqrt().sqrt().toString() );
*/

module.exports = ZmodN;

/*
var x = new ZmodN( [40], 68 );
var y = new ZmodN( [20], 68 );
console.log( (x.divide(y)).toString() );

console.log( (x.divide(y).multiply(y)).toString() );
*/
