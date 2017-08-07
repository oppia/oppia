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
 * IMPORTANT NOTE: The tokenizer is build using Python's own tokenizer module.
 * These functions are simply translated from Python code to JS code and they
 * both do same task. The unnecessary code from Python's tokenizer module
 * has been removed before translating it into JS andcCode relevant to
 * generating tokens has been kept intact. If Python version changes on Oppia-ml
 * then changes in Python's tokenizer module must be propagated here.
 *
 * Python's tokenizer module for Python version 2.7:
 * https://github.com/python/cpython/blob/2.7/Lib/tokenize.py
 */


Oppia.constant('PythonProgramTokenType', {
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

Oppia.factory('PythonProgramTokenizer', [
  '$log', 'PythonProgramTokenType', function($log, PythonProgramTokenType) {
    var group = function() {
      return '(' + Array.prototype.join.call(arguments, '|') + ')';
    };

    var maybe = function() {
      return group(arguments) + '?';
    };

    var any = function() {
      return group(arguments) + '*';
    };

    var Whitespace = String.raw`[ \f\t]*`;
    var Comment = String.raw`#[^\r\n]*`;
    var Ignore = Whitespace + any(String.raw`\\\r?\n` + Whitespace) + maybe(
      Comment);
    var Name = String.raw`[a-zA-Z_]\w*`;

    var Hexnumber = String.raw`0[xX][\da-fA-F]+[lL]?`;
    var Octnumber = String.raw`(0[oO][0-7]+)|(0[0-7]*)[lL]?`;
    var Binnumber = String.raw`0[bB][01]+[lL]?`;
    var Decnumber = String.raw`[1-9]\d*[lL]?`;
    var Intnumber = group(Hexnumber, Binnumber, Octnumber, Decnumber)
    var Exponent = String.raw`[eE][-+]?\d+`
    var Pointfloat = group(String.raw`\d+\.\d*`, String.raw`\.\d+`) + maybe(
      Exponent)
    var Expfloat = String.raw`\d+` + Exponent;
    var Floatnumber = group(Pointfloat, Expfloat)
    var Imagnumber = group(String.raw`\d+[jJ]`, Floatnumber + String.raw`[jJ]`)
    var num = group(Imagnumber, Floatnumber, Intnumber)
    // Tail end of ' string.
    var Single = String.raw`[^'\\]*(?:\\.[^'\\]*)*'`;
    // Tail end of " string.
    var Double = String.raw`[^"\\]*(?:\\.[^"\\]*)*"`;
    // Tail end of ''' string.
    var Single3 = String.raw`[^'\\]*(?:(?:\\.|'(?!''))[^'\\]*)*'''`;
    // Tail end of """ string.
    var Double3 = String.raw`[^"\\]*(?:(?:\\.|"(?!""))[^"\\]*)*"""`;
    var Triple = group("[uUbB]?[rR]?'''", '[uUbB]?[rR]?"""');
    // Single-line ' or " string.
    var str = group(String.raw`[uUbB]?[rR]?'[^\n'\\]*(?:\\.[^\n'\\]*)*'`,
                   String.raw`[uUbB]?[rR]?"[^\n"\\]*(?:\\.[^\n"\\]*)*"`);

    // Because of leftmost-then-longest match semantics, be sure to put the
    // longest operators first (e.g., if = came before ==, == would get
    // recognized as two instances of =).
    var Operator = group(String.raw`\*\*=?`, String.raw`>>=?`, String.raw`<<=?`,
                     String.raw`<>`, String.raw`!=`,
                     String.raw`//=?`,
                     String.raw`[+\-*/%&|^=<>]=?`,
                     String.raw`~`);

    var Bracket = String.raw`[][(){}]`;
    var Special = group(String.raw`\r?\n`, String.raw`[:;.,\`@]`);
    var Funny = group(Operator, Bracket, Special)

    var PlainToken = group(num, Funny, str, Name)
    var Token = Ignore + PlainToken

    // First (or only) line of ' or " string.
    var ContStr = group(String.raw`[uUbB]?[rR]?'[^\n'\\]*(?:\\.[^\n'\\]*)*` +
                    group("'", String.raw`\\\r?\n`),
                    String.raw`[uUbB]?[rR]?"[^\n"\\]*(?:\\.[^\n"\\]*)*` +
                    group('"', String.raw`\\\r?\n`))
    var PseudoExtras = group(String.raw`\\\r?\n|\Z`, Comment, Triple)
    var PseudoToken = Whitespace + group(
      PseudoExtras, num, Funny, ContStr, Name)

    // Regular Expression object.
    var tokenprog = new RegExp(Token);
    var pseudoprog = new RegExp(PseudoToken);
    var single3prog = new RegExp(Single3);
    var double3prog = new RegExp(Double3);

    var endprogs = {
      "'": new RegExp(Single), '"': new RegExp(Double),
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
      generate_tokens: function(program) {
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
            }

            else if (
              needcont && line.slice(-2) != '\\\n' ||
              line.slice(-3) != '\\\r\n') {
              tokenizedProgram.push(
                [PythonProgramTokenType.ERRORTOKEN, contstr + line]);
              contstr = '';
              contline = null;
              continue;
            }

            else {
              contstr = contstr + line;
              contline = contline + line;
              continue;
            }
          }

          // new statement
          else if (parenlev == 0 && !continued) {
            if (!line) {
              break;
            }

            column = 0
            // measure leading whitespace.
            while (pos < max) {
              if (line[pos] == ' ') {
                column += 1;
              }
              else if (line[pos] == '\t') {
                column = (column / tabsize + 1) * tabsize;
              }
              else if (line[pos] == '\f') {
                column = 0;
              }
              else {
                break;
              }
              pos += 1;
            }

            if (pos == max) {
              break;
            }

            // skip comments or blank lines.
            if (('#\r\n').indexOf(line[pos]) != -1) {
              if (line[pos] == '#') {
                commentToken = line.slice(pos).replace(String.raw`\r\n`, '');
                nlPos = pos + commentToken.length;
                tokenizedProgram.push(
                  [PythonProgramTokenType.COMMENT, commentToken]);
                tokenizedProgram.push(
                  [PythonProgramTokenType.NL, line.slice(nlPos)]);
              }
              else {
                tokenizedProgram.push([
                  PythonProgramTokenType.line[pos] == '#' ? COMMENT : NL,
                  line.slice(pos)]);
              }
              continue;
            }

            // count indents or dedents.
            if (column > indents[-1]) {
              indents.push(column)
              tokenizedProgram.push(
                [PythonProgramTokenType.INDENT, line.slice(0, pos)]);
            }

            while (column < indents[-1]) {
              if (indents.indexOf(column) == -1) {
                $log.error(
                  'unindent does not match any outer indentation level');
              }
              indents = indents.slice(0, -1);
              tokenizedProgram.push([PythonProgramTokenType.DEDENT, '']);
            }
          }

          // continued statement
          else {
            if (!line) {
              $log.error('EOF in multi-line statement');
            }
            continued = 0;
          }

          while (pos < max) {
            pseudomatch = pseudoprog.exec(line.slice(pos));
            // scan for tokens
            if (pseudomatch && pseudomatch.index == 0) {
              var start = pos + pseudomatch[0].indexOf(pseudomatch[1]);
              var end = start + pseudomatch[1].length;
              pos = end;
              if (start == end) {
                continue;
              }
              var token = line.slice(start, end);
              var initial = line[start];

              // ordinary number
              if (
                numchars.indexOf(initial) != -1 ||
                (initial == '.' && token != '.')) {
                tokenizedProgram.push([PythonProgramTokenType.NUMBER, token]);
              }
              else if ('\r\n'.indexOf(initial) != -1) {
                tokenizedProgram.push([PythonProgramTokenType.NL, token]);
              }
              else if (initial == '#') {
                if (!token.endswith('\n')) {
                  tokenizedProgram.push(
                    [PythonProgramTokenType.COMMENT, token]);
                }
              }
              else if (tripleQuoted.indexOf(token) != -1) {
                endprog = endprogs[token];
                endmatch = endprog.exec(line.slice(pos));
                // all on one line
                if (endmatch) {
                  pos = pos + endmatch[0].length;
                  token = line.slice(start, pos);
                  tokenizedProgram.push(
                    [PythonProgramTokenType.STRING, token]);
                }
                // multiple lines
                else {
                  contstr = line.slice(start);
                  contline = line;
                  break;
                }
              }
              // continued string
              else if (
                  singleQuoted.indexOf(initial) != -1 ||
                  singleQuoted.indexOf(token.slice(0, 2)) != -1 ||
                  singleQuoted.indexOf(token.slice(0, 3)) != -1) {
                if (token.slice(-1) == '\n') {
                  endprog = (
                    endprogs[initial] || endprogs[token[1]] ||
                    endprogs[token[2]]);
                  contstr = line.slice(start);
                  needcont = 1;
                  contline = line;
                  break;
                }
                else {
                  tokenizedProgram.push(
                    [PythonProgramTokenType.STRING, token]);
                }
              }
              // ordinary name
              else if (namechars.indexOf(initial) != -1) {
                tokenizedProgram.push([PythonProgramTokenType.NAME, token]);
              }
              // continued stmt
              else if (initial == '\\') {
                continued = 1;
              }
              else {
                if ('([{'.indexOf(initial) != -1) {
                  parenlev += 1;
                }
                else if (')]}'.indexOf(initial) != -1) {
                  parenlev -= 1;
                }
                tokenizedProgram.push([PythonProgramTokenType.OP, token]);
              }
            }
            else {
              tokenizedProgram.push(
                [PythonProgramTokenType.ERRORTOKEN, line[pos]]);
              pos += 1;
            }
          }
        }

        // pop remaining indent levels
        for (indent in indents.slice(1)) {
          tokenizedProgram.push([PythonProgramTokenType.DEDENT, '']);
        }

        tokenizedProgram.push([PythonProgramTokenType.ENDMARKER, '']);
        return tokenizedProgram;
      }
    };
  }]);
