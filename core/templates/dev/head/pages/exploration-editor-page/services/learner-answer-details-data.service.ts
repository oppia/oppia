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
require('domain/utilities/url-interpolation.service.ts');
require('domain/statistics/LearnerAnswerInfoObjectFactory.ts');
require('domain/statistics/LearnerAnswerDetailsObjectFactory.ts');

angular.module('oppia').factory('LearnerAnswerDetailsDataService', [
  '$http', '$q', 'ExplorationDataService', 'LearnerAnswerDetailsObjectFactory',
  'LearnerAnswerInfoObjectFactory', 'UrlInterpolationService',
  function(
      $http, $q, ExplorationDataService, LearnerAnswerDetailsObjectFactory,
      LearnerAnswerInfoObjectFactory, UrlInterpolationService) {
    var _expId = ExplorationDataService.explorationId;
    var _data = [];
    var learnerAnswerInfoData = null;
    var LEARNER_ANSWER_INFO_DATA_URL = (
      '/learneranswerinfohandler/learner_answer_details/<entity_type>/' +
      '<entity_id>');

    var _fetchLearnerAnswerInfoData = function() {
      var learnerAnswerInfoDataUrl = UrlInterpolationService.interpolateUrl(
        LEARNER_ANSWER_INFO_DATA_URL, {
          entity_type: 'exploration',
          entity_id: _expId});

      return $http.get(learnerAnswerInfoDataUrl);
    };

    var _deleteLearnerAnswerInfo = function(
        entityId, stateName, learnerAnswerInfoId) {
      var learnerAnswerInfoDataUrl = UrlInterpolationService.interpolateUrl(
        LEARNER_ANSWER_INFO_DATA_URL, {
          entity_type: 'exploration',
          entity_id: entityId});
      return $http['delete'](learnerAnswerInfoDataUrl, {
        params: {
          state_name: stateName,
          learner_answer_info_id: learnerAnswerInfoId
        }
      });
    };

    return {
      getData: function() {
        return _data;
      },
      fetchLearnerAnswerInfoData: function() {
        return _fetchLearnerAnswerInfoData().then(function(response) {
          learnerAnswerInfoData = angular.copy(
            response.data.learner_answer_info_data);
          for (var i = 0; i < learnerAnswerInfoData.length; i++) {
            var stateName = learnerAnswerInfoData[i].state_name;
            var interactionId = learnerAnswerInfoData[i].interaction_id;
            var customizationArgs = learnerAnswerInfoData[i].customization_args;
            var learnerAnswerInfoDicts = (
              learnerAnswerInfoData[i].learner_answer_info_dicts);
            var learnerAnswerDetails = (
              // eslint-disable-next-line max-len
              LearnerAnswerDetailsObjectFactory.createDefaultLearnerAnswerDetails(
                _expId, stateName, interactionId, customizationArgs,
                learnerAnswerInfoDicts.map(
                  LearnerAnswerInfoObjectFactory.createFromBackendDict)));
            _data.push(learnerAnswerDetails);
          }
          return response.data;
        });
      },
      deleteLearnerAnswerInfo: function(
          entityId, stateName, learnerAnswerInfoId) {
        return _deleteLearnerAnswerInfo(
          entityId, stateName, learnerAnswerInfoId).then(function(response) {
          return response.status;
        }, function(errorResponse) {
          return $q.reject(errorResponse.data);
        });
      }
    };
  }
]);
