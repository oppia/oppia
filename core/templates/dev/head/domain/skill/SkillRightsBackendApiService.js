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
 * @fileoverview Service to change the rights of skills in the backend.
 */

oppia.factory('SkillRightsBackendApiService', [
  '$http', '$q', 'SKILL_RIGHTS_URL_TEMPLATE',
  'SKILL_PUBLISH_URL_TEMPLATE', 'UrlInterpolationService',
  function($http, $q, SKILL_RIGHTS_URL_TEMPLATE,
      SKILL_PUBLISH_URL_TEMPLATE, UrlInterpolationService) {
    // Maps previously loaded skill rights to their IDs.
    var skillRightsCache = {};

    var _fetchSkillRights = function(skillId, successCallback,
        errorCallback) {
      var skillRightsUrl = UrlInterpolationService.interpolateUrl(
        SKILL_RIGHTS_URL_TEMPLATE, {
          skill_id: skillId
        });

      $http.get(skillRightsUrl).then(function(response) {
        if (successCallback) {
          successCallback(response.data);
        }
      }, function(errorResponse) {
        if (errorCallback) {
          errorCallback(errorResponse.data);
        }
      });
    };

    var _setSkillPublic = function(
        skillId, skillVersion, successCallback, errorCallback) {
      var skillRightsPublishUrl = UrlInterpolationService.interpolateUrl(
        SKILL_PUBLISH_URL_TEMPLATE, {
          skill_id: skillId
        });

      var putParams = {
        version: skillVersion
      };

      $http.put(skillRightsPublishUrl, putParams).then(function(response) {
        skillRightsCache[skillId] = response.data;
        if (successCallback) {
          successCallback(response.data);
        }
      }, function(errorResponse) {
        if (errorCallback) {
          errorCallback(errorResponse.data);
        }
      });
    };

    var _isCached = function(skillId) {
      return skillRightsCache.hasOwnProperty(skillId);
    };

    return {
      /**
       * Gets a skill's rights, given its ID.
       */
      fetchSkillRights: function(skillId) {
        return $q(function(resolve, reject) {
          _fetchSkillRights(skillId, resolve, reject);
        });
      },

      /**
       * Behaves exactly as fetchSkillRights (including callback
       * behavior and returning a promise object), except this function will
       * attempt to see whether the given skill rights has been
       * cached. If it has not yet been cached, it will fetch the skill
       * rights from the backend. If it successfully retrieves the skill
       * rights from the backend, it will store it in the cache to avoid
       * requests from the backend in further function calls.
       */
      loadSkillRights: function(skillId) {
        return $q(function(resolve, reject) {
          if (_isCached(skillId)) {
            if (resolve) {
              resolve(skillRightsCache[skillId]);
            }
          } else {
            _fetchSkillRights(skillId, function(skillRights) {
              skillRightsCache[skillId] = skillRights;
              if (resolve) {
                resolve(skillRightsCache[skillId]);
              }
            }, reject);
          }
        });
      },

      /**
       * Returns whether the given skill rights is stored within the
       * local data cache or if it needs to be retrieved from the backend
       * upon a laod.
       */
      isCached: function(skillId) {
        return _isCached(skillId);
      },

      /**
       * Replaces the current skill rights in the cache given by the
       * specified skill ID with a new skill rights object.
       */
      cacheSkillRights: function(skillId, skillRights) {
        skillRightsCache[skillId] = angular.copy(skillRights);
      },

      /**
       * Updates a skill's rights to have public learner access,
       * given its ID and version.
       */
      setSkillPublic: function(skillId, skillVersion) {
        return $q(function(resolve, reject) {
          _setSkillPublic(skillId, skillVersion, resolve, reject);
        });
      }
    };
  }
]);
