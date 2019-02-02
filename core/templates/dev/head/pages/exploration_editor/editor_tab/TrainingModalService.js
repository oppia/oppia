// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * the training modal used for unresolved answers.
 */

oppia.factory('TrainingModalService', [
  '$rootScope', '$uibModal', 'AlertsService', 'UrlInterpolationService',
  function($rootScope, $uibModal, AlertsService, UrlInterpolationService) {
    return {
      /**
      * Opens unresolved answer trainer modal for given answer.
      * @param {Object} unhandledAnswer - The answer to be trained.
      * @param {requestCallback} finishTrainingCallback - Function to call when
          answer has been trained.
      */
      openTrainUnresolvedAnswerModal: function(
          unhandledAnswer, finishTrainingCallback) {
        AlertsService.clearWarnings();
        $uibModal.open({
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/pages/exploration_editor/editor_tab/' +
            'training_unresolved_answer_modal_directive.html'),
          backdrop: true,
          controller: [
            '$scope', '$injector', '$uibModalInstance',
            'ExplorationStatesService', 'StateEditorService',
            'AnswerClassificationService', 'ContextService',
            'StateInteractionIdService', 'AngularNameService',
            'ResponsesService', 'TrainingDataService',
            'AnswerGroupObjectFactory', 'GraphDataService',
            'ExplorationWarningsService',
            function($scope, $injector, $uibModalInstance,
                ExplorationStatesService, StateEditorService,
                AnswerClassificationService, ContextService,
                StateInteractionIdService, AngularNameService,
                ResponsesService, TrainingDataService,
                AnswerGroupObjectFactory, GraphDataService,
                ExplorationWarningsService) {
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
                $uibModalInstance.dismiss();
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
                $uibModalInstance.close();
                finishTrainingCallback();
              };

              $scope.init = function() {
                var explorationId =
                  ContextService.getExplorationId();
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
                var feedback = 'Nothing';
                var dest = classificationResult.outcome.dest;
                if (classificationResult.outcome.feedback.length > 0) {
                  feedback = classificationResult.outcome.feedback.getHtml();
                }
                if (dest === currentStateName) {
                  dest = '<em>(try again)</em>';
                }

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
