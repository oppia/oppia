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

require('pages/exploration-editor-page/services/exploration-data.service.ts');
require('domain/utilities/UrlInterpolationService.ts');
require('domain/statistics/LearnerAnswerInfoObjectFactory.ts')
require('domain/statistics/LearnerAnswerDetailsObjectFactory.ts')

angular.module('oppia').factory('LearnerAnswerDetailsDataService', [
  '$http', '$q', 'ExplorationDataService', 'LearnerAnswerDetailsObjectFactory', 'LearnerAnswerInfoObjectFactory', 'UrlInterpolationService',
  function($http, $q, ExplorationDataService, LearnerAnswerDetailsObjectFactory, LearnerAnswerInfoObjectFactory, UrlInterpolationService) {
    var _expId = ExplorationDataService.explorationId;
    var _data = [];
    var learnerAnswerInfoData = null;
    var LEARNER_ANSWER_INFO_DATA_URL = (
      '/learneranswerinfohandler/learner_answer_details/<entity_type>' +
      '/<entity_id>');

    var _fetchLearnerAnswerInfoData = function(
      successCallback, errorCallback) {
      var learnerAnswerInfoDataUrl = UrlInterpolationService.interpolateUrl(
        LEARNER_ANSWER_INFO_DATA_URL, {
          entity_type: 'exploration',
          entity_id: _expId});

      $http.get(learnerAnswerInfoDataUrl).then(function(response) {
        learnerAnswerInfoData = angular.copy(response.data.learner_answer_info_dict_list);
        for(var i = 0; i < learnerAnswerInfoData.length; i++) {
          var stateName = Object.keys(learnerAnswerInfoData[i])[0];
          var learnerAnswerInfoDicts = learnerAnswerInfoData[i][stateName];
          var learnerAnswerDetails = LearnerAnswerDetailsObjectFactory.createDefaultLearnerAnswerDetails(
            _expId, stateName, learnerAnswerInfoDicts.map(
              LearnerAnswerInfoObjectFactory.createFromBackendDict));
          _data.push(learnerAnswerDetails);
        }
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
      getData: function() {
        return _data;
      },
      fetchLearnerAnswerInfoData: function() {
        return $q(function(resolve, reject) {
          _fetchLearnerAnswerInfoData(resolve, reject);
        });
      },
      deleteLearnerAnswerInfo: function(entityId, stateName, learnerAnswerInfoId) {
        return $q(function(resolve, reject) {
          _deleteLearnerAnswerInfo(entityId, stateName, learnerAnswerInfoId, resolve, reject);
        });
      }
    };
  }
]);
