/*
 * test code for math expressions
 *
 * Copyright 2014-2015 by Jim Fowler <kisonecat@gmail.com>
 * 
 * Some portions adopted from Stack (http://stack.bham.ac.uk/)
 * which is licensed under GPL v3+
 * and (C) 2012 University of Birmingham
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

var Expression = require('../lib/math-expressions');
var _ = require('underscore');

describe("expression", function() {

    var equivalences = {
	"3+2": "5",
	"(1/3)g^3": "(g^3)/(3)",
	"x*log(3)": "log(3^x)",
	"e^(e^x+x/x)": "e^(e^x+1)",
	"exp(exp(exp(x)))": "exp(exp(exp(x)))",
	"(x^5 + 5*x^4 + 20*x^3 + 60*x^2 + 120*x + 120)/120": "1/120*x^5 + 1/24*x^4 + 1/6*x^3 + 1/2*x^2 + x + 1",
	"(x^9 - 72*x^7 + 3024*x^5 - 60480*x^3 + 362880*x)/362880": "1/362880*x^9 - 1/5040*x^7 + 1/120*x^5 - 1/6*x^3 + x",
	"e^(e^x)": "e^(e^x)",
	"1 + x + x^2/2+ x^3/3! + x^4/4!+ x^5/5! + x^6/6!+x^7/7!": "1 + x + x^2/2+ x^3/6 + x^4/24 + x^5/120 + x^6/720 +x^7/5040",
	"1/sqrt(4)": "1/2",
	"4^(-1/2)": "1/2",
	"0.5": "1/2", // 'Mix of floats and rational numbers'
	"x^(1/2)": "sqrt(x)",
	"abs(x)": "sqrt(x^2)",
	"1/sqrt(x)": "sqrt(1/x)",
	"x-1": "(x^2-1)/(x+1)",
	"a^b * a^c": "a^(b+c)",
	'2+2*sqrt(3+x)': '2+sqrt(12+4*x)',
        '1/n-1/(n+1)': '1/(n*(n+1))',
        '0.5*x^2+3*x-1': 'x^2/2+3*x-1',
        'cos(x)': 'cos(-x)',
        'cos(x)^2+sin(x)^2': '1',
        '2*cos(x)^2-1': 'cos(2*x)',
        '2*cos(2*x)+x+1': '-sin(x)^2+3*cos(x)^2+x',
        '(2*sec(2*t)^2-2)/2': '-(sin(4*t)^2-2*sin(4*t)+cos(4*t)^2-1)*(sin(4*t)^2+2*sin(4*t)+cos(4*t)^2-1)/(sin(4*t)^2+cos(4*t)^2+2*cos(4*t)+1)^2',
        '1+cosec(3*x)': '1+csc(3*x)',
        '-4*sec(4*z)^2*sin(6*z)-6*tan(4*z)*cos(6*z)': '-4*sec(4*z)^2*sin(6*z)-6*tan(4*z)*cos(6*z)',
	'log(a^2*b)': '2*log(a)+log(b)',
	'sqrt(12)': '2*sqrt(3)',
        'sqrt(11+6*sqrt(2))': '3+sqrt(2)',
        '(19601-13860*sqrt(2))^(7/4)': '(5*sqrt(2)-7)^7',
        'sqrt(2*log(26)+4-2*log(2))': 'sqrt(2*log(13)+4)',
        '1+2*x': 'x*2+1',
        '(x+y)+z': 'z+x+y',
        '(x+5)*x': 'x*(5+x)',
        'x*x': 'x^2',
        '(1-x)^2': '(x-1)^2',
        'x*(x+5)': '5*x+x^2',
        '1+x+x': '2*x+1',
        '2^2': '4',
        'a^2/b^3': 'a^2*b^(-3)',
        'x^(1/2)': 'sqrt(x)',
        'x-1': '(x^2-1)/(x+1)',
        'x+x': '2*x',
        'x+x^2': 'x^2+x',
        '(x-1)^2': 'x^2-2*x+1',
        '(x-1)^(-2)': '1/(x^2-2*x+1)',
        '1/n-1/(n+1)': '1/(n*(n+1))',
        'cos(x)': 'cos(-x)',
        'cos(x)^2+sin(x)^2': '1',
        '2*cos(x)^2-1': 'cos(2*x)',
	'(1/2)/(3/4)': '2/3',
        '1/n': '1/n',
        'a+1/2': '(2*a+1)/2',
        '1/n +2/(n+1)': '(3*n+1)/(n*(n+1))',
        '2*(1/n)': '2/n',
        '2/n': '2/n',
        '(x-1)/(x^2-1)': '1/(x+1)',
        '(x-2)/4/(2/x^2)': '(x-2)*x^2/8',
        '1/(1-1/x)': 'x/(x-1)',
        '(sqrt(108)+10)^(1/3)-(sqrt(108)-10)^(1/3)': '2',
	'(sqrt(2+sqrt(2))+sqrt(2-sqrt(2)))/(2*sqrt(2))': 'sqrt(sqrt(2)+2)/2',
	'x^2+1': 'x^2+1',
	'(-1)^n*cos(x)^n': '(-cos(x))^n',
	'log(abs((x^2-9)))': 'log(abs(x-3))+log(abs(x+3))',
	'log(exp(x))': 'x',
	'exp(log(x))': 'x',
        '(x-1)^2': 'x^2-2*x+1',
        '(x-1)*(x^2+x+1)': 'x^3-1',
        '(x-1)^(-2)': '1/(x^2-2*x+1)',
        '2/4': '1/2',
        '3^2': '8',
        '3^2': '9',
        'sqrt(3)': '3^(1/2)',
        '2*sqrt(2)': 'sqrt(8)',
        '2*2^(1/2)': 'sqrt(8)',
        '4^(1/2)': '2',
        'sqrt(3)/3': '(1/3)^(1/2)',
        'sqrt(2)/4': '1/sqrt(8)',
        '1/3^(1/2)': '(1/3)^(1/2)',
        '1/sqrt(2)': '2^(1/2)/2',
        'a^2/b^3': 'a^2*b^(-3)',
        '-1+2': '2-1',
        '-1*2+3*4': '3*4-1*2',
        '-1*2+3*4': '3*4-1*2',
        '(-1*2)+3*4': '10',
        'x*(-y)': '-x*y',
        'x*(-y)': '-(x*y)',
        '(-x)*(-x)': 'x*x',
        '(-x)*(-x)': 'x^2',
        '1/2': '3/6',
        '1/(1+2*x)': '1/(2*x+1)',
        '2/(4+2*x)': '1/(x+2)',
        '(a*b)/c': 'a*(b/c)',
        '(-x)/y': '-(x/y)',
        'x/(-y)': '-(x/y)',
        '-1/(1-x)': '1/(x-1)',
        '1/2*1/x': '1/(2*x)',
        '2': '2',
        '1/3': '1/3',
        '3*x^2': '3*x^2',
        '4*x^2': '4*x^2',
        '2*(x-1)': '2*x-2',
        '2*x-2': '2*x-2',
        '2*(x+1)': '2*x+2',	
        '2*(x+0.5)': '2*x+1',
        't*(2*x+1)': 't*(2*x+1)',
        't*x+t': 't*(x+1)',
        '2*x*(x-3)': '2*x^2-6*x',
        '2*(x^2-3*x)': '2*x*(x-3)',
        'x*(2*x-6)': '2*x*(x-3)',
        '(x+2)*(x+3)': '(x+2)*(x+3)',
        '(x+2)*(2*x+6)': '2*(x+2)*(x+3)',
        '(z*x+z)*(2*x+6)': '2*z*(x+1)*(x+3)',
        '(x+t)*(x-t)': 'x^2-t^2',
        't^2-1': '(t-1)*(t+1)',
        '(2-x)*(3-x)': '(x-2)*(x-3)',
        '(1-x)^2': '(x-1)^2',
        '-(1-x)^2': '-(x-1)^2',
        '4*(1-x/2)^2': '(x-2)^2',
        '(x-1)*(x^2+x+1)': 'x^3-1',
        'x^3-x+1': 'x^3-x+1',
        '7*x^3-7*x+7': '7*(x^3-x+1)',
        '(1-x)*(2-x)*(3-x)': '-x^3+6*x^2-11*x+6',
        '(2-x)*(2-x)*(3-x)': '-x^3+7*x^2-16*x+12',
        '(2-x)^2*(3-x)': '-x^3+7*x^2-16*x+12',
        '(x^2-4*x+4)*(3-x)': '-x^3+7*x^2-16*x+12',
        '(x^2-3*x+2)*(3-x)': '-x^3+6*x^2-11*x+6',
        '3*y^3-6*y^2-24*y': '3*(y-4)*y*(y+2)',
        '3*(y^3-2*y^2-8*y)': '3*(y-4)*y*(y+2)',
        '3*y*(y^2-2*y-8)': '3*(y-4)*y*(y+2)',
        '3*(y^2-4*y)*(y+2)': '3*(y-4)*y*(y+2)',
        '(y-4)*y*(3*y+6)': '3*(y-4)*y*(y+2)',
	'24*(x-1/4)': '24*x-6',
	'(x-sqrt(2))*(x+sqrt(2))': 'x^2-2',
        '1/(n+1)-1/n': '1/(n+1)-1/n',
        '1/(n+1)+1/(1-n)': '1/(n+1)-1/(n-1)',
        '1/(2*(n-1))-1/(2*(n+1))': '1/((n-1)*(n+1))',
        '1/(x-1)-(x+1)/(x^2+1)': '2/((x-1)*(x^2+1))',
        '1/(2*x-2)-(x+1)/(2*(x^2+1))': '1/((x-1)*(x^2+1))',
        '3/(x+1) + 3/(x+2)': '3*(2*x+3)/((x+1)*(x+2))',
        '3*(1/(x+1) + 1/(x+2))': '3*(2*x+3)/((x+1)*(x+2))',	
        '3*x*(1/(x+1) + 2/(x+2))': '-12/(x+2)-3/(x+1)+9',
        '2*x+1/(x+1)+1/(x-1)': '2*x^3/(x^2-1)',
        '(2*x+1)/(x^2+1)-2/(x-1)': '(2*x+1)/(x^2+1)-2/(x-1)',
        '-1/((s+1)^2) - 2/(s+2) + 2/(s+1)': 's/((s+1)^2*(s+2))',
        '(-5/(x+3))+(16/(x+3)^2)-(2/(x+2))+4': '(-5/(x+3))+(16/(x+3)^2)-(2/(x+2))+4',
        '-5/(16*x)+53/(16*(x-4))+43/(4*(x-4)^2)': '(3*x^2-5)/((x-4)^2*x)',
	'-1/(16*(x+5))+19/(4*(x+5)^2)+1/(16*(x+1))': '(5*x+6)/((x+1)*(x+5)^2)',
        '-5/(16*x)+1/(2*(x-1))-1/(8*(x-1)^2)': '(3*x^2-5)/((4*x-4)^2*x)',
        '(3*x^2-5)/((x-4)^2*x)': '(3*x^2-5)/((x-4)^2*x)',
        '125/(34*(5*x-2))+5/(51*(x+3))-5/(6*x)': '5/(x*(x+3)*(5*x-2))',	
        '10/(x+3) - 2/(x+2) + x -2': '(x^3 + 3*x^2 + 4*x +2)/((x+2)*(x+3))',
	'(cos(t)-sqrt(2))^2': 'cos(t)^2-2*sqrt(2)*cos(t)+2',
	'(n+1)*n!': '(n+1)!',
	'n/n!': '1/(n-1)!',
	'(n!)^2': 'n! * n!',
	'(-1)^n * (-1)^n': '1',	
	'abs((-x)^(1/3))': '(abs(-x))^(1/3)',
	'abs(x)' : '(x^4)^(1/4)',
	'abs(x)' : 'sqrt(sqrt(x^4))',
	'arcsin(x)' : 'arcsin(x)',
	'arccos(x)' : 'arccos(x)',
	'arctan(x)' : 'arctan(x)',
	'arcsec(x)' : 'arcsec(x)',
	'arccsc(x)' : 'arccsc(x)',
	'arccot(x)' : 'arccot(x)',
	'arcsinh(x)' : 'arcsinh(x)',
	'arccosh(x)' : 'arccosh(x)',
	'arctanh(x)' : 'arctanh(x)',
	'arcsech(x)' : 'arcsech(x)',
	'arccsch(x)' : 'arccsch(x)',
	'arccoth(x)' : 'arccoth(x)',
	'log(x^2*y/z)' : 'log(x^2*y) - log(z)',
	'log(x^2*y/z)' : 'log(x^2) + log(y) - log(z)',
	'log(x^2*y/z)' : '2*log(x) + log(y) - log(z)',
	'log(x^2*y/exp(1))' : '2*log(x) + log(y) - 1',
	'log(sqrt(x^2 + 9) + x) - log(3)' : '(asinh(x/3))',
	'sin(x + y)' : 'sin(x)*cos(y) + cos(x)*sin(y)',
	'cos(x + y)' : 'cos(x)*cos(y) - sin(x)*sin(y)',
	'log(x)/8' : '0.125*log(x)',
	'log(x)/8' : '(1/8)*log(x)',
	'(1/8)*log(x)' : '0.125*log(x)',
	'1' : '1',
	'sqrt(10000 - x)' : 'sqrt(10000 - x)',
			'x*log(y)' : 'log(y^x)',
		'exp(x^y)' : 'exp(x^y)',
		'(exp(x))^y' : 'exp(x*y)',
    };

    _.each( _.keys(equivalences), function(lhs) {
	var rhs = equivalences[lhs];
	it(lhs + " == " + rhs, function() {
	    expect(Expression.fromText(lhs).equals(Expression.fromText(rhs))).toBeTruthy();
	});	
    });

    var nonequivalences = {
	"0.33": "1/3",
	"x/2-sin(2x)/4-(cos(x))^3/3": "x/2+sin(2x)/4-(cos(x))^3/3",
	"x": "sqrt(x^2)",
	"sqrt((x-3)*(x-5))": "sqrt(x-3)*sqrt(x-5)",
	'(19601-13861*sqrt(2))^(7/4)': '(5*sqrt(2)-7)^7',
        '(19601-13861*sqrt(2))^(7/4)': '(5*sqrt(2)-7)^7',
        '1+x': '2*x+1',
	'1/m': '1/n',
	'2/(n+1)': '1/(n+1)',
	'(2*n+1)/(n+2)': '1/n',
        '(2*n)/(n*(n+2))': '(2*n)/(n*(n+3))',
        '(2*log(2*x)+x)/(2*x)': '(log(2*x)+2)/(2*sqrt(x))',
	'2/(x+1)-1/(x+2)': 's/((s+1)*(s+2))',
	'1/(n-1)-1/n^2': '1/((n+1)*n)',
	'1/(n-1)-1/n': '1/(n-1)+1/n',
	'1/(x+1) + 1/(x+2)': '1/(x+1) + 2/(x+2)',
	'1/(x+1) + 1/(x+2)': '1/(x+3) + 1/(x+2)',
	'1/(x+1)-1/x': '1/(x-1)+1/x',
        '2*x+2': '2*x-2',
        '2*(x+1)': '2*x-2',
	'1': '(x-1)^2+1',
	'(t-1)^2+1': '(x-1)^2+1',
	'X^2+1': 'x^2+1',	
	"X": "x", // The system SHOULD be case sensitive, to distinguish say r and R
	'n!*n!': '(2n)!',
	'sin(2*pi*x)' : '0',
	'cos((pi*x))' : '(-1)^(x)',
	'sin(x)' : 'x - x^3/6 + x^5/120',
	'exp(x^2)' : 'exp(x^2 + 1)',
	'1000*exp(x/log(2))' : '1000*exp(x/log(3))',
	'x' : 'y',
	'x + 2*y' : 'y + 2*x',
	'sqrt(x^2)' : 'x',
	'x' : 'sqrt(x^2)',
	'abs(x)' : 'x',
	'-2t sin(t^2)/t^2 + 3t^2 sin(t^3)/t^3': '-2 sin(t^2)/t + 3 sin(t^3)/t'
    };

    _.each( _.keys(nonequivalences), function(lhs) {
	var rhs = nonequivalences[lhs];
	it(lhs + " != " + rhs, function() {
	    expect(Expression.fromText(lhs).equals(Expression.fromText(rhs))).toBeFalsy();
	});	
    });    

    var matchDerivatives = {
        'x^3/3+c': 'x^3/3+c',
        'x^2/2-2*x+2+c': '(x-2)^2/2+k', 
        'exp(x)+c': 'exp(x)',
        'ln(x)+c': 'ln(x)+c', 
        'ln(k*x)': 'ln(x)+c',
        'ln(abs(x))+c': 'ln(abs(x))+c', 
        'ln(k*abs(x))': 'ln(abs(x))+c', 
        'ln(abs(k*x))': 'ln(abs(x))+c', 
        'ln(abs(x))+c': 'ln(k*abs(x))',
        'ln(k*abs(x))': 'ln(k*abs(x))', 
	'c-(log(2)-log(x))^2/2': '-1/2*log(2/x)^2',
        '2*sin(x)*cos(x)+k': 'sin(2*x)+c',
        '-2*cos(3*x)/3-3*cos(2*x)/2+c': '-2*cos(3*x)/3-3*cos(2*x)/2+c',
	'(tan(2*x)-2*x)/2+c': '-(x*sin(4*x)^2-sin(4*x)+x*cos(4*x)^2+2*x*cos(4*x)+x)/(sin(4*x)^2+cos(4*x)^2+2*cos(4*x)+1)',
        'tan(x)-x+c': 'tan(x)-x',
	'2*(sqrt(x)-5)-10*log((sqrt(x)-5))+c': '2*(sqrt(x)-5)-10*log((sqrt(x)-5))+c',
	'x^3/3+c': 'x^3/3',
        'x^3/3+c+1': 'x^3/3',
        'x^3/3+3*c': 'x^3/3',
	'x^3/3-c': 'x^3/3',
	'x^2/2-2*x+2+c': '(x-2)^2/2',
        '(x-1)^5/5+c': '(x-1)^5/5',
        'cos(2*x)/2+1+c': 'cos(2*x)/2',
		'exp(x^y)' : 'exp(x^y + 1)',
    };

    _.each( _.keys(matchDerivatives), function(lhs) {
	var rhs = matchDerivatives[lhs];
	it(lhs + " == " + rhs, function() {
	    expect(Expression.fromText(lhs).derivative('x').equals(Expression.fromText(rhs).derivative('x'))).toBeTruthy();
	});	
    });    

    var derivatives = {
	"x^2": "2x",
	"x^3": "3x^2",
	"sin x": "cos x",
	"cos x": "-sin x",
	"sin^2 x": "2 sin x cos x",
    };

    _.each( _.keys(derivatives), function(lhs) {
	var rhs = derivatives[lhs];
	it("(d/dx) " + lhs + " == " + rhs, function() {
	    expect(Expression.fromText(lhs).derivative('x').equals(Expression.fromText(rhs))).toBeTruthy();
	});	
    });        
    
    var dontMatchDerivatives = {
        'exp(x)': 'exp(x)',
        '2*x': 'x^3/3',
        '2*x+c': 'x^3/3',
        'ln(x)': 'ln(x)',
        'ln(x)': 'ln(abs(x))+c',
        'ln(x)+c': 'ln(abs(x))+c',
        'ln(abs(x))': 'ln(abs(x))+c',
        'ln(k*x)': 'ln(abs(x))+c',
        'ln(x)': 'ln(k*abs(x))',
        'ln(x)+c': 'ln(k*abs(x))',
        'ln(abs(x))': 'ln(k*abs(x))',
        'ln(k*x)': 'ln(k*abs(x))',
        'ln(x)+ln(a)': 'ln(k*abs(x+a))',
        'log(x)^2-2*log(c)*log(x)+k': 'ln(c/x)^2',
        'log(x)^2-2*log(c)*log(x)+k': 'ln(abs(c/x))^2',
	
	'2*sin(x)*cos(x)': 'sin(2*x)+c',
        '-2*cos(3*x)/3-3*cos(2*x)/2': '-2*cos(3*x)/3-3*cos(2*x)/2+c',
        '-2*cos(3*x)/3-3*cos(2*x)/2+1': '-2*cos(3*x)/3-3*cos(2*x)/2+c',
	'(tan(2*t)-2*t)/2': '-(t*sin(4*t)^2-sin(4*t)+t*cos(4*t)^2+2*t*cos(4*t)+t)/(sin(4*t)^2+cos(4*t)^2+2*cos(4*t)+1)',
	'(tan(2*t)-2*t)/2+1': '-(t*sin(4*t)^2-sin(4*t)+t*cos(4*t)^2+2*t*cos(4*t)+t)/(sin(4*t)^2+cos(4*t)^2+2*cos(4*t)+1)',
    };    
       
    var matchForm = {
	'x^2+y/z': 'a^2+c/b',
	'x^2+y': 'a^2+b',
	'x^2+1': 'x^3+1',
    };
    
});
