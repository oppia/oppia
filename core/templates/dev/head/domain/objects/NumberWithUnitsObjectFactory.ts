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

import {Injectable} from '@angular/core';

/**
 * @fileoverview Factory for creating instances of NumberWithUnits
 * domain objects.
 */

require('domain/objects/FractionObjectFactory.ts');
require('domain/objects/UnitsObjectFactory.ts');

require('domain/objects/objects-domain.constants.ajs.ts');

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


import { FractionObjectFactory } from 'domain/objects/FractionObjectFactory';
import { UnitsObjectFactory } from 'domain/objects/UnitsObjectFactory';
import { ObjectsDomainConstants } from
  'domain/objects/objects-domain.constants';

const CURRENCY_UNITS = ObjectsDomainConstants.CURRENCY_UNITS;
const NUMBER_WITH_UNITS_PARSING_ERRORS = ObjectsDomainConstants.NUMBER_WITH_UNITS_PARSING_ERRORS;


class NumberWithUnits {
  type;
  real;
  fraction;
  units;
  constructor(type, real, fractionObj, unitsObj) {
    this.type = type;
    this.real = real;
    this.fraction = fractionObj;
    this.units = unitsObj.units;
  }
}
export class NumberWithUnitsObject {
  constructor(private fractionObjectFactory: FractionObjectFactory,
              private unitsObjectFactory: UnitsObjectFactory) {}
  type;
  real;
  fraction;
  units;

  toString() {
    let numberWithUnitsString = '';
    let unitsString = this.unitsObjectFactory.fromList(this.units).toString();
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

  toMathjsCompatibleString() {
    let numberWithUnitsString = '';
    let unitsString = this.unitsObjectFactory.fromList(this.units).toString();
    unitsString = this.unitsObjectFactory.toMathjsCompatibleString(unitsString);

    if (this.type === 'real') {
      numberWithUnitsString += this.real + ' ';
    } else if (this.type === 'fraction') {
      numberWithUnitsString += this.fraction.toString() + ' ';
    }
    numberWithUnitsString += unitsString.trim();
    numberWithUnitsString = numberWithUnitsString.trim();

    return numberWithUnitsString;
  }

  toDict() {
    return {
      type: this.type,
      real: this.real,
      fraction: this.fraction.toDict(),
      units: this.units
    };
  }

  createCurrencyUnits() {
    /* eslint-enable dot-notation */
    try {
      this.unitsObjectFactory.createCurrencyUnits();
    } catch (parsingError) {}
  }
}

@Injectable({
  providedIn: 'root'
})
export class NumberWithUnitsObjectFactory {
  constructor(private fractionObjectFactory: FractionObjectFactory,
              private unitsObjectFactory: UnitsObjectFactory) {}


  fromRawInputString(rawInput) {
    /* eslint-enable dot-notation */
    rawInput = rawInput.trim();
    let type = '';
    let real = 0.0;
    // Default fraction value.
    let fractionObj = this.fractionObjectFactory.fromRawInputString('0/1');
    let units = '';
    let value = '';
    let unitObj = [];

    // Allow validation only when rawInput is not null or an empty string.
    if (rawInput !== '' && rawInput !== null) {
      // Start with digit when there is no currency unit.
      if (rawInput.match(/^\d/)) {
        let ind = rawInput.indexOf(rawInput.match(/[a-z(₹$]/i));
        if (ind === -1) {
          // There is value with no units.
          value = rawInput;
          units = '';
        } else {
          value = rawInput.substr(0, ind).trim();
          units = rawInput.substr(ind).trim();
        }

        let keys = Object.keys(CURRENCY_UNITS);
        for (let i = 0; i < keys.length; i++) {
          for (let j = 0;
            j < CURRENCY_UNITS[keys[i]]
              .front_units.length; j++) {
            if (units.indexOf(CURRENCY_UNITS[keys[i]].front_units[j]) !== -1) {
              throw new Error(
                NUMBER_WITH_UNITS_PARSING_ERRORS.INVALID_CURRENCY_FORMAT);
            }
          }
        }
      } else {
        let startsWithCorrectCurrencyUnit = false;
        let keys = Object.keys(CURRENCY_UNITS);
        for (let i = 0; i < keys.length; i++) {
          for (let j = 0;
            j < CURRENCY_UNITS[keys[i]].front_units.length; j++) {
            if (rawInput.startsWith(CURRENCY_UNITS[keys[i]].front_units[j])) {
              startsWithCorrectCurrencyUnit = true;
              break;
            }
          }
        }
        if (startsWithCorrectCurrencyUnit === false) {
          throw new Error(NUMBER_WITH_UNITS_PARSING_ERRORS.INVALID_CURRENCY);
        }
        let ind = rawInput.indexOf(rawInput.match(/[0-9]/));
        if (ind === -1) {
          throw new Error(NUMBER_WITH_UNITS_PARSING_ERRORS.INVALID_CURRENCY);
        }
        units = rawInput.substr(0, ind).trim();

        startsWithCorrectCurrencyUnit = false;
        for (let i = 0; i < keys.length; i++) {
          for (let j = 0;
            j < CURRENCY_UNITS[keys[i]].front_units.length; j++) {
            if (units === CURRENCY_UNITS[keys[i]].front_units[j].trim()) {
              startsWithCorrectCurrencyUnit = true;
              break;
            }
          }
        }
        if (startsWithCorrectCurrencyUnit === false) {
          throw new Error(NUMBER_WITH_UNITS_PARSING_ERRORS.INVALID_CURRENCY);
        }
        units = units + ' ';

        let ind2 = rawInput.indexOf(
          rawInput.substr(ind).match(/[a-z(]/i));
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
        throw new Error(NUMBER_WITH_UNITS_PARSING_ERRORS.INVALID_VALUE);
      }

      if (value.includes('/')) {
        type = 'fraction';
        fractionObj = this.fractionObjectFactory.fromRawInputString(value);
      } else {
        type = 'real';
        real = parseFloat(value);
      }
      if (units !== '') {
        // Checking invalid characters in units.
        if (units.match(/[^0-9a-z/* ^()₹$-]/i)) {
          throw new Error(NUMBER_WITH_UNITS_PARSING_ERRORS.INVALID_UNIT_CHARS);
        }
      }
    }

    let unitsObj = this.unitsObjectFactory.fromRawInputString(units);
    return new NumberWithUnits(type, real, fractionObj, unitsObj);
  }

  fromDict(numberWithUnitsDict) {
    return new NumberWithUnits(
      numberWithUnitsDict.type,
      numberWithUnitsDict.real,
      this.fractionObjectFactory.fromDict(numberWithUnitsDict.fraction),
      this.unitsObjectFactory.fromList(numberWithUnitsDict.units));
  }
}
