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
 * @fileoverview Factory for creating instances of NumberWithUnits
 * domain objects.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import { Fraction } from 'domain/objects/fraction.model';
import { ObjectsDomainConstants } from
  'domain/objects/objects-domain.constants';
import { Units, UnitsObjectFactory } from
  'domain/objects/UnitsObjectFactory';
import { Unit, NumberWithUnitsAnswer } from
  'interactions/answer-defs';

type CurrencyUnitsKeys = (keyof typeof ObjectsDomainConstants.CURRENCY_UNITS)[];

/* Guidelines for adding new custom currency units in Number with Units
  interaction:
  Simply add currency unit to the dict of CURRENCY_UNITS constant and it will
  be automatically added to the allowed custom units. Following are the keys
  to be defined within the unit dict:
    name:  The name of the custom currency unit.
    aliases: Other allowed canonical forms of the currency unit.
    front_units: A list of all the currency symbols that are added to the front
      (like- $, Rs, ₹). Keep it an empty list if no symbol is needed.
    base_unit: Define the unit in terms of base unit only if the defined custom
      unit is a sub unit else assign it 'null' value.*/
export class NumberWithUnits {
  type: string;
  real: number;
  fraction: Fraction;
  units: Unit[];

  constructor(
      type: string, real: number, fractionObj: Fraction,
      unitsObj: Units) {
    this.type = type;

    if (this.type === 'real') {
      if (fractionObj.numerator !== 0 || fractionObj.wholeNumber !== 0) {
        throw new Error('Number with type real cannot have a fraction part.');
      }
    } else if (this.type === 'fraction') {
      if (real !== 0) {
        throw new Error('Number with type fraction cannot have a real part.');
      }
    }

    this.real = real;
    this.fraction = fractionObj;
    this.units = unitsObj.units;
  }

  toString(): string {
    let numberWithUnitsString = '';
    // The NumberWithUnits class is allowed to have 4 properties namely
    // type, real, fraction and units. Hence, we cannot inject
    // UnitsObjectFactory, since that'll lead to creation of 5th property
    // which isn't allowed. Refer objects.py L#956.
    let unitsString = (new UnitsObjectFactory()).fromList(
      this.units).toString();
    if (unitsString.includes('$')) {
      unitsString = unitsString.replace('$', '');
      numberWithUnitsString += '$' + ' ';
    }
    if (unitsString.includes('Rs')) {
      unitsString = unitsString.replace('Rs', '');
      numberWithUnitsString += 'Rs' + ' ';
    }
    if (unitsString.includes('₹')) {
      unitsString = unitsString.replace('₹', '');
      numberWithUnitsString += '₹' + ' ';
    }

    if (this.type === 'real') {
      numberWithUnitsString += this.real + ' ';
    } else if (this.type === 'fraction') {
      numberWithUnitsString += this.fraction.toString() + ' ';
    }
    numberWithUnitsString += unitsString.trim();
    numberWithUnitsString = numberWithUnitsString.trim();
    return numberWithUnitsString;
  }

  toMathjsCompatibleString(): string {
    let numberWithUnitsString = '';
    let unitsString = (new UnitsObjectFactory()).fromList(
      this.units).toString();
    unitsString = (new UnitsObjectFactory()).toMathjsCompatibleString(
      unitsString);

    if (this.type === 'real') {
      numberWithUnitsString += this.real + ' ';
    } else if (this.type === 'fraction') {
      numberWithUnitsString += this.fraction.toString() + ' ';
    }
    numberWithUnitsString += unitsString.trim();
    numberWithUnitsString = numberWithUnitsString.trim();

    return numberWithUnitsString;
  }

  toDict(): NumberWithUnitsAnswer {
    return {
      type: this.type,
      real: this.real,
      fraction: this.fraction?.toDict(),
      units: this.units
    };
  }
}

@Injectable({
  providedIn: 'root'
})
export class NumberWithUnitsObjectFactory {
  constructor(private unitsFactory: UnitsObjectFactory) {}
  createCurrencyUnits(): void {
    try {
      this.unitsFactory.createCurrencyUnits();
    } catch (parsingError) {}
  }

  fromRawInputString(rawInput: string): NumberWithUnits {
    rawInput = rawInput.trim();
    let type = '';
    let real = 0.0;
    // Default fraction value.
    let fractionObj = Fraction.fromRawInputString('0/1');
    let units = '';
    let value = '';

    // Allow validation only when rawInput is not null or an empty string.
    if (rawInput !== '' && rawInput !== null) {
      // Start with digit when there is no currency unit.
      if (rawInput.match(/^\d/)) {
        let ind = rawInput.indexOf(String(rawInput.match(/[a-z(₹$]/i)));
        if (ind === -1) {
          // There is value with no units.
          value = rawInput;
          units = '';
        } else {
          value = rawInput.substr(0, ind).trim();
          units = rawInput.substr(ind).trim();
        }

        const keys = (
          Object.keys(
            ObjectsDomainConstants.CURRENCY_UNITS
          ) as CurrencyUnitsKeys
        );
        for (let i = 0; i < keys.length; i++) {
          let unitLength = (
            ObjectsDomainConstants.CURRENCY_UNITS[keys[i]].front_units.length);
          for (let j = 0; j < unitLength; j++) {
            if (units.indexOf(
              ObjectsDomainConstants.CURRENCY_UNITS[
                keys[i]].front_units[j]) !== -1) {
              throw new Error(
                ObjectsDomainConstants
                  .NUMBER_WITH_UNITS_PARSING_ERROR_I18N_KEYS
                  .INVALID_CURRENCY_FORMAT);
            }
          }
        }
      } else {
        let startsWithCorrectCurrencyUnit = false;
        const keys = (
          Object.keys(
            ObjectsDomainConstants.CURRENCY_UNITS
          ) as CurrencyUnitsKeys
        );
        for (let i = 0; i < keys.length; i++) {
          let unitLength = (
            ObjectsDomainConstants.CURRENCY_UNITS[keys[i]].front_units.length);
          for (let j = 0; j < unitLength; j++) {
            if (rawInput.startsWith(ObjectsDomainConstants.CURRENCY_UNITS[
              keys[i]].front_units[j])) {
              startsWithCorrectCurrencyUnit = true;
              break;
            }
          }
        }
        if (startsWithCorrectCurrencyUnit === false) {
          throw new Error(
            // eslint-disable-next-line max-len
            ObjectsDomainConstants
              .NUMBER_WITH_UNITS_PARSING_ERROR_I18N_KEYS.INVALID_CURRENCY);
        }
        const ind = rawInput.indexOf(String(rawInput.match(/[0-9]/)));
        if (ind === -1) {
          throw new Error(
            // eslint-disable-next-line max-len
            ObjectsDomainConstants
              .NUMBER_WITH_UNITS_PARSING_ERROR_I18N_KEYS.INVALID_CURRENCY);
        }
        units = rawInput.substr(0, ind).trim();

        startsWithCorrectCurrencyUnit = false;
        for (let i = 0; i < keys.length; i++) {
          let unitLength = (
            ObjectsDomainConstants.CURRENCY_UNITS[keys[i]].front_units.length);
          for (let j = 0; j < unitLength; j++) {
            if (units === ObjectsDomainConstants.CURRENCY_UNITS[
              keys[i]].front_units[j].trim()) {
              startsWithCorrectCurrencyUnit = true;
              break;
            }
          }
        }
        if (startsWithCorrectCurrencyUnit === false) {
          throw new Error(
            // eslint-disable-next-line max-len
            ObjectsDomainConstants
              .NUMBER_WITH_UNITS_PARSING_ERROR_I18N_KEYS.INVALID_CURRENCY);
        }
        units = units + ' ';

        const ind2 = rawInput.indexOf(String(
          rawInput.substr(ind).match(/[a-z(]/i)));
        if (ind2 !== -1) {
          value = rawInput.substr(ind, ind2 - ind).trim();
          units += rawInput.substr(ind2).trim();
        } else {
          value = rawInput.substr(ind).trim();
          units = units.trim();
        }
      }
      // Checking invalid characters in value.
      if (value.match(/[a-z]/i) || value.match(/[*^$₹()#@]/)) {
        throw new Error(
          // eslint-disable-next-line max-len
          ObjectsDomainConstants.NUMBER_WITH_UNITS_PARSING_ERROR_I18N_KEYS.INVALID_VALUE);
      }

      if (value.includes('/')) {
        type = 'fraction';
        fractionObj = Fraction.fromRawInputString(value);
      } else {
        type = 'real';
        real = parseFloat(value);
      }
      if (units !== '') {
        // Checking invalid characters in units.
        if (units.match(/[^0-9a-z/* ^()₹$-]/i)) {
          throw new Error(
            // eslint-disable-next-line max-len
            ObjectsDomainConstants.NUMBER_WITH_UNITS_PARSING_ERROR_I18N_KEYS.INVALID_UNIT_CHARS);
        }
      }
    }

    const unitsObj = this.unitsFactory.fromRawInputString(units);
    return new NumberWithUnits(type, real, fractionObj, unitsObj);
  }

  fromDict(numberWithUnitsDict: NumberWithUnitsAnswer): NumberWithUnits {
    return new NumberWithUnits(
      numberWithUnitsDict.type,
      numberWithUnitsDict.real,
      Fraction.fromDict(numberWithUnitsDict.fraction),
      this.unitsFactory.fromList(numberWithUnitsDict.units));
  }
}

angular.module('oppia').factory(
  'NumberWithUnitsObjectFactory', downgradeInjectable(
    NumberWithUnitsObjectFactory));
