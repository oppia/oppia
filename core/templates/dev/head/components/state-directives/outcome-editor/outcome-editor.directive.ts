// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directives for the outcome editor.
 */

require(
  'components/state-directives/outcome-editor/' +
  'outcome-destination-editor.directive.ts');
require('components/state-directives/outcome-editor/' +
  'outcome-feedback-editor.directive.ts');
require('directives/angular-html-bind.directive.ts');

require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-property.service.ts');
require('domain/utilities/url-interpolation.service.ts');

angular.module('oppia').directive('outcomeEditor', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        isEditable: '&isEditable',
        displayFeedback: '=',
        getOnSaveDestFn: '&onSaveDest',
        getOnSaveFeedbackFn: '&onSaveFeedback',
        getOnSaveCorrectnessLabelFn: '&onSaveCorrectnessLabel',
        outcome: '=outcome',
        areWarningsSuppressed: '&warningsAreSuppressed',
        addState: '=',
        showMarkAllAudioAsNeedingUpdateModalIfRequired: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/state-directives/outcome-editor/' +
        'outcome-editor.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$scope', 'StateEditorService', 'StateInteractionIdService',
        'ENABLE_PREREQUISITE_SKILLS', 'INTERACTION_SPECS',
        function(
            $scope, StateEditorService, StateInteractionIdService,
            ENABLE_PREREQUISITE_SKILLS, INTERACTION_SPECS) {
          var ctrl = this;
          ctrl.editOutcomeForm = {};
          ctrl.isInQuestionMode = function() {
            return StateEditorService.isInQuestionMode();
          };
          ctrl.canAddPrerequisiteSkill = (
            ENABLE_PREREQUISITE_SKILLS &&
            StateEditorService.isExplorationWhitelisted());
          ctrl.feedbackEditorIsOpen = false;
          ctrl.destinationEditorIsOpen = false;
          ctrl.correctnessLabelEditorIsOpen = false;
          // TODO(sll): Investigate whether this line can be removed, due to
          // ctrl.savedOutcome now being set in onExternalSave().
          ctrl.savedOutcome = angular.copy(ctrl.outcome);

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

          var onExternalSave = function() {
            // The reason for this guard is because, when the editor page for an
            // exploration is first opened, the 'initializeAnswerGroups' event
            // (which fires an 'externalSave' event) only fires after the
            // ctrl.savedOutcome is set above. Until then, ctrl.savedOutcome
            // is undefined.
            if (ctrl.savedOutcome === undefined) {
              ctrl.savedOutcome = angular.copy(ctrl.outcome);
            }

            if (ctrl.feedbackEditorIsOpen) {
              if (ctrl.editOutcomeForm.editFeedbackForm.$valid &&
                  !ctrl.invalidStateAfterFeedbackSave()) {
                ctrl.saveThisFeedback(false);
              } else {
                ctrl.cancelThisFeedbackEdit();
              }
            }

            if (ctrl.destinationEditorIsOpen) {
              if (ctrl.editOutcomeForm.editDestForm.$valid &&
                  !ctrl.invalidStateAfterDestinationSave()) {
                ctrl.saveThisDestination();
              } else {
                ctrl.cancelThisDestinationEdit();
              }
            }
          };

          $scope.$on('externalSave', function() {
            onExternalSave();
          });

          $scope.$on('onInteractionIdChanged', function() {
            onExternalSave();
          });

          ctrl.isSelfLoop = function(outcome) {
            return (
              outcome &&
              outcome.dest === StateEditorService.getActiveStateName());
          };

          ctrl.getCurrentInteractionId = function() {
            return StateInteractionIdService.savedMemento;
          };

          ctrl.isSelfLoopWithNoFeedback = function(outcome) {
            if (outcome && typeof outcome === 'object' &&
              outcome.constructor.name === 'Outcome') {
              return ctrl.isSelfLoop(outcome) &&
                !outcome.hasNonemptyFeedback();
            }
            return false;
          };

          ctrl.invalidStateAfterFeedbackSave = function() {
            var tmpOutcome = angular.copy(ctrl.savedOutcome);
            tmpOutcome.feedback = angular.copy(ctrl.outcome.feedback);
            return ctrl.isSelfLoopWithNoFeedback(tmpOutcome);
          };
          ctrl.invalidStateAfterDestinationSave = function() {
            var tmpOutcome = angular.copy(ctrl.savedOutcome);
            tmpOutcome.dest = angular.copy(ctrl.outcome.dest);
            return ctrl.isSelfLoopWithNoFeedback(tmpOutcome);
          };
          ctrl.openFeedbackEditor = function() {
            if (ctrl.isEditable()) {
              ctrl.feedbackEditorIsOpen = true;
            }
          };

          ctrl.openDestinationEditor = function() {
            if (ctrl.isEditable()) {
              ctrl.destinationEditorIsOpen = true;
            }
          };

          ctrl.saveThisFeedback = function(fromClickSaveFeedbackButton) {
            $scope.$broadcast('saveOutcomeFeedbackDetails');
            ctrl.feedbackEditorIsOpen = false;
            var contentHasChanged = (
              ctrl.savedOutcome.feedback.getHtml() !==
              ctrl.outcome.feedback.getHtml());
            ctrl.savedOutcome.feedback = angular.copy(
              ctrl.outcome.feedback);

            if (StateEditorService.isInQuestionMode()) {
              ctrl.savedOutcome.dest = null;
            } else if (ctrl.savedOutcome.dest === ctrl.outcome.dest) {
              // If the stateName has changed and previously saved
              // destination points to the older name, update it to
              // the active state name.
              ctrl.savedOutcome.dest = StateEditorService.getActiveStateName();
            }
            var feedbackContentId = ctrl.savedOutcome.feedback.getContentId();
            if (fromClickSaveFeedbackButton && contentHasChanged) {
              var contentId = ctrl.savedOutcome.feedback.getContentId();
              ctrl.showMarkAllAudioAsNeedingUpdateModalIfRequired(contentId);
            }
            ctrl.getOnSaveFeedbackFn()(ctrl.savedOutcome);
          };

          ctrl.saveThisDestination = function() {
            $scope.$broadcast('saveOutcomeDestDetails');
            ctrl.destinationEditorIsOpen = false;
            ctrl.savedOutcome.dest = angular.copy(ctrl.outcome.dest);
            if (!ctrl.isSelfLoop(ctrl.outcome)) {
              ctrl.outcome.refresherExplorationId = null;
            }
            ctrl.savedOutcome.refresherExplorationId = (
              ctrl.outcome.refresherExplorationId);
            ctrl.savedOutcome.missingPrerequisiteSkillId =
              ctrl.outcome.missingPrerequisiteSkillId;

            ctrl.getOnSaveDestFn()(ctrl.savedOutcome);
          };

          ctrl.onChangeCorrectnessLabel = function() {
            ctrl.savedOutcome.labelledAsCorrect = (
              ctrl.outcome.labelledAsCorrect);

            ctrl.getOnSaveCorrectnessLabelFn()(ctrl.savedOutcome);
          };

          ctrl.cancelThisFeedbackEdit = function() {
            ctrl.outcome.feedback = angular.copy(
              ctrl.savedOutcome.feedback);
            ctrl.feedbackEditorIsOpen = false;
          };

          ctrl.cancelThisDestinationEdit = function() {
            ctrl.outcome.dest = angular.copy(ctrl.savedOutcome.dest);
            ctrl.outcome.refresherExplorationId = (
              ctrl.savedOutcome.refresherExplorationId);
            ctrl.outcome.missingPrerequisiteSkillId =
              ctrl.savedOutcome.missingPrerequisiteSkillId;
            ctrl.destinationEditorIsOpen = false;
          };
        }
      ]
    };
  }]);
