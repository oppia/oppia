// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview unit tests for the units object domain constants.
 */

import { ObjectsDomainConstants } from './objects-domain.constants';

describe('ObjectsDomainConstants', () => {
  const validUnits = [
    'm', 'meter', 'in', 'inch', 'ft', 'foot', 'yd', 'yard', 'mi', 'mile', 'li',
    'link', 'rd', 'rod', 'ch', 'chain', 'angstrom', 'mil', 'm2', 'sqin', 'sqft',
    'sqyd', 'sqmi', 'sqrd', 'sqch', 'sqmil', 'acre', 'hectare', 'm3', 'litre',
    'L', 'l', 'lt', 'cc', 'cuin', 'cuft', 'cuyd', 'teaspoon', 'tablespoon',
    'radian', 'deg', 'degree', 'grad', 'gradian', 'cycle', 'arcsec', 'arcmin',
    'second', 'seconds', 's', 'secs', 'minute', 'minutes', 'min', 'mins', 'hr',
    'hrs', 'hour', 'hours', 'day', 'days', 'week', 'weeks', 'month', 'months',
    'year', 'years', 'decade', 'decades', 'century', 'centuries', 'millennium',
    'millennia', 'Hz', 'kg', 'kilogram', 'g', 'gram', 'tonne', 'ton', 'gr',
    'grain', 'dr', 'dram', 'oz', 'ounce', 'lbm', 'lb', 'lbs', 'poundmass',
    'hundredweight', 'stick', 'stone', 'K', 'kelvin', 'degC', 'celsius', 'degF',
    'fahrenheit', 'degR', 'rankine', 'mol', 'mole', 'cd', 'candela', 'N',
    'dyn', 'dyne', 'lbf', 'poundforce', 'kip', 'J', 'joule', 'erg', 'Wh', 'BTU',
    'eV', 'electronvolt', 'W', 'watt', 'hp', 'horsepower', 'Pa', 'psi', 'atm',
    'torr', 'bar', 'mmHg', 'mmH2O', 'cmH2O', 'A', 'ampere', 'V', 'volt', 'C',
    'coulomb', 'ohm', 'F', 'farad', 'Wb', 'weber', 'T', 'tesla', 'H', 'henry',
    'S', 'siemens', 'b', 'bit', 'B', 'byte', '$', 'dollar', 'dollars', 'Dollar',
    'Dollars', '₹', 'Rs', 'Rupee', 'Rupees', 'rupee', 'rupees', 'Cent',
    'Cents', 'cent', 'cents', 'Paisa', 'paise', 'cwt', 'newton', 'rad', 'USD'
  ];

  it('should have all units as keys in UNIT_TO_NORMALIZED_UNIT_MAPPING', () => {
    const keys = Object.keys(
      ObjectsDomainConstants.UNIT_TO_NORMALIZED_UNIT_MAPPING
    );
    expect(keys.sort()).toEqual(validUnits.sort());
  });

  it('should check that every value in UNIT_TO_' +
  'NORMALIZED_UNIT_MAPPING is a valid unit', () => {
    const unitValues = Object.values(
      ObjectsDomainConstants.UNIT_TO_NORMALIZED_UNIT_MAPPING
    );
    unitValues.forEach(value => {
      expect(validUnits).toContain(value);
    });
  });
});
