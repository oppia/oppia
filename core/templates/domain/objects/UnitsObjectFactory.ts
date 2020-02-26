// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Factory for creating instances of Units domain objects.
 */

export interface IUnitsDict {
  // TODO(#7165): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'units' is a list with varying element types. An exact
  // type needs to be found for it.
  units: any;
}

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { createUnit, unit } from 'mathjs';

import { ObjectsDomainConstants } from
  'domain/objects/objects-domain.constants';

export class Units {
  // TODO(#7165): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'units' is a list with varying element types. An exact
  // type needs to be found for it.
  units: any;
  constructor(unitsList: any) {
    this.units = unitsList;
  }

  toDict(): IUnitsDict {
    return {
      units: this.units
    };
  }

  toString(): string {
    var unit = '';
    for (var i = 0; i < this.units.length; i++) {
      var d = this.units[i];
      if (d.exponent === 1) {
        unit += d.unit + ' ';
      } else {
        unit += d.unit + '^' + d.exponent.toString() + ' ';
      }
    }
    return unit.trim();
  }
}

@Injectable({
  providedIn: 'root'
})
export class UnitsObjectFactory {
  isunit(unit: string): boolean {
    return !('/*() '.includes(unit));
  }

  stringToLexical(units: string): string[] {
    units += '#';
    var unitList = [];
    var unit = '';
    for (var i = 0; i < units.length; i++) {
      if ('*/()# '.includes(units[i]) && unit !== 'per') {
        if (unit.length > 0) {
          if ((unitList.length > 0) && this.isunit(unitList.slice(-1).pop())) {
            unitList.push('*');
          }
          unitList.push(unit);
          unit = '';
        }
        if (!('# '.includes(units[i]))) {
          unitList.push(units[i]);
        }
      } else if (units[i] === ' ' && unit === 'per') {
        unitList.push('/');
        unit = '';
      } else {
        unit += units[i];
      }
    }
    return unitList;
  }

  // TODO(#7165): Replace 'any' with the exact type. This has been kept as
  // 'any' because the return type is a list with varying element types. An
  // exact type needs to be found for it.
  unitWithMultiplier(unitList: string[]): any {
    var multiplier = 1;
    var unitsWithMultiplier = [];
    var parenthesisStack = [];

    for (var ind = 0; ind < unitList.length; ind++) {
      if (unitList[ind] === '/') {
        multiplier = -multiplier;
      } else if (unitList[ind] === '(') {
        if (unitList[ind - 1] === '/') {
          // If previous element was division then we need to inverse
          // multiplier when we find its corresponsing closing parenthesis.
          // Second element of pushed element is used for this purpose.
          parenthesisStack.push(['(', -1]);
        } else {
          // If previous element was not division then we don't need to
          // invert the multiplier.
          parenthesisStack.push(['(', 1]);
        }
      } else if (unitList[ind] === ')') {
        var elem = parenthesisStack.pop();
        multiplier = parseInt(elem[1]) * multiplier;
      } else if (this.isunit(unitList[ind])) {
        unitsWithMultiplier.push([unitList[ind], multiplier]);
        // If previous element was division then we need to invert
        // multiplier.
        if (unitList[ind - 1] === '/') {
          multiplier = -multiplier;
        }
      }
    }
    return unitsWithMultiplier;
  }

  // TODO(#7165): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'unitDict' is a dict with varying element types. An
  // exact type needs to be found for it, Once that is found the return type
  // can also be typed.
  convertUnitDictToList(unitDict: any): any[] {
    var unitList = [];
    for (var key in unitDict) {
      unitList.push({unit: key, exponent: unitDict[key]});
    }
    return unitList;
  }

  // TODO(#7165): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'unitsWithMultiplier' is a dict with varying element types.
  // An exact type needs to be found for it, Once that is found the return type
  // can also be typed.
  unitToList(unitsWithMultiplier: any): any {
    var unitDict = {};
    for (var i = 0; i < unitsWithMultiplier.length; i++) {
      var unit = unitsWithMultiplier[i][0];
      var multiplier = unitsWithMultiplier[i][1];
      var ind = unit.indexOf('^');
      var s = null;
      var power = null;
      if (ind > -1) {
        s = unit.substr(0, ind);
        power = parseInt(unit.substr(ind + 1));
      } else {
        s = unit;
        power = 1;
      }
      if (!(s in unitDict)) {
        unitDict[s] = 0;
      }
      unitDict[s] += multiplier * power;
    }
    return this.convertUnitDictToList(unitDict);
  }

  // TODO(#7165): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'units' is a list with varying element types. An exact
  // type needs to be found for it.
  fromList(unitsList: any): Units {
    return new Units(unitsList);
  }

  // TODO(#7165): Replace 'any' with the exact type. This has been kept as
  // 'any' because the return type is to be determined once 'unitToList' has
  // determined return type.
  fromStringToList(unitsString: string): any {
    return this.unitToList(
      this.unitWithMultiplier(this.stringToLexical(unitsString)));
  }

  createCurrencyUnits(): void {
    var keys = Object.keys(ObjectsDomainConstants.CURRENCY_UNITS);
    for (var i = 0; i < keys.length; i++) {
      if (ObjectsDomainConstants.CURRENCY_UNITS[keys[i]].base_unit === null) {
        // Base unit (like: rupees, dollar etc.).
        createUnit(ObjectsDomainConstants.CURRENCY_UNITS[keys[i]].name, {
          aliases: ObjectsDomainConstants.CURRENCY_UNITS[keys[i]].aliases});
      } else {
        // Sub unit (like: paise, cents etc.).
        createUnit(ObjectsDomainConstants.CURRENCY_UNITS[keys[i]].name, {
          definition: ObjectsDomainConstants.CURRENCY_UNITS[keys[i]].base_unit,
          aliases: ObjectsDomainConstants.CURRENCY_UNITS[keys[i]].aliases});
      }
    }
  }

  // TODO(#7165): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'units' is a list with varying element types. An exact
  // type needs to be found for it.
  toMathjsCompatibleString(units: any): string {
    // Makes the units compatible with the math.js allowed format.
    units = units.replace(/per/g, '/');

    // Special symbols need to be replaced as math.js doesn't support custom
    // units starting with special symbols. Also, it doesn't allow units
    // followed by a number as in the case of currency units.
    var keys = Object.keys(ObjectsDomainConstants.CURRENCY_UNITS);
    for (var i = 0; i < keys.length; i++) {
      for (
        var j = 0;
        j < ObjectsDomainConstants.CURRENCY_UNITS[keys[i]].front_units.length;
        j++) {
        if (
          units.includes(
            ObjectsDomainConstants.CURRENCY_UNITS[keys[i]].front_units[j])) {
          units = units.replace(
            ObjectsDomainConstants.CURRENCY_UNITS[keys[i]].front_units[j], '');
          units = ObjectsDomainConstants.CURRENCY_UNITS[keys[i]].name + units;
        }
      }

      for (
        var j = 0;
        j < ObjectsDomainConstants.CURRENCY_UNITS[keys[i]].aliases.length;
        j++) {
        if (
          units.includes(
            ObjectsDomainConstants.CURRENCY_UNITS[keys[i]].aliases[j])) {
          units = units.replace(
            ObjectsDomainConstants.CURRENCY_UNITS[keys[i]].aliases[j],
            ObjectsDomainConstants.CURRENCY_UNITS[keys[i]].name);
        }
      }
    }
    return units.trim();
  }

  // TODO(#7165): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'units' is a list with varying element types. An exact
  // type needs to be found for it.
  fromRawInputString(units: any): Units {
    try {
      this.createCurrencyUnits();
    } catch (parsingError) {}

    var compatibleUnits = this.toMathjsCompatibleString(units);
    if (compatibleUnits !== '') {
      try {
        unit(compatibleUnits);
      } catch (err) {
        throw new Error(err);
      }
    }
    return new Units(this.fromStringToList(units));
  }
}

angular.module('oppia').factory(
  'UnitsObjectFactory', downgradeInjectable(UnitsObjectFactory));
