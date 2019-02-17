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

describe('Text Input rules service', function() {
  beforeEach(module('oppia'));

  var tirs = null;
  beforeEach(inject(function($injector) {
    tirs = $injector.get('TextInputRulesService');
  }));

  var RULE_INPUT = {
    x: 'abc def'
  };

  it('should have a correct \'equals\' rule', function() {
    expect(tirs.Equals('abc def', RULE_INPUT)).toBe(true);
    expect(tirs.Equals('ABC def', RULE_INPUT)).toBe(true);
    expect(tirs.Equals('abc DeF', RULE_INPUT)).toBe(true);
    expect(tirs.Equals(' abc   DeF ', RULE_INPUT)).toBe(true);
    expect(tirs.Equals('', RULE_INPUT)).toBe(false);
    expect(tirs.Equals('abc', RULE_INPUT)).toBe(false);
  });

  it('should have a correct \'fuzzy equals\' rule', function() {
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
  });

  it('should have a correct \'case sensitive equals\' rule', function() {
    expect(tirs.CaseSensitiveEquals('abc def', RULE_INPUT)).toBe(true);
    expect(tirs.CaseSensitiveEquals('abc   def ', RULE_INPUT)).toBe(true);
    expect(tirs.CaseSensitiveEquals('ABC def', RULE_INPUT)).toBe(false);
    expect(tirs.CaseSensitiveEquals('abc DeF', RULE_INPUT)).toBe(false);
    expect(tirs.CaseSensitiveEquals('', RULE_INPUT)).toBe(false);
    expect(tirs.CaseSensitiveEquals('abc', RULE_INPUT)).toBe(false);
  });

  it('should have a correct \'starts with\' rule', function() {
    expect(tirs.StartsWith('  ABC  DEFGHI', RULE_INPUT)).toBe(true);
    expect(tirs.StartsWith('abc defghi', RULE_INPUT)).toBe(true);
    expect(tirs.StartsWith('ABC DEFGHI', RULE_INPUT)).toBe(true);
    expect(tirs.StartsWith('abc def', RULE_INPUT)).toBe(true);
    expect(tirs.StartsWith('fabc defghi', RULE_INPUT)).toBe(false);
    expect(tirs.StartsWith('cde', RULE_INPUT)).toBe(false);
  });

  it('should have a correct \'contains\' rule', function() {
    expect(tirs.Contains(' abc  def', RULE_INPUT)).toBe(true);
    expect(tirs.Contains('abc def', RULE_INPUT)).toBe(true);
    expect(tirs.Contains('ghabc defjk', RULE_INPUT)).toBe(true);
    expect(tirs.Contains('GHABC DEFJK', RULE_INPUT)).toBe(true);
    expect(tirs.Contains('abcdef', RULE_INPUT)).toBe(false);
    expect(tirs.Contains('fabcd', RULE_INPUT)).toBe(false);
    expect(tirs.Contains('ab', RULE_INPUT)).toBe(false);
  });
});
