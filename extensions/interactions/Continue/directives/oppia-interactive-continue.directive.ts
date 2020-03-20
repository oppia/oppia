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
 * @fileoverview Directive for the Continue button interaction.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

require('interactions/Continue/directives/continue-rules.service.ts');
require(
  'pages/exploration-player-page/services/current-interaction.service.ts');
require('services/context.service.ts');
require('services/html-escaper.service.ts');
require('services/contextual/window-dimensions.service.ts');

angular.module('oppia').directive('oppiaInteractiveContinue', [
  'ContinueRulesService', 'HtmlEscaperService',
  function(ContinueRulesService, HtmlEscaperService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      template: require('./continue-interaction.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$attrs', 'WindowDimensionsService',
        'CurrentInteractionService', 'ContextService',
        function(
            $attrs, WindowDimensionsService,
            CurrentInteractionService, ContextService) {
          var ctrl = this;
          var DEFAULT_BUTTON_TEXT = 'Continue';
          var DEFAULT_HUMAN_READABLE_ANSWER = 'Please continue.';
          ctrl.submitAnswer = function() {
            // We used to show "(Continue)" to indicate a 'continue' action when
            // the learner browses through the history of the exploration, but
            // this apparently can be mistaken for a button/control. The
            // following makes the learner's "answer" a bit more conversational,
            // as if they were chatting with Oppia.
            var humanReadableAnswer = DEFAULT_HUMAN_READABLE_ANSWER;
            if (ctrl.buttonText !== DEFAULT_BUTTON_TEXT) {
              humanReadableAnswer = ctrl.buttonText;
            }

            CurrentInteractionService.onSubmit(
              humanReadableAnswer, ContinueRulesService);
          };
          ctrl.$onInit = function() {
            ctrl.buttonText = HtmlEscaperService.escapedJsonToObj(
              $attrs.buttonTextWithValue);

            ctrl.isInEditorMode = ContextService.isInExplorationEditorMode();

            CurrentInteractionService.registerCurrentInteraction(
              ctrl.submitAnswer, null);
          };
        }
      ]
    };
  }
]);
