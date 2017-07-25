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
  'StateSolutionHelperService', 'oppiaExplorationHtmlFormatterService',
  'stateInteractionIdService', 'stateHintsService', 'UrlInterpolationService',
  'SolutionObjectFactory', 'responsesService', 'AnswerClassificationService',
  'explorationContextService', 'angularNameService',
  function(
    $scope, $rootScope, $modal, $filter, $injector,
    editorContextService, alertsService, INTERACTION_SPECS,
    stateSolutionService, explorationStatesService,
    StateSolutionHelperService, oppiaExplorationHtmlFormatterService,
    stateInteractionIdService, stateHintsService, UrlInterpolationService,
    SolutionObjectFactory, responsesService, AnswerClassificationService,
    explorationContextService, angularNameService) {
    $scope.editorContextService = editorContextService;
    $scope.stateSolutionService = stateSolutionService;
    $scope.StateSolutionHelperService = StateSolutionHelperService;
    $scope.inlineSolutionEditorIsActive = false;
    $scope.interactionHtml = '';
    $scope.SOLUTION_EDITOR_FOCUS_LABEL = (
      'currentInteractionHtmlForSolutionEditor');

    $scope.stateHintsService = stateHintsService;
    $scope.stateSolutionService = stateSolutionService;
    $scope.correctAnswer = null;

    $scope.toggleInlineSolutionEditorIsActive = function() {
      $scope.inlineSolutionEditorIsActive = (
        !$scope.inlineSolutionEditorIsActive);
    };

    $scope.$on('stateEditorInitialized', function(evt, stateData) {
      stateSolutionService.init(
        editorContextService.getActiveStateName(),
        stateData.interaction.solution);
      $scope.interactionHtml = (
        oppiaExplorationHtmlFormatterService.getInteractionHtml(
          stateInteractionIdService.savedMemento,
          explorationStatesService.getInteractionCustomizationArgsMemento(
            editorContextService.getActiveStateName()),
          $scope.SOLUTION_EDITOR_FOCUS_LABEL));

      $scope.inlineSolutionEditorIsActive = false;
      var interactionId = stateInteractionIdService.savedMemento;

      $scope.currentInteractionCanHaveSolution = (
        INTERACTION_SPECS[interactionId].can_have_solution);

      if (!StateSolutionHelperService.isSupportedInteraction(interactionId)) {
        // In this case the interaction UI is constructed by the Solution
        // object. So interactionHtml is set to null.
        $scope.interactionHtml = null;
      }
      $scope.objectType = StateSolutionHelperService.getInteractionObjectType(
        interactionId);
    });

    $scope.getSolutionSummary = function() {
      var solution = stateSolutionService.displayed;
      return solution.getSolutionSummary(
        stateInteractionIdService.savedMemento,
        responsesService.getAnswerChoices());
    };

    // This returns false if the current interaction ID is null.
    $scope.isCurrentInteractionLinear = function() {
      var interactionId = stateInteractionIdService.savedMemento;
      return interactionId && INTERACTION_SPECS[interactionId].is_linear;
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

            $scope.submitAnswer = function(answer) {
              $scope.correctAnswer = answer;
            };

            $scope.tmpSolution = {};
            $scope.tmpSolution.answerIsExclusive = false;
            $scope.tmpSolution.correctAnswer = '';
            $scope.tmpSolution.explanation = '';

            $scope.addSolutionForm = {};

            $scope.saveSolution = function() {
              // Close the modal and save it afterwards.
              var answer = $scope.correctAnswer;
              if (!interactionHtml) {
                answer = $scope.tmpSolution.correctAnswer;
              }
              answer = (
                StateSolutionHelperService.getCorrectAnswerObject(answer,
                  $scope.objectType));
              $modalInstance.close({
                solution: SolutionObjectFactory.createNew(
                    $scope.tmpSolution.answerIsExclusive,
                    answer,
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
        try {
          StateSolutionHelperService.verifyAndSaveAnswer(
            explorationContextService.getExplorationId(),
            state,
            correctAnswer);
        } catch (e) {
          alertsService.addInfoMessage('That solution was invalid!');
          $scope.openAddSolutionModal();
        }
        stateSolutionService.displayed = result.solution;
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
        StateSolutionHelperService.unsetSolutionIsValidFlag();
      });
    };

    $scope.onComponentSave = function() {
      alertsService.clearWarnings();
      var explorationId = explorationContextService.getExplorationId();
      var currentStateName = editorContextService.getActiveStateName();
      var state = explorationStatesService.getState(currentStateName);
      var interactionId = stateInteractionIdService.savedMemento;
      var rulesServiceName =
        angularNameService.getNameOfInteractionRulesService(
          interactionId);
      // Inject RulesService dynamically.
      var rulesService = $injector.get(rulesServiceName);
      var answer = stateSolutionService.savedMemento.correctAnswer;
      try {
        AnswerClassificationService.getMatchingClassificationResult(
          explorationId, state, answer, true, rulesService).then(
            function(result) {
              if (editorContextService.getActiveStateName() !== (
              result.outcome.dest)) {
                // Swapping savedMemento and displayed value for saving
                // the latest value.
                var tmpDisplayedSolution = stateSolutionService.displayed;
                stateSolutionService.displayed = (
                  stateSolutionService.savedMemento);
                stateSolutionService.savedMemento = tmpDisplayedSolution;
                StateSolutionHelperService.setSolutionIsValidFlag();
                stateSolutionService.saveDisplayedValue();
              } else {
                alertsService.addInfoMessage('That solution does not lead ' +
                  'to the next state!');
                StateSolutionHelperService.unsetSolutionIsValidFlag();
                stateSolutionService.saveDisplayedValue();
              }
            });
      } catch (e) {
        alertsService.addInfoMessage('That solution was invalid!');
        stateSolutionService.saveDisplayedValue();
      }
    };
  }
]);
