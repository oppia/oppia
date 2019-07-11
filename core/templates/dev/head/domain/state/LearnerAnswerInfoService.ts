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

require('domain/statistics/statistics-domain.constants.ts');
require(
  'pages/exploration-player-page/services/answer-classification.service.ts');
require('pages/exploration-player-page/services/exploration-engine.service.ts');
require('pages/exploration-player-page/services/player-transcript.service.ts');


var oppia = require('AppInit.ts').module;

oppia.factory('LearnerAnswerInfoService', [
  'AnswerClassificationService', 'ExplorationEngineService',
  'PlayerTranscriptService', 'INTERACTION_IDS_WITHOUT_ANSWER_DETAILS',
  'PROBABILITY_INDEXES',
  function(
    AnswerClassificationService, ExplorationEngineService,
    PlayerTranscriptService, INTERACTION_IDS_WITHOUT_ANSWER_DETAILS,
    PROBABILITY_INDEXES) {
    var submittedAnswerInfoCount= 0;
    var actualProbabilityIndex = null;
    var randomProbabilityIndex = null;

    var getRandomProbabilityIndex = function() {
      var min = 0;
      var max = 100;
      return (Math.floor(Math.random() * (max - min + 1) ) + min) / 100;
    };

    return {
      askLearnerForAnswerInfo: function(
          answer, interactionRulesService) {
        var exploration = ExplorationEngineService.getExploration();
        var stateName = PlayerTranscriptService.getLastStateName();
        var state = exploration.getState(stateName);
        var interactionId = state.interaction.id;
        var defaultOutcome =  state.interaction.defaultOutcome;

        if (INTERACTION_IDS_WITHOUT_ANSWER_DETAILS.indexOf(
          interactionId) !== -1) {
          return false;
        }

        var classificationResult = (
          AnswerClassificationService.getMatchingClassificationResult(
            stateName, state.interaction, answer,
            interactionRulesService));
        var outcome = classificationResult.outcome;

        randomProbabilityIndex = getRandomProbabilityIndex();

        if (outcome !== defaultOutcome) {
          actualProbabilityIndex = PROBABILITY_INDEXES['type_a'];
          console.log('type a');
        } else if (outcome.labelledAsCorrect) {
          actualProbabilityIndex = PROBABILITY_INDEXES['type_b'];
          console.log('type b');
        } else {
          actualProbabilityIndex = PROBABILITY_INDEXES['type_c'];
          console.log('type c');
        }
        console.log(randomProbabilityIndex);
        console.log(actualProbabilityIndex);
        return (randomProbabilityIndex <= actualProbabilityIndex);
      },
      increaseSubmittedAnswerInfoCount: function() {
        submittedAnswerInfoCount++;
      },
      resetSubmittedAnswerInfoCount: function() {
        submittedAnswerInfoCount = 0;
      }
    };
  }
]);
