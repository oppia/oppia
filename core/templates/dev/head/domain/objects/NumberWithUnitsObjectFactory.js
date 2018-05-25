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
    'Please enter a valid currency (e.g., $ 5 or ₹ 5)',
  INVALID_UNIT_CHARS:
    'Please ensure that unit only contains numbers, alphabets, (, ), *, ^, /, -'
});

oppia.factory('NumberWithUnitsObjectFactory', [
  'UnitsObjectFactory', 'FractionObjectFactory',
  'NUMBER_WITH_UNITS_PARSING_ERRORS', function(
      UnitsObjectFactory, FractionObjectFactory,
      NUMBER_WITH_UNITS_PARSING_ERRORS) {
    var NumberWithUnits = function(type, real, fractionObj, unitsObj) {
      this.type = type;
      this.real = real;
      this.fraction = fractionObj;
      this.units = unitsObj;
    };

    NumberWithUnits.prototype.toString = function() {
      var numberWithUnitsString = '';
      if (this.units.toString().includes('$')) {
        this.units.units = this.units.toString().replace('$', '');
        numberWithUnitsString += '$' + ' ';
      }
      if (this.units.toString().includes('Rs')) {
        this.units.units = this.units.toString().replace('Rs', '');
        numberWithUnitsString += 'Rs' + ' ';
      }
      if (this.units.toString().includes('₹')) {
        this.units.units = this.units.toString().replace('₹', '');
        numberWithUnitsString += '₹' + ' ';
      }

      if (this.type === 'real') {
        numberWithUnitsString += this.real + ' ';
      } else {
        numberWithUnitsString += this.fraction.toString() + ' ';
      }
      numberWithUnitsString += this.units.toString();
      numberWithUnitsString = numberWithUnitsString.trim();

      return numberWithUnitsString;
    };

    NumberWithUnits.fromRawInputString = function(rawInput) {
      rawInput = rawInput.trim();
      var type = '';
      var real = '';
      var fractionObj = '';
      var units = '';
      var value = 0;
      var unitObj = '';

      // Start with digit when there is no currency unit.
      if (rawInput.match(/^\d/)) {
        var ind = rawInput.indexOf(rawInput.match(/[a-z(]/i));
        if (ind === -1) {
          // There is value with no units.
          value = rawInput;
          units = '';
        } else {
          value = rawInput.substr(0, ind).trim();
          units = rawInput.substr(ind).trim();
        }
      } else {
        if (!rawInput.startsWith('$ ') && !rawInput.startsWith('Rs ') &&
          !rawInput.startsWith('₹ ')) {
          throw new Error(NUMBER_WITH_UNITS_PARSING_ERRORS.INVALID_CURRENCY);
        }
        var ind = rawInput.indexOf(' ');
        if (ind === -1) {
          throw new Error(NUMBER_WITH_UNITS_PARSING_ERRORS.INVALID_CURRENCY);
        }
        units = rawInput.substr(0, ind) + ' ';
        var ind2 = rawInput.indexOf(rawInput.substr(ind + 1).match(/[a-z(]/i));
        if (ind2 !== -1) {
          value = rawInput.substr(ind + 1, ind2 - ind - 1).trim();
          units += rawInput.substr(ind2).trim();
        } else {
          value = rawInput.substr(ind + 1).trim();
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
          throw new Error(NUMBER_WITH_UNITS_PARSING_ERRORS.INVALID_UNIT_CHARS);
        }
      }
      unitsObj = UnitsObjectFactory.fromRawInputString(units);
      return new NumberWithUnits(type, real, fractionObj, unitsObj);
    };

    NumberWithUnits.fromDict = function(numberWithUnitsDict) {
      return new NumberWithUnits(
        numberWithUnitsDict.type,
        numberWithUnitsDict.real,
        numberWithUnitsDict.fraction,
        numberWithUnitsDict.units);
    };

    return NumberWithUnits;
  }
]);

oppia.factory('UnitsObjectFactory', [function() {
  var Units = function(units) {
    this.units = units;
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

  var unitToDict = function(unitsWithMultiplier) {
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
    return unitDict;
  };

  Units.prototype.toDict = function() {
    return unitToDict(unitWithMultiplier(Units.stringToLexical(this.units)));
  };

  Units.prototype.toString = function() {
    return this.units.trim();
  };

  Units.fromDictToString = function(unitDict) {
    var units = '';
    for (var key in unitDict) {
      units += key + '^' + unitDict[key].toString() + ' ';
    }
    return units.trim();
  };

  Units.fromRawInputString = function(units) {
    units = units.replace(/per/g, '/');
    // Right now, validation of currency units is not possible as we need to add
    // them first.
    if (units !== '' && !units.includes('$') && !units.includes('Rs') &&
      !units.includes('₹')) {
      try {
        math.unit(units);
      } catch (err) {
        throw new Error(err);
      }
    }
    return new Units(units);
  };

  return Units;
}]);
