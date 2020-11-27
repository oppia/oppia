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
 * @fileoverview Controller for add answer group modal.
 */

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');

require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');
require('domain/exploration/OutcomeObjectFactory.ts');
require('domain/exploration/RuleObjectFactory.ts');
require(
  'pages/exploration-editor-page/services/editor-first-time-events.service.ts');
require('services/generate-content-id.service.ts');

angular.module('oppia').controller('AddAnswerGroupModalController', [
  '$controller', '$scope', '$uibModalInstance', 'EditorFirstTimeEventsService',
  'GenerateContentIdService', 'OutcomeObjectFactory', 'RuleObjectFactory',
  'StateEditorService', 'addState', 'currentInteractionId',
  'stateName', 'COMPONENT_NAME_FEEDBACK', 'COMPONENT_NAME_RULE_INPUTS',
  'INTERACTION_SPECS',
  function(
      $controller, $scope, $uibModalInstance, EditorFirstTimeEventsService,
      GenerateContentIdService, OutcomeObjectFactory, RuleObjectFactory,
      StateEditorService, addState, currentInteractionId,
      stateName, COMPONENT_NAME_FEEDBACK, COMPONENT_NAME_RULE_INPUTS,
      INTERACTION_SPECS) {
    $controller('ConfirmOrCancelModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance
    });
    $scope.feedbackEditorIsOpen = false;
    $scope.addState = addState;
    $scope.questionModeEnabled = (
      StateEditorService.isInQuestionMode());
    $scope.updateAnswerGroupFeedback = function(outcome) {
      $scope.openFeedbackEditor();
      $scope.tmpOutcome.feedback = outcome.feedback;
    };
    $scope.updateTaggedMisconception = function(
        misconceptionId, skillId) {
      $scope.tmpTaggedSkillMisconceptionId = (
        `${skillId}-${misconceptionId}`);
    };
    $scope.openFeedbackEditor = function() {
      $scope.feedbackEditorIsOpen = true;
    };
    $scope.isCorrectnessFeedbackEnabled = function() {
      return StateEditorService.getCorrectnessFeedbackEnabled();
    };
    // This returns false if the current interaction ID is null.
    $scope.isCurrentInteractionLinear = function() {
      return (
        currentInteractionId &&
        INTERACTION_SPECS[currentInteractionId].is_linear);
    };
    $scope.tmpRule = RuleObjectFactory.createNew(null, {});
    var feedbackContentId = GenerateContentIdService.getNextStateId(
      COMPONENT_NAME_FEEDBACK);
    $scope.tmpOutcome = OutcomeObjectFactory.createNew(
      $scope.questionModeEnabled ? null : stateName,
      feedbackContentId, '', []);
    $scope.tmpTaggedSkillMisconceptionId = null;

    $scope.isSelfLoopWithNoFeedback = function(tmpOutcome) {
      return (
        tmpOutcome.dest ===
        stateName && !tmpOutcome.hasNonemptyFeedback());
    };

    $scope.addAnswerGroupForm = {};

    $scope.populateRuleContentIds = function() {
      const inputTypes = $scope.tmpRule.inputTypes;
      const inputs = $scope.tmpRule.inputs;

      if ($scope.tmpRule.type === null) {
        return;
      }

      Object.keys(inputTypes).forEach(inputName => {
        const hasContentId = (
          inputTypes[inputName] === 'SubtitledSetOfNormalizedString' ||
          inputTypes[inputName] === 'SubtitledSetOfUnicodeString'
        );
        if (!hasContentId) {
          return;
        }
        const needsContentId = inputs[inputName].getContentId() === null;

        if (needsContentId) {
          inputs[inputName].setContentId(
            GenerateContentIdService.getNextStateId(
              `${COMPONENT_NAME_RULE_INPUTS}_${$scope.tmpRule.type}`
            ));
        }
      });
    };

    $scope.saveResponse = function(reopen) {
      $scope.populateRuleContentIds();
      StateEditorService.onSaveOutcomeDestDetails.emit();

      EditorFirstTimeEventsService.registerFirstSaveRuleEvent();
      // Close the modal and save it afterwards.
      $uibModalInstance.close({
        tmpRule: angular.copy($scope.tmpRule),
        tmpOutcome: angular.copy($scope.tmpOutcome),
        tmpTaggedSkillMisconceptionId: (
          $scope.tmpOutcome.labelledAsCorrect ? null : (
            $scope.tmpTaggedSkillMisconceptionId)),
        reopen: reopen
      });
    };
  }
]);
