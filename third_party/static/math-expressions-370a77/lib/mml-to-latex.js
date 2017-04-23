// I would need var parseString = require('../node_modules/xml-parser/index.js'); for urequire?
var parseString = require('xml-parser');

// fix missing semicolons
var entities = {
    "&#913;": "\\Alpha",
    "&Alpha;": "\\Alpha",
    "&#x0391;": "\\Alpha",
    "\\u0391;": "\\Alpha",
    "&#914;": "\\Beta",
    "&Beta;": "\\Beta",
    "&#x0392;": "\\Beta",
    "\\u0392;": "\\Beta",
    "&#915;": "\\Gamma",
    "&Gamma;": "\\Gamma",
    "&#x0393;": "\\Gamma",
    "\\u0393;": "\\Gamma",
    "&#916;": "\\Delta",
    "&Delta;": "\\Delta",
    "&#x0394;": "\\Delta",
    "\\u0394;": "\\Delta",
    "&#917;": "\\Epsilon",
    "&Epsilon;": "\\Epsilon",
    "&#x0395;": "\\Epsilon",
    "\\u0395;": "\\Epsilon",
    "&#918;": "\\Zeta",
    "&Zeta;": "\\Zeta",
    "&#x0396;": "\\Zeta",
    "\\u0396;": "\\Zeta",
    "&#919;": "\\Eta",
    "&Eta;": "\\Eta",
    "&#x0397;": "\\Eta",
    "\\u0397;": "\\Eta",
    "&#920;": "\\Theta",
    "&Theta;": "\\Theta",
    "&#x0398;": "\\Theta",
    "\\u0398;": "\\Theta",
    "&#921;": "\\Iota",
    "&Iota;": "\\Iota",
    "&#x0399;": "\\Iota",
    "\\u0399;": "\\Iota",
    "&#922;": "\\Kappa",
    "&Kappa;": "\\Kappa",
    "&#x039A;": "\\Kappa",
    "\\u039A;": "\\Kappa",
    "&#923;": "\\Lambda",
    "&Lambda;": "\\Lambda",
    "&#x039B;": "\\Lambda",
    "\\u039B;": "\\Lambda",
    "&#924;": "\\Mu",
    "&Mu;": "\\Mu",
    "&#x039C;": "\\Mu",
    "\\u039C;": "\\Mu",
    "&#925;": "\\Nu",
    "&Nu;": "\\Nu",
    "&#x039D;": "\\Nu",
    "\\u039D;": "\\Nu",
    "&#926;": "\\Xi",
    "&Xi;": "\\Xi",
    "&#x039E;": "\\Xi",
    "\\u039E;": "\\Xi",
    "&#927;": "\\Omicron",
    "&Omicron;": "\\Omicron",
    "&#x039F;": "\\Omicron",
    "\\u039F;": "\\Omicron",
    "&#928;": "\\Pi",
    "&Pi;": "\\Pi",
    "&#x03A0;": "\\Pi",
    "\\u03A0;": "\\Pi",
    "&#929;": "\\Rho",
    "&Rho;": "\\Rho",
    "&#x03A1;": "\\Rho",
    "\\u03A1;": "\\Rho",
    "&#931;": "\\Sigma",
    "&Sigma;": "\\Sigma",
    "&#x03A3;": "\\Sigma",
    "\\u03A3;": "\\Sigma",
    "&#932;": "\\Tau",
    "&Tau;": "\\Tau",
    "&#x03A4;": "\\Tau",
    "\\u03A4;": "\\Tau",
    "&#933;": "\\Upsilon",
    "&Upsilon;": "\\Upsilon",
    "&#x03A5;": "\\Upsilon",
    "\\u03A5;": "\\Upsilon",
    "&#934;": "\\Phi",
    "&Phi;": "\\Phi",
    "&#x03A6;": "\\Phi",
    "\\u03A6;": "\\Phi",
    "&#935;": "\\Chi",
    "&Chi;": "\\Chi",
    "&#x03A7;": "\\Chi",
    "\\u03A7;": "\\Chi",
    "&#936;": "\\Psi",
    "&Psi;": "\\Psi",
    "&#x03A8;": "\\Psi",
    "\\u03A8;": "\\Psi",
    "&#937;": "\\Omega",
    "&Omega;": "\\Omega",
    "&#x03A9;": "\\Omega",
    "\\u03A9;": "\\Omega",
    "&#945;": "\\alpha",
    "&alpha;": "\\alpha",
    "&#x03B1;": "\\alpha",
    "\\u03B1;": "\\alpha",
    "&#946;": "\\beta",
    "&beta;": "\\beta",
    "&#x03B2;": "\\beta",
    "\\u03B2;": "\\beta",
    "&#947;": "\\gamma",
    "&gamma;": "\\gamma",
    "&#x03B3;": "\\gamma",
    "\\u03B3;": "\\gamma",
    "&#948;": "\\delta",
    "&delta;": "\\delta",
    "&#x03B4;": "\\delta",
    "\\u03B4;": "\\delta",
    "&#949;": "\\epsilon",
    "&epsilon;": "\\epsilon",
    "&#x03B5;": "\\epsilon",
    "\\u03B5;": "\\epsilon",
    "&#950;": "\\zeta",
    "&zeta;": "\\zeta",
    "&#x03B6;": "\\zeta",
    "\\u03B6;": "\\zeta",
    "&#951;": "\\eta",
    "&eta;": "\\eta",
    "&#x03B7;": "\\eta",
    "\\u03B7;": "\\eta",
    "&#952;": "\\theta",
    "&theta;": "\\theta",
    "&#x03B8;": "\\theta",
    "\\u03B8;": "\\theta",
    "&#953;": "\\iota",
    "&iota;": "\\iota",
    "&#x03B9;": "\\iota",
    "\\u03B9;": "\\iota",
    "&#954;": "\\kappa",
    "&kappa;": "\\kappa",
    "&#x03BA;": "\\kappa",
    "\\u03BA;": "\\kappa",
    "&#955;": "\\lambda",
    "&lambda;": "\\lambda",
    "&#x03BB;": "\\lambda",
    "\\u03BB;": "\\lambda",
    "&#956;": "\\mu",
    "&mu;": "\\mu",
    "&#x03BC;": "\\mu",
    "\\u03BC;": "\\mu",
    "&#957;": "\\nu",
    "&nu;": "\\nu",
    "&#x03BD;": "\\nu",
    "\\u03BD;": "\\nu",
    "&#958;": "\\xi",
    "&xi;": "\\xi",
    "&#x03BE;": "\\xi",
    "\\u03BE;": "\\xi",
    "&#959;": "\\omicron",
    "&omicron;": "\\omicron",
    "&#x03BF;": "\\omicron",
    "\\u03BF;": "\\omicron",
    "&#960;": "\\pi",
    "&pi;": "\\pi",
    "&#x03C0;": "\\pi",
    "\\u03C0;": "\\pi",
    "&#961;": "\\rho",
    "&rho;": "\\rho",
    "&#x03C1;": "\\rho",
    "\\u03C1;": "\\rho",
    "&#962;": "\\sigma",
    ";": "\\sigma",
    "&#x03C2;": "\\sigma",
    "\\u03C2;": "\\sigma",
    "&#963;": "\\sigma",
    "&sigma;": "\\sigma",
    "&#x03C3;": "\\sigma",
    "\\u03C3;": "\\sigma",
    "&#964;": "\\tau",
    "&tau;": "\\tau",
    "&#x03C4;": "\\tau",
    "\\u03C4;": "\\tau",
    "&#965;": "\\upsilon",
    "&upsilon;": "\\upsilon",
    "&#x03C5;": "\\upsilon",
    "\\u03C5;": "\\upsilon",
    "&#966;": "\\phi",
    "&phi;": "\\phi",
    "&#x03C6;": "\\phi",
    "\\u03C6;": "\\phi",
    "&#967;": "\\chi",
    "&chi;": "\\chi",
    "&#x03C7;": "\\chi",
    "\\u03C7;": "\\chi",
    "&#968;": "\\psi",
    "&psi;": "\\psi",
    "&#x03C8;": "\\psi",
    "\\u03C8;": "\\psi",
    "&#969;": "\\omega",
    "&omega;": "\\omega",
    "&#x03C9;": "\\omega",
    "\\u03C9;": "\\omega",
    "&#x2212;": "-",
    "&minus;": "-",
    "&#x221E;": "\\infty",
    "&#8734;": "\\infty",
    "&infin;": "\\infty",
    "&sdot;": "\\cdot",
    "&#x22C5;": "\\cdot",
    "&#8901;": "\\cdot",
    "&times;": "\\times",
    "&#x00D7;": "\\times",
    "&#215;": "\\times"
};

// This is an awfully weak MathML parser, but it's good enough for what MathJax generates
function parse(mml) {
    // math identifier
    if (mml.name == 'mi') {
	if (entities[mml.content]) {
	    return entities[mml.content];
	}
	
	if (mml.content.length > 1) {
	    return "\\" + mml.content;
	} else {
	    return mml.content;
	}
    } 
    // math number
    else if (mml.name == 'mn') {
	    return mml.content;
    }
    // superscript
    else if (mml.name == 'msup') {
	return parse( mml.children[0] ) + '^{' + parse( mml.children[1] ) + "}";
    }
    // root
    else if (mml.name == 'mroot') {
	return "\\sqrt[" + parse( mml.children[1] ) + ']{' + parse( mml.children[1] ) + "}";
    }
    else if (mml.name == 'mfrac') {
	return "\\frac{" + parse( mml.children[0] ) + '}{' + parse( mml.children[1] ) + "}";
    }        
    // superscript
    else if (mml.name == 'msqrt') {
	return "\\sqrt{" + mml.children.map( parse ).join(' ') + "}";
    }    
    // math operator
    else if (mml.name == 'mo') {
	if (entities[mml.content]) {
	    return entities[mml.content];
	} else if (mml.content == '&#x2061;') { 
	    return ' ';
	} else {
	    return mml.content;
	}
    }
    else if ((mml.name == "mrow") && (mml.attributes.class == "MJX-TeXAtom-ORD")) {
	return mml.children.map( parse ).join(' ');
    } else if ((mml.name == 'math') || (mml.name == 'mrow')) {
	return '(' + mml.children.map( parse ).join(' ') + ')';
    }
}

exports.mmlToLatex = function(xml) {
    var result =  parse( parseString(xml).root );
    console.log( "parsed =", JSON.stringify(result) );
    return result;
};

