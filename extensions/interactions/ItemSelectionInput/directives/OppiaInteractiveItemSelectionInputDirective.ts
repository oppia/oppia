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
 * @fileoverview Directive for the ItemSelectionInput interaction.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

require('domain/utilities/UrlInterpolationService.ts');
require(
  'interactions/ItemSelectionInput/directives/' +
  'ItemSelectionInputRulesService.ts');
require(
  'pages/exploration-player-page/services/current-interaction.service.ts');
require('services/contextual/UrlService.ts');
require('services/contextual/WindowDimensionsService.ts');
require('services/HtmlEscaperService.ts');

angular.module('oppia').directive('oppiaInteractiveItemSelectionInput', [
  'HtmlEscaperService', 'ItemSelectionInputRulesService',
  'UrlInterpolationService', function(
      HtmlEscaperService, ItemSelectionInputRulesService,
      UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/interactions/ItemSelectionInput/directives/' +
        'item_selection_input_interaction_directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$attrs', 'WindowDimensionsService',
        'UrlService', 'CurrentInteractionService',
        function(
            $attrs, WindowDimensionsService,
            UrlService, CurrentInteractionService) {
          var ctrl = this;
          ctrl.choices = HtmlEscaperService.escapedJsonToObj(
            $attrs.choicesWithValue);
          ctrl.maxAllowableSelectionCount = (
            $attrs.maxAllowableSelectionCountWithValue);
          ctrl.minAllowableSelectionCount = (
            $attrs.minAllowableSelectionCountWithValue);

          // The following is an associative array where the key is a choice
          // (html) and the value is a boolean value indicating whether the
          // choice was selected by the user (default is false).
          ctrl.userSelections = {};

          for (var i = 0; i < ctrl.choices.length; i++) {
            ctrl.userSelections[ctrl.choices[i]] = false;
          }

          ctrl.displayCheckboxes = (ctrl.maxAllowableSelectionCount > 1);

          // The following indicates that the number of answers is more than
          // maxAllowableSelectionCount.
          ctrl.preventAdditionalSelections = false;

          // The following indicates that the number of answers is less than
          // minAllowableSelectionCount.
          ctrl.notEnoughSelections = (ctrl.minAllowableSelectionCount > 0);

          ctrl.onToggleCheckbox = function() {
            ctrl.newQuestion = false;
            ctrl.selectionCount = Object.keys(ctrl.userSelections).filter(
              function(obj) {
                return ctrl.userSelections[obj];
              }
            ).length;
            ctrl.preventAdditionalSelections = (
              ctrl.selectionCount >= ctrl.maxAllowableSelectionCount);
            ctrl.notEnoughSelections = (
              ctrl.selectionCount < ctrl.minAllowableSelectionCount);
          };

          ctrl.submitMultipleChoiceAnswer = function(index) {
            ctrl.userSelections[ctrl.choices[index]] = true;
            ctrl.submitAnswer(ctrl.userSelections);
          };

          ctrl.submitAnswer = function() {
            var answers = Object.keys(ctrl.userSelections).filter(
              function(obj) {
                return ctrl.userSelections[obj];
              }
            );

            CurrentInteractionService.onSubmit(
              answers, ItemSelectionInputRulesService);
          };

          var validityCheckFn = function() {
            return !ctrl.notEnoughSelections;
          };
          CurrentInteractionService.registerCurrentInteraction(
            ctrl.submitAnswer, validityCheckFn);
        }
      ]
    };
  }
]);
