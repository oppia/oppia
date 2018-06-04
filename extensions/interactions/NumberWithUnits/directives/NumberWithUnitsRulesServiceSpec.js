// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for Number with Units rules.
 */

describe('Number with Units rules service', function() {
  beforeEach(module('oppia'));

  var nurs = null;
  beforeEach(inject(function($injector) {
    nurs = $injector.get('numberWithUnitsRulesService');
  }));

  var createFractionDict = function(
      isNegative, wholeNumber, numerator, denominator) {
    return {
      isNegative: isNegative,
      wholeNumber: wholeNumber,
      numerator: numerator,
      denominator: denominator
    };
  };

  var createUnitsDict = function(unitDict) {
    return {
      units: unitDict
    };
  };

  var createNumberWithUnitsDict = function(
      type, real, fractionDict, unitDict) {
    return {
      type: type,
      real: real,
      fraction: fractionDict,
      units: unitDict
    };
  };

  var REAL_RULE_INPUT = {
    f: createNumberWithUnitsDict('real', 2, createFractionDict(
      false, 0, 0, 1), createUnitsDict({kg: 1, m: -2}))
  };

  var FRACTION_RULE_INPUT = {
    f: createNumberWithUnitsDict('fraction', 0, createFractionDict(
      false, 0, 2, 3), createUnitsDict({kg: 1, m: -2}))
  };

  it('should have a correct \'equal to\' rule', function() {
    expect(nurs.IsEqualTo(createNumberWithUnitsDict(
      'real', 2.5, createFractionDict(false, 0, 0, 1), createUnitsDict(
        {kg: 1, m: -2})), REAL_RULE_INPUT)).toBe(false);
    expect(nurs.IsEqualTo(createNumberWithUnitsDict(
      'real', 2, createFractionDict(false, 0, 0, 1), createUnitsDict(
        {g: 1, m: -2})), REAL_RULE_INPUT)).toBe(false);
    expect(nurs.IsEqualTo(createNumberWithUnitsDict(
      'fraction', 0, createFractionDict(false, 0, 6, 3), createUnitsDict(
        {kg: 1, m: -2})), REAL_RULE_INPUT)).toBe(false);
    expect(nurs.IsEqualTo(createNumberWithUnitsDict(
      'real', 2, createFractionDict(false, 0, 0, 1), createUnitsDict(
        {kg: 1, m: 2})), REAL_RULE_INPUT)).toBe(false);
    expect(nurs.IsEqualTo(createNumberWithUnitsDict(
      'real', 2, createFractionDict(false, 0, 0, 1), createUnitsDict(
        {kg: 1, m: -2})), REAL_RULE_INPUT)).toBe(true);
    expect(nurs.IsEqualTo(createNumberWithUnitsDict(
      'fraction', 0, createFractionDict(false, 0, 2, 3), createUnitsDict(
        {kg: 1, m: -2})), FRACTION_RULE_INPUT)).toBe(true);
    expect(nurs.IsEqualTo(createNumberWithUnitsDict(
      'fraction', 0, createFractionDict(false, 0, 20, 30), createUnitsDict(
        {kg: 1, m: -2})), FRACTION_RULE_INPUT)).toBe(false);
    expect(nurs.IsEqualTo(createNumberWithUnitsDict(
      'fraction', 0, createFractionDict(false, 0, 2, 3), createUnitsDict(
        {kg: 1, m: 2})), FRACTION_RULE_INPUT)).toBe(false);
  });

  it('should have a correct \'equivalent to\' rule', function() {
    expect(nurs.IsEquivalentTo(createNumberWithUnitsDict(
      'real', 2, createFractionDict(false, 0, 0, 1), createUnitsDict(
        {kg: 1, m: 2})), REAL_RULE_INPUT)).toBe(false);
    expect(nurs.IsEquivalentTo(createNumberWithUnitsDict(
      'real', 2, createFractionDict(false, 0, 0, 1), createUnitsDict(
        {kg: 1, m: -2})), REAL_RULE_INPUT)).toBe(true);
    expect(nurs.IsEquivalentTo(createNumberWithUnitsDict(
      'real', 2000, createFractionDict(false, 0, 0, 1), createUnitsDict(
        {g: 1, m: -2})), REAL_RULE_INPUT)).toBe(true);
    expect(nurs.IsEquivalentTo(createNumberWithUnitsDict(
      'real', 0.2, createFractionDict(false, 0, 0, 1), createUnitsDict(
        {g: 1, cm: -2})), REAL_RULE_INPUT)).toBe(true);
    expect(nurs.IsEquivalentTo(createNumberWithUnitsDict(
      'fraction', 0, createFractionDict(false, 0, 4, 2), createUnitsDict(
        {kg: 1, m: -2})), REAL_RULE_INPUT)).toBe(true);
    expect(nurs.IsEquivalentTo(createNumberWithUnitsDict(
      'fraction', 0, createFractionDict(false, 0, 20, 30), createUnitsDict(
        {kg: 1, m: -2})), FRACTION_RULE_INPUT)).toBe(true);
    expect(nurs.IsEquivalentTo(createNumberWithUnitsDict(
      'fraction', 0, createFractionDict(false, 0, 2, 30), createUnitsDict(
        {g: 1, cm: -2})), FRACTION_RULE_INPUT)).toBe(true);
    expect(nurs.IsEquivalentTo(createNumberWithUnitsDict(
      'fraction', 0, createFractionDict(false, 0, 2000, 3), createUnitsDict(
        {g: 1, m: -2})), FRACTION_RULE_INPUT)).toBe(true);
    expect(nurs.IsEquivalentTo(createNumberWithUnitsDict(
      'fraction', 0, createFractionDict(false, 0, 200, 30), createUnitsDict(
        {kg: 1, m: -2})), FRACTION_RULE_INPUT)).toBe(false);
  });
});
