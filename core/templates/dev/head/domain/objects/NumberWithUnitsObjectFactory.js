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
 * @fileoverview Factory for creating instances of NumberWithUnits and Units
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

oppia.constant('CURRENCY_UNITS', {
  dollar: ['$', 'dollars', 'Dollars', 'Dollar', 'USD'],
  rupee: ['Rs', 'rupees', '₹', 'Rupees', 'Rupee'],
  cent: ['cents', 'Cent', 'Cents'],
  paise: ['paisa', 'Paise', 'Paisa']
});

oppia.factory('NumberWithUnitsObjectFactory', [
  'UnitsObjectFactory', 'FractionObjectFactory', 'CURRENCY_UNITS',
  'NUMBER_WITH_UNITS_PARSING_ERRORS', function(
      UnitsObjectFactory, FractionObjectFactory, CURRENCY_UNITS,
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
        Units.createCurrencyUnits();
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

          if (units.indexOf('$') !== -1 || units.indexOf('Rs') !== -1 ||
            units.indexOf('₹') !== -1) {
            throw new Error(
              NUMBER_WITH_UNITS_PARSING_ERRORS.INVALID_CURRENCY_FORMAT);
          }
        } else {
          if (!rawInput.startsWith('$') && !rawInput.startsWith('Rs ') &&
            !rawInput.startsWith('₹')) {
            throw new Error(NUMBER_WITH_UNITS_PARSING_ERRORS.INVALID_CURRENCY);
          }
          var ind = rawInput.indexOf(rawInput.match(/[0-9]/));
          if (ind === -1) {
            throw new Error(NUMBER_WITH_UNITS_PARSING_ERRORS.INVALID_CURRENCY);
          }
          units = rawInput.substr(0, ind).trim() + ' ';
          if (units !== '$ ' && units !== 'Rs ' && units !== '₹ ') {
            throw new Error(NUMBER_WITH_UNITS_PARSING_ERRORS.INVALID_CURRENCY);
          }
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

      unitsObj = UnitsObjectFactory.fromRawInputString(units);
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

oppia.factory('UnitsObjectFactory', ['CURRENCY_UNITS',
  function(CURRENCY_UNITS) {
    var Units = function(unitsList) {
      this.units = unitsList;
    };

    var isunit = function(unit) {
      return !('/*() '.includes(unit));
    };

    Units.stringToLexical = function(units) {
      units += '#';
      var unitList = [];
      var unit = '';
      for (var i = 0; i < units.length; i++) {
        if ('*/()# '.includes(units[i]) && unit !== 'per') {
          if (unit.length > 0) {
            if ((unitList.length > 0) && isunit(unitList.slice(-1).pop())) {
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
    };

    var unitWithMultiplier = function(unitList) {
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
        } else if (isunit(unitList[ind])) {
          unitsWithMultiplier.push([unitList[ind], multiplier]);
          // If previous element was division then we need to invert
          // multiplier.
          if (unitList[ind - 1] === '/') {
            multiplier = -multiplier;
          }
        }
      }
      return unitsWithMultiplier;
    };

    var convertUnitDictToList = function(unitDict) {
      var unitList = [];
      for (var key in unitDict) {
        unitList.push({unit: key, exponent: unitDict[key]});
      }
      return unitList;
    };

    var unitToList = function(unitsWithMultiplier) {
      var unitDict = {};
      for (var i = 0; i < unitsWithMultiplier.length; i++) {
        var unit = unitsWithMultiplier[i][0];
        var multiplier = unitsWithMultiplier[i][1];
        var ind = unit.indexOf('^');
        if (ind > -1) {
          var s = unit.substr(0, ind);
          var power = parseInt(unit.substr(ind + 1));
        } else {
          var s = unit;
          var power = 1;
        }
        if (!(s in unitDict)) {
          unitDict[s] = 0;
        }
        unitDict[s] += multiplier * power;
      }
      return convertUnitDictToList(unitDict);
    };

    Units.prototype.toDict = function() {
      return {
        units: this.units
      };
    };

    Units.fromList = function(unitsList) {
      return new Units(unitsList);
    };

    Units.fromStringToList = function(unitsString) {
      return unitToList(unitWithMultiplier(Units.stringToLexical(unitsString)));
    };

    Units.prototype.toString = function() {
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
    };

    Units.createCurrencyUnits = function() {
      // Creates user-defined currency (base + sub) units.
      math.createUnit('dollar', {aliases: CURRENCY_UNITS.dollar});
      math.createUnit('cent', {
        definition: '0.01 dollar', aliases: CURRENCY_UNITS.cent});
      math.createUnit('rupee', {aliases: CURRENCY_UNITS.rupee});
      math.createUnit('paise', {
        definition: '0.01 rupee', aliases: CURRENCY_UNITS.paise});
    };

    Units.toMathjsCompatibleString = function(units) {
      // Makes the units compatible with the math.js allowed format.
      units = units.replace(/per/g, '/');

      // Special symbols need to be replaced as math.js doesn't support custom
      // units starting with special symbols. Also, it doesn't allow units
      // followed by a number as in the case of currency units.
      if (units.includes('$')) {
        units = units.replace('$', '');
        units = 'dollar ' + units;
      }
      if (units.includes('Rs') || units.includes('₹')) {
        units = units.replace('Rs', '');
        units = units.replace('₹', '');
        units = 'rupee ' + units;
      }

      for (var i = 0; i < CURRENCY_UNITS.dollar.length; i++) {
        if (units.includes(CURRENCY_UNITS.dollar[i])) {
          units = units.replace(CURRENCY_UNITS.dollar[i], 'dollar');
        }
      }

      for (var i = 0; i < CURRENCY_UNITS.rupee.length; i++) {
        if (units.includes(CURRENCY_UNITS.rupee[i])) {
          units = units.replace(CURRENCY_UNITS.rupee[i], 'rupee');
        }
      }
      return units.trim();
    };

    Units.fromRawInputString = function(units) {
      try {
        Units.createCurrencyUnits();
      } catch (parsingError) {}

      compatibleUnits = Units.toMathjsCompatibleString(units);
      if (compatibleUnits !== '') {
        try {
          math.unit(compatibleUnits);
        } catch (err) {
          throw new Error(err);
        }
      }
      return new Units(Units.fromStringToList(units));
    };

    return Units;
  }]);
