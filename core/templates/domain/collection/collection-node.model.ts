// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Frontend Model for Collection Node.
 */

import cloneDeep from 'lodash/cloneDeep';

import { AppConstants } from 'app.constants';
import { LearnerExplorationSummaryBackendDict } from
  'domain/summary/learner-exploration-summary.model';

export interface CollectionNodeBackendDict {
  'exploration_id': string;
  'exploration_summary': LearnerExplorationSummaryBackendDict | null;
}

export class CollectionNode {
  _explorationId: string;
  _explorationSummaryObject: LearnerExplorationSummaryBackendDict | null;

  constructor(collectionNodeBackendObject: CollectionNodeBackendDict) {
    this._explorationId = collectionNodeBackendObject.exploration_id;
    this._explorationSummaryObject = cloneDeep(
      collectionNodeBackendObject.exploration_summary);
  }

  static create(
      collectionNodeBackendObject: CollectionNodeBackendDict):
      CollectionNode {
    return new CollectionNode(collectionNodeBackendObject);
  }

  static createFromExplorationId(explorationId: string): CollectionNode {
    return CollectionNode.create({
      exploration_id: explorationId,
      exploration_summary: null
    });
  }

  // Returns the ID of the exploration represented by this collection node.
  // This property is immutable.
  getExplorationId(): string {
    return this._explorationId;
  }

  // Returns the title of the exploration represented by this collection node.
  // This property is immutable. The value returned by this function is
  // null if doesExplorationExist() returns false.
  getExplorationTitle(): string | null {
    if (this._explorationSummaryObject) {
      return this._explorationSummaryObject.title;
    } else {
      return null;
    }
  }

  // Returns whether the exploration referenced by this node is known to exist
  // in the backend. This property is immutable.
  doesExplorationExist(): boolean {
    return this._explorationSummaryObject !== null;
  }

  // Returns whether the exploration referenced by this node is private and
  // not published. This property is immutable. The value returned by this
  // function is undefined if doesExplorationExist() returns false.
  isExplorationPrivate(): boolean {
    if (this._explorationSummaryObject !== null) {
      return this._explorationSummaryObject.status === (
        AppConstants.ACTIVITY_STATUS_PRIVATE);
    } else {
      return false;
    }
  }

  // Returns a raw exploration summary object, as supplied by the backend for
  // frontend exploration summary tile displaying. Changes to the returned
  // object are not reflected in this domain object. The value returned by
  // this function is an object with empty values
  // if doesExplorationExist() returns false.
  getExplorationSummaryObject(): LearnerExplorationSummaryBackendDict | null {
    // TODO(bhenning): This should be represented by a
    // frontend summary domain object that is also shared with
    // the search result and profile pages.
    return cloneDeep(this._explorationSummaryObject);
  }

  // Sets the raw exploration summary object stored within this node.
  setExplorationSummaryObject(
      explorationSummaryBackendObject:
      LearnerExplorationSummaryBackendDict | null): void {
    this._explorationSummaryObject = cloneDeep(
      explorationSummaryBackendObject);
  }

  getCapitalizedObjective(): string | null {
    if (this._explorationSummaryObject !== null) {
      return (
        this._explorationSummaryObject.objective.charAt(0).toUpperCase() +
        this._explorationSummaryObject.objective.slice(1));
    } else {
      return null;
    }
  }
}
