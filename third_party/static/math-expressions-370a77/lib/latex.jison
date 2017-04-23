/*
 * a lexer for LaTeX expressions written with Jison
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

(\s+|"\\,")                   /* skip whitespace */
[0-9]+("."[0-9]+)?  return 'NUMBER'
[,.][0-9]+		return 'NUMBER'
"*"                     return '*'
"/"                     return '/'
"-"                     return '-'
"-"                     return '-'
"+"                     return '+'
"^"                     return '^'
"("                     return '('
"\\left"\s*"("          return '('
"\\right"\s*")"         return ')'
"\\left"\s*"["          return '['
"\\right"\s*"]"         return ']'
"["                     return '['
"]"                     return ']'
"\\left"\s*"|"          return '|'
"\\right"\s*"|"         return '|'
"|"			return '|'
")"                     return ')'
"{"                     return '{'
"}"                     return '}'
"\\cdot"                return '*'
"\\times"               return '*'
"\\frac"                return 'FRAC'
"\\sin"                 return 'SIN'
"\\cos"                 return 'COS'
"\\tan"                 return 'TAN'
"\\csc"                 return 'CSC'
"\\sec"                 return 'SEC'
"\\cot"                 return 'COT'
"\\sin"                 return 'SIN'
"\\cos"                 return 'COS'
"\\tan"                 return 'TAN'
"\\csc"                 return 'CSC'
"\\sec"                 return 'SEC'
"\\cot"                 return 'COT'

"\\pi"                  return 'pi'
"\\theta"               return 'theta'
"\\vartheta"            return 'theta'
"\\Theta"               return 'Theta'
"\\alpha"		return 'alpha'
"\\nu"			return 'nu'
"\\beta"		return 'beta'
"\\xi"			return 'xi'
"\\Xi"			return 'Xi'
"\\gamma"		return 'gamma'
"\\Gamma"		return 'Gamma'
"\\delta"		return 'delta'
"\\Delta"		return 'Delta'
"\\Pi"			return 'Pi'
"\\epsilon"		return 'epsilon'
"\\varepsilon"		return 'epsilon'
"\\rho"			return 'rho'
"\\varrho"		return 'rho'
"\\zeta"		return 'zeta'
"\\sigma"		return 'sigma'
"\\Sigma"		return 'Sigma'
"\\eta"			return 'eta'
"\\tau"			return 'tau'
"\\upsilon"		return 'upsilon'
"\\Upsilon"		return 'Upsilon'
"\\iota"		return 'iota'
"\\phi"			return 'phi'
"\\varphi"		return 'phi'
"\\Phi"			return 'Phi'
"\\kappa"		return 'kappa'
"\\chi"			return 'chi'
"\\lambda"		return 'lambda'
"\\Lambda"		return 'Lambda'
"\\psi"			return 'psi'
"\\Psi"			return 'Psi'
"\\omega"		return 'omega'
"\\Omega"		return 'Omega'

"\\infty"		return 'infinity'

"\\arcsin"              return 'ARCSIN'
"\\arccos"              return 'ARCCOS'
"\\arctan"              return 'ARCTAN'
"\\arcsec"              return 'ARCSEC'
"\\arccsc"              return 'ARCCSC'
"\\arccot"              return 'ARCCOT'
"\\asin"                return 'ARCSIN'
"\\acos"                return 'ARCCOS'
"\\atan"                return 'ARCTAN'
"\\log"                 return 'LOG'
"\\ln"                  return 'LN'
"\\exp"                 return 'EXP'
"\\sqrt"                return 'SQRT'
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
