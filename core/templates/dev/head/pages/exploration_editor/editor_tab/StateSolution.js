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
  '$scope', '$rootScope', '$modal', '$filter', '$injector',
  'editorContextService', 'alertsService', 'INTERACTION_SPECS',
  'stateSolutionService', 'explorationStatesService',
  'SolutionHelperService', 'oppiaExplorationHtmlFormatterService',
  'stateInteractionIdService', 'stateHintsService', 'UrlInterpolationService',
  'SolutionObjectFactory', 'responsesService', 'AnswerClassificationService',
  'explorationContextService', 'angularNameService',
  function(
    $scope, $rootScope, $modal, $filter, $injector,
    editorContextService, alertsService, INTERACTION_SPECS,
    stateSolutionService, explorationStatesService,
    SolutionHelperService, oppiaExplorationHtmlFormatterService,
    stateInteractionIdService, stateHintsService, UrlInterpolationService,
    SolutionObjectFactory, responsesService, AnswerClassificationService,
    explorationContextService, angularNameService) {
    $scope.editorContextService = editorContextService;
    $scope.stateSolutionService = stateSolutionService;
    $scope.SolutionHelperService = SolutionHelperService;
    $scope.inlineSolutionEditorIsActive = false;
    $scope.interactionHtml = '';
    $scope.SOLUTION_EDITOR_FOCUS_LABEL = (
      'currentInteractionHtmlForSolutionEditor');

    $scope.stateHintsService = stateHintsService;
    $scope.stateSolutionService = stateSolutionService;
    $scope.correctAnswer = null;

    $scope.isSolutionValid = function() {
      return explorationStatesService.getState(
        editorContextService.getActiveStateName()
      ).interaction.isSolutionValid();
    };

    $scope.inlineSolutionEditorIsActive = false;
    var interactionId = stateInteractionIdService.savedMemento;

    if (SolutionHelperService.isConstructedUsingObjectType(interactionId)) {
      // In this case the interactionHtml is constructed in the Solution
      // object using the objectType. So interactionHtml is set to null here.
      $scope.interactionHtml = null;
    } else {
      $scope.interactionHtml = (
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
      var solution = stateSolutionService.displayed;
      return solution.getSummary(
        stateInteractionIdService.savedMemento,
        responsesService.getAnswerChoices());
    };

    // This returns false if the current interaction ID is null.
    $scope.isCurrentInteractionLinear = function() {
      return (stateInteractionIdService.savedMemento &&
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
          interactionHtml: function() {
            return $scope.interactionHtml;
          }
        },
        controller: [
          '$scope', '$modalInstance', 'objectType', 'correctAnswer',
          'interactionHtml',
          function($scope, $modalInstance, objectType, correctAnswer,
            interactionHtml) {
            $scope.correctAnswer = correctAnswer;
            $scope.objectType = objectType;
            $scope.interactionHtml = interactionHtml;
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
              var answer = $scope.data.correctAnswer;

              var answerObject = (
                SolutionHelperService.getCorrectAnswerObject(
                  answer,
                  $scope.objectType));
              $modalInstance.close({
                solution: SolutionObjectFactory.createNew(
                  $scope.tmpSolution.answerIsExclusive,
                  answerObject,
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
            alertsService.addInfoMessage(
              'That solution does not lead to the next state!');
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
        explorationStatesService.getState(
          editorContextService.getActiveStateName()
        ).interaction.markSolutionAsInvalid();
      });
    };

    $scope.onComponentSave = function() {
      alertsService.clearWarnings();
      var currentStateName = editorContextService.getActiveStateName();
      var state = explorationStatesService.getState(currentStateName);
      var answer = stateSolutionService.displayed.correctAnswer;

      SolutionHelperService.verifySolution(
        explorationContextService.getExplorationId(),
        state,
        answer,
        function () {
          alertsService.addInfoMessage(
            'That solution does not lead to the next state!');
        });

      stateSolutionService.saveDisplayedValue();
    };
  }
]);
