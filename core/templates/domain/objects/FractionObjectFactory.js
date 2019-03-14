// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Factory for creating instances of Fraction
 * domain objects.
 */

oppia.constant('FRACTION_PARSING_ERRORS', {
  INVALID_CHARS:
    'Please only use numerical digits, spaces or forward slashes (/)',
  INVALID_FORMAT:
    'Please enter a valid fraction (e.g., 5/3 or 1 2/3)',
  DIVISION_BY_ZERO: 'Please do not put 0 in the denominator'
});

oppia.factory('FractionObjectFactory', [
  'FRACTION_PARSING_ERRORS', function(FRACTION_PARSING_ERRORS) {
    var Fraction = function(isNegative, wholeNumber, numerator, denominator) {
      this.isNegative = isNegative;
      this.wholeNumber = wholeNumber;
      this.numerator = numerator;
      this.denominator = denominator;
    };

    Fraction.prototype.toString = function() {
      var fractionString = '';
      if (this.numerator !== 0) {
        fractionString += this.numerator + '/' + this.denominator;
      }
      if (this.wholeNumber !== 0) {
        fractionString = this.wholeNumber + ' ' + fractionString;
        // If the fractional part was empty then there will be a trailing
        // whitespace.
        fractionString = fractionString.trim();
      }
      if (this.isNegative && fractionString !== '') {
        fractionString = '-' + fractionString;
      }
      return fractionString === '' ? '0' : fractionString;
    };

    Fraction.prototype.toDict = function() {
      return {
        isNegative: this.isNegative,
        wholeNumber: this.wholeNumber,
        numerator: this.numerator,
        denominator: this.denominator
      };
    };

    Fraction.prototype.toFloat = function() {
      var totalParts = (this.wholeNumber * this.denominator) + this.numerator;
      var floatVal = (totalParts / this.denominator);
      return this.isNegative ? -floatVal : floatVal;
    };

    Fraction.prototype.getIntegerPart = function() {
      return this.isNegative ? -this.wholeNumber : this.wholeNumber;
    };

    Fraction.prototype.convertToSimplestForm = function() {
      var gcd = function(x, y) {
        return y === 0 ? x : gcd(y, x % y);
      };
      var g = gcd(this.numerator, this.denominator);
      var numerator = this.numerator / g;
      var denominator = this.denominator / g;
      return new Fraction(
        this.isNegative, this.wholeNumber, numerator, denominator);
    };

    Fraction.prototype.hasNonzeroIntegerPart = function() {
      return this.wholeNumber !== 0;
    };

    Fraction.prototype.isImproperFraction = function() {
      return this.denominator <= this.numerator;
    };

    Fraction.fromRawInputString = function(rawInput) {
      var INVALID_CHARS_REGEX = /[^\d\s\/-]/g;
      if (INVALID_CHARS_REGEX.test(rawInput)) {
        throw new Error(FRACTION_PARSING_ERRORS.INVALID_CHARS);
      }
      var FRACTION_REGEX = /^\s*-?\s*((\d*\s*\d+\s*\/\s*\d+)|\d+)\s*$/;
      if (!FRACTION_REGEX.test(rawInput)) {
        throw new Error(FRACTION_PARSING_ERRORS.INVALID_FORMAT);
      }
      var isNegative = false;
      var wholeNumber = 0;
      var numerator = 0;
      var denominator = 1;
      rawInput = rawInput.trim();
      if (rawInput.charAt(0) === '-') {
        isNegative = true;
        // Remove the negative char from the string.
        rawInput = rawInput.substring(1);
      }
      // Filter result from split to remove empty strings.
      var numbers = rawInput.split(/\/|\s/g).filter(function(token) {
        // The empty string will evaluate to false.
        return Boolean(token);
      });

      if (numbers.length === 1) {
        wholeNumber = parseInt(numbers[0]);
      } else if (numbers.length === 2) {
        numerator = parseInt(numbers[0]);
        denominator = parseInt(numbers[1]);
      } else {
        // numbers.length == 3
        wholeNumber = parseInt(numbers[0]);
        numerator = parseInt(numbers[1]);
        denominator = parseInt(numbers[2]);
      }
      if (denominator === 0) {
        throw new Error(FRACTION_PARSING_ERRORS.DIVISION_BY_ZERO);
      }
      return new Fraction(isNegative, wholeNumber, numerator, denominator);
    };

    Fraction.fromDict = function(fractionDict) {
      return new Fraction(
        fractionDict.isNegative,
        fractionDict.wholeNumber,
        fractionDict.numerator,
        fractionDict.denominator);
    };

    return Fraction;
  }
]);
