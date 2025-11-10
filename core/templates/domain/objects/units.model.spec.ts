// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview unit tests for the Units model class.
 */

import {Units} from 'domain/objects/units.model';

describe('Units', () => {
  it('should test the createCurrencyUnits function', () => {
    const spy = spyOn(Units, 'createCurrencyUnits');
    Units.createCurrencyUnits();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should convert unitsList to a string in Units format', () => {
    expect(Units.fromList([{exponent: -1, unit: 'cents'}]).toString()).toBe(
      'cents^-1'
    );
    expect(Units.fromList([{exponent: 1, unit: 'mol'}]).toString()).toBe('mol');
    expect(Units.fromList([{exponent: 2, unit: 'N'}]).toString()).toBe('N^2');
    expect(
      Units.fromList([
        {exponent: 3, unit: 'cm'},
        {exponent: -3, unit: 's'},
      ]).toString()
    ).toBe('cm^3 s^-3');
    expect(
      Units.fromList([
        {exponent: 1, unit: 'paise'},
        {exponent: -1, unit: 'kg'},
        {exponent: 1, unit: 'N'},
        {exponent: 1, unit: 'm'},
        {exponent: -2, unit: 's'},
      ]).toString()
    ).toBe('paise kg^-1 N m s^-2');
  });

  it('should convert Units to list format', () => {
    expect(Units.fromStringToList('kg / kg^4 K mol / (N m s^2) K s')).toEqual([
      {exponent: -3, unit: 'kg'},
      {exponent: 2, unit: 'K'},
      {exponent: 1, unit: 'mol'},
      {exponent: -1, unit: 'N'},
      {exponent: -1, unit: 'm'},
      {exponent: -1, unit: 's'},
    ]);
    expect(Units.fromStringToList('cm /(kg / (N m / s^3))')).toEqual([
      {exponent: 1, unit: 'cm'},
      {exponent: -1, unit: 'kg'},
      {exponent: 1, unit: 'N'},
      {exponent: 1, unit: 'm'},
      {exponent: -3, unit: 's'},
    ]);
    expect(Units.fromStringToList('mol per (kg per (N m per s^3) K)')).toEqual([
      {exponent: 1, unit: 'mol'},
      {exponent: -1, unit: 'kg'},
      {exponent: 1, unit: 'N'},
      {exponent: 1, unit: 'm'},
      {exponent: -3, unit: 's'},
      {exponent: -1, unit: 'K'},
    ]);
    expect(Units.fromStringToList('cents kg (N^7 per paise)')).toEqual([
      {exponent: 1, unit: 'cents'},
      {exponent: 1, unit: 'kg'},
      {exponent: 7, unit: 'N'},
      {exponent: -1, unit: 'paise'},
    ]);
  });

  it('should convert Units from string to lexical format', () => {
    expect(
      Units.stringToLexical('kg per kg^4 K mol per (N m s^2) K s')
    ).toEqual([
      'kg',
      '/',
      'kg^4',
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
    expect(Units.stringToLexical('cm /(kg / (N m / s^3))')).toEqual([
      'cm',
      '/',
      '(',
      'kg',
      '/',
      '(',
      'N',
      '*',
      'm',
      '/',
      's^3',
      ')',
      ')',
    ]);
    expect(
      Units.stringToLexical('mol per (kg per (N m per s^3) paise)')
    ).toEqual([
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
      's^3',
      ')',
      'paise',
      ')',
    ]);
  });

  it('should parse valid Units strings', () => {
    expect(Units.fromRawInputString('').toDict()).toEqual(
      Units.fromList([]).toDict()
    );
    expect(
      Units.fromRawInputString('kg per kg^4 K mol per (N m s^2) K s').toDict()
    ).toEqual(
      Units.fromList([
        {exponent: -3, unit: 'kg'},
        {exponent: 2, unit: 'K'},
        {exponent: 1, unit: 'mol'},
        {exponent: -1, unit: 'N'},
        {exponent: -1, unit: 'm'},
        {exponent: -1, unit: 's'},
      ]).toDict()
    );
    expect(Units.fromRawInputString('cm /(kg / (N m / s^3))').toDict()).toEqual(
      Units.fromList([
        {exponent: 1, unit: 'cm'},
        {exponent: -1, unit: 'kg'},
        {exponent: 1, unit: 'N'},
        {exponent: 1, unit: 'm'},
        {exponent: -3, unit: 's'},
      ]).toDict()
    );
    expect(
      Units.fromRawInputString('cent per (kg per (N m per s^3) paise)').toDict()
    ).toEqual(
      Units.fromList([
        {exponent: 1, unit: 'cent'},
        {exponent: -1, unit: 'kg'},
        {exponent: 1, unit: 'N'},
        {exponent: 1, unit: 'm'},
        {exponent: -3, unit: 's'},
        {exponent: -1, unit: 'paise'},
      ]).toDict()
    );
  });

  it('should have Units without char /, *, (, )', () => {
    expect(Units.isunit('kg cm^3')).toBe(true);
    expect(Units.isunit('/*')).toBe(false);
    expect(Units.isunit('()')).toBe(false);
  });

  it('should convert new Units from the list', () => {
    expect(Units.fromList([{exponent: -1, unit: 'kg'}])).toEqual(
      new Units([{exponent: -1, unit: 'kg'}])
    );
    expect(Units.fromList([{exponent: 1, unit: 'mol'}])).toEqual(
      new Units([{exponent: 1, unit: 'mol'}])
    );
    expect(
      Units.fromList([
        {exponent: 3, unit: 'cm'},
        {exponent: -3, unit: 's'},
      ])
    ).toEqual(
      new Units([
        {exponent: 3, unit: 'cm'},
        {exponent: -3, unit: 's'},
      ])
    );
    expect(
      Units.fromList([
        {exponent: 1, unit: 'paise'},
        {exponent: -1, unit: 'kg'},
        {exponent: 1, unit: 'N'},
        {exponent: 1, unit: 'm'},
        {exponent: -2, unit: 's'},
      ])
    ).toEqual(
      new Units([
        {exponent: 1, unit: 'paise'},
        {exponent: -1, unit: 'kg'},
        {exponent: 1, unit: 'N'},
        {exponent: 1, unit: 'm'},
        {exponent: -2, unit: 's'},
      ])
    );
  });

  it('should have the correct division form with multiplier', () => {
    expect(
      Units.unitWithMultiplier(['cm', '/', '(', 'kg', '/', 'N', ')'])
    ).toEqual([
      ['cm', 1],
      ['kg', -1],
      ['N', 1],
    ]);
    expect(
      Units.unitWithMultiplier(['kg', '/', 'kg^4', '*', 'K', '*', 'mol'])
    ).toEqual([
      ['kg', 1],
      ['kg^4', -1],
      ['K', 1],
      ['mol', 1],
    ]);
    expect(
      Units.unitWithMultiplier(['cent', '*', '(', 'kg', '/', 'N', ')'])
    ).toEqual([
      ['cent', 1],
      ['kg', 1],
      ['N', -1],
    ]);
    expect(() =>
      Units.unitWithMultiplier(['cm', '/', 'kg', '/', 'N', ')'])
    ).toThrowError('Close parenthesis with no open parenthesis');
  });

  it('should convert a unit dict to a list', () => {
    expect(
      Units.unitToList(
        Units.unitWithMultiplier(['cm', '/', '(', 'kg', '/', 'N', ')'])
      )
    ).toEqual([
      {unit: 'cm', exponent: 1},
      {unit: 'kg', exponent: -1},
      {unit: 'N', exponent: 1},
    ]);
    expect(
      Units.unitToList(
        Units.unitWithMultiplier(['kg', '/', 'kg^4', '*', 'K', '*', 'mol'])
      )
    ).toEqual([
      {unit: 'kg', exponent: -3},
      {unit: 'K', exponent: 1},
      {unit: 'mol', exponent: 1},
    ]);
    expect(
      Units.unitToList(
        Units.unitWithMultiplier(['cent', '*', '(', 'kg', '/', 'N', ')'])
      )
    ).toEqual([
      {unit: 'cent', exponent: 1},
      {unit: 'kg', exponent: 1},
      {unit: 'N', exponent: -1},
    ]);
  });

  it('should replace the special symbol because of math.js', () => {
    expect(Units.toMathjsCompatibleString('cents')).toEqual('cent');
    expect(Units.toMathjsCompatibleString('dollars kg')).toEqual('dollar kg');
    expect(Units.toMathjsCompatibleString('rupee cents')).toEqual('rupee cent');
    expect(Units.toMathjsCompatibleString('cent USD / Paisa')).toEqual(
      'cent dollar / paise'
    );
  });

  it('should throw errors for invalid Units', () => {
    expect(() => {
      Units.fromRawInputString('NK*kg');
    }).toThrowError('Unit "NK" not found.');
    expect(() => {
      Units.fromRawInputString('per &kg$');
    }).toThrowError('Unexpected "&" in "dollar/ &kg" at index 8');
    expect(() => {
      Units.fromRawInputString('cent %mol$');
    }).toThrowError('Unit "dollarcent" not found.');
  });

  it('should return the dupplicated unit in a input string or an empty string', () => {
    expect(Units.getDuplicatedUnit('2 km km')).toEqual('km');

    expect(Units.getDuplicatedUnit('2 kg/kg^4*K*mol')).toEqual('kg');

    expect(Units.getDuplicatedUnit('2 kg/km^4*K*mol')).toEqual('');
  });

  it('should return slash if count more than one or an empty string', () => {
    expect(Units.hasMultipleSlashes('2 km/s/kg')).toEqual(true);
  });
});
