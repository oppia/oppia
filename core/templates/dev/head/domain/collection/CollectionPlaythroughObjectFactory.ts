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

import * as cloneDeep from 'lodash/cloneDeep';

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

export class CollectionPlaythrough {
  _nextExplorationId: string;
  _completedExplorationIds: string[];

  // Stores information about a current playthrough of a collection for a
  // user.
  constructor(nextExplorationId: string, completedExplorationIds: string[]) {
    this._nextExplorationId = nextExplorationId;
    this._completedExplorationIds = completedExplorationIds;
  }

  // Returns the upcoming exploration ID. Changes to this are not
  // reflected in the collection.
  getNextExplorationId(): string {
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

  // TODO(bhenning): Add setters for some of these properties. Setters allow
  // the collection editor to setup specifically configured playthrough
  // sessions of the collection player through this object (for example, the
  // editor would be able to fake which explorations were completed to see how
  // that particular configuration would look for a learner).
  hasFinishedCollection(): boolean {
    return this._nextExplorationId === null;
  }
}

@Injectable({
  providedIn: 'root'
})
export class CollectionPlaythroughObjectFactory {
  // Static class methods. Note that "this" is not available in static
  // contexts. This function takes a JSON object which represents a backend
  // collection playthrough python dict.
  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'collectionPlaythroughBackendObject' is a dict with
  // underscore_cased keys which give tslint errors against underscore_casing
  // in favor of camelCasing.
  createFromBackendObject(
      collectionPlaythroughBackendObject: any): CollectionPlaythrough {
    return new CollectionPlaythrough(
      collectionPlaythroughBackendObject.next_exploration_id,
      collectionPlaythroughBackendObject.completed_exploration_ids);
  }

  create(
      nextExplorationId: string,
      completedExplorationIds: string[]): CollectionPlaythrough {
    return new CollectionPlaythrough(
      nextExplorationId, cloneDeep(completedExplorationIds));
  }
}

angular.module('oppia').factory(
  'CollectionPlaythroughObjectFactory',
  downgradeInjectable(CollectionPlaythroughObjectFactory));
