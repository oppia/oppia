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

import {all, create} from 'mathjs';
import {getCurrencyUnits} from './NumberWithUnitsObjectFactory';
import {ObjectsDomainConstants} from './objects-domain.constants';

describe('ObjectsDomainConstants', () => {
  let unitPrefixes: string[] = [];
  let currencyUnits: string[] = [];
  let mathjsUnits: string[] = [];
  const math = create(all);

  const isValidUnit = (unit: string): boolean => {
    return currencyUnits.includes(unit) || math.Unit.isValuelessUnit(unit);
  };

  const isValidPrefix = (prefix: string): boolean => {
    return unitPrefixes.includes(prefix);
  };

  const getUnitPrefixes = (): string[] => {
    const prefixes = math.Unit.PREFIXES;
    let prefixSet = new Set<string>();
    for (const name in prefixes) {
      // Skip if prefix type is 'NONE'.
      if (name === 'NONE') {
        continue;
      }
      for (const prefix in prefixes[name]) {
        // Each prefix type has an empty key that we can ignore.
        if (prefix === '') {
          continue;
        }
        prefixSet.add(prefix);
      }
    }

    return Array.from(prefixSet);
  };

  const getAllMathjsUnits = (): string[] => {
    return Object.keys(math.Unit.UNITS);
  };

  beforeEach(() => {
    unitPrefixes = getUnitPrefixes();
    currencyUnits = getCurrencyUnits();
    mathjsUnits = getAllMathjsUnits();
  });

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

  it(
    'should check that the UNIT_TO_NORMALIZED_UNIT_MAPPING contains' +
      'all units supported by mathjs',
    () => {
      const units = Object.keys(
        ObjectsDomainConstants.UNIT_TO_NORMALIZED_UNIT_MAPPING
      )
        .filter((unit: string) => {
          return !currencyUnits.includes(unit);
        })
        .sort();
      expect(units).toEqual(mathjsUnits.sort());
    }
  );

  it(
    'should check that every value in PREFIX_TO_' +
      'NORMALIZED_PREFIX_MAPPING is a valid prefix',
    () => {
      Object.values(
        ObjectsDomainConstants.PREFIX_TO_NORMALIZED_PREFIX_MAPPING
      ).forEach(prefix => {
        expect(isValidPrefix(prefix)).toBe(true);
      });
    }
  );

  it(
    'should check that every key in PREFIX_TO_' +
      'NORMALIZED_PREFIX_MAPPING is a valid prefix',
    () => {
      Object.keys(
        ObjectsDomainConstants.PREFIX_TO_NORMALIZED_PREFIX_MAPPING
      ).forEach(prefix => {
        expect(isValidPrefix(prefix)).toBe(true);
      });
    }
  );

  it(
    'should check that the PREFIX_TO_NORMALIZED_PREFIX_MAPPING contains' +
      'all prefixes supported by mathjs',
    () => {
      const prefixes = Object.keys(
        ObjectsDomainConstants.PREFIX_TO_NORMALIZED_PREFIX_MAPPING
      ).sort();
      expect(prefixes).toEqual(unitPrefixes.sort());
    }
  );
});
