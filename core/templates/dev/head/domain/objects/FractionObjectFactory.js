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

oppia.factory('FractionObjectFactory', [
 function() {
   var errors = {
     InvalidChars:
       'Please only use numerical digits, spaces or forward slashes (/)',
     InvalidFormat:
       'Please enter answer in fraction format (e.g. 5/3 or 1 2/3)',
     DivideByZero: 'Please do not put 0 in the denominator'
   };

   var Fraction = function(isNegative, wholeNumber, numerator, denominator) {
     this.isNegative = isNegative;
     this.wholeNumber = wholeNumber;
     this.numerator = numerator;
     this.denominator = denominator;
   };

   Fraction.prototype.toString = function () {
     var fractionstring = '';
     if (this.numerator !== 0) {
       fractionstring += this.numerator + '/' + this.denominator;
     }
     if (this.wholeNumber !== 0) {
       fractionstring = this.wholeNumber + ' ' + fractionstring;
       // if fractional part was empty then there will be a trailing whitespace.
       fractionstring = fractionstring.trim();
     }
     if (this.isNegative && fractionstring !== '') {
       fractionstring = '-' + fractionstring;
     }
     return fractionstring === '' ? '0' : fractionstring;
   };

   Fraction.prototype.toDict = function() {
     return {
       isNegative: this.isNegative,
       wholeNumber: this.wholeNumber,
       numerator: this.numerator,
       denominator: this.denominator
     };
   };

   Fraction.parse = function(rawInput) {
    // TODO(aa): Perform error checking on the input using regexes.
     var invalidChars = /[^\d\s\/-]/g;
     if (invalidChars.test(rawInput)) {
       throw new Error(errors.InvalidChars);
     }
     var validFormat = /^\s*-?\s*((\d*\s*\d+\s*\/\s*\d+)|\d+)\s*$/;
     if (!validFormat.test(rawInput)) {
       throw new Error(errors.InvalidFormat);
     }
     var isNegative = false;
     var wholeNumber = 0;
     var numerator = 0;
     var denominator = 0;
     rawInput = rawInput.trim();
     if (rawInput.charAt(0) === '-') {
       isNegative = true;
       // Remove the negative char from the string.
       rawInput = rawInput.substring(1);
     }
     // Filter result from split to remove empty strings.
     var numbers = rawInput.split(/\/|\s/g).filter(function(token) {
       // The empty string will evaluate to false.
       return token;
     });

     if (numbers.length == 1) {
       wholeNumber = parseInt(numbers[0]);
     } else if (numbers.length == 2) {
       numerator = parseInt(numbers[0]);
       denominator = parseInt(numbers[1]);
       if (denominator === 0) {
         throw new Error(errors.DivideByZero);
       }
     } else {
       // numbers.length == 3
       wholeNumber = parseInt(numbers[0]);
       numerator = parseInt(numbers[1]);
       denominator = parseInt(numbers[2]);
       if (denominator === 0) {
         throw new Error(errors.DivideByZero);
       }
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
