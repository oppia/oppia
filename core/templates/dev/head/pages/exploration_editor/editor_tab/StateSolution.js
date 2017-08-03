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
  'SolutionHelperService', 'oppiaExplorationHtmlFormatterService',
  'stateInteractionIdService', 'stateHintsService', 'UrlInterpolationService',
  'SolutionObjectFactory', 'responsesService', 'explorationContextService',
  function(
    $scope, $rootScope, $modal, editorContextService, alertsService,
    INTERACTION_SPECS, stateSolutionService, explorationStatesService,
    SolutionHelperService, oppiaExplorationHtmlFormatterService,
    stateInteractionIdService, stateHintsService, UrlInterpolationService,
    SolutionObjectFactory, responsesService, explorationContextService) {
    $scope.editorContextService = editorContextService;
    $scope.stateSolutionService = stateSolutionService;
    $scope.SolutionHelperService = SolutionHelperService;
    $scope.inlineSolutionEditorIsActive = false;
    $scope.correctAnswerEditorHtml = '';
    $scope.SOLUTION_EDITOR_FOCUS_LABEL = (
      'currentcorrectAnswerEditorHtmlForSolutionEditor');

    $scope.stateHintsService = stateHintsService;
    $scope.correctAnswer = null;

    $scope.isSolutionValid = function() {
      return explorationStatesService.isSolutionValid(
        editorContextService.getActiveStateName());
    };

    $scope.inlineSolutionEditorIsActive = false;
    var interactionId = stateInteractionIdService.savedMemento;

    if (SolutionHelperService.isConstructedUsingObjectType(interactionId)) {
      // In this case the correctAnswerEditorHtml is constructed in the Solution
      // object using the objectType. So correctAnswerEditorHtml is set to
      // null here.
      $scope.correctAnswerEditorHtml = null;
    } else {
      $scope.correctAnswerEditorHtml = (
        oppiaExplorationHtmlFormatterService.getInteractionHtml(
          stateInteractionIdService.savedMemento,
          explorationStatesService.getInteractionCustomizationArgsMemento(
            editorContextService.getActiveStateName()),
          $scope.SOLUTION_EDITOR_FOCUS_LABEL));
    }
    $scope.objectType = SolutionHelperService.getInteractionObjectType(
      interactionId);

    $scope.toggleInlineSolutionEditorIsActive = function() {
      $scope.inlineSolutionEditorIsActive = (
        !$scope.inlineSolutionEditorIsActive);
    };

    $scope.$on('stateEditorInitialized', function(evt, stateData) {
      stateSolutionService.init(
        editorContextService.getActiveStateName(),
        stateData.interaction.solution);
    });

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
          '/pages/exploration_editor/editor_tab/addSolutionModal.html'),
        backdrop: 'static',
        resolve: {
          objectType: function() {
            return $scope.objectType;
          },
          correctAnswer: function() {
            return $scope.correctAnswer;
          },
          correctAnswerEditorHtml: function() {
            return $scope.correctAnswerEditorHtml;
          }
        },
        controller: [
          '$scope', '$modalInstance', 'objectType', 'correctAnswer',
          'correctAnswerEditorHtml',
          function($scope, $modalInstance, objectType, correctAnswer,
            correctAnswerEditorHtml) {
            $scope.correctAnswer = correctAnswer;
            $scope.objectType = objectType;
            $scope.correctAnswerEditorHtml = correctAnswerEditorHtml;
            $scope.EXPLANATION_FORM_SCHEMA = {
              type: 'html',
              ui_config: {}
            };

            $scope.data = {
              correctAnswer: null
            };

            $scope.submitAnswer = function(answer) {
              $scope.data.correctAnswer = answer;
            };

            $scope.tmpSolution = {};
            $scope.tmpSolution.answerIsExclusive = false;
            $scope.tmpSolution.explanation = '';


            $scope.saveSolution = function() {
              $modalInstance.close({
                solution: SolutionObjectFactory.createNew(
                  $scope.tmpSolution.answerIsExclusive,
                  $scope.data.correctAnswer,
                  $scope.tmpSolution.explanation)
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
        SolutionHelperService.verifySolution(
          explorationContextService.getExplorationId(),
          state,
          correctAnswer,
          function () {
            explorationStatesService.updateSolutionValidity(
              currentStateName, false);
            alertsService.addInfoMessage(
              'That solution does not lead to the next state!');
          },
          function () {
            explorationStatesService.updateSolutionValidity(
              currentStateName, true);
            alertsService.addInfoMessage(
              'The solution is now valid!');
          });

        stateSolutionService.displayed = result.solution;
        stateSolutionService.saveDisplayedValue();
      });
    };

    $scope.deleteSolution = function(evt) {
      evt.stopPropagation();

      alertsService.clearWarnings();
      $modal.open({
        templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
          '/pages/exploration_editor/editor_tab/deleteSolutionModal.html'),
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

      SolutionHelperService.verifySolution(
        explorationContextService.getExplorationId(),
        state,
        answer,
        function () {
          explorationStatesService.updateSolutionValidity(
            currentStateName, false);
          alertsService.addInfoMessage(
            'That solution does not lead to the next state!');
        },
        function () {
          explorationStatesService.updateSolutionValidity(
            currentStateName, true);
          alertsService.addInfoMessage(
            'The solution is now valid!');
        });

      stateSolutionService.saveDisplayedValue();
    };
  }
]);
