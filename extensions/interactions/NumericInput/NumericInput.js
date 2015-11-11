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
 * Directive for the NumericInput interaction.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */
oppia.directive('oppiaInteractiveNumericInput', [
  'oppiaHtmlEscaper', function(oppiaHtmlEscaper) {
    return {
      restrict: 'E',
      scope: {
        getAnswerClassificationData: '&answerClassificationData'
      },
      templateUrl: 'interaction/NumericInput',
      controller: ['$scope', '$attrs', 'focusService', 'numericInputService',
          function($scope, $attrs, focusService, numericInputService) {
        $scope.answer = '';
        $scope.labelForFocusTarget = $attrs.labelForFocusTarget || null;
        var answerClassificationData = $scope.getAnswerClassificationData();

        $scope.NUMERIC_INPUT_FORM_SCHEMA = {
          type: 'float',
          ui_config: {}
        };

        var USE_FRONTEND_RULE_EVALUATION = true;

        $scope.submitAnswer = function(answer) {
          if (answer !== undefined && answer !== null && answer !== '') {
            if (USE_FRONTEND_RULE_EVALUATION) {
              var timeAtSubmission = new Date().getTime();
              var answerClassificationOutcome = numericInputService.classifyAnswer(
                answer, answerClassificationData);
              $scope.$parent.processClassificationResult(
                answer, answerClassificationOutcome, timeAtSubmission);
            } else {
              if (answer !== undefined && answer !== null) {
                $scope.submitAnswer(Number(answer));
              }
            }
          }
        };
      }]
    };
  }
]);

oppia.directive('oppiaResponseNumericInput', [
  'oppiaHtmlEscaper', function(oppiaHtmlEscaper) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: 'response/NumericInput',
      controller: ['$scope', '$attrs', function($scope, $attrs) {
        $scope.answer = oppiaHtmlEscaper.escapedJsonToObj($attrs.answer);
        // If the answer is an integer, omit the fractional part.
        if ($scope.answer % 1 === 0) {
          $scope.answer = Math.round($scope.answer);
        }
      }]
    };
  }
]);

oppia.directive('oppiaShortResponseNumericInput', [
  'oppiaHtmlEscaper', function(oppiaHtmlEscaper) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: 'shortResponse/NumericInput',
      controller: ['$scope', '$attrs', function($scope, $attrs) {
        $scope.answer = oppiaHtmlEscaper.escapedJsonToObj($attrs.answer);
        // If the answer is an integer, omit the fractional part.
        if ($scope.answer % 1 === 0) {
          $scope.answer = Math.round($scope.answer);
        }
      }]
    };
  }
]);

oppia.factory('numericInputService', [
    'interactionService', function(interactionService) {
  var RULES = {
    'Equals': function(answer, inputs) {
      return answer == inputs.x;
    },
    'IsLessThan': function(answer, inputs) {
      return answer < inputs.x;
    },
    'IsGreaterThan': function(answer, inputs) {
      return answer > inputs.x;
    },
    'IsLessThanOrEqualTo': function(answer, inputs) {
      return answer <= inputs.x;
    },
    'IsGreaterThanOrEqualTo': function(answer, inputs) {
      return answer >= inputs.x;
    },
    'IsInclusivelyBetween': function(answer, inputs) {
      return answer >= inputs.a && answer <= inputs.b;
    },
    'IsWithinTolerance': function(answer, inputs) {
      return answer >= inputs.x - inputs.tol &&
      answer <= inputs.x - inputs.tol;
    }
  };

  return {
    'classifyAnswer': function(answer, answerClassificationData) {
      return interactionService.classifyAnswer(
        answer, answerClassificationData, RULES);
    }
  };
}]);
