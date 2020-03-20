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
 * @fileoverview Directive for the MultipleChoiceInput interaction.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

require('domain/utilities/browser-checker.service.ts');
require(
  'pages/exploration-player-page/services/current-interaction.service.ts');
require(
  'interactions/MultipleChoiceInput/directives/' +
  'multiple-choice-input-rules.service.ts');
require('services/html-escaper.service.ts');

angular.module('oppia').directive('oppiaInteractiveMultipleChoiceInput', [
  'BrowserCheckerService', 'HtmlEscaperService',
  'MultipleChoiceInputRulesService',
  function(
      BrowserCheckerService, HtmlEscaperService,
      MultipleChoiceInputRulesService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      template: require('./multiple-choice-input-interaction.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$attrs', 'CurrentInteractionService',
        function($attrs, CurrentInteractionService) {
          var ctrl = this;

          ctrl.selectAnswer = function(event, answer) {
            if (answer === null) {
              return;
            }
            // Deselect previously selected option.
            var selectedElement = (
              document.querySelector(
                'button.multiple-choice-option.selected'));
            if (selectedElement) {
              selectedElement.classList.remove('selected');
            }
            // Selected current option.
            event.currentTarget.classList.add('selected');
            ctrl.answer = parseInt(answer, 10);
            if (!BrowserCheckerService.isMobileDevice()) {
              ctrl.submitAnswer();
            }
          };

          var validityCheckFn = function() {
            return ctrl.answer !== null;
          };

          ctrl.submitAnswer = function() {
            if (ctrl.answer === null) {
              return;
            }
            CurrentInteractionService.onSubmit(
              ctrl.answer, MultipleChoiceInputRulesService);
          };

          ctrl.$onInit = function() {
            ctrl.choices = HtmlEscaperService.escapedJsonToObj(
              $attrs.choicesWithValue);
            ctrl.answer = null;
            CurrentInteractionService.registerCurrentInteraction(
              ctrl.submitAnswer, validityCheckFn);
          };
        }
      ]
    };
  }
]);
