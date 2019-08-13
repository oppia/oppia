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
 * @fileoverview Service to get learner answer info data and to delete
 * any learner answer info.
 */

require('domain/utilities/UrlInterpolationService.ts');

angular.module('oppia').factory('LearnerAnswerInfoDataService', [
  '$http', '$q', 'UrlInterpolationService',
  function($http, $q, UrlInterpolationService) {
    var learnerAnswerInfoDataDict = null;
    var LEARNER_ANSWER_INFO_DATA_URL = (
      '/learneranswerinfohandler/learner_answer_details/<entity_type>' +
      '/<entity_id>');

    var _fetchLearnerAnswerInfoData = function(
      entityId, stateName, successCallback, errorCallback) {
      var learnerAnswerInfoDataUrl = UrlInterpolationService.interpolateUrl(
        LEARNER_ANSWER_INFO_DATA_URL, {
          entity_type: 'exploration',
          entity_id: entityId});

      $http.get(learnerAnswerInfoDataUrl, {
        params:  {
          state_name: stateName
        }
      }).then(function(response) {
        learnerAnswerInfoDataDict = angular.copy(response);
        if (successCallback) {
          successCallback();
        }
      }, function(errorResponse) {
        if (errorCallback) {
          errorCallback(errorResponse.data);
        }
      });
    };

    var _deleteLearnerAnswerInfo = function(
      entityId, stateName, learnerAnswerInfoId, successCallback,
      errorCallback) {
      var learnerAnswerInfoDataUrl = UrlInterpolationService.interpolateUrl(
        LEARNER_ANSWER_INFO_DATA_URL, {
          entity_type: 'exploration',
          entity_id: entityId});
      $http.delete(learnerAnswerInfoDataUrl, {
        params:  {
          state_name: stateName,
          learner_answer_info_id: learnerAnswerInfoId
        }
      }).then(function(response) {
        if (successCallback) {
          successCallback(response.status);
        }
      }, function(errorResponse) {
        if (errorCallback) {
          errorCallback(errorResponse.data);
        }
      });

    };

    return {
      fetchLearnerAnswerInfoData: function(entityId, stateName) {
        return $q(function(resolve, reject) {
          _fetchLearnerAnswerInfoData(entityId, stateName, resolve, reject);
        });
      },
      deleteLearnerAnswerInfo: function(entityId, stateName, learnerAnswerInfoId) {
        return $q(function(resolve, reject) {
          _deleteLearnerAnswerInfo('S1gV5uqVaJKE', 'Introduction', 'WzE1NjU2NDY2NTIxMzkuODI3XQ==WzUxODVd', resolve, reject);
        });
      }
    };
  }
]);
