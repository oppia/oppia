// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Controller for TrainingDataEditorPanelService modal.
 */
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-interaction-id.service');
require(
  'pages/exploration-editor-page/editor-tab/services/responses.service.ts');

angular.module('oppia').controller(
  'TrainingDataEditorPanelServiceModalController', [
    '$filter', '$injector', '$scope', '$uibModalInstance',
    'AlertsService', 'AngularNameService', 'AnswerClassificationService',
    'CurrentInteractionService', 'ExplorationHtmlFormatterService',
    'ExplorationStatesService', 'FocusManagerService', 'ResponsesService',
    'StateCustomizationArgsService', 'StateEditorService',
    'StateInteractionIdService', 'TrainingDataService', 'TrainingModalService',
    'EXPLICIT_CLASSIFICATION', 'TRAINING_DATA_CLASSIFICATION',
    function(
        $filter, $injector, $scope, $uibModalInstance,
        AlertsService, AngularNameService, AnswerClassificationService,
        CurrentInteractionService, ExplorationHtmlFormatterService,
        ExplorationStatesService, FocusManagerService, ResponsesService,
        StateCustomizationArgsService, StateEditorService,
        StateInteractionIdService, TrainingDataService, TrainingModalService,
        EXPLICIT_CLASSIFICATION, TRAINING_DATA_CLASSIFICATION) {
      var _stateName = StateEditorService.getActiveStateName();
      $scope.stateName = _stateName;
      var _state = ExplorationStatesService.getState(_stateName);
      var answerGroupIndex = (
        ResponsesService.getActiveAnswerGroupIndex());
      var FOCUS_LABEL_TEST_INTERACTION_INPUT = 'testInteractionInput';

      $scope.stateContent = _state.content.html;
      $scope.trainingData = [];
      $scope.answerGroupHasNonEmptyRules = (
        ResponsesService.getAnswerGroup(
          answerGroupIndex).rules.length > 0);
      $scope.inputTemplate = (
        ExplorationHtmlFormatterService.getInteractionHtml(
          StateInteractionIdService.savedMemento,
          StateCustomizationArgsService.savedMemento,
          false, FOCUS_LABEL_TEST_INTERACTION_INPUT, null));

      var _rebuildTrainingData = function() {
        $scope.trainingData = [];
        TrainingDataService.getTrainingDataOfAnswerGroup(
          answerGroupIndex).forEach(function(answer) {
          var answerTemplate = (
            ExplorationHtmlFormatterService.getAnswerHtml(
              answer, StateInteractionIdService.savedMemento,
              StateCustomizationArgsService.savedMemento));
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

        var interactionId = StateInteractionIdService.savedMemento;

        var rulesServiceName =
          AngularNameService.getNameOfInteractionRulesService(
            interactionId);

        // Inject RulesService dynamically.
        var rulesService = $injector.get(rulesServiceName);

        var newAnswerTemplate = (
          ExplorationHtmlFormatterService.getAnswerHtml(
            newAnswer, StateInteractionIdService.savedMemento,
            StateCustomizationArgsService.savedMemento));

        var classificationResult = (
          AnswerClassificationService.getMatchingClassificationResult(
            _stateName, _state.interaction, newAnswer, rulesService));
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
          var truncatedAnswer = $filter(
            'truncateInputBasedOnInteractionAnswerType')(
            newAnswer, interactionId, 12);
          var successToast = (
            'The answer ' + truncatedAnswer +
            ' has been successfully trained.');
          AlertsService.addSuccessMessage(
            successToast, 1000);
          _rebuildTrainingData();
        }
      };

      CurrentInteractionService.setOnSubmitFn($scope.submitAnswer);

      $scope.openTrainUnresolvedAnswerModal = function(answerIndex) {
        // An answer group must have either a rule or at least one
        // answer in training data. Don't allow modification of training
        // data answers if there are no rules and only one training data
        // answer is present.
        if (($scope.answerGroupHasNonEmptyRules &&
            $scope.trainingData.length > 0) ||
            $scope.trainingData.length > 1) {
          var answer = $scope.trainingData[answerIndex].answer;
          var interactionId = StateInteractionIdService.savedMemento;
          return TrainingModalService.openTrainUnresolvedAnswerModal(
            answer, function() {
              var truncatedAnswer = $filter(
                'truncateInputBasedOnInteractionAnswerType')(
                answer, interactionId, 12);
              var successToast = (
                'The answer ' + truncatedAnswer +
                ' has been successfully trained.');
              AlertsService.addSuccessMessage(
                successToast, 1000);
              _rebuildTrainingData();
            });
        }
        return;
      };

      $scope.init();
    }]);
