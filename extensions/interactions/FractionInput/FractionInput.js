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



oppia.directive('oppiaInteractiveFractionInput', [function() {
  return {
    restrict: 'E',
    scope: {
      onSubmit: '&'
    },
    templateUrl: 'interaction/FractionInput',
    controller: [
      '$scope', '$attrs', 'FocusManagerService',
      'fractionInputRulesService', 'FractionObjectFactory',
      function($scope, $attrs, FocusManagerService,
        fractionInputRulesService, FractionObjectFactory) {
        $scope.answer = '';
        $scope.labelForFocusTarget = $attrs.labelForFocusTarget || null;
        var requireSimplestForm =
          $attrs.requireSimplestFormWithValue === 'true';
        var errorMessage = '';
        $scope.FRACTION_INPUT_FORM_SCHEMA = {
          type: 'unicode',
          ui_config: {}
        };

        $scope.getWarningText = function() {
          return errorMessage;
        }

        $scope.submitAnswer = function(answer) {
          try {
            var fraction = FractionObjectFactory.fromRawInputString(
              answer);
            if (requireSimplestForm &&
              !angular.equals(fraction, fraction.convertToSimplestForm())
            ) {
              errorMessage =
                'Please enter answer in it\'s simplest form';
            } else {
              $scope.onSubmit({
                answer: fraction,
                rulesService: fractionInputRulesService
              });
            }
          } catch (parsingError) {
            errorMessage = parsingError.message;
          }
        };
      }
    ]
  };
}]);

oppia.directive('oppiaResponseFractionInput', [
  'FractionObjectFactory', 'HtmlEscaperService',
  function(FractionObjectFactory, HtmlEscaperService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: 'response/FractionInput',
      controller: ['$scope', '$attrs', function($scope, $attrs) {
        var answer = HtmlEscaperService.escapedJsonToObj($attrs.answer);
        $scope.answer = FractionObjectFactory.fromDict(answer).toString();
      }]
    };
  }
]);

/**
 * Rule evaluation for the fraction input.
 */
oppia.factory('fractionInputRulesService', [
  'FractionObjectFactory',
  function(FractionObjectFactory) {
    var toFloat = function(fractionDict) {
      return FractionObjectFactory.fromDict(fractionDict).toFloat();
    };

    return {
      IsEquivalentTo: function(answer, inputs) {
        return toFloat(answer) === toFloat(inputs.f);
      },
      IsEquivalentToAndInSimplestForm: function(answer, inputs) {
        var simplestForm =
          FractionObjectFactory.fromDict(inputs.f).convertToSimplestForm();
        return toFloat(answer) === toFloat(inputs.f) &&
          angular.equals(answer, simplestForm);
      },
      IsExactlyEqualTo: function(answer, inputs) {
        // Only returns true if both answers are structurally equal.
        return angular.equals(answer, inputs.f);
      },
      IsLessThan: function(answer, inputs) {
        return toFloat(answer) < toFloat(inputs.f);
      },
      IsGreaterThan: function(answer, inputs) {
        return toFloat(answer) > toFloat(inputs.f);
      },
      HasWholeNumberEqualTo: function(answer, inputs) {
        return answer.wholeNumber === inputs.f.wholeNumber;
      },
      HasNumeratorEqualTo: function(answer, inputs) {
        return answer.numerator === inputs.f.numerator;
      },
      HasDenominatorEqualTo: function(answer, inputs) {
        return answer.denominator === inputs.f.denominator;
      },
      HasNoFractionalPart: function(answer) {
        return answer.numerator === 0;
      },
    };
  }
]);
