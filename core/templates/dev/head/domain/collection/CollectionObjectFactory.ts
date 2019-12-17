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
 * @fileoverview Factory for creating and mutating instances of frontend
 * collection domain objects.
 */

import cloneDeep from 'lodash/cloneDeep';

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { CollectionNode, CollectionNodeObjectFactory } from
  'domain/collection/CollectionNodeObjectFactory';

export class Collection {
  _id: string;
  _title: string;
  _objective: string;
  _languageCode: string;
  _tags: string[];
  _category: string;
  _version: number;
  _nodes: CollectionNode[];
  _explorationIdToNodeIndexMap: {};
  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'collectionBackendObject' is a dict with underscore_cased
  // keys which give tslint errors against underscore_casing in favor of
  // camelCasing.
  constructor(
      collectionBackendObject: any,
      collectionNodeObjectFactory: CollectionNodeObjectFactory) {
    this._id = collectionBackendObject.id;
    this._title = collectionBackendObject.title;
    this._objective = collectionBackendObject.objective;
    this._languageCode = collectionBackendObject.language_code;
    this._tags = collectionBackendObject.tags;
    this._category = collectionBackendObject.category;
    this._version = collectionBackendObject.version;
    this._nodes = [];

    // This map acts as a fast way of looking up a collection node for a given
    // exploration ID.
    this._explorationIdToNodeIndexMap = {};
    for (var i = 0; i < collectionBackendObject.nodes.length; i++) {
      this._nodes[i] = collectionNodeObjectFactory.create(
        collectionBackendObject.nodes[i]);
      var explorationId = this._nodes[i].getExplorationId();
      this._explorationIdToNodeIndexMap[explorationId] = i;
    }
  }

  getId(): string {
    return this._id;
  }

  getTitle(): string {
    return this._title;
  }

  setTitle(title: string): void {
    this._title = title;
  }

  getCategory(): string {
    return this._category;
  }

  setCategory(category: string) {
    this._category = category;
  }

  getObjective(): string {
    return this._objective;
  }

  setObjective(objective: string): void {
    this._objective = objective;
  }

  getLanguageCode(): string {
    return this._languageCode;
  }

  setLanguageCode(languageCode: string): void {
    this._languageCode = languageCode;
  }

  getTags(): string[] {
    return this._tags;
  }

  setTags(tags: string[]): void {
    this._tags = tags;
  }

  getVersion(): number {
    return this._version;
  }

  // Adds a new frontend collection node domain object to this collection.
  // This will return true if the node was successfully added, or false if the
  // given collection node references an exploration ID already referenced by
  // another node within this collection. Changes to the provided object will
  // be reflected in this collection.
  addCollectionNode(collectionNodeObject: CollectionNode): boolean {
    var explorationId = collectionNodeObject.getExplorationId();
    if (!this._explorationIdToNodeIndexMap.hasOwnProperty(explorationId)) {
      this._explorationIdToNodeIndexMap[explorationId] = this._nodes.length;
      this._nodes.push(collectionNodeObject);
      return true;
    }
    return false;
  }

  // This will swap 2 nodes of the collection and update the exploration id
  // to node index map accordingly.
  swapCollectionNodes(firstIndex: number, secondIndex: number): boolean {
    if (firstIndex >= this._nodes.length ||
        secondIndex >= this._nodes.length ||
        firstIndex < 0 ||
        secondIndex < 0) {
      return false;
    }

    var firstIndexId = this._nodes[firstIndex].getExplorationId();
    var secondIndexId = this._nodes[secondIndex].getExplorationId();
    var temp = this._nodes[firstIndex];
    this._nodes[firstIndex] = this._nodes[secondIndex];
    this._nodes[secondIndex] = temp;

    this._explorationIdToNodeIndexMap[firstIndexId] = secondIndex;
    this._explorationIdToNodeIndexMap[secondIndexId] = firstIndex;
    return true;
  }

  // Attempts to remove a collection node from this collection given the
  // specified exploration ID. Returns whether the collection node was
  // removed, which depends on whether any collection nodes reference the
  // given exploration ID.
  deleteCollectionNode(explorationId: string): boolean {
    // TODO(bhenning): Consider whether the removed collection node should be
    // invalidated, leading to errors if its mutated in the future. This might
    // help prevent bugs where collection nodes are stored and changed after
    // being removed from a collection.
    if (this._explorationIdToNodeIndexMap.hasOwnProperty(explorationId)) {
      var nodeIndex = this._explorationIdToNodeIndexMap[explorationId];
      delete this._explorationIdToNodeIndexMap[explorationId];
      this._nodes.splice(nodeIndex, 1);

      // Update all node exploration ID map references past the removed index
      // to ensure they are still pointing to correct indexes.
      for (var i = nodeIndex; i < this._nodes.length; i++) {
        var nodeExpId = this._nodes[i].getExplorationId();
        this._explorationIdToNodeIndexMap[nodeExpId] = i;
      }
      return true;
    }
    return false;
  }

  // Deletes all collection nodes within this collection.
  clearCollectionNodes(): void {
    // Clears the existing array in-place, since there may be Angular bindings
    // to this array and they can't be reset to empty arrays.See for context:
    // http://stackoverflow.com/a/1232046
    this._nodes.length = 0;
    this._explorationIdToNodeIndexMap = {};
  }

  // Returns whether any collection nodes in this collection reference the
  // provided exploration ID.
  containsCollectionNode(explorationId: string): boolean {
    return this._explorationIdToNodeIndexMap.hasOwnProperty(explorationId);
  }

  // Returns a collection node given an exploration ID, or undefined if no
  // collection node within this collection references the provided
  // exploration ID.
  getCollectionNodeByExplorationId(expId: string): CollectionNode {
    return this._nodes[this._explorationIdToNodeIndexMap[expId]];
  }

  // Returns a list of collection node objects for this collection. Changes to
  // nodes returned by this function will be reflected in the collection.
  // Changes to the list itself will not be reflected in this collection.
  getCollectionNodes(): CollectionNode[] {
    return this._nodes.slice();
  }

  getCollectionNodeCount(): number {
    return this._nodes.length;
  }

  // Returns the reference to the internal nodes array; this function is only
  // meant to be used for Angular bindings and should never be used in code.
  // Please use getCollectionNodes() and related functions, instead. Please
  // also be aware this exposes internal state of the collection domain
  // object, so changes to the array itself may internally break the domain
  // object.
  getBindableCollectionNodes(): CollectionNode[] {
    return this._nodes;
  }

  // Returns the collection node which is initially available to play
  // by the player.
  getStartingCollectionNode(): CollectionNode {
    if (this._nodes.length === 0) {
      return null;
    } else {
      return this._nodes[0];
    }
  }

  // Returns a list of all exploration IDs referenced by this collection.
  // Changes to the list itself will not be reflected in this collection.
  getExplorationIds(): string[] {
    return cloneDeep(Object.keys(this._explorationIdToNodeIndexMap));
  }

  // Reassigns all values within this collection to match the existing
  // collection. This is performed as a deep copy such that none of the
  // internal, bindable objects are changed within this collection. Note that
  // the collection nodes within this collection will be completely redefined
  // as copies from the specified collection.
  copyFromCollection(otherCollection: Collection): void {
    this._id = otherCollection.getId();
    this.setTitle(otherCollection.getTitle());
    this.setCategory(otherCollection.getCategory());
    this.setObjective(otherCollection.getObjective());
    this.setLanguageCode(otherCollection.getLanguageCode());
    this.setTags(otherCollection.getTags());
    this._version = otherCollection.getVersion();
    this.clearCollectionNodes();

    var nodes = otherCollection.getCollectionNodes();
    for (var i = 0; i < nodes.length; i++) {
      this.addCollectionNode(cloneDeep(nodes[i]));
    }
  }
}

@Injectable({
  providedIn: 'root'
})
export class CollectionObjectFactory {
  constructor(
      private collectionNodeObjectFactory: CollectionNodeObjectFactory) {}
  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'collectionBackendObject' is a dict with underscore_cased
  // keys which give tslint errors against underscore_casing in favor of
  // camelCasing.
  create(collectionBackendObject: any): Collection {
    return new Collection(
      collectionBackendObject, this.collectionNodeObjectFactory);
  }

  // Create a new, empty collection. This is not guaranteed to pass validation
  // tests.
  createEmptyCollection(): Collection {
    return new Collection({
      nodes: [],
    }, this.collectionNodeObjectFactory);
  }
}

angular.module('oppia').factory(
  'CollectionObjectFactory', downgradeInjectable(CollectionObjectFactory));
