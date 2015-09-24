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
        $scope.maxAllowableSelectionCount = $attrs.maxAllowableSelectionCountWithValue;
        $scope.minAllowableSelectionCount = $attrs.minAllowableSelectionCountWithValue;

        // The following is an associative array where the key is a choice (html)
        // and the value is a boolean value indicating whether the choice was selected
        // by the user (default is false).
        $scope.userSelections = {};

        for (var i = 0; i < $scope.choices.length; i++) {
          $scope.userSelections[$scope.choices[i]] = false;
        }

        $scope.displayCheckboxes = ($scope.maxAllowableSelectionCount > 1);

        // The following indicates that the number of answers is more than
        // maxAllowableSelectionCount.
        $scope.preventAdditionalSelections = false;

        // The following indicates that the number of answers is less than
        // minAllowableSelectionCount.
        $scope.notEnoughSelections = true;


        $scope.onToggleCheckbox = function() {
          $scope.newQuestion = false;
          $scope.selectionCount = Object.keys($scope.userSelections).filter(function(obj) {
            return $scope.userSelections[obj];
          }).length;
          $scope.preventAdditionalSelections = ($scope.selectionCount >= $scope.maxAllowableSelectionCount);
          $scope.notEnoughSelections = ($scope.selectionCount < $scope.minAllowableSelectionCount);
        };

        $scope.submitAnswer = function(answer) {
          var answers = Object.keys($scope.userSelections).filter(function(obj) {
            return $scope.userSelections[obj];
          });

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
      }]
    };
  }
]);

oppia.directive('oppiaShortResponseItemSelectionInput', [
  'oppiaHtmlEscaper', function(oppiaHtmlEscaper) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: 'shortResponse/ItemSelectionInput',
      controller: ['$scope', '$attrs', function($scope, $attrs) {
        $scope.answer = oppiaHtmlEscaper.escapedJsonToObj($attrs.answer);
      }]
    };
  }
]);
