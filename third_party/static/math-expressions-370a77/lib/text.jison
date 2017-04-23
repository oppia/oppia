/*
 * a lexer for plain text expressions written with Jison
 *
 * Copyright 2014-2015 by Jim Fowler <kisonecat@gmail.com>
 *
 * This file is part of a math-expressions library
 * 
 * math-expressions is free software: you can redistribute
 * it and/or modify it under the terms of the GNU General Public
 * License as published by the Free Software Foundation, either
 * version 3 of the License, or at your option any later version.
 * 
 * math-expressions is distributed in the hope that it
 * will be useful, but WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 * 
 */

/* lexical grammar */
%lex
%%

\s+                   /* skip whitespace */
[0-9]+([,.][0-9]+)?     return 'NUMBER'
[,.][0-9]+		return 'NUMBER'
"**"                    return '^'
"*"                     return '*' // there is some variety in multiplication symbols
"\xB7"                  return '*'
"\u00B7"                return '*'
"\u2022"                return '*'
"\u22C5"                return '*'
"\u00D7"                return '*'
"/"                     return '/'
"-"                     return '-'
"\u002D"                return '-' // there is quite some variety with unicode hyphens
"\u007E"                return '-'
"\u00AD"                return '-'
"\u058A"                return '-'
"\u05BE"                return '-'
"\u1400"                return '-'
"\u1806"                return '-'
"\u2010"                return '-'
"\u2011"                return '-'
"\u2012"                return '-'
"\u2013"                return '-'
"\u2014"                return '-'
"\u2015"                return '-'
"\u207B"                return '-'
"\u208B"                return '-'
"\u2212"                return '-'
"\u2E17"                return '-'
"\u2E3A"                return '-'
"\u2E3B"                return '-'
"\u301C"                return '-'
"\u3030"                return '-'
"\u30A0"                return '-'
"\uFE31"                return '-'
"\uFE32"                return '-'
"\uFE58"                return '-'
"\uFE63"                return '-'
"\uFF0D"                return '-'
"\u002D"                return '-'
"\u007E"                return '-'
"\u00AD"                return '-'
"\u058A"                return '-'
"\u1806"                return '-'
"\u2010"                return '-'
"\u2011"                return '-'
"\u2012"                return '-'
"\u2013"                return '-'
"\u2014"                return '-'
"\u2015"                return '-'
"\u2053"                return '-'
"\u207B"                return '-'
"\u208B"                return '-'
"\u2212"                return '-'
"\u301C"                return '-'
"\u3030"                return '-'
"+"                     return '+'
"^"                     return '^' // lots of ways to denote exponentiation
"\u2038"                return '^'
"\u2041"                return '^'
"\u028C"                return '^'
"\u2227"                return '^'
"\u02C7"                return '^'
"|"                     return '|'
"("                     return '('
")"                     return ')'
"["                     return '('
"]"                     return ')'
"{"                     return '('
"}"                     return ')'
[Ss][Ii][Nn]            return 'SIN'
[Cc][Oo][Ss]            return 'COS'
[Tt][Aa][Nn]            return 'TAN'
[Cc][Ss][Cc]            return 'CSC'
[Cc][Oo][Ss][Ee][Cc]    return 'CSC'
[Ss][Ee][Cc]            return 'SEC'
[Cc][Oo][Tt]            return 'COT'
[Cc][Oo][Tt][Aa][Nn]    return 'COT'
[Aa][Rr][Cc][Ss][Ii][Nn] return 'ARCSIN'
[Aa][Rr][Cc][Cc][Oo][Ss] return 'ARCCOS'
[Aa][Rr][Cc][Tt][Aa][Nn] return 'ARCTAN'
[Aa][Rr][Cc][Cc][Ss][Cc] return 'ARCCSC'
[Aa][Rr][Cc][Ss][Ee][Cc] return 'ARCSEC'
[Aa][Rr][Cc][Cc][Oo][Tt] return 'ARCCOT'
[Aa][Ss][Ii][Nn]        return 'ARCSIN'
[Aa][Cc][Oo][Ss]        return 'ARCCOS'
[Aa][Tt][Aa][Nn]        return 'ARCTAN'
[Aa][Cc][Ss][Cc]        return 'ARCCSC'
[Aa][Ss][Ee][Cc]        return 'ARCSEC'
[Aa][Cc][Oo][Tt]        return 'ARCCOT'
[Ll][Oo][Gg]            return 'LOG'
[Ll][Gg]                return 'LOG'
[Ll][Nn]                return 'LN'
[Ee][Xx][Pp]            return 'EXP'
[Ss][Qq][Rr][Tt]        return 'SQRT'
[Aa][Bb][Ss]            return 'ABS'

"theta"                 return 'theta'
"\u03B8"                return 'theta'
"Theta"               	return 'Theta'

[Pp][Ii]                return 'pi'
"Pi"			return 'Pi'  // this is ignored because students mostly want lowercase pi

"alpha"		      	return 'alpha' // BADBAD: make these less case sensitive
"nu"			return 'nu'
"beta"			return 'beta'
"xi"			return 'xi'
"Xi"			return 'Xi'
"gamma"			return 'gamma'
"Gamma"			return 'Gamma'
"delta"			return 'delta'
"Delta"			return 'Delta'
"epsilon"		return 'epsilon'
"rho"			return 'rho'
"zeta"			return 'zeta'
"sigma"		       	return 'sigma'
"Sigma"		       	return 'Sigma'
"eta"			return 'eta'
"tau"			return 'tau'
"upsilon"		return 'upsilon'
"Upsilon"		return 'Upsilon'
"iota"		  	return 'iota'
"phi"			return 'phi'
"Phi"			return 'Phi'
"kappa"			return 'kappa'
"chi"			return 'chi'
"lambda"		return 'lambda'
"Lambda"		return 'Lambda'
"psi"			return 'psi'
"Psi"			return 'Psi'
"omega"			return 'omega'
"Omega"			return 'Omega'

"oo"			return 'infinity'
"OO"			return 'infinity'
[Ii][Nn][Ff][Tt][Yy]	return 'infinity'
"inf"			return 'infinity'
"infinity"		return 'infinity'
"Infinity"		return 'infinity'

"!"			return '!'

[A-Za-z]                return 'VAR'
<<EOF>>                 return 'EOF'
EOF			return 'EOF'
.                       return 'INVALID'

/lex

%start empty

%% /* language grammar */

empty
    : EOF
    ;
