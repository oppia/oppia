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
 * @fileoverview Component for the state graph visualization.
 */

import { TeachOppiaModalComponent } from '../templates/modal-templates/teach-oppia-modal.component';
require(
  'components/common-layout-directives/common-elements/' +
  'loading-dots.component.ts');
require('domain/utilities/url-interpolation.service.ts');
require('pages/exploration-editor-page/services/exploration-rights.service.ts');
require('pages/exploration-editor-page/services/exploration-states.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-interaction-id.service');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-property.service.ts');
require('filters/truncate-input-based-on-interaction-answer-type.filter.ts');
require('services/editability.service.ts');
require('services/improvements.service.ts');
require('services/state-top-answers-stats.service.ts');
require('services/external-save.service.ts');
require('services/ngb-modal.service.ts');
require(
  'pages/exploration-editor-page/exploration-editor-page.constants.ajs.ts');

angular.module('oppia').component('unresolvedAnswersOverview', {
  template: require('./unresolved-answers-overview.component.html'),
  controller: [
    '$scope', 'EditabilityService',
    'ExplorationStatesService', 'ExternalSaveService',
    'ImprovementsService', 'NgbModal', 'StateEditorService',
    'StateInteractionIdService', 'StateTopAnswersStatsService',
    'INTERACTION_SPECS',
    'SHOW_TRAINABLE_UNRESOLVED_ANSWERS',
    function(
        $scope, EditabilityService,
        ExplorationStatesService, ExternalSaveService,
        ImprovementsService, NgbModal, StateEditorService,
        StateInteractionIdService, StateTopAnswersStatsService,
        INTERACTION_SPECS,
        SHOW_TRAINABLE_UNRESOLVED_ANSWERS) {
      var ctrl = this;

      var isStateRequiredToBeResolved = function(stateName) {
        return ImprovementsService
          .isStateForcedToResolveOutstandingUnaddressedAnswers(
            ExplorationStatesService.getState(stateName));
      };

      $scope.isUnresolvedAnswersOverviewShown = function() {
        var activeStateName = StateEditorService.getActiveStateName();
        return StateTopAnswersStatsService.hasStateStats(activeStateName) &&
          isStateRequiredToBeResolved(activeStateName);
      };

      $scope.getCurrentInteractionId = function() {
        return StateInteractionIdService.savedMemento;
      };

      $scope.isCurrentInteractionLinear = function() {
        var interactionId = $scope.getCurrentInteractionId();
        return interactionId && INTERACTION_SPECS[interactionId].is_linear;
      };

      $scope.isCurrentInteractionTrainable = function() {
        var interactionId = $scope.getCurrentInteractionId();
        return (
          interactionId &&
          INTERACTION_SPECS[interactionId].is_trainable);
      };

      $scope.isEditableOutsideTutorialMode = function() {
        return EditabilityService.isEditableOutsideTutorialMode();
      };

      $scope.openTeachOppiaModal = function() {
        ExternalSaveService.onExternalSave.emit();

        NgbModal.open(TeachOppiaModalComponent, {
          backdrop: 'static'
        }).result.then(() => {}, () => {
          // Note to developers:
          // This callback is triggered when the Cancel button is clicked.
          // No further action is needed.
        });
      };

      $scope.getUnresolvedStateStats = function() {
        return StateTopAnswersStatsService.getUnresolvedStateStats(
          StateEditorService.getActiveStateName());
      };
      ctrl.$onInit = function() {
        $scope.unresolvedAnswersOverviewIsShown = false;
        $scope.SHOW_TRAINABLE_UNRESOLVED_ANSWERS = (
          SHOW_TRAINABLE_UNRESOLVED_ANSWERS);
      };
    }
  ]
});
