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
 * Directive for the ItemSelectionInput interaction.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

oppia.directive('oppiaInteractiveItemSelectionInput', [
  'oppiaHtmlEscaper', function(oppiaHtmlEscaper) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: 'interaction/ItemSelectionInput',
      controller: ['$scope', '$attrs', function($scope, $attrs) {
        $scope.choices = oppiaHtmlEscaper.escapedJsonToObj($attrs.choicesWithValue);
        var maxAllowableSelectionCount = $attrs.maxAllowableSelectionCountWithValue;
        var minAllowableSelectionCount = $attrs.minAllowableSelectionCountWithValue;
        $scope.studentSelections = {};

        if (maxAllowableSelectionCount == 1) {
          $scope.isCheckbox = false;
        } else {
          $scope.isCheckbox = true;
        }


        for (var i = 0; i < $scope.choices.length; i++) {
          $scope.studentSelections[$scope.choices[i]] = false;
        }

        $scope.answers = [];
        $scope.maxed = false; // Indicates if the count is over max.
        $scope.min = false;  // Indicates if count is under min.

        $scope.checkCount = function(selection) {
          index = $scope.answers.indexOf(selection);
          if (index !== -1) {
            $scope.answers.splice(index, 1);
          } else if (!$scope.maxed) {
            $scope.answers.push(selection);
          }
          var size = $scope.answers.length;
          if (size >= maxAllowableSelectionCount) {
            $scope.maxed = true;
          } else {
            $scope.maxed = false;
          }
          if (size >= minAllowableSelectionCount) {
            $scope.min = true;
          } else {
            $scope.min = false;
          }
        };

        $scope.submitAnswer = function(answer) {
          var answers = [];

          if (answer != null) {
            answers.push(answer);
          } else {
            answers = $scope.answers;
          }

          $scope.$parent.$parent.submitAnswer(answers, 'submit');
        };
      }]
    };
  }
]);

oppia.directive('oppiaResponseItemSelectionInput', [
  'oppiaHtmlEscaper', function(oppiaHtmlEscaper) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: 'response/ItemSelectionInput',
      controller: ['$scope', '$attrs', function($scope, $attrs) {
        $scope.answer = oppiaHtmlEscaper.escapedJsonToObj($attrs.answer);
        $scope.response = $scope.answer;
      }]
    };
  }
]);
