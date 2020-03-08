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
 * @fileoverview unit tests for the fraction object type factory service.
 */

import { ObjectsDomainConstants } from
  'domain/objects/objects-domain.constants';
import { Fraction, FractionObjectFactory } from
  'domain/objects/FractionObjectFactory';

describe('FractionObjectFactory', () => {
  describe('fraction object factory', () => {
    var errors = null;
    var fraction: FractionObjectFactory = null;

    beforeEach(() => {
      errors = ObjectsDomainConstants.FRACTION_PARSING_ERRORS;
      fraction = new FractionObjectFactory();
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
      expect(fraction.fromRawInputString('10/ 2').toDict()).toEqual(
        new Fraction(false, 0, 10, 2).toDict());
      expect(fraction.fromRawInputString('10/20').toDict()).toEqual(
        new Fraction(false, 0, 10, 20).toDict());
      expect(fraction.fromRawInputString('1   1/ 2').toDict()).toEqual(
        new Fraction(false, 1, 1, 2).toDict());
      expect(fraction.fromRawInputString('- 1 1 /2').toDict()).toEqual(
        new Fraction(true, 1, 1, 2).toDict());
      expect(fraction.fromRawInputString('1      ').toDict()).toEqual(
        new Fraction(false, 1, 0, 1).toDict());
      expect(fraction.fromRawInputString('  - 1').toDict()).toEqual(
        new Fraction(true, 1, 0, 1).toDict());
      expect(fraction.fromRawInputString('1  /  22').toDict()).toEqual(
        new Fraction(false, 0, 1, 22).toDict());
      expect(fraction.fromRawInputString(' -1 /2').toDict()).toEqual(
        new Fraction(true, 0, 1, 2).toDict());
      expect(fraction.fromRawInputString('0  1/2').toDict()).toEqual(
        new Fraction(false, 0, 1, 2).toDict());
      expect(fraction.fromRawInputString('1 0 /2').toDict()).toEqual(
        new Fraction(false, 1, 0, 2).toDict());
    });

    it('should throw errors for invalid fractions', () => {
      // Invalid characters.
      expect(() => {
        fraction.fromRawInputString('3 \ b');
      }).toThrow(new Error(errors.INVALID_CHARS));
      expect(() => {
        fraction.fromRawInputString('a 3/5');
      }).toThrow(new Error(errors.INVALID_CHARS));
      expect(() => {
        fraction.fromRawInputString('5 b/c');
      }).toThrow(new Error(errors.INVALID_CHARS));
      expect(() => {
        fraction.fromRawInputString('a b/c');
      }).toThrow(new Error(errors.INVALID_CHARS));
      // Invalid format.
      expect(() => {
        fraction.fromRawInputString('1 / -3');
      }).toThrow(new Error(errors.INVALID_FORMAT));
      expect(() => {
        fraction.fromRawInputString('-1 -3/2');
      }).toThrow(new Error(errors.INVALID_FORMAT));
      expect(() => {
        fraction.fromRawInputString('3 -');
      }).toThrow(new Error(errors.INVALID_FORMAT));
      expect(() => {
        fraction.fromRawInputString('1  1');
      }).toThrow(new Error(errors.INVALID_FORMAT));
      expect(() => {
        fraction.fromRawInputString('1/3 1/2');
      }).toThrow(new Error(errors.INVALID_FORMAT));
      expect(() => {
        fraction.fromRawInputString('1 2 3 / 4');
      }).toThrow(new Error(errors.INVALID_FORMAT));
      expect(() => {
        fraction.fromRawInputString('1 / 2 3');
      }).toThrow(new Error(errors.INVALID_FORMAT));
      expect(() => {
        fraction.fromRawInputString('- / 3');
      }).toThrow(new Error(errors.INVALID_FORMAT));
      expect(() => {
        fraction.fromRawInputString('/ 3');
      }).toThrow(new Error(errors.INVALID_FORMAT));
      // Division by zero.
      expect(() => {
        fraction.fromRawInputString(' 1/0');
      }).toThrow(new Error(errors.DIVISION_BY_ZERO));
      expect(() => {
        fraction.fromRawInputString('1 2 /0');
      }).toThrow(new Error(errors.DIVISION_BY_ZERO));
    });

    it('should convert to the correct float value', () => {
      expect(fraction.fromRawInputString('1').toFloat()).toEqual(1);
      expect(fraction.fromRawInputString('1 0/5').toFloat()).toEqual(1);
      expect(fraction.fromRawInputString('1 4/5').toFloat()).toEqual(1.8);
      expect(fraction.fromRawInputString('0 4/5').toFloat()).toEqual(0.8);
      expect(fraction.fromRawInputString('-10/10').toFloat()).toEqual(-1);
      expect(fraction.fromRawInputString('0 40/50').toFloat()).toEqual(0.8);
      expect(fraction.fromRawInputString('0 2/3').toFloat()).toEqual(2 / 3);
      expect(fraction.fromRawInputString('0 25/5').toFloat()).toEqual(5);
      expect(fraction.fromRawInputString('4 1/3').toFloat()).toEqual(13 / 3);
    });

    it('should correctly detect nonzero integer part', () => {
      expect(
        fraction.fromRawInputString('0').hasNonzeroIntegerPart()).toBe(false);
      expect(
        fraction.fromRawInputString('1').hasNonzeroIntegerPart()).toBe(true);
      expect(
        fraction.fromRawInputString('1 0/5').hasNonzeroIntegerPart()
      ).toBe(true);
      expect(
        fraction.fromRawInputString('1 3/5').hasNonzeroIntegerPart()
      ).toBe(true);
      expect(
        fraction.fromRawInputString('7/5').hasNonzeroIntegerPart()).toBe(false);
      expect(
        fraction.fromRawInputString('2/5').hasNonzeroIntegerPart()).toBe(false);
    });

    it('should correctly detect improper fractions', () => {
      expect(fraction.fromRawInputString('0').isImproperFraction()).toBe(false);
      expect(fraction.fromRawInputString('1').isImproperFraction()).toBe(false);
      expect(
        fraction.fromRawInputString('1 0/5').isImproperFraction()
      ).toBe(false);
      expect(
        fraction.fromRawInputString('1 3/5').isImproperFraction()
      ).toBe(false);
      expect(
        fraction.fromRawInputString('2/5').isImproperFraction()).toBe(false);
      expect(
        fraction.fromRawInputString('7/5').isImproperFraction()).toBe(true);
      expect(
        fraction.fromRawInputString('5/5').isImproperFraction()).toBe(true);
    });
  });
});
