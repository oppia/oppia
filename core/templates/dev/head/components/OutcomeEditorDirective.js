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

oppia.directive('outcomeEditor', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        isEditable: '&isEditable',
        displayFeedback: '=',
        getOnSaveDestFn: '&onSaveDest',
        getOnSaveFeedbackFn: '&onSaveFeedback',
        getOnSaveCorrectnessLabelFn: '&onSaveCorrectnessLabel',
        outcome: '=outcome',
        onSaveContentIdsToAudioTranslations: '=',
        areWarningsSuppressed: '&warningsAreSuppressed',
        addState: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/outcome_editor_directive.html'),
      controller: [
        '$scope', '$uibModal', 'StateEditorService',
        'StateContentIdsToAudioTranslationsService',
        'StateInteractionIdService', 'INTERACTION_SPECS',
        function(
            $scope, $uibModal, StateEditorService,
            StateContentIdsToAudioTranslationsService,
            StateInteractionIdService, INTERACTION_SPECS) {
          $scope.editOutcomeForm = {};
          $scope.isInQuestionMode = StateEditorService.isInQuestionMode;
          $scope.canAddPrerequisiteSkill = constants.ENABLE_NEW_STRUCTURES;
          $scope.feedbackEditorIsOpen = false;
          $scope.destinationEditorIsOpen = false;
          $scope.correctnessLabelEditorIsOpen = false;
          // TODO(sll): Investigate whether this line can be removed, due to
          // $scope.savedOutcome now being set in onExternalSave().
          $scope.savedOutcome = angular.copy($scope.outcome);

          $scope.getCurrentInteractionId = function() {
            return StateInteractionIdService.savedMemento;
          };

          $scope.isCorrectnessFeedbackEnabled = function() {
            return StateEditorService.getCorrectnessFeedbackEnabled();
          };

          // This returns false if the current interaction ID is null.
          $scope.isCurrentInteractionLinear = function() {
            var interactionId = $scope.getCurrentInteractionId();
            return interactionId && INTERACTION_SPECS[interactionId].is_linear;
          };

          var openMarkAllAudioAsNeedingUpdateModal = function() {
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/components/forms/' +
                'mark_all_audio_as_needing_update_modal_directive.html'),
              backdrop: true,
              resolve: {},
              controller: 'MarkAllAudioAsNeedingUpdateController'
            }).result.then(function() {
              var feedbackContentId = $scope.outcome.feedback.getContentId();
              StateContentIdsToAudioTranslationsService.displayed
                .markAllAudioAsNeedingUpdate(feedbackContentId);
              StateContentIdsToAudioTranslationsService.saveDisplayedValue();
              $scope.onSaveContentIdsToAudioTranslations(
                StateContentIdsToAudioTranslationsService.displayed);
            });
          };

          var onExternalSave = function() {
            // The reason for this guard is because, when the editor page for an
            // exploration is first opened, the 'initializeAnswerGroups' event
            // (which fires an 'externalSave' event) only fires after the
            // $scope.savedOutcome is set above. Until then, $scope.savedOutcome
            // is undefined.
            if ($scope.savedOutcome === undefined) {
              $scope.savedOutcome = angular.copy($scope.outcome);
            }

            if ($scope.feedbackEditorIsOpen) {
              if ($scope.editOutcomeForm.editFeedbackForm.$valid &&
                  !$scope.invalidStateAfterFeedbackSave()) {
                $scope.saveThisFeedback(false);
              } else {
                $scope.cancelThisFeedbackEdit();
              }
            }

            if ($scope.destinationEditorIsOpen) {
              if ($scope.editOutcomeForm.editDestForm.$valid &&
                  !$scope.invalidStateAfterDestinationSave()) {
                $scope.saveThisDestination();
              } else {
                $scope.cancelThisDestinationEdit();
              }
            }
          };

          $scope.$on('externalSave', function() {
            onExternalSave();
          });

          $scope.$on('onInteractionIdChanged', function() {
            onExternalSave();
          });

          $scope.isSelfLoop = function(outcome) {
            return (
              outcome &&
              outcome.dest === StateEditorService.getActiveStateName());
          };

          $scope.getCurrentInteractionId = function() {
            return StateInteractionIdService.savedMemento;
          };

          $scope.isSelfLoopWithNoFeedback = function(outcome) {
            if (!outcome) {
              return false;
            }
            return $scope.isSelfLoop(outcome) &&
              !outcome.hasNonemptyFeedback();
          };

          $scope.invalidStateAfterFeedbackSave = function() {
            var tmpOutcome = angular.copy($scope.savedOutcome);
            tmpOutcome.feedback = angular.copy($scope.outcome.feedback);
            return $scope.isSelfLoopWithNoFeedback(tmpOutcome);
          };
          $scope.invalidStateAfterDestinationSave = function() {
            var tmpOutcome = angular.copy($scope.savedOutcome);
            tmpOutcome.dest = angular.copy($scope.outcome.dest);
            return $scope.isSelfLoopWithNoFeedback(tmpOutcome);
          };
          $scope.openFeedbackEditor = function() {
            if ($scope.isEditable()) {
              $scope.feedbackEditorIsOpen = true;
            }
          };

          $scope.openDestinationEditor = function() {
            if ($scope.isEditable()) {
              $scope.destinationEditorIsOpen = true;
            }
          };

          $scope.saveThisFeedback = function(fromClickSaveFeedbackButton) {
            $scope.$broadcast('saveOutcomeFeedbackDetails');
            $scope.feedbackEditorIsOpen = false;
            var contentHasChanged = (
              $scope.savedOutcome.feedback.getHtml() !==
              $scope.outcome.feedback.getHtml());
            $scope.savedOutcome.feedback = angular.copy(
              $scope.outcome.feedback);
            var feedbackContentId = $scope.savedOutcome.feedback.getContentId();
            if (StateContentIdsToAudioTranslationsService.displayed
              .hasUnflaggedAudioTranslations(feedbackContentId) &&
              fromClickSaveFeedbackButton && contentHasChanged) {
              openMarkAllAudioAsNeedingUpdateModal();
            }
            $scope.getOnSaveFeedbackFn()($scope.savedOutcome);
          };

          $scope.saveThisDestination = function() {
            $scope.$broadcast('saveOutcomeDestDetails');
            $scope.destinationEditorIsOpen = false;
            $scope.savedOutcome.dest = angular.copy($scope.outcome.dest);
            if (!$scope.isSelfLoop($scope.outcome)) {
              $scope.outcome.refresherExplorationId = null;
            }
            $scope.savedOutcome.refresherExplorationId = (
              $scope.outcome.refresherExplorationId);
            $scope.savedOutcome.missingPrerequisiteSkillId =
              $scope.outcome.missingPrerequisiteSkillId;

            $scope.getOnSaveDestFn()($scope.savedOutcome);
          };

          $scope.onChangeCorrectnessLabel = function() {
            $scope.savedOutcome.labelledAsCorrect = (
              $scope.outcome.labelledAsCorrect);

            $scope.getOnSaveCorrectnessLabelFn()($scope.savedOutcome);
          };

          $scope.cancelThisFeedbackEdit = function() {
            $scope.outcome.feedback = angular.copy(
              $scope.savedOutcome.feedback);
            $scope.feedbackEditorIsOpen = false;
          };

          $scope.cancelThisDestinationEdit = function() {
            $scope.outcome.dest = angular.copy($scope.savedOutcome.dest);
            $scope.outcome.refresherExplorationId = (
              $scope.savedOutcome.refresherExplorationId);
            $scope.outcome.missingPrerequisiteSkillId =
              $scope.savedOutcome.missingPrerequisiteSkillId;
            $scope.destinationEditorIsOpen = false;
          };
        }
      ]
    };
  }]);
