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
 * @fileoverview Controllers, services and filters for solution.
 */

oppia.controller('StateSolution', [
  '$scope', '$rootScope', '$modal', '$filter', '$injector',
  'editorContextService', 'ENABLE_SOLUTION_EDITOR', 'alertsService',
  'INTERACTION_SPECS', 'stateSolutionService', 'explorationStatesService',
  'stateInteractionIdService', 'stateHintsService', 'UrlInterpolationService',
  'SolutionObjectFactory', 'responsesService', 'AnswerClassificationService',
  'explorationContextService', 'angularNameService',
  function(
    $scope, $rootScope, $modal, $filter, $injector,
    editorContextService, ENABLE_SOLUTION_EDITOR, alertsService,
    INTERACTION_SPECS, stateSolutionService, explorationStatesService,
    stateInteractionIdService, stateHintsService, UrlInterpolationService,
    SolutionObjectFactory, responsesService, AnswerClassificationService,
    explorationContextService, angularNameService) {
    $scope.editorContextService = editorContextService;
    $scope.stateSolutionService = stateSolutionService;
    $scope.isActive = false;
    $scope.answerIsExclusive = false;
    $scope.isAVerifiedAnswer = '';
    $scope.answerCheckPassed = false;

    $scope.stateHintsService = stateHintsService;
    $scope.stateSolutionService = stateSolutionService;

    $scope.toggleIsActive = function() {
      $scope.isActive = !$scope.isActive;
    };

    $scope.solutionEditorIsEnabled = ENABLE_SOLUTION_EDITOR;

    $scope.$on('stateEditorInitialized', function(evt, stateData) {
      stateSolutionService.init(
        editorContextService.getActiveStateName(),
        stateData.interaction.solution);
      $scope.solutionIsSpecified = (
        JSON.stringify(stateSolutionService.savedMemento) ? true : false);
      $scope.isActive = false;
      var interactionId = stateInteractionIdService.savedMemento;
      if (interactionId === 'InteractiveMap') {
        $rootScope.objectType = 'CoordTwoDim';
      } else if (interactionId === 'CodeRepl' ||
        interactionId === 'PencilCodeEditor') {
        $rootScope.objectType = 'CodeString';
      } else if (interactionId === 'MusicNotesInput') {
        $rootScope.objectType = 'MusicPhrase';
      } else if (interactionId === 'GraphInput') {
        $rootScope.objectType = 'Graph';
      } else if (interactionId === 'LogicProof') {
        $rootScope.objectType = 'LogicQuestion';
      } else if (interactionId === 'NumericInput') {
        $rootScope.objectType = 'Real';
      } else if (interactionId === 'SetInput') {
        $rootScope.objectType = 'SetOfUnicodeString';
      } else if (interactionId === 'MathExpressionInput') {
        $rootScope.objectType = 'UnicodeString';
      } else if (interactionId === 'TextInput') {
        $rootScope.objectType = 'NormalizedString';
      } else if (interactionId === 'LogicProof') {
        $rootScope.objectType = 'LogicQuestion';
      } else if (interactionId === 'MultipleChoiceInput' ||
        interactionId === 'ImageClickInput' ||
        interactionId === 'ItemSelectionInput') {
        if (interactionId === 'ImageClickInput') {
          $rootScope.ruleDescriptionChoices = (
            responsesService.getAnswerChoices().map(
              function (choice) {
                return {
                  id: choice.val,
                  val: choice.label,
                  clickedRegions: choice.label
                };
              }));
        } else {
          $rootScope.ruleDescriptionChoices = (
            responsesService.getAnswerChoices().map(
              function (choice) {
                return {
                  id: choice.val,
                  val: choice.label
                };
              }));
        }
        if (interactionId === 'ItemSelectionInput') {
          $rootScope.objectType = 'SetOfHtmlString';
        } else if (interactionId === 'ImageClickInput') {
          $rootScope.objectType = 'RegionSelect'
        } else {
          $rootScope.objectType = 'select';
        }
      }
    });

    $scope.getSolutionSummary = function() {
      var solutionSavedMemento = stateSolutionService.savedMemento;
      var isExclusiveAnswer = (
        solutionSavedMemento.answerIsExclusive ? 'Only' : 'One');
      var correctAnswer = '';
      if (typeof solutionSavedMemento.correctAnswer === 'string') {
        correctAnswer = (
          $filter('convertToPlainText')(solutionSavedMemento.correctAnswer));
      } else if (Array.isArray(
          solutionSavedMemento.correctAnswer)) {
        correctAnswer = (
          '[' + solutionSavedMemento.correctAnswer + ']');
      } else {
        correctAnswer = (
          ($scope.objectType === 'Graph') ? 'Graph Object' : 'Object');
      }
      var explanation = (
        $filter('convertToPlainText')(solutionSavedMemento.explanation));
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
            $scope.tmpSolution.answerIsExclusive = (
              $scope.answerIsExclusive === 'true');
            $scope.tmpSolution.correctAnswer = '';
            $scope.tmpSolution.explanation = '';

            $scope.addSolutionForm = {};
            if ($rootScope.objectType === 'Graph') {
              $scope.tmpSolution.correctAnswer = {
                vertices: [],
                isLabeled: false,
                edges: [],
                isDirected: false,
                isWeighted: false
              };
            }
            if ($rootScope.objectType === 'select') {
              $scope.tmpSolution.correctAnswer = (
                $rootScope.ruleDescriptionChoices[0].id);
            }
            if ($rootScope.objectType === 'CodeString') {
              stateSolutionService.displayed.correctAnswer = {
                code: stateSolutionService.displayed.correctAnswer,
                output: '',
                evaluation: '',
                error: ''
              };
            }
            if ($rootScope.objectType === 'UnicodeString') {
              stateSolutionService.displayed.correctAnswer = {
                ascii: '',
                latex: stateSolutionService.displayed.correctAnswer
              };
            }
            if ($rootScope.objectType === 'RegionSelect') {
              stateSolutionService.displayed.correctAnswer = {
                clickPosition: [0, 0],
                clickedRegions: [stateSolutionService.displayed.correctAnswer]
              };
              $scope.tmpSolution.correctAnswer = (
                $rootScope.ruleDescriptionChoices[0].id);
            }

            $scope.saveSolution = function() {
              // Close the modal and save it afterwards.
              $scope.tmpSolution.answerIsExclusive = (
                $scope.answerIsExclusive === 'true');
              var answer = $scope.tmpSolution.correctAnswer;
              if ($rootScope.objectType === 'CodeString') {
                answer = {
                  code: $scope.tmpSolution.correctAnswer,
                  output: '',
                  evaluation: '',
                  error: ''
                };
              }
              if ($rootScope.objectType === 'UnicodeString') {
                answer = {
                  ascii: '',
                  latex: $scope.tmpSolution.correctAnswer
                };
              }
              if ($rootScope.objectType === 'RegionSelect') {
                answer = {
                  clickPosition: [0, 0],
                  clickedRegions: [$scope.tmpSolution.correctAnswer]
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
        stateSolutionService.displayed = result.solution;
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
        var correctAnswer = result.solution.correctAnswer;
        try {
          $scope.isAVerifiedAnswer = (
            AnswerClassificationService.getMatchingClassificationResult(
              explorationId, state, correctAnswer, true, rulesService));
        }
        catch (e) {
          alertsService.addInfoMessage('That solution was invalid!');
          $scope.openAddSolutionModal();
          return;
        }
        //$scope.isAVerifiedAnswer.$$state.value.outcome.dest
        if (editorContextService.getActiveStateName() !== (
          $scope.isAVerifiedAnswer.$$state.value.outcome.dest)) {
          stateSolutionService.saveDisplayedValue();
          $scope.solutionIsSpecified = (
            JSON.stringify(stateSolutionService.savedMemento) ? true : false);
        } else {
          alertsService.addInfoMessage('That solution was incorrect!');
          $scope.openAddSolutionModal();
        }
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
        stateSolutionService.displayed = {};
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
      if ($rootScope.objectType === 'RegionSelect') {
        answer = {
          clickPosition: [0, 0],
          clickedRegions: [stateSolutionService.savedMemento.correctAnswer]
        };
      }

      try {
        var verifiedAnswer = (
          AnswerClassificationService.getMatchingClassificationResult(
            explorationId, state, answer, true, rulesService));
      }
      catch (e) {
        alertsService.addInfoMessage('That solution was invalid!');
        stateSolutionService.saveDisplayedValue();
        $scope.solutionIsSpecified = (
          JSON.stringify(stateSolutionService.displayed) ? true : false);
        return;
      }
      if (editorContextService.getActiveStateName() !== (
        verifiedAnswer.$$state.value.outcome.dest)) {
        stateSolutionService.savedMemento.correctAnswer = answer;
        stateSolutionService.displayed = stateSolutionService.savedMemento;
        stateSolutionService.saveDisplayedValue();
        $scope.solutionIsSpecified = (
          JSON.stringify(stateSolutionService.displayed) ? true : false);
      } else {
        alertsService.addInfoMessage('That solution was incorrect!');
        stateSolutionService.saveDisplayedValue();
        $scope.solutionIsSpecified = (
          JSON.stringify(stateSolutionService.displayed) ? true : false);
      }
    };
  }
]);
