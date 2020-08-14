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
 * @fileoverview Service for training data that adds a new
 * answer to training data and verifies that training data answers are unique
 * across all answer groups.
 */

require('domain/exploration/RuleObjectFactory.ts');
require('pages/exploration-editor-page/services/exploration-states.service.ts');
require('pages/exploration-editor-page/services/graph-data.service.ts');
require(
  'pages/exploration-editor-page/editor-tab/services/responses.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');

angular.module('oppia').factory('TrainingDataService', [
  'ExplorationStatesService', 'GraphDataService',
  'ResponsesService', 'StateEditorService',
  function(
      ExplorationStatesService, GraphDataService,
      ResponsesService, StateEditorService) {
    var _getIndexOfTrainingData = function(answer, trainingData) {
      var index = -1;
      for (var i = 0; i < trainingData.length; i++) {
        if (angular.equals(trainingData[i], answer)) {
          index = i;
          break;
        }
      }
      return index;
    };

    // Attempts to remove a given answer from a list of trained answers. This
    // function returns the index of the answer that was removed if it was
    // successfully removed from the training data, or -1 otherwise.
    var _removeAnswerFromTrainingData = function(answer, trainingData) {
      var index = _getIndexOfTrainingData(answer, trainingData);
      if (index !== -1) {
        trainingData.splice(index, 1);
      }
      return index;
    };

    // This removes any occurrences of the answer from any training data inputs
    // or the confirmed unclassified answer list. It also removes the answer
    // from the training data being presented to the user so that it does not
    // show up again.
    var _removeAnswer = function(answer) {
      var answerGroups = ResponsesService.getAnswerGroups();
      var confirmedUnclassifiedAnswers = (
        ResponsesService.getConfirmedUnclassifiedAnswers());
      var updatedAnswerGroups = false;
      var updatedConfirmedUnclassifiedAnswers = false;

      // Remove the answer from all answer groups.
      for (var i = 0; i < answerGroups.length; i++) {
        var answerGroup = answerGroups[i];
        var trainingData = answerGroup.trainingData;
        if (trainingData &&
            _removeAnswerFromTrainingData(answer, trainingData) !== -1) {
          updatedAnswerGroups = true;
        }
      }

      // Remove the answer from the confirmed unclassified answers.
      updatedConfirmedUnclassifiedAnswers = (_removeAnswerFromTrainingData(
        answer, confirmedUnclassifiedAnswers) !== -1);

      if (updatedAnswerGroups) {
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
          });
      }

      if (updatedConfirmedUnclassifiedAnswers) {
        ResponsesService.updateConfirmedUnclassifiedAnswers(
          confirmedUnclassifiedAnswers);
        ExplorationStatesService.saveConfirmedUnclassifiedAnswers(
          StateEditorService.getActiveStateName(),
          angular.copy(confirmedUnclassifiedAnswers));
      }
    };

    return {
      getTrainingDataAnswers: function() {
        var trainingDataAnswers = [];
        var answerGroups = ResponsesService.getAnswerGroups();

        for (var i = 0; i < answerGroups.length; i++) {
          var answerGroup = answerGroups[i];
          trainingDataAnswers.push({
            answerGroupIndex: i,
            answers: answerGroup.trainingData
          });
        }
        return trainingDataAnswers;
      },

      getTrainingDataOfAnswerGroup: function(answerGroupIndex) {
        return ResponsesService.getAnswerGroup(answerGroupIndex).trainingData;
      },

      getAllPotentialOutcomes: function(state) {
        var potentialOutcomes = [];
        var interaction = state.interaction;

        for (var i = 0; i < interaction.answerGroups.length; i++) {
          potentialOutcomes.push(interaction.answerGroups[i].outcome);
        }

        if (interaction.defaultOutcome) {
          var outcome = interaction.defaultOutcome;
          potentialOutcomes.push(interaction.defaultOutcome);
        }

        return potentialOutcomes;
      },

      associateWithAnswerGroup: function(answerGroupIndex, answer) {
        // Remove answer from traning data of any answer group or
        // confirmed unclassified answers.
        _removeAnswer(answer);

        var answerGroups = ResponsesService.getAnswerGroups();
        var answerGroup = answerGroups[answerGroupIndex];

        // Train the rule to include this answer.
        answerGroup.trainingData.push(answer);
        ResponsesService.updateAnswerGroup(answerGroupIndex, {
          trainingData: answerGroup.trainingData
        }, function(newAnswerGroups) {
          ExplorationStatesService.saveInteractionAnswerGroups(
            StateEditorService.getActiveStateName(),
            angular.copy(newAnswerGroups));

          GraphDataService.recompute();
        });
      },

      associateWithDefaultResponse: function(answer) {
        // Remove answer from traning data of any answer group or
        // confirmed unclassified answers.
        _removeAnswer(answer);

        var confirmedUnclassifiedAnswers = (
          ResponsesService.getConfirmedUnclassifiedAnswers());
        confirmedUnclassifiedAnswers.push(answer);
        ResponsesService.updateConfirmedUnclassifiedAnswers(
          confirmedUnclassifiedAnswers);
        ExplorationStatesService.saveConfirmedUnclassifiedAnswers(
          StateEditorService.getActiveStateName(),
          angular.copy(confirmedUnclassifiedAnswers));
      },

      isConfirmedUnclassifiedAnswer: function(answer) {
        return (_getIndexOfTrainingData(
          answer, ResponsesService.getConfirmedUnclassifiedAnswers()) !== -1);
      },

      removeAnswerFromAnswerGroupTrainingData: function(
          answer, answerGroupIndex) {
        var trainingData = ResponsesService.getAnswerGroup(
          answerGroupIndex).trainingData;
        _removeAnswerFromTrainingData(answer, trainingData);

        var answerGroups = ResponsesService.getAnswerGroups();
        answerGroups[answerGroupIndex].trainingData = trainingData;

        ResponsesService.updateAnswerGroup(answerGroupIndex, {
          trainingData: trainingData
        }, function(newAnswerGroups) {
          ExplorationStatesService.saveInteractionAnswerGroups(
            StateEditorService.getActiveStateName(),
            angular.copy(newAnswerGroups));

          GraphDataService.recompute();
        });
      }
    };
  }
]);
