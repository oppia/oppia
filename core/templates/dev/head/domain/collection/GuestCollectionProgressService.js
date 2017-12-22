// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service that records progress guests make during a collection
 * playthrough. Note that this service does not currently support saving a
 * user's progress when they create an account.
 */

// TODO(bhenning): Move this to a shared service which stores state across the
// frontend in a way that can be persisted in the backend upon account
// creation.

// TODO(bhenning): This should be reset upon login, otherwise the progress will
// be different depending on the user's logged in/logged out state.

oppia.factory('GuestCollectionProgressService', [
  function() {
    var COLLECTION_STORAGE_KEY = 'collectionProgressStore';

    var setCollectionProgressStore = function(store) {
      window.localStorage[COLLECTION_STORAGE_KEY] = JSON.stringify(store);
    };

    var getCollectionProgressStore = function() {
      var store = window.localStorage[COLLECTION_STORAGE_KEY];
      if (!store) {
        store = {};
        setCollectionProgressStore(store);
        return store;
      }
      return JSON.parse(store);
    };

    var getCompletedExplorationIds = function(collectionId) {
      var store = getCollectionProgressStore();
      if (!store.hasOwnProperty(collectionId)) {
        return [];
      }
      return store[collectionId];
    };

    var setCompletedExplorationIds = function(collectionId, explorationIds) {
      var store = getCollectionProgressStore();
      store[collectionId] = explorationIds;
      setCollectionProgressStore(store);
    };

    var recordCompletedExploration = function(collectionId, explorationId) {
      var completedIds = getCompletedExplorationIds(collectionId);
      // Only register the exploration ID if it's not already in the list of
      // completed IDs (to avoid duplication).
      if (completedIds.indexOf(explorationId) === -1) {
        completedIds.push(explorationId);
        setCompletedExplorationIds(collectionId, completedIds);
      }
    };

    var getValidCompletedExplorationIds = function(collection) {
      var collectionId = collection.getId();
      // Filter the exploration IDs by whether they are contained within the
      // specified collection structure.
      return getCompletedExplorationIds(collectionId).filter(function(expId) {
        return collection.containsCollectionNode(expId);
      });
    };

    // This method corresponds to collection_domain.get_next_exploration_ids.
    var _getNextExplorationIds = function(collection, completedIds) {
      // Given the completed exploration IDs, compile a list of acquired skills.
      var acquiredSkillIds = completedIds.map(function(expId) {
        var collectionNode = collection.getCollectionNodeByExplorationId(expId);
        return collectionNode.getAcquiredSkillIds();
      }).reduce(function(accumulator, value) {
        return accumulator.concat(value);
      }, []);

      // Find remaining collection nodes which have yet to be completed.
      var collectionNodes = collection.getCollectionNodes();
      var incompleteNodes = collectionNodes.filter(function(node) {
        return completedIds.indexOf(node.getExplorationId()) === -1;
      });

      // Filter out nodes for which the guest does not have the prerequisite
      // skills for, then map the leftover nodes to their corresponding
      // exploration IDs.
      // https://stackoverflow.com/a/15514975
      return incompleteNodes.filter(function(node) {
        return node.getPrerequisiteSkillIds().every(function(elem) {
          return acquiredSkillIds.indexOf(elem) > -1;
        });
      }).map(function(node) {
        return node.getExplorationId();
      });
    };

    return {
      /**
       * Records that the specified exploration was completed in the context of
       * the specified collection, as a guest.
       */
      recordExplorationCompletedInCollection: function(
          collectionId, explorationId) {
        recordCompletedExploration(collectionId, explorationId);
      },

      /**
       * Returns whether the guest user has made any progress toward completing
       * the specified collection.
       */
      hasMadeProgress: function(collectionId) {
        return getCompletedExplorationIds(collectionId).length !== 0;
      },

      /**
       * Given a collection object, returns the list of exploration IDs
       * completed by the guest user. The return list of exploration IDs will
       * not include any previously completed explorations for the given
       * collection that are no longer part of the collection.
       */
      getCompletedExplorationIds: function(collection) {
        return getValidCompletedExplorationIds(collection);
      },

      /**
       * Given a collection object a list of completed exploration IDs, returns
       * the list of next exploration IDs the guest user can play as part of
       * completing the collection. If this method returns an empty list, the
       * guest has completed the collection.
       */
      getNextExplorationIds: function(collection, completedExplorationIds) {
        return _getNextExplorationIds(collection, completedExplorationIds);
      }
    };
  }]);
