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
 * Directive for the MultipleChoiceInput interaction.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */
oppia.directive('oppiaInteractiveMultipleChoiceInput', [
  'oppiaHtmlEscaper', 'multipleChoiceInputRulesService',
  function(oppiaHtmlEscaper, multipleChoiceInputRulesService) {
    return {
      restrict: 'E',
      scope: {
        onSubmit: '&'
      },
      templateUrl: 'interaction/MultipleChoiceInput',
      controller: ['$scope', '$attrs', function($scope, $attrs) {
        $scope.choices = oppiaHtmlEscaper.escapedJsonToObj(
          $attrs.choicesWithValue);
        $scope.answer = null;

        $scope.submitAnswer = function(answer) {
          answer = parseInt(answer, 10);
          $scope.onSubmit({
            answer: answer,
            rulesService: multipleChoiceInputRulesService
          });
        };
      }]
    };
  }
]);

oppia.directive('oppiaResponseMultipleChoiceInput', [
  'oppiaHtmlEscaper', function(oppiaHtmlEscaper) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: 'response/MultipleChoiceInput',
      controller: ['$scope', '$attrs', function($scope, $attrs) {
        var _answer = oppiaHtmlEscaper.escapedJsonToObj($attrs.answer);
        var _choices = oppiaHtmlEscaper.escapedJsonToObj($attrs.choices);
        $scope.response = _choices[_answer];
      }]
    };
  }
]);

oppia.directive('oppiaShortResponseMultipleChoiceInput', [
  'oppiaHtmlEscaper', function(oppiaHtmlEscaper) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: 'shortResponse/MultipleChoiceInput',
      controller: ['$scope', '$attrs', '$filter',
          function($scope, $attrs, $filter) {
        var _answer = oppiaHtmlEscaper.escapedJsonToObj($attrs.answer);
        var _choices = oppiaHtmlEscaper.escapedJsonToObj($attrs.choices);
        var response = $filter('convertToPlainText')(_choices[_answer]);
        $scope.response = $filter('truncateAtFirstLine')(response);
      }]
    };
  }
]);

oppia.factory('multipleChoiceInputRulesService', [function() {
  return {
    Equals: function(answer, inputs) {
      return answer === inputs.x;
    }
  };
}]);
