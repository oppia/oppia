// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the Code Normalizer Service.
 */

import { CodeNormalizerService } from 'services/code-normalizer.service';

describe('Code Normalization', () => {
  let cns: CodeNormalizerService;
  beforeEach(() => {
    cns = new CodeNormalizerService();
  });

  it('should not modify contents of code', () => {
    expect(cns.getNormalizedCode(
      'def x():\n' +
      '    y = 345'
    )).toBe(
      'def x():\n' +
      '    y = 345'
    );
  });

  it('should convert indentation to 4 spaces, remove trailing whitespace ' +
      'and empty lines', () => {
    expect(cns.getNormalizedCode(
      'def x():         \n' +
      '    \n' +
      '  y = 345\n' +
      '            \n' +
      '       '
    )).toBe(
      'def x():\n' +
      '    y = 345'
    );
  });

  it('should remove full-line comments, but not comments in the middle ' +
     'of a line', () => {
    expect(cns.getNormalizedCode(
      '# This is a comment.\n' +
      '  # This is a comment with some spaces before it.\n' +
      'def x():   # And a comment with some code before it.\n' +
      '  y = \'#string with hashes#\''
    )).toBe(
      'def x(): # And a comment with some code before it.\n' +
      '    y = \'#string with hashes#\''
    );
  });

  it('should handle complex indentation', () => {
    expect(cns.getNormalizedCode(
      'abcdefg\n' +
      '    hij\n' +
      '              ppppp\n' +
      'x\n' +
      '  abc\n' +
      '  abc\n' +
      '    bcd\n' +
      '  cde\n' +
      '              xxxxx\n' +
      '  y\n' +
      ' z'
    )).toBe(
      'abcdefg\n' +
      '    hij\n' +
      '        ppppp\n' +
      'x\n' +
      '    abc\n' +
      '    abc\n' +
      '        bcd\n' +
      '    cde\n' +
      '        xxxxx\n' +
      '    y\n' +
      'z'
    );
  });

  it('should handle shortfall lines', () => {
    expect(cns.getNormalizedCode(
      'abcdefg\n' +
      '    hij\n' +
      '              ppppp\n' +
      '      x\n' +
      '  abc\n' +
      '    bcd\n' +
      '  cde'
    )).toBe(
      'abcdefg\n' +
      '    hij\n' +
      '        ppppp\n' +
      '    x\n' +
      'abc\n' +
      '    bcd\n' +
      'cde'
    );
  });

  it('should normalize multiple spaces within a line', () => {
    expect(cns.getNormalizedCode(
      'abcdefg\n' +
      '    hij    klm\n' +
      '    ab "cde fgh"\n'
    )).toBe(
      'abcdefg\n' +
      '    hij klm\n' +
      '    ab "cde fgh"'
    );
  });
});
