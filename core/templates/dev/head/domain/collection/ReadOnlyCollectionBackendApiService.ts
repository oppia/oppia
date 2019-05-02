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
 * about collections from the backend.
 */

// TODO(bhenning): For preview mode, this service should be replaced by a
// separate CollectionDataService implementation which returns a local copy of
// the collection instead. This file should not be included on the page in that
// scenario.
oppia.factory('ReadOnlyCollectionBackendApiService', [
  '$http', '$q', 'UrlInterpolationService', 'COLLECTION_DATA_URL_TEMPLATE',
  function($http, $q, UrlInterpolationService, COLLECTION_DATA_URL_TEMPLATE) {
    // Maps previously loaded collections to their IDs.
    var _collectionCache = [];

    var _fetchCollection = function(
        collectionId, successCallback, errorCallback) {
      var collectionDataUrl = UrlInterpolationService.interpolateUrl(
        COLLECTION_DATA_URL_TEMPLATE, {
          collection_id: collectionId
        });

      $http.get(collectionDataUrl).then(function(response) {
        var collection = angular.copy(response.data.collection);
        if (successCallback) {
          successCallback(collection);
        }
      }, function(errorResponse) {
        if (errorCallback) {
          errorCallback(errorResponse.data);
        }
      });
    };

    var _isCached = function(collectionId) {
      return _collectionCache.hasOwnProperty(collectionId);
    };

    return {
      /**
       * Retrieves a collection from the backend given a collection ID. This
       * returns a promise object that allows a success and rejection callbacks
       * to be registered. If the collection is successfully loaded and a
       * success callback function is provided to the promise object, the
       * success callback is called with the collection passed in as a
       * parameter. If something goes wrong while trying to fetch the
       * collection, the rejection callback is called instead, if present. The
       * rejection callback function is passed the error that occurred and the
       * collection ID.
       */
      fetchCollection: function(collectionId) {
        return $q(function(resolve, reject) {
          _fetchCollection(collectionId, resolve, reject);
        });
      },

      /**
       * Behaves in the exact same way as fetchCollection (including callback
       * behavior and returning a promise object), except this function will
       * attempt to see whether the given collection has already been loaded. If
       * it has not yet been loaded, it will fetch the collection from the
       * backend. If it successfully retrieves the collection from the backend,
       * it will store it in the cache to avoid requests from the backend in
       * further function calls.
       */
      loadCollection: function(collectionId) {
        return $q(function(resolve, reject) {
          if (_isCached(collectionId)) {
            if (resolve) {
              resolve(angular.copy(_collectionCache[collectionId]));
            }
          } else {
            _fetchCollection(collectionId, function(collection) {
              // Save the fetched collection to avoid future fetches.
              _collectionCache[collectionId] = collection;
              if (resolve) {
                resolve(angular.copy(collection));
              }
            }, reject);
          }
        });
      },

      /**
       * Returns whether the given collection is stored within the local data
       * cache or if it needs to be retrieved from the backend upon a laod.
       */
      isCached: function(collectionId) {
        return _isCached(collectionId);
      },

      /**
       * Replaces the current collection in the cache given by the specified
       * collection ID with a new collection object.
       */
      cacheCollection: function(collectionId, collection) {
        _collectionCache[collectionId] = angular.copy(collection);
      },

      /**
       * Clears the local collection data cache, forcing all future loads to
       * re-request the previously loaded collections from the backend.
       */
      clearCollectionCache: function() {
        _collectionCache = [];
      }
    };
  }
]);
