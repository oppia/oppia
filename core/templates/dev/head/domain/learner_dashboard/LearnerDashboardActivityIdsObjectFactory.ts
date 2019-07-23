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
 * @fileoverview Factory for creating new frontend instances of learner
   dashboard activity ids domain object.
 */

var oppia = require('AppInit.ts').module;

oppia.factory('LearnerDashboardActivityIdsObjectFactory', [function() {
  var LearnerDashboardActivityIds = function(
      incompleteExplorationIds, incompleteCollectionIds,
      completedExplorationIds, completedCollectionIds, explorationPlaylistIds,
      collectionPlaylistIds) {
    this.incompleteExplorationIds = incompleteExplorationIds;
    this.incompleteCollectionIds = incompleteCollectionIds;
    this.completedExplorationIds = completedExplorationIds;
    this.completedCollectionIds = completedCollectionIds;
    this.explorationPlaylistIds = explorationPlaylistIds;
    this.collectionPlaylistIds = collectionPlaylistIds;
  };

  LearnerDashboardActivityIds.prototype.includesActivity = (
    function(activityId) {
      if (this.incompleteCollectionIds.indexOf(activityId) !== -1 ||
          this.completedCollectionIds.indexOf(activityId) !== -1 ||
          this.collectionPlaylistIds.indexOf(activityId) !== -1 ||
          this.incompleteExplorationIds.indexOf(activityId) !== -1 ||
          this.completedExplorationIds.indexOf(activityId) !== -1 ||
          this.explorationPlaylistIds.indexOf(activityId) !== -1) {
        return true;
      } else {
        return false;
      }
    });

  LearnerDashboardActivityIds.prototype.belongsToExplorationPlaylist = (
    function(explorationId) {
      if (this.explorationPlaylistIds.indexOf(explorationId) !== -1) {
        return true;
      } else {
        return false;
      }
    });

  LearnerDashboardActivityIds.prototype.belongsToCollectionPlaylist = (
    function(collectionId) {
      if (this.collectionPlaylistIds.indexOf(collectionId) !== -1) {
        return true;
      } else {
        return false;
      }
    });

  LearnerDashboardActivityIds.prototype.belongsToCompletedExplorations = (
    function(explorationId) {
      if (this.completedExplorationIds.indexOf(explorationId) !== -1) {
        return true;
      } else {
        return false;
      }
    });

  LearnerDashboardActivityIds.prototype.belongsToCompletedCollections = (
    function(collectionId) {
      if (this.completedCollectionIds.indexOf(collectionId) !== -1) {
        return true;
      } else {
        return false;
      }
    });

  LearnerDashboardActivityIds.prototype.belongsToIncompleteExplorations = (
    function(explorationId) {
      if (this.incompleteExplorationIds.indexOf(explorationId) !== -1) {
        return true;
      } else {
        return false;
      }
    });

  LearnerDashboardActivityIds.prototype.belongsToIncompleteCollections = (
    function(collectionId) {
      if (this.incompleteCollectionIds.indexOf(collectionId) !== -1) {
        return true;
      } else {
        return false;
      }
    });

  LearnerDashboardActivityIds.prototype.addToExplorationLearnerPlaylist = (
    function(explorationId) {
      this.explorationPlaylistIds.push(explorationId);
    });

  LearnerDashboardActivityIds.prototype.removeFromExplorationLearnerPlaylist = (
    function(explorationId) {
      var index = this.explorationPlaylistIds.indexOf(explorationId);
      if (index !== -1) {
        this.explorationPlaylistIds.splice(index, 1);
      }
    });

  LearnerDashboardActivityIds.prototype.addToCollectionLearnerPlaylist = (
    function(collectionId) {
      this.collectionPlaylistIds.push(collectionId);
    });

  LearnerDashboardActivityIds.prototype.removeFromCollectionLearnerPlaylist = (
    function(collectionId) {
      var index = this.collectionPlaylistIds.indexOf(collectionId);
      if (index !== -1) {
        this.collectionPlaylistIds.splice(index, 1);
      }
    });

  // TODO(ankita240796): Remove the bracket notation once Angular2 gets in.
  /* eslint-disable dot-notation */
  LearnerDashboardActivityIds['createFromBackendDict'] = function(
  /* eslint-enable dot-notation */
      learnerDashboardActivityIdsDict) {
    return new LearnerDashboardActivityIds(
      learnerDashboardActivityIdsDict.incomplete_exploration_ids,
      learnerDashboardActivityIdsDict.incomplete_collection_ids,
      learnerDashboardActivityIdsDict.completed_exploration_ids,
      learnerDashboardActivityIdsDict.completed_collection_ids,
      learnerDashboardActivityIdsDict.exploration_playlist_ids,
      learnerDashboardActivityIdsDict.collection_playlist_ids);
  };

  return LearnerDashboardActivityIds;
}]);
