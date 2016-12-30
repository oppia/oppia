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
 * @fileoverview Factory for creating and mutating instances of frontend
 * collection rights domain objects.
 */

oppia.factory('CollectionRightsObjectFactory', [
    '$rootScope', '$log',
    function($rootScope, $log) {
    var CollectionRights = function(collectionRightsObject) {
      this._collectionId = collectionRightsObject.collection_id;
      this._canEdit = collectionRightsObject.can_edit;
      this._canUnpublish = collectionRightsObject.can_unpublish;
      $rootScope.isPrivate = collectionRightsObject.is_private;
      this._ownerNames = collectionRightsObject.owner_names;
    };

    // Instance methods

    CollectionRights.prototype.getCollectionId = function() {
      return this._collectionId;
    };

    // Returns true if the the user can edit the collection. This property is
    // immutable.
    CollectionRights.prototype.canEdit = function() {
      return this._canEdit;
    };

    // Returns true if the user can edit the collection. This property is
    // immutable.
    CollectionRights.prototype.canUnpublish = function() {
      return this._canUnpublish;
    };

    // Returns true if the collection is private.
    CollectionRights.prototype.isPrivate = function() {
      return $rootScope.isPrivate;
    };

    // Sets isPrivate to false only if the
    // collectionRightsBackendObject.is_private passed in is false; otherwise,
    // writes an error to the log. Assumes that the backend returns a success
    // in set public operation. Returns the result of isPrivate regardless of
    // error.
    CollectionRights.prototype.setPublic = function(
      collectionRightsBackendObject) {
      if (!collectionRightsBackendObject.is_private) {
        $rootScope.isPrivate = false;
      } else {
        $log.error(
          'Backend indicated a collection was successfully ' +
          'published, but response.data.is_private returned true.');
      }
      return this.isPrivate();
    };

    // Sets isPrivate to true only if the
    // collectionRightsBackendObject.is_private passed in is true AND
    // canUnpublish is true. If canUnpublish is true and is_private is false,
    // it writes an error to the log. Assumes that the backend returns a
    // success in set private operation. Returns the result of isPrivate
    // regardless of error.
    CollectionRights.prototype.setPrivate = function(
      collectionRightsBackendObject) {
      if (this.canUnpublish()) {
        if (collectionRightsBackendObject.is_private) {
          $rootScope.isPrivate = true;
        } else {
          $log.error(
            'Backend indicated a collection was successfully ' +
            'unpublished, but response.data.is_private returned false.');
        }
        return this.isPrivate();
      }
    };

    // Returns the owner names of the collection. This property is immutable.
    CollectionRights.prototype.getOwnerNames = function() {
      return this._ownerNames;
    };

    // Static class methods. Note that "this" is not available in static
    // contexts. This function takes a JSON object which represents a backend
    // collection python dict.
    CollectionRights.create = function(collectionRightsBackendObject) {
      return new CollectionRights(collectionRightsBackendObject);
    };

    // Create a new, empty collection rights. This is not guaranteed to pass
    // validation tests.
    CollectionRights.createEmptyCollectionRights = function() {
      return new CollectionRights({
        owner_names: []
      });
    };

    return CollectionRights;
  }
]);
