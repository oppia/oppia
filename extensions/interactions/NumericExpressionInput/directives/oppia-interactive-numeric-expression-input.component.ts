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
 * @fileoverview Component for the NumericExpressionInput interaction.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

require(
  'interactions/NumericExpressionInput/directives/' +
  'numeric-expression-input-rules.service.ts');
require('interactions/interaction-attributes-extractor.service.ts');
require(
  'pages/exploration-player-page/services/current-interaction.service.ts');
require('services/contextual/device-info.service.ts');
require('services/guppy-configuration.service.ts');
require('services/guppy-initialization.service.ts');
require('services/math-interactions.service.ts');

angular.module('oppia').component('oppiaInteractiveNumericExpressionInput', {
  template: require('./numeric-expression-input-interaction.component.html'),
  bindings: {
    savedSolution: '<'
  },
  controller: [
    '$attrs', '$scope', 'CurrentInteractionService', 'DeviceInfoService',
    'GuppyConfigurationService', 'GuppyInitializationService',
    'InteractionAttributesExtractorService', 'MathInteractionsService',
    'NumericExpressionInputRulesService',
    function(
        $attrs, $scope, CurrentInteractionService, DeviceInfoService,
        GuppyConfigurationService, GuppyInitializationService,
        InteractionAttributesExtractorService, MathInteractionsService,
        NumericExpressionInputRulesService) {
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
          let answerIsValid = MathInteractionsService.validateNumericExpression(
            ctrl.value);
          if (answerIsValid) {
            // Explicitly inserting '*' signs wherever necessary.
            ctrl.value = MathInteractionsService.insertMultiplicationSigns(
              ctrl.value);
          }
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
          ctrl.value, NumericExpressionInputRulesService);
      };

      ctrl.showOSK = function() {
        GuppyInitializationService.setShowOSK(true);
        GuppyInitializationService.interactionType = 'NumericExpressionInput';
      };

      ctrl.$onInit = function() {
        ctrl.hasBeenTouched = false;
        GuppyConfigurationService.init();
        const { useFractionForDivision, placeholder } = (
          InteractionAttributesExtractorService.getValuesFromAttributes(
            'NumericExpressionInput', $attrs));
        // This represents a list of special characters in LaTeX. These
        // characters have a special meaning in LaTeX and thus need to be
        // escaped.
        const escapeCharacters = [
          '&', '%', '$', '#', '_', '{', '}', '~', '^', '\\'];
        for (var i = 0; i < placeholder.unicode.length; i++) {
          if (escapeCharacters.includes(placeholder.unicode[i])) {
            let newPlaceholder = `\\verb|${placeholder.unicode}|`;
            placeholder.unicode = newPlaceholder;
            break;
          }
        }
        GuppyConfigurationService.changeDivSymbol(useFractionForDivision);
        GuppyInitializationService.init(
          'guppy-div-learner',
          placeholder.unicode,
          ctrl.savedSolution !== undefined ?
          ctrl.savedSolution : ''
        );
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
