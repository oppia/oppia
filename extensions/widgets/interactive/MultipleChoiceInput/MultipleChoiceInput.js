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
      templateUrl: 'interactiveWidget/MultipleChoiceInput',
      controller: ['$scope', '$attrs', function($scope, $attrs) {
        $scope.choices = oppiaHtmlEscaper.escapedJsonToObj($attrs.choicesWithValue);

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

          return 'Please select an option.' + randomSuffix;
        };

        $scope.submitAnswer = function(answer) {
          if (answer === null || answer === undefined) {
            $scope.errorMessage = $scope.getErrorMessage();
            return;
          }
          $scope.errorMessage = '';
          answer = parseInt(answer, 10);
          $scope.$parent.$parent.submitAnswer(answer, 'submit');
        };
      }]
    };
  }
]);
