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
 * @fileoverview Service to change the rights of collections in the backend.
 */

oppia.factory('CollectionRightsBackendApiService', [
  '$http', '$log', '$q', 'UrlInterpolationService',
  'COLLECTION_RIGHTS_URL_TEMPLATE',
  function($http, $log, $q, UrlInterpolationService,
      COLLECTION_RIGHTS_URL_TEMPLATE) {
    // Maps previously loaded collection rights to their IDs.
    var collectionRightsCache = {};

    var _fetchCollectionRights = function(collectionId, successCallback,
        errorCallback) {
      var collectionRightsUrl = UrlInterpolationService.interpolateUrl(
        COLLECTION_RIGHTS_URL_TEMPLATE, {
          collection_id: collectionId
        });

      $http.get(collectionRightsUrl).then(function(response) {
        if (successCallback) {
          successCallback(response.data);
        }
      }, function(errorResponse) {
        if (errorCallback) {
          errorCallback(errorResponse.data);
        }
      });
    };

    var _setCollectionStatus = function(
        collectionId, collectionVersion, isPublic, successCallback,
        errorCallback) {
      var collectionPublishUrl = UrlInterpolationService.interpolateUrl(
        '/collection_editor_handler/publish/<collection_id>', {
          collection_id: collectionId
        });
      var collectionUnpublishUrl = UrlInterpolationService.interpolateUrl(
        '/collection_editor_handler/unpublish/<collection_id>', {
          collection_id: collectionId
        });

      var putParams = {
        version: collectionVersion
      };
      var requestUrl = (
        isPublic ? collectionPublishUrl : collectionUnpublishUrl);

      $http.put(requestUrl, putParams).then(function(response) {
        collectionRightsCache[collectionId] = response.data;
        if (successCallback) {
          successCallback(response.data);
        }
      }, function(errorResponse) {
        if (errorCallback) {
          errorCallback(errorResponse.data);
        }
      });
    };

    var _isCached = function(collectionId) {
      return collectionRightsCache.hasOwnProperty(collectionId);
    };

    return {
      /**
       * Gets a collection's rights, given its ID.
       */
      fetchCollectionRights: function(collectionId) {
        return $q(function(resolve, reject) {
          _fetchCollectionRights(collectionId, resolve, reject);
        });
      },

      /**
       * Behaves exactly as fetchCollectionRights (including callback
       * behavior and returning a promise object), except this function will
       * attempt to see whether the given collection rights has been
       * cached. If it has not yet been cached, it will fetch the collection
       * rights from the backend. If it successfully retrieves the collection
       * rights from the backend, it will store it in the cache to avoid
       * requests from the backend in further function calls.
       */
      loadCollectionRights: function(collectionId) {
        return $q(function(resolve, reject) {
          if (_isCached(collectionId)) {
            if (resolve) {
              resolve(collectionRightsCache[collectionId]);
            }
          } else {
            _fetchCollectionRights(collectionId, function(collectionRights) {
              // Save the fetched collection rights to avoid future fetches.
              collectionRightsCache[collectionId] = collectionRights;
              if (resolve) {
                resolve(collectionRightsCache[collectionId]);
              }
            }, reject);
          }
        });
      },

      /**
       * Returns whether the given collection rights is stored within the
       * local data cache or if it needs to be retrieved from the backend
       * upon a laod.
       */
      isCached: function(collectionId) {
        return _isCached(collectionId);
      },

      /**
       * Replaces the current collection rights in the cache given by the
       * specified collection ID with a new collection rights object.
       */
      cacheCollectionRights: function(collectionId, collectionRights) {
        collectionRightsCache[collectionId] = angular.copy(collectionRights);
      },

      /**
       * Updates a collection's rights to be have public learner access, given
       * its ID and version.
       */
      setCollectionPublic: function(collectionId, collectionVersion) {
        return $q(function(resolve, reject) {
          _setCollectionStatus(
            collectionId, collectionVersion, true, resolve, reject);
        });
      },

      /**
       * Updates a collection's rights to be have private learner access,
       * given its ID and version.
       */
      setCollectionPrivate: function(collectionId, collectionVersion) {
        return $q(function(resolve, reject) {
          _setCollectionStatus(
            collectionId, collectionVersion, false, resolve, reject);
        });
      }
    };
  }
]);
