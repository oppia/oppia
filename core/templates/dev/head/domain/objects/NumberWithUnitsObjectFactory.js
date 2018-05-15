oppia.factory('NumberWithUnitsObjectFactory', [
  'UnitsObjectFactory', 'FractionObjectFactory',
  function(UnitsObjectFactory, FractionObjectFactory) {
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

      if (rawInput.match(/^\d/)) {        // Start with digit, there is no currency unit.
        var ind = rawInput.indexOf(' ');
        if (ind === -1)
          value = rawInput;         // There is value with no units.
        else {
          value = rawInput.substr(0, ind);
          units = rawInput.substr(ind+1).trim();  // There can be more than one chr space.
        }
      }
      else {
        var ind = rawInput.indexOf(' ');
        units = rawInput.substr(0, ind) + ' ';    // Currency unit
        var ind2 = rawInput.indexOf(' ', ind+1);
        if (ind2 !== -1) {
          value = rawInput.substr(ind+1, ind2-ind-1).trim();
          units += rawInput.substr(ind2+1).trim();
        }
        else {
          value = rawInput.substr(ind+1).trim();
          units = units.trim();
        }
      }

      if (value.includes('/')) {
        type = 'fraction';
        Fraction = FractionObjectFactory.fromRawInputString(value);
      }
      else {
        type = 'real';
        real = parseFloat(value);
      }
      if (units !== '')
        Units = UnitsObjectFactory.fromRawInputString(units);
      return new NumberWithUnits(type, real, Fraction, Units);
    };

    return NumberWithUnits;
}]);

oppia.factory('UnitsObjectFactory', [function() {
  var Units = function(units) {
    this.units = units;
  };

  var isunit = function(unit) {
    return !("/*() ".includes(unit));
  };

  var string_to_lexical = function(units) {
    units += '#';
    var unit_list = [];
    var unit = '';
    for (var i=0; i<units.length; i++) {
      if ('*/()# '.includes(units[i])) {
        if (unit.length > 0) {
          if ((unit_list.length > 0) && isunit(unit_list.slice(-1).pop()))
            unit_list.push('*');
          unit_list.push(unit);
          unit = '';
        }
        if (!('# '.includes(units[i])))
          unit_list.push(units[i]);
      }
      else
        unit += units[i];
    }
    return unit_list;
  };

  var unit_with_multiplier = function(unit_list) {
    var multiplier = 1;
    var units_with_multiplier = [];
    var parenthesis_stack = [];

    for (var ind=0; ind<unit_list.length; ind++) {
      if (unit_list[ind] === '/')
        multiplier = -multiplier;
      else if (unit_list[ind] === '(') {
        if (unit_list[ind-1] === '/') {
          // If previous element was division then we need to inverse
          // multiplier when we find its corresponsing closing parenthesis.
          // Second element of pushed element is used for this purpose.
          parenthesis_stack.push(['(', -1]);
        }
        else {
          // If previous element was not division then we don't need to
          // invert multiplier.
          parenthesis_stack.push(['(', 1]);
        }
      }
      else if (unit_list[ind] === ')') {
        var elem = parenthesis_stack.pop();
        multiplier = parseInt(elem[1]) * multiplier;
      }
      else if (isunit(unit_list[ind])) {
        units_with_multiplier.push([unit_list[ind], multiplier]);
        // If previous element was division then we need to invert
        // multiplier.
        if (unit_list[ind - 1] === '/')
          multiplier = -multiplier;
      }
    }
    return units_with_multiplier;
  };

  var unit_to_dict = function(units_with_multiplier) {
    var unit_dict = {};
    for (var i=0; i<units_with_multiplier.length; i++) {
      var unit = units_with_multiplier[i][0];
      var multiplier = units_with_multiplier[i][1];
      var ind = unit.indexOf('^');
      if (ind > -1) {
        var s = unit.substr(0, ind);
        var power = parseInt(unit.substr(ind+1));
      }
      else {
        var s = unit;
        var power = 1;
      }
      if (!(s in unit_dict))
        unit_dict[s] = 0;
      unit_dict[s] += multiplier * power;
    }
    return unit_dict;
  };

  Units.prototype.toDict = function() {
    return unit_to_dict(unit_with_multiplier(string_to_lexical(this.units)));
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
