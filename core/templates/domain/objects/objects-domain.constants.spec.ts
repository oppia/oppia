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

import {ObjectsDomainConstants} from './objects-domain.constants';
import {all, create} from 'mathjs';

const math = create(all);
let currencyUnits: string[] = [];
for (const currency in ObjectsDomainConstants.CURRENCY_UNITS) {
  const currencyInfo = ObjectsDomainConstants.CURRENCY_UNITS[currency];
  currencyUnits.push(currency, ...currencyInfo.aliases);
}

const isValidUnit = (unit: string): boolean => {
  return (
    currencyUnits.includes(unit) ||
    // This throws "TS2551". We need to
    // suppress this error because mathjs does not have a type defined for Unit.
    // @ts-ignore
    math.Unit.isValuelessUnit(unit)
  );
};

describe('ObjectsDomainConstants', () => {
  it(
    'should check that every value in UNIT_TO_' +
      'NORMALIZED_UNIT_MAPPING is a valid unit',
    () => {
      Object.values(
        ObjectsDomainConstants.UNIT_TO_NORMALIZED_UNIT_MAPPING
      ).forEach(unit => {
        expect(isValidUnit(unit)).toBe(true);
      });
    }
  );

  it(
    'should check that every key in UNIT_TO_' +
      'NORMALIZED_UNIT_MAPPING is a valid unit',
    () => {
      Object.keys(
        ObjectsDomainConstants.UNIT_TO_NORMALIZED_UNIT_MAPPING
      ).forEach(unit => {
        expect(isValidUnit(unit)).toBe(true);
      });
    }
  );
});
