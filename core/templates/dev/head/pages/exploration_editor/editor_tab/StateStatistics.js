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
  '$rootScope', '$scope', '$uibModal', 'ExplorationDataService',
  'EditorStateService', 'ExplorationStatesService', 'TrainingDataService',
  'stateCustomizationArgsService', 'ExplorationHtmlFormatterService',
  'TrainingModalService', 'INTERACTION_SPECS',
  function(
      $rootScope, $scope, $uibModal, ExplorationDataService, EditorStateService,
      ExplorationStatesService, TrainingDataService,
      stateCustomizationArgsService, ExplorationHtmlFormatterService,
      TrainingModalService, INTERACTION_SPECS) {
    $scope.isInteractionTrainable = false;
    $scope.SHOW_TRAINABLE_UNRESOLVED_ANSWERS =
      GLOBALS.SHOW_TRAINABLE_UNRESOLVED_ANSWERS;

    $scope.initStateStatistics = function(data) {
      $scope.isInteractionTrainable = (
        data.interaction.id &&
        INTERACTION_SPECS[data.interaction.id].is_trainable);

      $scope.trainingDataButtonContentsList = [];

      $rootScope.$on('updatedTrainingData', function() {
        $scope.trainingDataButtonContentsList = [];

        var trainingDataAnswers = TrainingDataService.getTrainingDataAnswers();
        var trainingDataFrequencies = (
          TrainingDataService.getTrainingDataFrequencies());
        for (var i = 0; i < trainingDataAnswers.length; i++) {
          var answerHtml = (
            ExplorationHtmlFormatterService.getShortAnswerHtml(
              trainingDataAnswers[i], data.interaction.id,
              stateCustomizationArgsService.savedMemento));
          $scope.trainingDataButtonContentsList.push({
            answerHtml: answerHtml,
            frequency: trainingDataFrequencies[i]
          });
        }
      });
    };

    $scope.$on('refreshStateEditor', function() {
      $scope.stateName = EditorStateService.getActiveStateName();
      var stateData = ExplorationStatesService.getState($scope.stateName);
      $scope.initStateStatistics(stateData);
    });

    $scope.openTrainUnresolvedAnswerModal = function(trainingDataIndex) {
      return TrainingModalService.openTrainUnresolvedAnswerModal(
        TrainingDataService.getTrainingDataAnswers()[trainingDataIndex], true);
    };
  }
]);
