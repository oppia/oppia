// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Factory for creating and mutating a domain object which
 * represents the progress of a guest playing through a collection.
 */

var oppia = require('AppInit.ts').module;

oppia.factory('GuestCollectionProgressObjectFactory', [
  function() {
    var GuestCollectionProgress = function(completedExplorationsMap) {
      this._completedExplorationsMap = completedExplorationsMap;
    };

    // Instance methods

    // Returns whether the guest has made any progress towards completing the
    // specified collection ID. Note that this does not account for whether the
    // completed explorations are still contained within that collection.
    GuestCollectionProgress.prototype.hasCompletionProgress = function(
        collectionId) {
      return this._completedExplorationsMap.hasOwnProperty(collectionId);
    };

    // Returns an array of exploration IDs which have been completed by the
    // specified collection ID, or empty if none have.
    GuestCollectionProgress.prototype.getCompletedExplorationIds = function(
        collectionId) {
      if (!this.hasCompletionProgress(collectionId)) {
        return [];
      }
      return angular.copy(this._completedExplorationsMap[collectionId]);
    };

    // Specifies that a specific exploration ID has been completed in the
    // context of the specified collection. Returns whether that exploration ID
    // was not previously registered as completed for the collection.
    GuestCollectionProgress.prototype.addCompletedExplorationId = function(
        collectionId, explorationId) {
      var completedExplorationIds = this.getCompletedExplorationIds(
        collectionId);
      if (completedExplorationIds.indexOf(explorationId) === -1) {
        completedExplorationIds.push(explorationId);
        this._completedExplorationsMap[collectionId] = completedExplorationIds;
        return true;
      }
      return false;
    };

    // Converts this object to JSON for storage.
    GuestCollectionProgress.prototype.toJson = function(
        collectionId, explorationIds) {
      return JSON.stringify(this._completedExplorationsMap);
    };

    // Static class methods. Note that "this" is not available in static
    // contexts.

    // This function takes a JSON string which represents a raw collection
    // object and returns a new GuestCollectionProgress domain object. A null or
    // undefined string indicates that an empty progress object should be
    // created.
    // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
    /* eslint-disable dot-notation */
    GuestCollectionProgress['createFromJson'] = function(
    /* eslint-enable dot-notation */
        collectionProgressJson) {
      if (collectionProgressJson) {
        return new GuestCollectionProgress(JSON.parse(collectionProgressJson));
      } else {
        return new GuestCollectionProgress({});
      }
    };


    return GuestCollectionProgress;
  }
]);
