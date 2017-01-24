// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to retrieve read only information
 * about exploraions from the backend.
 */

oppia.factory('ReadOnlyExplorationBackendApiService', [
    '$http', '$q', 'EXPLORATION_DATA_URL_TEMPLATE',
    'UrlInterpolationService',
    function($http, $q, EXPLORATION_DATA_URL_TEMPLATE,
      UrlInterpolationService) {
      // Maps previously loaded explorations to their IDs.
      var _explorationCache = [];

      var _fetchExploration = function(
          explorationId, applyDraft, successCallback, errorCallback) {
        var explorationDataUrl = UrlInterpolationService.interpolateUrl(
          EXPLORATION_DATA_URL_TEMPLATE, {
            exploration_id: explorationId
          });

        $http.get(explorationDataUrl, {
          params: {
            apply_draft: applyDraft
          }
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

      var _isCached = function(explorationId) {
        return _explorationCache.hasOwnProperty(explorationId);
      };

      return {
        /**
         * Retrieves a exploration from the backend given a exploration ID.
         * This returns a promise object that allows a success and rejection
         *  callbacks to be registered. If the exploration is successfully
         * loaded and a success callback function is provided to the promise
         * object, the success callback is called with the exploration
         * passed in as a parameter. If something goes wrong while trying to
         * fetch the exploration, the rejection callback is called instead,
         * if present. The rejection callback function is passed the error that
         * occurred and the exploration ID.
         */
        fetchExploration: function(explorationId, applyDraft) {
          return $q(function(resolve, reject) {
            _fetchExploration(explorationId, applyDraft, resolve, reject);
          });
        },

        /**
         * Behaves in the exact same way as fetchExploration (including
         * callback behavior and returning a promise object),
         * except this function will attempt to see whether the given
         * exploration has already been loaded. If it has not yet been loaded,
         * it will fetch the exploration from the backend. If it successfully
         * retrieves the exploration from the backend, it will store it in the
         * cache to avoid requests from the backend in further function calls.
         */
        loadExploration: function(explorationId, applyDraft) {
          return $q(function(resolve, reject) {
            if (_isCached(explorationId)) {
              if (resolve) {
                resolve(angular.copy(_explorationCache[explorationId]));
              }
            } else {
              _fetchExploration(explorationId, applyDraft,
                function(exploration) {
                // Save the fetched exploration to avoid future fetches.
                _explorationCache[explorationId] = exploration;
                if (resolve) {
                  resolve(angular.copy(exploration));
                }
              }, reject);
            }
          });
        },

        /**
         * Returns whether the given exploration is stored within the local
         * data cache or if it needs to be retrieved from the backend upon a
         * load.
         */
        isCached: function(explorationId) {
          return _isCached(explorationId);
        },

        /**
         * Replaces the current exploration in the cache given by the specified
         * exploration ID with a new exploration object.
         */
        cacheExploration: function(explorationId, exploration) {
          _explorationCache[explorationId] = angular.copy(exploration);
        },

        /**
         * Clears the local exploration data cache, forcing all future loads to
         * re-request the previously loaded explorations from the backend.
         */
        clearExplorationCache: function() {
          _explorationCache = [];
        }
      };
    }
]);
