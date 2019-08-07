// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to send changes to skill mastery to the backend.
 */

angular.module('oppia').factory('SkillMasteryBackendApiService', [
  '$http', '$q', 'SKILL_MASTERY_DATA_URL_TEMPLATE',
  function(
      $http, $q, SKILL_MASTERY_DATA_URL_TEMPLATE) {
    var _fetchSkillMasteryDegrees = function(
        skillIds, successCallback, errorCallback) {
      $http.get(SKILL_MASTERY_DATA_URL_TEMPLATE, {
        params: {
          comma_separated_skill_ids: skillIds.join(',')
        }
      }).then(
        function(response) {
          if (successCallback) {
            successCallback(response.data.degrees_of_mastery);
          }
        }, function(errorResponse) {
          if (errorCallback) {
            errorCallback(errorResponse.data);
          }
        });
    };

    var _updateSkillMasteryDegrees = function(
        masteryPerSkillMapping, successCallback, errorCallback) {
      var putData = {
        mastery_change_per_skill: masteryPerSkillMapping
      };
      $http.put(SKILL_MASTERY_DATA_URL_TEMPLATE, putData).then(
        function(response) {
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
      fetchSkillMasteryDegrees: function(skillIds) {
        return $q(function(resolve, reject) {
          _fetchSkillMasteryDegrees(skillIds, resolve, reject);
        });
      },
      updateSkillMasteryDegrees: function(masteryPerSkillMapping) {
        return $q(function(resolve, reject) {
          _updateSkillMasteryDegrees(masteryPerSkillMapping, resolve, reject);
        });
      }
    };
  }
]);
