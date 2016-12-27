// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for a schema-based editor for integers.
 */

oppia.directive('schemaBasedIntEditor', [function() {
  return {
    scope: {
      localValue: '=',
      isDisabled: '&',
      allowExpressions: '&',
      validators: '&',
      labelForFocusTarget: '&',
      onInputBlur: '=',
      onInputFocus: '='
    },
    templateUrl: 'schemaBasedEditor/int',
    restrict: 'E',
    controller: [
      '$scope', 'parameterSpecsService',
      function($scope, parameterSpecsService) {
        if ($scope.localValue === undefined) {
          $scope.localValue = 0;
        }

        $scope.onKeypress = function(evt) {
          if (evt.keyCode === 13) {
            $scope.$emit('submittedSchemaBasedIntForm');
          }
        };

        if ($scope.allowExpressions()) {
          $scope.paramNames = parameterSpecsService.getAllParamsOfType('int');
          $scope.expressionMode = angular.isString($scope.localValue);

          $scope.$watch('localValue', function(newValue) {
            $scope.expressionMode = angular.isString(newValue);
          });

          $scope.toggleExpressionMode = function() {
            $scope.expressionMode = !$scope.expressionMode;
            $scope.localValue = (
              $scope.expressionMode ? $scope.paramNames[0] : 0);
          };
        }
      }
    ]
  };
}]);
