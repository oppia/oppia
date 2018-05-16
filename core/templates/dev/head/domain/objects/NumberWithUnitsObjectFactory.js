oppia.constant('NUMBER_WITH_UNITS_PARSING_ERRORS', {
  INVALID_VALUE:
    'Please ensure that value is either a fraction or a number',
  INVALID_CURRENCY:
    'Please enter a valid currency (e.g., $ 5)',
  DIVISION_BY_ZERO: 'Please do not put 0 in the denominator'
});

oppia.factory('NumberWithUnitsObjectFactory', [
  'UnitsObjectFactory', 'FractionObjectFactory',
  'NUMBER_WITH_UNITS_PARSING_ERRORS', function(
      UnitsObjectFactory, FractionObjectFactory,
      NUMBER_WITH_UNITS_PARSING_ERRORS) {
    var NumberWithUnits = function(type, real, Fraction, Units) {
      this.type = type;
      this.real = real;
      this.Fraction = Fraction;
      this.Units = Units;
    };

    NumberWithUnits.fromRawInputString = function(rawInput) {
      rawInput = rawInput.trim();
      var type = '';
      var real = '';
      var Fraction = '';
      var units = '';
      var value = 0;
      var Units = '';

      // Start with digit when there is no currency unit.
      if (rawInput.match(/^\d/)) {
        var ind = rawInput.indexOf(' ');
        if (ind === -1) {
          // There is value with no units.
          value = rawInput;
        } else {
          value = rawInput.substr(0, ind);
          units = rawInput.substr(ind + 1).trim();
        }
      } else {
        var ind = rawInput.indexOf(' ');
        if (ind === -1) {
          throw new Error(NUMBER_WITH_UNITS_PARSING_ERRORS.INVALID_CURRENCY);
        }
        units = rawInput.substr(0, ind) + ' ';
        var ind2 = rawInput.indexOf(' ', ind + 1);
        if (ind2 !== -1) {
          value = rawInput.substr(ind + 1, ind2 - ind - 1).trim();
          units += rawInput.substr(ind2 + 1).trim();
        } else {
          value = rawInput.substr(ind + 1).trim();
          units = units.trim();
        }
      }
      if (value.match(/[a-z]/i) || value.match(/[*^$()]/)) {
        throw new Error(NUMBER_WITH_UNITS_PARSING_ERRORS.INVALID_VALUE);
      }

      if (value.includes('/')) {
        type = 'fraction';
        Fraction = FractionObjectFactory.fromRawInputString(value);
      } else {
        type = 'real';
        real = parseFloat(value);
      }
      if (units !== '') {
        Units = UnitsObjectFactory.fromRawInputString(units);
      }
      return new NumberWithUnits(type, real, Fraction, Units);
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

  var stringToLexical = function(units) {
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
      } else if (' '.includes(units[i]) && unit === 'per') {
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
          // invert multiplier.
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
    return unitToDict(unitWithMultiplier(stringToLexical(this.units)));
  };

  Units.prototype.toString = function() {
    return this.units;
  };

  Units.fromDictToString = function(unitDict) {
    var units = '';
    for (var key in unitDict) {
      units += key + '^' + unitDict[key].toString() + ' ';
    }
    return units.trim();
  };

  Units.fromRawInputString = function(units) {
    return new Units(units);
  };

  return Units;
}]);
