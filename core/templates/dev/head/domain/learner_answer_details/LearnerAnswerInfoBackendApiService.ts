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
 * @fileoverview Service to record learner answer info.
 */

require('domain/utilities/UrlInterpolationService.ts');

require('domain/learner_answer_details/learner-answer-info.constants.ts');

var oppia = require('AppInit.ts').module;

oppia.factory('LearnerAnswerInfoBackendApiService', [
  '$http', '$q', 'UrlInterpolationService', 'SUBMIT_LEARNER_ANSWER_INFO_URL',
  function($http, $q, UrlInterpolationService, SUBMIT_LEARNER_ANSWER_INFO_URL) {
    var _recordLearnerAnswerInfo = function(
        expId, stateName, interactionId, answer, answerDetails,
        successCallback, errorCallback) {
      var recordLearnerAnswerInfoUrl = UrlInterpolationService.interpolateUrl(
        SUBMIT_LEARNER_ANSWER_INFO_URL, {
          exploration_id: expId
        });

      var payload = {
        state_name: stateName,
        interaction_id: interactionId,
        answer: answer,
        answer_details: answerDetails
      };

      $http.post(recordLearnerAnswerInfoUrl, payload).then(function(response) {
        if (successCallback) {
          successCallback();
        }
      }, function(errorResponse) {
        if (errorCallback) {
          errorCallback(errorResponse.data);
        }
      });
    };

    return {
      recordLearnerAnswerInfo: function(expId, stateName, interactionId,
          answer, answerDetails) {
        return $q(function(resolve, reject) {
          _recordLearnerAnswerInfo(
            expId, stateName, interactionId, answer, answerDetails,
            resolve, reject);
        });
      }
    };
  }
]);
