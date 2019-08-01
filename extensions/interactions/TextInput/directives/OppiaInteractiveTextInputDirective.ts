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
 * @fileoverview Directive for the TextInput interaction.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

require('domain/utilities/UrlInterpolationService.ts');
require('interactions/TextInput/directives/TextInputRulesService.ts');
require(
  'pages/exploration-player-page/services/current-interaction.service.ts');
require('services/contextual/WindowDimensionsService.ts');
require('services/HtmlEscaperService.ts');
require('services/stateful/FocusManagerService.ts');

angular.module('oppia').directive('oppiaInteractiveTextInput', [
  'HtmlEscaperService', 'UrlInterpolationService',
  function(HtmlEscaperService, UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/interactions/TextInput/directives/' +
        'text_input_interaction_directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$attrs', 'FocusManagerService', 'TextInputRulesService',
        'WindowDimensionsService', 'CurrentInteractionService',
        function(
            $attrs, FocusManagerService, TextInputRulesService,
            WindowDimensionsService, CurrentInteractionService) {
          var ctrl = this;
          ctrl.placeholder = HtmlEscaperService.escapedJsonToObj(
            $attrs.placeholderWithValue);
          ctrl.rows = (
            HtmlEscaperService.escapedJsonToObj($attrs.rowsWithValue));
          ctrl.answer = '';
          ctrl.labelForFocusTarget = $attrs.labelForFocusTarget || null;

          ctrl.schema = {
            type: 'unicode',
            ui_config: {}
          };
          if (ctrl.placeholder) {
            ctrl.schema.ui_config.placeholder = ctrl.placeholder;
          }
          if (ctrl.rows && ctrl.rows !== 1) {
            ctrl.schema.ui_config.rows = ctrl.rows;
          }

          ctrl.submitAnswer = function(answer) {
            if (!answer) {
              return;
            }

            CurrentInteractionService.onSubmit(answer, TextInputRulesService);
          };

          var submitAnswerFn = function() {
            ctrl.submitAnswer(ctrl.answer);
          };

          var validityCheckFn = function() {
            return ctrl.answer.length > 0;
          };

          CurrentInteractionService.registerCurrentInteraction(
            submitAnswerFn, validityCheckFn);
        }
      ]
    };
  }
]);
