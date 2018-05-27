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

fdescribe('Number with Units rules service', function() {
  beforeEach(module('oppia'));

  var nurs = null;
  beforeEach(inject(function($injector) {
    nurs = $injector.get('numberWithUnitsRulesService');
  }));

  var createNumberWithUnitsDict = function(
      type, real, fraction, units) {
    return {
      type: type,
      real: real,
      fraction: fraction,
      units: units
    };
  };

  var REAL_RULE_INPUT = {
    type: 'real',
    real: 2,
    fraction: '',
    units: 'kg / m^2'
  };

  var FRACTION_RULE_INPUT = {
    type: 'fraction',
    real: 0,
    fraction: '2 / 3',
    units: 'kg / m^2'
  };

  fit('should have a correct \'equal to\' rule', function() {
    expect(nurs.IsEqualTo(createNumberWithUnitsDict(
      'real', 2.5, '', 'kg / m^2'), REAL_RULE_INPUT)).toBe(false);
    expect(nurs.IsEqualTo(createNumberWithUnitsDict(
      'real', 2, '', 'g / m^2'), REAL_RULE_INPUT)).toBe(false);
    expect(nurs.IsEqualTo(createNumberWithUnitsDict(
      'fraction', 0, '6/3', 'kg / m^2'), REAL_RULE_INPUT)).toBe(false);
    expect(nurs.IsEqualTo(createNumberWithUnitsDict(
      'real', 2, '', 'kg / m^-2'), REAL_RULE_INPUT)).toBe(false);
    expect(nurs.IsEqualTo(createNumberWithUnitsDict(
      'real', 2, '', 'kg m^-2'), REAL_RULE_INPUT)).toBe(true);
    expect(nurs.IsEqualTo(createNumberWithUnitsDict(
      'real', 2, '', 'kg / (m^2)'), REAL_RULE_INPUT)).toBe(true);
    expect(nurs.IsEqualTo(createNumberWithUnitsDict(
      'fraction', 0, '2/3', 'kg m^-2'), FRACTION_RULE_INPUT)).toBe(true);
    expect(nurs.IsEqualTo(createNumberWithUnitsDict(
      'fraction', 0, '20/30', 'kg / m^2'), FRACTION_RULE_INPUT)).toBe(false);
    expect(nurs.IsEqualTo(createNumberWithUnitsDict(
      'fraction', 0, '2/3', 'kg / m^-2'), FRACTION_RULE_INPUT)).toBe(false);
  });

  fit('should have a correct \'equivalent to\' rule', function() {
    expect(nurs.IsEquivalentTo(createNumberWithUnitsDict(
      'real', 2, '', 'kg / m^-2'), REAL_RULE_INPUT)).toBe(false);
    expect(nurs.IsEquivalentTo(createNumberWithUnitsDict(
      'real', 2, '', 'kg m^-2'), REAL_RULE_INPUT)).toBe(true);
    expect(nurs.IsEquivalentTo(createNumberWithUnitsDict(
      'real', 2000, '', 'g / m^2'), REAL_RULE_INPUT)).toBe(true);
    expect(nurs.IsEquivalentTo(createNumberWithUnitsDict(
      'real', 0.2, '', 'g / cm^2'), REAL_RULE_INPUT)).toBe(true);
    expect(nurs.IsEquivalentTo(createNumberWithUnitsDict(
      'fraction', 0, '4/2', 'kg / m^2'), REAL_RULE_INPUT)).toBe(true);
    expect(nurs.IsEquivalentTo(createNumberWithUnitsDict(
      'fraction', 0, '20/30', 'kg / m^2'), FRACTION_RULE_INPUT)).toBe(true);
    expect(nurs.IsEquivalentTo(createNumberWithUnitsDict(
      'fraction', 0, '2/30', 'g / cm^2'), FRACTION_RULE_INPUT)).toBe(true);
    expect(nurs.IsEquivalentTo(createNumberWithUnitsDict(
      'fraction', 0, '2000/3', 'g  m^-2'), FRACTION_RULE_INPUT)).toBe(true);
    expect(nurs.IsEquivalentTo(createNumberWithUnitsDict(
      'fraction', 0, '200/30', 'kg / m^2'), FRACTION_RULE_INPUT)).toBe(false);
  });
});
