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
require(
  'interactions/NumericInput/directives/numeric-input-validation.service.ts');
require('services/schema-form-submitted.service.ts');
require('services/stateful/focus-manager.service.ts');
require('services/number-conversion.service');

angular.module('oppia').directive('schemaBasedFloatEditor', [
  function() {
    return {
      restrict: 'E',
      scope: {
        labelForFocusTarget: '&'
      },
      bindToController: {
        localValue: '=',
        isDisabled: '&',
        validators: '&',
        labelForFocusTarget: '&',
        onInputBlur: '=',
        onInputFocus: '=',
        uiConfig: '&'
      },
      template: require('./schema-based-float-editor.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$scope', '$timeout', 'FocusManagerService',
        'NumberConversionService', 'NumericInputValidationService',
        'SchemaFormSubmittedService',
        function(
            $scope, $timeout, FocusManagerService,
            NumberConversionService, NumericInputValidationService,
            SchemaFormSubmittedService) {
          var ctrl = this;
          var labelForFocus = $scope.labelForFocusTarget();
          ctrl.validate = function(localValue, customizationArg) {
            let { checkRequireNonnegativeInput } = customizationArg || {};
            let checkRequireNonnegativeInputValue = (
            checkRequireNonnegativeInput === undefined ? false :
            checkRequireNonnegativeInput);
            return (
              !angular.isUndefined(localValue) &&
              localValue !== null &&
              localValue !== '' &&
              angular.isUndefined(
                NumericInputValidationService.getErrorStringI18nKey(
                  localValue, checkRequireNonnegativeInputValue)));
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

          ctrl.currentDecimalSeparator = function() {
            return NumberConversionService
              .currentDecimalSeparator();
          };

          ctrl.parseInput = function(): void {
            let regex = NumberConversionService.getInputValidationRegex();

            // Remove anything that isn't a number,
            // minus sign, exponent (e) sign or a decimal separator.
            ctrl.localStringValue = ctrl.localStringValue
              .replace(regex, '');

            // If input is empty, the number value should be null.
            if (ctrl.localStringValue === '') {
              ctrl.localValue = null;
            } else {
              // Make sure number is in a correct format.
              let error = NumericInputValidationService
                .validateNumericString(
                  ctrl.localStringValue,
                  ctrl.currentDecimalSeparator());
              if (error !== undefined) {
                ctrl.localValue = null;
                ctrl.errorString = error;
              } else { // Parse number if the string is in proper format.
                // Exploration Player.
                ctrl.localValue = NumberConversionService
                  .convertToEnglishDecimal(ctrl.localStringValue);

                // Generate errors (if any).
                ctrl.generateErrors();
              }
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

          ctrl.generateErrors = function() {
            ctrl.errorString = (
              NumericInputValidationService.validateNumber(
                ctrl.localValue, ctrl.checkRequireNonnegativeInputValue,
                ctrl.currentDecimalSeparator()));
          };

          ctrl.onKeypress = function(evt) {
            if (evt.keyCode === 13) {
              if (
                Object.keys(ctrl.floatForm.floatValue.$error).length !== 0) {
                ctrl.isUserCurrentlyTyping = false;
                FocusManagerService.setFocus(ctrl.labelForErrorFocusTarget);
              } else {
                SchemaFormSubmittedService.onSubmittedSchemaBasedForm.emit();
              }
            } else {
              ctrl.isUserCurrentlyTyping = true;
            }
          };

          ctrl.$onInit = function() {
            ctrl.hasLoaded = false;
            ctrl.isUserCurrentlyTyping = false;
            ctrl.hasFocusedAtLeastOnce = false;
            ctrl.errorStringI18nKey = '';
            ctrl.labelForErrorFocusTarget =
              FocusManagerService.generateFocusLabel();
            if (ctrl.localValue === undefined) {
              ctrl.localValue = 0.0;
            }
            if (ctrl.localStringValue === undefined) {
              ctrl.localStringValue = '';
            }
            // To check checkRequireNonnegativeInput customization argument
            // Value of numeric input interaction.
            let { checkRequireNonnegativeInput } = ctrl.uiConfig() || {};
            ctrl.checkRequireNonnegativeInputValue = (
            checkRequireNonnegativeInput === undefined ? false :
            checkRequireNonnegativeInput);
            // If customization argument of numeric input interaction is true
            // Set Min value as 0 to not let down key go below 0.
            ctrl.minValue = checkRequireNonnegativeInput && 0;
            // So that focus is applied after all the functions in
            // main thread have executed.
            $timeout(function() {
              FocusManagerService.setFocusWithoutScroll(labelForFocus);
            }, 50);
            // This prevents the red 'invalid input' warning message from
            // flashing at the outset.
            $timeout(function() {
              ctrl.hasLoaded = true;
            });
          };
        }
      ]
    };
  }]);
