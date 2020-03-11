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
 * @fileoverview Tests for CollectionObjectFactory.
 */

import { TestBed } from '@angular/core/testing';

import { CollectionNodeObjectFactory } from
  'domain/collection/CollectionNodeObjectFactory';
import { Collection, CollectionObjectFactory } from
  'domain/collection/CollectionObjectFactory';

describe('Collection object factory', () => {
  let collectionObjectFactory: CollectionObjectFactory = null;
  let collectionNodeObjectFactory: CollectionNodeObjectFactory = null;
  let _sampleCollection: Collection = null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CollectionObjectFactory]
    });

    collectionObjectFactory = TestBed.get(CollectionObjectFactory);
    collectionNodeObjectFactory = TestBed.get(CollectionNodeObjectFactory);

    var sampleCollectionBackendObject = {
      id: 'sample_collection_id',
      title: 'a title',
      objective: 'an objective',
      category: 'a category',
      version: 1,
      nodes: [],
    };
    _sampleCollection = collectionObjectFactory.create(
      sampleCollectionBackendObject);
  });

  var _addCollectionNode = function(explorationId) {
    var collectionNodeBackendObject = {
      exploration_id: explorationId,
      exploration: {}
    };
    return _sampleCollection.addCollectionNode(
      collectionNodeObjectFactory.create(collectionNodeBackendObject));
  };

  var _getCollectionNode = function(explorationId) {
    return _sampleCollection.getCollectionNodeByExplorationId(explorationId);
  };

  it('should be able to create an empty collection object', () => {
    var collection = collectionObjectFactory.createEmptyCollection();
    expect(collection.getId()).toBeUndefined();
    expect(collection.getTitle()).toBeUndefined();
    expect(collection.getCategory()).toBeUndefined();
    expect(collection.getObjective()).toBeUndefined();
    expect(collection.getLanguageCode()).toBeUndefined();
    expect(collection.getTags()).toBeUndefined();
    expect(collection.getVersion()).toBeUndefined();
    expect(collection.getCollectionNodes()).toEqual([]);
  });

  it('should contain a collection node defined in the backend object',
    () => {
      var collectionNodeBackendObject = {
        exploration_id: 'exp_id0',
        exploration: {}
      };
      var collection = collectionObjectFactory.create({
        id: 'collection_id',
        nodes: [collectionNodeBackendObject]
      });
      expect(collection.containsCollectionNode('exp_id0')).toBe(true);
      expect(collection.getCollectionNodes()).toEqual([
        collectionNodeObjectFactory.create(collectionNodeBackendObject)
      ]);
    }
  );

  it('should contain added explorations and not contain removed ones',
    () => {
      expect(_sampleCollection.containsCollectionNode('exp_id0')).toBe(false);
      expect(_sampleCollection.getCollectionNodeCount()).toEqual(0);

      var collectionNodeBackendObject = {
        exploration_id: 'exp_id0',
        exploration: {}
      };
      var collectionNode = collectionNodeObjectFactory.create(
        collectionNodeBackendObject);

      expect(_sampleCollection.addCollectionNode(collectionNode)).toBe(true);
      expect(_sampleCollection.containsCollectionNode('exp_id0')).toBe(true);
      expect(_sampleCollection.getCollectionNodes()).toEqual([
        collectionNodeObjectFactory.create(collectionNodeBackendObject)
      ]);
      expect(_sampleCollection.getCollectionNodeCount()).toEqual(1);

      expect(_sampleCollection.deleteCollectionNode('exp_id0')).toBe(true);
      expect(_sampleCollection.containsCollectionNode('exp_id0')).toBe(false);
      expect(_sampleCollection.getCollectionNodeCount()).toEqual(0);
    }
  );

  it('should not add duplicate explorations', () => {
    var collectionNodeBackendObject = {
      exploration_id: 'exp_id0',
      exploration: {}
    };
    var collectionNode = collectionNodeObjectFactory.create(
      collectionNodeBackendObject);

    expect(_sampleCollection.addCollectionNode(collectionNode)).toBe(true);
    expect(_sampleCollection.addCollectionNode(collectionNode)).toBe(false);
  });

  it('should fail to delete nonexistent explorations', () => {
    expect(_sampleCollection.deleteCollectionNode('fake_exp_id')).toBe(false);
  });

  it('should be able to clear all nodes from a collection', () => {
    expect(_sampleCollection.getCollectionNodeCount()).toEqual(0);

    var collectionNodeBackendObject1 = {
      exploration_id: 'exp_id0',
      exploration: {}
    };
    var collectionNodeBackendObject2 = {
      exploration_id: 'exp_id1',
      exploration: {}
    };
    var collectionNode1 = collectionNodeObjectFactory.create(
      collectionNodeBackendObject1);
    var collectionNode2 = collectionNodeObjectFactory.create(
      collectionNodeBackendObject2);

    _sampleCollection.addCollectionNode(collectionNode1);
    expect(_sampleCollection.getCollectionNodeCount()).toEqual(1);
    expect(_sampleCollection.containsCollectionNode('exp_id0')).toBe(true);

    _sampleCollection.clearCollectionNodes();
    expect(_sampleCollection.getCollectionNodeCount()).toEqual(0);
    expect(_sampleCollection.containsCollectionNode('exp_id0')).toBe(false);
    expect(_sampleCollection.getCollectionNodes()).toEqual([]);

    _sampleCollection.addCollectionNode(collectionNode2);
    expect(_sampleCollection.getCollectionNodeCount()).toEqual(1);
    expect(_sampleCollection.containsCollectionNode('exp_id1')).toBe(true);
  });

  it('should be able to retrieve a mutable collection node by exploration id',
    () => {
      expect(_getCollectionNode('exp_id0')).toBeUndefined();
      var collectionNodeBackendObject = {
        exploration_id: 'exp_id0',
        exploration: {}
      };
      _sampleCollection.addCollectionNode(
        collectionNodeObjectFactory.create(collectionNodeBackendObject));

      var collectionNodeBefore = _getCollectionNode('exp_id0');
      expect(collectionNodeBefore).toEqual(collectionNodeObjectFactory.create(
        collectionNodeBackendObject));
    }
  );

  it('should return a list of collection nodes in the order they were added',
    () => {
      _addCollectionNode('c_exp_id0');
      _addCollectionNode('a_exp_id1');
      _addCollectionNode('b_exp_id2');

      var collectionNodes = _sampleCollection.getCollectionNodes();
      expect(collectionNodes[0].getExplorationId()).toEqual('c_exp_id0');
      expect(collectionNodes[1].getExplorationId()).toEqual('a_exp_id1');
      expect(collectionNodes[2].getExplorationId()).toEqual('b_exp_id2');

      _sampleCollection.deleteCollectionNode('a_exp_id1');
      collectionNodes = _sampleCollection.getCollectionNodes();
      expect(collectionNodes[0].getExplorationId()).toEqual('c_exp_id0');
      expect(collectionNodes[1].getExplorationId()).toEqual('b_exp_id2');
    }
  );

  it('should ignore changes to the list of returned collection nodes',
    () => {
      _addCollectionNode('exp_id0');
      _addCollectionNode('exp_id1');
      expect(_sampleCollection.getCollectionNodeCount()).toEqual(2);

      // Ensure the array itself cannot be mutated and then reflected in the
      // collection object.
      var collectionNodes = _sampleCollection.getCollectionNodes();
      collectionNodes.splice(0, 1);

      expect(
        _sampleCollection.getCollectionNodes()).not.toEqual(collectionNodes);
      expect(_sampleCollection.getCollectionNodeCount()).toEqual(2);

      // Ensure contained collection nodes can be mutated and reflected in the
      // collection object.
      collectionNodes = _sampleCollection.getBindableCollectionNodes();
      expect(_sampleCollection.getBindableCollectionNodes()).toEqual(
        collectionNodes);
      expect(_getCollectionNode('exp_id1')).toEqual(collectionNodes[1]);
    }
  );

  it('should accept changes to the bindable list of collection nodes',
    () => {
      _addCollectionNode('exp_id0');
      _addCollectionNode('exp_id1');
      expect(_sampleCollection.getCollectionNodeCount()).toEqual(2);

      // The array itself can be mutated.
      var collectionNodes = _sampleCollection.getBindableCollectionNodes();
      collectionNodes.splice(0, 1);
      expect(_sampleCollection.getCollectionNodeCount()).toEqual(1);

      // Collection nodes can be mutated and reflected in the collection object.
      collectionNodes = _sampleCollection.getBindableCollectionNodes();
      expect(_sampleCollection.getBindableCollectionNodes()).toEqual(
        collectionNodes);
      expect(_getCollectionNode('exp_id1')).toEqual(collectionNodes[1]);
    }
  );

  it('should return a list of referenced exporation IDs', () => {
    _addCollectionNode('exp_id0');
    _addCollectionNode('exp_id1');
    _addCollectionNode('exp_id2');

    expect(_sampleCollection.getExplorationIds()).toEqual([
      'exp_id0', 'exp_id1', 'exp_id2'
    ]);

    _sampleCollection.deleteCollectionNode('exp_id1');

    expect(_sampleCollection.getExplorationIds()).toEqual([
      'exp_id0', 'exp_id2'
    ]);
  });

  it('should be able to copy from another collection', () => {
    var secondCollection = collectionObjectFactory.create({
      id: 'col_id0',
      title: 'Another title',
      objective: 'Another objective',
      category: 'Another category',
      language_code: 'en',
      version: 15,
      nodes: [],
    });
    secondCollection.addCollectionNode(collectionNodeObjectFactory.create({
      exploration_id: 'exp_id5',
      exploration: {}
    }));

    _addCollectionNode('exp_id0');
    _addCollectionNode('exp_id1');

    expect(_sampleCollection).not.toBe(secondCollection);
    expect(_sampleCollection).not.toEqual(secondCollection);

    _sampleCollection.copyFromCollection(secondCollection);
    expect(_sampleCollection).not.toBe(secondCollection);
    expect(_sampleCollection).toEqual(secondCollection);
  });
});
