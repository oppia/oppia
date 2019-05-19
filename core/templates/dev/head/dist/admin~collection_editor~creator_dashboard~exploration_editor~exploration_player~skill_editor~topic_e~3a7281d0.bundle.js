(window["webpackJsonp"] = window["webpackJsonp"] || []).push([["admin~collection_editor~creator_dashboard~exploration_editor~exploration_player~skill_editor~topic_e~3a7281d0"],{

/***/ "./core/templates/dev/head/domain/objects/NumberWithUnitsObjectFactory.ts":
/*!********************************************************************************!*\
  !*** ./core/templates/dev/head/domain/objects/NumberWithUnitsObjectFactory.ts ***!
  \********************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

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
__webpack_require__(/*! domain/objects/FractionObjectFactory.ts */ "./core/templates/dev/head/domain/objects/FractionObjectFactory.ts");
__webpack_require__(/*! domain/objects/UnitsObjectFactory.ts */ "./core/templates/dev/head/domain/objects/UnitsObjectFactory.ts");
oppia.constant('NUMBER_WITH_UNITS_PARSING_ERRORS', {
    INVALID_VALUE: 'Please ensure that value is either a fraction or a number',
    INVALID_CURRENCY: 'Please enter a valid currency (e.g., $5 or Rs 5)',
    INVALID_CURRENCY_FORMAT: 'Please write currency units at the beginning',
    INVALID_UNIT_CHARS: 'Please ensure that unit only contains numbers, alphabets, (, ), *, ^, /, -'
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
    'NUMBER_WITH_UNITS_PARSING_ERRORS', function (FractionObjectFactory, UnitsObjectFactory, CURRENCY_UNITS, NUMBER_WITH_UNITS_PARSING_ERRORS) {
        var NumberWithUnits = function (type, real, fractionObj, unitsObj) {
            this.type = type;
            this.real = real;
            this.fraction = fractionObj;
            this.units = unitsObj.units;
        };
        NumberWithUnits.prototype.toString = function () {
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
            }
            else if (this.type === 'fraction') {
                numberWithUnitsString += this.fraction.toString() + ' ';
            }
            numberWithUnitsString += unitsString.trim();
            numberWithUnitsString = numberWithUnitsString.trim();
            return numberWithUnitsString;
        };
        NumberWithUnits.prototype.toMathjsCompatibleString = function () {
            var numberWithUnitsString = '';
            var unitsString = UnitsObjectFactory.fromList(this.units).toString();
            unitsString = UnitsObjectFactory.toMathjsCompatibleString(unitsString);
            if (this.type === 'real') {
                numberWithUnitsString += this.real + ' ';
            }
            else if (this.type === 'fraction') {
                numberWithUnitsString += this.fraction.toString() + ' ';
            }
            numberWithUnitsString += unitsString.trim();
            numberWithUnitsString = numberWithUnitsString.trim();
            return numberWithUnitsString;
        };
        NumberWithUnits.prototype.toDict = function () {
            return {
                type: this.type,
                real: this.real,
                fraction: this.fraction.toDict(),
                units: this.units
            };
        };
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        NumberWithUnits['createCurrencyUnits'] = function () {
            /* eslint-enable dot-notation */
            try {
                UnitsObjectFactory.createCurrencyUnits();
            }
            catch (parsingError) { }
        };
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        NumberWithUnits['fromRawInputString'] = function (rawInput) {
            /* eslint-enable dot-notation */
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
                    }
                    else {
                        value = rawInput.substr(0, ind).trim();
                        units = rawInput.substr(ind).trim();
                    }
                    var keys = Object.keys(CURRENCY_UNITS);
                    for (var i = 0; i < keys.length; i++) {
                        for (var j = 0; j < CURRENCY_UNITS[keys[i]].front_units.length; j++) {
                            if (units.indexOf(CURRENCY_UNITS[keys[i]].front_units[j]) !== -1) {
                                throw new Error(NUMBER_WITH_UNITS_PARSING_ERRORS.INVALID_CURRENCY_FORMAT);
                            }
                        }
                    }
                }
                else {
                    var startsWithCorrectCurrencyUnit = false;
                    var keys = Object.keys(CURRENCY_UNITS);
                    for (var i = 0; i < keys.length; i++) {
                        for (var j = 0; j < CURRENCY_UNITS[keys[i]].front_units.length; j++) {
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
                        for (var j = 0; j < CURRENCY_UNITS[keys[i]].front_units.length; j++) {
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
                    var ind2 = rawInput.indexOf(rawInput.substr(ind).match(/[a-z(]/i));
                    if (ind2 !== -1) {
                        value = rawInput.substr(ind, ind2 - ind).trim();
                        units += rawInput.substr(ind2).trim();
                    }
                    else {
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
                }
                else {
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
            var unitsObj = UnitsObjectFactory.fromRawInputString(units);
            return new NumberWithUnits(type, real, fractionObj, unitsObj);
        };
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        NumberWithUnits['fromDict'] = function (numberWithUnitsDict) {
            /* eslint-enable dot-notation */
            return new NumberWithUnits(numberWithUnitsDict.type, numberWithUnitsDict.real, FractionObjectFactory.fromDict(numberWithUnitsDict.fraction), UnitsObjectFactory.fromList(numberWithUnitsDict.units));
        };
        return NumberWithUnits;
    }
]);


/***/ }),

/***/ "./core/templates/dev/head/domain/objects/UnitsObjectFactory.ts":
/*!**********************************************************************!*\
  !*** ./core/templates/dev/head/domain/objects/UnitsObjectFactory.ts ***!
  \**********************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

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
oppia.factory('UnitsObjectFactory', ['CURRENCY_UNITS',
    function (CURRENCY_UNITS) {
        var Units = function (unitsList) {
            this.units = unitsList;
        };
        var isunit = function (unit) {
            return !('/*() '.includes(unit));
        };
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        Units['stringToLexical'] = function (units) {
            /* eslint-enable dot-notation */
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
                }
                else if (units[i] === ' ' && unit === 'per') {
                    unitList.push('/');
                    unit = '';
                }
                else {
                    unit += units[i];
                }
            }
            return unitList;
        };
        var unitWithMultiplier = function (unitList) {
            var multiplier = 1;
            var unitsWithMultiplier = [];
            var parenthesisStack = [];
            for (var ind = 0; ind < unitList.length; ind++) {
                if (unitList[ind] === '/') {
                    multiplier = -multiplier;
                }
                else if (unitList[ind] === '(') {
                    if (unitList[ind - 1] === '/') {
                        // If previous element was division then we need to inverse
                        // multiplier when we find its corresponsing closing parenthesis.
                        // Second element of pushed element is used for this purpose.
                        parenthesisStack.push(['(', -1]);
                    }
                    else {
                        // If previous element was not division then we don't need to
                        // invert the multiplier.
                        parenthesisStack.push(['(', 1]);
                    }
                }
                else if (unitList[ind] === ')') {
                    var elem = parenthesisStack.pop();
                    multiplier = parseInt(elem[1]) * multiplier;
                }
                else if (isunit(unitList[ind])) {
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
        var convertUnitDictToList = function (unitDict) {
            var unitList = [];
            for (var key in unitDict) {
                unitList.push({ unit: key, exponent: unitDict[key] });
            }
            return unitList;
        };
        var unitToList = function (unitsWithMultiplier) {
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
                }
                else {
                    s = unit;
                    power = 1;
                }
                if (!(s in unitDict)) {
                    unitDict[s] = 0;
                }
                unitDict[s] += multiplier * power;
            }
            return convertUnitDictToList(unitDict);
        };
        Units.prototype.toDict = function () {
            return {
                units: this.units
            };
        };
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        Units['fromList'] = function (unitsList) {
            /* eslint-enable dot-notation */
            return new Units(unitsList);
        };
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        Units['fromStringToList'] = function (unitsString) {
            /* eslint-enable dot-notation */
            // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
            /* eslint-disable dot-notation */
            return unitToList(unitWithMultiplier(Units['stringToLexical'](unitsString)));
            /* eslint-enable dot-notation */
        };
        Units.prototype.toString = function () {
            var unit = '';
            for (var i = 0; i < this.units.length; i++) {
                var d = this.units[i];
                if (d.exponent === 1) {
                    unit += d.unit + ' ';
                }
                else {
                    unit += d.unit + '^' + d.exponent.toString() + ' ';
                }
            }
            return unit.trim();
        };
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        Units['createCurrencyUnits'] = function () {
            /* eslint-enable dot-notation */
            // Creates user-defined currency (base + sub) units.
            var keys = Object.keys(CURRENCY_UNITS);
            for (var i = 0; i < keys.length; i++) {
                if (CURRENCY_UNITS[keys[i]].base_unit === null) {
                    // Base unit (like: rupees, dollar etc.).
                    math.createUnit(CURRENCY_UNITS[keys[i]].name, {
                        aliases: CURRENCY_UNITS[keys[i]].aliases
                    });
                }
                else {
                    // Sub unit (like: paise, cents etc.).
                    math.createUnit(CURRENCY_UNITS[keys[i]].name, {
                        definition: CURRENCY_UNITS[keys[i]].base_unit,
                        aliases: CURRENCY_UNITS[keys[i]].aliases
                    });
                }
            }
        };
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        Units['toMathjsCompatibleString'] = function (units) {
            /* eslint-enable dot-notation */
            // Makes the units compatible with the math.js allowed format.
            units = units.replace(/per/g, '/');
            // Special symbols need to be replaced as math.js doesn't support custom
            // units starting with special symbols. Also, it doesn't allow units
            // followed by a number as in the case of currency units.
            var keys = Object.keys(CURRENCY_UNITS);
            for (var i = 0; i < keys.length; i++) {
                for (var j = 0; j < CURRENCY_UNITS[keys[i]].front_units.length; j++) {
                    if (units.includes(CURRENCY_UNITS[keys[i]].front_units[j])) {
                        units = units.replace(CURRENCY_UNITS[keys[i]].front_units[j], '');
                        units = CURRENCY_UNITS[keys[i]].name + units;
                    }
                }
                for (var j = 0; j < CURRENCY_UNITS[keys[i]].aliases.length; j++) {
                    if (units.includes(CURRENCY_UNITS[keys[i]].aliases[j])) {
                        units = units.replace(CURRENCY_UNITS[keys[i]].aliases[j], CURRENCY_UNITS[keys[i]].name);
                    }
                }
            }
            return units.trim();
        };
        // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
        /* eslint-disable dot-notation */
        Units['fromRawInputString'] = function (units) {
            /* eslint-enable dot-notation */
            try {
                // TODO (ankita240796) Remove the bracket notation once Angular2
                // gets in.
                /* eslint-disable dot-notation */
                Units['createCurrencyUnits']();
                /* eslint-enable dot-notation */
            }
            catch (parsingError) { }
            // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
            /* eslint-disable dot-notation */
            var compatibleUnits = Units['toMathjsCompatibleString'](units);
            /* eslint-enable dot-notation */
            if (compatibleUnits !== '') {
                try {
                    math.unit(compatibleUnits);
                }
                catch (err) {
                    throw new Error(err);
                }
            }
            // TODO (ankita240796) Remove the bracket notation once Angular2 gets in.
            /* eslint-disable dot-notation */
            return new Units(Units['fromStringToList'](units));
            /* eslint-enable dot-notation */
        };
        return Units;
    }]);


/***/ }),

/***/ "./core/templates/dev/head/filters/string-utility-filters/convert-to-plain-text.filter.ts":
/*!************************************************************************************************!*\
  !*** ./core/templates/dev/head/filters/string-utility-filters/convert-to-plain-text.filter.ts ***!
  \************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

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
 * @fileoverview ConvertToPlainText filter for Oppia.
 */
angular.module('stringUtilityFiltersModule').filter('convertToPlainText', [function () {
        return function (input) {
            var strippedText = input.replace(/(<([^>]+)>)/ig, '');
            strippedText = strippedText.replace(/&nbsp;/ig, ' ');
            strippedText = strippedText.replace(/&quot;/ig, '');
            var trimmedText = strippedText.trim();
            if (trimmedText.length === 0) {
                return strippedText;
            }
            else {
                return trimmedText;
            }
        };
    }
]);


/***/ })

}]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9kb21haW4vb2JqZWN0cy9OdW1iZXJXaXRoVW5pdHNPYmplY3RGYWN0b3J5LnRzIiwid2VicGFjazovLy8uL2NvcmUvdGVtcGxhdGVzL2Rldi9oZWFkL2RvbWFpbi9vYmplY3RzL1VuaXRzT2JqZWN0RmFjdG9yeS50cyIsIndlYnBhY2s6Ly8vLi9jb3JlL3RlbXBsYXRlcy9kZXYvaGVhZC9maWx0ZXJzL3N0cmluZy11dGlsaXR5LWZpbHRlcnMvY29udmVydC10by1wbGFpbi10ZXh0LmZpbHRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQU8sQ0FBQyxrSEFBeUM7QUFDakQsbUJBQU8sQ0FBQyw0R0FBc0M7QUFDOUM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUM7QUFDRDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtDQUFrQztBQUNsQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1DQUFtQyxpQkFBaUI7QUFDcEQsdUNBQXVDLGdEQUFnRDtBQUN2RjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQ0FBbUMsaUJBQWlCO0FBQ3BELHVDQUF1QyxnREFBZ0Q7QUFDdkY7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUNBQW1DLGlCQUFpQjtBQUNwRCx1Q0FBdUMsZ0RBQWdEO0FBQ3ZGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDM09BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkJBQTJCLGtCQUFrQjtBQUM3QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsNkJBQTZCLHVCQUF1QjtBQUNwRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLCtCQUErQixxQ0FBcUM7QUFDcEU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJCQUEyQixnQ0FBZ0M7QUFDM0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkJBQTJCLHVCQUF1QjtBQUNsRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJCQUEyQixpQkFBaUI7QUFDNUM7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkJBQTJCLGlCQUFpQjtBQUM1QywrQkFBK0IsZ0RBQWdEO0FBQy9FO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwrQkFBK0IsNENBQTRDO0FBQzNFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtDQUFrQztBQUNsQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLOzs7Ozs7Ozs7Ozs7QUN0T0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1REFBdUQ7QUFDdkQsdURBQXVEO0FBQ3ZEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImFkbWlufmNvbGxlY3Rpb25fZWRpdG9yfmNyZWF0b3JfZGFzaGJvYXJkfmV4cGxvcmF0aW9uX2VkaXRvcn5leHBsb3JhdGlvbl9wbGF5ZXJ+c2tpbGxfZWRpdG9yfnRvcGljX2V+M2E3MjgxZDAuYnVuZGxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTggVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBGYWN0b3J5IGZvciBjcmVhdGluZyBpbnN0YW5jZXMgb2YgTnVtYmVyV2l0aFVuaXRzXG4gKiBkb21haW4gb2JqZWN0cy5cbiAqL1xucmVxdWlyZSgnZG9tYWluL29iamVjdHMvRnJhY3Rpb25PYmplY3RGYWN0b3J5LnRzJyk7XG5yZXF1aXJlKCdkb21haW4vb2JqZWN0cy9Vbml0c09iamVjdEZhY3RvcnkudHMnKTtcbm9wcGlhLmNvbnN0YW50KCdOVU1CRVJfV0lUSF9VTklUU19QQVJTSU5HX0VSUk9SUycsIHtcbiAgICBJTlZBTElEX1ZBTFVFOiAnUGxlYXNlIGVuc3VyZSB0aGF0IHZhbHVlIGlzIGVpdGhlciBhIGZyYWN0aW9uIG9yIGEgbnVtYmVyJyxcbiAgICBJTlZBTElEX0NVUlJFTkNZOiAnUGxlYXNlIGVudGVyIGEgdmFsaWQgY3VycmVuY3kgKGUuZy4sICQ1IG9yIFJzIDUpJyxcbiAgICBJTlZBTElEX0NVUlJFTkNZX0ZPUk1BVDogJ1BsZWFzZSB3cml0ZSBjdXJyZW5jeSB1bml0cyBhdCB0aGUgYmVnaW5uaW5nJyxcbiAgICBJTlZBTElEX1VOSVRfQ0hBUlM6ICdQbGVhc2UgZW5zdXJlIHRoYXQgdW5pdCBvbmx5IGNvbnRhaW5zIG51bWJlcnMsIGFscGhhYmV0cywgKCwgKSwgKiwgXiwgLywgLSdcbn0pO1xuLyogR3VpZGVsaW5lcyBmb3IgYWRkaW5nIG5ldyBjdXN0b20gY3VycmVuY3kgdW5pdHMgaW4gTnVtYmVyIHdpdGggVW5pdHNcbiAgaW50ZXJhY3Rpb246XG5cbiAgU2ltcGx5IGFkZCBjdXJyZW5jeSB1bml0IHRvIHRoZSBkaWN0IG9mIENVUlJFTkNZX1VOSVRTIGNvbnN0YW50IGFuZCBpdCB3aWxsXG4gIGJlIGF1dG9tYXRpY2FsbHkgYWRkZWQgdG8gdGhlIGFsbG93ZWQgY3VzdG9tIHVuaXRzLiBGb2xsb3dpbmcgYXJlIHRoZSBrZXlzXG4gIHRvIGJlIGRlZmluZWQgd2l0aGluIHRoZSB1bml0IGRpY3Q6XG4gICAgbmFtZTogIFRoZSBuYW1lIG9mIHRoZSBjdXN0b20gY3VycmVuY3kgdW5pdC5cbiAgICBhbGlhc2VzOiBPdGhlciBhbGxvd2VkIGNhbm9uaWNhbCBmb3JtcyBvZiB0aGUgY3VycmVuY3kgdW5pdC5cbiAgICBmcm9udF91bml0czogQSBsaXN0IG9mIGFsbCB0aGUgY3VycmVuY3kgc3ltYm9scyB0aGF0IGFyZSBhZGRlZCB0byB0aGUgZnJvbnRcbiAgICAgIChsaWtlLSAkLCBScywg4oK5KS4gS2VlcCBpdCBhbiBlbXB0eSBsaXN0IGlmIG5vIHN5bWJvbCBpcyBuZWVkZWQuXG4gICAgYmFzZV91bml0OiBEZWZpbmUgdGhlIHVuaXQgaW4gdGVybXMgb2YgYmFzZSB1bml0IG9ubHkgaWYgdGhlIGRlZmluZWQgY3VzdG9tXG4gICAgICB1bml0IGlzIGEgc3ViIHVuaXQgZWxzZSBhc3NpZ24gaXQgJ251bGwnIHZhbHVlLiovXG5vcHBpYS5jb25zdGFudCgnQ1VSUkVOQ1lfVU5JVFMnLCB7XG4gICAgZG9sbGFyOiB7XG4gICAgICAgIG5hbWU6ICdkb2xsYXInLFxuICAgICAgICBhbGlhc2VzOiBbJyQnLCAnZG9sbGFycycsICdEb2xsYXJzJywgJ0RvbGxhcicsICdVU0QnXSxcbiAgICAgICAgZnJvbnRfdW5pdHM6IFsnJCddLFxuICAgICAgICBiYXNlX3VuaXQ6IG51bGxcbiAgICB9LFxuICAgIHJ1cGVlOiB7XG4gICAgICAgIG5hbWU6ICdydXBlZScsXG4gICAgICAgIGFsaWFzZXM6IFsnUnMnLCAncnVwZWVzJywgJ+KCuScsICdSdXBlZXMnLCAnUnVwZWUnXSxcbiAgICAgICAgZnJvbnRfdW5pdHM6IFsnUnMgJywgJ+KCuSddLFxuICAgICAgICBiYXNlX3VuaXQ6IG51bGxcbiAgICB9LFxuICAgIGNlbnQ6IHtcbiAgICAgICAgbmFtZTogJ2NlbnQnLFxuICAgICAgICBhbGlhc2VzOiBbJ2NlbnRzJywgJ0NlbnRzJywgJ0NlbnQnXSxcbiAgICAgICAgZnJvbnRfdW5pdHM6IFtdLFxuICAgICAgICBiYXNlX3VuaXQ6ICcwLjAxIGRvbGxhcidcbiAgICB9LFxuICAgIHBhaXNlOiB7XG4gICAgICAgIG5hbWU6ICdwYWlzZScsXG4gICAgICAgIGFsaWFzZXM6IFsncGFpc2EnLCAnUGFpc2UnLCAnUGFpc2EnXSxcbiAgICAgICAgZnJvbnRfdW5pdHM6IFtdLFxuICAgICAgICBiYXNlX3VuaXQ6ICcwLjAxIHJ1cGVlJ1xuICAgIH1cbn0pO1xub3BwaWEuZmFjdG9yeSgnTnVtYmVyV2l0aFVuaXRzT2JqZWN0RmFjdG9yeScsIFtcbiAgICAnRnJhY3Rpb25PYmplY3RGYWN0b3J5JywgJ1VuaXRzT2JqZWN0RmFjdG9yeScsICdDVVJSRU5DWV9VTklUUycsXG4gICAgJ05VTUJFUl9XSVRIX1VOSVRTX1BBUlNJTkdfRVJST1JTJywgZnVuY3Rpb24gKEZyYWN0aW9uT2JqZWN0RmFjdG9yeSwgVW5pdHNPYmplY3RGYWN0b3J5LCBDVVJSRU5DWV9VTklUUywgTlVNQkVSX1dJVEhfVU5JVFNfUEFSU0lOR19FUlJPUlMpIHtcbiAgICAgICAgdmFyIE51bWJlcldpdGhVbml0cyA9IGZ1bmN0aW9uICh0eXBlLCByZWFsLCBmcmFjdGlvbk9iaiwgdW5pdHNPYmopIHtcbiAgICAgICAgICAgIHRoaXMudHlwZSA9IHR5cGU7XG4gICAgICAgICAgICB0aGlzLnJlYWwgPSByZWFsO1xuICAgICAgICAgICAgdGhpcy5mcmFjdGlvbiA9IGZyYWN0aW9uT2JqO1xuICAgICAgICAgICAgdGhpcy51bml0cyA9IHVuaXRzT2JqLnVuaXRzO1xuICAgICAgICB9O1xuICAgICAgICBOdW1iZXJXaXRoVW5pdHMucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIG51bWJlcldpdGhVbml0c1N0cmluZyA9ICcnO1xuICAgICAgICAgICAgdmFyIHVuaXRzU3RyaW5nID0gVW5pdHNPYmplY3RGYWN0b3J5LmZyb21MaXN0KHRoaXMudW5pdHMpLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICBpZiAodW5pdHNTdHJpbmcuaW5jbHVkZXMoJyQnKSkge1xuICAgICAgICAgICAgICAgIHVuaXRzU3RyaW5nID0gdW5pdHNTdHJpbmcucmVwbGFjZSgnJCcsICcnKTtcbiAgICAgICAgICAgICAgICBudW1iZXJXaXRoVW5pdHNTdHJpbmcgKz0gJyQnICsgJyAnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHVuaXRzU3RyaW5nLmluY2x1ZGVzKCdScycpKSB7XG4gICAgICAgICAgICAgICAgdW5pdHNTdHJpbmcgPSB1bml0c1N0cmluZy5yZXBsYWNlKCdScycsICcnKTtcbiAgICAgICAgICAgICAgICBudW1iZXJXaXRoVW5pdHNTdHJpbmcgKz0gJ1JzJyArICcgJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh1bml0c1N0cmluZy5pbmNsdWRlcygn4oK5JykpIHtcbiAgICAgICAgICAgICAgICB1bml0c1N0cmluZyA9IHVuaXRzU3RyaW5nLnJlcGxhY2UoJ+KCuScsICcnKTtcbiAgICAgICAgICAgICAgICBudW1iZXJXaXRoVW5pdHNTdHJpbmcgKz0gJ+KCuScgKyAnICc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy50eXBlID09PSAncmVhbCcpIHtcbiAgICAgICAgICAgICAgICBudW1iZXJXaXRoVW5pdHNTdHJpbmcgKz0gdGhpcy5yZWFsICsgJyAnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodGhpcy50eXBlID09PSAnZnJhY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgbnVtYmVyV2l0aFVuaXRzU3RyaW5nICs9IHRoaXMuZnJhY3Rpb24udG9TdHJpbmcoKSArICcgJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG51bWJlcldpdGhVbml0c1N0cmluZyArPSB1bml0c1N0cmluZy50cmltKCk7XG4gICAgICAgICAgICBudW1iZXJXaXRoVW5pdHNTdHJpbmcgPSBudW1iZXJXaXRoVW5pdHNTdHJpbmcudHJpbSgpO1xuICAgICAgICAgICAgcmV0dXJuIG51bWJlcldpdGhVbml0c1N0cmluZztcbiAgICAgICAgfTtcbiAgICAgICAgTnVtYmVyV2l0aFVuaXRzLnByb3RvdHlwZS50b01hdGhqc0NvbXBhdGlibGVTdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgbnVtYmVyV2l0aFVuaXRzU3RyaW5nID0gJyc7XG4gICAgICAgICAgICB2YXIgdW5pdHNTdHJpbmcgPSBVbml0c09iamVjdEZhY3RvcnkuZnJvbUxpc3QodGhpcy51bml0cykudG9TdHJpbmcoKTtcbiAgICAgICAgICAgIHVuaXRzU3RyaW5nID0gVW5pdHNPYmplY3RGYWN0b3J5LnRvTWF0aGpzQ29tcGF0aWJsZVN0cmluZyh1bml0c1N0cmluZyk7XG4gICAgICAgICAgICBpZiAodGhpcy50eXBlID09PSAncmVhbCcpIHtcbiAgICAgICAgICAgICAgICBudW1iZXJXaXRoVW5pdHNTdHJpbmcgKz0gdGhpcy5yZWFsICsgJyAnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodGhpcy50eXBlID09PSAnZnJhY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgbnVtYmVyV2l0aFVuaXRzU3RyaW5nICs9IHRoaXMuZnJhY3Rpb24udG9TdHJpbmcoKSArICcgJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG51bWJlcldpdGhVbml0c1N0cmluZyArPSB1bml0c1N0cmluZy50cmltKCk7XG4gICAgICAgICAgICBudW1iZXJXaXRoVW5pdHNTdHJpbmcgPSBudW1iZXJXaXRoVW5pdHNTdHJpbmcudHJpbSgpO1xuICAgICAgICAgICAgcmV0dXJuIG51bWJlcldpdGhVbml0c1N0cmluZztcbiAgICAgICAgfTtcbiAgICAgICAgTnVtYmVyV2l0aFVuaXRzLnByb3RvdHlwZS50b0RpY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHR5cGU6IHRoaXMudHlwZSxcbiAgICAgICAgICAgICAgICByZWFsOiB0aGlzLnJlYWwsXG4gICAgICAgICAgICAgICAgZnJhY3Rpb246IHRoaXMuZnJhY3Rpb24udG9EaWN0KCksXG4gICAgICAgICAgICAgICAgdW5pdHM6IHRoaXMudW5pdHNcbiAgICAgICAgICAgIH07XG4gICAgICAgIH07XG4gICAgICAgIC8vIFRPRE8gKGFua2l0YTI0MDc5NikgUmVtb3ZlIHRoZSBicmFja2V0IG5vdGF0aW9uIG9uY2UgQW5ndWxhcjIgZ2V0cyBpbi5cbiAgICAgICAgLyogZXNsaW50LWRpc2FibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgIE51bWJlcldpdGhVbml0c1snY3JlYXRlQ3VycmVuY3lVbml0cyddID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLyogZXNsaW50LWVuYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgVW5pdHNPYmplY3RGYWN0b3J5LmNyZWF0ZUN1cnJlbmN5VW5pdHMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChwYXJzaW5nRXJyb3IpIHsgfVxuICAgICAgICB9O1xuICAgICAgICAvLyBUT0RPIChhbmtpdGEyNDA3OTYpIFJlbW92ZSB0aGUgYnJhY2tldCBub3RhdGlvbiBvbmNlIEFuZ3VsYXIyIGdldHMgaW4uXG4gICAgICAgIC8qIGVzbGludC1kaXNhYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICBOdW1iZXJXaXRoVW5pdHNbJ2Zyb21SYXdJbnB1dFN0cmluZyddID0gZnVuY3Rpb24gKHJhd0lucHV0KSB7XG4gICAgICAgICAgICAvKiBlc2xpbnQtZW5hYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICAgICAgcmF3SW5wdXQgPSByYXdJbnB1dC50cmltKCk7XG4gICAgICAgICAgICB2YXIgdHlwZSA9ICcnO1xuICAgICAgICAgICAgdmFyIHJlYWwgPSAwLjA7XG4gICAgICAgICAgICAvLyBEZWZhdWx0IGZyYWN0aW9uIHZhbHVlLlxuICAgICAgICAgICAgdmFyIGZyYWN0aW9uT2JqID0gRnJhY3Rpb25PYmplY3RGYWN0b3J5LmZyb21SYXdJbnB1dFN0cmluZygnMC8xJyk7XG4gICAgICAgICAgICB2YXIgdW5pdHMgPSAnJztcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9ICcnO1xuICAgICAgICAgICAgdmFyIHVuaXRPYmogPSBbXTtcbiAgICAgICAgICAgIC8vIEFsbG93IHZhbGlkYXRpb24gb25seSB3aGVuIHJhd0lucHV0IGlzIG5vdCBudWxsIG9yIGFuIGVtcHR5IHN0cmluZy5cbiAgICAgICAgICAgIGlmIChyYXdJbnB1dCAhPT0gJycgJiYgcmF3SW5wdXQgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAvLyBTdGFydCB3aXRoIGRpZ2l0IHdoZW4gdGhlcmUgaXMgbm8gY3VycmVuY3kgdW5pdC5cbiAgICAgICAgICAgICAgICBpZiAocmF3SW5wdXQubWF0Y2goL15cXGQvKSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaW5kID0gcmF3SW5wdXQuaW5kZXhPZihyYXdJbnB1dC5tYXRjaCgvW2EteijigrkkXS9pKSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpbmQgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUaGVyZSBpcyB2YWx1ZSB3aXRoIG5vIHVuaXRzLlxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSByYXdJbnB1dDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVuaXRzID0gJyc7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IHJhd0lucHV0LnN1YnN0cigwLCBpbmQpLnRyaW0oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVuaXRzID0gcmF3SW5wdXQuc3Vic3RyKGluZCkudHJpbSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMoQ1VSUkVOQ1lfVU5JVFMpO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgQ1VSUkVOQ1lfVU5JVFNba2V5c1tpXV0uZnJvbnRfdW5pdHMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodW5pdHMuaW5kZXhPZihDVVJSRU5DWV9VTklUU1trZXlzW2ldXS5mcm9udF91bml0c1tqXSkgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihOVU1CRVJfV0lUSF9VTklUU19QQVJTSU5HX0VSUk9SUy5JTlZBTElEX0NVUlJFTkNZX0ZPUk1BVCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB2YXIgc3RhcnRzV2l0aENvcnJlY3RDdXJyZW5jeVVuaXQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhDVVJSRU5DWV9VTklUUyk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBDVVJSRU5DWV9VTklUU1trZXlzW2ldXS5mcm9udF91bml0cy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyYXdJbnB1dC5zdGFydHNXaXRoKENVUlJFTkNZX1VOSVRTW2tleXNbaV1dLmZyb250X3VuaXRzW2pdKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydHNXaXRoQ29ycmVjdEN1cnJlbmN5VW5pdCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoc3RhcnRzV2l0aENvcnJlY3RDdXJyZW5jeVVuaXQgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoTlVNQkVSX1dJVEhfVU5JVFNfUEFSU0lOR19FUlJPUlMuSU5WQUxJRF9DVVJSRU5DWSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdmFyIGluZCA9IHJhd0lucHV0LmluZGV4T2YocmF3SW5wdXQubWF0Y2goL1swLTldLykpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW5kID09PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKE5VTUJFUl9XSVRIX1VOSVRTX1BBUlNJTkdfRVJST1JTLklOVkFMSURfQ1VSUkVOQ1kpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHVuaXRzID0gcmF3SW5wdXQuc3Vic3RyKDAsIGluZCkudHJpbSgpO1xuICAgICAgICAgICAgICAgICAgICBzdGFydHNXaXRoQ29ycmVjdEN1cnJlbmN5VW5pdCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgQ1VSUkVOQ1lfVU5JVFNba2V5c1tpXV0uZnJvbnRfdW5pdHMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodW5pdHMgPT09IENVUlJFTkNZX1VOSVRTW2tleXNbaV1dLmZyb250X3VuaXRzW2pdLnRyaW0oKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydHNXaXRoQ29ycmVjdEN1cnJlbmN5VW5pdCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoc3RhcnRzV2l0aENvcnJlY3RDdXJyZW5jeVVuaXQgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoTlVNQkVSX1dJVEhfVU5JVFNfUEFSU0lOR19FUlJPUlMuSU5WQUxJRF9DVVJSRU5DWSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdW5pdHMgPSB1bml0cyArICcgJztcbiAgICAgICAgICAgICAgICAgICAgdmFyIGluZDIgPSByYXdJbnB1dC5pbmRleE9mKHJhd0lucHV0LnN1YnN0cihpbmQpLm1hdGNoKC9bYS16KF0vaSkpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW5kMiAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gcmF3SW5wdXQuc3Vic3RyKGluZCwgaW5kMiAtIGluZCkudHJpbSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdW5pdHMgKz0gcmF3SW5wdXQuc3Vic3RyKGluZDIpLnRyaW0oKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gcmF3SW5wdXQuc3Vic3RyKGluZCkudHJpbSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdW5pdHMgPSB1bml0cy50cmltKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gQ2hlY2tpbmcgaW52YWxpZCBjaGFyYWN0ZXJzIGluIHZhbHVlLlxuICAgICAgICAgICAgICAgIGlmICh2YWx1ZS5tYXRjaCgvW2Etel0vaSkgfHwgdmFsdWUubWF0Y2goL1sqXiTigrkoKSNAXS8pKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihOVU1CRVJfV0lUSF9VTklUU19QQVJTSU5HX0VSUk9SUy5JTlZBTElEX1ZBTFVFKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlLmluY2x1ZGVzKCcvJykpIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZSA9ICdmcmFjdGlvbic7XG4gICAgICAgICAgICAgICAgICAgIGZyYWN0aW9uT2JqID0gRnJhY3Rpb25PYmplY3RGYWN0b3J5LmZyb21SYXdJbnB1dFN0cmluZyh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0eXBlID0gJ3JlYWwnO1xuICAgICAgICAgICAgICAgICAgICByZWFsID0gcGFyc2VGbG9hdCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh1bml0cyAhPT0gJycpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQ2hlY2tpbmcgaW52YWxpZCBjaGFyYWN0ZXJzIGluIHVuaXRzLlxuICAgICAgICAgICAgICAgICAgICBpZiAodW5pdHMubWF0Y2goL1teMC05YS16LyogXigp4oK5JC1dL2kpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoTlVNQkVSX1dJVEhfVU5JVFNfUEFSU0lOR19FUlJPUlMuSU5WQUxJRF9VTklUX0NIQVJTKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciB1bml0c09iaiA9IFVuaXRzT2JqZWN0RmFjdG9yeS5mcm9tUmF3SW5wdXRTdHJpbmcodW5pdHMpO1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBOdW1iZXJXaXRoVW5pdHModHlwZSwgcmVhbCwgZnJhY3Rpb25PYmosIHVuaXRzT2JqKTtcbiAgICAgICAgfTtcbiAgICAgICAgLy8gVE9ETyAoYW5raXRhMjQwNzk2KSBSZW1vdmUgdGhlIGJyYWNrZXQgbm90YXRpb24gb25jZSBBbmd1bGFyMiBnZXRzIGluLlxuICAgICAgICAvKiBlc2xpbnQtZGlzYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgTnVtYmVyV2l0aFVuaXRzWydmcm9tRGljdCddID0gZnVuY3Rpb24gKG51bWJlcldpdGhVbml0c0RpY3QpIHtcbiAgICAgICAgICAgIC8qIGVzbGludC1lbmFibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgICAgICByZXR1cm4gbmV3IE51bWJlcldpdGhVbml0cyhudW1iZXJXaXRoVW5pdHNEaWN0LnR5cGUsIG51bWJlcldpdGhVbml0c0RpY3QucmVhbCwgRnJhY3Rpb25PYmplY3RGYWN0b3J5LmZyb21EaWN0KG51bWJlcldpdGhVbml0c0RpY3QuZnJhY3Rpb24pLCBVbml0c09iamVjdEZhY3RvcnkuZnJvbUxpc3QobnVtYmVyV2l0aFVuaXRzRGljdC51bml0cykpO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gTnVtYmVyV2l0aFVuaXRzO1xuICAgIH1cbl0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBGYWN0b3J5IGZvciBjcmVhdGluZyBpbnN0YW5jZXMgb2YgVW5pdHMgZG9tYWluIG9iamVjdHMuXG4gKi9cbm9wcGlhLmZhY3RvcnkoJ1VuaXRzT2JqZWN0RmFjdG9yeScsIFsnQ1VSUkVOQ1lfVU5JVFMnLFxuICAgIGZ1bmN0aW9uIChDVVJSRU5DWV9VTklUUykge1xuICAgICAgICB2YXIgVW5pdHMgPSBmdW5jdGlvbiAodW5pdHNMaXN0KSB7XG4gICAgICAgICAgICB0aGlzLnVuaXRzID0gdW5pdHNMaXN0O1xuICAgICAgICB9O1xuICAgICAgICB2YXIgaXN1bml0ID0gZnVuY3Rpb24gKHVuaXQpIHtcbiAgICAgICAgICAgIHJldHVybiAhKCcvKigpICcuaW5jbHVkZXModW5pdCkpO1xuICAgICAgICB9O1xuICAgICAgICAvLyBUT0RPIChhbmtpdGEyNDA3OTYpIFJlbW92ZSB0aGUgYnJhY2tldCBub3RhdGlvbiBvbmNlIEFuZ3VsYXIyIGdldHMgaW4uXG4gICAgICAgIC8qIGVzbGludC1kaXNhYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICBVbml0c1snc3RyaW5nVG9MZXhpY2FsJ10gPSBmdW5jdGlvbiAodW5pdHMpIHtcbiAgICAgICAgICAgIC8qIGVzbGludC1lbmFibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgICAgICB1bml0cyArPSAnIyc7XG4gICAgICAgICAgICB2YXIgdW5pdExpc3QgPSBbXTtcbiAgICAgICAgICAgIHZhciB1bml0ID0gJyc7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHVuaXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKCcqLygpIyAnLmluY2x1ZGVzKHVuaXRzW2ldKSAmJiB1bml0ICE9PSAncGVyJykge1xuICAgICAgICAgICAgICAgICAgICBpZiAodW5pdC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoKHVuaXRMaXN0Lmxlbmd0aCA+IDApICYmIGlzdW5pdCh1bml0TGlzdC5zbGljZSgtMSkucG9wKCkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdW5pdExpc3QucHVzaCgnKicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdW5pdExpc3QucHVzaCh1bml0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVuaXQgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoISgnIyAnLmluY2x1ZGVzKHVuaXRzW2ldKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVuaXRMaXN0LnB1c2godW5pdHNbaV0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHVuaXRzW2ldID09PSAnICcgJiYgdW5pdCA9PT0gJ3BlcicpIHtcbiAgICAgICAgICAgICAgICAgICAgdW5pdExpc3QucHVzaCgnLycpO1xuICAgICAgICAgICAgICAgICAgICB1bml0ID0gJyc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB1bml0ICs9IHVuaXRzW2ldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB1bml0TGlzdDtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIHVuaXRXaXRoTXVsdGlwbGllciA9IGZ1bmN0aW9uICh1bml0TGlzdCkge1xuICAgICAgICAgICAgdmFyIG11bHRpcGxpZXIgPSAxO1xuICAgICAgICAgICAgdmFyIHVuaXRzV2l0aE11bHRpcGxpZXIgPSBbXTtcbiAgICAgICAgICAgIHZhciBwYXJlbnRoZXNpc1N0YWNrID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBpbmQgPSAwOyBpbmQgPCB1bml0TGlzdC5sZW5ndGg7IGluZCsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHVuaXRMaXN0W2luZF0gPT09ICcvJykge1xuICAgICAgICAgICAgICAgICAgICBtdWx0aXBsaWVyID0gLW11bHRpcGxpZXI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHVuaXRMaXN0W2luZF0gPT09ICcoJykge1xuICAgICAgICAgICAgICAgICAgICBpZiAodW5pdExpc3RbaW5kIC0gMV0gPT09ICcvJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgcHJldmlvdXMgZWxlbWVudCB3YXMgZGl2aXNpb24gdGhlbiB3ZSBuZWVkIHRvIGludmVyc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIG11bHRpcGxpZXIgd2hlbiB3ZSBmaW5kIGl0cyBjb3JyZXNwb25zaW5nIGNsb3NpbmcgcGFyZW50aGVzaXMuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBTZWNvbmQgZWxlbWVudCBvZiBwdXNoZWQgZWxlbWVudCBpcyB1c2VkIGZvciB0aGlzIHB1cnBvc2UuXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnRoZXNpc1N0YWNrLnB1c2goWycoJywgLTFdKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIHByZXZpb3VzIGVsZW1lbnQgd2FzIG5vdCBkaXZpc2lvbiB0aGVuIHdlIGRvbid0IG5lZWQgdG9cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGludmVydCB0aGUgbXVsdGlwbGllci5cbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudGhlc2lzU3RhY2sucHVzaChbJygnLCAxXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAodW5pdExpc3RbaW5kXSA9PT0gJyknKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBlbGVtID0gcGFyZW50aGVzaXNTdGFjay5wb3AoKTtcbiAgICAgICAgICAgICAgICAgICAgbXVsdGlwbGllciA9IHBhcnNlSW50KGVsZW1bMV0pICogbXVsdGlwbGllcjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoaXN1bml0KHVuaXRMaXN0W2luZF0pKSB7XG4gICAgICAgICAgICAgICAgICAgIHVuaXRzV2l0aE11bHRpcGxpZXIucHVzaChbdW5pdExpc3RbaW5kXSwgbXVsdGlwbGllcl0pO1xuICAgICAgICAgICAgICAgICAgICAvLyBJZiBwcmV2aW91cyBlbGVtZW50IHdhcyBkaXZpc2lvbiB0aGVuIHdlIG5lZWQgdG8gaW52ZXJ0XG4gICAgICAgICAgICAgICAgICAgIC8vIG11bHRpcGxpZXIuXG4gICAgICAgICAgICAgICAgICAgIGlmICh1bml0TGlzdFtpbmQgLSAxXSA9PT0gJy8nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtdWx0aXBsaWVyID0gLW11bHRpcGxpZXI7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdW5pdHNXaXRoTXVsdGlwbGllcjtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIGNvbnZlcnRVbml0RGljdFRvTGlzdCA9IGZ1bmN0aW9uICh1bml0RGljdCkge1xuICAgICAgICAgICAgdmFyIHVuaXRMaXN0ID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gdW5pdERpY3QpIHtcbiAgICAgICAgICAgICAgICB1bml0TGlzdC5wdXNoKHsgdW5pdDoga2V5LCBleHBvbmVudDogdW5pdERpY3Rba2V5XSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB1bml0TGlzdDtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIHVuaXRUb0xpc3QgPSBmdW5jdGlvbiAodW5pdHNXaXRoTXVsdGlwbGllcikge1xuICAgICAgICAgICAgdmFyIHVuaXREaWN0ID0ge307XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHVuaXRzV2l0aE11bHRpcGxpZXIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgdW5pdCA9IHVuaXRzV2l0aE11bHRpcGxpZXJbaV1bMF07XG4gICAgICAgICAgICAgICAgdmFyIG11bHRpcGxpZXIgPSB1bml0c1dpdGhNdWx0aXBsaWVyW2ldWzFdO1xuICAgICAgICAgICAgICAgIHZhciBpbmQgPSB1bml0LmluZGV4T2YoJ14nKTtcbiAgICAgICAgICAgICAgICB2YXIgcyA9IG51bGw7XG4gICAgICAgICAgICAgICAgdmFyIHBvd2VyID0gbnVsbDtcbiAgICAgICAgICAgICAgICBpZiAoaW5kID4gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgcyA9IHVuaXQuc3Vic3RyKDAsIGluZCk7XG4gICAgICAgICAgICAgICAgICAgIHBvd2VyID0gcGFyc2VJbnQodW5pdC5zdWJzdHIoaW5kICsgMSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcyA9IHVuaXQ7XG4gICAgICAgICAgICAgICAgICAgIHBvd2VyID0gMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCEocyBpbiB1bml0RGljdCkpIHtcbiAgICAgICAgICAgICAgICAgICAgdW5pdERpY3Rbc10gPSAwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB1bml0RGljdFtzXSArPSBtdWx0aXBsaWVyICogcG93ZXI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gY29udmVydFVuaXREaWN0VG9MaXN0KHVuaXREaWN0KTtcbiAgICAgICAgfTtcbiAgICAgICAgVW5pdHMucHJvdG90eXBlLnRvRGljdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdW5pdHM6IHRoaXMudW5pdHNcbiAgICAgICAgICAgIH07XG4gICAgICAgIH07XG4gICAgICAgIC8vIFRPRE8gKGFua2l0YTI0MDc5NikgUmVtb3ZlIHRoZSBicmFja2V0IG5vdGF0aW9uIG9uY2UgQW5ndWxhcjIgZ2V0cyBpbi5cbiAgICAgICAgLyogZXNsaW50LWRpc2FibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgIFVuaXRzWydmcm9tTGlzdCddID0gZnVuY3Rpb24gKHVuaXRzTGlzdCkge1xuICAgICAgICAgICAgLyogZXNsaW50LWVuYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgICAgIHJldHVybiBuZXcgVW5pdHModW5pdHNMaXN0KTtcbiAgICAgICAgfTtcbiAgICAgICAgLy8gVE9ETyAoYW5raXRhMjQwNzk2KSBSZW1vdmUgdGhlIGJyYWNrZXQgbm90YXRpb24gb25jZSBBbmd1bGFyMiBnZXRzIGluLlxuICAgICAgICAvKiBlc2xpbnQtZGlzYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgVW5pdHNbJ2Zyb21TdHJpbmdUb0xpc3QnXSA9IGZ1bmN0aW9uICh1bml0c1N0cmluZykge1xuICAgICAgICAgICAgLyogZXNsaW50LWVuYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgICAgIC8vIFRPRE8gKGFua2l0YTI0MDc5NikgUmVtb3ZlIHRoZSBicmFja2V0IG5vdGF0aW9uIG9uY2UgQW5ndWxhcjIgZ2V0cyBpbi5cbiAgICAgICAgICAgIC8qIGVzbGludC1kaXNhYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICAgICAgcmV0dXJuIHVuaXRUb0xpc3QodW5pdFdpdGhNdWx0aXBsaWVyKFVuaXRzWydzdHJpbmdUb0xleGljYWwnXSh1bml0c1N0cmluZykpKTtcbiAgICAgICAgICAgIC8qIGVzbGludC1lbmFibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgIH07XG4gICAgICAgIFVuaXRzLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciB1bml0ID0gJyc7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMudW5pdHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgZCA9IHRoaXMudW5pdHNbaV07XG4gICAgICAgICAgICAgICAgaWYgKGQuZXhwb25lbnQgPT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgdW5pdCArPSBkLnVuaXQgKyAnICc7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB1bml0ICs9IGQudW5pdCArICdeJyArIGQuZXhwb25lbnQudG9TdHJpbmcoKSArICcgJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdW5pdC50cmltKCk7XG4gICAgICAgIH07XG4gICAgICAgIC8vIFRPRE8gKGFua2l0YTI0MDc5NikgUmVtb3ZlIHRoZSBicmFja2V0IG5vdGF0aW9uIG9uY2UgQW5ndWxhcjIgZ2V0cyBpbi5cbiAgICAgICAgLyogZXNsaW50LWRpc2FibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgIFVuaXRzWydjcmVhdGVDdXJyZW5jeVVuaXRzJ10gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvKiBlc2xpbnQtZW5hYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICAgICAgLy8gQ3JlYXRlcyB1c2VyLWRlZmluZWQgY3VycmVuY3kgKGJhc2UgKyBzdWIpIHVuaXRzLlxuICAgICAgICAgICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhDVVJSRU5DWV9VTklUUyk7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoQ1VSUkVOQ1lfVU5JVFNba2V5c1tpXV0uYmFzZV91bml0ID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEJhc2UgdW5pdCAobGlrZTogcnVwZWVzLCBkb2xsYXIgZXRjLikuXG4gICAgICAgICAgICAgICAgICAgIG1hdGguY3JlYXRlVW5pdChDVVJSRU5DWV9VTklUU1trZXlzW2ldXS5uYW1lLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhbGlhc2VzOiBDVVJSRU5DWV9VTklUU1trZXlzW2ldXS5hbGlhc2VzXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gU3ViIHVuaXQgKGxpa2U6IHBhaXNlLCBjZW50cyBldGMuKS5cbiAgICAgICAgICAgICAgICAgICAgbWF0aC5jcmVhdGVVbml0KENVUlJFTkNZX1VOSVRTW2tleXNbaV1dLm5hbWUsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmluaXRpb246IENVUlJFTkNZX1VOSVRTW2tleXNbaV1dLmJhc2VfdW5pdCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsaWFzZXM6IENVUlJFTkNZX1VOSVRTW2tleXNbaV1dLmFsaWFzZXNcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICAvLyBUT0RPIChhbmtpdGEyNDA3OTYpIFJlbW92ZSB0aGUgYnJhY2tldCBub3RhdGlvbiBvbmNlIEFuZ3VsYXIyIGdldHMgaW4uXG4gICAgICAgIC8qIGVzbGludC1kaXNhYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICBVbml0c1sndG9NYXRoanNDb21wYXRpYmxlU3RyaW5nJ10gPSBmdW5jdGlvbiAodW5pdHMpIHtcbiAgICAgICAgICAgIC8qIGVzbGludC1lbmFibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgICAgICAvLyBNYWtlcyB0aGUgdW5pdHMgY29tcGF0aWJsZSB3aXRoIHRoZSBtYXRoLmpzIGFsbG93ZWQgZm9ybWF0LlxuICAgICAgICAgICAgdW5pdHMgPSB1bml0cy5yZXBsYWNlKC9wZXIvZywgJy8nKTtcbiAgICAgICAgICAgIC8vIFNwZWNpYWwgc3ltYm9scyBuZWVkIHRvIGJlIHJlcGxhY2VkIGFzIG1hdGguanMgZG9lc24ndCBzdXBwb3J0IGN1c3RvbVxuICAgICAgICAgICAgLy8gdW5pdHMgc3RhcnRpbmcgd2l0aCBzcGVjaWFsIHN5bWJvbHMuIEFsc28sIGl0IGRvZXNuJ3QgYWxsb3cgdW5pdHNcbiAgICAgICAgICAgIC8vIGZvbGxvd2VkIGJ5IGEgbnVtYmVyIGFzIGluIHRoZSBjYXNlIG9mIGN1cnJlbmN5IHVuaXRzLlxuICAgICAgICAgICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhDVVJSRU5DWV9VTklUUyk7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IENVUlJFTkNZX1VOSVRTW2tleXNbaV1dLmZyb250X3VuaXRzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh1bml0cy5pbmNsdWRlcyhDVVJSRU5DWV9VTklUU1trZXlzW2ldXS5mcm9udF91bml0c1tqXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVuaXRzID0gdW5pdHMucmVwbGFjZShDVVJSRU5DWV9VTklUU1trZXlzW2ldXS5mcm9udF91bml0c1tqXSwgJycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdW5pdHMgPSBDVVJSRU5DWV9VTklUU1trZXlzW2ldXS5uYW1lICsgdW5pdHM7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBDVVJSRU5DWV9VTklUU1trZXlzW2ldXS5hbGlhc2VzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh1bml0cy5pbmNsdWRlcyhDVVJSRU5DWV9VTklUU1trZXlzW2ldXS5hbGlhc2VzW2pdKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdW5pdHMgPSB1bml0cy5yZXBsYWNlKENVUlJFTkNZX1VOSVRTW2tleXNbaV1dLmFsaWFzZXNbal0sIENVUlJFTkNZX1VOSVRTW2tleXNbaV1dLm5hbWUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHVuaXRzLnRyaW0oKTtcbiAgICAgICAgfTtcbiAgICAgICAgLy8gVE9ETyAoYW5raXRhMjQwNzk2KSBSZW1vdmUgdGhlIGJyYWNrZXQgbm90YXRpb24gb25jZSBBbmd1bGFyMiBnZXRzIGluLlxuICAgICAgICAvKiBlc2xpbnQtZGlzYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgVW5pdHNbJ2Zyb21SYXdJbnB1dFN0cmluZyddID0gZnVuY3Rpb24gKHVuaXRzKSB7XG4gICAgICAgICAgICAvKiBlc2xpbnQtZW5hYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAvLyBUT0RPIChhbmtpdGEyNDA3OTYpIFJlbW92ZSB0aGUgYnJhY2tldCBub3RhdGlvbiBvbmNlIEFuZ3VsYXIyXG4gICAgICAgICAgICAgICAgLy8gZ2V0cyBpbi5cbiAgICAgICAgICAgICAgICAvKiBlc2xpbnQtZGlzYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgICAgICAgICBVbml0c1snY3JlYXRlQ3VycmVuY3lVbml0cyddKCk7XG4gICAgICAgICAgICAgICAgLyogZXNsaW50LWVuYWJsZSBkb3Qtbm90YXRpb24gKi9cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChwYXJzaW5nRXJyb3IpIHsgfVxuICAgICAgICAgICAgLy8gVE9ETyAoYW5raXRhMjQwNzk2KSBSZW1vdmUgdGhlIGJyYWNrZXQgbm90YXRpb24gb25jZSBBbmd1bGFyMiBnZXRzIGluLlxuICAgICAgICAgICAgLyogZXNsaW50LWRpc2FibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgICAgICB2YXIgY29tcGF0aWJsZVVuaXRzID0gVW5pdHNbJ3RvTWF0aGpzQ29tcGF0aWJsZVN0cmluZyddKHVuaXRzKTtcbiAgICAgICAgICAgIC8qIGVzbGludC1lbmFibGUgZG90LW5vdGF0aW9uICovXG4gICAgICAgICAgICBpZiAoY29tcGF0aWJsZVVuaXRzICE9PSAnJykge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIG1hdGgudW5pdChjb21wYXRpYmxlVW5pdHMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIFRPRE8gKGFua2l0YTI0MDc5NikgUmVtb3ZlIHRoZSBicmFja2V0IG5vdGF0aW9uIG9uY2UgQW5ndWxhcjIgZ2V0cyBpbi5cbiAgICAgICAgICAgIC8qIGVzbGludC1kaXNhYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBVbml0cyhVbml0c1snZnJvbVN0cmluZ1RvTGlzdCddKHVuaXRzKSk7XG4gICAgICAgICAgICAvKiBlc2xpbnQtZW5hYmxlIGRvdC1ub3RhdGlvbiAqL1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gVW5pdHM7XG4gICAgfV0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTkgVGhlIE9wcGlhIEF1dGhvcnMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4vL1xuLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy9cbi8vICAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vL1xuLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUy1JU1wiIEJBU0lTLFxuLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbi8qKlxuICogQGZpbGVvdmVydmlldyBDb252ZXJ0VG9QbGFpblRleHQgZmlsdGVyIGZvciBPcHBpYS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ3N0cmluZ1V0aWxpdHlGaWx0ZXJzTW9kdWxlJykuZmlsdGVyKCdjb252ZXJ0VG9QbGFpblRleHQnLCBbZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgICAgICAgICB2YXIgc3RyaXBwZWRUZXh0ID0gaW5wdXQucmVwbGFjZSgvKDwoW14+XSspPikvaWcsICcnKTtcbiAgICAgICAgICAgIHN0cmlwcGVkVGV4dCA9IHN0cmlwcGVkVGV4dC5yZXBsYWNlKC8mbmJzcDsvaWcsICcgJyk7XG4gICAgICAgICAgICBzdHJpcHBlZFRleHQgPSBzdHJpcHBlZFRleHQucmVwbGFjZSgvJnF1b3Q7L2lnLCAnJyk7XG4gICAgICAgICAgICB2YXIgdHJpbW1lZFRleHQgPSBzdHJpcHBlZFRleHQudHJpbSgpO1xuICAgICAgICAgICAgaWYgKHRyaW1tZWRUZXh0Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBzdHJpcHBlZFRleHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJpbW1lZFRleHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuXSk7XG4iXSwic291cmNlUm9vdCI6IiJ9