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
 * @fileoverview Frontend Model for guest collection progress.
 */

import cloneDeep from 'lodash/cloneDeep';

export class GuestCollectionProgress {
  _completedExplorationsMap: {[key: string]: string[]};

  constructor(completedExplorationsMap: {[key: string]: string[]}) {
    this._completedExplorationsMap = completedExplorationsMap;
  }

  static createFromJson(
    collectionProgressJson: string
  ): GuestCollectionProgress {
    if (collectionProgressJson) {
      return new GuestCollectionProgress(JSON.parse(collectionProgressJson));
    } else {
      return new GuestCollectionProgress({});
    }
  }

  // Returns whether the guest has made any progress towards completing the
  // specified collection ID. Note that this does not account for whether the
  // completed explorations are still contained within that collection.
  hasCompletionProgress(collectionId: string): boolean {
    return this._completedExplorationsMap.hasOwnProperty(collectionId);
  }

  // Returns an array of exploration IDs which have been completed by the
  // specified collection ID, or empty if none have.
  getCompletedExplorationIds(collectionId: string): string[] {
    if (!this.hasCompletionProgress(collectionId)) {
      return [];
    }
    return cloneDeep(this._completedExplorationsMap[collectionId]);
  }

  // Specifies that a specific exploration ID has been completed in the
  // context of the specified collection. Returns whether that exploration ID
  // was not previously registered as completed for the collection.
  addCompletedExplorationId(
    collectionId: string,
    explorationId: string
  ): boolean {
    var completedExplorationIds = this.getCompletedExplorationIds(collectionId);
    if (completedExplorationIds.indexOf(explorationId) === -1) {
      completedExplorationIds.push(explorationId);
      this._completedExplorationsMap[collectionId] = completedExplorationIds;
      return true;
    }
    return false;
  }

  // Converts this object to JSON for storage.
  toJson(): string {
    return JSON.stringify(this._completedExplorationsMap);
  }
}
