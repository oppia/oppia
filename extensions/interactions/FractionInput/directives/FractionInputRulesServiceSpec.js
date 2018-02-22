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

  var createNegativeFractionDict = function(
      wholeNumber, numerator, denominator) {
    return {
      isNegative: true,
      wholeNumber: wholeNumber,
      numerator: numerator,
      denominator: denominator
    };
  };

  var createPositiveFractionDict = function(
      wholeNumber, numerator, denominator) {
    return {
      isNegative: false,
      wholeNumber: wholeNumber,
      numerator: numerator,
      denominator: denominator
    };
  };

  var RULE_INPUT = {
    f: {
      isNegative: false,
      wholeNumber: 1,
      numerator: 40,
      denominator: 20
    }
  };

  var INTEGER_RULE_INPUT = {
    x: 20
  };

  var FRACTIONAL_RULE_INPUT = {
    f: {
      isNegative: false,
      wholeNumber: 0,
      numerator: 2,
      denominator: 4
    }
  };

  it('should have a correct \'equivalence\' rule', function() {
    expect(firs.IsEquivalentTo(
      createNegativeFractionDict(1, 8, 4), RULE_INPUT)).toBe(false);
    expect(firs.IsEquivalentTo(
      createPositiveFractionDict(0, 2, 1), RULE_INPUT)).toBe(false);
    expect(firs.IsEquivalentTo(
      createPositiveFractionDict(20, 40, 1), RULE_INPUT)).toBe(false);
    expect(firs.IsEquivalentTo(
      createPositiveFractionDict(1, 20, 4), RULE_INPUT)).toBe(false);
    expect(firs.IsEquivalentTo(
      createPositiveFractionDict(1, 8, 4), RULE_INPUT)).toBe(true);
    expect(firs.IsEquivalentTo(
      createPositiveFractionDict(1, 4, 2), RULE_INPUT)).toBe(true);
    expect(firs.IsEquivalentTo(
      createPositiveFractionDict(1, 20, 10), RULE_INPUT)).toBe(true);
    expect(firs.IsEquivalentTo(
      createPositiveFractionDict(1, 2, 1), RULE_INPUT)).toBe(true);
  });

  it('should have a correct \'equivalent to and in simplest form\' rule',
    function() {
      expect(firs.IsEquivalentToAndInSimplestForm(
        createPositiveFractionDict(1, 2, 1), RULE_INPUT)).toBe(true);
      // Equivalent to but not in simplest form.
      expect(firs.IsEquivalentToAndInSimplestForm(
        createPositiveFractionDict(1, 40, 20), RULE_INPUT)).toBe(false);
      // In simplest form but not equivalent to.
      expect(firs.IsEquivalentToAndInSimplestForm(
        createNegativeFractionDict(1, 2, 1), RULE_INPUT)).toBe(false);
      expect(firs.IsEquivalentToAndInSimplestForm(
        createPositiveFractionDict(1, 5, 3), RULE_INPUT)).toBe(false);
    });

  it('should have a correct \'exactly equal to\' rule', function() {
    expect(firs.IsExactlyEqualTo(
      createPositiveFractionDict(1, 40, 20), RULE_INPUT)).toBe(true);
    expect(firs.IsExactlyEqualTo(
      createPositiveFractionDict(1, 8, 4), RULE_INPUT)).toBe(false);
    expect(firs.IsExactlyEqualTo(
      createPositiveFractionDict(1, 4, 2), RULE_INPUT)).toBe(false);
  });

  it('should have a correct \'less than\' rule', function() {
    expect(firs.IsLessThan(
      createPositiveFractionDict(1, 37, 20), RULE_INPUT)).toBe(true);
    expect(firs.IsLessThan(
      createPositiveFractionDict(1, 8, 4), RULE_INPUT)).toBe(false);
    expect(firs.IsLessThan(
      createPositiveFractionDict(1, 16, 2), RULE_INPUT)).toBe(false);
  });

  it('should have a correct \'greater than\' rule', function() {
    expect(firs.IsGreaterThan(
      createPositiveFractionDict(1, 49, 20), RULE_INPUT)).toBe(true);
    expect(firs.IsGreaterThan(
      createPositiveFractionDict(1, 8, 4), RULE_INPUT)).toBe(false);
    expect(firs.IsGreaterThan(
      createPositiveFractionDict(1, 0, 2), RULE_INPUT)).toBe(false);
  });

  it('should have a correct \'has integer part equal to\' rule', function() {
    expect(firs.HasIntegerPartEqualTo(
      createPositiveFractionDict(20, 0, 20), INTEGER_RULE_INPUT)).toBe(
      true);
    expect(firs.HasIntegerPartEqualTo(
      createPositiveFractionDict(0, 8, 4), INTEGER_RULE_INPUT)).toBe(
      false);
    expect(firs.HasIntegerPartEqualTo(
      createPositiveFractionDict(2, 0, 2), INTEGER_RULE_INPUT)).toBe(
      false);
    expect(firs.HasIntegerPartEqualTo(
      createNegativeFractionDict(20, 0, 2), INTEGER_RULE_INPUT)).toBe(
      false);
  });

  it('should have a correct \'has numerator equal to\' rule', function() {
    expect(firs.HasNumeratorEqualTo(
      createPositiveFractionDict(0, 20, 60), INTEGER_RULE_INPUT)).toBe(
      true);
    expect(firs.HasNumeratorEqualTo(
      createPositiveFractionDict(1, 8, 4), INTEGER_RULE_INPUT)).toBe(
      false);
    expect(firs.HasNumeratorEqualTo(
      createPositiveFractionDict(1, 80, 2), INTEGER_RULE_INPUT)).toBe(
      false);
  });

  it('should have a correct \'has denominator equal to\' rule', function() {
    expect(firs.HasDenominatorEqualTo(
      createPositiveFractionDict(1, 49, 20), INTEGER_RULE_INPUT)).toBe(
      true);
    expect(firs.HasDenominatorEqualTo(
      createPositiveFractionDict(1, 8, 4), INTEGER_RULE_INPUT)).toBe(
      false);
    expect(firs.HasDenominatorEqualTo(
      createPositiveFractionDict(1, 0, 2), INTEGER_RULE_INPUT)).toBe(
      false);
  });

  it('should check if the fraction is a whole number', function() {
    expect(firs.HasNoFractionalPart(
      createPositiveFractionDict(0, 0, 1))).toBe(true);
    expect(firs.HasNoFractionalPart(
      createPositiveFractionDict(1, 0, 1))).toBe(true);
    expect(firs.HasNoFractionalPart(
      createPositiveFractionDict(1, 8, 4))).toBe(false);
  });

  it('should check if \'fractional part is exactly equal\' rule', function() {
    expect(firs.HasFractionalPartExactlyEqualTo(
      createPositiveFractionDict(1, 1, 2), FRACTIONAL_RULE_INPUT)).toBe(false);
    expect(firs.HasFractionalPartExactlyEqualTo(
      createPositiveFractionDict(1, 2, 4), FRACTIONAL_RULE_INPUT)).toBe(true);
    expect(firs.HasFractionalPartExactlyEqualTo(
      createPositiveFractionDict(1, 5, 6), FRACTIONAL_RULE_INPUT)).toBe(false);
    expect(firs.HasFractionalPartExactlyEqualTo(
      createPositiveFractionDict(6, 2, 4), FRACTIONAL_RULE_INPUT)).toBe(true);
  });
});
