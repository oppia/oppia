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
 * Directive for the MultipleChoiceInput interactive widget.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */
oppia.directive('oppiaInteractiveMultipleChoiceInput', [
  'oppiaHtmlEscaper', function(oppiaHtmlEscaper) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: 'interaction/MultipleChoiceInput',
      controller: ['$scope', '$attrs', function($scope, $attrs) {
        $scope.choices = oppiaHtmlEscaper.escapedJsonToObj($attrs.choicesWithValue);
        $scope.answer = null;

        $scope.submitAnswer = function(answer) {
          answer = parseInt(answer, 10);
          $scope.$parent.$parent.submitAnswer(answer, 'submit');
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
        $scope.answer = oppiaHtmlEscaper.escapedJsonToObj($attrs.answer);
        $scope.choices = oppiaHtmlEscaper.escapedJsonToObj($attrs.choices);
        $scope.response = $scope.choices[$scope.answer];
      }]
    };
  }
]);
