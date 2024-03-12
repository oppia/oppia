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

import {TestBed} from '@angular/core/testing';

import {CodeReplRulesService} from 'interactions/CodeRepl/directives/code-repl-rules.service';
import {NormalizeWhitespacePipe} from 'filters/string-utility-filters/normalize-whitespace.pipe';
import {CodeReplAnswer} from 'interactions/answer-defs';

describe('Code REPL rules service', () => {
  let crrs: CodeReplRulesService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NormalizeWhitespacePipe],
    });
    crrs = TestBed.get(CodeReplRulesService);
  });

  describe("'equals' rule", () => {
    var RULE_INPUT = {
      x: 'def x():\n' + "    y = 'ab    c'\n" + '    return x',
    };

    it('should accept the same code', () => {
      expect(
        crrs.CodeEquals(
          {
            code: 'def x():\n' + "    y = 'ab    c'\n" + '    return x',
          } as CodeReplAnswer,
          RULE_INPUT
        )
      ).toBe(true);
    });

    it('should remove extra newlines and trailing whitespace', () => {
      // Extra newline with spaces.
      expect(
        crrs.CodeEquals(
          {
            code:
              'def x():\n' + "    y = 'ab    c'\n" + '    \n' + '    return x',
          } as CodeReplAnswer,
          RULE_INPUT
        )
      ).toBe(true);

      // Extra trailing whitespace on first line.
      expect(
        crrs.CodeEquals(
          {
            code: 'def x():        \n' + "    y = 'ab    c'\n" + '    return x',
          } as CodeReplAnswer,
          RULE_INPUT
        )
      ).toBe(true);

      // ---- Tab character ----
      expect(
        crrs.CodeEquals(
          {
            code:
              'def x(): \t\n' + "    y = 'ab    c'\n" + '    return x\n\n\n',
          } as CodeReplAnswer,
          RULE_INPUT
        )
      ).toBe(true);
    });

    it('should not change spaces at the start of a line', () => {
      expect(
        crrs.CodeEquals(
          {
            code: 'def x():\n' + "  y = 'ab    c'\n" + '    return x',
          } as CodeReplAnswer,
          RULE_INPUT
        )
      ).toBe(false);
    });

    it('should detect missing newlines', () => {
      expect(
        crrs.CodeEquals(
          {
            code: 'def x():' + "    y = 'ab    c'\n" + '    return x',
          } as CodeReplAnswer,
          RULE_INPUT
        )
      ).toBe(false);
    });

    it('should compare spaces inside quotes', () => {
      expect(
        crrs.CodeEquals(
          {
            code: 'def x():' + "    y = 'ab c'\n" + '    return x',
          } as CodeReplAnswer,
          RULE_INPUT
        )
      ).toBe(false);
    });
  });

  describe("'code contains' rule", () => {
    var RULE_INPUT = {
      x: 'def x():',
    };

    it('should check if answer contains some code', () => {
      expect(
        crrs.CodeContains(
          {
            code: 'def x():\n' + "    y = 'ab c'\n" + '    return x',
          } as CodeReplAnswer,
          RULE_INPUT
        )
      ).toBe(true);
      expect(
        crrs.CodeContains(
          {
            code: '    def x():\n',
          } as CodeReplAnswer,
          RULE_INPUT
        )
      ).toBe(true);
      expect(
        crrs.CodeContains(
          {
            code: 'print 0',
          } as CodeReplAnswer,
          RULE_INPUT
        )
      ).toBe(false);
    });
  });

  describe("'code does not contain' rule", () => {
    var RULE_INPUT = {
      x: 'def x():',
    };

    it('should check if answer contains some code', () => {
      expect(
        crrs.CodeDoesNotContain(
          {
            code: 'def x():\n' + "    y = 'ab c'\n" + '    return x',
          } as CodeReplAnswer,
          RULE_INPUT
        )
      ).toBe(false);
      expect(
        crrs.CodeDoesNotContain(
          {
            code: 'def x():\n',
          } as CodeReplAnswer,
          RULE_INPUT
        )
      ).toBe(false);
      expect(
        crrs.CodeDoesNotContain(
          {
            code: '    def x():\n',
          } as CodeReplAnswer,
          RULE_INPUT
        )
      ).toBe(false);
      expect(
        crrs.CodeDoesNotContain(
          {
            code: 'print 0',
          } as CodeReplAnswer,
          RULE_INPUT
        )
      ).toBe(true);
    });
  });

  describe("'output contains' rule", () => {
    var RULE_INPUT = {
      x: '1',
    };

    var RULE_INPUT_1 = {
      x: 'a b c',
    };

    var RULE_INPUT_2 = {
      x: 'a\nb\nc',
    };

    it('should check if output contains some content', () => {
      expect(
        crrs.OutputContains(
          {
            output: '1 2 3 4',
          } as CodeReplAnswer,
          RULE_INPUT
        )
      ).toBe(true);
      expect(
        crrs.OutputContains(
          {
            output: '\n1\n2\n3\n4\n',
          } as CodeReplAnswer,
          RULE_INPUT
        )
      ).toBe(true);
      expect(
        crrs.OutputContains(
          {
            output: '',
          } as CodeReplAnswer,
          RULE_INPUT
        )
      ).toBe(false);
      expect(
        crrs.OutputContains(
          {
            output: 'bad output',
          } as CodeReplAnswer,
          RULE_INPUT
        )
      ).toBe(false);
      expect(
        crrs.OutputContains(
          {
            output: 'a b c d e',
          } as CodeReplAnswer,
          RULE_INPUT_1
        )
      ).toBe(true);
      expect(
        crrs.OutputContains(
          {
            output: 'a\nb\nc\nd\n',
          } as CodeReplAnswer,
          RULE_INPUT_1
        )
      ).toBe(false);
      expect(
        crrs.OutputContains(
          {
            output: 'ab\nc\n',
          } as CodeReplAnswer,
          RULE_INPUT_1
        )
      ).toBe(false);
      expect(
        crrs.OutputContains(
          {
            output: '',
          } as CodeReplAnswer,
          RULE_INPUT_1
        )
      ).toBe(false);
      expect(
        crrs.OutputContains(
          {
            output: 'bad output',
          } as CodeReplAnswer,
          RULE_INPUT_1
        )
      ).toBe(false);
      expect(
        crrs.OutputContains(
          {
            output: 'a\nb\nc\nd\ne',
          } as CodeReplAnswer,
          RULE_INPUT_2
        )
      ).toBe(true);
      expect(
        crrs.OutputContains(
          {
            output: '\nabc\ndef\nfgh\n',
          } as CodeReplAnswer,
          RULE_INPUT_2
        )
      ).toBe(false);
      expect(
        crrs.OutputContains(
          {
            output: 'a b c',
          } as CodeReplAnswer,
          RULE_INPUT_2
        )
      ).toBe(false);
      expect(
        crrs.OutputContains(
          {
            output: '',
          } as CodeReplAnswer,
          RULE_INPUT_2
        )
      ).toBe(false);
      expect(
        crrs.OutputContains(
          {
            output: 'bad output',
          } as CodeReplAnswer,
          RULE_INPUT_2
        )
      ).toBe(false);
    });
  });

  describe("'output equals' rule", () => {
    var RULE_INPUT = {
      x: '1',
    };

    it('should compare normalized output', () => {
      expect(
        crrs.OutputEquals(
          {
            output: '1',
          } as CodeReplAnswer,
          RULE_INPUT
        )
      ).toBe(true);
      expect(
        crrs.OutputEquals(
          {
            output: '\n1\n',
          } as CodeReplAnswer,
          RULE_INPUT
        )
      ).toBe(true);
      expect(
        crrs.OutputEquals(
          {
            output: '',
          } as CodeReplAnswer,
          RULE_INPUT
        )
      ).toBe(false);
      expect(
        crrs.OutputEquals(
          {
            output: 'bad output',
          } as CodeReplAnswer,
          RULE_INPUT
        )
      ).toBe(false);
    });
  });

  describe("'results in error' rule", () => {
    it('should check if error is not empty', () => {
      expect(
        crrs.ResultsInError({
          error: '',
        } as CodeReplAnswer)
      ).toBe(false);
      expect(
        crrs.ResultsInError({
          error: ' \t\n',
        } as CodeReplAnswer)
      ).toBe(false);
      expect(
        crrs.ResultsInError({
          error: 'bad output',
        } as CodeReplAnswer)
      ).toBe(true);
    });
  });

  describe("'error contains' rule", () => {
    var RULE_INPUT = {
      x: 'bad',
    };

    it('should check if error message appears', () => {
      expect(
        crrs.ErrorContains(
          {
            error: 'bad',
          } as CodeReplAnswer,
          RULE_INPUT
        )
      ).toBe(true);
      expect(
        crrs.ErrorContains(
          {
            error: '  bad  ',
          } as CodeReplAnswer,
          RULE_INPUT
        )
      ).toBe(true);
      expect(
        crrs.ErrorContains(
          {
            error: 'not bad',
          } as CodeReplAnswer,
          RULE_INPUT
        )
      ).toBe(true);
      expect(
        crrs.ErrorContains(
          {
            error: 'error',
          } as CodeReplAnswer,
          RULE_INPUT
        )
      ).toBe(false);
      expect(
        crrs.ErrorContains(
          {
            error: 'b a d',
          } as CodeReplAnswer,
          RULE_INPUT
        )
      ).toBe(false);
      expect(
        crrs.ErrorContains(
          {
            error: '',
          } as CodeReplAnswer,
          RULE_INPUT
        )
      ).toBe(false);
    });
  });
});
