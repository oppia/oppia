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
import { Fraction, FractionObjectFactory } from
  'domain/objects/FractionObjectFactory';
import { Units, UnitsObjectFactory } from
  'domain/objects/UnitsObjectFactory';
import {NumberWithUnitsObjectFactory} from './NumberWithUnitsObjectFactory';
import {TestBed} from '@angular/core/testing';

import { ObjectsDomainConstants } from
  'domain/objects/objects-domain.constants';

fdescribe('NumberWithUnitsObjectFactory', function() {
  describe('number with units object factory', function() {
    let NumberWithUnits = null;
    let units = null;
    let fraction = null;
    let errors = null;

    beforeEach(() => {
      NumberWithUnits = TestBed.get(NumberWithUnitsObjectFactory);
      units = TestBed.get(UnitsObjectFactory);
      fraction = TestBed.get(FractionObjectFactory);
      errors = ObjectsDomainConstants.NUMBER_WITH_UNITS_PARSING_ERRORS;
    });

    it('should convert units to list format', () => {
      expect(units.fromStringToList('kg / kg^2 K mol / (N m s^2) K s')).toEqual(
        [{exponent: -1, unit: 'kg'}, {exponent: 2, unit: 'K'},
          {exponent: 1, unit: 'mol'}, {exponent: -1, unit: 'N'},
          {exponent: -1, unit: 'm'}, {exponent: -1, unit: 's'}]);
      expect(units.fromStringToList('mol/(kg / (N m / s^2)')).toEqual(
        [{exponent: 1, unit: 'mol'}, {exponent: -1, unit: 'kg'},
          {exponent: 1, unit: 'N'}, {exponent: 1, unit: 'm'},
          {exponent: -2, unit: 's'}]);
      expect(units.fromStringToList('kg per kg^2 K mol per (N m s^2) K s'
      )).toEqual([{exponent: -1, unit: 'kg'}, {exponent: 2, unit: 'K'},
        {exponent: 1, unit: 'mol'}, {exponent: -1, unit: 'N'},
        {exponent: -1, unit: 'm'}, {exponent: -1, unit: 's'}]);
    });

    it('should convert units from list to string format', () => {
      expect( units(
        [{exponent: -1, unit: 'kg'}, {exponent: 2, unit: 'K'},
          {exponent: 1, unit: 'mol'}, {exponent: -1, unit: 'N'},
          {exponent: -1, unit: 'm'}, {exponent: -1, unit: 's'}]
      ).toString()).toBe('kg^-1 K^2 mol N^-1 m^-1 s^-1');
      expect( units(
        [{exponent: 1, unit: 'mol'}, {exponent: -1, unit: 'kg'},
          {exponent: 1, unit: 'N'}, {exponent: 1, unit: 'm'},
          {exponent: -2, unit: 's'}]).toString()).toBe(
        'mol kg^-1 N m s^-2');
    });

    it('should convert units from string to lexical format', () => {
      expect(units.stringToLexical('kg per kg^2 K mol / (N m s^2) K s'
      )).toEqual(
        ['kg', '/', 'kg^2', '*', 'K', '*', 'mol', '/', '(', 'N', '*', 'm', '*',
          's^2', ')', 'K', '*', 's']);
      expect(units.stringToLexical('kg (K mol) m/s^2 r t / (l/ n) / o'
      )).toEqual(
        ['kg', '(', 'K', '*', 'mol', ')', 'm', '/', 's^2', '*', 'r', '*', 't',
          '/', '(', 'l', '/', 'n', ')', '/', 'o']);
      expect(units.stringToLexical('mol per (kg per (N m per s^2)*K)'
      )).toEqual(
        ['mol', '/', '(', 'kg', '/', '(', 'N', '*', 'm', '/', 's^2', ')', '*',
          'K', ')']);
    });

    it('should convert number with units object to a string', () => {
      expect(NumberWithUnits('real', 2.02, fraction(false, 0, 0, 1
      ), units.fromRawInputString('m / s^2')).toString()).toBe('2.02 m s^-2');
      expect( NumberWithUnits('real', 2.02, fraction(false, 0, 0, 1
      ), units.fromRawInputString('Rs')).toString()).toBe('Rs 2.02');
      expect( NumberWithUnits('real', 2, fraction(false, 0, 0, 1
      ), units.fromRawInputString('')).toString()).toBe('2');
      expect( NumberWithUnits('fraction', 0, fraction(true, 0, 4, 3
      ), units.fromRawInputString('m / s^2')).toString()).toBe('-4/3 m s^-2');
      expect( NumberWithUnits('fraction', 0, fraction(
        false, 0, 4, 3), units.fromRawInputString('$ per hour')).toString(
      )).toBe('$ 4/3 hour^-1');
      expect( NumberWithUnits('real', 40, fraction(
        false, 0, 0, 1), units.fromRawInputString('Rs per hour')).toString(
      )).toBe('Rs 40 hour^-1');
    });

    it('should parse valid units strings', () => {
      expect(units.fromRawInputString('kg per (K mol^-2)')).toEqual(
        units(units.fromStringToList('kg / (K mol^-2)')));
      expect(units.fromRawInputString('kg / (K mol^-2) N / m^2')).toEqual(
        units(units.fromStringToList('kg / (K mol^-2) N / m^2')));
    });

    it('should parse valid number with units strings', () => {
      expect(NumberWithUnits.fromRawInputString('2.02 kg / m^3')).toEqual(
        NumberWithUnits('real', 2.02, fraction(
          false, 0, 0, 1), units.fromRawInputString('kg / m^3')));
      expect(NumberWithUnits.fromRawInputString('2 / 3 kg / m^3')).toEqual(
        NumberWithUnits('fraction', 0, fraction(
          false, 0, 2, 3), units.fromRawInputString('kg / m^3')));
      expect(NumberWithUnits.fromRawInputString('2')).toEqual(
        NumberWithUnits('real', 2, fraction(
          false, 0, 0, 1), units.fromRawInputString('')));
      expect(NumberWithUnits.fromRawInputString('2 / 3')).toEqual(
        NumberWithUnits('fraction', 0, fraction(
          false, 0, 2, 3), units.fromRawInputString('')));
      expect(NumberWithUnits.fromRawInputString('$ 2.02')).toEqual(
        NumberWithUnits('real', 2.02, fraction(
          false, 0, 0, 1), units.fromRawInputString('$')));
      expect(NumberWithUnits.fromRawInputString('Rs 2 / 3 per hour')).toEqual(
        NumberWithUnits('fraction', 0, fraction(
          false, 0, 2, 3), units.fromRawInputString('Rs / hour')));
    });

    it('should throw errors for invalid number with units', () => {
      expect(function() {
        NumberWithUnits.fromRawInputString('3* kg');
      }).toThrow( Error(errors.INVALID_VALUE));
      expect(function() {
        NumberWithUnits.fromRawInputString('$ 3*');
      }).toThrow( Error(errors.INVALID_VALUE));
      expect(function() {
        NumberWithUnits.fromRawInputString('Rs 3^');
      }).toThrow( Error(errors.INVALID_VALUE));
      expect(function() {
        NumberWithUnits.fromRawInputString('3# m/s');
      }).toThrow( Error(errors.INVALID_VALUE));
      expect(function() {
        NumberWithUnits.fromRawInputString('3 $');
      }).toThrow( Error(errors.INVALID_CURRENCY_FORMAT));
      expect(function() {
        NumberWithUnits.fromRawInputString('Rs5');
      }).toThrow( Error(errors.INVALID_CURRENCY));
      expect(function() {
        NumberWithUnits.fromRawInputString('$');
      }).toThrow( Error(errors.INVALID_CURRENCY));
      expect(function() {
        NumberWithUnits.fromRawInputString('kg 2 s^2');
      }).toThrow( Error(errors.INVALID_CURRENCY));
      expect(function() {
        NumberWithUnits.fromRawInputString('2 m/s#');
      }).toThrow( Error(errors.INVALID_UNIT_CHARS));
      expect(function() {
        NumberWithUnits.fromRawInputString('@ 2');
      }).toThrow( Error(errors.INVALID_CURRENCY));
      expect(function() {
        NumberWithUnits.fromRawInputString('2 / 3 kg&^-2');
      }).toThrow( Error(errors.INVALID_UNIT_CHARS));
      expect(function() {
        NumberWithUnits.fromRawInputString('2 m**2');
      }).toThrow( Error('SyntaxError: Unexpected "*" in "m**2" at index 2'));
      expect(function() {
        NumberWithUnits.fromRawInputString('2 kg / m^(2)');
      }).toThrow( Error('SyntaxError: In "kg / m^(2)", "^" must be ' +
      'followed by a floating-point number'));
    });
  });
});
