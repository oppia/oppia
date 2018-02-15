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
  'EDITABLE_EXPLORATION_DATA_URL_TEMPLATE',
  'EDITABLE_EXPLORATION_DATA_DRAFT_URL_TEMPLATE',
  'UrlInterpolationService',
  'ReadOnlyExplorationBackendApiService',
  function($http, $q, EXPLORATION_DATA_URL_TEMPLATE,
      EDITABLE_EXPLORATION_DATA_URL_TEMPLATE,
      EDITABLE_EXPLORATION_DATA_DRAFT_URL_TEMPLATE,
      UrlInterpolationService,
      ReadOnlyExplorationBackendApiService) {
    var _fetchExploration = function(
        explorationId, applyDraft, successCallback, errorCallback) {
      var editableExplorationDataUrl = _getExplorationUrl(
        explorationId, applyDraft);

      $http.get(editableExplorationDataUrl).then(function(response) {
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
      var editableExplorationDataUrl = _getExplorationUrl(
        explorationId, null);

      var putData = {
        version: explorationVersion,
        commit_message: commitMessage,
        change_list: changeList
      };
      $http.put(editableExplorationDataUrl, putData).then(function(response) {
        // The returned data is an updated exploration dict.
        var exploration = angular.copy(response.data);

        // Delete from the ReadOnlyExplorationBackendApiService's cache
        // As the two versions of the data (learner and editor) now differ
        ReadOnlyExplorationBackendApiService.deleteExplorationFromCache(
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
        explorationId, successCallback, errorCallback) {
      var editableExplorationDataUrl = _getExplorationUrl(explorationId, null);

      $http['delete'](editableExplorationDataUrl).then(function() {
        // Delete item from the ReadOnlyExplorationBackendApiService's cache
        ReadOnlyExplorationBackendApiService.deleteExplorationFromCache(
          explorationId);
        if (successCallback) {
          successCallback({});
        }
      }, function(errorResponse) {
        if (errorCallback) {
          errorCallback(errorResponse.data);
        }
      });
    };

    var _getExplorationUrl = function(explorationId, applyDraft) {
      if (applyDraft) {
        return UrlInterpolationService.interpolateUrl(
          EDITABLE_EXPLORATION_DATA_DRAFT_URL_TEMPLATE, {
            exploration_id: explorationId,
            apply_draft: JSON.stringify(applyDraft)
          });
      }
      return UrlInterpolationService.interpolateUrl(
        EDITABLE_EXPLORATION_DATA_URL_TEMPLATE, {
          exploration_id: explorationId
        });
    };

    return {
      fetchExploration: function(explorationId) {
        return $q(function(resolve, reject) {
          _fetchExploration(explorationId, null, resolve, reject);
        });
      },

      fetchApplyDraftExploration: function(explorationId) {
        return $q(function(resolve, reject) {
          _fetchExploration(explorationId, true, resolve, reject);
        });
      },

      /**
       * Updates an exploration in the backend with the provided exploration
       * ID. The changes only apply to the exploration of the given version
       * and the request to update the exploration will fail if the provided
       * exploration version is older than the current version stored in the
       * backend. Both the changes and the message to associate with those
       * changes are used to commit a change to the exploration.
       * The new exploration is passed to the success callback,
       * if one is provided to the returned promise object. Errors are passed
       * to the error callback, if one is provided. Please note, once this is
       * called the cached exploration in ReadOnlyExplorationBackendApiService
       * will be deleted. This is due to the differences in the back-end
       * editor object and the back-end player object. As it stands now,
       * we are unable to cache any Exploration object obtained from the
       * editor beackend.
       */
      updateExploration: function(
          explorationId, explorationVersion, commitMessage, changeList) {
        return $q(function(resolve, reject) {
          _updateExploration(
            explorationId, explorationVersion, commitMessage, changeList,
            resolve, reject);
        });
      },

      /**
       * Deletes an exploration in the backend with the provided exploration
       * ID. If successful, the exploration will also be deleted from the
       * ReadOnlyExplorationBackendApiService cache as well.
       * Errors are passed to the error callback, if one is provided.
       */
      deleteExploration: function(explorationId) {
        return $q(function(resolve, reject) {
          _deleteExploration(
            explorationId, resolve, reject);
        });
      }
    };
  }
]);
