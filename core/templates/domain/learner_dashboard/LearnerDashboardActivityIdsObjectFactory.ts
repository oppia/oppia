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

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

export class LearnerDashboardActivityIds {
  incompleteExplorationIds: string[];
  incompleteCollectionIds: string[];
  completedExplorationIds: string[];
  completedCollectionIds: string[];
  explorationPlaylistIds: string[];
  collectionPlaylistIds: string[];

  constructor(
      incompleteExplorationIds: string[], incompleteCollectionIds: string[],
      completedExplorationIds: string[], completedCollectionIds: string[],
      explorationPlaylistIds: string[], collectionPlaylistIds: string[]) {
    this.incompleteExplorationIds = incompleteExplorationIds;
    this.incompleteCollectionIds = incompleteCollectionIds;
    this.completedExplorationIds = completedExplorationIds;
    this.completedCollectionIds = completedCollectionIds;
    this.explorationPlaylistIds = explorationPlaylistIds;
    this.collectionPlaylistIds = collectionPlaylistIds;
  }

  includesActivity(activityId: string): boolean {
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
  }

  belongsToExplorationPlaylist(explorationId: string): boolean {
    if (this.explorationPlaylistIds.indexOf(explorationId) !== -1) {
      return true;
    } else {
      return false;
    }
  }

  belongsToCollectionPlaylist(collectionId: string): boolean {
    if (this.collectionPlaylistIds.indexOf(collectionId) !== -1) {
      return true;
    } else {
      return false;
    }
  }

  belongsToCompletedExplorations(explorationId: string): boolean {
    if (this.completedExplorationIds.indexOf(explorationId) !== -1) {
      return true;
    } else {
      return false;
    }
  }

  belongsToCompletedCollections(collectionId: string): boolean {
    if (this.completedCollectionIds.indexOf(collectionId) !== -1) {
      return true;
    } else {
      return false;
    }
  }

  belongsToIncompleteExplorations(explorationId: string): boolean {
    if (this.incompleteExplorationIds.indexOf(explorationId) !== -1) {
      return true;
    } else {
      return false;
    }
  }

  belongsToIncompleteCollections(collectionId: string): boolean {
    if (this.incompleteCollectionIds.indexOf(collectionId) !== -1) {
      return true;
    } else {
      return false;
    }
  }

  addToExplorationLearnerPlaylist(explorationId: string): void {
    this.explorationPlaylistIds.push(explorationId);
  }

  removeFromExplorationLearnerPlaylist(explorationId: string): void {
    var index = this.explorationPlaylistIds.indexOf(explorationId);
    if (index !== -1) {
      this.explorationPlaylistIds.splice(index, 1);
    }
  }

  addToCollectionLearnerPlaylist(collectionId: string): void {
    this.collectionPlaylistIds.push(collectionId);
  }

  removeFromCollectionLearnerPlaylist(collectionId: string): void {
    var index = this.collectionPlaylistIds.indexOf(collectionId);
    if (index !== -1) {
      this.collectionPlaylistIds.splice(index, 1);
    }
  }
}

@Injectable({
  providedIn: 'root'
})
export class LearnerDashboardActivityIdsObjectFactory {
  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'skillRightsBackendDict' is a dict with underscore_cased
  // keys which give tslint errors against underscore_casing in favor of
  // camelCasing.
  createFromBackendDict(
      learnerDashboardActivityIdsDict: any): LearnerDashboardActivityIds {
    return new LearnerDashboardActivityIds(
      learnerDashboardActivityIdsDict.incomplete_exploration_ids,
      learnerDashboardActivityIdsDict.incomplete_collection_ids,
      learnerDashboardActivityIdsDict.completed_exploration_ids,
      learnerDashboardActivityIdsDict.completed_collection_ids,
      learnerDashboardActivityIdsDict.exploration_playlist_ids,
      learnerDashboardActivityIdsDict.collection_playlist_ids);
  }
}

angular.module('oppia').factory(
  'LearnerDashboardActivityIdsObjectFactory',
  downgradeInjectable(LearnerDashboardActivityIdsObjectFactory));
