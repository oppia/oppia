/*
 * test code for complex numbers
 *
 * Copyright 2014-2015 by Jim Fowler <kisonecat@gmail.com>
 *
 * This file is part of a math-expressions library
 * 
 * Some open source application is free software: you can redistribute
 * it and/or modify it under the terms of the GNU General Public
 * License as published by the Free Software Foundation, either
 * version 3 of the License, or at your option any later version.
 * 
 * Some open source application is distributed in the hope that it
 * will be useful, but WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 * 
 */

var C = require('../lib/complex-number').ComplexNumber;

describe("complex number", function() {
    beforeEach(function () {
        jasmine.addMatchers({
            toBeWithinEpsilon: function () {
                return {
                    compare: function (actual, expected) {
                        return {
                            pass: actual.subtract(expected).modulus() < 0.0001
                        };
                    }
                };
            },
	    toBeWithinRealEpsilon: function () {
                return {
                    compare: function (actual, expected) {
                        return {
                            pass: (actual - expected) < 0.0001
                        };
                    }
                };
            }
        });
    });
	
    it("finds real part", function() {     
        expect((new C(16,23)).real_part()).toEqual(16);
    });

    it("finds the imaginary part", function() {     
        expect((new C(16,23)).imaginary_part()).toEqual(23);
    });    
    
    it("adds", function() {
        expect((new C(1,2)).add( (new C(3,5)) )).toBeWithinEpsilon( new C(4,7) );
    });

    it("adds without constructor", function() {
        expect((new C(1,2)).add(3,5)).toBeWithinEpsilon( new C(4,7) );
    });

    it("subtracts", function() {
        expect((new C(1,2)).subtract( (new C(3,5)) )).toBeWithinEpsilon( new C(-2,-3) );
    });    

    it("multiplies", function() {
	expect((new C(1,2)).multiply( (new C(3,5)) )).toBeWithinEpsilon( new C(-7,11) );
    });    

    it("divides", function() {
	expect((new C(1,2)).divide( (new C(3,5)) ))
	    .toBeWithinEpsilon( new C(0.382352941176471,0.0294117647058824) );
    });

    it("((3+4i)/(1+2i))*(2+4i) = 6+8i", function() {
	expect((new C(3,4)).divide(new C(1,2)).multiply(new C(2,4))).toBeWithinEpsilon( new C(6,8) );
    });    

    it("computes modulus", function() {
	expect((new C(3,4)).modulus()).toEqual(5);
    });

    it("computes arguments", function() {
	expect((new C(3,4)).argument()).toBeWithinRealEpsilon(4.06888787159141);
    });       

    it("negates", function() {
	expect((new C(1,2)).negate()).toBeWithinEpsilon( new C(-1,-2) );
    });    

    it("conjugates", function() {
	expect((new C(1,2)).conjugate()).toBeWithinEpsilon( new C(1,-2) );
    });

    it("exp", function() {
	expect((new C(1,2)).exp()).toBeWithinEpsilon( new C(-1.13120438375681,2.47172667200482) );
    });

    it("log", function() {
	expect((new C(1,2)).log()).toBeWithinEpsilon( new C(0.804718956217050,1.10714871779409) );
    });

    it("cosine", function() {
	expect((new C(1,2)).cos()).toBeWithinEpsilon( new C(2.03272300701967,-3.0518977991518) );
    });

    it("power", function() {
	expect((new C(1,2)).power( new C(3,4) )).toBeWithinEpsilon( new C(0.129009594074467,0.0339240929051701) );
    });

    it("(-1)^2 == 1", function() {
	expect((new C(-1,0)).power( new C(2,0) )).toBeWithinEpsilon( new C(1,0) );
    });

    it("(-1)^i == exp(-pi)", function() {
	expect((new C(-1,0)).power( new C(0,1) )).toBeWithinEpsilon( new C(0.0432139182637723,0) );
    });

    it("i^2 == -1", function() {
	expect((new C(0,1)).power( new C(2,0) )).toBeWithinEpsilon( new C(-1,0) );
    });    

    it("square roots", function() {
	expect((new C(1,2)).sqrt()).toBeWithinEpsilon( new C(1.27201964951407,0.786151377757423) );
    });

    it("reciprocals", function() {
	expect((new C(1,2)).reciprocal()).toBeWithinEpsilon( new C(0.2,-0.4) );
    });

    it("tangent", function() {
	expect((new C(1,2)).tan()).toBeWithinEpsilon( new C(0.0338128260798967, 1.01479361614663) );
    });

    it("secant", function() {
	expect((new C(1,2)).sec()).toBeWithinEpsilon( new C(0.151176298265577, 0.226973675393722) );
    });

    it("cosecant", function() {
	expect((new C(1,2)).csc()).toBeWithinEpsilon( new C(0.228375065599687, -0.141363021612408) );
    });

    it("cotangent", function() {
	expect((new C(1,2)).cot()).toBeWithinEpsilon( new C(0.0327977555337526, -0.984329226458191) );
    });                                    

    it("arcsin", function() {
	expect((new C(1,2)).arcsin()).toBeWithinEpsilon( new C(0.427078586392476, 1.52857091948100) );
    });

    it("arccos", function() {
	expect((new C(1,2)).arccos()).toBeWithinEpsilon( new C(1.14371774040242, -1.52857091948100) );
    });

    it("arctan", function() {
	expect((new C(1,2)).arctan()).toBeWithinEpsilon( new C(1.33897252229449, 0.402359478108525) );
    });

    it("sin(arcsin(1+2i)) = 1+2i", function() {
	expect((new C(1,2)).arcsin().sin()).toBeWithinEpsilon( new C(1,2) );
    });

    it("arcsin(sin(1+2i)) = 1+2i", function() {
	expect((new C(1,2)).sin().arcsin()).toBeWithinEpsilon( new C(1,2) );
    });    

    it("cos(arccos(1+2i)) = 1+2i", function() {
	expect((new C(1,2)).arccos().cos()).toBeWithinEpsilon( new C(1,2) );
    });

    it("arccos(cos(1+2i)) = 1+2i", function() {
	expect((new C(1,2)).cos().arccos()).toBeWithinEpsilon( new C(1,2) );
    });

    it("tan(arctan(1+2i)) = 1+2i", function() {
	expect((new C(1,2)).arctan().tan()).toBeWithinEpsilon( new C(1,2) );
    });

    it("arctan(tan(1+2i)) = 1+2i", function() {
	expect((new C(1,2)).tan().arctan()).toBeWithinEpsilon( new C(1,2) );
    });        

    it("exp(log(1+2i)) = 1+2i", function() {
	expect((new C(1,2)).log().exp()).toBeWithinEpsilon( new C(1,2) );
    });

    it("log(exp(1+2i)) = 1+2i", function() {
	expect((new C(1,2)).exp().log()).toBeWithinEpsilon( new C(1,2) );
    });

    it("gamma(3) = 2", function() {
	expect((new C(3,0)).gamma()).toBeWithinEpsilon( new C(2,0) );
    });

    it("gamma(4) = 6", function() {
	expect((new C(4,0)).gamma()).toBeWithinEpsilon( new C(6,0) );
    });

    it("sin(gamma(0.5) * gamma(0.5)) = 0", function() {
	expect((new C(0.5,0)).gamma().multiply( (new C(0.5,0)).gamma() ).sin()).toBeWithinEpsilon( new C(0,0) );
    });

    it("cos(gamma(2.5) * gamma(3.5) * (32/90)) = 0", function() {
	expect((new C(2.5,0)).gamma().multiply( (new C(3.5,0)).gamma()).multiply( (new C(32.0/90.0,0)) ).cos()).toBeWithinEpsilon( new C(0,0) );
    });                            
    
    it("gamma(-0.5) approx -3.54490770181103", function() {
	expect((new C(-0.5,0)).gamma()).toBeWithinEpsilon( new C(-3.544907701811030,0) );
    });

    it("gamma(i) approx -0.154949828301811 - 0.498015668118356i", function() {
	expect((new C(0,1)).gamma()).toBeWithinEpsilon( new C(-0.154949828301811, -0.498015668118356) );
    });                        
});
