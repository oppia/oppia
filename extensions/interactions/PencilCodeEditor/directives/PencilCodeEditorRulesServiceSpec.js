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
 * @fileoverview Unit tests for Pencil Code Editor rules.
 */

describe('Pencil Code Editor rules service', function() {
  beforeEach(module('oppia'));

  var pcers = null;
  beforeEach(inject(function($injector) {
    pcers = $injector.get('PencilCodeEditorRulesService');
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
      expect(pcers.CodeEquals({
        code: (
          'def x():\n' +
          '    y = \'ab    c\'\n' +
          '    return x'
        )
      }, RULE_INPUT)).toBe(true);
    });

    it('should remove extra newlines and trailing whitespace', function() {
      // Extra newline with spaces
      expect(pcers.CodeEquals({
        code: (
          'def x():\n' +
          '    y = \'ab    c\'\n' +
          '    \n' +
          '    return x'
        )
      }, RULE_INPUT)).toBe(true);

      // Extra trailing whitespace on first line
      expect(pcers.CodeEquals({
        code: (
          'def x():        \n' +
          '    y = \'ab    c\'\n' +
          '    return x'
        )
      }, RULE_INPUT)).toBe(true);

      // Tab character
      expect(pcers.CodeEquals({
        code: (
          'def x(): \t\n' +
          '    y = \'ab    c\'\n' +
          '    return x\n\n\n'
        )
      }, RULE_INPUT)).toBe(true);
    });

    it('should not change spaces at the start of a line', function() {
      expect(pcers.CodeEquals({
        code: (
          'def x():\n' +
          '  y = \'ab    c\'\n' +
          '    return x'
        )
      }, RULE_INPUT)).toBe(false);
    });

    it('should detect missing newlines', function() {
      expect(pcers.CodeEquals({
        code: (
          'def x():' +
          '    y = \'ab    c\'\n' +
          '    return x'
        )
      }, RULE_INPUT)).toBe(false);
    });

    it('should compare spaces inside quotes', function() {
      expect(pcers.CodeEquals({
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
      expect(pcers.CodeContains({
        code: (
          'def x():\n' +
          '    y = \'ab c\'\n' +
          '    return x'
        )
      }, RULE_INPUT)).toBe(true);
      expect(pcers.CodeContains({
        code: '    def x():\n'
      }, RULE_INPUT)).toBe(true);
      expect(pcers.CodeContains({
        code: 'print 0'
      }, RULE_INPUT)).toBe(false);
    });
  });

  describe('\'code does not contain\' rule', function() {
    var RULE_INPUT = {
      x: 'def x():'
    };

    it('should check if answer contains some code', function() {
      expect(pcers.CodeDoesNotContain({
        code: (
          'def x():\n' +
          '    y = \'ab c\'\n' +
          '    return x'
        )
      }, RULE_INPUT)).toBe(false);
      expect(pcers.CodeDoesNotContain({
        code: '    def x():\n'
      }, RULE_INPUT)).toBe(false);
      expect(pcers.CodeDoesNotContain({
        code: 'print 0'
      }, RULE_INPUT)).toBe(true);
    });
  });

  describe('\'output equals\' rule', function() {
    var RULE_INPUT = {
      x: '1'
    };

    it('should compare normalized output', function() {
      expect(pcers.OutputEquals({
        output: '1'
      }, RULE_INPUT)).toBe(true);
      expect(pcers.OutputEquals({
        output: '\n1\n'
      }, RULE_INPUT)).toBe(true);
      expect(pcers.OutputEquals({
        output: ''
      }, RULE_INPUT)).toBe(false);
      expect(pcers.OutputEquals({
        output: 'bad output'
      }, RULE_INPUT)).toBe(false);
    });
  });

  describe('\'output roughly equals\' rule', function() {
    var RULE_INPUT = {
      x: '1\n      a W ? b\n'
    };

    it('should compare normalized output', function() {
      expect(pcers.OutputRoughlyEquals({
        output: '1\n   a   W ?   b'
      }, RULE_INPUT)).toBe(true);
      expect(pcers.OutputRoughlyEquals({
        output: '\n1\na  w?B'
      }, RULE_INPUT)).toBe(true);
      expect(pcers.OutputRoughlyEquals({
        output: '   1\n\na w?b    \n\n\n'
      }, RULE_INPUT)).toBe(true);

      expect(pcers.OutputRoughlyEquals({
        output: '1 a w ? b'
      }, RULE_INPUT)).toBe(false);
      expect(pcers.OutputRoughlyEquals({
        output: '1 \n a w b'
      }, RULE_INPUT)).toBe(false);
      expect(pcers.OutputRoughlyEquals({
        output: 'b ? w a \n 1'
      }, RULE_INPUT)).toBe(false);
      expect(pcers.OutputRoughlyEquals({
        output: 'bad output'
      }, RULE_INPUT)).toBe(false);
    });
  });

  describe('\'results in error\' rule', function() {
    var RULE_INPUT = null;

    it('should check if error is not empty', function() {
      expect(pcers.ResultsInError({
        error: ''
      }, RULE_INPUT)).toBe(false);
      expect(pcers.ResultsInError({
        error: ' \t\n'
      }, RULE_INPUT)).toBe(false);
      expect(pcers.ResultsInError({
        error: 'bad output'
      }, RULE_INPUT)).toBe(true);
    });
  });

  describe('\'error contains\' rule', function() {
    var RULE_INPUT = {
      x: 'bad'
    };

    it('should check if error message appears', function() {
      expect(pcers.ErrorContains({
        error: 'bad'
      }, RULE_INPUT)).toBe(true);
      expect(pcers.ErrorContains({
        error: '  bad  '
      }, RULE_INPUT)).toBe(true);
      expect(pcers.ErrorContains({
        error: 'not bad'
      }, RULE_INPUT)).toBe(true);
      expect(pcers.ErrorContains({
        error: 'error'
      }, RULE_INPUT)).toBe(false);
      expect(pcers.ErrorContains({
        error: 'b a d'
      }, RULE_INPUT)).toBe(false);
      expect(pcers.ErrorContains({
        error: ''
      }, RULE_INPUT)).toBe(false);
    });
  });
});
