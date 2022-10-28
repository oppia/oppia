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

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import { Collection } from 'domain/collection/collection.model';
import { GuestCollectionProgress } from 'domain/collection/guest-collection-progress.model';
import { WindowRef } from 'services/contextual/window-ref.service';

@Injectable({
  providedIn: 'root'
})
export class GuestCollectionProgressService {
  constructor(private windowRef: WindowRef) {}

  COLLECTION_STORAGE_KEY = 'collectionProgressStore_v1';

  storeGuestCollectionProgress(
      guestCollectionProgress: GuestCollectionProgress): void {
    this.windowRef.nativeWindow.localStorage[this.COLLECTION_STORAGE_KEY] = (
      guestCollectionProgress.toJson());
  }

  loadGuestCollectionProgress(): GuestCollectionProgress {
    return GuestCollectionProgress.createFromJson(
      this.windowRef.nativeWindow.localStorage[this.COLLECTION_STORAGE_KEY]);
  }

  recordCompletedExploration(
      collectionId: string, explorationId: string): void {
    let guestCollectionProgress = this.loadGuestCollectionProgress();
    const completedExplorationIdHasBeenAdded = (
      guestCollectionProgress.addCompletedExplorationId(
        collectionId, explorationId));
    if (completedExplorationIdHasBeenAdded) {
      this.storeGuestCollectionProgress(guestCollectionProgress);
    }
  }

  getValidCompletedExplorationIds(collection: Collection): string[] {
    const collectionId = collection.getId();
    const guestCollectionProgress = this.loadGuestCollectionProgress();
    if (collectionId === null) {
      throw new Error('Collection does not exist!');
    }
    let completedExplorationIds = (
      guestCollectionProgress.getCompletedExplorationIds(collectionId));
    // Filter the exploration IDs by whether they are contained within the
    // specified collection structure.
    return completedExplorationIds.filter((expId) => {
      return collection.containsCollectionNode(expId);
    });
  }

  // This method corresponds to collection_domain.get_next_exploration_id.
  // A null value will be returned if no explorationIds exist or all
  // explorations are completed.
  _getNextExplorationId(
      collection: Collection, completedIds: string[]): string | null {
    var explorationIds = collection.getExplorationIds();

    for (var i = 0; i < explorationIds.length; i++) {
      if (completedIds.indexOf(explorationIds[i]) === -1) {
        return explorationIds[i];
      }
    }
    return null;
  }

  /**
   * Records that the specified exploration was completed in the context of
   * the specified collection, as a guest.
   */
  recordExplorationCompletedInCollection(
      collectionId: string, explorationId: string): void {
    this.recordCompletedExploration(collectionId, explorationId);
  }

  /**
   * Returns whether the guest user has made any progress toward completing
   * the specified collection by completing at least one exploration related
   * to the collection. Note that this does not account for any completed
   * explorations which are no longer referenced by the collection;
   * getCompletedExplorationIds() should be used for that, instead.
   */
  hasCompletedSomeExploration(collectionId: string): boolean {
    var guestCollectionProgress = this.loadGuestCollectionProgress();
    return guestCollectionProgress.hasCompletionProgress(collectionId);
  }

  /**
   * Given a collection object, returns the list of exploration IDs
   * completed by the guest user. The return list of exploration IDs will
   * not include any previously completed explorations for the given
   * collection that are no longer part of the collection.
   */
  getCompletedExplorationIds(collection: Collection): string[] {
    return this.getValidCompletedExplorationIds(collection);
  }

  /**
   * Given a collection object a list of completed exploration IDs, returns
   * the next exploration ID the guest user can play as part of
   * completing the collection. If this method returns null, the
   * guest has completed the collection.
   */
  getNextExplorationId(
      collection: Collection,
      completedExplorationIds: string[]
  ): string | null {
    return this._getNextExplorationId(collection, completedExplorationIds);
  }
}

angular.module('oppia').factory(
  'GuestCollectionProgressService',
  downgradeInjectable(GuestCollectionProgressService));
