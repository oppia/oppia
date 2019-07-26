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
require('domain/statistics/LearnerAnswerDetailsBackendApiService.ts');

var oppia = require('AppInit.ts').module;

oppia.factory('LearnerAnswerInfoService', [
  'AnswerClassificationService', 'LearnerAnswerDetailsBackendApiService',
  'INTERACTION_IDS_WITHOUT_ANSWER_DETAILS', 'PROBABILITY_INDEXES',
  function(
      AnswerClassificationService, LearnerAnswerDetailsBackendApiService,
      INTERACTION_IDS_WITHOUT_ANSWER_DETAILS, PROBABILITY_INDEXES) {
    var submittedAnswerInfoCount = 0;
    var currentEntityId = null;
    var stateName = null;
    var interactionId = null;
    var currentAnswer = null;
    var currentInteractionRulesService = null;
    var canAskLearnerForAnswerInfo = false;
    var visitedStates = [];


    var getRandomProbabilityIndex = function() {
      var min = 0;
      var max = 100;
      return (Math.floor(Math.random() * (max - min + 1) ) + min) / 100;
    };

    return {
      evalAskLearnerForAnswerInfo: function(
          entityId, state, answer, interactionRulesService) {
        currentEntityId = entityId;
        currentAnswer = answer;
        currentInteractionRulesService = interactionRulesService;
        stateName = state.name;
        interactionId = state.interaction.id;
        var defaultOutcome = state.interaction.defaultOutcome;

        if (submittedAnswerInfoCount === 4) {
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

        visitedStates.push(stateName);
        var classificationResult = (
          AnswerClassificationService.getMatchingClassificationResult(
            stateName, state.interaction, answer,
            interactionRulesService));
        var outcome = classificationResult.outcome;
        var thresholdProbabilityIndex = null;
        var randomProbabilityIndex = getRandomProbabilityIndex();
        /* eslint-disable dot-notation */
        if (outcome === defaultOutcome) {
          thresholdProbabilityIndex = PROBABILITY_INDEXES['type_a'];
        } else if (outcome.labelledAsCorrect) {
          thresholdProbabilityIndex = PROBABILITY_INDEXES['type_b'];
        } else {
          thresholdProbabilityIndex = PROBABILITY_INDEXES['type_c'];
        }
        /* eslint-enable dot-notation */
        canAskLearnerForAnswerInfo = (
          randomProbabilityIndex <= thresholdProbabilityIndex);
        return canAskLearnerForAnswerInfo;
      },
      resetSubmittedAnswerInfoCount: function() {
        submittedAnswerInfoCount = 0;
      },
      recordLearnerAnswerInfo: function(answerDetails) {
        LearnerAnswerDetailsBackendApiService.recordLearnerAnswerDetails(
          currentEntityId, stateName, interactionId, currentAnswer,
          answerDetails);
        submittedAnswerInfoCount++;
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
      }
    };
  }
]);
