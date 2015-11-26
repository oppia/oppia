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
 * Directive for the TextInput interaction.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */
oppia.directive('oppiaInteractiveTextInput', [
  'oppiaHtmlEscaper', function(oppiaHtmlEscaper) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: 'interaction/TextInput',
      controller: ['$scope', '$attrs', 'focusService',
          function($scope, $attrs, focusService) {
        $scope.placeholder = oppiaHtmlEscaper.escapedJsonToObj(
          $attrs.placeholderWithValue);
        $scope.rows = oppiaHtmlEscaper.escapedJsonToObj($attrs.rowsWithValue);
        $scope.answer = '';
        $scope.labelForFocusTarget = $attrs.labelForFocusTarget || null;

        $scope.schema = {
          type: 'unicode',
          ui_config: {}
        };
        if ($scope.placeholder) {
          $scope.schema.ui_config.placeholder = $scope.placeholder;
        }
        if ($scope.rows && $scope.rows !== 1) {
          $scope.schema.ui_config.rows = $scope.rows;
        }

        $scope.submitAnswer = function(answer) {
          $scope.$parent.$parent.submitAnswer(answer);
        };
      }]
    };
  }
]);

oppia.directive('oppiaResponseTextInput', [
  'oppiaHtmlEscaper', function(oppiaHtmlEscaper) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: 'response/TextInput',
      controller: ['$scope', '$attrs', function($scope, $attrs) {
        $scope.answer = oppiaHtmlEscaper.escapedJsonToObj($attrs.answer);
      }]
    };
  }
]);

oppia.directive('oppiaShortResponseTextInput', [
  'oppiaHtmlEscaper', function(oppiaHtmlEscaper) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: 'shortResponse/TextInput',
      controller: ['$scope', '$attrs', function($scope, $attrs) {
        $scope.answer = oppiaHtmlEscaper.escapedJsonToObj($attrs.answer);
      }]
    };
  }
]);
