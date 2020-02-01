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
 * @fileoverview Directive for the NumericInput interaction.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

require('interactions/NumericInput/directives/numeric-input-rules.service.ts');
require(
  'pages/exploration-player-page/services/current-interaction.service.ts');
require('services/contextual/window-dimensions.service.ts');
require('services/stateful/focus-manager.service.ts');

angular.module('oppia').directive('oppiaInteractiveNumericInput', [
  function() {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      template: require('./numeric-input-interaction.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$attrs', 'FocusManagerService', 'NumericInputRulesService',
        'WindowDimensionsService', 'CurrentInteractionService',
        function(
            $attrs, FocusManagerService, NumericInputRulesService,
            WindowDimensionsService, CurrentInteractionService) {
          var ctrl = this;
          var isAnswerValid = function() {
            return (
              ctrl.answer !== undefined &&
              ctrl.answer !== null && ctrl.answer !== '');
          };

          ctrl.submitAnswer = function(answer) {
            if (isAnswerValid()) {
              CurrentInteractionService.onSubmit(
                answer, NumericInputRulesService);
            }
          };

          var submitAnswerFn = function() {
            ctrl.submitAnswer(ctrl.answer);
          };
          ctrl.$onInit = function() {
            ctrl.answer = '';
            ctrl.labelForFocusTarget = $attrs.labelForFocusTarget || null;

            ctrl.NUMERIC_INPUT_FORM_SCHEMA = {
              type: 'float',
              ui_config: {}
            };

            CurrentInteractionService.registerCurrentInteraction(
              submitAnswerFn, isAnswerValid);
          };
        }
      ]
    };
  }
]);
