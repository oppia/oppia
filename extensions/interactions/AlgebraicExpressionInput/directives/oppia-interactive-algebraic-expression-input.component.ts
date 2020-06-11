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
 * @fileoverview Component for the AlgebraicExpressionInput interaction.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

require(
  'interactions/AlgebraicExpressionInput/directives/' +
  'algebraic-expression-input-rules.service.ts');
require(
  'pages/exploration-player-page/services/current-interaction.service.ts');
require('../../../objects/templates/math-editor.component.ts');

angular.module('oppia').component('oppiaInteractiveAlgebraicExpressionInput', {
  template: require('./algebraic-expression-input-interaction.component.html'),
  controller: [
    'CurrentInteractionService', 'AlgebraicExpressionInputRulesService',
    function(CurrentInteractionService, AlgebraicExpressionInputRulesService) {
      const ctrl = this;

      ctrl.isCurrentAnswerValid = function() {
        return true;
      };

      ctrl.submitAnswer = function() {
        if (!ctrl.isCurrentAnswerValid()) {
          return;
        }
        CurrentInteractionService.onSubmit(
          ctrl.value, AlgebraicExpressionInputRulesService);
      };

      ctrl.$onInit = function() {
        CurrentInteractionService.registerCurrentInteraction(
          ctrl.submitAnswer, ctrl.isCurrentAnswerValid);
      };
    }
  ]
});
