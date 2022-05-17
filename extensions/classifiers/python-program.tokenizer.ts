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
 * @fileoverview Tokenizer for Python code.
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

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { ClassifiersExtensionConstants } from
  'classifiers/classifiers-extension.constants';
import { LoggerService } from 'services/contextual/logger.service';

@Injectable({
  providedIn: 'root'
})
export class PythonProgramTokenizer {
  private PythonProgramTokenType = (
    ClassifiersExtensionConstants.PythonProgramTokenType);

  constructor(private loggerService: LoggerService) {}

  private groupOfRegEx(...params: (string | string[])[]): string {
    return '(' + Array.prototype.join.call(params, '|') + ')';
  }

  private regExMayBePresent(params: string | string[]): string {
    return this.groupOfRegEx(params) + '?';
  }

  private repeatedRegEx(params: string | string[]): string {
    return this.groupOfRegEx(params) + '*';
  }

  private whitespace = '[ \\f\\t]*';
  private comment = '#[^\\r\\n]*';
  private ignore = this.whitespace + this.repeatedRegEx(
    '\\\\\\r?\\n' + this.whitespace) + this.regExMayBePresent(this.comment);

  private name = '[a-zA-Z_]\\w*';

  private hexnumber = '0[xX][\\da-fA-F]+[lL]?';
  private octnumber = '(0[oO][0-7]+)|(0[0-7]*)[lL]?';
  private binnumber = '0[bB][01]+[lL]?';
  private decnumber = '[1-9]\\d*[lL]?';
  private intnumber = this.groupOfRegEx(
    this.hexnumber, this.binnumber, this.octnumber, this.decnumber);

  private exponent = '[eE][-+]?\\d+';
  private pointfloat = this.groupOfRegEx(
    '\\d+\\.\\d*', '\\\\d+\\\\.\\\\d*') + this.regExMayBePresent(this.exponent);

  private expfloat = '\\d+' + this.exponent;
  private floatnumber = this.groupOfRegEx(this.pointfloat, this.expfloat);
  private imagnumber = this.groupOfRegEx(
    '\\d+[jJ]', this.floatnumber + '[jJ]');

  private num = this.groupOfRegEx(
    this.imagnumber, this.floatnumber, this.intnumber);

  // Tail end of ' string.
  private single = '[^\'\\\\]*(?:\\\\.[^\'\\\\]*)*\'';
  // Tail end of " string.
  private doubleQuote = '[^"\\\\]*(?:\\\\.[^"\\\\]*)*"';
  // Tail end of ''' string.
  private single3 = "[^'\\\\]*(?:(?:\\\\.|'(?!''))[^'\\\\]*)*'''";
  // Tail end of """ string.
  private double3 = '[^"\\\\]*(?:(?:\\\\.|"(?!""))[^"\\\\]*)*"""';
  private triple = this.groupOfRegEx("[uUbB]?[rR]?'''", '[uUbB]?[rR]?"""');
  // Single-line ' or " string.
  private str = this.groupOfRegEx(
    "[uUbB]?[rR]?'[^\\n'\\\\]*(?:\\\\.[^\\n'\\\\]*)*'",
    '[uUbB]?[rR]?"[^\\n"\\\\]*(?:\\\\.[^\\n"\\\\]*)*"');

  // Because of leftmost-then-longest match semantics, be sure to put the
  // longest operators first (e.g., if = came before ==, == would get
  // recognized as two instances of =).
  private operator = this.groupOfRegEx(
    '\\*\\*=?', '>>=?', '<<=?', '<>', '!=', '//=?', '[+\\-*/%&|^=<>]=?', '~');

  private bracket = '[(){}]';
  private special = this.groupOfRegEx('\\r?\\n', '[:;.,\\`@]');
  private funny = this.groupOfRegEx(this.operator, this.bracket, this.special);

  private plaintoken = this.groupOfRegEx(
    this.num, this.funny, this.str, this.name);

  private token = this.ignore + this.plaintoken;

  // First (or only) line of ' or " string.
  private contStr = this.groupOfRegEx(
    "[uUbB]?[rR]?'[^\\n'\\\\]*(?:\\\\.[^\\n'\\\\]*)*'" +
    this.groupOfRegEx("'", '\\\\\\r?\\n'),
    '[uUbB]?[rR]?"[^\\n"\\\\]*(?:\\\\.[^\\n"\\\\]*)*' +
    this.groupOfRegEx('"', '\\\\\\r?\\n'));

  private pseudoextras = this.groupOfRegEx(
    '\\\\\\r?\\n|\\Z', this.comment, this.triple);

  private pseudotoken = this.whitespace + this.groupOfRegEx(
    this.pseudoextras, this.num, this.funny, this.contStr, this.name);

  // Regular Expression object.
  private tokenprog = new RegExp(this.token);
  private pseudoprog = new RegExp(this.pseudotoken);
  private single3prog = new RegExp(this.single3);
  private double3prog = new RegExp(this.double3);

  private endprogs: Record<string, RegExp | null> = {
    "'": new RegExp(this.single), '"': new RegExp(this.doubleQuote),
    "'''": this.single3prog, '"""': this.double3prog,
    "r'''": this.single3prog, 'r"""': this.double3prog,
    "u'''": this.single3prog, 'u"""': this.double3prog,
    "ur'''": this.single3prog, 'ur"""': this.double3prog,
    "R'''": this.single3prog, 'R"""': this.double3prog,
    "U'''": this.single3prog, 'U"""': this.double3prog,
    "uR'''": this.single3prog, 'uR"""': this.double3prog,
    "Ur'''": this.single3prog, 'Ur"""': this.double3prog,
    "UR'''": this.single3prog, 'UR"""': this.double3prog,
    "b'''": this.single3prog, 'b"""': this.double3prog,
    "br'''": this.single3prog, 'br"""': this.double3prog,
    "B'''": this.single3prog, 'B"""': this.double3prog,
    "bR'''": this.single3prog, 'bR"""': this.double3prog,
    "Br'''": this.single3prog, 'Br"""': this.double3prog,
    "BR'''": this.single3prog, 'BR"""': this.double3prog,
    r: null, R: null, u: null, U: null,
    b: null, B: null
  };

  private tripleQuoted = [
    "'''", '"""', "r'''", 'r"""', "R'''", 'R"""',
    "u'''", 'u"""', "U'''", 'U"""', "ur'''", 'ur"""', "Ur'''", 'Ur"""',
    "uR'''", 'uR"""', "UR'''", 'UR"""', "b'''", 'b"""', "B'''", 'B"""',
    "br'''", 'br"""', "Br'''", 'Br"""', "bR'''", 'bR"""', "BR'''", 'BR"""'];

  private singleQuoted = [
    "'", '"', "r'", 'r"', "R'", 'R"', "u'", 'u"', "U'", 'U"', "ur'",
    'ur"', "Ur'", 'Ur"', "uR'", 'uR"', "UR'", 'UR"', "b'", 'b"', "B'", 'B"',
    "br'", 'br"', "Br'", 'Br"', "bR'", 'bR"', "BR'", 'BR"'];

  private tabsize = 8;

  generateTokens(program: string[]): string[][] {
    const tokenizedProgram = [];
    let parenlev = 0;
    let continued = 0;
    const namechars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_';
    const numchars = '0123456789';
    let contstr = '';
    let needcont = 0;
    let contline = null;
    let indents = [0];
    let lcount = 0;
    let endprog = null;

    while (1) {
      let line = program[lcount];
      lcount++;
      if (line === undefined) {
        break;
      }
      let pos = 0;
      const max = line.length;

      if (contstr) {
        if (!line) {
          // Exception.
          this.loggerService.error('EOF in multi-line string');
        }
        let endmatch;
        if (endprog !== null) {
          endmatch = endprog.exec(line);
        }
        if (endmatch && endmatch.index === 0) {
          this.token = endmatch[0];
          pos = pos + this.token.length;
          tokenizedProgram.push(
            [this.PythonProgramTokenType.STRING, this.token]);
          contstr = '';
          needcont = 0;
          contline = null;
        } else if (
          needcont && line.slice(-2) !== '\\\n' ||
          line.slice(-3) !== '\\\r\n') {
          tokenizedProgram.push(
            [this.PythonProgramTokenType.ERRORTOKEN, contstr + line]);
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

        let column = 0;
        // Measure leading whitespace.
        while (pos < max) {
          if (line[pos] === ' ') {
            column += 1;
          } else if (line[pos] === '\t') {
            column = (column / this.tabsize + 1) * this.tabsize;
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
            const commentToken = line.slice(pos).replace('\\r\\n', '');
            const nlPos = pos + commentToken.length;
            tokenizedProgram.push(
              [this.PythonProgramTokenType.COMMENT, commentToken]);
            tokenizedProgram.push(
              [this.PythonProgramTokenType.NL, line.slice(nlPos)]);
          } else {
            const comment = this.PythonProgramTokenType.COMMENT;
            const nl = this.PythonProgramTokenType.NL;
            tokenizedProgram.push([
              line[pos] === '#' ? comment : nl,
              line.slice(pos)]);
          }
          continue;
        }

        // Count indents or dedents.
        if (column > indents[-1]) {
          indents.push(column);
          tokenizedProgram.push(
            [this.PythonProgramTokenType.INDENT, line.slice(0, pos)]);
        }

        while (column < indents[-1]) {
          if (indents.indexOf(column) === -1) {
            this.loggerService.error(
              'unindent does not match any outer indentation level');
          }
          indents = indents.slice(0, -1);
          tokenizedProgram.push([this.PythonProgramTokenType.DEDENT, '']);
        }
      } else {
        // Continued statement.
        if (!line) {
          this.loggerService.error('EOF in multi-line statement');
        }
        continued = 0;
      }

      while (pos < max) {
        const pseudomatch = this.pseudoprog.exec(line.slice(pos));
        // Scan for tokens.
        if (pseudomatch && pseudomatch.index === 0) {
          const start = pos + pseudomatch[0].indexOf(pseudomatch[1]);
          const end = start + pseudomatch[1].length;
          pos = end;
          if (start === end) {
            continue;
          }
          let token = line.slice(start, end);
          const initial = line[start];

          // Ordinary number.
          if (
            numchars.indexOf(initial) !== -1 ||
            (initial === '.' && token !== '.')) {
            tokenizedProgram.push([this.PythonProgramTokenType.NUMBER, token]);
          } else if ('\r\n'.indexOf(initial) !== -1) {
            tokenizedProgram.push([this.PythonProgramTokenType.NL, token]);
          } else if (initial === '#') {
            if (!token.endsWith('\n')) {
              tokenizedProgram.push(
                [this.PythonProgramTokenType.COMMENT, token]);
            }
          } else if (this.tripleQuoted.indexOf(token) !== -1) {
            let endprog = this.endprogs[token];
            let endmatch;
            if (endprog !== null) {
              endmatch = endprog.exec(line.slice(pos));
            }
            // All on one line.
            if (endmatch) {
              pos = pos + endmatch[0].length;
              token = line.slice(start, pos);
              tokenizedProgram.push(
                [this.PythonProgramTokenType.STRING, token]);
            } else {
              // Multiple lines.
              contstr = line.slice(start);
              contline = line;
              break;
            }
          } else if (
            this.singleQuoted.indexOf(initial) !== -1 ||
              this.singleQuoted.indexOf(token.slice(0, 2)) !== -1 ||
              this.singleQuoted.indexOf(token.slice(0, 3)) !== -1) {
            // Continued string.
            if (token.slice(-1) === '\n') {
              endprog = (
                this.endprogs[initial] || this.endprogs[token[1]] ||
                this.endprogs[token[2]]);
              contstr = line.slice(start);
              needcont = 1;
              contline = line;
              break;
            } else {
              tokenizedProgram.push(
                [this.PythonProgramTokenType.STRING, token]);
            }
          } else if (namechars.indexOf(initial) !== -1) {
            // Ordinary name.
            tokenizedProgram.push([this.PythonProgramTokenType.NAME, token]);
          } else if (initial === '\\') {
            // Continued statement.
            continued = 1;
          } else {
            if ('([{'.indexOf(initial) !== -1) {
              parenlev += 1;
            } else if (')]}'.indexOf(initial) !== -1) {
              parenlev -= 1;
            }
            tokenizedProgram.push([this.PythonProgramTokenType.OP, token]);
          }
        } else {
          tokenizedProgram.push(
            [this.PythonProgramTokenType.ERRORTOKEN, line[pos]]);
          pos += 1;
        }
      }
    }

    // Pop remaining indent levels.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (let indent in indents.slice(1)) {
      tokenizedProgram.push([this.PythonProgramTokenType.DEDENT, '']);
    }

    tokenizedProgram.push([this.PythonProgramTokenType.ENDMARKER, '']);
    return tokenizedProgram;
  }
}

angular.module('oppia').factory(
  'PythonProgramTokenizer', downgradeInjectable(PythonProgramTokenizer));
