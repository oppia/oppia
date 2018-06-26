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
 * @fileoverview Service to send changes to a skill to the backend.
 */

oppia.factory('EditableSkillBackendApiService', [
  '$http', '$q', 'EDITABLE_SKILL_DATA_URL_TEMPLATE', 'UrlInterpolationService',
  function(
      $http, $q, EDITABLE_SKILL_DATA_URL_TEMPLATE, UrlInterpolationService) {
    var _fetchSkill = function(skillId, successCallback, errorCallback) {
      var skillDataUrl = UrlInterpolationService.interpolateUrl(
        EDITABLE_SKILL_DATA_URL_TEMPLATE, {
          skill_id: skillId
        });

      $http.get(skillDataUrl).then(function(response) {
        var skill = angular.copy(response.data.skill);
        if (successCallback) {
          successCallback(skill);
        }
      }, function(errorResponse) {
        if (errorCallback) {
          errorCallback(errorResponse.data);
        }
      });
    };

    var _updateSkill = function(
        skillId, skillVersion, commitMessage, changeList,
        successCallback, errorCallback) {
      var editableSkillDataUrl = UrlInterpolationService.interpolateUrl(
        EDITABLE_SKILL_DATA_URL_TEMPLATE, {
          skill_id: skillId
        });

      var putData = {
        version: skillVersion,
        commit_message: commitMessage,
        change_dicts: changeList
      };

      $http.put(editableSkillDataUrl, putData).then(function(response) {
        // The returned data is an updated skill dict.
        var skill = angular.copy(response.data.skill);
        if (successCallback) {
          successCallback(skill);
        }
      }, function(errorResponse) {
        if (errorCallback) {
          errorCallback(errorResponse.data);
        }
      });
    };

    return {
      fetchSkill: function(skillId) {
        return $q(function(resolve, reject) {
          _fetchSkill(skillId, resolve, reject);
        });
      },
      updateSkill: function(
          skillId, skillVersion, commitMessage, changeList) {
        return $q(function(resolve, reject) {
          _updateSkill(
            skillId, skillVersion, commitMessage, changeList,
            resolve, reject);
        });
      }
    };
  }
]);
