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
 * @fileoverview Unit tests for Fraction Input rules.
 */

describe('Fraction Input rules service', function() {
  beforeEach(module('oppia'));

  var firs = null;
  beforeEach(inject(function($injector) {
    firs = $injector.get('fractionInputRulesService');
  }));

  var createFractionDict = function(wholeNumber, numerator, denominator) {
    return {
      isNegative: false,
      wholeNumber: wholeNumber,
      numerator: numerator,
      denominator: denominator
    }
  };

  var RULE_INPUT = {
    f: {
      isNegative: false,
      wholeNumber: 1,
      numerator: 40,
      denominator: 20
    }
  };

  it('should have a correct \'equivalence\' rule', function() {
    expect(firs.IsEquivalentTo(
      createFractionDict(0, 2, 1), RULE_INPUT)).toBe(false);
    expect(firs.IsEquivalentTo(
      createFractionDict(20, 40, 1), RULE_INPUT)).toBe(false);
    expect(firs.IsEquivalentTo(
      createFractionDict(1, 20, 4), RULE_INPUT)).toBe(false);
    expect(firs.IsEquivalentTo(
      createFractionDict(1, 8, 4), RULE_INPUT)).toBe(true);
    expect(firs.IsEquivalentTo(
      createFractionDict(1, 4, 2), RULE_INPUT)).toBe(true);
    expect(firs.IsEquivalentTo(
      createFractionDict(1, 20, 10), RULE_INPUT)).toBe(true);
    expect(firs.IsEquivalentTo(
      createFractionDict(1, 2, 1), RULE_INPUT)).toBe(true);
  });

  it('should have a correct \'equivalent to and in simplist form\' rule', function() {
    // Equivalent to but not in simplist form.
    expect(firs.IsEquivalentToAndInSimplestForm(
      createFractionDict(1, 40, 20), RULE_INPUT)).toBe(false);
    expect(firs.IsEquivalentToAndInSimplestForm(
      createFractionDict(1, 2, 1), RULE_INPUT)).toBe(true);
    // In simplist form but not equivalent to.
    expect(firs.IsEquivalentToAndInSimplestForm(
      createFractionDict(1, 5, 3), RULE_INPUT)).toBe(false);
  });

  it('should have a correct \'exactly equal to\' rule', function() {
    expect(firs.IsExactlyEqualTo(
      createFractionDict(1, 40, 20), RULE_INPUT)).toBe(true);
    expect(firs.IsExactlyEqualTo(
      createFractionDict(1, 8, 4), RULE_INPUT)).toBe(false);
    expect(firs.IsExactlyEqualTo(
      createFractionDict(1, 4, 2), RULE_INPUT)).toBe(false);
  });

  it('should have a correct \'less than\' rule', function() {
    expect(firs.IsLessThan(
      createFractionDict(1, 37, 20), RULE_INPUT)).toBe(true);
    expect(firs.IsLessThan(
      createFractionDict(1, 8, 4), RULE_INPUT)).toBe(false);
    expect(firs.IsLessThan(
      createFractionDict(1, 16, 2), RULE_INPUT)).toBe(false);
  });

  it('should have a correct \'greater than\' rule', function() {
    expect(firs.IsGreaterThan(
      createFractionDict(1, 49, 20), RULE_INPUT)).toBe(true);
    expect(firs.IsGreaterThan(
      createFractionDict(1, 8, 4), RULE_INPUT)).toBe(false);
    expect(firs.IsGreaterThan(
      createFractionDict(1, 0, 2), RULE_INPUT)).toBe(false);
  });

  it('should have a correct \'has whole number equal to\' rule', function() {
    expect(firs.HasWholeNumberEqualTo(
      createFractionDict(1, 0, 20), RULE_INPUT)).toBe(true);
    expect(firs.HasWholeNumberEqualTo(
      createFractionDict(0, 8, 4), RULE_INPUT)).toBe(false);
    expect(firs.HasWholeNumberEqualTo(
      createFractionDict(2, 0, 2), RULE_INPUT)).toBe(false);
  });

  it('should have a correct \'has numerator equal to\' rule', function() {
    expect(firs.HasNumeratorEqualTo(
      createFractionDict(0, 40, 60), RULE_INPUT)).toBe(true);
    expect(firs.HasNumeratorEqualTo(
      createFractionDict(1, 8, 4), RULE_INPUT)).toBe(false);
    expect(firs.HasNumeratorEqualTo(
      createFractionDict(1, 80, 2), RULE_INPUT)).toBe(false);
  });

  it('should have a correct \'has whole denominator to\' rule', function() {
    expect(firs.HasDenominatorEqualTo(
      createFractionDict(1, 49, 20), RULE_INPUT)).toBe(true);
    expect(firs.HasDenominatorEqualTo(
      createFractionDict(1, 8, 4), RULE_INPUT)).toBe(false);
    expect(firs.HasDenominatorEqualTo(
      createFractionDict(1, 0, 2), RULE_INPUT)).toBe(false);
  });
});
