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

var nerdamer = require('nerdamer');

angular.module('oppia').component('oppiaInteractiveAlgebraicExpressionInput', {
  template: require('./algebraic-expression-input-interaction.component.html'),
  controller: [
    '$scope', 'CurrentInteractionService',
    'AlgebraicExpressionInputRulesService',
    function(
        $scope, CurrentInteractionService,
        AlgebraicExpressionInputRulesService) {
      const ctrl = this;
      ctrl.value = '';
      ctrl.hasBeenTouched = false;
      ctrl.warningText = '';

      ctrl.initializeGuppy = function() {
        var guppyDivs = document.querySelectorAll('.guppy-div-learner');
        var divId, guppyInstance;
        ctrl.hasBeenTouched = false;
        for (var i = 0; i < guppyDivs.length; i++) {
          divId = 'guppy_' + Math.floor(Math.random() * 100000000);
          // Dynamically assigns a unique id to the guppy div.
          guppyDivs[i].setAttribute('id', divId);
          // Create a new guppy instance for that div.
          guppyInstance = new Guppy(divId, {});
          guppyInstance.event('change', (e) => {
            ctrl.value = guppyInstance.asciimath();
            ctrl.hasBeenTouched = true;
            // Need to manually trigger the digest cycle
            // to make any 'watchers' aware of changes in ctrl.value.
            $scope.$apply();
          });
        }
      };

      var cleanErrorMessage = function(errorMessage) {
        var colonIndex = errorMessage.indexOf(':');
        if (colonIndex !== -1) {
          errorMessage = errorMessage.slice(0, colonIndex);
        }
        var atColonIndex = errorMessage.indexOf(' at ');
        if (atColonIndex !== -1) {
          errorMessage = errorMessage.slice(0, atColonIndex);
        }
        if (errorMessage[errorMessage.length - 1] !== '.') {
          errorMessage += '.';
        }
        return errorMessage;
      };

      ctrl.isCurrentAnswerValid = function() {
        if (ctrl.hasBeenTouched) {
          try {
            var containsVariables = nerdamer(ctrl.value).variables().length > 0;
            if (ctrl.value.length === 0) {
              throw new Error('Please enter a non-empty answer.');
            } else if (ctrl.value.indexOf('=') !== -1 || ctrl.value.indexOf(
              '<') !== -1 || ctrl.value.indexOf('>') !== -1) {
              throw new Error('It looks like you have entered an ' +
                'equation/inequality. Please enter an algebraic ' +
                'expression instead.');
            } else if (!containsVariables) {
              throw new Error('It looks like you have entered only ' +
                'numbers. Make sure to include the necessary variables' +
                ' mentioned in the question.');
            }
          } catch (err) {
            ctrl.warningText = cleanErrorMessage(err.message);
            return false;
          }
        }
        ctrl.warningText = '';
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
        ctrl.initializeGuppy();
        CurrentInteractionService.registerCurrentInteraction(
          ctrl.submitAnswer, ctrl.isCurrentAnswerValid);
      };
    }
  ]
});
