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
 * @fileoverview Factory for creating and mutating instances of frontend
 * collection playthrough domain objects.
 */

oppia.factory('CollectionPlaythroughObjectFactory', [function() {
    // TODO(bhenning): Add setters for some of these properties. Setters allow
    // the collection editor to setup specifically configured playthrough
    // sessions of the collection player through this object (for example, the
    // editor would be able to fake which explorations were completed to see how
    // that particular configuration would look for a learner).

    // Stores information about a current playthrough of a collection for a
    // user.
    var CollectionPlaythrough = function(collectionPlaythroughBackendObject) {
      this._nextExplorationIds = (
        collectionPlaythroughBackendObject.next_exploration_ids);
      this._completedExplorationIds = (
        collectionPlaythroughBackendObject.completed_exploration_ids);
    };

    // Returns a list of upcoming exploration IDs. Changes to this list are not
    // reflected in this collection.
    CollectionPlaythrough.prototype.getNextExplorationIds = function() {
      return angular.copy(this._nextExplorationIds);
    };

    CollectionPlaythrough.prototype.getNextRecommendedCollectionNodeCount =
        function() {
      return this._nextExplorationIds.length;
    };

    CollectionPlaythrough.hasFinishedCollection = function() {
      return this._nextExplorationIds.length === 0;
    };

    // Returns a list of explorations completed that are related to this
    // collection. Changes to this list are not reflected in this collection.
    CollectionPlaythrough.prototype.getCompletedExplorationIds = function() {
      return angular.copy(this._completedExplorationIds);
    };

    CollectionPlaythrough.prototype.getCompletedExplorationNodeCount =
        function() {
      return this._completedExplorationIds.length;
    };

    CollectionPlaythrough.prototype.hasStartedCollection = function() {
      return this._completedExplorationIds.length !== 0;
    };

    // Static class methods. Note that "this" is not available in static
    // contexts. This function takes a JSON object which represents a backend
    // collection playthrough python dict.
    CollectionPlaythrough.create = function(
        collectionPlaythroughBackendObject) {
      return new CollectionPlaythrough(collectionPlaythroughBackendObject);
    };

    return CollectionPlaythrough;
  }
]);
