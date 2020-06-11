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
    function(
      CurrentInteractionService, AlgebraicExpressionInputRulesService) {
      var ctrl = this;
      var guppyInstance;

      ctrl.assignIdToGuppyDiv = function() {
        // Dynamically assigns a unique id to the guppy-div
        var divId = 'guppy_' + Math.floor(Math.random() * 100000000);
        var allElements = document.querySelectorAll('.guppy-div');
        // Selecting the newest div, since there could be multiple divs active
        // at the same time, so we want to activate the latest one.
        var newestElement = allElements[allElements.length - 1];
        newestElement.setAttribute('id', divId);
        return divId;
      };

      ctrl.isCurrentAnswerValid = function() {
        return true;
      };

      ctrl.submitAnswer = function() {
        if (!ctrl.isCurrentAnswerValid()) {
          return;
        }
        var answer = guppyInstance.asciimath();
        CurrentInteractionService.onSubmit(
          answer, AlgebraicExpressionInputRulesService);
      };

      ctrl.$onInit = function() {
        var divId = ctrl.assignIdToGuppyDiv();
        guppyInstance = new Guppy(divId, {});
        guppyInstance.event('change', (e) => {
          ctrl.value = guppyInstance.asciimath();
        });
        CurrentInteractionService.registerCurrentInteraction(
          ctrl.submitAnswer, ctrl.isCurrentAnswerValid);
      };
    }
  ]
});
