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
 * @fileoverview Controller for TrainingModal.
 */
require(
  'pages/exploration-editor-page/editor-tab/training-panel/' +
  'training-panel.component.ts');

require('domain/exploration/AnswerGroupObjectFactory.ts');
require('domain/utilities/url-interpolation.service.ts');
require('pages/exploration-editor-page/services/angular-name.service.ts');
require('pages/exploration-editor-page/services/exploration-states.service.ts');
require(
  'pages/exploration-editor-page/services/exploration-warnings.service.ts');
require('pages/exploration-editor-page/services/graph-data.service.ts');
require(
  'pages/exploration-editor-page/editor-tab/services/responses.service.ts');
require(
  'pages/exploration-editor-page/editor-tab/training-panel/' +
  'training-data.service.ts');
require(
  'pages/exploration-player-page/services/answer-classification.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-interaction-id.service');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-property.service.ts');
require('services/alerts.service.ts');
require('services/context.service.ts');
require('expressions/expression-interpolation.service.ts');
require(
  'pages/exploration-editor-page/services/' +
  'exploration-param-changes.service.ts');
require('pages/exploration-editor-page/services/exploration-states.service.ts');
require('pages/exploration-editor-page/services/graph-data.service.ts');
require('pages/exploration-editor-page/services/parameter-metadata.service.ts');
require(
  'pages/exploration-editor-page/editor-tab/services/' +
  'solution-validity.service.ts');
require('services/improvements.service.ts');
require('services/state-top-answers-stats.service.ts');

require(
  'pages/exploration-editor-page/exploration-editor-page.constants.ajs.ts');

angular.module('oppia').controller('TrainingModalController', [
  '$injector', '$scope', '$uibModalInstance', 'AngularNameService',
  'AnswerClassificationService', 'AnswerGroupObjectFactory',
  'ExplorationStatesService', 'ExplorationWarningsService', 'GraphDataService',
  'ResponsesService', 'StateEditorService', 'StateInteractionIdService',
  'TrainingDataService', 'finishTrainingCallback', 'unhandledAnswer',
  function(
      $injector, $scope, $uibModalInstance, AngularNameService,
      AnswerClassificationService, AnswerGroupObjectFactory,
      ExplorationStatesService, ExplorationWarningsService, GraphDataService,
      ResponsesService, StateEditorService, StateInteractionIdService,
      TrainingDataService, finishTrainingCallback, unhandledAnswer) {
    $scope.trainingDataAnswer = '';

    // See the training panel directive in ExplorationEditorTab for an
    // explanation on the structure of this object.
    $scope.classification = {
      answerGroupIndex: 0,
      newOutcome: null
    };
    $scope.addingNewResponse = false;

    var _saveNewAnswerGroup = function(newAnswerGroup) {
      var answerGroups = ResponsesService.getAnswerGroups();
      answerGroups.push(newAnswerGroup);
      ResponsesService.save(
        answerGroups, ResponsesService.getDefaultOutcome(),
        function(newAnswerGroups, newDefaultOutcome) {
          ExplorationStatesService.saveInteractionAnswerGroups(
            StateEditorService.getActiveStateName(),
            angular.copy(newAnswerGroups));

          ExplorationStatesService.saveInteractionDefaultOutcome(
            StateEditorService.getActiveStateName(),
            angular.copy(newDefaultOutcome));

          GraphDataService.recompute();
          ExplorationWarningsService.updateWarnings();
        });
    };

    $scope.exitTrainer = function() {
      $uibModalInstance.close();
    };

    $scope.onConfirm = function() {
      var index = $scope.classification.answerGroupIndex;
      if (index > ResponsesService.getAnswerGroupCount()) {
        var newOutcome = $scope.classification.newOutcome;
        var newAnswerGroup = AnswerGroupObjectFactory.createNew(
          [], angular.copy(newOutcome), [unhandledAnswer], null);
        _saveNewAnswerGroup(newAnswerGroup);
        TrainingDataService.associateWithAnswerGroup(
          ResponsesService.getAnswerGroupCount() - 1,
          unhandledAnswer);
      } else if (index === ResponsesService.getAnswerGroupCount()) {
        TrainingDataService.associateWithDefaultResponse(
          unhandledAnswer);
      } else {
        TrainingDataService.associateWithAnswerGroup(
          index, unhandledAnswer);
      }
      finishTrainingCallback();
      $uibModalInstance.close();
    };

    $scope.init = function() {
      var currentStateName =
        StateEditorService.getActiveStateName();
      var state = ExplorationStatesService.getState(currentStateName);

      // Retrieve the interaction ID.
      var interactionId = StateInteractionIdService.savedMemento;

      var rulesServiceName =
        AngularNameService.getNameOfInteractionRulesService(
          interactionId);

      // Inject RulesService dynamically.
      var rulesService = $injector.get(rulesServiceName);

      var classificationResult = (
        AnswerClassificationService.getMatchingClassificationResult(
          currentStateName, state.interaction, unhandledAnswer,
          rulesService));

      // $scope.trainingDataAnswer, $scope.trainingDataFeedback
      // $scope.trainingDataOutcomeDest are intended to be local
      // to this modal and should not be used to populate any
      // information in the active exploration (including the
      // feedback). The feedback here refers to a representation
      // of the outcome of an answer group, rather than the
      // specific feedback of the outcome (for instance, it
      // includes the destination state within the feedback).
      $scope.trainingDataAnswer = unhandledAnswer;
      $scope.classification.answerGroupIndex = (
        classificationResult.answerGroupIndex);
      $scope.classification.newOutcome = classificationResult.outcome;
    };

    $scope.init();
  }
]);
