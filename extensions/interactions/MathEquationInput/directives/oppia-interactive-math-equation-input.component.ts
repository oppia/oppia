// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the MathEquationInput interaction.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

require(
  'interactions/MathEquationInput/directives/' +
  'math-equation-input-rules.service.ts');
require(
  'pages/exploration-player-page/services/current-interaction.service.ts');
require('services/contextual/device-info.service.ts');
require('services/guppy-configuration.service.ts');
require('services/guppy-initialization.service.ts');
require('services/html-escaper.service.ts');
require('services/math-interactions.service.ts');

angular.module('oppia').component('oppiaInteractiveMathEquationInput', {
  template: require('./math-equation-input-interaction.component.html'),
  bindings: {
    savedSolution: '<'
  },
  controller: [
    '$attrs', '$scope', 'CurrentInteractionService', 'DeviceInfoService',
    'GuppyConfigurationService', 'GuppyInitializationService',
    'HtmlEscaperService', 'MathEquationInputRulesService',
    'MathInteractionsService', 'MATH_INTERACTION_PLACEHOLDERS',
    function(
        $attrs, $scope, CurrentInteractionService, DeviceInfoService,
        GuppyConfigurationService, GuppyInitializationService,
        HtmlEscaperService, MathEquationInputRulesService,
        MathInteractionsService, MATH_INTERACTION_PLACEHOLDERS) {
      const ctrl = this;
      ctrl.value = '';
      ctrl.hasBeenTouched = false;
      ctrl.warningText = '';

      ctrl.isCurrentAnswerValid = function() {
        let activeGuppyObject = (
          GuppyInitializationService.findActiveGuppyObject());
        if (ctrl.hasBeenTouched && activeGuppyObject === undefined) {
          // Replacing abs symbol, '|x|', with text, 'abs(x)' since the symbol
          // is not compatible with nerdamer or with the backend validations.
          ctrl.value = MathInteractionsService.replaceAbsSymbolWithText(
            ctrl.value);
          let answerIsValid = MathInteractionsService.validateEquation(
            ctrl.value, GuppyInitializationService.getCustomOskLetters());
          ctrl.warningText = MathInteractionsService.getWarningText();
          return answerIsValid;
        }
        ctrl.warningText = '';
        return true;
      };

      ctrl.submitAnswer = function() {
        if (!ctrl.isCurrentAnswerValid()) {
          return;
        }
        CurrentInteractionService.onSubmit(
          ctrl.value, MathEquationInputRulesService);
      };

      ctrl.showOSK = function() {
        GuppyInitializationService.setShowOSK(true);
        GuppyInitializationService.interactionType = 'MathEquationInput';
      };

      ctrl.$onInit = function() {
        ctrl.hasBeenTouched = false;
        GuppyConfigurationService.init();
        GuppyConfigurationService.changeDivSymbol(
          JSON.parse($attrs.useFractionForDivisionWithValue || 'false'));
        GuppyInitializationService.init(
          'guppy-div-learner',
          MATH_INTERACTION_PLACEHOLDERS.MathEquationInput,
          ctrl.savedSolution !== undefined ? ctrl.savedSolution : ''
        );
        GuppyInitializationService.setCustomOskLetters(
          HtmlEscaperService.escapedJsonToObj(
            $attrs.customOskLettersWithValue));
        let eventType = (
          DeviceInfoService.isMobileUserAgent() &&
          DeviceInfoService.hasTouchEvents()) ? 'focus' : 'change';
        // We need the 'focus' event while using the on screen keyboard (only
        // for touch-based devices) to capture input from user and the 'change'
        // event while using the normal keyboard.
        Guppy.event(eventType, () => {
          var activeGuppyObject = (
            GuppyInitializationService.findActiveGuppyObject());
          if (activeGuppyObject !== undefined) {
            ctrl.hasBeenTouched = true;
            ctrl.value = activeGuppyObject.guppyInstance.asciimath();
            if (eventType === 'change') {
              // Need to manually trigger the digest cycle to make any
              // 'watchers' aware of changes in answer.
              $scope.$apply();
            }
          }
        });

        CurrentInteractionService.registerCurrentInteraction(
          ctrl.submitAnswer, ctrl.isCurrentAnswerValid);
      };
    }
  ]
});
