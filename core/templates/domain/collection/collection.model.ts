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
 * @fileoverview Frontend Model for collection.
 */

import cloneDeep from 'lodash/cloneDeep';

import {
  CollectionNode,
  CollectionNodeBackendDict,
} from 'domain/collection/collection-node.model';
import {
  CollectionPlaythrough,
  CollectionPlaythroughBackendDict
} from 'domain/collection/collection-playthrough.model';

interface ExplorationIdToNodeIndexMap {
  [explorationId: string]: number;
}

export interface CollectionBackendDict {
  // When creating a new collection, properties below are always
  // initialized with null values. These are null until populated
  // from the backend and provided themselves by the user.
  'id': string | null;
  'title': string | null;
  'objective': string | null;
  'language_code': string | null;
  'tags': string[] | null;
  'schema_version': number | null;
  'category': string | null;
  'version': number | null;
  'playthrough_dict': CollectionPlaythroughBackendDict;
  'nodes': CollectionNodeBackendDict[];
}

export class Collection {
  id: string | null;
  title: string | null;
  objective: string | null;
  languageCode: string | null;
  tags: string[] | null;
  playthrough: CollectionPlaythrough;
  category: string | null;
  version: number | null;
  schemaVersion: number | null;
  nodes: CollectionNode[];
  explorationIdToNodeIndexMap: ExplorationIdToNodeIndexMap = {};

  constructor(
      id: string | null, title: string | null, objective: string | null,
      languageCode: string | null, tags: string[] | null,
      playthrough: CollectionPlaythrough, category: string | null,
      version: number | null, schemaVersion: number | null,
      nodes: CollectionNode[]) {
    this.id = id;
    this.title = title;
    this.objective = objective;
    this.languageCode = languageCode;
    this.tags = tags;
    this.category = category;
    this.version = version;
    this.schemaVersion = schemaVersion;
    this.playthrough = playthrough;
    this.nodes = [];

    // This map acts as a fast way of looking up a collection node for a given
    // exploration ID.
    this.explorationIdToNodeIndexMap = {};
    for (var i = 0; i < nodes.length; i++) {
      this.nodes[i] = nodes[i];
      var explorationId = this.nodes[i].getExplorationId();
      this.explorationIdToNodeIndexMap[explorationId] = i;
    }
  }

  static create(collectionBackendObject: CollectionBackendDict): Collection {
    let collectionNodes = collectionBackendObject.nodes.map(
      node => CollectionNode.create(node));
    let collectionPlaythrough = (
      CollectionPlaythrough.createFromBackendObject(
        collectionBackendObject.playthrough_dict));

    return new Collection(
      collectionBackendObject.id,
      collectionBackendObject.title,
      collectionBackendObject.objective,
      collectionBackendObject.language_code,
      collectionBackendObject.tags,
      collectionPlaythrough,
      collectionBackendObject.category,
      collectionBackendObject.version,
      collectionBackendObject.schema_version,
      collectionNodes);
  }

  // Create a new, empty collection. This is not guaranteed to pass validation
  // tests.
  static createEmptyCollection(): Collection {
    let emptyCollectionPlaythrough = CollectionPlaythrough.create(null, []);
    return new Collection(
      null, null, null, null, null, emptyCollectionPlaythrough,
      null, null, null, []);
  }

  getId(): string | null {
    return this.id;
  }

  getTitle(): string | null {
    return this.title;
  }

  setTitle(title: string | null): void {
    this.title = title;
  }

  getCategory(): string | null {
    return this.category;
  }

  getSchemaVersion(): number | null {
    return this.schemaVersion;
  }

  getPlaythrough(): CollectionPlaythrough {
    return this.playthrough;
  }

  setCategory(category: string | null): void {
    this.category = category;
  }

  getObjective(): string | null {
    return this.objective;
  }

  setObjective(objective: string | null): void {
    this.objective = objective;
  }

  getLanguageCode(): string | null {
    return this.languageCode;
  }

  setLanguageCode(languageCode: string | null): void {
    this.languageCode = languageCode;
  }

  getTags(): string[] | null {
    return this.tags;
  }

  setTags(tags: string[] | null): void {
    this.tags = tags;
  }

  getVersion(): number | null {
    return this.version;
  }

  // Adds a new frontend collection node domain object to this collection.
  // This will return true if the node was successfully added, or false if the
  // given collection node references an exploration ID already referenced by
  // another node within this collection. Changes to the provided object will
  // be reflected in this collection.
  addCollectionNode(collectionNodeObject: CollectionNode): boolean {
    var explorationId = collectionNodeObject.getExplorationId();
    if (!this.explorationIdToNodeIndexMap.hasOwnProperty(explorationId)) {
      this.explorationIdToNodeIndexMap[explorationId] = this.nodes.length;
      this.nodes.push(collectionNodeObject);
      return true;
    }
    return false;
  }

  // This will swap 2 nodes of the collection and update the exploration id
  // to node index map accordingly.
  swapCollectionNodes(firstIndex: number, secondIndex: number): boolean {
    if (firstIndex >= this.nodes.length ||
        secondIndex >= this.nodes.length ||
        firstIndex < 0 ||
        secondIndex < 0) {
      return false;
    }

    var firstIndexId = this.nodes[firstIndex].getExplorationId();
    var secondIndexId = this.nodes[secondIndex].getExplorationId();
    var temp = this.nodes[firstIndex];
    this.nodes[firstIndex] = this.nodes[secondIndex];
    this.nodes[secondIndex] = temp;

    this.explorationIdToNodeIndexMap[firstIndexId] = secondIndex;
    this.explorationIdToNodeIndexMap[secondIndexId] = firstIndex;
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
    if (this.explorationIdToNodeIndexMap.hasOwnProperty(explorationId)) {
      var nodeIndex = this.explorationIdToNodeIndexMap[explorationId];
      delete this.explorationIdToNodeIndexMap[explorationId];
      this.nodes.splice(nodeIndex, 1);

      // Update all node exploration ID map references past the removed index
      // to ensure they are still pointing to correct indexes.
      for (var i = nodeIndex; i < this.nodes.length; i++) {
        var nodeExpId = this.nodes[i].getExplorationId();
        this.explorationIdToNodeIndexMap[nodeExpId] = i;
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
    this.nodes.length = 0;
    this.explorationIdToNodeIndexMap = {};
  }

  // Returns whether any collection nodes in this collection reference the
  // provided exploration ID.
  containsCollectionNode(explorationId: string): boolean {
    return this.explorationIdToNodeIndexMap.hasOwnProperty(explorationId);
  }

  // Returns a collection node given an exploration ID, or undefined if no
  // collection node within this collection references the provided
  // exploration ID.
  getCollectionNodeByExplorationId(expId: string): CollectionNode {
    return this.nodes[this.explorationIdToNodeIndexMap[expId]];
  }

  // Returns a list of collection node objects for this collection. Changes to
  // nodes returned by this function will be reflected in the collection.
  // Changes to the list itself will not be reflected in this collection.
  getCollectionNodes(): CollectionNode[] {
    return this.nodes.slice();
  }

  getCollectionNodeCount(): number {
    return this.nodes.length;
  }

  // Returns the reference to the internal nodes array; this function is only
  // meant to be used for Angular bindings and should never be used in code.
  // Please use getCollectionNodes() and related functions, instead. Please
  // also be aware this exposes internal state of the collection domain
  // object, so changes to the array itself may internally break the domain
  // object.
  getBindableCollectionNodes(): CollectionNode[] {
    return this.nodes;
  }

  // Returns the collection node which is initially available to play
  // by the player.
  getStartingCollectionNode(): CollectionNode | null {
    if (this.nodes.length === 0) {
      return null;
    } else {
      return this.nodes[0];
    }
  }

  // Returns a list of all exploration IDs referenced by this collection.
  // Changes to the list itself will not be reflected in this collection.
  getExplorationIds(): string[] {
    return cloneDeep(Object.keys(this.explorationIdToNodeIndexMap));
  }

  // Reassigns all values within this collection to match the existing
  // collection. This is performed as a deep copy such that none of the
  // internal, bindable objects are changed within this collection. Note that
  // the collection nodes within this collection will be completely redefined
  // as copies from the specified collection.
  copyFromCollection(otherCollection: Collection): void {
    this.id = otherCollection.getId();
    this.setTitle(otherCollection.getTitle());
    this.setCategory(otherCollection.getCategory());
    this.setObjective(otherCollection.getObjective());
    this.setLanguageCode(otherCollection.getLanguageCode());
    this.setTags(otherCollection.getTags());
    this.version = otherCollection.getVersion();
    this.playthrough = otherCollection.getPlaythrough();
    this.schemaVersion = otherCollection.getSchemaVersion();
    this.clearCollectionNodes();

    var nodes = otherCollection.getCollectionNodes();
    for (var i = 0; i < nodes.length; i++) {
      this.addCollectionNode(cloneDeep(nodes[i]));
    }
  }
}
