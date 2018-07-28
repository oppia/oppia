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
 * @fileoverview Directive for the solution viewer and editor section in the
 * state editor.
 */
oppia.directive('stateSolutionEditor', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        onSaveSolution: '=',
        onSaveContentIdsToAudioTranslations: '=',
        getInteractionCustomizationArgsMemento: '&',
        isSolutionValid: '=',
        deleteSolutionValidity: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/state_editor/state_solution_editor_directive.html'),
      controller: [
        '$scope', '$rootScope', '$uibModal', '$filter',
        'AlertsService', 'INTERACTION_SPECS', 'stateSolutionService',
        'SolutionVerificationService', 'SolutionValidityService',
        'ExplorationHtmlFormatterService', 'stateInteractionIdService',
        'stateHintsService', 'UrlInterpolationService', 'SolutionObjectFactory',
        'ContextService', 'ExplorationWarningsService',
        'EditabilityService', 'stateContentIdsToAudioTranslationsService',
        function(
            $scope, $rootScope, $uibModal, $filter,
            AlertsService, INTERACTION_SPECS, stateSolutionService,
            SolutionVerificationService, SolutionValidityService,
            ExplorationHtmlFormatterService, stateInteractionIdService,
            stateHintsService, UrlInterpolationService, SolutionObjectFactory,
            ContextService, ExplorationWarningsService,
            EditabilityService, stateContentIdsToAudioTranslationsService) {
          $scope.EditabilityService = EditabilityService;
          $scope.correctAnswer = null;
          $scope.correctAnswerEditorHtml = '';
          $scope.inlineSolutionEditorIsActive = false;
          $scope.SOLUTION_EDITOR_FOCUS_LABEL = (
            'currentCorrectAnswerEditorHtmlForSolutionEditor');
          $scope.stateHintsService = stateHintsService;
          $scope.stateInteractionIdService = stateInteractionIdService;
          $scope.stateSolutionService = stateSolutionService;


          ExplorationWarningsService.updateWarnings();

          $scope.correctAnswerEditorHtml = (
            ExplorationHtmlFormatterService.getInteractionHtml(
              stateInteractionIdService.savedMemento,
              $scope.getInteractionCustomizationArgsMemento(),
              false,
              $scope.SOLUTION_EDITOR_FOCUS_LABEL));

          $scope.toggleInlineSolutionEditorIsActive = function() {
            $scope.inlineSolutionEditorIsActive = (
              !$scope.inlineSolutionEditorIsActive);
          };

          $scope.getSolutionSummary = function() {
            var solution = stateSolutionService.savedMemento;
            var solutionAsPlainText =
              solution.getSummary(stateInteractionIdService.savedMemento);
            solutionAsPlainText =
              $filter('convertToPlainText')(solutionAsPlainText);
            return solutionAsPlainText;
          };

          // This returns false if the current interaction ID is null.
          $scope.isCurrentInteractionLinear = function() {
            return (
              stateInteractionIdService.savedMemento &&
              INTERACTION_SPECS[
                stateInteractionIdService.savedMemento
              ].is_linear);
          };

          $scope.openAddOrUpdateSolutionModal = function() {
            AlertsService.clearWarnings();
            $rootScope.$broadcast('externalSave');
            $scope.inlineSolutionEditorIsActive = false;
            var interactionCustomizationArgsMemento =
              $scope.getInteractionCustomizationArgsMemento();
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/exploration_editor/editor_tab/' +
                'add_or_update_solution_modal_directive.html'),
              backdrop: 'static',
              controller: [
                '$scope', '$uibModalInstance', 'stateSolutionService',
                'EVENT_PROGRESS_NAV_SUBMITTED', 'INTERACTION_SPECS',
                'COMPONENT_NAME_SOLUTION', 'GenerateContentIdService', function(
                    $scope, $uibModalInstance, stateSolutionService,
                    EVENT_PROGRESS_NAV_SUBMITTED, INTERACTION_SPECS,
                    COMPONENT_NAME_SOLUTION, GenerateContentIdService) {
                  $scope.stateSolutionService = stateSolutionService;
                  $scope.correctAnswerEditorHtml = (
                    ExplorationHtmlFormatterService.getInteractionHtml(
                      stateInteractionIdService.savedMemento,
                      interactionCustomizationArgsMemento,
                      false,
                      $scope.SOLUTION_EDITOR_FOCUS_LABEL));
                  $scope.EXPLANATION_FORM_SCHEMA = {
                    type: 'html',
                    ui_config: {}
                  };

                  $scope.answerIsValid = false;

                  var EMPTY_SOLUTION_DATA = {
                    answerIsExclusive: false,
                    correctAnswer: null,
                    explanationHtml: '',
                    explanationContentId: COMPONENT_NAME_SOLUTION
                  };

                  $scope.data = stateSolutionService.savedMemento ? {
                    answerIsExclusive: (
                      stateSolutionService.savedMemento.answerIsExclusive),
                    correctAnswer: null,
                    explanationHtml: (
                      stateSolutionService.savedMemento.explanation.getHtml()),
                    explanationContentId: (
                      stateSolutionService.savedMemento.explanation
                        .getContentId())
                  } : angular.copy(EMPTY_SOLUTION_DATA);

                  $scope.onSubmitFromSubmitButton = function() {
                    $scope.$broadcast(EVENT_PROGRESS_NAV_SUBMITTED);
                  };

                  $scope.submitAnswer = function(answer) {
                    $scope.data.correctAnswer = answer;
                  };

                  $scope.setInteractionAnswerValidity = function(
                      answerValidity) {
                    $scope.answerIsValid = answerValidity;
                  };

                  $scope.shouldAdditionalSubmitButtonBeShown = function() {
                    var interactionSpecs = INTERACTION_SPECS[
                      stateInteractionIdService.savedMemento];
                    return interactionSpecs.show_generic_submit_button;
                  };

                  $scope.saveSolution = function() {
                    if (typeof $scope.data.answerIsExclusive === 'boolean' &&
                        $scope.data.correctAnswer !== null &&
                        $scope.data.explanation !== '') {
                      $uibModalInstance.close({
                        solution: SolutionObjectFactory.createNew(
                          $scope.data.answerIsExclusive,
                          $scope.data.correctAnswer,
                          $scope.data.explanationHtml,
                          $scope.data.explanationContentId)
                      });
                    } else {
                      throw Error('Cannot save invalid solution');
                    }
                  };

                  $scope.cancel = function() {
                    $uibModalInstance.dismiss('cancel');
                    AlertsService.clearWarnings();
                  };
                }
              ]
            }).result.then(function(result) {
              stateSolutionService.displayed = result.solution;

              if (!stateSolutionService.savedMemento) {
                var explanationContentId =
                  result.solution.explanation.getContentId();
                stateContentIdsToAudioTranslationsService.displayed
                  .addContentId(explanationContentId);
                stateContentIdsToAudioTranslationsService.saveDisplayedValue();
                $scope.onSaveContentIdsToAudioTranslations(
                  stateContentIdsToAudioTranslationsService.displayed
                );
              }
              stateSolutionService.saveDisplayedValue();
              $scope.onSaveSolution(stateSolutionService.displayed);
              $rootScope.$broadcast('validateSolution', false);
            });
          };

          $scope.deleteSolution = function(index, evt) {
            evt.stopPropagation();

            AlertsService.clearWarnings();
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/exploration_editor/editor_tab/' +
                'delete_solution_modal_directive.html'),
              backdrop: true,
              controller: [
                '$scope', '$uibModalInstance',
                function($scope, $uibModalInstance) {
                  $scope.reallyDelete = function() {
                    $uibModalInstance.close();
                  };

                  $scope.cancel = function() {
                    $uibModalInstance.dismiss('cancel');
                    AlertsService.clearWarnings();
                  };
                }
              ]
            }).result.then(function() {
              var explanationContentId = stateSolutionService.displayed
                .explanation.getContentId();
              stateContentIdsToAudioTranslationsService.displayed
                .deleteContentId(explanationContentId);
              stateSolutionService.displayed = null;
              stateSolutionService.saveDisplayedValue();
              $scope.onSaveSolution(stateSolutionService.displayed);
              stateContentIdsToAudioTranslationsService.saveDisplayedValue();
              $scope.onSaveContentIdsToAudioTranslations(
                stateContentIdsToAudioTranslationsService.displayed
              );
              $scope.deleteSolutionValidity();
            });
          };
        }
      ]
    };
  }]);
