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
 * @fileoverview unit tests for number with units object type factory service.
 */
describe('NumberWithUnitsObjectFactory', function() {
  beforeEach(module('oppia'));

  describe('number with units object factory', function() {
    var NumberWithUnits = null;
    var Units = null;
    var Fraction = null;
    var errors = null;

    beforeEach(inject(function($injector) {
      NumberWithUnits = $injector.get('NumberWithUnitsObjectFactory');
      Units = $injector.get('UnitsObjectFactory');
      Fraction = $injector.get('FractionObjectFactory');
      errors = $injector.get('NUMBER_WITH_UNITS_PARSING_ERRORS');
    }));

    it('should convert units to list format', function() {
      expect(Units.fromStringToList('kg / kg^2 K mol / (N m s^2) K s')).toEqual(
        [{exp: -1, unit: 'kg'}, {exp: 2, unit: 'K'}, {exp: 1, unit: 'mol'},
          {exp: -1, unit: 'N'}, {exp: -1, unit: 'm'}, {exp: -1, unit: 's'}]);
      expect(Units.fromStringToList('mol/(kg / (N m / s^2)')).toEqual(
        [{exp: 1, unit: 'mol'}, {exp: -1, unit: 'kg'}, {exp: 1, unit: 'N'},
          {exp: 1, unit: 'm'}, {exp: -2, unit: 's'}]);
      expect(Units.fromStringToList('kg per kg^2 K mol per (N m s^2) K s'
      )).toEqual([{exp: -1, unit: 'kg'}, {exp: 2, unit: 'K'},
        {exp: 1, unit: 'mol'}, {exp: -1, unit: 'N'},
        {exp: -1, unit: 'm'}, {exp: -1, unit: 's'}]);
    });

    it('should convert units from list to string format', function() {
      expect(new Units(
        [{exp: -1, unit: 'kg'}, {exp: 2, unit: 'K'}, {exp: 1, unit: 'mol'},
          {exp: -1, unit: 'N'}, {exp: -1, unit: 'm'}, {exp: -1, unit: 's'}]
      ).toString()).toBe('kg^-1 K^2 mol^1 N^-1 m^-1 s^-1');
      expect(new Units(
        [{exp: 1, unit: 'mol'}, {exp: -1, unit: 'kg'}, {exp: 1, unit: 'N'},
          {exp: 1, unit: 'm'}, {exp: -2, unit: 's'}]).toString()).toBe(
        'mol^1 kg^-1 N^1 m^1 s^-2');
    });

  it('should convert units from string to lexical format', function() {
      expect(Units.stringToLexical('kg per kg^2 K mol / (N m s^2) K s'
      )).toEqual(
        ['kg', '/', 'kg^2', '*', 'K', '*', 'mol', '/', '(', 'N', '*', 'm', '*',
          's^2', ')', 'K', '*', 's']);
      expect(Units.stringToLexical('kg (K mol) m/s^2 r t / (l/ n) / o'
      )).toEqual(
        ['kg', '(', 'K', '*', 'mol', ')', 'm', '/', 's^2', '*', 'r', '*', 't',
          '/', '(', 'l', '/', 'n', ')', '/', 'o']);
      expect(Units.stringToLexical('mol per (kg per (N m per s^2)*K)'
      )).toEqual(
        ['mol', '/', '(', 'kg', '/', '(', 'N', '*', 'm', '/', 's^2', ')', '*',
          'K', ')']);
    });

    it('should convert itself to a string', function() {
      expect(new NumberWithUnits('real', 2.02, new Fraction(false, 0, 0, 1
      ), Units.fromRawInputString('m / s^2')).toString()).toBe('2.02 m^1 s^-2');
      expect(new NumberWithUnits('real', 2.02, new Fraction(false, 0, 0, 1
      ), Units.fromRawInputString('Rs')).toString()).toBe('Rs 2.02');
      expect(new NumberWithUnits('real', 2, new Fraction(false, 0, 0, 1
      ), Units.fromRawInputString('')).toString()).toBe('2');
      expect(new NumberWithUnits('fraction', 0, new Fraction(true, 0, 4, 3
      ), Units.fromRawInputString('m / s^2')).toString()).toBe('-4/3 m^1 s^-2');
      expect(new NumberWithUnits('fraction', 0, new Fraction(
        false, 0, 4, 3), Units.fromRawInputString('$ per hour')).toString(
      )).toBe('$ 4/3 hour^-1');
      expect(new NumberWithUnits('real', 40, new Fraction(
        false, 0, 0, 1), Units.fromRawInputString('Rs per hour')).toString(
      )).toBe('Rs 40 hour^-1');
    });

    it('should parse valid units strings', function() {
      expect(Units.fromRawInputString('kg per (K mol^-2)')).toEqual(
        new Units(Units.fromStringToList('kg / (K mol^-2)')));
      expect(Units.fromRawInputString('kg / (K mol^-2) N / m^2')).toEqual(
        new Units(Units.fromStringToList('kg / (K mol^-2) N / m^2')));
    });

    it('should parse valid number with units strings', function() {
      expect(NumberWithUnits.fromRawInputString('2.02 kg / m^3')).toEqual(
        new NumberWithUnits('real', 2.02, new Fraction(
          false, 0, 0, 1), Units.fromRawInputString('kg / m^3')));
      expect(NumberWithUnits.fromRawInputString('2 / 3 kg / m^3')).toEqual(
        new NumberWithUnits('fraction', 0, new Fraction(
          false, 0, 2, 3), Units.fromRawInputString('kg / m^3')));
      expect(NumberWithUnits.fromRawInputString('2')).toEqual(
        new NumberWithUnits('real', 2, new Fraction(
          false, 0, 0, 1), Units.fromRawInputString('')));
      expect(NumberWithUnits.fromRawInputString('2 / 3')).toEqual(
        new NumberWithUnits('fraction', 0, new Fraction(
          false, 0, 2, 3), Units.fromRawInputString('')));
      expect(NumberWithUnits.fromRawInputString('$ 2.02')).toEqual(
        new NumberWithUnits('real', 2.02, new Fraction(
          false, 0, 0, 1), Units.fromRawInputString('$')));
      expect(NumberWithUnits.fromRawInputString('Rs 2 / 3 per hour')).toEqual(
        new NumberWithUnits('fraction', 0, new Fraction(
          false, 0, 2, 3), Units.fromRawInputString('Rs / hour')));
    });

    it('should throw errors for invalid number with units', function() {
      expect(function() {
        NumberWithUnits.fromRawInputString('3* kg');
      }).toThrow(new Error(errors.INVALID_VALUE));
      expect(function() {
        NumberWithUnits.fromRawInputString('$ 3*');
      }).toThrow(new Error(errors.INVALID_VALUE));
      expect(function() {
        NumberWithUnits.fromRawInputString('Rs 3^');
      }).toThrow(new Error(errors.INVALID_VALUE));
      expect(function() {
        NumberWithUnits.fromRawInputString('3# m/s');
      }).toThrow(new Error(errors.INVALID_VALUE));
      expect(function() {
        NumberWithUnits.fromRawInputString('$3');
      }).toThrow(new Error(errors.INVALID_CURRENCY));
      expect(function() {
        NumberWithUnits.fromRawInputString('Rs5');
      }).toThrow(new Error(errors.INVALID_CURRENCY));
      expect(function() {
        NumberWithUnits.fromRawInputString('$');
      }).toThrow(new Error(errors.INVALID_CURRENCY));
      expect(function() {
        NumberWithUnits.fromRawInputString('kg 2 s^2');
      }).toThrow(new Error(errors.INVALID_CURRENCY));
      expect(function() {
        NumberWithUnits.fromRawInputString('2 m/s#');
      }).toThrow(new Error(errors.INVALID_UNIT_CHARS));
      expect(function() {
        NumberWithUnits.fromRawInputString('@ 2');
      }).toThrow(new Error(errors.INVALID_CURRENCY));
      expect(function() {
        NumberWithUnits.fromRawInputString('2 / 3 kg&^-2');
      }).toThrow(new Error(errors.INVALID_UNIT_CHARS));
      expect(function() {
        NumberWithUnits.fromRawInputString('2 m**2');
      }).toThrow(new Error('SyntaxError: Unexpected "*" in "m**2" at index 2'));
      expect(function() {
        NumberWithUnits.fromRawInputString('2 kg / m^(2)');
      }).toThrow(new Error('SyntaxError: In "kg / m^(2)", "^" must be ' +
      'followed by a floating-point number'));
    });
  });
});
