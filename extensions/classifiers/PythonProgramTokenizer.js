// Copyright 2017 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * Tokenizer for Python code.
 *
 * IMPORTANT NOTE: The tokenizer is built using Python's own tokenizer module.
 * These functions are simply translated from Python code to JS code and they
 * both do same task. The unnecessary code from Python's tokenizer module
 * has been removed before translating it into JS and code relevant to
 * generating tokens has been kept intact. If Python version changes on Oppia-ml
 * then changes in Python's tokenizer module must be propagated here.
 *
 * Python's tokenizer module for Python version 2.7:
 * https://github.com/python/cpython/blob/2.7/Lib/tokenize.py
 */


oppia.constant('PythonProgramTokenType', {
  COMMENT: 'COMMENT',
  NL: 'NL',
  STRING: 'STRING',
  INDENT: 'INDENT',
  DEDENT: 'DEDENT',
  ENDMARKER: 'ENDMARKER',
  NUMBER: 'NUMBER',
  NAME: 'NAME',
  OP: 'OP',
  ERRORTOKEN: 'ERRORTOKEN'
});

oppia.factory('PythonProgramTokenizer', [
  '$log', 'PythonProgramTokenType', function($log, PythonProgramTokenType) {
    var groupOfRegEx = function() {
      return '(' + Array.prototype.join.call(arguments, '|') + ')';
    };

    var regExMayBePresent = function() {
      return groupOfRegEx(arguments) + '?';
    };

    var repeatedRegEx = function() {
      return groupOfRegEx(arguments) + '*';
    };

    var whitespace = '[ \\f\\t]*';
    var comment = '#[^\\r\\n]*';
    var ignore = whitespace + repeatedRegEx(
      '\\\\\\r?\\n' + whitespace) + regExMayBePresent(comment);
    var name = '[a-zA-Z_]\\w*';

    var hexnumber = '0[xX][\\da-fA-F]+[lL]?';
    var octnumber = '(0[oO][0-7]+)|(0[0-7]*)[lL]?';
    var binnumber = '0[bB][01]+[lL]?';
    var decnumber = '[1-9]\\d*[lL]?';
    var intnumber = groupOfRegEx(hexnumber, binnumber, octnumber, decnumber);
    var exponent = '[eE][-+]?\\d+';
    var pointfloat = groupOfRegEx(
      '\\d+\\.\\d*', '\\\\d+\\\\.\\\\d*') + regExMayBePresent(exponent);
    var expfloat = '\\d+' + exponent;
    var floatnumber = groupOfRegEx(pointfloat, expfloat);
    var imagnumber = groupOfRegEx(
      '\\d+[jJ]', floatnumber + '[jJ]');
    var num = groupOfRegEx(imagnumber, floatnumber, intnumber);
    // Tail end of ' string.
    var single = '[^\'\\\\]*(?:\\\\.[^\'\\\\]*)*\'';
    // Tail end of " string.
    var doubleQuote = '[^"\\\\]*(?:\\\\.[^"\\\\]*)*"';
    // Tail end of ''' string.
    var single3 = "[^'\\\\]*(?:(?:\\\\.|'(?!''))[^'\\\\]*)*'''";
    // Tail end of """ string.
    var double3 = '[^"\\\\]*(?:(?:\\\\.|"(?!""))[^"\\\\]*)*"""';
    var triple = groupOfRegEx("[uUbB]?[rR]?'''", '[uUbB]?[rR]?"""');
    // single-line ' or " string.
    var str = groupOfRegEx(
      "[uUbB]?[rR]?'[^\\n'\\\\]*(?:\\\\.[^\\n'\\\\]*)*'",
      '[uUbB]?[rR]?"[^\\n"\\\\]*(?:\\\\.[^\\n"\\\\]*)*"');

    // Because of leftmost-then-longest match semantics, be sure to put the
    // longest operators first (e.g., if = came before ==, == would get
    // recognized as two instances of =).
    var operator = groupOfRegEx(
      '\\*\\*=?', '>>=?', '<<=?', '<>', '!=', '//=?', '[+\\-*/%&|^=<>]=?', '~');

    var bracket = '[(){}]';
    var special = groupOfRegEx('\\r?\\n', '[:;.,\\`@]');
    var funny = groupOfRegEx(operator, bracket, special);

    var plaintoken = groupOfRegEx(num, funny, str, name);
    var token = ignore + plaintoken;

    // First (or only) line of ' or " string.
    var contStr = groupOfRegEx(
      "[uUbB]?[rR]?'[^\\n'\\\\]*(?:\\\\.[^\\n'\\\\]*)*'" +
      groupOfRegEx("'", '\\\\\\r?\\n'),
      '[uUbB]?[rR]?"[^\\n"\\\\]*(?:\\\\.[^\\n"\\\\]*)*' +
      groupOfRegEx('"', '\\\\\\r?\\n'));
    var pseudoextras = groupOfRegEx('\\\\\\r?\\n|\\Z', comment, triple);
    var pseudotoken = whitespace + groupOfRegEx(
      pseudoextras, num, funny, contStr, name);

    // Regular Expression object.
    var tokenprog = new RegExp(token);
    var pseudoprog = new RegExp(pseudotoken);
    var single3prog = new RegExp(single3);
    var double3prog = new RegExp(double3);

    var endprogs = {
      "'": new RegExp(single), '"': new RegExp(doubleQuote),
      "'''": single3prog, '"""': double3prog,
      "r'''": single3prog, 'r"""': double3prog,
      "u'''": single3prog, 'u"""': double3prog,
      "ur'''": single3prog, 'ur"""': double3prog,
      "R'''": single3prog, 'R"""': double3prog,
      "U'''": single3prog, 'U"""': double3prog,
      "uR'''": single3prog, 'uR"""': double3prog,
      "Ur'''": single3prog, 'Ur"""': double3prog,
      "UR'''": single3prog, 'UR"""': double3prog,
      "b'''": single3prog, 'b"""': double3prog,
      "br'''": single3prog, 'br"""': double3prog,
      "B'''": single3prog, 'B"""': double3prog,
      "bR'''": single3prog, 'bR"""': double3prog,
      "Br'''": single3prog, 'Br"""': double3prog,
      "BR'''": single3prog, 'BR"""': double3prog,
      r: null, R: null, u: null, U: null,
      b: null, B: null
    };

    var tripleQuoted = [
      "'''", '"""', "r'''", 'r"""', "R'''", 'R"""',
      "u'''", 'u"""', "U'''", 'U"""', "ur'''", 'ur"""', "Ur'''", 'Ur"""',
      "uR'''", 'uR"""', "UR'''", 'UR"""', "b'''", 'b"""', "B'''", 'B"""',
      "br'''", 'br"""', "Br'''", 'Br"""', "bR'''", 'bR"""', "BR'''", 'BR"""'];

    var singleQuoted = [
      "'", '"', "r'", 'r"', "R'", 'R"', "u'", 'u"', "U'", 'U"', "ur'",
      'ur"', "Ur'", 'Ur"', "uR'", 'uR"', "UR'", 'UR"', "b'", 'b"', "B'", 'B"',
      "br'", 'br"', "Br'", 'Br"', "bR'", 'bR"', "BR'", 'BR"' ];

    var tabsize = 8;

    return {
      generateTokens: function(program) {
        var tokenizedProgram = [];
        var lnum = parenlev = continued = 0;
        var namechars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_';
        var numchars = '0123456789';
        var contstr = '';
        var needcont = 0;
        var contline = null;
        var indents = [0];
        var lcount = 0;

        while (1) {
          var line = program[lcount];
          lcount++;
          if (line === undefined) {
            break;
          }
          var pos = 0;
          var max = line.length;

          if (contstr) {
            if (!line) {
              // Exception.
              $log.error('EOF in multi-line string');
            }

            endmatch = endprog.exec(line);
            if (endmatch && endmatch.index === 0) {
              token = endmatch[0];
              pos = pos + token.length;
              tokenizedProgram.push([PythonProgramTokenType.STRING, token]);
              contstr = '';
              needcont = 0;
              contline = null;
            } else if (
              needcont && line.slice(-2) !== '\\\n' ||
              line.slice(-3) !== '\\\r\n') {
              tokenizedProgram.push(
                [PythonProgramTokenType.ERRORTOKEN, contstr + line]);
              contstr = '';
              contline = null;
              continue;
            } else {
              contstr = contstr + line;
              contline = contline + line;
              continue;
            }
          } else if (parenlev === 0 && !continued) {
            // New statement.
            if (!line) {
              break;
            }

            column = 0;
            // Measure leading whitespace.
            while (pos < max) {
              if (line[pos] === ' ') {
                column += 1;
              } else if (line[pos] === '\t') {
                column = (column / tabsize + 1) * tabsize;
              } else if (line[pos] === '\f') {
                column = 0;
              } else {
                break;
              }
              pos += 1;
            }

            if (pos === max) {
              break;
            }

            // Skip comments or blank lines.
            if (('#\r\n').indexOf(line[pos]) !== -1) {
              if (line[pos] === '#') {
                commentToken = line.slice(pos).replace('\\r\\n', '');
                nlPos = pos + commentToken.length;
                tokenizedProgram.push(
                  [PythonProgramTokenType.COMMENT, commentToken]);
                tokenizedProgram.push(
                  [PythonProgramTokenType.NL, line.slice(nlPos)]);
              } else {
                tokenizedProgram.push([
                  PythonProgramTokenType.line[pos] === '#' ? COMMENT : NL,
                  line.slice(pos)]);
              }
              continue;
            }

            // Count indents or dedents.
            if (column > indents[-1]) {
              indents.push(column);
              tokenizedProgram.push(
                [PythonProgramTokenType.INDENT, line.slice(0, pos)]);
            }

            while (column < indents[-1]) {
              if (indents.indexOf(column) === -1) {
                $log.error(
                  'unindent does not match any outer indentation level');
              }
              indents = indents.slice(0, -1);
              tokenizedProgram.push([PythonProgramTokenType.DEDENT, '']);
            }
          } else {
            // Continued statement.
            if (!line) {
              $log.error('EOF in multi-line statement');
            }
            continued = 0;
          }

          while (pos < max) {
            pseudomatch = pseudoprog.exec(line.slice(pos));
            // Scan for tokens.
            if (pseudomatch && pseudomatch.index === 0) {
              var start = pos + pseudomatch[0].indexOf(pseudomatch[1]);
              var end = start + pseudomatch[1].length;
              pos = end;
              if (start === end) {
                continue;
              }
              var token = line.slice(start, end);
              var initial = line[start];

              // Ordinary number.
              if (
                numchars.indexOf(initial) !== -1 ||
                (initial === '.' && token !== '.')) {
                tokenizedProgram.push([PythonProgramTokenType.NUMBER, token]);
              } else if ('\r\n'.indexOf(initial) !== -1) {
                tokenizedProgram.push([PythonProgramTokenType.NL, token]);
              } else if (initial === '#') {
                if (!token.endswith('\n')) {
                  tokenizedProgram.push(
                    [PythonProgramTokenType.COMMENT, token]);
                }
              } else if (tripleQuoted.indexOf(token) !== -1) {
                endprog = endprogs[token];
                endmatch = endprog.exec(line.slice(pos));
                // All on one line.
                if (endmatch) {
                  pos = pos + endmatch[0].length;
                  token = line.slice(start, pos);
                  tokenizedProgram.push(
                    [PythonProgramTokenType.STRING, token]);
                } else {
                  // Multiple lines.
                  contstr = line.slice(start);
                  contline = line;
                  break;
                }
              } else if (
                  singleQuoted.indexOf(initial) !== -1 ||
                  singleQuoted.indexOf(token.slice(0, 2)) !== -1 ||
                  singleQuoted.indexOf(token.slice(0, 3)) !== -1) {
                // Continued string.
                if (token.slice(-1) === '\n') {
                  endprog = (
                    endprogs[initial] || endprogs[token[1]] ||
                    endprogs[token[2]]);
                  contstr = line.slice(start);
                  needcont = 1;
                  contline = line;
                  break;
                } else {
                  tokenizedProgram.push(
                    [PythonProgramTokenType.STRING, token]);
                }
              } else if (namechars.indexOf(initial) !== -1) {
                // Ordinary name
                tokenizedProgram.push([PythonProgramTokenType.NAME, token]);
              } else if (initial === '\\') {
                // Continued statement.
                continued = 1;
              } else {
                if ('([{'.indexOf(initial) !== -1) {
                  parenlev += 1;
                } else if (')]}'.indexOf(initial) !== -1) {
                  parenlev -= 1;
                }
                tokenizedProgram.push([PythonProgramTokenType.OP, token]);
              }
            } else {
              tokenizedProgram.push(
                [PythonProgramTokenType.ERRORTOKEN, line[pos]]);
              pos += 1;
            }
          }
        }

        // Pop remaining indent levels
        for (indent in indents.slice(1)) {
          tokenizedProgram.push([PythonProgramTokenType.DEDENT, '']);
        }

        tokenizedProgram.push([PythonProgramTokenType.ENDMARKER, '']);
        return tokenizedProgram;
      }
    };
  }]);
