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
 */

oppia.controller('StateStatistics', [
  '$rootScope', '$scope', '$modal', 'explorationData', 'editorContextService',
  'explorationStatesService', 'trainingDataService',
  'stateCustomizationArgsService', 'oppiaExplorationHtmlFormatterService',
  'trainingModalService', 'INTERACTION_SPECS',
  function(
      $rootScope, $scope, $modal, explorationData, editorContextService,
      explorationStatesService, trainingDataService,
      stateCustomizationArgsService, oppiaExplorationHtmlFormatterService,
      trainingModalService, INTERACTION_SPECS) {
    $scope.unresolvedAnswersList = [];
    $scope.isInteractionTrainable = false;

    $scope.initStateStatistics = function(data) {
      // Do not show unresolved answers if the interaction has only one possible
      // answer.
      $scope.unresolvedAnswers = (
        (data.interaction.id &&
         !INTERACTION_SPECS[data.interaction.id].is_linear) ?
        data.unresolved_answers : {});
      $scope.generateUnresolvedAnswersList();

      $scope.isInteractionTrainable = (
        data.interaction.id &&
        INTERACTION_SPECS[data.interaction.id].is_trainable);

      $scope.trainingDataButtonContentsList = [];

      $rootScope.$on('updatedTrainingData', function() {
        $scope.trainingDataButtonContentsList = [];

        var trainingDataAnswers = trainingDataService.getTrainingDataAnswers();
        var trainingDataCounts = trainingDataService.getTrainingDataCounts();
        for (var i = 0; i < trainingDataAnswers.length; i++) {
          var answerHtml = (
            oppiaExplorationHtmlFormatterService.getShortAnswerHtml(
              trainingDataAnswers[i], data.interaction.id,
              stateCustomizationArgsService.savedMemento));
          $scope.trainingDataButtonContentsList.push({
            answerHtml: answerHtml,
            count: trainingDataCounts[i]
          });
        }
      });
    };

    $scope.$on('refreshStateEditor', function() {
      $scope.stateName = editorContextService.getActiveStateName();
      var stateData = explorationStatesService.getState($scope.stateName);
      $scope.initStateStatistics(stateData);
    });

    $scope.generateUnresolvedAnswersList = function() {
      $scope.unresolvedAnswersList = [];
      for (var answerItem in $scope.unresolvedAnswers) {
        $scope.unresolvedAnswersList.push({
          answer: answerItem,
          count: $scope.unresolvedAnswers[answerItem]
        });
      }
    };

    $scope.deleteUnresolvedAnswer = function(answer) {
      $scope.unresolvedAnswers[answer] = 0;
      explorationData.resolveAnswers($scope.stateName, [answer]);
      $scope.generateUnresolvedAnswersList();
    };

    $scope.openTrainUnresolvedAnswerModal = function(trainingDataIndex) {
      return trainingModalService.openTrainUnresolvedAnswerModal(
        trainingDataService.getTrainingDataAnswers()[trainingDataIndex], true);
    };
  }
]);
