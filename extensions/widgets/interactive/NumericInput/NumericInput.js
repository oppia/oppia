// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * Directive for the NumericInput interactive widget.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */
oppia.directive('oppiaInteractiveNumericInput', [
  'oppiaHtmlEscaper', function(oppiaHtmlEscaper) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: 'interactiveWidget/NumericInput',
      controller: ['$scope', '$attrs', function($scope, $attrs) {
        $scope.inFocus = false;

        $scope.answer = null;
        $scope.errorMessage = '';

        $scope.getErrorMessage = function() {
          // This is used to re-trigger the aria-live warning when the
          // user clicks the button multiple times without making a selection.
          var randomSuffix = '';
          var N = Math.round(Math.random() * 1000);
          for (var i = 0; i < N; i++) {
            randomSuffix += ' ';
          }

          return 'Please enter a valid number.' + randomSuffix;
        };

        $scope.setFocus = function() {
          $scope.inFocus = true;
        };

        $scope.setBlur = function() {
          $scope.inFocus = false;
        };

        $scope.submitAnswer = function(answer) {
          if (answer === null || answer === undefined ||
              !$scope.numericInputForm.answer.$valid) {
            $scope.errorMessage = $scope.getErrorMessage();
          } else {
            $scope.errorMessage = '';
            $scope.$parent.$parent.submitAnswer(answer, 'submit');
          }
        };
      }]
    };
  }
]);

oppia.directive('validateAsRealNumber', function() {
  var FLOAT_REGEXP = /^\-?\d*((\.|\,)\d+)?$/;
  return {
    require: 'ngModel',
    restrict: 'A',
    link: function(scope, elm, attrs, ctrl) {
      ctrl.$parsers.unshift(function(viewValue) {
        if (FLOAT_REGEXP.test(viewValue)) {
          ctrl.$setValidity('realNumber', true);
          return (
            (typeof viewValue === 'number') ? viewValue :
            parseFloat(viewValue.replace(',', '.'))
          );
        } else {
          ctrl.$setValidity('realNumber', false);
          return undefined;
        }
      });
    }
  };
});
