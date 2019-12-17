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

require(
  'components/forms/custom-forms-directives/apply-validation.directive.ts');
require(
  'components/forms/custom-forms-directives/require-is-float.directive.ts');

require('components/forms/validators/is-float.filter.ts');
require('domain/utilities/url-interpolation.service.ts');
require('services/stateful/focus-manager.service.ts');

angular.module('oppia').directive('schemaBasedFloatEditor', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        localValue: '=',
        isDisabled: '&',
        validators: '&',
        labelForFocusTarget: '&',
        onInputBlur: '=',
        onInputFocus: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/forms/schema-based-editors/' +
        'schema-based-float-editor.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$scope', '$filter', '$timeout', 'FocusManagerService',
        function($scope, $filter, $timeout, FocusManagerService) {
          var ctrl = this;
          ctrl.hasLoaded = false;
          ctrl.isUserCurrentlyTyping = false;
          ctrl.hasFocusedAtLeastOnce = false;

          ctrl.labelForErrorFocusTarget =
            FocusManagerService.generateFocusLabel();

          ctrl.validate = function(localValue) {
            return $filter('isFloat')(localValue) !== undefined;
          };

          ctrl.onFocus = function() {
            ctrl.hasFocusedAtLeastOnce = true;
            if (ctrl.onInputFocus) {
              ctrl.onInputFocus();
            }
          };

          ctrl.onBlur = function() {
            ctrl.isUserCurrentlyTyping = false;
            if (ctrl.onInputBlur) {
              ctrl.onInputBlur();
            }
          };

          // TODO(sll): Move these to ng-messages when we move to Angular 1.3.
          ctrl.getMinValue = function() {
            for (var i = 0; i < ctrl.validators().length; i++) {
              if (ctrl.validators()[i].id === 'is_at_least') {
                return ctrl.validators()[i].min_value;
              }
            }
          };

          ctrl.getMaxValue = function() {
            for (var i = 0; i < ctrl.validators().length; i++) {
              if (ctrl.validators()[i].id === 'is_at_most') {
                return ctrl.validators()[i].max_value;
              }
            }
          };

          ctrl.onKeypress = function(evt) {
            if (evt.keyCode === 13) {
              if (
                Object.keys(ctrl.floatForm.floatValue.$error).length !== 0) {
                ctrl.isUserCurrentlyTyping = false;
                FocusManagerService.setFocus(ctrl.labelForErrorFocusTarget);
              } else {
                $scope.$emit('submittedSchemaBasedFloatForm');
              }
            } else {
              ctrl.isUserCurrentlyTyping = true;
            }
          };

          if (ctrl.localValue === undefined) {
            ctrl.localValue = 0.0;
          }

          // This prevents the red 'invalid input' warning message from flashing
          // at the outset.
          $timeout(function() {
            ctrl.hasLoaded = true;
          });
        }
      ]
    };
  }]);
