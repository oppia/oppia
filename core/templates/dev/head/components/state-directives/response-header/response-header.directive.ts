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
 * @fileoverview Directive for the header of the response tiles.
 */

require('domain/utilities/url-interpolation.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-property.service.ts');
require('services/editability.service.ts');

angular.module('oppia').directive('responseHeader', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        getIndex: '&index',
        getOutcome: '&outcome',
        getSummary: '&summary',
        getShortSummary: '&shortSummary',
        isActive: '&isActive',
        getOnDeleteFn: '&onDeleteFn',
        getNumRules: '&numRules',
        isResponse: '&isResponse',
        showWarning: '&showWarning',
        navigateToState: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/state-directives/response-header/' +
        'response-header.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        'EditabilityService', 'StateEditorService',
        'PLACEHOLDER_OUTCOME_DEST',
        'StateInteractionIdService', 'INTERACTION_SPECS',
        function(
            EditabilityService, StateEditorService,
            PLACEHOLDER_OUTCOME_DEST,
            StateInteractionIdService, INTERACTION_SPECS) {
          var ctrl = this;
          ctrl.EditabilityService = EditabilityService;

          ctrl.isInQuestionMode = function() {
            return StateEditorService.isInQuestionMode();
          };

          ctrl.getCurrentInteractionId = function() {
            return StateInteractionIdService.savedMemento;
          };

          ctrl.isCorrectnessFeedbackEnabled = function() {
            return StateEditorService.getCorrectnessFeedbackEnabled();
          };
          // This returns false if the current interaction ID is null.
          ctrl.isCurrentInteractionLinear = function() {
            var interactionId = ctrl.getCurrentInteractionId();
            return interactionId && INTERACTION_SPECS[interactionId].is_linear;
          };

          ctrl.isCorrect = function() {
            return ctrl.getOutcome() && ctrl.getOutcome().labelledAsCorrect;
          };

          ctrl.isOutcomeLooping = function() {
            var outcome = ctrl.getOutcome();
            var activeStateName = StateEditorService.getActiveStateName();
            return outcome && (outcome.dest === activeStateName);
          };

          ctrl.isCreatingNewState = function() {
            var outcome = ctrl.getOutcome();
            return outcome && outcome.dest === PLACEHOLDER_OUTCOME_DEST;
          };

          ctrl.deleteResponse = function(evt) {
            ctrl.getOnDeleteFn()(ctrl.getIndex(), evt);
          };
        }
      ]
    };
  }]);
