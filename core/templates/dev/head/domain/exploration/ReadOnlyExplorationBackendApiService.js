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
 * about explorations from the backend.
 */
oppia.factory('ReadOnlyExplorationBackendApiService', [
  '$http', '$q', 'UrlInterpolationService',
  'EXPLORATION_DATA_URL_TEMPLATE', 'EXPLORATION_VERSION_DATA_URL_TEMPLATE',
  function($http, $q, UrlInterpolationService,
      EXPLORATION_DATA_URL_TEMPLATE, EXPLORATION_VERSION_DATA_URL_TEMPLATE) {
    // Maps previously loaded explorations to their IDs.
    var _explorationCache = [];

    var _fetchExploration = function(
        explorationId, version, successCallback, errorCallback) {
      var explorationDataUrl = _getExplorationUrl(explorationId, version);

      $http.get(explorationDataUrl).then(function(response) {
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

    var _getExplorationUrl = function(explorationId, version) {
      if (version) {
        return UrlInterpolationService.interpolateUrl(
          EXPLORATION_VERSION_DATA_URL_TEMPLATE, {
            exploration_id: explorationId,
            version: String(version)
          });
      }
      return UrlInterpolationService.interpolateUrl(
        EXPLORATION_DATA_URL_TEMPLATE, {
          exploration_id: explorationId
        }
      );
    };

    return {
      /**
       * Retrieves an exploration from the backend given an exploration ID
       * and version number (or none). This returns a promise object that
       * allows success and rejection callbacks to be registered. If the
       * exploration is successfully loaded and a success callback function
       * is provided to the promise object, the success callback is called
       * with the exploration passed in as a parameter. If something goes
       * wrong while trying to fetch the exploration, the rejection callback
       * is called instead, if present. The rejection callback function is
       * passed any data returned by the backend in the case of an error.
       */
      fetchExploration: function(explorationId, version) {
        return $q(function(resolve, reject) {
          _fetchExploration(explorationId, version, resolve, reject);
        });
      },

      /**
       * Behaves in the exact same way as fetchExploration (including
       * callback behavior and returning a promise object),
       * except this function will attempt to see whether the latest version
       * of the given exploration has already been loaded. If it has not yet
       * been loaded, it will fetch the exploration from the backend. If it
       * successfully retrieves the exploration from the backend, this method
       * will store the exploration in the cache to avoid requests from the
       * backend in further function calls.
       */
      loadLatestExploration: function(explorationId) {
        return $q(function(resolve, reject) {
          if (_isCached(explorationId)) {
            if (resolve) {
              resolve(angular.copy(_explorationCache[explorationId]));
            }
          } else {
            _fetchExploration(
              explorationId, null, function(exploration) {
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
       * Retrieves an exploration from the backend given an exploration ID
       * and version number. This method does not interact with any cache
       * and using this method will not overwrite or touch the state of the
       * cache. All previous data in the cache will still be retained after
       * this call.
       */
      loadExploration: function(explorationId, version) {
        return $q(function(resolve, reject) {
          _fetchExploration(
            explorationId, version, function(exploration) {
              if (resolve) {
                resolve(angular.copy(exploration));
              }
            }, reject);
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
      },

      /**
       * Deletes a specific exploration from the local cache
       */
      deleteExplorationFromCache: function(explorationId) {
        if (_isCached(explorationId)) {
          delete _explorationCache[explorationId];
        }
      }
    };
  }
]);
