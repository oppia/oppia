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
 * @fileoverview Unit tests for Code REPL rules.
 */

describe('Code REPL rules service', function() {
  beforeEach(module('oppia'));

  var crrs = null;
  beforeEach(inject(function($injector) {
    crrs = $injector.get('CodeReplRulesService');
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
        code: 'def x():\n'
      }, RULE_INPUT)).toBe(false);
      expect(crrs.CodeDoesNotContain({
        code: '    def x():\n'
      }, RULE_INPUT)).toBe(false);
      expect(crrs.CodeDoesNotContain({
        code: 'print 0'
      }, RULE_INPUT)).toBe(true);
    });
  });

  describe('\'output contains\' rule', function() {
    var RULE_INPUT = {
      x: '1'
    };

    var RULE_INPUT_1 = {
      x: 'a b c'
    };

    var RULE_INPUT_2 = {
      x: 'a\nb\nc'
    };

    it('should check if output contains some content', function() {
      expect(crrs.OutputContains({
        output: '1 2 3 4'
      }, RULE_INPUT)).toBe(true);
      expect(crrs.OutputContains({
        output: '\n1\n2\n3\n4\n'
      }, RULE_INPUT)).toBe(true);
      expect(crrs.OutputContains({
        output: ''
      }, RULE_INPUT)).toBe(false);
      expect(crrs.OutputContains({
        output: 'bad output'
      }, RULE_INPUT)).toBe(false);
      expect(crrs.OutputContains({
        output: 'a b c d e'
      }, RULE_INPUT_1)).toBe(true);
      expect(crrs.OutputContains({
        output: 'a\nb\nc\nd\n'
      }, RULE_INPUT_1)).toBe(false);
      expect(crrs.OutputContains({
        output: 'ab\nc\n'
      }, RULE_INPUT_1)).toBe(false);
      expect(crrs.OutputContains({
        output: ''
      }, RULE_INPUT_1)).toBe(false);
      expect(crrs.OutputContains({
        output: 'bad output'
      }, RULE_INPUT_1)).toBe(false);
      expect(crrs.OutputContains({
        output: 'a\nb\nc\nd\ne'
      }, RULE_INPUT_2)).toBe(true);
      expect(crrs.OutputContains({
        output: '\nabc\ndef\nfgh\n'
      }, RULE_INPUT_2)).toBe(false);
      expect(crrs.OutputContains({
        output: 'a b c'
      }, RULE_INPUT_2)).toBe(false);
      expect(crrs.OutputContains({
        output: ''
      }, RULE_INPUT_2)).toBe(false);
      expect(crrs.OutputContains({
        output: 'bad output'
      }, RULE_INPUT_2)).toBe(false);
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
