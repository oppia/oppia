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
 * @fileoverview Controllers for the unresolved answers section of the
 *   state editor.
 *
 * @author sll@google.com (Sean Lip)
 */

oppia.controller('StateStatistics', [
    '$rootScope', '$scope', '$modal', 'explorationData', 'editorContextService',
    'explorationStatesService', 'trainingDataService',
    'stateCustomizationArgsService', 'oppiaExplorationHtmlFormatterService',
    'warningsData', 'INTERACTION_SPECS',
    function($rootScope, $scope, $modal, explorationData, editorContextService,
      explorationStatesService, trainingDataService,
      stateCustomizationArgsService, oppiaExplorationHtmlFormatterService,
      warningsData, INTERACTION_SPECS) {
  $scope.unresolvedAnswersList = [];
  $scope.isInteractionTrainable = false;

  var INTERACTIONS_WITHOUT_UNRESOLVED_ANSWERS = ['Continue'];

  $scope.initStateStatistics = function(data) {
    // Do not show unresolved answers if the interaction is of type 'Continue'.
    $scope.unresolvedAnswers = (
      INTERACTIONS_WITHOUT_UNRESOLVED_ANSWERS.indexOf(
        data.interaction.id) !== -1 ?
      {} : data.unresolved_answers);
    $scope.generateUnresolvedAnswersList();

    $scope.isInteractionTrainable = (
      data.interaction.id &&
      INTERACTION_SPECS[data.interaction.id].is_trainable);

    $scope.trainingDataHtmlList = [];

    $rootScope.$on('updatedTrainingData', function() {
      $scope.trainingDataHtmlList = [];

      var trainingDataAnswers = trainingDataService.getTrainingDataAnswers();
      var trainingDataCounts = trainingDataService.getTrainingDataCounts();
      for (var i = 0; i < trainingDataAnswers.length; i++) {
        var answerHtml = (
          oppiaExplorationHtmlFormatterService.getShortAnswerHtml(
            trainingDataAnswers[i], data.interaction.id,
            stateCustomizationArgsService.savedMemento));
        answerHtml += '<span style="margin-left: 8px;"><em>';
        answerHtml += trainingDataCounts[i] + ' time';
        answerHtml += (trainingDataCounts[i] != 1 ? 's' : '');
        answerHtml += '</em></span>';
        $scope.trainingDataHtmlList.push(answerHtml);
      }
    });
  };

  $scope.$on('refreshStateEditor', function(evt) {
    $scope.stateName = editorContextService.getActiveStateName();
    var stateData = explorationStatesService.getState($scope.stateName);
    $scope.initStateStatistics(stateData);
  });

  $scope.generateUnresolvedAnswersList = function() {
    $scope.unresolvedAnswersList = [];
    for (var answerItem in $scope.unresolvedAnswers) {
      $scope.unresolvedAnswersList.push({
        'answer': answerItem,
        'count': $scope.unresolvedAnswers[answerItem]
      });
    }
  };

  $scope.deleteUnresolvedAnswer = function(answer) {
    $scope.unresolvedAnswers[answer] = 0;
    explorationData.resolveAnswers($scope.stateName, [answer]);
    $scope.generateUnresolvedAnswersList();
  };

  $scope.openTrainUnresolvedAnswerModal = function(trainingDataIndex) {
    warningsData.clear();
    $rootScope.$broadcast('externalSave');

    $modal.open({
      templateUrl: 'modals/trainUnresolvedAnswer',
      backdrop: true,
      controller: ['$scope', '$modalInstance', 'trainingDataService',
        'explorationStatesService', 'editorContextService',
        'answerClassificationService', 'explorationContextService',
        function($scope, $modalInstance, trainingDataService,
            explorationStatesService, editorContextService,
            answerClassificationService, explorationContextService) {
          $scope.trainingDataAnswer = '';
          $scope.trainingDataFeedback = '';
          $scope.trainingDataOutcomeDest = '';
          $scope.classification = {feedbackIndex: 0, newOutcome: null};

          $scope.finishTraining = function() {
            $modalInstance.close();
          };

          $scope.init = function() {
            var explorationId = explorationContextService.getExplorationId();
            var currentStateName = editorContextService.getActiveStateName();
            var state = explorationStatesService.getState(currentStateName);

            // TODO(bhenning): Use a single classification request specific to
            // the editor view.
            var unhandledAnswers = [
              trainingDataService.getTrainingDataAnswers()[trainingDataIndex]
            ];
            answerClassificationService.getMatchingBatchClassificationResult(
              explorationId, state, unhandledAnswers).success(
                  function(response) {
                var classificationResult = response.results[0];
                var feedback = 'Nothing';
                var dest = classificationResult.outcome.dest;
                if (classificationResult.outcome.feedback.length > 0) {
                  feedback = classificationResult.outcome.feedback[0];
                }
                if (dest == currentStateName) {
                  dest = '<em>(try again)</em>';
                }

                // $scope.trainingDataAnswer, $scope.trainingDataFeedback
                // $scope.trainingDataOutcomeDest are intended to be local to
                // this modal and should not be used to populate any information
                // in the active exploration (including the feedback). The
                // feedback here refers to a representation of the outcome of an
                // answer group, rather than the specific feedback of the
                // outcome (for instance, it includes the destination state
                // within the feedback).
                $scope.trainingDataAnswer = unhandledAnswers[0];
                $scope.trainingDataFeedback = feedback;
                $scope.trainingDataOutcomeDest = dest;
                $scope.classification.feedbackIndex = (
                  classificationResult.answer_group_index);
              });
          };

          $scope.init();
        }]
    });
  };
}]);
