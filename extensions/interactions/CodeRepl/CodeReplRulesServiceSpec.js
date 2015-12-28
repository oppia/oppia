// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for Graph Input rules.
 *
 * @author wxyxinyu@gmail.com (Xinyu Wu)
 */

describe('Code Normalization', function() {
  beforeEach(module('oppia'));

  var crns = null;
  beforeEach(inject(function($injector) {
    crns = $injector.get('codeReplNormalizationService');
  }));

  it('should not modify contents of code', function() {
    expect(crns.getNormalizedCode(
      'def x():\n' +
      '    y = 345'
    )).toBe(
      'def x():\n' +
      '    y = 345'
    );
  });

  it('should convert indentation to 4 spaces, remove trailing whitespace ' +
      'and empty lines', function() {
    expect(crns.getNormalizedCode(
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
     'of a line', function() {
    expect(crns.getNormalizedCode(
      '# This is a comment.\n' +
      '  # This is a comment with some spaces before it.\n' +
      'def x():         # And a comment with some code before it.\n' +
      '  y = \'#String with hashes#\''
    )).toBe(
      'def x():         # And a comment with some code before it.\n' +
      '    y = \'#String with hashes#\''
    );
  });

  it('should handle complex indentation', function() {
    expect(crns.getNormalizedCode(
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

  it('should handle shortfall lines', function() {
    expect(crns.getNormalizedCode(
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
});

describe('Code REPL rules service', function() {
  beforeEach(module('oppia'));

  var crrs = null;
  beforeEach(inject(function($injector) {
    crrs = $injector.get('codeReplRulesService');
  }));

  describe('\'equals\' rule', function() {
    var RULE_INPUT = {
      x: (
        'def x():\n' +
        '    y = \'ab    c\'\n' +
        '    return x'
      )
    };

    it('should accept the same code', function() {
      expect(crrs.CodeEquals({
        code: (
          'def x():\n' +
          '    y = \'ab    c\'\n' +
          '    return x'
        )
      }, RULE_INPUT)).toBe(true);
    });

    it('should remove extra newlines and trailing whitespace', function() {
      // Extra newline with spaces
      expect(crrs.CodeEquals({
        code: (
          'def x():\n' +
          '    y = \'ab    c\'\n' +
          '    \n' +
          '    return x'
        )
      }, RULE_INPUT)).toBe(true);

      // Extra trailing whitespace on first line
      expect(crrs.CodeEquals({
        code: (
          'def x():        \n' +
          '    y = \'ab    c\'\n' +
          '    return x'
        )
      }, RULE_INPUT)).toBe(true);

      // Tab character
      expect(crrs.CodeEquals({
        code: (
          'def x(): \t\n' +
          '    y = \'ab    c\'\n' +
          '    return x\n\n\n'
        )
      }, RULE_INPUT)).toBe(true);
    });

    it('should not change spaces at the start of a line', function() {
      expect(crrs.CodeEquals({
        code: (
          'def x():\n' +
          '  y = \'ab    c\'\n' +
          '    return x'
        )
      }, RULE_INPUT)).toBe(false);
    });

    it('should detect missing newlines', function() {
      expect(crrs.CodeEquals({
        code: (
          'def x():' +
          '    y = \'ab    c\'\n' +
          '    return x'
        )
      }, RULE_INPUT)).toBe(false);
    });

    it('should compare spaces inside quotes', function() {
      expect(crrs.CodeEquals({
        code: (
          'def x():' +
          '    y = \'ab c\'\n' +
          '    return x'
        )
      }, RULE_INPUT)).toBe(false);
    });
  });

  describe('\'code contains\' rule', function() {
    var RULE_INPUT = {
      x: 'def x():'
    };

    it('should check if answer contains some code', function() {
      expect(crrs.CodeContains({
        code: (
          'def x():\n' +
          '    y = \'ab c\'\n' +
          '    return x'
        )
      }, RULE_INPUT)).toBe(true);
      expect(crrs.CodeContains({
        code: '    def x():\n'
      }, RULE_INPUT)).toBe(true);
      expect(crrs.CodeContains({
        code: 'print 0'
      }, RULE_INPUT)).toBe(false);
    });
  });

  describe('\'code does not contain\' rule', function() {
    var RULE_INPUT = {
      x: 'def x():'
    };

    it('should check if answer contains some code', function() {
      expect(crrs.CodeDoesNotContain({
        code: (
          'def x():\n' +
          '    y = \'ab c\'\n' +
          '    return x'
        )
      }, RULE_INPUT)).toBe(false);
      expect(crrs.CodeDoesNotContain({
        code: '    def x():\n'
      }, RULE_INPUT)).toBe(false);
      expect(crrs.CodeDoesNotContain({
        code: 'print 0'
      }, RULE_INPUT)).toBe(true);
    });
  });

  describe('\'output equals\' rule', function() {
    var RULE_INPUT = {
      x: '1'
    };

    it('should compare normalized output', function() {
      expect(crrs.OutputEquals({
        output: '1'
      }, RULE_INPUT)).toBe(true);
      expect(crrs.OutputEquals({
        output: '\n1\n'
      }, RULE_INPUT)).toBe(true);
      expect(crrs.OutputEquals({
        output: ''
      }, RULE_INPUT)).toBe(false);
      expect(crrs.OutputEquals({
        output: 'bad output'
      }, RULE_INPUT)).toBe(false);
    });
  });

  describe('\'results in error\' rule', function() {
    var RULE_INPUT = null;

    it('should check if error is not empty', function() {
      expect(crrs.ResultsInError({
        error: ''
      }, RULE_INPUT)).toBe(false);
      expect(crrs.ResultsInError({
        error: ' \t\n'
      }, RULE_INPUT)).toBe(false);
      expect(crrs.ResultsInError({
        error: 'bad output'
      }, RULE_INPUT)).toBe(true);
    });
  });

  describe('\'error contains\' rule', function() {
    var RULE_INPUT = {
      x: 'bad'
    };

    it('should check if error message appears', function() {
      expect(crrs.ErrorContains({
        error: 'bad'
      }, RULE_INPUT)).toBe(true);
      expect(crrs.ErrorContains({
        error: '  bad  '
      }, RULE_INPUT)).toBe(true);
      expect(crrs.ErrorContains({
        error: 'not bad'
      }, RULE_INPUT)).toBe(true);
      expect(crrs.ErrorContains({
        error: 'error'
      }, RULE_INPUT)).toBe(false);
      expect(crrs.ErrorContains({
        error: 'b a d'
      }, RULE_INPUT)).toBe(false);
      expect(crrs.ErrorContains({
        error: ''
      }, RULE_INPUT)).toBe(false);
    });
  });
});
