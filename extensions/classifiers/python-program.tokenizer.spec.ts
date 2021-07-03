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
 * @fileoverview Unit tests python program tokenizer.
 */

import { TestBed } from '@angular/core/testing';

import { LoggerService } from 'services/contextual/logger.service';
import { PythonProgramTokenizer } from 'classifiers/python-program.tokenizer';

describe('Python program tokenizer', () => {
  describe('Test python program tokenizer', () => {
    let tokenizer: PythonProgramTokenizer;
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [LoggerService, PythonProgramTokenizer]
      });
      tokenizer = TestBed.get(PythonProgramTokenizer);
    });

    it('should generate correct tokens for a program', () => {
      const program = (
        '# In Python, the code\n#\n#     for letter in [\'a\', \'b\']:\n#    ' +
        '     print letter\n#\n# prints:\n#\n#     a\n#     b\ns = 0;\nfor ' +
        'num in range(1000):\n  if num%7 == 0 or num%5 == 0:\n\ts +=x\n' +
        'print s');

      const expectedTokens = [
        ['COMMENT', '# In Python, the code'], ['NL', ''], ['COMMENT', '#'],
        ['NL', ''], ['COMMENT', '#     for letter in [\'a\', \'b\']:'],
        ['NL', ''], ['COMMENT', '#         print letter'], ['NL', ''],
        ['COMMENT', '#'], ['NL', ''], ['COMMENT', '# prints:'], ['NL', ''],
        ['COMMENT', '#'], ['NL', ''], ['COMMENT', '#     a'], ['NL', ''],
        ['COMMENT', '#     b'], ['NL', ''], ['NAME', 's'], ['OP', '='],
        ['NUMBER', '0'], ['OP', ';'], ['NAME', 'for'], ['NAME', 'num'],
        ['NAME', 'in'], ['NAME', 'range'], ['OP', '('], ['NUMBER', '1000'],
        ['OP', ')'], ['OP', ':'], ['NAME', 'if'], ['NAME', 'num'], ['OP', '%'],
        ['NUMBER', '7'], ['OP', '=='], ['NUMBER', '0'], ['NAME', 'or'],
        ['NAME', 'num'], ['OP', '%'], ['NUMBER', '5'], ['OP', '=='],
        ['NUMBER', '0'], ['OP', ':'], ['NAME', 's'], ['OP', '+='],
        ['NAME', 'x'], ['NAME', 'print'], ['NAME', 's'], ['ENDMARKER', '']];

      const tokens = tokenizer.generateTokens(program.split('\n'));
      expect(tokens.length).toEqual(expectedTokens.length);
      expect(tokens).toEqual(expectedTokens);
    });
  });
});
