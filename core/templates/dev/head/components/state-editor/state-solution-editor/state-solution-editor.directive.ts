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

require(
  'components/state-directives/response-header/response-header.directive.ts');
require(
  'components/state-directives/solution-editor/solution-editor.directive.ts');

require('domain/exploration/SolutionObjectFactory.ts');
require('domain/utilities/UrlInterpolationService.ts');
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
require('services/AlertsService.ts');
require('services/ContextService.ts');
require('services/EditabilityService.ts');
require('services/ExplorationHtmlFormatterService.ts');
require('services/GenerateContentIdService.ts');

require('components/state-editor/state-editor.constants.ajs.ts');

angular.module('oppia').directive('stateSolutionEditor', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        onSaveSolution: '=',
        refreshWarnings: '&',
        showMarkAllAudioAsNeedingUpdateModalIfRequired: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/state-editor/state-solution-editor/' +
        'state-solution-editor.directive.html'),
      controller: [
        '$scope', '$rootScope', '$uibModal', '$filter', 'StateEditorService',
        'AlertsService', 'INTERACTION_SPECS', 'StateSolutionService',
        'SolutionVerificationService', 'SolutionValidityService',
        'ExplorationHtmlFormatterService', 'StateInteractionIdService',
        'StateHintsService', 'UrlInterpolationService', 'SolutionObjectFactory',
        'ContextService', 'StateCustomizationArgsService',
        'EditabilityService',
        'INFO_MESSAGE_SOLUTION_IS_INVALID_FOR_EXPLORATION',
        'INFO_MESSAGE_SOLUTION_IS_INVALID_FOR_QUESTION',
        function(
            $scope, $rootScope, $uibModal, $filter, StateEditorService,
            AlertsService, INTERACTION_SPECS, StateSolutionService,
            SolutionVerificationService, SolutionValidityService,
            ExplorationHtmlFormatterService, StateInteractionIdService,
            StateHintsService, UrlInterpolationService, SolutionObjectFactory,
            ContextService, StateCustomizationArgsService,
            EditabilityService,
            INFO_MESSAGE_SOLUTION_IS_INVALID_FOR_EXPLORATION,
            INFO_MESSAGE_SOLUTION_IS_INVALID_FOR_QUESTION) {
          $scope.EditabilityService = EditabilityService;
          $scope.correctAnswer = null;
          $scope.correctAnswerEditorHtml = '';
          $scope.inlineSolutionEditorIsActive = false;
          $scope.SOLUTION_EDITOR_FOCUS_LABEL = (
            'currentCorrectAnswerEditorHtmlForSolutionEditor');
          $scope.StateHintsService = StateHintsService;
          $scope.StateInteractionIdService = StateInteractionIdService;
          $scope.StateSolutionService = StateSolutionService;

          $scope.getInvalidSolutionTooltip = function() {
            if (StateEditorService.isInQuestionMode()) {
              return 'This solution doesn\'t correspond to an answer ' +
                'marked as correct. Verify the rules specified for the ' +
                'answers or change the solution.';
            }
            return 'This solution does not lead to another card. Verify the ' +
              'responses specified or change the solution.';
          };


          $scope.refreshWarnings()();

          $scope.isSolutionValid = function() {
            return StateEditorService.isCurrentSolutionValid();
          };

          $scope.correctAnswerEditorHtml = (
            ExplorationHtmlFormatterService.getInteractionHtml(
              StateInteractionIdService.savedMemento,
              StateCustomizationArgsService.savedMemento,
              false,
              $scope.SOLUTION_EDITOR_FOCUS_LABEL));

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

          $scope.openAddOrUpdateSolutionModal = function() {
            AlertsService.clearWarnings();
            $rootScope.$broadcast('externalSave');
            $scope.inlineSolutionEditorIsActive = false;
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/exploration-editor-page/editor-tab/templates/' +
                'modal-templates/add-or-update-solution-modal.template.html'),
              backdrop: 'static',
              controller: [
                '$scope', '$uibModalInstance', 'StateSolutionService',
                'StateCustomizationArgsService',
                'CurrentInteractionService', 'INTERACTION_SPECS',
                'COMPONENT_NAME_SOLUTION', 'GenerateContentIdService', function(
                    $scope, $uibModalInstance, StateSolutionService,
                    StateCustomizationArgsService,
                    CurrentInteractionService, INTERACTION_SPECS,
                    COMPONENT_NAME_SOLUTION, GenerateContentIdService) {
                  $scope.StateSolutionService = StateSolutionService;
                  $scope.correctAnswerEditorHtml = (
                    ExplorationHtmlFormatterService.getInteractionHtml(
                      StateInteractionIdService.savedMemento,
                      StateCustomizationArgsService.savedMemento,
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

                  $scope.data = StateSolutionService.savedMemento ? {
                    answerIsExclusive: (
                      StateSolutionService.savedMemento.answerIsExclusive),
                    correctAnswer: null,
                    explanationHtml: (
                      StateSolutionService.savedMemento.explanation.getHtml()),
                    explanationContentId: (
                      StateSolutionService.savedMemento.explanation
                        .getContentId())
                  } : angular.copy(EMPTY_SOLUTION_DATA);

                  $scope.onSubmitFromSubmitButton = function() {
                    CurrentInteractionService.submitAnswer();
                  };

                  $scope.isSubmitButtonDisabled = (
                    CurrentInteractionService.isSubmitButtonDisabled);

                  CurrentInteractionService.setOnSubmitFn(function(answer) {
                    $scope.data.correctAnswer = answer;
                  });

                  $scope.shouldAdditionalSubmitButtonBeShown = function() {
                    var interactionSpecs = INTERACTION_SPECS[
                      StateInteractionIdService.savedMemento];
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
              StateSolutionService.displayed = result.solution;
              StateSolutionService.saveDisplayedValue();
              $scope.onSaveSolution(StateSolutionService.displayed);
              var solutionIsValid = SolutionVerificationService.verifySolution(
                StateEditorService.getActiveStateName(),
                StateEditorService.getInteraction(),
                StateSolutionService.savedMemento.correctAnswer
              );

              SolutionValidityService.updateValidity(
                StateEditorService.getActiveStateName(), solutionIsValid);
              $scope.refreshWarnings()();
              if (!solutionIsValid) {
                if (StateEditorService.isInQuestionMode()) {
                  AlertsService.addInfoMessage(
                    INFO_MESSAGE_SOLUTION_IS_INVALID_FOR_QUESTION, 4000);
                } else {
                  AlertsService.addInfoMessage(
                    INFO_MESSAGE_SOLUTION_IS_INVALID_FOR_EXPLORATION, 4000);
                }
              }
            });
          };

          $scope.deleteSolution = function(index, evt) {
            evt.stopPropagation();

            AlertsService.clearWarnings();
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/exploration-editor-page/editor-tab/templates/' +
                'modal-templates/delete-solution-modal.template.html'),
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
              StateSolutionService.displayed = null;
              StateSolutionService.saveDisplayedValue();
              $scope.onSaveSolution(StateSolutionService.displayed);
              StateEditorService.deleteCurrentSolutionValidity();
            });
          };
        }
      ]
    };
  }]);
