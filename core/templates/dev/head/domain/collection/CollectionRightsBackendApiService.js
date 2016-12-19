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
    '$http', '$q', 'COLLECTION_RIGHTS_URL_TEMPLATE', 'UrlInterpolationService',
    function($http, $q, COLLECTION_RIGHTS_URL_TEMPLATE,
      UrlInterpolationService) {
      var SetCollectionRights = function(
        collectionId, putParams, successCallback, errorCallback) {
        var collectionRightsUrl = UrlInterpolationService.interpolateUrl(
          COLLECTION_RIGHTS_URL_TEMPLATE, {
            collection_id: collectionId
          });

        $http.put(collectionRightsUrl, putParams).then(function() {
          // TODO(bhenning): Consolidate the backend rights domain objects and
          // implement a frontend activity rights domain object. The rights
          // being passed in here should be used to create one of those objects.
          if (successCallback) {
            successCallback();
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
        var putParams = {
          version: collectionVersion,
          is_public: isPublic
        };

        return SetCollectionRights(
          collectionId, putParams, successCallback, errorCallback);
      };

      var SetCollectionMember = function(
        collectionId, collectionVersion, newCollectionMember,
        newCollectionMemberRole, successCallback, errorCallback) {
        var putParams = {
          version: collectionVersion,
          new_member_username: newCollectionMember,
          new_member_role: newCollectionMemberRole
        };

        return SetCollectionRights(
          collectionId, putParams, successCallback, errorCallback);
      };

      return {
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
         * Adds a a new owner to the collection, given its ID and version.
         */
        SetCollectionOwner: function(
          collectionId, collectionVersion, newCollectionOwner) {
          return $q(function(resolve, reject) {
            SetCollectionMember(
              collectionId, collectionVersion, newCollectionOwner, 'owner',
              resolve, reject);
          });
        },

        /**
         * Adds a a new owner to the collection, given its ID and version.
         */
        SetCollectionEditor: function(
          collectionId, collectionVersion, newCollectionEditor) {
          return $q(function(resolve, reject) {
            SetCollectionMember(
              collectionId, collectionVersion, newCollectionEditor, 'editor',
              resolve, reject);
          });
        },

        /**
         * Adds a a new owner to the collection, given its ID and version.
         */
        SetCollectionPlaytester: function(
          collectionId, collectionVersion, newCollectionPlaytester) {
          return $q(function(resolve, reject) {
            SetCollectionMember(
              collectionId, collectionVersion, newCollectionPlaytester,
              'viewer', resolve, reject);
          });
        }
      };
    }]);
