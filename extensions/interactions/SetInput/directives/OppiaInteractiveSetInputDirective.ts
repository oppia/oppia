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
 * @fileoverview Directive for the SetInput interaction.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

require('domain/utilities/UrlInterpolationService.ts');
require('interactions/SetInput/directives/SetInputRulesService.ts');
require(
  'pages/exploration-player-page/services/current-interaction.service.ts');
require('services/contextual/WindowDimensionsService.ts');

angular.module('oppia').directive('oppiaInteractiveSetInput', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/interactions/SetInput/directives/' +
        'set_input_interaction_directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$attrs', '$translate', 'SetInputRulesService',
        'WindowDimensionsService', 'CurrentInteractionService',
        function(
            $attrs, $translate, SetInputRulesService,
            WindowDimensionsService, CurrentInteractionService) {
          var ctrl = this;
          ctrl.schema = {
            type: 'list',
            items: {
              type: 'unicode'
            },
            ui_config: {
              // TODO(mili): Translate this in the HTML.
              add_element_text: $translate.instant(
                'I18N_INTERACTIONS_SET_INPUT_ADD_ITEM')
            }
          };

          // Adds an input field by default
          ctrl.answer = [''];

          var hasDuplicates = function(answer) {
            for (var i = 0; i < answer.length; i++) {
              for (var j = 0; j < i; j++) {
                if (angular.equals(answer[i], answer[j])) {
                  return true;
                }
              }
            }
            return false;
          };

          var hasBlankOption = function(answer) {
            return answer.some(function(element) {
              return (element === '');
            });
          };

          ctrl.submitAnswer = function(answer) {
            if (hasDuplicates(answer)) {
              ctrl.errorMessage = (
                'I18N_INTERACTIONS_SET_INPUT_DUPLICATES_ERROR');
            } else {
              ctrl.errorMessage = '';
              CurrentInteractionService.onSubmit(
                answer, SetInputRulesService);
            }
          };

          ctrl.isAnswerValid = function() {
            return (ctrl.answer.length > 0 &&
              !hasBlankOption(ctrl.answer));
          };

          var submitAnswerFn = function() {
            ctrl.submitAnswer(ctrl.answer);
          };

          CurrentInteractionService.registerCurrentInteraction(
            submitAnswerFn, ctrl.isAnswerValid);
        }
      ]
    };
  }
]);
