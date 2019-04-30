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
 * @fileoverview Directive for a schema-based editor for floats.
 */

oppia.directive('schemaBasedFloatEditor', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      scope: {
        localValue: '=',
        isDisabled: '&',
        validators: '&',
        labelForFocusTarget: '&',
        onInputBlur: '=',
        onInputFocus: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/forms/schema_editors/' +
        'schema_based_float_editor_directive.html'),
      restrict: 'E',
      controller: [
        '$scope', '$filter', '$timeout', 'FocusManagerService',
        function($scope, $filter, $timeout, FocusManagerService) {
          $scope.hasLoaded = false;
          $scope.isUserCurrentlyTyping = false;
          $scope.hasFocusedAtLeastOnce = false;

          $scope.labelForErrorFocusTarget =
            FocusManagerService.generateFocusLabel();

          $scope.validate = function(localValue) {
            return $filter('isFloat')(localValue) !== undefined;
          };

          $scope.onFocus = function() {
            $scope.hasFocusedAtLeastOnce = true;
            if ($scope.onInputFocus) {
              $scope.onInputFocus();
            }
          };

          $scope.onBlur = function() {
            $scope.isUserCurrentlyTyping = false;
            if ($scope.onInputBlur) {
              $scope.onInputBlur();
            }
          };

          // TODO(sll): Move these to ng-messages when we move to Angular 1.3.
          $scope.getMinValue = function() {
            for (var i = 0; i < $scope.validators().length; i++) {
              if ($scope.validators()[i].id === 'is_at_least') {
                return $scope.validators()[i].min_value;
              }
            }
          };

          $scope.getMaxValue = function() {
            for (var i = 0; i < $scope.validators().length; i++) {
              if ($scope.validators()[i].id === 'is_at_most') {
                return $scope.validators()[i].max_value;
              }
            }
          };

          $scope.onKeypress = function(evt) {
            if (evt.keyCode === 13) {
              if (
                Object.keys($scope.floatForm.floatValue.$error).length !== 0) {
                $scope.isUserCurrentlyTyping = false;
                FocusManagerService.setFocus($scope.labelForErrorFocusTarget);
              } else {
                $scope.$emit('submittedSchemaBasedFloatForm');
              }
            } else {
              $scope.isUserCurrentlyTyping = true;
            }
          };

          if ($scope.localValue === undefined) {
            $scope.localValue = 0.0;
          }

          // This prevents the red 'invalid input' warning message from flashing
          // at the outset.
          $timeout(function() {
            $scope.hasLoaded = true;
          });
        }
      ]
    };
  }]);
