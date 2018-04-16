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
 * @fileoverview Service for training Data that, given an exploration ID
 * and state name , determines all of the answers which do
 * not have certain classification and are not currently
 * used as part of any classifier training models.
 */

oppia.factory('TrainingDataService', [
  '$rootScope', '$http', 'ResponsesService', 'RULE_TYPE_CLASSIFIER',
  'RuleObjectFactory',
  function(
      $rootScope, $http, ResponsesService, RULE_TYPE_CLASSIFIER,
      RuleObjectFactory) {
    var _trainingDataAnswers = [];
    var _trainingDataFrequencies = [];

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
        var rules = answerGroup.rules;
        var trainingData = null;
        var classifierIndex = -1;
        for (var j = 0; j < rules.length; j++) {
          var rule = rules[j];
          if (rule.type === RULE_TYPE_CLASSIFIER) {
            trainingData = rule.inputs.training_data;
            classifierIndex = j;
            break;
          }
        }
        if (trainingData &&
            _removeAnswerFromTrainingData(answer, trainingData) !== -1) {
          if (trainingData.length === 0 && rules.length > 1) {
            // If the last of the training data for a classifier has been
            // removed and the classifier is not the only rule in the group,
            // remove the rule since it is no longer doing anything.
            rules.splice(classifierIndex, 1);
          }
          updatedAnswerGroups = true;
        }
      }

      // Remove the answer from the confirmed unclassified answers.
      updatedConfirmedUnclassifiedAnswers = (_removeAnswerFromTrainingData(
        answer, confirmedUnclassifiedAnswers) !== -1);

      if (updatedAnswerGroups) {
        ResponsesService.save(
          answerGroups, ResponsesService.getDefaultOutcome());
      }

      if (updatedConfirmedUnclassifiedAnswers) {
        ResponsesService.updateConfirmedUnclassifiedAnswers(
          confirmedUnclassifiedAnswers);
      }

      var index = _removeAnswerFromTrainingData(answer, _trainingDataAnswers);
      if (index !== -1) {
        _trainingDataFrequencies.splice(index, 1);
        $rootScope.$broadcast('updatedTrainingData');
      }
    };

    return {
      initializeTrainingData: function(explorationId, stateName) {
        var trainingDataUrl = '/createhandler/training_data/' + explorationId +
          '/' + encodeURIComponent(stateName);
        $http.get(trainingDataUrl).then(function(response) {
          var unhandledAnswers = response.data.unhandled_answers;
          _trainingDataAnswers = [];
          _trainingDataFrequencies = [];
          for (var i = 0; i < unhandledAnswers.length; i++) {
            var unhandledAnswer = unhandledAnswers[i];
            _trainingDataAnswers.push(unhandledAnswer.answer);
            _trainingDataFrequencies.push(unhandledAnswer.frequency);
          }
          $rootScope.$broadcast('updatedTrainingData');
        });
      },

      getTrainingDataAnswers: function() {
        return _trainingDataAnswers;
      },

      getTrainingDataFrequencies: function() {
        return _trainingDataFrequencies;
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

      trainAnswerGroup: function(answerGroupIndex, answer) {
        _removeAnswer(answer);

        var answerGroup = ResponsesService.getAnswerGroup(answerGroupIndex);
        var rules = answerGroup.rules;

        // Ensure the answer group has a classifier rule.
        var classifierRule = null;
        for (var i = 0; i < rules.length; i++) {
          var rule = rules[i];
          if (rule.type === RULE_TYPE_CLASSIFIER) {
            classifierRule = rule;
            break;
          }
        }
        if (!classifierRule) {
          // Create new classifier rule for classification.
          classifierRule = RuleObjectFactory.createNewClassifierRule();
          rules.push(classifierRule);
        }

        // Train the rule to include this answer, but only if it's not already
        // in the training data.
        if (_getIndexOfTrainingData(
          answer, classifierRule.inputs.training_data) === -1) {
          classifierRule.inputs.training_data.push(answer);
        }

        ResponsesService.updateAnswerGroup(answerGroupIndex, {
          rules: rules
        });
      },

      trainDefaultResponse: function(answer) {
        _removeAnswer(answer);

        var confirmedUnclassifiedAnswers = (
          ResponsesService.getConfirmedUnclassifiedAnswers());

        if (_getIndexOfTrainingData(
          answer, confirmedUnclassifiedAnswers) === -1) {
          confirmedUnclassifiedAnswers.push(answer);
        }

        ResponsesService.updateConfirmedUnclassifiedAnswers(
          confirmedUnclassifiedAnswers);
      }
    };
  }
]);
