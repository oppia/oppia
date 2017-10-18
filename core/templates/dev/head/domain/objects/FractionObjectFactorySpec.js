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
 * @fileoverview unit tests for the fraction object type factory service.
 */

 describe('FractionObjectFactory', function() {
   beforeEach(module('oppia'));

   describe('fraction object factory', function() {
     var errors = {
       InvalidChars: 'Please only use numerical digits, spaces or forward slashes (/)',
       InvalidFormat: 'Please enter answer in fraction format (e.g. 5/3 or 1 2/3)',
       DivideByZero: 'Please do not put 0 in the denominator'
     };
     var Fraction = null;

     beforeEach(inject(function($injector) {
       Fraction = $injector.get(
         'FractionObjectFactory');
     }));

     it('should convert itself to a string in fraction format', function() {
       expect(new Fraction(true, 1, 2 ,3).toString()).toBe('-1 2/3');
       expect(new Fraction(false, 1, 2 ,3).toString()).toBe('1 2/3');
       expect(new Fraction(true, 0, 2 ,3).toString()).toBe('-2/3');
       expect(new Fraction(false, 0, 2 ,3).toString()).toBe('2/3');
       expect(new Fraction(true, 1, 0, 3).toString()).toBe('-1');
       expect(new Fraction(false, 1, 0, 3).toString()).toBe('1');
       expect(new Fraction(true, 0, 0, 3).toString()).toBe('0');
       expect(new Fraction(false, 0, 0, 3).toString()).toBe('0');
     });

     it('should parse valid strings', function() {
       expect(Fraction.parse('1   1/ 2').toDict()).toEqual(
         new Fraction(false, 1, 1, 2).toDict());
       expect(Fraction.parse('- 1 1 /2').toDict()).toEqual(
         new Fraction(true, 1, 1, 2).toDict());
       expect(Fraction.parse('1      ').toDict()).toEqual(
         new Fraction(false, 1, 0, 0).toDict());
       expect(Fraction.parse('  - 1').toDict()).toEqual(
         new Fraction(true, 1, 0, 0).toDict());
       expect(Fraction.parse('1  /  2').toDict()).toEqual(
         new Fraction(false, 0, 1, 2).toDict());
       expect(Fraction.parse(' -1 /2').toDict()).toEqual(
         new Fraction(true, 0, 1, 2).toDict());
       expect(Fraction.parse('0  1/2').toDict()).toEqual(
         new Fraction(false, 0, 1, 2).toDict());
       expect(Fraction.parse('1 0 /2').toDict()).toEqual(
         new Fraction(false, 1, 0, 2).toDict());
     });

     it('should throw errors for invalid fractions', function() {
       // Invalid characters.
       expect(function() {Fraction.parse('3 \ b')}).toThrow(
         new Error(errors.InvalidChars));
       expect(function() {Fraction.parse('a 3/5')}).toThrow(
           new Error(errors.InvalidChars));
       expect(function() {Fraction.parse('5 b/c')}).toThrow(
         new Error(errors.InvalidChars));
       expect(function() {Fraction.parse('a b/c')}).toThrow(
         new Error(errors.InvalidChars));
       // Invalid format.
       expect(function() {Fraction.parse('3 -')}).toThrow(
         new Error(errors.InvalidFormat));
       expect(function() {Fraction.parse('1  1')}).toThrow(
         new Error(errors.InvalidFormat));
       expect(function() {Fraction.parse('1/3 1/2')}).toThrow(
         new Error(errors.InvalidFormat));
       expect(function() {Fraction.parse('1 2 3 / 4')}).toThrow(
         new Error(errors.InvalidFormat));
       expect(function() {Fraction.parse('1 / 2 3')}).toThrow(
         new Error(errors.InvalidFormat));
       expect(function() {Fraction.parse('- / 3')}).toThrow(
            new Error(errors.InvalidFormat));
       expect(function() {Fraction.parse('/ 3')}).toThrow(
         new Error(errors.InvalidFormat));
       // Division by zero.
       expect(function() {Fraction.parse(' 1/0')}).toThrow(
         new Error(errors.DivideByZero));
       expect(function() {Fraction.parse('1 2 /0')}).toThrow(
         new Error(errors.DivideByZero));

     });

   });
 });
