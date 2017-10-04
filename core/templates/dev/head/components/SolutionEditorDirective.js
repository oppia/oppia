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
 * @fileoverview Directive for the solution editor.
 */

oppia.directive('solutionEditor', [
  '$modal', 'UrlInterpolationService', 'stateSolutionService',
  'editorContextService', 'explorationStatesService',
  'explorationWarningsService', 'AlertsService',
  'SolutionObjectFactory', 'SolutionVerificationService',
  'ExplorationContextService', 'ExplorationHtmlFormatterService',
  'stateInteractionIdService', 'stateCustomizationArgsService',
  'INFO_MESSAGE_SOLUTION_IS_INVALID',
  function($modal, UrlInterpolationService, stateSolutionService,
           editorContextService, explorationStatesService,
           explorationWarningsService, AlertsService,
           SolutionObjectFactory, SolutionVerificationService,
           ExplorationContextService, ExplorationHtmlFormatterService,
           stateInteractionIdService, stateCustomizationArgsService,
           INFO_MESSAGE_SOLUTION_IS_INVALID) {
    return {
      restrict: 'E',
      scope: {
        getInteractionId: '&interactionId',
        correctAnswerEditorHtml: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/solution_editor_directive.html'),
      controller: [
        '$scope', 'stateSolutionService',
        function($scope, stateSolutionService) {
          $scope.stateSolutionService = stateSolutionService;

          $scope.EXPLANATION_FORM_SCHEMA = {
            type: 'html',
            ui_config: {}
          };

          $scope.getAnswerHtml = function () {
            return ExplorationHtmlFormatterService.getAnswerHtml(
              stateSolutionService.savedMemento.correctAnswer,
              stateInteractionIdService.savedMemento,
              stateCustomizationArgsService.savedMemento);
          };

          $scope.openSolutionEditor = function() {
            $modal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/exploration_editor/editor_tab/' +
                'add_or_update_solution_modal_directive.html'),
              backdrop: 'static',
              controller: [
                '$scope', '$modalInstance', 'stateInteractionIdService',
                'stateSolutionService', 'editorContextService',
                'ExplorationHtmlFormatterService',
                'explorationStatesService',
                function($scope, $modalInstance, stateInteractionIdService,
                         stateSolutionService, editorContextService,
                         ExplorationHtmlFormatterService,
                         explorationStatesService) {
                  $scope.SOLUTION_EDITOR_FOCUS_LABEL = (
                    'currentCorrectAnswerEditorHtmlForSolutionEditor');
                  $scope.correctAnswer = null;
                  $scope.correctAnswerEditorHtml = (
                    ExplorationHtmlFormatterService.getInteractionHtml(
                      stateInteractionIdService.savedMemento,
                      /* eslint-disable max-len */
                      explorationStatesService.getInteractionCustomizationArgsMemento(
                        editorContextService.getActiveStateName()),
                      /* eslint-enable max-len */
                      $scope.SOLUTION_EDITOR_FOCUS_LABEL));
                  $scope.EXPLANATION_FORM_SCHEMA = {
                    type: 'html',
                    ui_config: {}
                  };

                  $scope.data = {
                    answerIsExclusive: (
                      stateSolutionService.savedMemento.answerIsExclusive),
                    correctAnswer: null,
                    explanation: stateSolutionService.savedMemento.explanation
                  };

                  $scope.submitAnswer = function(answer) {
                    $scope.data.correctAnswer = answer;
                  };

                  $scope.saveSolution = function() {
                    if (typeof $scope.data.answerIsExclusive === 'boolean' &&
                        $scope.data.correctAnswer !== null &&
                        $scope.data.explanation !== '') {
                      $modalInstance.close({
                        solution: SolutionObjectFactory.createNew(
                          $scope.data.answerIsExclusive,
                          $scope.data.correctAnswer,
                          $scope.data.explanation)
                      });
                    }
                  };

                  $scope.cancel = function() {
                    $modalInstance.dismiss('cancel');
                    AlertsService.clearWarnings();
                  };
                }
              ]
            }).result.then(function(result) {
              var correctAnswer = result.solution.correctAnswer;
              var currentStateName = editorContextService.getActiveStateName();
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
                  AlertsService.addInfoMessage(
                    INFO_MESSAGE_SOLUTION_IS_INVALID);
                }
              );

              stateSolutionService.displayed = result.solution;
              stateSolutionService.saveDisplayedValue();
            });
          };
        }
      ]
    };
  }]);
