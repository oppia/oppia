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

import { Fraction } from 'domain/objects/fraction.model';
import { NumberWithUnits, NumberWithUnitsObjectFactory } from
  'domain/objects/NumberWithUnitsObjectFactory';
import { ObjectsDomainConstants } from
  'domain/objects/objects-domain.constants';
import { Units, UnitsObjectFactory } from 'domain/objects/UnitsObjectFactory';

describe('NumberWithUnitsObjectFactory', () => {
  describe('number with units object factory', () => {
    var nwuof = null;
    var uof = null;
    var errors = null;

    beforeEach(() => {
      nwuof = new NumberWithUnitsObjectFactory(new UnitsObjectFactory());
      uof = new UnitsObjectFactory();
      errors = ObjectsDomainConstants.NUMBER_WITH_UNITS_PARSING_ERRORS;
    });

    it('should convert units to list format', () => {
      expect(uof.fromStringToList('kg / kg^2 K mol / (N m s^2) K s')).toEqual(
        [{exponent: -1, unit: 'kg'}, {exponent: 2, unit: 'K'},
          {exponent: 1, unit: 'mol'}, {exponent: -1, unit: 'N'},
          {exponent: -1, unit: 'm'}, {exponent: -1, unit: 's'}]);
      expect(uof.fromStringToList('mol/(kg / (N m / s^2)')).toEqual(
        [{exponent: 1, unit: 'mol'}, {exponent: -1, unit: 'kg'},
          {exponent: 1, unit: 'N'}, {exponent: 1, unit: 'm'},
          {exponent: -2, unit: 's'}]);
      expect(uof.fromStringToList(
        'kg per kg^2 K mol per (N m s^2) K s'
      )).toEqual(
        [{exponent: -1, unit: 'kg'}, {exponent: 2, unit: 'K'},
          {exponent: 1, unit: 'mol'}, {exponent: -1, unit: 'N'},
          {exponent: -1, unit: 'm'}, {exponent: -1, unit: 's'}]);
    });

    it('should convert units from list to string format', () => {
      expect(new Units(
        [{exponent: -1, unit: 'kg'}, {exponent: 2, unit: 'K'},
          {exponent: 1, unit: 'mol'}, {exponent: -1, unit: 'N'},
          {exponent: -1, unit: 'm'}, {exponent: -1, unit: 's'}]
      ).toString()).toBe('kg^-1 K^2 mol N^-1 m^-1 s^-1');
      expect(new Units(
        [{exponent: 1, unit: 'mol'}, {exponent: -1, unit: 'kg'},
          {exponent: 1, unit: 'N'}, {exponent: 1, unit: 'm'},
          {exponent: -2, unit: 's'}]).toString()).toBe(
        'mol kg^-1 N m s^-2');
    });

    it('should convert units from string to lexical format', () => {
      expect(uof.stringToLexical(
        'kg per kg^2 K mol / (N m s^2) K s'
      )).toEqual(
        ['kg', '/', 'kg^2', '*', 'K', '*', 'mol', '/', '(', 'N', '*', 'm', '*',
          's^2', ')', 'K', '*', 's']);
      expect(uof.stringToLexical(
        'kg (K mol) m/s^2 r t / (l/ n) / o'
      )).toEqual(
        ['kg', '(', 'K', '*', 'mol', ')', 'm', '/', 's^2', '*', 'r', '*', 't',
          '/', '(', 'l', '/', 'n', ')', '/', 'o']);
      expect(uof.stringToLexical(
        'mol per (kg per (N m per s^2)*K)'
      )).toEqual(
        ['mol', '/', '(', 'kg', '/', '(', 'N', '*', 'm', '/', 's^2', ')', '*',
          'K', ')']);
    });

    it('should convert number with units object to a string', () => {
      expect(new NumberWithUnits('real', 2.02, new Fraction(
        false, 0, 0, 1), uof.fromRawInputString(
        'm / s^2')).toString()).toBe('2.02 m s^-2');
      expect(new NumberWithUnits('real', 2.02, new Fraction(
        false, 0, 0, 1), uof.fromRawInputString(
        'Rs')).toString()).toBe('Rs 2.02');
      expect(new NumberWithUnits('real', 2, new Fraction(
        false, 0, 0, 1), uof.fromRawInputString('')).toString()).toBe('2');
      expect(new NumberWithUnits('fraction', 0, new Fraction(
        true, 0, 4, 3), uof.fromRawInputString(
        'm / s^2')).toString()).toBe('-4/3 m s^-2');
      expect(new NumberWithUnits('fraction', 0, new Fraction(
        false, 0, 4, 3), uof.fromRawInputString(
        '$ per hour')).toString()).toBe('$ 4/3 hour^-1');
      expect(new NumberWithUnits('real', 40, new Fraction(
        false, 0, 0, 1), uof.fromRawInputString(
        'Rs per hour')).toString()).toBe('Rs 40 hour^-1');
    });

    it('should parse valid units strings', () => {
      expect(uof.fromRawInputString('kg per (K mol^-2)')).toEqual(
        new Units(uof.fromStringToList('kg / (K mol^-2)')));
      expect(uof.fromRawInputString('kg / (K mol^-2) N / m^2')).toEqual(
        new Units(uof.fromStringToList('kg / (K mol^-2) N / m^2')));
    });

    it('should parse valid number with units strings', () => {
      expect(nwuof.fromRawInputString('2.02 kg / m^3')).toEqual(
        new NumberWithUnits('real', 2.02, new Fraction(
          false, 0, 0, 1), uof.fromRawInputString('kg / m^3')));
      expect(nwuof.fromRawInputString('2 / 3 kg / m^3')).toEqual(
        new NumberWithUnits('fraction', 0, new Fraction(
          false, 0, 2, 3), uof.fromRawInputString('kg / m^3')));
      expect(nwuof.fromRawInputString('2')).toEqual(
        new NumberWithUnits('real', 2, new Fraction(
          false, 0, 0, 1), uof.fromRawInputString('')));
      expect(nwuof.fromRawInputString('2 / 3')).toEqual(
        new NumberWithUnits('fraction', 0, new Fraction(
          false, 0, 2, 3), uof.fromRawInputString('')));
      expect(nwuof.fromRawInputString('$ 2.02')).toEqual(
        new NumberWithUnits('real', 2.02, new Fraction(
          false, 0, 0, 1), uof.fromRawInputString('$')));
      expect(nwuof.fromRawInputString('Rs 2 / 3 per hour')).toEqual(
        new NumberWithUnits('fraction', 0, new Fraction(
          false, 0, 2, 3), uof.fromRawInputString('Rs / hour')));
    });

    it('should throw errors for invalid number with units', () => {
      expect(() => {
        nwuof.fromRawInputString('3* kg');
      }).toThrowError(errors.INVALID_VALUE);
      expect(() => {
        nwuof.fromRawInputString('$ 3*');
      }).toThrowError(errors.INVALID_VALUE);
      expect(() => {
        nwuof.fromRawInputString('Rs 3^');
      }).toThrowError(errors.INVALID_VALUE);
      expect(() => {
        nwuof.fromRawInputString('3# m/s');
      }).toThrowError(errors.INVALID_VALUE);
      expect(() => {
        nwuof.fromRawInputString('3 $');
      }).toThrowError(errors.INVALID_CURRENCY_FORMAT);
      expect(() => {
        nwuof.fromRawInputString('Rs5');
      }).toThrowError(errors.INVALID_CURRENCY);
      expect(() => {
        nwuof.fromRawInputString('$');
      }).toThrowError(errors.INVALID_CURRENCY);
      expect(() => {
        nwuof.fromRawInputString('kg 2 s^2');
      }).toThrowError(errors.INVALID_CURRENCY);
      expect(() => {
        nwuof.fromRawInputString('2 m/s#');
      }).toThrowError(errors.INVALID_UNIT_CHARS);
      expect(() => {
        nwuof.fromRawInputString('@ 2');
      }).toThrowError(errors.INVALID_CURRENCY);
      expect(() => {
        nwuof.fromRawInputString('2 / 3 kg&^-2');
      }).toThrowError(errors.INVALID_UNIT_CHARS);
      expect(() => {
        nwuof.fromRawInputString('2 m**2');
      }).toThrowError('SyntaxError: Unexpected "*" in "m**2" at index 2');
      expect(() => {
        nwuof.fromRawInputString('2 kg / m^(2)');
      }).toThrowError(
        'SyntaxError: In "kg / m^(2)", "^" must be ' +
        'followed by a floating-point number');
    });
  });
});
