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
 * @fileoverview Service to maintain the state of a single collection shared
 * throughout the collection editor. This service provides functionality for
 * retrieving the collection, saving it, and listening for changes.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { CollectionNode } from 'domain/collection/collection-node.model';
import { CollectionUpdateService } from 'domain/collection/collection-update.service';
import { Collection } from 'domain/collection/collection.model';
import { LearnerExplorationSummaryBackendDict } from 'domain/summary/learner-exploration-summary.model';

interface SwapFunction {
  (
    collection: Collection,
    linearNodeList: CollectionNode[], nodeIndex: number): void;
  (
    collection: Collection,
    linearNodeList: CollectionNode[], nodeIndex: number): void;
  (arg0: Collection, arg1: CollectionNode[], arg2: number): void;
 }

@Injectable({
  providedIn: 'root'
})
export class CollectionLinearizerService {
  explorationIds: string[];
  explorationId: number;
  constructor(
      private collectionUpdateService: CollectionUpdateService
  ) {}

  _getNextExplorationId(
      collection: Collection,
      completedExpIds: string[]): string | null {
    this.explorationIds = collection.getExplorationIds();

    for (let i = 0; i < this.explorationIds.length; i++) {
      if (completedExpIds.indexOf(this.explorationIds[i]) === -1) {
        return this.explorationIds[i];
      }
    }
    return null;
  }

  // Given a non linear collection input, the function will linearize it by
  // picking the first node it encounters on the branch and ignore the others.
  _getCollectionNodesInPlayableOrder(collection: Collection): CollectionNode[] {
    return collection.getCollectionNodes();
  }

  addAfter(collection: Collection, curExplorationId: string): void {
    collection.getCollectionNodeByExplorationId(curExplorationId);
  }

  findNodeIndex(
      linearNodeList: CollectionNode[],
      explorationId: string): number {
    let index = -1;
    for (let i = 0; i < linearNodeList.length; i++) {
      if (linearNodeList[i].getExplorationId() === explorationId) {
        index = i;
        break;
      }
    }
    return index;
  }

  // Swap the node at the specified index with the node immediately to the
  // left of it.
  swapLeft = (
      collection: Collection,
      linearNodeList: CollectionNode[],
      nodeIndex: number): void => {
    let leftNodeIndex = nodeIndex > 0 ? nodeIndex - 1 : null;

    if (leftNodeIndex === null) {
      return;
    }

    this.collectionUpdateService.swapNodes(
      collection, leftNodeIndex, nodeIndex);
  };

  swapRight = (
      collection: Collection,
      linearNodeList: CollectionNode[], nodeIndex: number): void => {
    let rightNodeIndex = nodeIndex + 1;
    this.collectionUpdateService.swapNodes(
      collection, rightNodeIndex, nodeIndex
    );
  };

  shiftNode(
      collection: Collection, explorationId: string,
      swapFunction: SwapFunction): boolean {
    // There is nothing to shift if the collection has only 1 node.
    if (collection.getCollectionNodeCount() > 1) {
      let linearNodeList = this._getCollectionNodesInPlayableOrder(collection);
      let nodeIndex = this.findNodeIndex(linearNodeList, explorationId);
      if (nodeIndex === -1) {
        return false;
      }
      swapFunction(collection, linearNodeList, nodeIndex);
    }
    return true;
  }

  /**
     * Given a collection and a list of completed exploration IDs within the
     * context of that collection, returns a list of which explorations in the
     * collection is immediately playable by the user. NOTE: This function
     * does not assume that the collection is linear.
     */
  getNextExplorationId(
      collection: Collection, completedExpIds: string[]): string {
    return this._getNextExplorationId(collection, completedExpIds);
  }

  /**
     * Given a collection, returns a linear list of collection nodes which
     * represents a valid path for playing through this collection.
     */
  getCollectionNodesInPlayableOrder(collection: Collection): CollectionNode[] {
    return this._getCollectionNodesInPlayableOrder(collection);
  }

  /**
     * Inserts a new collection node at the end of the collection's playable
     * list of explorations, based on the specified exploration ID and
     * exploration summary backend object.
     */
  appendCollectionNode(
      collection: Collection, explorationId: string,
      summaryBackendObject: LearnerExplorationSummaryBackendDict): void {
    let linearNodeList = this._getCollectionNodesInPlayableOrder(collection);
    this.collectionUpdateService.addCollectionNode(
      collection, explorationId, summaryBackendObject);
    if (linearNodeList.length > 0) {
      let lastNode = linearNodeList[linearNodeList.length - 1];
      this.addAfter(collection, lastNode.getExplorationId());
    }
  }

  /**
     * Remove a collection node from a given collection which maps to the
     * specified exploration ID. This function ensures the linear structure of
     * the collection is maintained. Returns whether the provided exploration
     * ID is contained within the linearly playable path of the specified
     * collection.
     */
  removeCollectionNode(collection: Collection, explorationId: string): boolean {
    if (!collection.containsCollectionNode(explorationId)) {
      return false;
    }

    // Delete the node.
    this.collectionUpdateService.deleteCollectionNode(
      collection, explorationId);
    return true;
  }

  /**
     * Looks up a collection node given an exploration ID in the specified
     * collection and attempts to shift it left in the linear ordering of the
     * collection. If the node is the first exploration played by the player,
     * then this function is a no-op. Returns false if the specified
     * exploration ID does not associate to any nodes in the collection.
     */
  shiftNodeLeft(collection: Collection, explorationId: string): boolean {
    return this.shiftNode(collection, explorationId, this.swapLeft);
  }

  /**
     * Looks up a collection node given an exploration ID in the specified
     * collection and attempts to shift it right in the linear ordering of the
     * collection. If the node is the last exploration played by the player,
     * then this function is a no-op. Returns false if the specified
     * exploration ID does not associate to any nodes in the collection.
     */
  shiftNodeRight(collection: Collection, explorationId: string): boolean {
    return this.shiftNode(collection, explorationId, this.swapRight);
  }
}

angular.module('oppia').factory('CollectionLinearizerService',
  downgradeInjectable(CollectionLinearizerService));
