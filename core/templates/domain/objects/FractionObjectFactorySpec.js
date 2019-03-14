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
describe('FractionObjectFactory', function() {
  beforeEach(module('oppia'));

  describe('fraction object factory', function() {
    var errors = null;
    var Fraction = null;

    beforeEach(inject(function($injector) {
      errors = $injector.get('FRACTION_PARSING_ERRORS');
      Fraction = $injector.get('FractionObjectFactory');
    }));

    it('should convert itself to a string in fraction format', function() {
      expect(new Fraction(true, 1, 2, 3).toString()).toBe('-1 2/3');
      expect(new Fraction(false, 1, 2, 3).toString()).toBe('1 2/3');
      expect(new Fraction(true, 0, 2, 3).toString()).toBe('-2/3');
      expect(new Fraction(false, 0, 2, 3).toString()).toBe('2/3');
      expect(new Fraction(true, 1, 0, 3).toString()).toBe('-1');
      expect(new Fraction(false, 1, 0, 3).toString()).toBe('1');
      expect(new Fraction(true, 0, 0, 3).toString()).toBe('0');
      expect(new Fraction(false, 0, 0, 3).toString()).toBe('0');
    });

    it('should return the correct integer part', function() {
      expect(new Fraction(true, 1, 2, 3).getIntegerPart()).toBe(-1);
      expect(new Fraction(false, 1, 2, 3).getIntegerPart()).toBe(1);
      expect(new Fraction(true, 0, 2, 3).getIntegerPart()).toBe(0);
      expect(new Fraction(false, 0, 2, 3).getIntegerPart()).toBe(0);
      expect(new Fraction(true, 1, 0, 3).getIntegerPart()).toBe(-1);
      expect(new Fraction(false, 1, 0, 3).getIntegerPart()).toBe(1);
      expect(new Fraction(true, 0, 0, 3).getIntegerPart()).toBe(0);
      expect(new Fraction(false, 0, 0, 3).getIntegerPart()).toBe(0);
    });

    it('should parse valid strings', function() {
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

    it('should throw errors for invalid fractions', function() {
      // Invalid characters.
      expect(function() {
        Fraction.fromRawInputString('3 \ b');
      }).toThrow(new Error(errors.INVALID_CHARS));
      expect(function() {
        Fraction.fromRawInputString('a 3/5');
      }).toThrow(new Error(errors.INVALID_CHARS));
      expect(function() {
        Fraction.fromRawInputString('5 b/c');
      }).toThrow(new Error(errors.INVALID_CHARS));
      expect(function() {
        Fraction.fromRawInputString('a b/c');
      }).toThrow(new Error(errors.INVALID_CHARS));
      // Invalid format.
      expect(function() {
        Fraction.fromRawInputString('1 / -3');
      }).toThrow(new Error(errors.INVALID_FORMAT));
      expect(function() {
        Fraction.fromRawInputString('-1 -3/2');
      }).toThrow(new Error(errors.INVALID_FORMAT));
      expect(function() {
        Fraction.fromRawInputString('3 -');
      }).toThrow(new Error(errors.INVALID_FORMAT));
      expect(function() {
        Fraction.fromRawInputString('1  1');
      }).toThrow(new Error(errors.INVALID_FORMAT));
      expect(function() {
        Fraction.fromRawInputString('1/3 1/2');
      }).toThrow(new Error(errors.INVALID_FORMAT));
      expect(function() {
        Fraction.fromRawInputString('1 2 3 / 4');
      }).toThrow(new Error(errors.INVALID_FORMAT));
      expect(function() {
        Fraction.fromRawInputString('1 / 2 3');
      }).toThrow(new Error(errors.INVALID_FORMAT));
      expect(function() {
        Fraction.fromRawInputString('- / 3');
      }).toThrow(new Error(errors.INVALID_FORMAT));
      expect(function() {
        Fraction.fromRawInputString('/ 3');
      }).toThrow(new Error(errors.INVALID_FORMAT));
      // Division by zero.
      expect(function() {
        Fraction.fromRawInputString(' 1/0');
      }).toThrow(new Error(errors.DIVISION_BY_ZERO));
      expect(function() {
        Fraction.fromRawInputString('1 2 /0');
      }).toThrow(new Error(errors.DIVISION_BY_ZERO));
    });

    it('should convert to the correct float value', function() {
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

    it('should correctly detect nonzero integer part', function() {
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

    it('should correctly detect improper fractions', function() {
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
  });
});
