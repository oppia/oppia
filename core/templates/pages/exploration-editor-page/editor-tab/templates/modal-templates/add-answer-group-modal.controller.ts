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

import { EventBusGroup } from 'app-events/event-bus.service';
import { ObjectFormValidityChangeEvent } from 'app-events/app-events';

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');
require(
  'pages/exploration-editor-page/services/populate-rule-content-ids.service');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');
require('domain/exploration/OutcomeObjectFactory.ts');
require('domain/exploration/RuleObjectFactory.ts');
require('app-events/event-bus.service');
require(
  'pages/exploration-editor-page/services/editor-first-time-events.service.ts');
require('services/generate-content-id.service.ts');

angular.module('oppia').controller('AddAnswerGroupModalController', [
  '$controller', '$rootScope', '$scope', '$uibModalInstance',
  'EditorFirstTimeEventsService',
  'EventBusService', 'GenerateContentIdService', 'OutcomeObjectFactory',
  'PopulateRuleContentIdsService', 'RuleObjectFactory', 'StateEditorService',
  'addState', 'currentInteractionId', 'stateName', 'COMPONENT_NAME_FEEDBACK',
  'INTERACTION_SPECS',
  function(
      $controller, $rootScope, $scope, $uibModalInstance,
      EditorFirstTimeEventsService,
      EventBusService, GenerateContentIdService, OutcomeObjectFactory,
      PopulateRuleContentIdsService, RuleObjectFactory, StateEditorService,
      addState, currentInteractionId, stateName, COMPONENT_NAME_FEEDBACK,
      INTERACTION_SPECS) {
    $controller('ConfirmOrCancelModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance
    });
    const eventBusGroup: EventBusGroup = new EventBusGroup(EventBusService);
    $scope.modalId = Symbol();
    $scope.isInvalid = false;
    eventBusGroup.on(
      ObjectFormValidityChangeEvent,
      event => {
        if (event.message.modalId === $scope.modalId) {
          $scope.isInvalid = event.message.value;
          $scope.$applyAsync();
        }
      });
    $scope.feedbackEditorIsOpen = false;
    $scope.addState = addState;
    $scope.questionModeEnabled = (
      StateEditorService.isInQuestionMode());
    $scope.updateAnswerGroupFeedback = function(outcome) {
      $scope.openFeedbackEditor();
      $scope.tmpOutcome.feedback = outcome.feedback;
      // TODO(#8521): Remove the use of $rootScope.$apply()
      // once the controller is migrated to angular.
      $rootScope.$apply();
    };
    $scope.updateTaggedMisconception = function(
        taggedMisconception) {
      $scope.tmpTaggedSkillMisconceptionId = (
        `${taggedMisconception.skillId}-${
          taggedMisconception.misconceptionId}`);
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
    $scope.tmpRule = RuleObjectFactory.createNew(null, {}, {});
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

    // Remove this function once this controller is migrated to
    // Angular 2+.
    $scope.getChanges = function() {
      $rootScope.$apply();
    };

    $scope.isFeedbackLengthExceeded = function(tmpOutcome) {
      // TODO(#13764): Edit this check after appropriate limits are found.
      return (tmpOutcome.feedback._html.length > 10000);
    };

    $scope.addAnswerGroupForm = {};

    $scope.saveResponse = function(reopen) {
      PopulateRuleContentIdsService.populateNullRuleContentIds($scope.tmpRule);
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

      $scope.$on('$destroy', function() {
        eventBusGroup.unsubscribe();
      });
    };
  }
]);
