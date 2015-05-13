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
 * Directive for the SimpleNumberWithUnits interaction.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */
oppia.directive('oppiaInteractiveSimpleNumberWithUnitsInput', [
  'oppiaHtmlEscaper', function(oppiaHtmlEscaper) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: 'interaction/SimpleNumberWithUnitsInput',
      controller: ['$scope', '$attrs', 'focusService', function($scope, $attrs, focusService) {
        $scope.unitChoices = oppiaHtmlEscaper.escapedJsonToObj($attrs.unitChoicesWithValue);
        $scope.answer = {
          number: 0.0,
          units: $scope.unitChoices[0]
        };
        $scope.labelForFocusTarget = $attrs.labelForFocusTarget || null;

        $scope.numberSchema = {
          type: 'float',
          ui_config: {}
        };

        $scope.unitsSchema = {
          type: 'unicode',
          choices: $scope.unitChoices
        };

        $scope.submitAnswer = function(answer) {
          if (answer.number === null || answer.number === undefined) {
            return;
          }

          $scope.$parent.$parent.submitAnswer(answer, 'submit');
        };
      }]
    };
  }
]);


oppia.directive('oppiaResponseSimpleNumberWithUnitsInput', [
  'oppiaHtmlEscaper', function(oppiaHtmlEscaper) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: 'response/SimpleNumberWithUnitsInput',
      controller: ['$scope', '$attrs', function($scope, $attrs) {
        $scope.answer = oppiaHtmlEscaper.escapedJsonToObj($attrs.answer);
      }]
    };
  }
]);
