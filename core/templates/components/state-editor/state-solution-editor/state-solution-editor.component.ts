// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the solution viewer and editor section in the
 * state editor.
 */

import { DeleteSolutionModalComponent } from
  // eslint-disable-next-line max-len
  'pages/exploration-editor-page/editor-tab/templates/modal-templates/delete-solution-modal.component';

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');
require(
  'components/state-directives/response-header/response-header.component.ts');
require(
  'components/state-directives/solution-editor/solution-editor.component.ts');

require('domain/exploration/SolutionObjectFactory.ts');
require('domain/utilities/url-interpolation.service.ts');
require('filters/string-utility-filters/convert-to-plain-text.filter.ts');
require(
  'pages/exploration-editor-page/editor-tab/services/responses.service.ts');
require(
  'pages/exploration-editor-page/editor-tab/services/' +
  'solution-validity.service.ts');
require(
  'pages/exploration-editor-page/editor-tab/services/' +
  'solution-verification.service.ts');
require(
  'pages/exploration-player-page/services/current-interaction.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-customization-args.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-hints.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-interaction-id.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-solution.service.ts');
require(
  'pages/exploration-editor-page/editor-tab/services/' +
  'solution-verification.service');
require('services/alerts.service.ts');
require('services/editability.service.ts');
require('services/exploration-html-formatter.service.ts');

require('components/state-editor/state-editor.constants.ajs.ts');
require('services/contextual/window-dimensions.service');
require('services/external-save.service.ts');
require('services/ngb-modal.service.ts');

import { AddOrUpdateSolutionModalComponent } from 'pages/exploration-editor-page/editor-tab/templates/modal-templates/add-or-update-solution-modal.component';

angular.module('oppia').component('stateSolutionEditor', {
  bindings: {
    onSaveSolution: '=',
    refreshWarnings: '&',
    showMarkAllAudioAsNeedingUpdateModalIfRequired: '='
  },
  template: require('./state-solution-editor.component.html'),
  controller: [
    '$filter', '$rootScope', '$scope', 'AlertsService',
    'EditabilityService', 'ExplorationHtmlFormatterService',
    'ExternalSaveService', 'NgbModal', 'SolutionValidityService',
    'SolutionVerificationService', 'StateCustomizationArgsService',
    'StateEditorService', 'StateHintsService', 'StateInteractionIdService',
    'StateSolutionService', 'WindowDimensionsService',
    'INFO_MESSAGE_SOLUTION_IS_INVALID_FOR_EXPLORATION',
    'INFO_MESSAGE_SOLUTION_IS_INVALID_FOR_QUESTION',
    'INTERACTION_SPECS',
    function(
        $filter, $rootScope, $scope, AlertsService,
        EditabilityService, ExplorationHtmlFormatterService,
        ExternalSaveService, NgbModal, SolutionValidityService,
        SolutionVerificationService, StateCustomizationArgsService,
        StateEditorService, StateHintsService, StateInteractionIdService,
        StateSolutionService, WindowDimensionsService,
        INFO_MESSAGE_SOLUTION_IS_INVALID_FOR_EXPLORATION,
        INFO_MESSAGE_SOLUTION_IS_INVALID_FOR_QUESTION,
        INTERACTION_SPECS) {
      var ctrl = this;
      $scope.getInvalidSolutionTooltip = function() {
        if (StateEditorService.isInQuestionMode()) {
          return 'This solution doesn\'t correspond to an answer ' +
            'marked as correct. Verify the rules specified for the ' +
            'answers or change the solution.';
        }
        return 'This solution does not lead to another card. Verify the ' +
          'responses specified or change the solution.';
      };

      $scope.isSolutionValid = function() {
        return StateEditorService.isCurrentSolutionValid();
      };

      $scope.toggleInlineSolutionEditorIsActive = function() {
        $scope.inlineSolutionEditorIsActive = (
          !$scope.inlineSolutionEditorIsActive);
      };

      $scope.getSolutionSummary = function() {
        var solution = StateSolutionService.savedMemento;
        var solutionAsPlainText =
          solution.getSummary(StateInteractionIdService.savedMemento);
        solutionAsPlainText =
          $filter('convertToPlainText')(solutionAsPlainText);
        return solutionAsPlainText;
      };

      // This returns false if the current interaction ID is null.
      $scope.isCurrentInteractionLinear = function() {
        return (
          StateInteractionIdService.savedMemento &&
          INTERACTION_SPECS[
            StateInteractionIdService.savedMemento
          ].is_linear);
      };

      $scope.saveSolution = function(value) {
        ctrl.onSaveSolution(value);
      };

      $scope.openMarkAllAudioAsNeedingUpdateModalIfRequired = function(value) {
        ctrl.showMarkAllAudioAsNeedingUpdateModalIfRequired(value);
      };

      $scope.openAddOrUpdateSolutionModal = function() {
        AlertsService.clearWarnings();
        ExternalSaveService.onExternalSave.emit();
        $scope.inlineSolutionEditorIsActive = false;
        NgbModal.open(AddOrUpdateSolutionModalComponent, {
          backdrop: 'static'
        }).result.then(function(result) {
          StateSolutionService.displayed = result.solution;
          StateSolutionService.saveDisplayedValue();
          ctrl.onSaveSolution(StateSolutionService.displayed);
          let solutionIsValid = SolutionVerificationService.verifySolution(
            StateEditorService.getActiveStateName(),
            StateEditorService.getInteraction(),
            StateSolutionService.savedMemento.correctAnswer
          );

          SolutionValidityService.updateValidity(
            StateEditorService.getActiveStateName(), solutionIsValid);
          ctrl.refreshWarnings()();
          if (!solutionIsValid) {
            if (StateEditorService.isInQuestionMode()) {
              AlertsService.addInfoMessage(
                INFO_MESSAGE_SOLUTION_IS_INVALID_FOR_QUESTION, 4000);
            } else {
              AlertsService.addInfoMessage(
                INFO_MESSAGE_SOLUTION_IS_INVALID_FOR_EXPLORATION, 4000);
            }
          }
        }, function() {
          AlertsService.clearWarnings();
        });
      };

      $scope.deleteSolution = function(value) {
        value.evt.stopPropagation();

        AlertsService.clearWarnings();
        NgbModal.open(DeleteSolutionModalComponent, {
          backdrop: true,
        }).result.then(function() {
          StateSolutionService.displayed = null;
          StateSolutionService.saveDisplayedValue();
          ctrl.onSaveSolution(StateSolutionService.displayed);
          StateEditorService.deleteCurrentSolutionValidity();
          ctrl.refreshWarnings()();
          $rootScope.$applyAsync();
        }, function() {
          AlertsService.clearWarnings();
        });
      };

      $scope.toggleSolutionCard = function() {
        $scope.solutionCardIsShown = !$scope.solutionCardIsShown;
      };

      ctrl.$onInit = function() {
        $scope.EditabilityService = EditabilityService;
        $scope.solutionCardIsShown = (
          !WindowDimensionsService.isWindowNarrow());
        $scope.correctAnswer = null;
        $scope.inlineSolutionEditorIsActive = false;
        $scope.SOLUTION_EDITOR_FOCUS_LABEL = (
          'currentCorrectAnswerEditorHtmlForSolutionEditor');
        $scope.StateHintsService = StateHintsService;
        $scope.StateInteractionIdService = StateInteractionIdService;
        $scope.StateSolutionService = StateSolutionService;
        StateEditorService.updateStateSolutionEditorInitialised();
        $scope.correctAnswerEditorHtml = (
          ExplorationHtmlFormatterService.getInteractionHtml(
            StateInteractionIdService.savedMemento,
            StateCustomizationArgsService.savedMemento,
            false,
            $scope.SOLUTION_EDITOR_FOCUS_LABEL, null));
      };
    }
  ]
});
