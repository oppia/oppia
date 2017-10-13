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
     var Fraction = function(isNegative, wholeNumber, numerator, denominator) {
       this.isNegative = isNegative;
       this.wholeNumber = wholeNumber;
       this.numerator = numerator;
       this.denominator = denominator;
     };

     Fraction.prototype.toString = function () {
       var fractionSring = '';
       if (this.numerator !== 0) {
         fractionSring += this.numerator + '/' + this.denominator;
       }
       if (this.wholeNumber !== 0) {
         fractionSring = this.wholeNumber + ' ' + fractionSring;
       }
       if (this.isNegative && fractionSring !== '') {
         fractionSring = '-' + fractionSring;
       }
       return fractionSring === '' ? '0' : fractionSring;
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
       } else {
         // numbers.length == 3
         wholeNumber = parseInt(numbers[0]);
         numerator = parseInt(numbers[1]);
         denominator = parseInt(numbers[2]);
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

oppia.directive('fractionEditor', [
  '$compile', 'FractionObjectFactory', 'OBJECT_EDITOR_URL_PREFIX',
  function($compile, FractionObjectFactory, OBJECT_EDITOR_URL_PREFIX) {
    return {
      link: function(scope, element) {
        scope.getTemplateUrl = function() {
          return OBJECT_EDITOR_URL_PREFIX + 'Fraction';
        };
        $compile(element.contents())(scope);
      },
      restrict: 'E',
      scope: true,
      template: '<span ng-include="getTemplateUrl()"></span>',
      controller: ['$scope', function($scope) {
        $scope.alwaysEditable = true;
        $scope.largeInput = false;
        var fractionString = '0';
        if ($scope.$parent.value != null) {
          var fraction = FractionObjectFactory.fromDict($scope.$parent.value);
          fractionString = fraction.toString();
        }
        $scope.localValue = {
          label: fractionString
        };

        $scope.$watch('localValue.label', function(newValue) {
          var fraction = FractionObjectFactory.parse(newValue);
          if (fraction) {
            $scope.$parent.value = fraction;
          }
        });
      }]
    };
  }]);
