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
require(
  'pages/exploration-player-page/services/current-interaction.service.ts');
require('services/guppy-configuration.service.ts');
require('services/guppy-initialization.service.ts');
require('services/math-interactions.service.ts');

angular.module('oppia').component('oppiaInteractiveNumericExpressionInput', {
  template: require('./numeric-expression-input-interaction.component.html'),
  controller: [
    '$scope', 'CurrentInteractionService', 'GuppyConfigurationService',
    'NumericExpressionInputRulesService', 'MathInteractionsService',
    'GuppyInitializationService',
    function(
        $scope, CurrentInteractionService, GuppyConfigurationService,
        NumericExpressionInputRulesService, MathInteractionsService,
        GuppyInitializationService) {
      const ctrl = this;
      ctrl.value = '';
      ctrl.hasBeenTouched = false;
      ctrl.warningText = '';

      ctrl.isCurrentAnswerValid = function() {
        if (ctrl.hasBeenTouched) {
          // Replacing abs symbol, '|x|', with text, 'abs(x)' since the symbol
          // is not compatible with nerdamer or with the backend validations.
          ctrl.value = MathInteractionsService.replaceAbsSymbolWithText(
            ctrl.value);
          let answerIsValid = MathInteractionsService.validateExpression(
            ctrl.value, false);
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

      ctrl.$onInit = function() {
        ctrl.hasBeenTouched = false;
        GuppyConfigurationService.init();
        GuppyInitializationService.init('guppy-div-learner');
        Guppy.event('change', () => {
          let activeGuppyObject = (
            GuppyInitializationService.findActiveGuppyObject());
          if (activeGuppyObject !== undefined) {
            ctrl.hasBeenTouched = true;
            ctrl.value = activeGuppyObject.guppyInstance.asciimath();
            // Need to manually trigger the digest cycle to make any 'watchers'
            // aware of changes in answer.
            $scope.$apply();
          }
        });

        CurrentInteractionService.registerCurrentInteraction(
          ctrl.submitAnswer, ctrl.isCurrentAnswerValid);
      };
    }
  ]
});
