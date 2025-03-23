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

import {Fraction} from 'domain/objects/fraction.model';
import {
  NumberWithUnits,
  NumberWithUnitsObjectFactory,
} from 'domain/objects/NumberWithUnitsObjectFactory';
import {ObjectsDomainConstants} from 'domain/objects/objects-domain.constants';
import {Units, UnitsObjectFactory} from 'domain/objects/UnitsObjectFactory';

describe('NumberWithUnitsObjectFactory', () => {
  describe('number with units object factory', () => {
    let nwuof: NumberWithUnitsObjectFactory;
    let uof: UnitsObjectFactory;
    let errors: typeof ObjectsDomainConstants.NUMBER_WITH_UNITS_PARSING_ERROR_I18N_KEYS;

    beforeEach(() => {
      nwuof = new NumberWithUnitsObjectFactory(new UnitsObjectFactory());
      uof = new UnitsObjectFactory();
      errors = ObjectsDomainConstants.NUMBER_WITH_UNITS_PARSING_ERROR_I18N_KEYS;
    });

    it('should convert units to list format', () => {
      expect(uof.fromStringToList('kg / kg^2 K mol / (N m s^2) K s')).toEqual([
        {exponent: -1, unit: 'kg'},
        {exponent: 2, unit: 'K'},
        {exponent: 1, unit: 'mol'},
        {exponent: -1, unit: 'N'},
        {exponent: -1, unit: 'm'},
        {exponent: -1, unit: 's'},
      ]);
      expect(uof.fromStringToList('mol/(kg / (N m / s^2)')).toEqual([
        {exponent: 1, unit: 'mol'},
        {exponent: -1, unit: 'kg'},
        {exponent: 1, unit: 'N'},
        {exponent: 1, unit: 'm'},
        {exponent: -2, unit: 's'},
      ]);
      expect(
        uof.fromStringToList('kg per kg^2 K mol per (N m s^2) K s')
      ).toEqual([
        {exponent: -1, unit: 'kg'},
        {exponent: 2, unit: 'K'},
        {exponent: 1, unit: 'mol'},
        {exponent: -1, unit: 'N'},
        {exponent: -1, unit: 'm'},
        {exponent: -1, unit: 's'},
      ]);
    });

    it('should convert units from list to string format', () => {
      expect(
        new Units([
          {exponent: -1, unit: 'kg'},
          {exponent: 2, unit: 'K'},
          {exponent: 1, unit: 'mol'},
          {exponent: -1, unit: 'N'},
          {exponent: -1, unit: 'm'},
          {exponent: -1, unit: 's'},
        ]).toString()
      ).toBe('kg^-1 K^2 mol N^-1 m^-1 s^-1');
      expect(
        new Units([
          {exponent: 1, unit: 'mol'},
          {exponent: -1, unit: 'kg'},
          {exponent: 1, unit: 'N'},
          {exponent: 1, unit: 'm'},
          {exponent: -2, unit: 's'},
        ]).toString()
      ).toBe('mol kg^-1 N m s^-2');
    });

    it('should convert units from string to lexical format', () => {
      expect(uof.stringToLexical('kg per kg^2 K mol / (N m s^2) K s')).toEqual([
        'kg',
        '/',
        'kg^2',
        '*',
        'K',
        '*',
        'mol',
        '/',
        '(',
        'N',
        '*',
        'm',
        '*',
        's^2',
        ')',
        'K',
        '*',
        's',
      ]);
      expect(uof.stringToLexical('kg (K mol) m/s^2 r t / (l/ n) / o')).toEqual([
        'kg',
        '(',
        'K',
        '*',
        'mol',
        ')',
        'm',
        '/',
        's^2',
        '*',
        'r',
        '*',
        't',
        '/',
        '(',
        'l',
        '/',
        'n',
        ')',
        '/',
        'o',
      ]);
      expect(uof.stringToLexical('mol per (kg per (N m per s^2)*K)')).toEqual([
        'mol',
        '/',
        '(',
        'kg',
        '/',
        '(',
        'N',
        '*',
        'm',
        '/',
        's^2',
        ')',
        '*',
        'K',
        ')',
      ]);
    });

    it('should convert number with units object to a string', () => {
      expect(
        new NumberWithUnits(
          'real',
          2.02,
          new Fraction(false, 0, 0, 1),
          uof.fromRawInputString('m / s^2')
        ).toString()
      ).toBe('2.02 m s^-2');
      expect(
        new NumberWithUnits(
          'real',
          2.02,
          new Fraction(false, 0, 0, 1),
          uof.fromRawInputString('Rs')
        ).toString()
      ).toBe('Rs 2.02');
      expect(
        new NumberWithUnits(
          'real',
          2.02,
          new Fraction(false, 0, 0, 1),
          uof.fromRawInputString('₹')
        ).toString()
      ).toBe('₹ 2.02');
      expect(
        new NumberWithUnits(
          'real',
          2,
          new Fraction(false, 0, 0, 1),
          uof.fromRawInputString('')
        ).toString()
      ).toBe('2');
      expect(
        new NumberWithUnits(
          'fraction',
          0,
          new Fraction(true, 0, 4, 3),
          uof.fromRawInputString('m / s^2')
        ).toString()
      ).toBe('-4/3 m s^-2');
      expect(
        new NumberWithUnits(
          'fraction',
          0,
          new Fraction(false, 0, 4, 3),
          uof.fromRawInputString('$ per hour')
        ).toString()
      ).toBe('$ 4/3 hour^-1');
      expect(
        new NumberWithUnits(
          'real',
          40,
          new Fraction(false, 0, 0, 1),
          uof.fromRawInputString('Rs per hour')
        ).toString()
      ).toBe('Rs 40 hour^-1');
      expect(
        new NumberWithUnits(
          'real',
          40,
          new Fraction(false, 0, 0, 1),
          uof.fromRawInputString('₹ per hour')
        ).toString()
      ).toBe('₹ 40 hour^-1');
    });

    it('should parse valid units strings', () => {
      expect(uof.fromRawInputString('kg per (K mol^-2)')).toEqual(
        new Units(uof.fromStringToList('kg / (K mol^-2)'))
      );
      expect(uof.fromRawInputString('kg / (K mol^-2) N / m^2')).toEqual(
        new Units(uof.fromStringToList('kg / (K mol^-2) N / m^2'))
      );
    });

    it('should parse valid number with units strings', () => {
      expect(nwuof.fromRawInputString('2.02 kg / m^3')).toEqual(
        new NumberWithUnits(
          'real',
          2.02,
          new Fraction(false, 0, 0, 1),
          uof.fromRawInputString('kg / m^3')
        )
      );
      expect(nwuof.fromRawInputString('2 / 3 kg / m^3')).toEqual(
        new NumberWithUnits(
          'fraction',
          0,
          new Fraction(false, 0, 2, 3),
          uof.fromRawInputString('kg / m^3')
        )
      );
      expect(nwuof.fromRawInputString('2')).toEqual(
        new NumberWithUnits(
          'real',
          2,
          new Fraction(false, 0, 0, 1),
          uof.fromRawInputString('')
        )
      );
      expect(nwuof.fromRawInputString('2 / 3')).toEqual(
        new NumberWithUnits(
          'fraction',
          0,
          new Fraction(false, 0, 2, 3),
          uof.fromRawInputString('')
        )
      );
      expect(nwuof.fromRawInputString('$ 2.02')).toEqual(
        new NumberWithUnits(
          'real',
          2.02,
          new Fraction(false, 0, 0, 1),
          uof.fromRawInputString('$')
        )
      );
      expect(nwuof.fromRawInputString('Rs 2 / 3 per hour')).toEqual(
        new NumberWithUnits(
          'fraction',
          0,
          new Fraction(false, 0, 2, 3),
          uof.fromRawInputString('Rs / hour')
        )
      );
      expect(nwuof.fromRawInputString('₹ 2 / 3 per hour')).toEqual(
        new NumberWithUnits(
          'fraction',
          0,
          new Fraction(false, 0, 2, 3),
          uof.fromRawInputString('₹ / hour')
        )
      );
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
        nwuof.fromRawInputString('₹ 3^');
      }).toThrowError(errors.INVALID_VALUE);
      expect(() => {
        nwuof.fromRawInputString('₹ - $25');
      }).toThrowError(errors.INVALID_CURRENCY);
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
      }).toThrowError('Unexpected "*" in "m**2" at index 2');
      expect(() => {
        nwuof.fromRawInputString('2 kg / m^(2)');
      }).toThrowError(
        'In "kg / m^(2)", "^" must be followed by a floating-point number'
      );
    });

    it('should throw errors for duplicated units', () => {
      // Simple duplicate units like "m m".

      expect(() => {
        nwuof.fromRawInputString('2 m m');
      }).toThrowError(
        'Your answer has a repeated unit: "m". Try rewriting it as "m^2".'
      );

      // Check complex expressions like "((m)/(s^2))(m/kg)".

      expect(() => {
        nwuof.fromRawInputString('2 ((m)/(s^2))(m/kg)');
      }).toThrowError(
        'Your answer has a repeated unit: "m". Try rewriting it as "m^2/(s^2 kg)".'
      );

      // Mixed normalized and unnormalized units like "m/meter".

      expect(() => {
        nwuof.fromRawInputString('2 ((m/meter)/s meter)/kg');
      }).toThrowError(
        'Your answer has a repeated unit: "m". Try rewriting it as "m/(s kg)".'
      );

      // Both are normalized as "yard".

      expect(() => {
        nwuof.fromRawInputString('2 yard yards');
      }).toThrowError(
        'Your answer has a repeated unit: "yard". Try rewriting it as "yard^2".'
      );

      // Units mapped to the same normalized value, such as "meter" and "m".

      expect(() => {
        nwuof.fromRawInputString('3 m meter');
      }).toThrowError(
        'Your answer has a repeated unit: "m". Try rewriting it as "m^2".'
      );

      expect(() => {
        nwuof.fromRawInputString('3 m^2 sec^-3 m');
      }).toThrowError(
        'Your answer has a repeated unit: "m". Try rewriting it as "m^3/sec^3".'
      );

      // Multiple duplicates within a single expression.

      expect(() => {
        nwuof.fromRawInputString('6 ((m m)/(kg kg))');
      }).toThrowError(
        'Your answer has a repeated unit: "m". Try rewriting it as "m^2/kg^2".'
      );

      // Units with mismatched exponents in division.

      expect(() => {
        nwuof.fromRawInputString('2 s^4/s^3');
      }).toThrowError(
        'Your answer has a repeated unit: "s". Try rewriting it as "s".'
      );

      // Units with mismatched exponents in multiplication.

      expect(() => {
        nwuof.fromRawInputString('2 s^4 s^3');
      }).toThrowError(
        'Your answer has a repeated unit: "s". Try rewriting it as "s^7".'
      );

      // Mismatched exponents in multiplication and division.

      expect(() => {
        nwuof.fromRawInputString('2 m^3/m m^2');
      }).toThrowError(
        'Your answer has a repeated unit: "m". Try rewriting it as "m^4".'
      );

      // Repetition in ratios like "(m/m) m".

      expect(() => {
        nwuof.fromRawInputString('1 (m/m) m');
      }).toThrowError(
        'Your answer has a repeated unit: "m". Try rewriting it as "m".'
      );

      // Invalid nested parentheses with duplicated units and space variation.

      expect(() => {
        nwuof.fromRawInputString('2 ((m)/(s^2))/(m  kg)');
      }).toThrowError(
        'Your answer has a repeated unit: "m". Try rewriting it as "1/(s^2 kg)".'
      );

      // Excessive duplicate units in the denominator.

      expect(() => {
        nwuof.fromRawInputString('2 km / (s s s sec)');
      }).toThrowError(
        'Your answer has a repeated unit: "s". Try rewriting it as "km/s^4".'
      );

      // Mixed normalized and unnormalized units.

      expect(() => {
        nwuof.fromRawInputString('4 (meter^3)/(m^3 kg)');
      }).toThrowError(
        'Your answer has a repeated unit: "meter". Try rewriting it as "1/kg".'
      );

      // Negative exponent usage.

      expect(() => {
        nwuof.fromRawInputString('4 m/(m^-2 m)');
      }).toThrowError(
        'Your answer has a repeated unit: "m". Try rewriting it as "m^2".'
      );
    });

    it('should throw errors for duplicated slashes', () => {
      // Multiple slashes in an expression.

      expect(() => {
        nwuof.fromRawInputString('2 km/s/m/kg');
      }).toThrowError(
        'Your answer contains more than one slash ("/"). Try rewriting it as "km/(s m kg)".'
      );

      // Excessive slashes in a complex expression.

      expect(() => {
        nwuof.fromRawInputString('2 km/s^2/m/kg/in/mol');
      }).toThrowError(
        'Your answer contains more than one slash ("/"). Try rewriting it as "km/(s^2 m kg in mol)".'
      );
    });
    it('should create currency units', () => {
      const createCurrencyUnitsSpy = spyOn(nwuof, 'createCurrencyUnits');
      nwuof.createCurrencyUnits();
      expect(createCurrencyUnitsSpy).toHaveBeenCalled();
    });

    it('should create NumberWithUnits object from dict', () => {
      let numberWithUnitsObject = {
        type: 'dummy-type',
        real: 1,
        fraction: {
          isNegative: false,
          wholeNumber: 2,
          numerator: 1,
          denominator: 3,
        },
        units: [
          {
            unit: 'kg',
            exponent: 2,
          },
        ],
      };

      let createdNumberWithUnits = nwuof.fromDict(numberWithUnitsObject);
      expect(createdNumberWithUnits.toDict()).toEqual(numberWithUnitsObject);
    });

    it(
      'should throw error if real number contains fraction part or vice' +
        ' versa when creating NumberWithUnits object from dict',
      () => {
        let realNumberWithFractionPart = {
          type: 'real',
          real: 1,
          fraction: {
            isNegative: false,
            wholeNumber: 2,
            numerator: 1,
            denominator: 3,
          },
          units: [
            {
              unit: 'kg',
              exponent: 2,
            },
          ],
        };

        let fractionNumberWithRealPart = {
          type: 'fraction',
          real: 1,
          fraction: {
            isNegative: false,
            wholeNumber: 2,
            numerator: 1,
            denominator: 3,
          },
          units: [
            {
              unit: 'kg',
              exponent: 2,
            },
          ],
        };

        expect(() => nwuof.fromDict(realNumberWithFractionPart)).toThrowError(
          'Number with type real cannot have a fraction part.'
        );
        expect(() => nwuof.fromDict(fractionNumberWithRealPart)).toThrowError(
          'Number with type fraction cannot have a real part.'
        );
      }
    );

    it('should convert list to math.js compatible string', () => {
      expect(
        new NumberWithUnits(
          'real',
          1,
          new Fraction(false, 0, 0, 1),
          new Units([{unit: 'kg', exponent: 2}])
        ).toMathjsCompatibleString()
      ).toBe('1 kg^2');

      expect(
        new NumberWithUnits(
          'fraction',
          0,
          new Fraction(false, 2, 1, 3),
          new Units([{unit: 'kg', exponent: 2}])
        ).toMathjsCompatibleString()
      ).toBe('2 1/3 kg^2');
    });

    it(
      'should throw error when creating NumberWithUnitsObject having real' +
        ' type with fraction part or vice versa',
      () => {
        expect(() =>
          new NumberWithUnits(
            'real',
            1,
            new Fraction(false, 2, 1, 3),
            new Units([{unit: 'kg', exponent: 2}])
          ).toMathjsCompatibleString()
        ).toThrowError('Number with type real cannot have a fraction part.');

        expect(() =>
          new NumberWithUnits(
            'fraction',
            1,
            new Fraction(false, 2, 1, 3),
            new Units([{unit: 'kg', exponent: 2}])
          ).toMathjsCompatibleString()
        ).toThrowError('Number with type fraction cannot have a real part.');
      }
    );

    it('should convert units to their canonical form', () => {
      expect(
        new NumberWithUnits(
          'real',
          1,
          new Fraction(false, 0, 0, 1),
          uof.fromRawInputString('celsius / meter')
        ).getCanonicalRepresentationOfUnits()
      ).toEqual(
        new Units([
          {unit: 'degC', exponent: 1},
          {unit: 'm', exponent: -1},
        ]).units
      );

      expect(
        new NumberWithUnits(
          'real',
          24,
          new Fraction(false, 0, 0, 1),
          uof.fromRawInputString('dollar / megatonne')
        ).getCanonicalRepresentationOfUnits()
      ).toEqual(
        new Units([
          {unit: 'dollar', exponent: 1},
          {unit: 'Mton', exponent: -1},
        ]).units
      );

      expect(
        new NumberWithUnits(
          'real',
          1,
          new Fraction(false, 0, 0, 1),
          uof.fromRawInputString('m / in')
        ).getCanonicalRepresentationOfUnits()
      ).toEqual(
        new Units([
          {unit: 'in', exponent: -1},
          {unit: 'm', exponent: 1},
        ]).units
      );

      expect(
        new NumberWithUnits(
          'real',
          1,
          new Fraction(false, 0, 0, 1),
          uof.fromRawInputString('m / Rupee')
        ).getCanonicalRepresentationOfUnits()
      ).toEqual(
        new Units([
          {unit: 'm', exponent: 1},
          {unit: 'Rs', exponent: -1},
        ]).units
      );
    });

    it('should convert units to their canonical form and sort them lexographically', () => {
      expect(
        new NumberWithUnits(
          'real',
          1,
          new Fraction(false, 0, 0, 1),
          new Units([
            {unit: 'newton', exponent: 1},
            {unit: 'meter', exponent: -1},
            {unit: 'celsius', exponent: -2},
            {unit: 'arcminutes', exponent: -3},
            {unit: 'cycle', exponent: -1},
          ])
        ).getCanonicalRepresentationOfUnits()
      ).toEqual(
        new Units([
          {unit: 'arcmin', exponent: -3},
          {unit: 'cycle', exponent: -1},
          {unit: 'degC', exponent: -2},
          {unit: 'm', exponent: -1},
          {unit: 'N', exponent: 1},
        ]).units
      );
    });
  });
});
