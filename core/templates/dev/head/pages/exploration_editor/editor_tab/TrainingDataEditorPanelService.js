// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service which handles opening and closing
 * the training data editor of an answer group.
 */

oppia.factory('TrainingDataEditorPanelService', [
  '$rootScope', '$uibModal', 'AlertsService', 'UrlInterpolationService',
  function($rootScope, $uibModal, AlertsService, UrlInterpolationService) {
    return {
      /**
      * Opens training data editor for currently selected answer group.
      */
      openTrainingDataEditor: function() {
        AlertsService.clearWarnings();
        $uibModal.open({
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/pages/exploration_editor/editor_tab/' +
            'training_data_editor_directive.html'),
          backdrop: true,
          controller: [
            '$scope', '$injector', '$uibModalInstance',
            'ExplorationStatesService', 'EditorStateService',
            'AnswerClassificationService', 'ExplorationContextService',
            'stateInteractionIdService', 'AngularNameService',
            'EXPLICIT_CLASSIFICATION', 'TRAINING_DATA_CLASSIFICATION',
            'ExplorationHtmlFormatterService', 'ResponsesService',
            'stateCustomizationArgsService', 'TrainingDataService',
            'TrainingModalService', 'FocusManagerService',
            function($scope, $injector, $uibModalInstance,
                ExplorationStatesService, EditorStateService,
                AnswerClassificationService, ExplorationContextService,
                stateInteractionIdService, AngularNameService,
                EXPLICIT_CLASSIFICATION, TRAINING_DATA_CLASSIFICATION,
                ExplorationHtmlFormatterService, ResponsesService,
                stateCustomizationArgsService, TrainingDataService,
                TrainingModalService, FocusManagerService) {
              var _explorationId = ExplorationContextService.getExplorationId();
              var _stateName = EditorStateService.getActiveStateName();
              var _state = ExplorationStatesService.getState(_stateName);
              var answerGroupIndex = (
                ResponsesService.getActiveAnswerGroupIndex());

              var FOCUS_LABEL_TEST_INTERACTION_INPUT = 'testInteractionInput';
              $scope.stateContent = _state.content.getHtml();
              $scope.inputTemplate = (
                ExplorationHtmlFormatterService.getInteractionHtml(
                  stateInteractionIdService.savedMemento,
                  stateCustomizationArgsService.savedMemento,
                  false, FOCUS_LABEL_TEST_INTERACTION_INPUT));
              $scope.trainingData = [];
              $scope.answerGroupHasNonEmptyRules = (
                ResponsesService.getAnswerGroup(
                  answerGroupIndex).rules.length > 0);

              var _rebuildTrainingData = function() {
                $scope.trainingData = [];
                TrainingDataService.getTrainingDataOfAnswerGroup(
                  answerGroupIndex).forEach(function(answer) {
                  var answerTemplate = (
                    ExplorationHtmlFormatterService.getAnswerHtml(
                      answer, stateInteractionIdService.savedMemento,
                      stateCustomizationArgsService.savedMemento));
                  $scope.trainingData.push({
                    answer: answer,
                    answerTemplate: answerTemplate
                  });
                });
              };

              $scope.init = function() {
                _rebuildTrainingData();
                $scope.newAnswerIsAlreadyResolved = false;
                $scope.answerSuccessfullyAdded = false;
                FocusManagerService.setFocus(
                  FOCUS_LABEL_TEST_INTERACTION_INPUT);
              };

              $scope.removeAnswerFromTrainingData = function(answerIndex) {
                var answer = $scope.trainingData[answerIndex].answer;
                TrainingDataService.removeAnswerFromAnswerGroupTrainingData(
                  answer, answerGroupIndex);
                $scope.trainingData.splice(answerIndex, 1);
              };

              $scope.exit = function() {
                $uibModalInstance.close();
              };

              $scope.submitAnswer = function(newAnswer) {
                $scope.newAnswerIsAlreadyResolved = false;
                $scope.answerSuccessfullyAdded = false;

                var interactionId = stateInteractionIdService.savedMemento;

                var rulesServiceName =
                  AngularNameService.getNameOfInteractionRulesService(
                    interactionId);

                // Inject RulesService dynamically.
                var rulesService = $injector.get(rulesServiceName);

                var newAnswerTemplate = (
                  ExplorationHtmlFormatterService.getAnswerHtml(
                    newAnswer, stateInteractionIdService.savedMemento,
                    stateCustomizationArgsService.savedMemento));

                var classificationResult = (
                  AnswerClassificationService.getMatchingClassificationResult(
                    _explorationId, _stateName, _state,
                    newAnswer, rulesService));
                var newAnswerOutcomeDest = classificationResult.outcome.dest;
                var newAnswerFeedback = classificationResult.outcome.feedback;
                if (newAnswerOutcomeDest === _stateName) {
                  newAnswerOutcomeDest = '(try again)';
                }

                $scope.newAnswerTemplate = newAnswerTemplate;
                $scope.newAnswerFeedback = newAnswerFeedback;
                $scope.newAnswerOutcomeDest = newAnswerOutcomeDest;

                var classificationType = (
                  classificationResult.classificationCategorization);

                // If answer is explicitly classified then show the
                // classification results to the creator.
                if (classificationType === EXPLICIT_CLASSIFICATION ||
                    classificationType === TRAINING_DATA_CLASSIFICATION) {
                  $scope.newAnswerIsAlreadyResolved = true;
                } else {
                  TrainingDataService.associateWithAnswerGroup(
                    answerGroupIndex, newAnswer);
                  _rebuildTrainingData();
                  $scope.answerSuccessfullyAdded = true;
                }
              };

              $scope.openTrainUnresolvedAnswerModal = function(answerIndex) {
                if (($scope.answerGroupHasNonEmptyRules &&
                    $scope.trainingData.length > 0) ||
                    $scope.trainingData.length > 1) {
                  var answer = $scope.trainingData[answerIndex].answer;
                  return TrainingModalService.openTrainUnresolvedAnswerModal(
                    answer, _rebuildTrainingData);
                }
                return;
              };

              $scope.init();
            }]
        });
        // Save the modified training data externally in state content.
        $rootScope.$broadcast('externalSave');
      }
    };
  }
]);
