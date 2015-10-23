// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to retrieve information about collections from the
 * backend.
 *
 * @author henning.benmax@gmail.com (Ben Henning)
 */

// TODO(bhenning): For preview mode, this service should be omitted. Instead,
// a separate collectionDataService should be created which serves a local copy
// of the collection instead.
oppia.factory('CollectionDataService', [
    '$http', 'COLLECTION_DATA_URL', 'UrlInterpolationService',
    function($http, COLLECTION_DATA_URL, urlInterpolationService) {

  // Maps previously loaded collections to their IDs.
  var _collectionCache = [];

  // This inserts an extra 'exploration' object into each node. The object
  // includes the exploration ID and additional meta-information regarding the
  // exploration that is useful for collection pages (such as the exploration
  // title).
  var _populateExplorationsInNodes = function(collection, explorationTitles) {
    for (var i = 0; i < collection.nodes.length; i++) {
      var collectionNode = collection.nodes[i];
      collectionNode.exploration = {
        'id': collectionNode.exploration_id,
        'title': explorationTitles[collectionNode.exploration_id]
      };
    }
    return collection;
  };

  // TODO(bhenning): Figure out what to do about versioning. Should the version
  // be specified when a collection is fetched?
  var _fetchCollection = function(
      collectionId, successCallback, errorCallback) {
    var collectionDataUrl = urlInterpolationService.interpolateUrl(
      COLLECTION_DATA_URL, {'collection_id': collectionId});

    $http.get(collectionDataUrl).success(function(data) {
      var collection = _populateExplorationsInNodes(
        angular.copy(data.collection), data.exploration_titles);
      collection.next_exploration_ids = data.next_exploration_ids;
      if (successCallback) {
        successCallback(collection);
      }
    }).error(function(data) {
      if (errorCallback) {
        errorCallback(data ? data.error : null, collectionId);
      }
    });
  };

  var _isCached = function(collectionId) {
    return _collectionCache.hasOwnProperty(collectionId);
  };

  return {
    /**
     * Retrieves a collection from the backend given a collection ID. If the
     * collection is successfully loaded and a successCallback function is
     * provided, successCallback is called with the collection passed in as a
     * parameter. If something goes wrong while trying to fetch the collection,
     * errorCallback is called instead, if present. errorCallback is passed
     * the error that occurred and the collection ID.
     */
    fetchCollection: function(collectionId, successCallback, errorCallback) {
      _fetchCollection(collectionId, successCallback, errorCallback);
    },

    /**
     * Behaves in the exact same way as fetchCollection (including callback
     * behavior), except this function will attempt to see whether the given
     * collection has already been loaded. If it has not yet been loaded, it
     * will fetch the collection from the backend. If it successfully retrieves
     * the collection from the backend, it will store it in the cache to avoid
     * requests from the backend in further function calls.
     *
     * Note: successCallback may be called before this function returns in the
     * case that the collection has already been fetched from the backend.
     */
    loadCollection: function(collectionId, successCallback, errorCallback) {
      if (_isCached(collectionId)) {
        if (successCallback) {
          successCallback(_collectionCache[collectionId]);
        }
      } else {
        _fetchCollection(collectionId, function(collection) {
          // Save the fetched collection to avoid future fetches.
          _collectionCache[collectionId] = collection;
          successCallback(collection);
        }, errorCallback);
      }
    },

    /**
     * Returns whether the given collection is stored within the local data
     * cache or if it needs to be retrieved from the backend upon a laod.
     */
    isCached: function(collectionId) {
      return _isCached(collectionId);
    },

    /**
     * Clears the local collection data cache, forcing all future loads to
     * re-request the previously loaded collections from the backend.
     */
    clearCollectionCache: function() {
      _collectionCache = [];
    },
  };
}]);
