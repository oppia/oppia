// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for learner answer info.
 */

require(
  'pages/exploration-player-page/services/answer-classification.service.ts');
require('domain/statistics/learner-answer-details-backend-api.service.ts');

angular.module('oppia').factory('LearnerAnswerInfoService', [
  'AnswerClassificationService', 'LearnerAnswerDetailsBackendApiService',
  'INTERACTION_IDS_WITHOUT_ANSWER_DETAILS',
  function(
      AnswerClassificationService, LearnerAnswerDetailsBackendApiService,
      INTERACTION_IDS_WITHOUT_ANSWER_DETAILS) {
    var submittedAnswerInfoCount = 0;
    var currentEntityId = null;
    var stateName = null;
    var interactionId = null;
    var currentAnswer = null;
    var currentInteractionRulesService = null;
    var canAskLearnerForAnswerInfo = false;
    var visitedStates = [];
    var probabilityIndexes = {
      // The probability that a request for explanation of the answer that is
      // submitted by the learner. There are three different probabilities
      // based on the outcome of the answer.
      // The probability index when the outcome is equal to the default outcome
      // for an interaction.
      typeA: 0.25,
      // The probability index when the outcome is marked as correct i.e
      // labelled_as_correct property is true.
      typeB: 0.10,
      // The probability index when the outcome is not the default outcome
      // and it is not marked as correct i.e. it is any general outcome.
      typeC: 0.05
    };

    var getRandomProbabilityIndex = function() {
      var min = 0;
      var max = 100;
      return (Math.floor(Math.random() * (max - min + 1) ) + min) / 100;
    };

    return {
      initLearnerAnswerInfoService: function(
          entityId, state, answer, interactionRulesService,
          alwaysAskLearnerForAnswerInfo) {
        currentEntityId = entityId;
        currentAnswer = answer;
        currentInteractionRulesService = interactionRulesService;
        stateName = state.name;
        interactionId = state.interaction.id;
        var defaultOutcome = state.interaction.defaultOutcome;

        if (submittedAnswerInfoCount === 2) {
          return;
        }

        if (!state.solicitAnswerDetails) {
          return;
        }

        if (INTERACTION_IDS_WITHOUT_ANSWER_DETAILS.indexOf(
          interactionId) !== -1) {
          return;
        }

        if (visitedStates.indexOf(stateName) !== -1) {
          return;
        }

        if (alwaysAskLearnerForAnswerInfo === true) {
          canAskLearnerForAnswerInfo = true;
          return;
        }

        var classificationResult = (
          AnswerClassificationService.getMatchingClassificationResult(
            stateName, state.interaction, answer,
            interactionRulesService));
        var outcome = classificationResult.outcome;
        var thresholdProbabilityIndex = null;
        var randomProbabilityIndex = getRandomProbabilityIndex();
        if (outcome === defaultOutcome) {
          thresholdProbabilityIndex = probabilityIndexes.typeA;
        } else if (outcome.labelledAsCorrect) {
          thresholdProbabilityIndex = probabilityIndexes.typeB;
        } else {
          thresholdProbabilityIndex = probabilityIndexes.typeC;
        }
        canAskLearnerForAnswerInfo = (
          randomProbabilityIndex <= thresholdProbabilityIndex);
      },
      resetSubmittedAnswerInfoCount: function() {
        submittedAnswerInfoCount = 0;
      },
      recordLearnerAnswerInfo: function(answerDetails) {
        LearnerAnswerDetailsBackendApiService.recordLearnerAnswerDetails(
          currentEntityId, stateName, interactionId, currentAnswer,
          answerDetails);
        submittedAnswerInfoCount++;
        visitedStates.push(stateName);
        canAskLearnerForAnswerInfo = false;
      },
      canAskLearnerForAnswerInfo: function() {
        return canAskLearnerForAnswerInfo;
      },
      getCurrentAnswer: function() {
        return currentAnswer;
      },
      getCurrentInteractionRulesService: function() {
        return currentInteractionRulesService;
      },
      getSolicitAnswerDetailsQuestion: function() {
        var el = $('<p>');
        el.attr('translate', 'I18N_SOLICIT_ANSWER_DETAILS_QUESTION');
        return ($('<span>').append(el)).html();
      },
      getSolicitAnswerDetailsFeedback: function() {
        var el = $('<p>');
        el.attr('translate', 'I18N_SOLICIT_ANSWER_DETAILS_FEEDBACK');
        return ($('<span>').append(el)).html();
      }
    };
  }
]);
