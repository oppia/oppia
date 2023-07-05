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
 * @fileoverview Unit Tests for CollectionLinearizerService.
 */

import { TestBed } from '@angular/core/testing';
import { CollectionNode, CollectionNodeBackendDict } from 'domain/collection/collection-node.model';
import { Collection } from 'domain/collection/collection.model';
import { LearnerExplorationSummaryBackendDict } from 'domain/summary/learner-exploration-summary.model';
import { CollectionLinearizerService } from './collection-linearizer.service';

describe('Collection linearizer service', () => {
  let collectionLinearizerService: CollectionLinearizerService;
  let firstCollectionNode: CollectionNode;
  let secondCollectionNode: CollectionNode;
  let thirdCollectionNode: CollectionNode;

  beforeEach(() => {
    collectionLinearizerService = TestBed.inject(CollectionLinearizerService);

    let firstCollectionNodeBackendObject = {
      exploration_id: 'exp_id0',
      exploration_summary: {
        title: 'exp title0',
        category: 'exp category',
        objective: 'exp objective'
      }
    };
    firstCollectionNode = CollectionNode.create(
      firstCollectionNodeBackendObject as CollectionNodeBackendDict);

    let secondCollectionNodeBackendObject = {
      exploration_id: 'exp_id1',
      exploration_summary: {
        title: 'exp title1',
        category: 'exp category',
        objective: 'exp objective'
      }
    };
    secondCollectionNode = CollectionNode.create(
      secondCollectionNodeBackendObject as CollectionNodeBackendDict);

    let thirdCollectionNodeBackendObject = {
      exploration_id: 'exp_id2',
      exploration_summary: {
        title: 'exp title2',
        category: 'exp category',
        objective: 'exp objective'
      }
    };
    thirdCollectionNode = CollectionNode.create(
      thirdCollectionNodeBackendObject as CollectionNodeBackendDict);
  });

  // The linear order of explorations is: exp_id0 -> exp_id1 -> exp_id2.
  let createLinearCollection = () => {
    let collection = Collection.createEmptyCollection();

    // Add collections in a different order from which they will be displayed
    // by the linearizer for robustness.
    collection.addCollectionNode(firstCollectionNode);
    collection.addCollectionNode(secondCollectionNode);
    collection.addCollectionNode(thirdCollectionNode);
    return collection;
  };

  describe('removeCollectionNode()', () => {
    it('should not remove a non-existent node from a single node collection',
      () => {
        let collection = Collection.createEmptyCollection();
        collection.addCollectionNode(firstCollectionNode);
        expect(collection.containsCollectionNode('exp_id0')).toBe(true);
        expect(
          collectionLinearizerService.removeCollectionNode(
            collection, 'non_existent')).toBe(false);
        expect(collection.containsCollectionNode('exp_id0')).toBe(true);
        expect(
          collectionLinearizerService.getCollectionNodesInPlayableOrder(
            collection)).toEqual([firstCollectionNode]);
      }
    );

    it('should not remove a non-existent node from a multiple nodes collection',
      () => {
        let collection = createLinearCollection();
        expect(
          collectionLinearizerService.getCollectionNodesInPlayableOrder(
            collection)).toEqual(
          [firstCollectionNode, secondCollectionNode, thirdCollectionNode]);
        expect(
          collectionLinearizerService.removeCollectionNode(
            collection, 'non_existent')).toBe(false);
        expect(
          collectionLinearizerService.getCollectionNodesInPlayableOrder(
            collection)).toEqual(
          [firstCollectionNode, secondCollectionNode, thirdCollectionNode]);
      }
    );

    it('should correctly remove a node from a single node collection',
      () => {
        let collection = Collection.createEmptyCollection();
        collection.addCollectionNode(firstCollectionNode);
        expect(collection.containsCollectionNode('exp_id0')).toBe(true);
        expect(
          collectionLinearizerService.removeCollectionNode(
            collection, 'exp_id0')).toBe(true);
        expect(collection.containsCollectionNode('exp_id0')).toBe(false);
        expect(
          collectionLinearizerService.getCollectionNodesInPlayableOrder(
            collection)).toEqual([]);
      }
    );

    it('should correctly remove the first node from a collection', () => {
      let collection = createLinearCollection();
      expect(collection.containsCollectionNode('exp_id0')).toBe(true);
      expect(
        collectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual(
        [firstCollectionNode, secondCollectionNode, thirdCollectionNode]);
      expect(
        collectionLinearizerService.removeCollectionNode(
          collection, 'exp_id0')).toBe(true);
      expect(collection.containsCollectionNode('exp_id0')).toBe(false);
      expect(
        collectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual([secondCollectionNode, thirdCollectionNode]);
    });

    it('should correctly remove the last node from a collection', () => {
      let collection = createLinearCollection();
      expect(collection.containsCollectionNode('exp_id2')).toBe(true);
      expect(
        collectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual(
        [firstCollectionNode, secondCollectionNode, thirdCollectionNode]);
      expect(
        collectionLinearizerService.removeCollectionNode(
          collection, 'exp_id2')).toBe(true);
      expect(collection.containsCollectionNode('exp_id2')).toBe(false);
      expect(
        collectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual([firstCollectionNode, secondCollectionNode]);
    });

    it('should correctly remove a middle node from a collection', () => {
      let collection = createLinearCollection();
      expect(collection.containsCollectionNode('exp_id1')).toBe(true);
      expect(
        collectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual(
        [firstCollectionNode, secondCollectionNode, thirdCollectionNode]);
      expect(
        collectionLinearizerService.removeCollectionNode(
          collection, 'exp_id1')).toBe(true);
      expect(collection.containsCollectionNode('exp_id1')).toBe(false);
      expect(
        collectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual([firstCollectionNode, thirdCollectionNode]);
    });
  });

  describe('appendCollectionNode()', () => {
    it('should correctly append a node to an empty collection', () => {
      let collection = Collection.createEmptyCollection();
      expect(collection.containsCollectionNode('exp_id0')).toBe(false);
      expect(
        collectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual([]);
      collectionLinearizerService.appendCollectionNode(
        collection,
        'exp_id0',
        firstCollectionNode.getExplorationSummaryObject() as
        LearnerExplorationSummaryBackendDict);
      firstCollectionNode = collection.getCollectionNodeByExplorationId(
        'exp_id0');
      expect(
        collectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual([firstCollectionNode]);
    });

    it('should correctly append a node to a non-empty collection', () => {
      let collection = createLinearCollection();
      let newCollectionNodeBackendObject = {
        exploration_id: 'exp_id3',
        exploration_summary: {
          title: 'exp title3',
          category: 'exp category',
          objective: 'exp objective'
        }
      };
      let newCollectionNode = CollectionNode.create(
        newCollectionNodeBackendObject as CollectionNodeBackendDict);
      expect(
        collectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual(
        [firstCollectionNode, secondCollectionNode, thirdCollectionNode]);
      collectionLinearizerService.appendCollectionNode(
        collection, 'exp_id3',
        newCollectionNode.getExplorationSummaryObject() as
        LearnerExplorationSummaryBackendDict);
      newCollectionNode = collection.getCollectionNodeByExplorationId(
        'exp_id3');
      expect(
        collectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual([
        collection.getCollectionNodeByExplorationId('exp_id0'),
        collection.getCollectionNodeByExplorationId('exp_id1'),
        collection.getCollectionNodeByExplorationId('exp_id2'),
        collection.getCollectionNodeByExplorationId('exp_id3')]);
    });
  });

  describe('shiftNodeLeft()', () => {
    it('should correctly shift a node in a single node collection',
      () => {
        let collection = Collection.createEmptyCollection();
        collection.addCollectionNode(firstCollectionNode);
        expect(
          collectionLinearizerService.getCollectionNodesInPlayableOrder(
            collection)).toEqual([firstCollectionNode]);
        expect(
          collectionLinearizerService.shiftNodeLeft(
            collection, 'exp_id0')).toBe(true);
        expect(
          collectionLinearizerService.getCollectionNodesInPlayableOrder(
            collection)).toEqual([firstCollectionNode]);
      }
    );

    it('should not shift a non-existent node', () => {
      let collection = createLinearCollection();
      expect(
        collectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual(
        [firstCollectionNode, secondCollectionNode, thirdCollectionNode]);
      expect(collectionLinearizerService.shiftNodeLeft(
        collection, 'non_existent')).toBe(false);
      expect(
        collectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual(
        [firstCollectionNode, secondCollectionNode, thirdCollectionNode]);
    });

    it('should correctly shift the first node', () => {
      let collection = createLinearCollection();
      expect(
        collectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual(
        [firstCollectionNode, secondCollectionNode, thirdCollectionNode]);
      expect(
        collectionLinearizerService.shiftNodeLeft(
          collection, 'exp_id0')).toBe(true);
      expect(
        collectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual(
        [firstCollectionNode, secondCollectionNode, thirdCollectionNode]);
    });

    it('should correctly shift the last node', () => {
      let collection = createLinearCollection();
      expect(
        collectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual(
        [firstCollectionNode, secondCollectionNode, thirdCollectionNode]);
      expect(
        collectionLinearizerService.shiftNodeLeft(
          collection, 'exp_id2')).toBe(true);
      expect(
        collectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual(
        [firstCollectionNode, thirdCollectionNode, secondCollectionNode]);
    });

    it('should correctly shift a middle node', () => {
      let collection = createLinearCollection();
      expect(
        collectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual(
        [firstCollectionNode, secondCollectionNode, thirdCollectionNode]);
      expect(
        collectionLinearizerService.shiftNodeLeft(
          collection, 'exp_id1')).toBe(true);
      expect(
        collectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual(
        [secondCollectionNode, firstCollectionNode, thirdCollectionNode]);
    });
  });

  describe('shiftNodeRight()', () => {
    it('should correctly shift a node in a single node collection',
      () => {
        let collection = Collection.createEmptyCollection();
        collection.addCollectionNode(firstCollectionNode);
        expect(
          collectionLinearizerService.getCollectionNodesInPlayableOrder(
            collection)).toEqual([firstCollectionNode]);
        expect(
          collectionLinearizerService.shiftNodeRight(
            collection, 'exp_id0')).toBe(true);
        expect(
          collectionLinearizerService.getCollectionNodesInPlayableOrder(
            collection)).toEqual([firstCollectionNode]);
      }
    );

    it('should not shift a non-existent node', () => {
      let collection = createLinearCollection();
      expect(
        collectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual(
        [firstCollectionNode, secondCollectionNode, thirdCollectionNode]);
      expect(
        collectionLinearizerService.shiftNodeRight(
          collection, 'non_existent')).toBe(false);
      expect(
        collectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual(
        [firstCollectionNode, secondCollectionNode, thirdCollectionNode]);
    });

    it('should correctly shift the first node', () => {
      let collection = createLinearCollection();
      expect(
        collectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual(
        [firstCollectionNode, secondCollectionNode, thirdCollectionNode]);
      expect(
        collectionLinearizerService.shiftNodeRight(
          collection, 'exp_id0')).toBe(true);
      expect(
        collectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual(
        [secondCollectionNode, firstCollectionNode, thirdCollectionNode]);
    });

    it('should correctly shift the last node', () => {
      let collection = createLinearCollection();
      expect(
        collectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual(
        [firstCollectionNode, secondCollectionNode, thirdCollectionNode]);
      expect(
        collectionLinearizerService.shiftNodeRight(
          collection, 'exp_id2')).toBe(true);
      expect(
        collectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual(
        [firstCollectionNode, secondCollectionNode, thirdCollectionNode]);
    });

    it('should correctly shift middle node', () => {
      let collection = createLinearCollection();
      expect(
        collectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual(
        [firstCollectionNode, secondCollectionNode, thirdCollectionNode]);
      expect(
        collectionLinearizerService.shiftNodeRight(
          collection, 'exp_id1')).toBe(true);
      expect(
        collectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual(
        [firstCollectionNode, thirdCollectionNode, secondCollectionNode]);
    });
  });

  describe('getNextExplorationId()', () => {
    it('should return no exploration ids for a completed linear collection',
      () => {
        let collection = createLinearCollection();
        expect(
          collectionLinearizerService.getNextExplorationId(
            collection, ['exp_id0', 'exp_id1', 'exp_id2'])).toEqual(null);
      }
    );

    it('should return next exploration id for a partially completed collection',
      () => {
        let collection = createLinearCollection();
        expect(
          collectionLinearizerService.getNextExplorationId(
            collection, ['exp_id0', 'exp_id1'])).toEqual('exp_id2');
      }
    );
  });

  describe('getCollectionNodesInPlayableOrder()', () => {
    it('should correctly return an empty list for an empty collection',
      () => {
        let collection = Collection.createEmptyCollection();
        expect(
          collectionLinearizerService.getCollectionNodesInPlayableOrder(
            collection)).toEqual([]);
      }
    );

    it('should correctly return a list for a collection with a single node',
      () => {
        let collection = Collection.createEmptyCollection();
        collection.addCollectionNode(firstCollectionNode);
        expect(
          collectionLinearizerService.getCollectionNodesInPlayableOrder(
            collection)).toEqual([firstCollectionNode]);
      }
    );

    it('should correctly return a list for a collection with multiple nodes',
      () => {
        let collection = createLinearCollection();
        expect(
          collectionLinearizerService.getCollectionNodesInPlayableOrder(
            collection)).toEqual(
          [firstCollectionNode, secondCollectionNode, thirdCollectionNode]);
      }
    );
  });
});
