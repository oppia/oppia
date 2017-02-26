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
    '$http', '$log', '$q', 'COLLECTION_RIGHTS_URL_TEMPLATE',
    'UrlInterpolationService',
    function($http, $log, $q, COLLECTION_RIGHTS_URL_TEMPLATE,
      UrlInterpolationService) {
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
        var collectionRightsUrl = UrlInterpolationService.interpolateUrl(
          COLLECTION_RIGHTS_URL_TEMPLATE, {
            collection_id: collectionId
          });

        var putParams = {
          version: collectionVersion,
          is_public: isPublic
        };
        $http.put(collectionRightsUrl, putParams).then(function(response) {
          // Check if the response from the backend does not contradict
          // putParams.
          var isPrivateResponse = (response.data.status === 'private');
          if (isPrivateResponse === isPublic) {
            if (isPublic) {
              $log.error(
                'Backend indicated a collection was successfully ' +
                'published, but response.data.is_private returned true.');
            } else {
              $log.error(
                'Backend indicated a collection was successfully ' +
                'unpublished, but response.data.is_private returned false.');
            }
            if (errorCallback) {
              errorCallback(response.data);
            }
          } else {
            // An additional fetch is required because the GET response object
            // is different than that of the PUT response object.
            _fetchCollectionRights(collectionId, function(collectionRights) {
              // Save the fetched collection to avoid future fetches.
              collectionRightsCache[collectionId] = collectionRights;
            }, errorCallback);
            if (successCallback) {
              successCallback(collectionRightsCache[collectionId]);
            }
          }
        }, function(errorResponse) {
          if (errorCallback) {
            errorCallback(errorResponse.data);
          }
        });
      };

      var isCached = function(collectionId) {
        return collectionId in collectionRightsCache;
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
         * Behaves in the exactly as fetchCollectionRights (including callback
         * behavior and returning a promise object), except this function will
         * attempt to see whether the given collection rights has already been
         * loaded. If it has not yet been loaded, it will fetch the collection
         * rights from the backend. If it successfully retrieves the collection
         * rights from the backend, it will store it in the cache to avoid
         * requests from the backend in further function calls.
         */
        loadCollectionRights: function(collectionId) {
          return $q(function(resolve, reject) {
            if (isCached(collectionId)) {
              if (resolve) {
                resolve(collectionRightsCache[collectionId]);
              }
            } else {
              _fetchCollectionRights(collectionId, function(collectionRights) {
                // Save the fetched collection to avoid future fetches.
                collectionRightsCache[collectionId] = collectionRights;
                if (resolve) {
                  resolve(collectionRightsCache[collectionId]);
                }
              }, reject);
            }
          });
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
        },

        /**
         * Returns true if the collection is private given the collectionId.
         * This method will check the collection rights object exists, if so,
         * return the result from the cache. However, this will not cache the
         * collection rights object if it does not exist in the cache.
         */
        isCollectionPrivate: function(collectionId) {
          if (isCached(collectionId)) {
            return collectionRightsCache[collectionId].is_private;
          } else {
            _fetchCollectionRights(collectionId, function(collectionRights) {
              return collectionRights.is_private;
            });
          }
        }
      };
    }]);
