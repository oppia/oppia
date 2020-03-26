// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the FractionInput interaction.
 */

require('domain/objects/FractionObjectFactory.ts');
require(
  'interactions/FractionInput/directives/' +
  'fraction-input-rules.service.ts');
require(
  'pages/exploration-player-page/services/current-interaction.service.ts');
require('services/html-escaper.service.ts');
require('services/contextual/window-dimensions.service.ts');
require('services/stateful/focus-manager.service.ts');

require('domain/objects/objects-domain.constants.ajs.ts');

angular.module('oppia').directive('oppiaInteractiveFractionInput', [
  'HtmlEscaperService', function(HtmlEscaperService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      template: require('./fraction-input-interaction.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$scope', '$attrs', 'FocusManagerService', 'FractionInputRulesService',
        'FractionObjectFactory', 'FRACTION_PARSING_ERRORS',
        'WindowDimensionsService', 'CurrentInteractionService',
        function(
            $scope, $attrs, FocusManagerService, FractionInputRulesService,
            FractionObjectFactory, FRACTION_PARSING_ERRORS,
            WindowDimensionsService, CurrentInteractionService) {
          var ctrl = this;
          // Label for errors caused whilst parsing a fraction.
          var FORM_ERROR_TYPE = 'FRACTION_FORMAT_ERROR';
          var errorMessage = '';
          var requireSimplestForm = (
            $attrs.requireSimplestFormWithValue === 'true');
          var allowImproperFraction = (
            $attrs.allowImproperFractionWithValue === 'true');

          ctrl.getWarningText = function() {
            return errorMessage;
          };

          ctrl.submitAnswer = function(answer) {
            try {
              var fraction = FractionObjectFactory.fromRawInputString(
                answer);
              if (requireSimplestForm &&
                !angular.equals(fraction, fraction.convertToSimplestForm())
              ) {
                errorMessage = (
                  'Please enter an answer in simplest form ' +
                  '(e.g., 1/3 instead of 2/6).');
                ctrl.FractionInputForm.answer.$setValidity(
                  FORM_ERROR_TYPE, false);
              } else if (
                !allowImproperFraction && fraction.isImproperFraction()) {
                errorMessage = (
                  'Please enter an answer with a "proper" fractional part ' +
                  '(e.g., 1 2/3 instead of 5/3).');
                ctrl.FractionInputForm.answer.$setValidity(
                  FORM_ERROR_TYPE, false);
              } else if (
                !ctrl.allowNonzeroIntegerPart &&
                  fraction.hasNonzeroIntegerPart()) {
                errorMessage = (
                  'Please enter your answer as a fraction (e.g., 5/3 instead ' +
                  'of 1 2/3).');
                ctrl.FractionInputForm.answer.$setValidity(
                  FORM_ERROR_TYPE, false);
              } else {
                CurrentInteractionService.onSubmit(
                  fraction, FractionInputRulesService);
              }
            } catch (parsingError) {
              errorMessage = parsingError.message;
              ctrl.FractionInputForm.answer.$setValidity(
                FORM_ERROR_TYPE, false);
            }
          };

          ctrl.isAnswerValid = function() {
            if (ctrl.FractionInputForm === undefined) {
              return false;
            }
            return (!ctrl.FractionInputForm.$invalid && ctrl.answer !== '');
          };

          var submitAnswerFn = function() {
            ctrl.submitAnswer(ctrl.answer);
          };
          ctrl.$onInit = function() {
            /**
             * Disables the input box if the data entered is not a valid prefix
             * for a fraction.
             * Examples of valid prefixes:
             * -- 1
             * -- 1 2
             * -- 1 2/
             * -- 2/
             * -- 1 2/3
             */
            $scope.$watch('$ctrl.answer', function(newValue) {
              var INVALID_CHARS_REGEX = /[^\d\s\/-]/g;
              var INVALID_CHARS_LENGTH_REGEX = /\d{8,}/;
              // Accepts incomplete fraction inputs
              // (see examples above except last).
              var PARTIAL_FRACTION_REGEX =
                /^\s*(-?\s*((\d*\s*\d+\s*\/?\s*)|\d+)\s*)?$/;
              // Accepts complete fraction inputs.
              var FRACTION_REGEX =
                /^\s*-?\s*((\d*\s*\d+\s*\/\s*\d+)|\d+)\s*$/;
              if (INVALID_CHARS_LENGTH_REGEX.test(newValue)) {
                errorMessage = FRACTION_PARSING_ERRORS.INVALID_CHARS_LENGTH;
                ctrl.FractionInputForm.answer.$setValidity(
                  FORM_ERROR_TYPE, false);
              } else if (INVALID_CHARS_REGEX.test(newValue)) {
                errorMessage = FRACTION_PARSING_ERRORS.INVALID_CHARS;
                ctrl.FractionInputForm.answer.$setValidity(
                  FORM_ERROR_TYPE, false);
              } else if (!(FRACTION_REGEX.test(newValue) ||
                  PARTIAL_FRACTION_REGEX.test(newValue))) {
                errorMessage = FRACTION_PARSING_ERRORS.INVALID_FORMAT;
                ctrl.FractionInputForm.answer.$setValidity(
                  FORM_ERROR_TYPE, false);
              } else {
                errorMessage = '';
                ctrl.FractionInputForm.answer.$setValidity(
                  FORM_ERROR_TYPE, true);
              }
            });
            ctrl.answer = '';
            ctrl.labelForFocusTarget = $attrs.labelForFocusTarget || null;
            ctrl.allowNonzeroIntegerPart = (
              $attrs.allowNonzeroIntegerPartWithValue === 'true');
            ctrl.customPlaceholder = HtmlEscaperService.escapedJsonToObj(
              $attrs.customPlaceholderWithValue);

            ctrl.FRACTION_INPUT_FORM_SCHEMA = {
              type: 'unicode',
              ui_config: {}
            };

            CurrentInteractionService.registerCurrentInteraction(
              submitAnswerFn, ctrl.isAnswerValid);
          };
        }
      ]
    };
  }
]);
