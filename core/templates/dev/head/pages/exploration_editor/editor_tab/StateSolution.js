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
 * @fileoverview Controller for solution.
 */

oppia.controller('StateSolution', [
  '$scope', '$rootScope', '$modal', 'EditorStateService', 'AlertsService',
  'INTERACTION_SPECS', 'stateSolutionService', 'explorationStatesService',
  'SolutionVerificationService', 'ExplorationHtmlFormatterService',
  'stateInteractionIdService', 'stateHintsService', 'UrlInterpolationService',
  'SolutionObjectFactory', 'ExplorationContextService',
  'explorationWarningsService', 'INFO_MESSAGE_SOLUTION_IS_INVALID',
  function(
    $scope, $rootScope, $modal, EditorStateService, AlertsService,
    INTERACTION_SPECS, stateSolutionService, explorationStatesService,
    SolutionVerificationService, ExplorationHtmlFormatterService,
    stateInteractionIdService, stateHintsService, UrlInterpolationService,
    SolutionObjectFactory, ExplorationContextService,
    explorationWarningsService, INFO_MESSAGE_SOLUTION_IS_INVALID) {
    $scope.correctAnswer = null;
    $scope.correctAnswerEditorHtml = '';
    $scope.inlineSolutionEditorIsActive = false;
    $scope.SOLUTION_EDITOR_FOCUS_LABEL = (
      'currentCorrectAnswerEditorHtmlForSolutionEditor');
    $scope.stateHintsService = stateHintsService;
    $scope.stateInteractionIdService = stateInteractionIdService;
    $scope.stateSolutionService = stateSolutionService;


    explorationWarningsService.updateWarnings();

    $scope.isSolutionValid = function() {
      return explorationStatesService.isSolutionValid(
        EditorStateService.getActiveStateName());
    };

    $scope.correctAnswerEditorHtml = (
      ExplorationHtmlFormatterService.getInteractionHtml(
        stateInteractionIdService.savedMemento,
        explorationStatesService.getInteractionCustomizationArgsMemento(
          EditorStateService.getActiveStateName()),
        $scope.SOLUTION_EDITOR_FOCUS_LABEL));

    $scope.toggleInlineSolutionEditorIsActive = function() {
      $scope.inlineSolutionEditorIsActive = (
        !$scope.inlineSolutionEditorIsActive);
    };

    $scope.getSolutionSummary = function() {
      var solution = stateSolutionService.savedMemento;
      return solution.getSummary(stateInteractionIdService.savedMemento);
    };

    // This returns false if the current interaction ID is null.
    $scope.isCurrentInteractionLinear = function() {
      return (
        stateInteractionIdService.savedMemento &&
        INTERACTION_SPECS[stateInteractionIdService.savedMemento].is_linear);
    };

    $scope.openAddOrUpdateSolutionModal = function() {
      AlertsService.clearWarnings();
      $rootScope.$broadcast('externalSave');
      $scope.inlineSolutionEditorIsActive = false;

      $modal.open({
        templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
          '/pages/exploration_editor/editor_tab/' +
          'add_or_update_solution_modal_directive.html'),
        backdrop: 'static',
        controller: [
          '$scope', '$modalInstance', 'stateSolutionService',
          function(
            $scope, $modalInstance, stateSolutionService) {
            $scope.stateSolutionService = stateSolutionService;
            $scope.correctAnswerEditorHtml = (
              ExplorationHtmlFormatterService.getInteractionHtml(
                stateInteractionIdService.savedMemento,
                explorationStatesService.getInteractionCustomizationArgsMemento(
                  EditorStateService.getActiveStateName()),
                $scope.SOLUTION_EDITOR_FOCUS_LABEL));
            $scope.EXPLANATION_FORM_SCHEMA = {
              type: 'html',
              ui_config: {}
            };

            $scope.data = {
              answerIsExclusive: false,
              correctAnswer: null,
              explanation: ''
            };

            $scope.submitAnswer = function(answer) {
              $scope.data.correctAnswer = answer;
            };

            $scope.saveSolution = function() {
              $modalInstance.close({
                solution: SolutionObjectFactory.createNew(
                  $scope.data.answerIsExclusive,
                  $scope.data.correctAnswer,
                  $scope.data.explanation)
              });
            };

            $scope.cancel = function() {
              $modalInstance.dismiss('cancel');
              AlertsService.clearWarnings();
            };
          }
        ]
      }).result.then(function(result) {
        var correctAnswer = result.solution.correctAnswer;
        var currentStateName = EditorStateService.getActiveStateName();
        var state = explorationStatesService.getState(currentStateName);
        SolutionVerificationService.verifySolution(
          ExplorationContextService.getExplorationId(),
          state,
          correctAnswer,
          function () {
            explorationStatesService.updateSolutionValidity(
              currentStateName, true);
            explorationWarningsService.updateWarnings();
          },
          function () {
            explorationStatesService.updateSolutionValidity(
              currentStateName, false);
            explorationWarningsService.updateWarnings();
            AlertsService.addInfoMessage(INFO_MESSAGE_SOLUTION_IS_INVALID);
          }
        );

        stateSolutionService.displayed = result.solution;
        stateSolutionService.saveDisplayedValue();
      });
    };

    $scope.deleteSolution = function(evt) {
      evt.stopPropagation();

      AlertsService.clearWarnings();
      $modal.open({
        templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
          '/pages/exploration_editor/editor_tab/' +
          'delete_solution_modal_directive.html'),
        backdrop: true,
        controller: [
          '$scope', '$modalInstance',
          function($scope, $modalInstance) {
            $scope.reallyDelete = function() {
              $modalInstance.close();
            };

            $scope.cancel = function() {
              $modalInstance.dismiss('cancel');
              AlertsService.clearWarnings();
            };
          }
        ]
      }).result.then(function() {
        stateSolutionService.displayed = null;
        stateSolutionService.saveDisplayedValue();
        explorationStatesService.deleteSolutionValidity(
          EditorStateService.getActiveStateName());
      });
    };
  }
]);
