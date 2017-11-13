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
 * the training modal used for both unresolved answers
 * and answers within the training data of a classifier.
 */

oppia.factory('TrainingModalService', [
  '$rootScope', '$modal', 'AlertsService',
  function($rootScope, $modal, AlertsService) {
    return {
      openTrainUnresolvedAnswerModal: function(unhandledAnswer, externalSave) {
        AlertsService.clearWarnings();
        if (externalSave) {
          $rootScope.$broadcast('externalSave');
        }

        $modal.open({
          templateUrl: 'modals/trainUnresolvedAnswer',
          backdrop: true,
          controller: [
            '$scope', '$injector', '$modalInstance',
            'explorationStatesService', 'editorContextService',
            'AnswerClassificationService', 'ExplorationContextService',
            'stateInteractionIdService', 'angularNameService',
            function($scope, $injector, $modalInstance,
                explorationStatesService, editorContextService,
                AnswerClassificationService, ExplorationContextService,
                stateInteractionIdService, angularNameService) {
              $scope.trainingDataAnswer = '';
              $scope.trainingDataFeedback = '';
              $scope.trainingDataOutcomeDest = '';

              // See the training panel directive in StateEditor for an
              // explanation on the structure of this object.
              $scope.classification = {
                answerGroupIndex: 0,
                newOutcome: null
              };

              $scope.finishTraining = function() {
                $modalInstance.close();
              };

              $scope.init = function() {
                var explorationId =
                  ExplorationContextService.getExplorationId();
                var currentStateName =
                  editorContextService.getActiveStateName();
                var state = explorationStatesService.getState(currentStateName);

                // Retrieve the interaction ID.
                var interactionId = stateInteractionIdService.savedMemento;

                var rulesServiceName =
                  angularNameService.getNameOfInteractionRulesService(
                    interactionId)

                // Inject RulesService dynamically.
                var rulesService = $injector.get(rulesServiceName);

                var classificationResult = (
                  AnswerClassificationService.getMatchingClassificationResult(
                    explorationId, currentStateName, state, unhandledAnswer,
                    true, rulesService));
                var feedback = 'Nothing';
                var dest = classificationResult.outcome.dest;
                if (classificationResult.outcome.feedback.length > 0) {
                  feedback = classificationResult.outcome.feedback[0];
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
                $scope.trainingDataFeedback = feedback;
                $scope.trainingDataOutcomeDest = dest;
                $scope.classification.answerGroupIndex = (
                  classificationResult.answerGroupIndex);
              };

              $scope.init();
            }]
        });
      }
    };
  }
]);
