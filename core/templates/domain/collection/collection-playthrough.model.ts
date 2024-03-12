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
 * @fileoverview Frontend Model for collection playthrough.
 */

import cloneDeep from 'lodash/cloneDeep';

export interface CollectionPlaythroughBackendDict {
  next_exploration_id: string | null;
  completed_exploration_ids: string[];
}

export class CollectionPlaythrough {
  _nextExplorationId: string | null;
  _completedExplorationIds: string[];

  // Stores information about a current playthrough of a collection for a
  // user.
  constructor(
    nextExplorationId: string | null,
    completedExplorationIds: string[]
  ) {
    this._nextExplorationId = nextExplorationId;
    this._completedExplorationIds = completedExplorationIds;
  }

  static createFromBackendObject(
    collectionPlaythroughBackendObject: CollectionPlaythroughBackendDict
  ): CollectionPlaythrough {
    return new CollectionPlaythrough(
      collectionPlaythroughBackendObject.next_exploration_id,
      collectionPlaythroughBackendObject.completed_exploration_ids
    );
  }

  static create(
    nextExplorationId: string | null,
    completedExplorationIds: string[]
  ): CollectionPlaythrough {
    return new CollectionPlaythrough(
      nextExplorationId,
      cloneDeep(completedExplorationIds)
    );
  }

  // Returns the upcoming exploration ID. Changes to this are not
  // reflected in the collection.
  getNextExplorationId(): string | null {
    return this._nextExplorationId;
  }

  getNextRecommendedCollectionNodeCount(): number {
    // As the collection is linear, only a single node would be available,
    // after any node.
    return 1;
  }

  // Returns a list of explorations completed that are related to this
  // collection. Changes to this list are not reflected in this collection.
  getCompletedExplorationIds(): string[] {
    return cloneDeep(this._completedExplorationIds);
  }

  getCompletedExplorationNodeCount(): number {
    return this._completedExplorationIds.length;
  }

  hasStartedCollection(): boolean {
    return this._completedExplorationIds.length !== 0;
  }

  hasFinishedCollection(): boolean {
    return this._nextExplorationId === null;
  }
}
