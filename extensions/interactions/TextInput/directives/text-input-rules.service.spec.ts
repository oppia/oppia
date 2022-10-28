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
 * @fileoverview Unit tests for Text Input rules.
 */

import { TestBed } from '@angular/core/testing';

import { NormalizeWhitespacePipe } from
  'filters/string-utility-filters/normalize-whitespace.pipe';
import { TextInputRuleInputs } from 'interactions/rule-input-defs';
import { TextInputRulesService } from
  'interactions/TextInput/directives/text-input-rules.service';

describe('Text Input rules service', () => {
  let tirs: TextInputRulesService;

  let RULE_INPUT: TextInputRuleInputs;
  let RULE_INPUT_PLURAL: TextInputRuleInputs;
  let RULE_INPUT_EMPTY: TextInputRuleInputs;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NormalizeWhitespacePipe]
    });
    tirs = TestBed.get(TextInputRulesService);

    RULE_INPUT = {
      x: {
        contentId: 'rule_input',
        normalizedStrSet: ['abc def']
      },
      contentId: null
    };

    RULE_INPUT_PLURAL = {
      x: {
        contentId: 'rule_input',
        normalizedStrSet: ['testing', 'abc def']
      },
      contentId: null
    };

    RULE_INPUT_EMPTY = {
      x: {
        contentId: 'rule_input',
        normalizedStrSet: []
      },
      contentId: null
    };
  });

  it('should have a correct \'equals\' rule', () => {
    expect(tirs.Equals('abc def', RULE_INPUT_EMPTY)).toBe(false);

    expect(tirs.Equals('abc def', RULE_INPUT)).toBe(true);
    expect(tirs.Equals('ABC def', RULE_INPUT)).toBe(true);
    expect(tirs.Equals('abc DeF', RULE_INPUT)).toBe(true);
    expect(tirs.Equals(' abc   DeF ', RULE_INPUT)).toBe(true);
    expect(tirs.Equals('', RULE_INPUT)).toBe(false);
    expect(tirs.Equals('abc', RULE_INPUT)).toBe(false);

    expect(tirs.Equals('abc def', RULE_INPUT_PLURAL)).toBe(true);
    expect(tirs.Equals('ABC def', RULE_INPUT_PLURAL)).toBe(true);
    expect(tirs.Equals('abc DeF', RULE_INPUT_PLURAL)).toBe(true);
    expect(tirs.Equals(' abc   DeF ', RULE_INPUT_PLURAL)).toBe(true);
    expect(tirs.Equals('', RULE_INPUT_PLURAL)).toBe(false);
    expect(tirs.Equals('abc', RULE_INPUT_PLURAL)).toBe(false);
  });

  it('should have a correct \'fuzzy equals\' rule', () => {
    expect(tirs.Equals('abc def', RULE_INPUT_EMPTY)).toBe(false);

    expect(tirs.FuzzyEquals('ABC DEF', RULE_INPUT)).toBe(true);
    expect(tirs.FuzzyEquals('abc def', RULE_INPUT)).toBe(true);
    expect(tirs.FuzzyEquals('acc def', RULE_INPUT)).toBe(true);
    expect(tirs.FuzzyEquals('ab def', RULE_INPUT)).toBe(true);
    expect(tirs.FuzzyEquals('cbc def', RULE_INPUT)).toBe(true);
    expect(tirs.FuzzyEquals('abcd def', RULE_INPUT)).toBe(true);
    expect(tirs.FuzzyEquals('abc defg', RULE_INPUT)).toBe(true);
    expect(tirs.FuzzyEquals('aBC DEfg', RULE_INPUT)).toBe(true);
    expect(tirs.FuzzyEquals('aabc def', RULE_INPUT)).toBe(true);
    expect(tirs.FuzzyEquals(' aBC  DEfg  ', RULE_INPUT)).toBe(true);
    expect(tirs.FuzzyEquals('abc', RULE_INPUT)).toBe(false);
    expect(tirs.FuzzyEquals('dbc deg', RULE_INPUT)).toBe(false);
    expect(tirs.FuzzyEquals('ghi jkl', RULE_INPUT)).toBe(false);

    expect(tirs.FuzzyEquals('ABC DEF', RULE_INPUT_PLURAL)).toBe(true);
    expect(tirs.FuzzyEquals('abc def', RULE_INPUT_PLURAL)).toBe(true);
    expect(tirs.FuzzyEquals('acc def', RULE_INPUT_PLURAL)).toBe(true);
    expect(tirs.FuzzyEquals('ab def', RULE_INPUT_PLURAL)).toBe(true);
    expect(tirs.FuzzyEquals('cbc def', RULE_INPUT_PLURAL)).toBe(true);
    expect(tirs.FuzzyEquals('abcd def', RULE_INPUT_PLURAL)).toBe(true);
    expect(tirs.FuzzyEquals('abc defg', RULE_INPUT_PLURAL)).toBe(true);
    expect(tirs.FuzzyEquals('aBC DEfg', RULE_INPUT_PLURAL)).toBe(true);
    expect(tirs.FuzzyEquals('aabc def', RULE_INPUT_PLURAL)).toBe(true);
    expect(tirs.FuzzyEquals(' aBC  DEfg  ', RULE_INPUT_PLURAL)).toBe(true);
    expect(tirs.FuzzyEquals('abc', RULE_INPUT_PLURAL)).toBe(false);
    expect(tirs.FuzzyEquals('dbc deg', RULE_INPUT_PLURAL)).toBe(false);
    expect(tirs.FuzzyEquals('ghi jkl', RULE_INPUT_PLURAL)).toBe(false);
  });

  it('should have a correct \'starts with\' rule', () => {
    expect(tirs.Equals('abc def', RULE_INPUT_EMPTY)).toBe(false);

    expect(tirs.StartsWith('  ABC  DEFGHI', RULE_INPUT)).toBe(true);
    expect(tirs.StartsWith('abc defghi', RULE_INPUT)).toBe(true);
    expect(tirs.StartsWith('ABC DEFGHI', RULE_INPUT)).toBe(true);
    expect(tirs.StartsWith('abc def', RULE_INPUT)).toBe(true);
    expect(tirs.StartsWith('fabc defghi', RULE_INPUT)).toBe(false);
    expect(tirs.StartsWith('cde', RULE_INPUT)).toBe(false);

    expect(tirs.StartsWith('  ABC  DEFGHI', RULE_INPUT_PLURAL)).toBe(true);
    expect(tirs.StartsWith('abc defghi', RULE_INPUT_PLURAL)).toBe(true);
    expect(tirs.StartsWith('ABC DEFGHI', RULE_INPUT_PLURAL)).toBe(true);
    expect(tirs.StartsWith('abc def', RULE_INPUT_PLURAL)).toBe(true);
    expect(tirs.StartsWith('fabc defghi', RULE_INPUT_PLURAL)).toBe(false);
    expect(tirs.StartsWith('cde', RULE_INPUT_PLURAL)).toBe(false);
  });

  it('should have a correct \'contains\' rule', () => {
    expect(tirs.Equals('abc def', RULE_INPUT_EMPTY)).toBe(false);

    expect(tirs.Contains(' abc  def', RULE_INPUT)).toBe(true);
    expect(tirs.Contains('abc def', RULE_INPUT)).toBe(true);
    expect(tirs.Contains('ghabc defjk', RULE_INPUT)).toBe(true);
    expect(tirs.Contains('GHABC DEFJK', RULE_INPUT)).toBe(true);
    expect(tirs.Contains('abcdef', RULE_INPUT)).toBe(false);
    expect(tirs.Contains('fabcd', RULE_INPUT)).toBe(false);
    expect(tirs.Contains('ab', RULE_INPUT)).toBe(false);

    expect(tirs.Contains(' abc  def', RULE_INPUT_PLURAL)).toBe(true);
    expect(tirs.Contains('abc def', RULE_INPUT_PLURAL)).toBe(true);
    expect(tirs.Contains('ghabc defjk', RULE_INPUT_PLURAL)).toBe(true);
    expect(tirs.Contains('GHABC DEFJK', RULE_INPUT_PLURAL)).toBe(true);
    expect(tirs.Contains('abcdef', RULE_INPUT_PLURAL)).toBe(false);
    expect(tirs.Contains('fabcd', RULE_INPUT_PLURAL)).toBe(false);
    expect(tirs.Contains('ab', RULE_INPUT_PLURAL)).toBe(false);
  });
});
