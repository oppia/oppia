var textToGlsl = require('../lib/parser').text.to.glsl;
var _ = require('underscore');

describe("ast to GLSL", function() {
    // As a testing harness, define real-valued versions of the
    // complex valued GLSL functions.  The syntax of GLSL is C-style,
    // so given this testing harness, the javascript eval is good
    // enough to catch some errors (like missing parens).
    var csin = Math.sin;
    var ccos = Math.cos;
    var ctan = Math.tan;
    var ccsc = function(x) { return 1/Math.sin(x); };
    var csec = function(x) { return 1/Math.cos(x); };
    var ccot = function(x) { return 1/Math.tan(x); };    
    var carcsin = Math.asin;
    var carccos = Math.acos;
    var carctan = Math.atan;

    var cpower = Math.pow;
    var cexp = Math.exp;
    var clog = Math.log;
    var cabs = Math.abs;    
   
    function vec2(x,y) { return x; }
    function cmul(a,b) { return a*b; }
    function cdiv(a,b) { return a/b; }

    // Set some numeric variables for use when testing below
    var x = 17;
    var y = 5;    
    
    // Some sample formulas to test
    var formulas = {
	"3 + x": 20,
	"x + y": 22,	
	"4 + 3": 7,
	"3 - 4": -1,
	"(3 - 4)^3": -1,		
	"4 * 3": 12,
	"3/7": 0.428571428571429,	
	"sin(1)": 0.841470984807897,
	"cos(1)": 0.540302305868140,
	"tan(1)": 1.55740772465490,
	"sin(arcsin(0.17))": 0.17,
	"cos(arccos(0.17))": 0.17,
	"tan(arctan(0.17))": 0.17,
	"arcsin(sin(0.17))": 0.17,
	"arccos(cos(0.17))": 0.17,
	"arctan(tan(0.17))": 0.17,
	"sin(arcsin(-0.17))": -0.17,
	"cos(arccos(-0.17))": -0.17,
	"tan(arctan(-0.17))": -0.17,
	"arcsin(sin(-0.17))": -0.17,
	"arctan(tan(-0.17))": -0.17,		
	"csc(1)": 1.18839510577812,
	"sec(1)": 1.85081571768093,
	"cot(1)": 0.642092615934331,
	"sin^2 (0.17) + cos^2 (0.17)": 1,
	"sqrt(100)": 10,
	"exp(log(0.17))": 0.17,
	"log(exp(0.17))": 0.17,
	"sin(3)/cos(3)": Math.tan(3),
	"abs(-17)": 17,
	"|-17|": 17,
	"27^(1/3)": 3,
	"(1+sqrt(5))/2": 1.61803398874989,
	"exp(2)": 7.38905609893065,
	"log(2)": 0.693147180559945,
	"log(2) + log(1/2)": 0,
    };

    _.each( _.keys(formulas), function(input) {
	it(input + " == " + formulas[input], function() {
	    var result = eval(textToGlsl(input));
	    expect(Math.abs(result - formulas[input])).toBeLessThan(0.00000001);
	});	
    });        
});
