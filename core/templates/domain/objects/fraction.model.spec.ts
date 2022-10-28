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
 * @fileoverview unit tests for the fraction.model.ts.
 */

import { ObjectsDomainConstants } from
  'domain/objects/objects-domain.constants';
import { Fraction } from 'domain/objects/fraction.model';

describe('Fraction', () => {
  let errors: typeof ObjectsDomainConstants.FRACTION_PARSING_ERROR_I18N_KEYS;

  beforeEach(() => {
    errors = ObjectsDomainConstants.FRACTION_PARSING_ERROR_I18N_KEYS;
  });

  it('should create a new object from dict', () => {
    const fractionObject = {
      isNegative: false,
      wholeNumber: 0,
      numerator: 0,
      denominator: 1
    };
    const createdFraction = Fraction.fromDict(fractionObject);

    expect(createdFraction.toDict()).toEqual(fractionObject);
  });

  it('should equate two fractions', () => {
    const fractionObject = {
      isNegative: false,
      wholeNumber: 0,
      numerator: 0,
      denominator: 1
    };
    let createdFraction = Fraction.fromDict(fractionObject);
    let createdFraction2 = Fraction.fromDict(fractionObject);
    expect(createdFraction.isEqualTo(createdFraction2)).toBe(true);
    createdFraction = Fraction.fromDict({
      isNegative: false,
      wholeNumber: 0,
      numerator: 1,
      denominator: 2
    });
    createdFraction2 = Fraction.fromDict({
      isNegative: false,
      wholeNumber: 0,
      numerator: 2,
      denominator: 4
    });
    expect(createdFraction.isEqualTo(createdFraction2)).toBe(true);
    createdFraction = Fraction.fromDict({
      isNegative: false,
      wholeNumber: 0,
      numerator: 1,
      denominator: 3
    });
    createdFraction2 = Fraction.fromDict({
      isNegative: false,
      wholeNumber: 0,
      numerator: 2,
      denominator: 4
    });
    expect(createdFraction.isEqualTo(createdFraction2)).toBe(false);
  });

  it('should convert itself to a string in fraction format', () => {
    expect(new Fraction(true, 1, 2, 3).toString()).toBe('-1 2/3');
    expect(new Fraction(false, 1, 2, 3).toString()).toBe('1 2/3');
    expect(new Fraction(true, 0, 2, 3).toString()).toBe('-2/3');
    expect(new Fraction(false, 0, 2, 3).toString()).toBe('2/3');
    expect(new Fraction(true, 1, 0, 3).toString()).toBe('-1');
    expect(new Fraction(false, 1, 0, 3).toString()).toBe('1');
    expect(new Fraction(true, 0, 0, 3).toString()).toBe('0');
    expect(new Fraction(false, 0, 0, 3).toString()).toBe('0');
  });

  it('should return the correct integer part', () => {
    expect(new Fraction(true, 1, 2, 3).getIntegerPart()).toBe(-1);
    expect(new Fraction(false, 1, 2, 3).getIntegerPart()).toBe(1);
    expect(new Fraction(true, 0, 2, 3).getIntegerPart()).toBe(0);
    expect(new Fraction(false, 0, 2, 3).getIntegerPart()).toBe(0);
    expect(new Fraction(true, 1, 0, 3).getIntegerPart()).toBe(-1);
    expect(new Fraction(false, 1, 0, 3).getIntegerPart()).toBe(1);
    expect(new Fraction(true, 0, 0, 3).getIntegerPart()).toBe(0);
    expect(new Fraction(false, 0, 0, 3).getIntegerPart()).toBe(0);
  });

  it('should parse valid strings', () => {
    expect(Fraction.fromRawInputString('10/ 2').toDict()).toEqual(
      new Fraction(false, 0, 10, 2).toDict());
    expect(Fraction.fromRawInputString('10/20').toDict()).toEqual(
      new Fraction(false, 0, 10, 20).toDict());
    expect(Fraction.fromRawInputString('1   1/ 2').toDict()).toEqual(
      new Fraction(false, 1, 1, 2).toDict());
    expect(Fraction.fromRawInputString('- 1 1 /2').toDict()).toEqual(
      new Fraction(true, 1, 1, 2).toDict());
    expect(Fraction.fromRawInputString('1      ').toDict()).toEqual(
      new Fraction(false, 1, 0, 1).toDict());
    expect(Fraction.fromRawInputString('  - 1').toDict()).toEqual(
      new Fraction(true, 1, 0, 1).toDict());
    expect(Fraction.fromRawInputString('1  /  22').toDict()).toEqual(
      new Fraction(false, 0, 1, 22).toDict());
    expect(Fraction.fromRawInputString(' -1 /2').toDict()).toEqual(
      new Fraction(true, 0, 1, 2).toDict());
    expect(Fraction.fromRawInputString('0  1/2').toDict()).toEqual(
      new Fraction(false, 0, 1, 2).toDict());
    expect(Fraction.fromRawInputString('1 0 /2').toDict()).toEqual(
      new Fraction(false, 1, 0, 2).toDict());
  });

  it('should throw errors for invalid fractions', () => {
    // Invalid characters.
    expect(() => {
      Fraction.fromRawInputString('3 \ b');
    }).toThrowError(errors.INVALID_CHARS);
    expect(() => {
      Fraction.fromRawInputString('a 3/5');
    }).toThrowError(errors.INVALID_CHARS);
    expect(() => {
      Fraction.fromRawInputString('5 b/c');
    }).toThrowError(errors.INVALID_CHARS);
    expect(() => {
      Fraction.fromRawInputString('a b/c');
    }).toThrowError(errors.INVALID_CHARS);
    // Invalid format.
    expect(() => {
      Fraction.fromRawInputString('1 / -3');
    }).toThrowError(errors.INVALID_FORMAT);
    expect(() => {
      Fraction.fromRawInputString('-1 -3/2');
    }).toThrowError(errors.INVALID_FORMAT);
    expect(() => {
      Fraction.fromRawInputString('3 -');
    }).toThrowError(errors.INVALID_FORMAT);
    expect(() => {
      Fraction.fromRawInputString('1  1');
    }).toThrowError(errors.INVALID_FORMAT);
    expect(() => {
      Fraction.fromRawInputString('1/3 1/2');
    }).toThrowError(errors.INVALID_FORMAT);
    expect(() => {
      Fraction.fromRawInputString('1 2 3 / 4');
    }).toThrowError(errors.INVALID_FORMAT);
    expect(() => {
      Fraction.fromRawInputString('1 / 2 3');
    }).toThrowError(errors.INVALID_FORMAT);
    expect(() => {
      Fraction.fromRawInputString('- / 3');
    }).toThrowError(errors.INVALID_FORMAT);
    expect(() => {
      Fraction.fromRawInputString('/ 3');
    }).toThrowError(errors.INVALID_FORMAT);
    // Division by zero.
    expect(() => {
      Fraction.fromRawInputString(' 1/0');
    }).toThrowError(errors.DIVISION_BY_ZERO);
    expect(() => {
      Fraction.fromRawInputString('1 2 /0');
    }).toThrowError(errors.DIVISION_BY_ZERO);
  });

  it('should convert to the correct float value', () => {
    expect(Fraction.fromRawInputString('1').toFloat()).toEqual(1);
    expect(Fraction.fromRawInputString('1 0/5').toFloat()).toEqual(1);
    expect(Fraction.fromRawInputString('1 4/5').toFloat()).toEqual(1.8);
    expect(Fraction.fromRawInputString('0 4/5').toFloat()).toEqual(0.8);
    expect(Fraction.fromRawInputString('-10/10').toFloat()).toEqual(-1);
    expect(Fraction.fromRawInputString('0 40/50').toFloat()).toEqual(0.8);
    expect(Fraction.fromRawInputString('0 2/3').toFloat()).toEqual(2 / 3);
    expect(Fraction.fromRawInputString('0 25/5').toFloat()).toEqual(5);
    expect(Fraction.fromRawInputString('4 1/3').toFloat()).toEqual(13 / 3);
  });

  it('should correctly detect nonzero integer part', () => {
    expect(
      Fraction.fromRawInputString('0').hasNonzeroIntegerPart()).toBe(false);
    expect(
      Fraction.fromRawInputString('1').hasNonzeroIntegerPart()).toBe(true);
    expect(
      Fraction.fromRawInputString('1 0/5').hasNonzeroIntegerPart()
    ).toBe(true);
    expect(
      Fraction.fromRawInputString('1 3/5').hasNonzeroIntegerPart()
    ).toBe(true);
    expect(
      Fraction.fromRawInputString('7/5').hasNonzeroIntegerPart()).toBe(false);
    expect(
      Fraction.fromRawInputString('2/5').hasNonzeroIntegerPart()).toBe(false);
  });

  it('should correctly detect improper fractions', () => {
    expect(Fraction.fromRawInputString('0').isImproperFraction()).toBe(false);
    expect(Fraction.fromRawInputString('1').isImproperFraction()).toBe(false);
    expect(
      Fraction.fromRawInputString('1 0/5').isImproperFraction()
    ).toBe(false);
    expect(
      Fraction.fromRawInputString('1 3/5').isImproperFraction()
    ).toBe(false);
    expect(
      Fraction.fromRawInputString('2/5').isImproperFraction()).toBe(false);
    expect(
      Fraction.fromRawInputString('7/5').isImproperFraction()).toBe(true);
    expect(
      Fraction.fromRawInputString('5/5').isImproperFraction()).toBe(true);
  });

  it('should convert to simplest form', () => {
    expect(Fraction.fromRawInputString('1').convertToSimplestForm())
      .toEqual(new Fraction(false, 1, 0, 1));
    expect(Fraction.fromRawInputString('0').convertToSimplestForm())
      .toEqual(new Fraction(false, 0, 0, 1));
    expect(Fraction.fromRawInputString('2/5').convertToSimplestForm())
      .toEqual(new Fraction(false, 0, 2, 5));
    expect(Fraction.fromRawInputString('5/5').convertToSimplestForm())
      .toEqual(new Fraction(false, 0, 1, 1));
    expect(Fraction.fromRawInputString('1 0/5').convertToSimplestForm())
      .toEqual(new Fraction(false, 1, 0, 1));
  });
});
