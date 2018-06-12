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
 * the training data of an answer group.
 */

oppia.factory('TrainingDataEditorPanelService', [
  '$rootScope', '$uibModal', 'AlertsService', 'UrlInterpolationService',
  function($rootScope, $uibModal, AlertsService, UrlInterpolationService) {
    return {
      openTrainingDataEditor: function(externalSave) {
        AlertsService.clearWarnings();
        if (externalSave) {
          $rootScope.$broadcast('externalSave');
        }
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
            function($scope, $injector, $uibModalInstance,
                ExplorationStatesService, EditorStateService,
                AnswerClassificationService, ExplorationContextService,
                stateInteractionIdService, AngularNameService,
                EXPLICIT_CLASSIFICATION, TRAINING_DATA_CLASSIFICATION,
                ExplorationHtmlFormatterService, ResponsesService,
                stateCustomizationArgsService, TrainingDataService) {
              var _explorationId = ExplorationContextService.getExplorationId();
              var _stateName = EditorStateService.getActiveStateName();
              var _state = ExplorationStatesService.getState(_stateName);
              var answerGroupIndex = (
                ResponsesService.getActiveAnswerGroupIndex());

              $scope.stateContent = _state.content.getHtml();
              $scope.inputTemplate = (
                ExplorationHtmlFormatterService.getInteractionHtml(
                  stateInteractionIdService.savedMemento,
                  stateCustomizationArgsService.savedMemento,
                  false, 'testInteractionInput'));
              $scope.trainingData = [];

              var _rebuildTrainingData = function() {
                $scope.trainingData = [];
                TrainingDataService.getTrainingDataOfAnswerGroup(
                  answerGroupIndex).forEach(function(answer) {
                    answerTemplate = (
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
                  $scope.newAnswerIsResolved = false;
                  $scope.answerSuccessfullyAdded = false;
              };

              $scope.removeAnswerFromTrainingData = function(answerIndex) {
                answer = $scope.trainingData[answerIndex].answer;
                TrainingDataService.removeAnswerFromAnswerGroupTrainingData(
                  answer, answerGroupIndex);
                $scope.trainingData.splice(answerIndex, 1);
              };

              $scope.exit = function() {
                $uibModalInstance.close();
              };

              $scope.submitAnswer = function(newAnswer) {
                $scope.newAnswerIsResolved = false;
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
                var newAnswerFeedbackHtml = 'Nothing';
                var newAnswerOutcomeDest = classificationResult.outcome.dest;
                if (classificationResult.outcome.hasNonemptyFeedback()) {
                  newAnswerFeedbackHtml = (
                    classificationResult.outcome.feedback.getHtml());
                }
                if (newAnswerOutcomeDest === _stateName) {
                  dest = '<em>(try again)</em>';
                }

                $scope.newAnswerTemplate = newAnswerTemplate;
                $scope.newAnswerFeedbackHtml = newAnswerFeedbackHtml;
                $scope.newAnswerOutcomeDest = newAnswerOutcomeDest;

                var classificationType = (
                  classificationResult.classificationCategorization);

                // yes / no option to creator. Otherwise we ask whether the
                // add answer to training data.
                if (classificationType === EXPLICIT_CLASSIFICATION ||
                    classificationType === TRAINING_DATA_CLASSIFICATION) {
                  $scope.newAnswerIsResolved = true;
                } else {
                  TrainingDataService.trainAnswerGroup(
                    answerGroupIndex, newAnswer);
                  _rebuildTrainingData();
                  $scope.answerSuccessfullyAdded = true;
                }
              };

              $scope.init();
            }]
        });
      }
    };
  }
]);
