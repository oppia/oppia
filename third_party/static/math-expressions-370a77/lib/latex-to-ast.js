/* recursive descent parser for math expressions */

/* Grammar: 

   expression =
    expression '+' term | 
    expression '-' term |
    term

   term =
    term '*' factor |
    term nonMinusFactor |
    term '/' factor |
    factor

   nonMinusFactor =
    '(' expression ')' |
    \frac{expression}{expression} |
    number | 
    variable |
    function factor |
    function '(' expression ')' |
    sqrt '[' root ']' '{' expression '}' |
    function '^' factor factor |
    nonMinusFactor '^' factor |
    nonMinusFactor '!'

   factor = 
    '-' factor |
    nonMinusFactor |
    '|' expression '|'

*/



var Parser = require('./lexers/latex').Parser;
var lexer = new Parser();

/****************************************************************/
/* setup the lexer */

lexer.parse('');
lexer = lexer.lexer;

var symbol = '';
    
function advance() {
    symbol = lexer.lex();
    
    if (symbol == 4)
	symbol = 'EOF';
    
    return symbol;
}
    
function yytext() {
    return lexer.yytext;
}

function parse(input) {
    lexer.setInput(input);
    advance();
    
    return expression();
}

    
/****************************************************************/
/* grammar */
    
function expression() {
    var lhs = term();
    
    while ((symbol == '+') || (symbol == '-')) {
	var operation = false;
	
	if (symbol == '+')
	    operation = '+';
	
	if (symbol == '-')
	    operation = '-';
	
	advance();
	
	var rhs = term();
	
	lhs = [operation, lhs, rhs];
    }
    
    return lhs;
}

function isGreekLetterSymbol( symbol )
{
    var greekSymbols = ['pi', 'theta', 'theta', 'Theta', 'alpha', 'nu', 'beta', 'xi', 'Xi', 'gamma', 'Gamma', 'delta', 'Delta', 'pi', 'Pi', 'epsilon', 'epsilon', 'rho', 'rho', 'zeta', 'sigma', 'Sigma', 'eta', 'tau', 'upsilon', 'Upsilon', 'iota', 'phi', 'phi', 'Phi', 'kappa', 'chi', 'lambda', 'Lambda', 'psi', 'Psi', 'omega', 'Omega'];
    return (greekSymbols.indexOf(symbol) != -1);
}

function isFunctionSymbol( symbol )
{
    var functionSymbols = ['SIN', 'COS', 'TAN', 'CSC', 'SEC', 'COT', 'ARCSIN', 'ARCCOS', 'ARCTAN', 'ARCCOT', 'ARCCSC', 'ARCSEC', 'LOG', 'LN', 'EXP', 'SQRT', 'ABS'];
    return (functionSymbols.indexOf(symbol) != -1);
}    

function term() {
    var lhs = factor();
    
    var keepGoing = false;
    
    do {
	keepGoing = false;
	
	if (symbol == '*') {
	    advance();
	    lhs = ['*', lhs, factor()];
	    keepGoing = true;
	} else if (symbol == '/') {
	    advance();
	    lhs = ['/', lhs, factor()];
	    keepGoing = true;
	} else {
	    rhs = nonMinusFactor();
	    if (rhs != false) {
		lhs = ['*', lhs, rhs];
		keepGoing = true;
	    }
	}
    } while( keepGoing );
    
    return lhs;
}
    
function factor() {
    if (symbol == '-') {
	advance();
	return ['~', factor()];
    }

    if (symbol == '|') {
	advance();
	
	var result = expression();
	result = ['abs', result];
	
	if (symbol != '|'){
	    throw 'Expected |';
	}
	advance();
	return result;
    }     
    
    return nonMinusFactor();
}

function nonMinusFactor() {
    var result = false;
 
    if (symbol == 'FRAC') {
	advance();
	
	if (symbol != '{') {
	    throw 'Expected {';
	}
	advance();	    
	
	var numerator = expression();
	
	if (symbol != '}') {
	    throw 'Expected }';
	}
	advance();
	
	if (symbol != '{') {
	    throw 'Expected {';
	}
	advance();	    
	
	var denominator = expression();
	
	if (symbol != '}') {
	    throw 'Expected }';
	}
	advance();
	
	return ['/', numerator, denominator];
    }
    
    if (symbol == 'NUMBER') {
	result = parseFloat( yytext() );
	advance();
    } else if (symbol == 'VAR') {
	result = yytext();
	advance();
    } else if (symbol == 'infinity') {
	result = symbol;
	advance();	
    } else if (isGreekLetterSymbol(symbol)) {
	result = symbol;
	advance();
    } else if (symbol == 'SQRT') {
	advance();

	var root = 2;
	if (symbol == '[') {
	    advance();
	    var parameter = expression();
	    if (symbol != ']') {
		throw 'Expected }';
	    }
	    advance();
	    
	    root = parameter;
	}

	if (symbol != '{') {
	    throw 'Expected {';
	}
	    
	advance();
	var parameter = expression();
	if (symbol != '}') {
	    throw 'Expected }';
	}
	advance();

	if (root == 2) 
	    result = ['sqrt', parameter];
	else
	    result = ['^', parameter, ['/', 1, root]];
    } else if (isFunctionSymbol(symbol)) {
	var functionName = symbol.toLowerCase();
	advance();

	if (symbol == '{') {
	    advance();
	    var parameter = expression();
	    if (symbol != '}') {
		throw 'Expected }';
	    }
	    advance();
	    
	    result = [functionName, parameter];
	} else if (symbol == '(') {
	    advance();
	    var parameter = expression();
	    if (symbol != ')') {
		throw 'Expected )';	    
	    }
	    advance();
	    
	    result = [functionName, parameter];
	} else if (symbol == '^') {
	    advance();
	    var power = factor();
	    var parameter = factor();
	    result = ['^', [functionName, parameter], power];
	} else {
	    result = [functionName, factor()];
	}
    } else if (symbol == '(') {
	advance();
	var result = expression();
	if (symbol != ')') {
	    throw 'Expected )';	    
	}
	advance();
    } else if (symbol == '{') {
	advance();
	var result = expression();
	if (symbol != '}') {
	    throw 'Expected )';	    
	}
	advance();
    } 
    
    if (symbol == '^') {
	advance();
	return ['^', result, factor()];
    }

    if (symbol == '!') {
	advance();
	return ['factorial', result];
    }    
    
    return result;
}

// Do not bother reassociating; I'm parsing latex not to display it (I'd just display the input!) but to compute with it.
function parse(input) {
    lexer.setInput(input);
    advance();
    return expression();
}

exports.latexToAst = parse;
