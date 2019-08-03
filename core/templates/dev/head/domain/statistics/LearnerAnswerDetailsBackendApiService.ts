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

require('domain/statistics/statistics-domain.constants.ts');

angular.module('oppia').factory('LearnerAnswerDetailsBackendApiService', [
  '$http', '$q', 'UrlInterpolationService', 'SUBMIT_LEARNER_ANSWER_DETAILS_URL',
  function(
      $http, $q, UrlInterpolationService, SUBMIT_LEARNER_ANSWER_DETAILS_URL) {
    var _recordLearnerAnswerDetails = function(
        expId, stateName, interactionId, answer, answerDetails,
        successCallback, errorCallback) {
      var recordLearnerAnswerDetailsUrl = (
        UrlInterpolationService.interpolateUrl(
          SUBMIT_LEARNER_ANSWER_DETAILS_URL, {
            entity_type: 'exploration',
            entity_id: expId
          }));

      var payload = {
        state_name: stateName,
        interaction_id: interactionId,
        answer: answer,
        answer_details: answerDetails
      };

      $http.put(recordLearnerAnswerDetailsUrl, payload).then(function(
          response) {
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
      recordLearnerAnswerDetails: function(expId, stateName, interactionId,
          answer, answerDetails) {
        return $q(function(resolve, reject) {
          _recordLearnerAnswerDetails(
            expId, stateName, interactionId, answer, answerDetails,
            resolve, reject);
        });
      }
    };
  }
]);
