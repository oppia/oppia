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

require('domain/state/LearnerAnswerInfoObjectFactory.ts');
require('domain/state/LearnerAnswerInfoBackendApiService.ts');

var oppia = require('AppInit.ts').module;

oppia.factory('LearnerAnswerInfoService', [
  'LearnerAnswerInfoBackendApiService',
  'INTERACTION_IDS_WITHOUT_ANSWER_DETAILS', 'PROBABILITY_INDEXES',
  function(
      LearnerAnswerInfoBackendApiService,
      INTERACTION_IDS_WITHOUT_ANSWER_DETAILS, PROBABILITY_INDEXES) {
    var actualProbabilityIndex = null;
    var randomProbabilityIndex = null;
    var getRandomProbabilityIndex = function() {
      var min = 0;
      var max = 100;
      return (Math.floor(Math.random() * (max - min + 1) ) + min) / 100;
    };

    return {
      askForLearnerAnswerInfo: function(
          interactionId, outcome, defaultOutcome) {
        if (INTERACTION_IDS_WITHOUT_ANSWER_DETAILS.indexOf(
          interactionId) !== -1) {
          return false;
        }
        randomProbabilityIndex = getRandomProbabilityIndex();
        if (outcome !== defaultOutcome) {
          actualProbabilityIndex = PROBABILITY_INDEXES['type_a'];
        } else if (outcome.labelledAsCorrect) {
          actualProbabilityIndex = PROBABILITY_INDEXES['type_b'];
        } else {
          actualProbabilityIndex = PROBABILITY_INDEXES['type_c'];
        }
        return (randomProbabilityIndex <= actualProbabilityIndex);
      },
      recordLearnerAnswerInfo: function(
          stateName, interactionId, answer, answerDetails) {
        LearnerAnswerInfoBackendApiService.recordLearnerAnswerInfo(
          stateName, interactionId, answer, answerDetails);
      }
    };
  }
]);
