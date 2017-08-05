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
  '$scope', '$rootScope', '$modal', 'editorContextService', 'alertsService',
  'INTERACTION_SPECS', 'stateSolutionService', 'explorationStatesService',
  'SolutionVerificationService', 'oppiaExplorationHtmlFormatterService',
  'stateInteractionIdService', 'stateHintsService', 'UrlInterpolationService',
  'SolutionObjectFactory', 'responsesService', 'explorationContextService',
  'explorationWarningsService',
  function(
    $scope, $rootScope, $modal, editorContextService, alertsService,
    INTERACTION_SPECS, stateSolutionService, explorationStatesService,
    SolutionVerificationService, oppiaExplorationHtmlFormatterService,
    stateInteractionIdService, stateHintsService, UrlInterpolationService,
    SolutionObjectFactory, responsesService, explorationContextService,
    explorationWarningsService) {
    $scope.editorContextService = editorContextService;
    $scope.stateSolutionService = stateSolutionService;
    $scope.SolutionVerificationService = SolutionVerificationService;
    $scope.inlineSolutionEditorIsActive = false;
    $scope.correctAnswerEditorHtml = '';
    $scope.SOLUTION_EDITOR_FOCUS_LABEL = (
      'currentCorrectAnswerEditorHtmlForSolutionEditor');
    explorationWarningsService.updateWarnings();
    $scope.stateHintsService = stateHintsService;
    $scope.correctAnswer = null;

    $scope.isSolutionValid = function() {
      return explorationStatesService.isSolutionValid(
        editorContextService.getActiveStateName());
    };

    $scope.inlineSolutionEditorIsActive = false;
    $scope.stateInteractionIdService = stateInteractionIdService;

    $scope.correctAnswerEditorHtml = (
        oppiaExplorationHtmlFormatterService.getInteractionHtml(
          stateInteractionIdService.savedMemento,
          explorationStatesService.getInteractionCustomizationArgsMemento(
            editorContextService.getActiveStateName()),
          $scope.SOLUTION_EDITOR_FOCUS_LABEL));

    $scope.toggleInlineSolutionEditorIsActive = function() {
      $scope.inlineSolutionEditorIsActive = (
        !$scope.inlineSolutionEditorIsActive);
    };

    $scope.getSolutionSummary = function() {
      var solution = stateSolutionService.savedMemento;
      return solution.getSummary(
        stateInteractionIdService.savedMemento,
        responsesService.getAnswerChoices());
    };

    // This returns false if the current interaction ID is null.
    $scope.isCurrentInteractionLinear = function() {
      return (
        stateInteractionIdService.savedMemento &&
        INTERACTION_SPECS[stateInteractionIdService.savedMemento].is_linear);
    };

    $scope.openAddSolutionModal = function() {
      alertsService.clearWarnings();
      $rootScope.$broadcast('externalSave');
      $scope.inlineSolutionEditorIsActive = false;

      $modal.open({
        templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
          '/pages/exploration_editor/editor_tab/add_solution_modal.html'),
        backdrop: 'static',
        resolve: {
          correctAnswer: function() {
            return $scope.correctAnswer;
          }
        },
        controller: [
          '$scope', '$modalInstance', 'correctAnswer',
          function($scope, $modalInstance, correctAnswer) {
            $scope.correctAnswer = correctAnswer;
            $scope.correctAnswerEditorHtml = (
              oppiaExplorationHtmlFormatterService.getInteractionHtml(
                stateInteractionIdService.savedMemento,
                explorationStatesService.getInteractionCustomizationArgsMemento(
                  editorContextService.getActiveStateName()),
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
              alertsService.clearWarnings();
            };
          }
        ]
      }).result.then(function(result) {
        var correctAnswer = result.solution.correctAnswer;
        var currentStateName = editorContextService.getActiveStateName();
        var state = explorationStatesService.getState(currentStateName);
        SolutionVerificationService.verifySolution(
          explorationContextService.getExplorationId(),
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
            alertsService.addInfoMessage(
              'That solution does not lead to the next state!');
          }
        );

        stateSolutionService.displayed = result.solution;
        stateSolutionService.saveDisplayedValue();
      });
    };

    $scope.deleteSolution = function(evt) {
      evt.stopPropagation();

      alertsService.clearWarnings();
      $modal.open({
        templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
          '/pages/exploration_editor/editor_tab/delete_solution_modal.html'),
        backdrop: true,
        controller: [
          '$scope', '$modalInstance',
          function($scope, $modalInstance) {
            $scope.reallyDelete = function() {
              $modalInstance.close();
            };

            $scope.cancel = function() {
              $modalInstance.dismiss('cancel');
              alertsService.clearWarnings();
            };
          }
        ]
      }).result.then(function() {
        stateSolutionService.displayed = null;
        stateSolutionService.saveDisplayedValue();
        explorationStatesService.deleteSolutionValidity(
          editorContextService.getActiveStateName());
      });
    };

    $scope.onSaveInlineSolution = function() {
      alertsService.clearWarnings();
      var currentStateName = editorContextService.getActiveStateName();
      var state = explorationStatesService.getState(currentStateName);
      var answer = stateSolutionService.displayed.correctAnswer;

      SolutionVerificationService.verifySolution(
        explorationContextService.getExplorationId(),
        state,
        answer,
        function () {
          explorationStatesService.updateSolutionValidity(
            currentStateName, true);
          explorationWarningsService.updateWarnings();
        },
        function () {
          explorationStatesService.updateSolutionValidity(
            currentStateName, false);
          explorationWarningsService.updateWarnings();
          alertsService.addInfoMessage(
            'That solution does not lead to the next state!');
        }
      );

      stateSolutionService.saveDisplayedValue();
    };
  }
]);
