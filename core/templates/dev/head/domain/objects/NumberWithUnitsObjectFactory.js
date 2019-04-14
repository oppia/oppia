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

oppia.constant('NUMBER_WITH_UNITS_PARSING_ERRORS', {
  INVALID_VALUE:
    'Please ensure that value is either a fraction or a number',
  INVALID_CURRENCY:
    'Please enter a valid currency (e.g., $5 or Rs 5)',
  INVALID_CURRENCY_FORMAT: 'Please write currency units at the beginning',
  INVALID_UNIT_CHARS:
    'Please ensure that unit only contains numbers, alphabets, (, ), *, ^, /, -'
});

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
oppia.constant('CURRENCY_UNITS', {
  dollar: {
    name: 'dollar',
    aliases: ['$', 'dollars', 'Dollars', 'Dollar', 'USD'],
    front_units: ['$'],
    base_unit: null
  },
  rupee: {
    name: 'rupee',
    aliases: ['Rs', 'rupees', '₹', 'Rupees', 'Rupee'],
    front_units: ['Rs ', '₹'],
    base_unit: null
  },
  cent: {
    name: 'cent',
    aliases: ['cents', 'Cents', 'Cent'],
    front_units: [],
    base_unit: '0.01 dollar'
  },
  paise: {
    name: 'paise',
    aliases: ['paisa', 'Paise', 'Paisa'],
    front_units: [],
    base_unit: '0.01 rupee'
  }
});

oppia.factory('NumberWithUnitsObjectFactory', [
  'FractionObjectFactory', 'UnitsObjectFactory', 'CURRENCY_UNITS',
  'NUMBER_WITH_UNITS_PARSING_ERRORS', function(
      FractionObjectFactory, UnitsObjectFactory, CURRENCY_UNITS,
      NUMBER_WITH_UNITS_PARSING_ERRORS) {
    var NumberWithUnits = function(type, real, fractionObj, unitsObj) {
      this.type = type;
      this.real = real;
      this.fraction = fractionObj;
      this.units = unitsObj.units;
    };

    NumberWithUnits.prototype.toString = function() {
      var numberWithUnitsString = '';
      var unitsString = UnitsObjectFactory.fromList(this.units).toString();
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
    };

    NumberWithUnits.prototype.toMathjsCompatibleString = function() {
      var numberWithUnitsString = '';
      var unitsString = UnitsObjectFactory.fromList(this.units).toString();
      unitsString = UnitsObjectFactory.toMathjsCompatibleString(unitsString);

      if (this.type === 'real') {
        numberWithUnitsString += this.real + ' ';
      } else if (this.type === 'fraction') {
        numberWithUnitsString += this.fraction.toString() + ' ';
      }
      numberWithUnitsString += unitsString.trim();
      numberWithUnitsString = numberWithUnitsString.trim();

      return numberWithUnitsString;
    };

    NumberWithUnits.prototype.toDict = function() {
      return {
        type: this.type,
        real: this.real,
        fraction: this.fraction.toDict(),
        units: this.units
      };
    };

    NumberWithUnits.createCurrencyUnits = function() {
      try {
        UnitsObjectFactory.createCurrencyUnits();
      } catch (parsingError) {}
    };

    NumberWithUnits.fromRawInputString = function(rawInput) {
      rawInput = rawInput.trim();
      var type = '';
      var real = 0.0;
      // Default fraction value.
      var fractionObj = FractionObjectFactory.fromRawInputString('0/1');
      var units = '';
      var value = '';
      var unitObj = [];

      // Allow validation only when rawInput is not null or an empty string.
      if (rawInput !== '' && rawInput !== null) {
        // Start with digit when there is no currency unit.
        if (rawInput.match(/^\d/)) {
          var ind = rawInput.indexOf(rawInput.match(/[a-z(₹$]/i));
          if (ind === -1) {
            // There is value with no units.
            value = rawInput;
            units = '';
          } else {
            value = rawInput.substr(0, ind).trim();
            units = rawInput.substr(ind).trim();
          }

          var keys = Object.keys(CURRENCY_UNITS);
          for (var i = 0; i < keys.length; i++) {
            for (var j = 0;
              j < CURRENCY_UNITS[keys[i]].front_units.length; j++) {
              if (units.indexOf(
                CURRENCY_UNITS[keys[i]].front_units[j]) !== -1) {
                throw new Error(
                  NUMBER_WITH_UNITS_PARSING_ERRORS.INVALID_CURRENCY_FORMAT);
              }
            }
          }
        } else {
          var startsWithCorrectCurrencyUnit = false;
          var keys = Object.keys(CURRENCY_UNITS);
          for (var i = 0; i < keys.length; i++) {
            for (var j = 0;
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
          var ind = rawInput.indexOf(rawInput.match(/[0-9]/));
          if (ind === -1) {
            throw new Error(NUMBER_WITH_UNITS_PARSING_ERRORS.INVALID_CURRENCY);
          }
          units = rawInput.substr(0, ind).trim();

          startsWithCorrectCurrencyUnit = false;
          for (var i = 0; i < keys.length; i++) {
            for (var j = 0;
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

          var ind2 = rawInput.indexOf(
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
          fractionObj = FractionObjectFactory.fromRawInputString(value);
        } else {
          type = 'real';
          real = parseFloat(value);
        }
        if (units !== '') {
          // Checking invalid characters in units.
          if (units.match(/[^0-9a-z/* ^()₹$-]/i)) {
            throw new Error(
              NUMBER_WITH_UNITS_PARSING_ERRORS.INVALID_UNIT_CHARS);
          }
        }
      }

      var unitsObj = UnitsObjectFactory.fromRawInputString(units);
      return new NumberWithUnits(type, real, fractionObj, unitsObj);
    };

    NumberWithUnits.fromDict = function(numberWithUnitsDict) {
      return new NumberWithUnits(
        numberWithUnitsDict.type,
        numberWithUnitsDict.real,
        FractionObjectFactory.fromDict(numberWithUnitsDict.fraction),
        UnitsObjectFactory.fromList(numberWithUnitsDict.units));
    };

    return NumberWithUnits;
  }
]);
