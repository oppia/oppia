// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to send changes to a exploration to the backend.
 */

oppia.factory('EditableExplorationBackendApiService', [
  '$http', '$q', 'EXPLORATION_DATA_URL_TEMPLATE',
  'EDITABLE_EXPLORATION_DATA_URL_TEMPLATE', 'UrlInterpolationService',
  'ReadOnlyExplorationBackendApiService',
  function($http, $q, EXPLORATION_DATA_URL_TEMPLATE,
    EDITABLE_EXPLORATION_DATA_URL_TEMPLATE, UrlInterpolationService,
    ReadOnlyExplorationBackendApiService) {
    var _fetchExploration = function(
        explorationId, applyDraft, v, successCallback, errorCallback) {
      var explorationDataUrl = UrlInterpolationService.interpolateUrl(
        EDITABLE_EXPLORATION_DATA_URL_TEMPLATE, {
          exploration_id: String(explorationId)
        });

      params = {};
      if (applyDraft) {
        params.apply_draft = applyDraft;
      }
      if (v || v === 0) {
        params.v = v;
      }

      $http.get(explorationDataUrl, {
        params: params
      }).then(function(response) {
        var exploration = angular.copy(response.data);
        if (successCallback) {
          successCallback(exploration);
        }
      }, function(errorResponse) {
        if (errorCallback) {
          errorCallback(errorResponse.data);
        }
      });
    };

    var _updateExploration = function(
        explorationId, explorationVersion, commitMessage, changeList,
        successCallback, errorCallback) {
      var editableExplorationDataUrl = (
        UrlInterpolationService.interpolateUrl(
        EDITABLE_EXPLORATION_DATA_URL_TEMPLATE, {
          exploration_id: explorationId
        })
      );

      var putData = {
        version: explorationVersion,
        commit_message: commitMessage,
        change_list: changeList
      };
      $http.put(editableExplorationDataUrl, putData).then(function(response) {
        // The returned data is an updated exploration dict.
        var exploration = angular.copy(response.data);

        // Update the ReadOnlyExplorationBackendApiService's cache with the
        // new exploration.
        ReadOnlyExplorationBackendApiService.cacheExploration(
          explorationId, exploration);

        if (successCallback) {
          successCallback(exploration);
        }
      }, function(errorResponse) {
        if (errorCallback) {
          errorCallback(errorResponse.data);
        }
      });
    };

    var _deleteExploration = function(
        explorationId, role, successCallback, errorCallback) {
      var editableExplorationDataUrl = (
        UrlInterpolationService.interpolateUrl(
        EDITABLE_EXPLORATION_DATA_URL_TEMPLATE, {
          exploration_id: explorationId
        })
      );

      params = {};
      if (role) {
        params.role = JSON.stringify(role);
      }

      $http['delete'](editableExplorationDataUrl, {
        params: params
      }).then(function(response) {
        // What does this return? What happens on Fail?
        // What happens wtih ReadOnlyExplorationBackendApiService
        // on success or fail.

        // Delete item from the ReadOnlyExplorationBackendApiService's cache
        ReadOnlyExplorationBackendApiService.deleteExplorationFromCache(
          explorationId);

        if (successCallback) {
          successCallback(response);
        }
      }, function(errorResponse) {
        if (errorCallback) {
          errorCallback(errorResponse.data);
        }
      });
    };

    return {
      fetchExploration: function(explorationId, applyDraft, v) {
        return $q(function(resolve, reject) {
          _fetchExploration(explorationId, applyDraft, v, resolve, reject);
        });
      },

      /**
       * Updates a exploration in the backend with the provided exploration
       * ID. The changes only apply to the exploration of the given version
       * and the request to update the exploration will fail if the provided
       * exploration version is older than the current version stored in the
       * backend. Both the changes and the message to associate with those
       * changes are used to commit a change to the exploration.
       * The new exploration is passed to the success callback,
       * if one is provided to the returned promise object. Errors are passed
       * to the error callback, if one is provided. Finally, if the update is
       * successful, the returned exploration will be cached within the
       * ExplorationBackendApiService to ensure the cache is
       * not out-of-date with any updates made by this backend API service.
       */
      updateExploration: function(
          explorationId, explorationVersion, commitMessage, changeList) {
        return $q(function(resolve, reject) {
          _updateExploration(
            explorationId, explorationVersion, commitMessage, changeList,
            resolve, reject);
        });
      },

      deleteExploration: function(
        explorationId, role) {
        return $q(function(resolve, reject) {
          _deleteExploration(
            explorationId, role, resolve, reject);
        });
      }
    };
  }
]);
