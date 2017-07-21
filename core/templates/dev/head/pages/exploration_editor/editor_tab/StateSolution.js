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
  'oppiaExplorationHtmlFormatterService', 'stateInteractionIdService',
  'stateHintsService', 'UrlInterpolationService', 'SolutionObjectFactory',
  'responsesService', 'AnswerClassificationService',
  'explorationContextService', 'angularNameService', 'oppiaHtmlEscaper',
  function(
    $scope, $rootScope, $modal, $filter, $injector,
    editorContextService, alertsService, INTERACTION_SPECS,
    stateSolutionService, explorationStatesService,
    oppiaExplorationHtmlFormatterService, stateInteractionIdService,
    stateHintsService, UrlInterpolationService, SolutionObjectFactory,
    responsesService, AnswerClassificationService,
    explorationContextService, angularNameService, oppiaHtmlEscaper) {
    $scope.editorContextService = editorContextService;
    $scope.stateSolutionService = stateSolutionService;
    $scope.isActive = false;
    $scope.answerCheckPassed = false;
    $scope.INTERACTION_SPECS = INTERACTION_SPECS;
    $scope.interactionHtml = '';

    $scope.stateHintsService = stateHintsService;
    $scope.stateSolutionService = stateSolutionService;
    $scope.correctAnswer = null;

    $scope.supportedInteractions = [
      'InteractiveMap',
      'MusicNotesInput',
      'GraphInput',
      'SetInput',
      'MathExpressionInput',
      'MultipleChoiceInput',
      'ImageClickInput',
      'ItemSelectionInput'
    ];

    $scope.unsupportedInteractionObjectTypes = {
      CodeRepl: 'CodeString',
      PencilCodeEditor: 'CodeString',
      NumericInput: 'Real',
      TextInput: 'NormalizedString',
      LogicProof: 'LogicQuestion'
    };

    $scope.submitAnswer = function (answer) {
      $scope.correctAnswer = answer;
    };

    $scope.toggleIsActive = function() {
      $scope.isActive = !$scope.isActive;
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
          'currentInteractionHtml'));

      $scope.solutionIsSpecified = (
        !!JSON.stringify(stateSolutionService.savedMemento));
      $scope.isActive = false;
      var interactionId = stateInteractionIdService.savedMemento;

      $scope.INTERACTION_SPECS = INTERACTION_SPECS[interactionId];

      if ($scope.supportedInteractions.indexOf(interactionId) === -1) {
        $scope.interactionHtml = null;
        $scope.objectType = (
          $scope.unsupportedInteractionObjectTypes[interactionId]);
      } else {
        $scope.objectType = null;
      }
    });

    $scope.getSolutionSummary = function() {
      var solution = stateSolutionService.displayed;
      var isExclusiveAnswer = (
        solution.answerIsExclusive ? 'Only' : 'One');
      var correctAnswer = '';
      var interactionId = stateInteractionIdService.savedMemento;
      if (interactionId === 'GraphInput') {
        correctAnswer = '[Graph Object]';
      } else if (interactionId === 'MultipleChoiceInput') {
        correctAnswer = (
          oppiaHtmlEscaper.objToEscapedJson(
            responsesService.getAnswerChoices()[solution.correctAnswer].label));
      } else if (interactionId === 'MathExpressionInput') {
        correctAnswer = solution.correctAnswer.latex;
      } else if (interactionId === 'CodeRepl' ||
                 interactionId === 'PencilCodeEditor') {
        correctAnswer = solution.correctAnswer.code;
      } else if (interactionId === 'MusicNotesInput') {
        correctAnswer = '[Music Notes Object]';
      } else if (interactionId === 'ImageClickInput') {
        correctAnswer = solution.correctAnswer.clickedRegions;
      } else {
        correctAnswer = (
          oppiaHtmlEscaper.objToEscapedJson(solution.correctAnswer));
      }

      var explanation = (
        $filter('convertToPlainText')(solution.explanation));
      return (
        '[' + isExclusiveAnswer + ' solution is ' + correctAnswer + '] ' +
        explanation);
    };

    // This returns false if the current interaction ID is null.
    $scope.isCurrentInteractionLinear = function() {
      var interactionId = stateInteractionIdService.savedMemento;
      return interactionId && INTERACTION_SPECS[interactionId].is_linear;
    };

    $scope.openAddSolutionModal = function() {
      alertsService.clearWarnings();
      $rootScope.$broadcast('externalSave');
      $scope.isActive = false;

      $modal.open({
        templateUrl: 'modals/addSolution',
        backdrop: 'static',
        scope: $scope,
        controller: [
          '$scope', '$rootScope', '$modalInstance', 'editorContextService',
          function($scope, $rootScope, $modalInstance, editorContextService) {
            $scope.EXPLANATION_FORM_SCHEMA = {
              type: 'html',
              ui_config: {}
            };

            var interactionId = stateInteractionIdService.savedMemento;
            $scope.INTERACTION_SPECS = INTERACTION_SPECS;

            $scope.tmpSolution = {};
            $scope.tmpSolution.answerIsExclusive = false;
            $scope.tmpSolution.correctAnswer = '';
            $scope.tmpSolution.explanation = '';

            $scope.addSolutionForm = {};

            if ($scope.objectType === 'CodeString') {
              stateSolutionService.displayed = {
                correctAnswer: {
                  code: '',
                  output: '',
                  evaluation: '',
                  error: ''
                }
              };
            }

            $scope.saveSolution = function() {
              // Close the modal and save it afterwards.
              var answer = ($scope.correctAnswer !== null) ? (
                $scope.correctAnswer) : $scope.tmpSolution.correctAnswer;
              if ($scope.objectType === 'CodeString') {
                answer = {
                  code: $scope.tmpSolution.correctAnswer,
                  output: '',
                  evaluation: '',
                  error: ''
                };
              }
              if ($scope.objectType === 'UnicodeString') {
                answer = {
                  ascii: '',
                  latex: $scope.tmpSolution.correctAnswer
                };
              }

              $modalInstance.close({
                solution: angular.copy(
                  SolutionObjectFactory.createNew(
                    $scope.tmpSolution.answerIsExclusive,
                    answer,
                    $scope.tmpSolution.explanation))
              });
            };

            $scope.cancel = function() {
              $modalInstance.dismiss('cancel');
              alertsService.clearWarnings();
            };
          }
        ]
      }).result.then(function(result) {
        var explorationId =
          explorationContextService.getExplorationId();
        var currentStateName =
          editorContextService.getActiveStateName();
        var state = explorationStatesService.getState(currentStateName);
        var interactionId = stateInteractionIdService.savedMemento;
        var rulesServiceName = (
          angularNameService.getNameOfInteractionRulesService(interactionId));
        // Inject RulesService dynamically.
        var rulesService = $injector.get(rulesServiceName);
        var correctAnswer = result.solution.correctAnswer;
        try {
          AnswerClassificationService.getMatchingClassificationResult(
            explorationId, state, correctAnswer, true, rulesService)
            .then(function (result) {
              if (editorContextService.getActiveStateName() !== (
              result.outcome.dest)) {
                stateSolutionService.saveDisplayedValue();
                $scope.solutionIsSpecified = (
                  !!JSON.stringify(stateSolutionService.savedMemento));
              } else {
                alertsService.addInfoMessage('That solution does not lead ' +
                  'to the next state!');
                $scope.openAddSolutionModal();
              }
            });
        } catch (e) {
          alertsService.addInfoMessage('That solution was invalid!');
          $scope.openAddSolutionModal();
        }
        stateSolutionService.displayed = result.solution;
      });
    };

    $scope.deleteSolution = function(evt) {
      // Prevent clicking on the delete button from also toggling the display
      // state of the answer group.
      evt.stopPropagation();

      alertsService.clearWarnings();
      $modal.open({
        templateUrl: 'modals/deleteSolution',
        backdrop: true,
        scope: $scope,
        controller: [
          '$scope', '$modalInstance', function($scope, $modalInstance) {
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
        $scope.solutionIsSpecified = false;
      });
    };

    $scope.onComponentSave = function() {
      alertsService.clearWarnings();
      var explorationId =
        explorationContextService.getExplorationId();
      var currentStateName =
        editorContextService.getActiveStateName();
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
            function (result) {
              if (editorContextService.getActiveStateName() !== (
              result.outcome.dest)) {
                stateSolutionService.savedMemento.correctAnswer = answer;
                stateSolutionService.displayed = (
                  stateSolutionService.savedMemento);
                stateSolutionService.saveDisplayedValue();
                $scope.solutionIsSpecified = (
                  !!JSON.stringify(stateSolutionService.displayed));
              } else {
                alertsService.addInfoMessage('That solution does not lead ' +
                  'to the next state!');
                stateSolutionService.saveDisplayedValue();
                $scope.solutionIsSpecified = (
                  !!JSON.stringify(stateSolutionService.displayed));
              }
            });
      } catch (e) {
        alertsService.addInfoMessage('That solution was invalid!');
        stateSolutionService.saveDisplayedValue();
        $scope.solutionIsSpecified = (
          !!JSON.stringify(stateSolutionService.displayed));
      }
    };
  }
]);
