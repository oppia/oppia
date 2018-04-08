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
 * @fileoverview Service that records progress guests make during a collection
 * playthrough. Note that this service does not currently support saving a
 * user's progress when they create an account.
 */

// TODO(bhenning): Move this to a service which stores shared state across the
// frontend in a way that can be persisted in the backend upon account
// creation, such as exploration progress.

// TODO(bhenning): This should be reset upon login, otherwise the progress will
// be different depending on the user's logged in/logged out state.

oppia.factory('GuestCollectionProgressService', [
  '$window', 'GuestCollectionProgressObjectFactory',
  function($window, GuestCollectionProgressObjectFactory) {
    var COLLECTION_STORAGE_KEY = 'collectionProgressStore_v1';

    var storeGuestCollectionProgress = function(guestCollectionProgress) {
      $window.localStorage[COLLECTION_STORAGE_KEY] = (
        guestCollectionProgress.toJson());
    };

    var loadGuestCollectionProgress = function() {
      return GuestCollectionProgressObjectFactory.createFromJson(
        $window.localStorage[COLLECTION_STORAGE_KEY]);
    };

    var recordCompletedExploration = function(collectionId, explorationId) {
      var guestCollectionProgress = loadGuestCollectionProgress();
      var completedExplorationIdHasBeenAdded = (
        guestCollectionProgress.addCompletedExplorationId(
          collectionId, explorationId));
      if (completedExplorationIdHasBeenAdded) {
        storeGuestCollectionProgress(guestCollectionProgress);
      }
    };

    var getValidCompletedExplorationIds = function(collection) {
      var collectionId = collection.getId();
      var guestCollectionProgress = loadGuestCollectionProgress();
      var completedExplorationIds = (
        guestCollectionProgress.getCompletedExplorationIds(collectionId));
      // Filter the exploration IDs by whether they are contained within the
      // specified collection structure.
      return completedExplorationIds.filter(function(expId) {
        return collection.containsCollectionNode(expId);
      });
    };

    // This method corresponds to collection_domain.get_next_exploration_id.
    var _getNextExplorationIds = function(collection, completedIds) {
      var collectionNodes = collection.getCollectionNodes();

      if (completedIds.length === collectionNodes.length) {
        return [];
      } else {
        return [collectionNodes[completedIds.length].getExplorationId()];
      }
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
       * the specified collection by completing at least one exploration related
       * to the collection. Note that this does not account for any completed
       * explorations which are no longer referenced by the collection;
       * getCompletedExplorationIds() should be used for that, instead.
       */
      hasCompletedSomeExploration: function(collectionId) {
        var guestCollectionProgress = loadGuestCollectionProgress();
        return guestCollectionProgress.hasCompletionProgress(collectionId);
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
