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
 * @fileoverview Tests for collection-model.
 */

import {CollectionNode} from 'domain/collection/collection-node.model';
import {Collection} from 'domain/collection/collection.model';

describe('Collection model', () => {
  let _sampleCollection: Collection;

  beforeEach(() => {
    let sampleCollectionBackendObject = {
      id: 'sample_collection_id',
      title: 'a title',
      objective: 'an objective',
      category: 'a category',
      version: 1,
      nodes: [],
      language_code: null,
      tags: null,
      schema_version: null,
      playthrough_dict: {
        next_exploration_id: 'expId',
        completed_exploration_ids: ['expId2'],
      },
    };
    _sampleCollection = Collection.create(sampleCollectionBackendObject);
  });

  var _addCollectionNode = (explorationId: string) => {
    var collectionNodeBackendObject = {
      exploration_id: explorationId,
      exploration_summary: {
        last_updated_msec: 1591296737470.528,
        community_owned: false,
        objective: 'Test Objective',
        id: '44LKoKLlIbGe',
        num_views: 0,
        thumbnail_icon_url: '/subjects/Algebra.svg',
        human_readable_contributors_summary: {},
        language_code: 'en',
        thumbnail_bg_color: '#cc4b00',
        created_on_msec: 1591296635736.666,
        ratings: {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
        },
        status: 'public',
        tags: [],
        activity_type: 'exploration',
        category: 'Algebra',
        title: 'Test Title',
      },
    };
    return _sampleCollection.addCollectionNode(
      CollectionNode.create(collectionNodeBackendObject)
    );
  };

  var _getCollectionNode = (explorationId: string) => {
    return _sampleCollection.getCollectionNodeByExplorationId(explorationId);
  };

  it('should be able to create an empty collection object', () => {
    var collection = Collection.createEmptyCollection();
    expect(collection.getId()).toBeNull();
    expect(collection.getTitle()).toBeNull();
    expect(collection.getCategory()).toBeNull();
    expect(collection.getObjective()).toBeNull();
    expect(collection.getLanguageCode()).toBeNull();
    expect(collection.getTags()).toBeNull();
    expect(collection.getVersion()).toBeNull();
    expect(collection.getSchemaVersion()).toBeNull();
    expect(collection.getPlaythrough().getNextExplorationId()).toBeNull();
    expect(collection.getPlaythrough().getCompletedExplorationIds()).toEqual(
      []
    );
    expect(collection.getCollectionNodes()).toEqual([]);
  });

  it('should contain a collection node defined in the backend object', () => {
    var collectionNodeBackendObject = {
      exploration_id: 'exp_id0',
      exploration_summary: {
        last_updated_msec: 1591296737470.528,
        community_owned: false,
        objective: 'Test Objective',
        id: '44LKoKLlIbGe',
        num_views: 0,
        thumbnail_icon_url: '/subjects/Algebra.svg',
        human_readable_contributors_summary: {},
        language_code: 'en',
        thumbnail_bg_color: '#cc4b00',
        created_on_msec: 1591296635736.666,
        ratings: {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
        },
        status: 'public',
        tags: [],
        activity_type: 'exploration',
        category: 'Algebra',
        title: 'Test Title',
      },
    };
    var collection = Collection.create({
      id: 'collection_id',
      nodes: [collectionNodeBackendObject],
      title: null,
      objective: null,
      language_code: null,
      tags: null,
      schema_version: null,
      playthrough_dict: {
        next_exploration_id: 'expId',
        completed_exploration_ids: ['expId2'],
      },
      category: null,
      version: null,
    });
    expect(collection.containsCollectionNode('exp_id0')).toBe(true);
    expect(collection.getCollectionNodes()).toEqual([
      CollectionNode.create(collectionNodeBackendObject),
    ]);
  });

  it('should contain added explorations and not contain removed ones', () => {
    expect(_sampleCollection.containsCollectionNode('exp_id0')).toBe(false);
    expect(_sampleCollection.getCollectionNodeCount()).toEqual(0);

    var collectionNodeBackendObject = {
      exploration_id: 'exp_id0',
      exploration_summary: {
        last_updated_msec: 1591296737470.528,
        community_owned: false,
        objective: 'Test Objective',
        id: '44LKoKLlIbGe',
        num_views: 0,
        thumbnail_icon_url: '/subjects/Algebra.svg',
        human_readable_contributors_summary: {},
        language_code: 'en',
        thumbnail_bg_color: '#cc4b00',
        created_on_msec: 1591296635736.666,
        ratings: {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
        },
        status: 'public',
        tags: [],
        activity_type: 'exploration',
        category: 'Algebra',
        title: 'Test Title',
      },
    };
    var collectionNode = CollectionNode.create(collectionNodeBackendObject);

    expect(_sampleCollection.addCollectionNode(collectionNode)).toBe(true);
    expect(_sampleCollection.containsCollectionNode('exp_id0')).toBe(true);
    expect(_sampleCollection.getCollectionNodes()).toEqual([
      CollectionNode.create(collectionNodeBackendObject),
    ]);
    expect(_sampleCollection.getCollectionNodeCount()).toEqual(1);

    expect(_sampleCollection.deleteCollectionNode('exp_id0')).toBe(true);
    expect(_sampleCollection.containsCollectionNode('exp_id0')).toBe(false);
    expect(_sampleCollection.getCollectionNodeCount()).toEqual(0);
  });

  it('should not add duplicate explorations', () => {
    var collectionNodeBackendObject = {
      exploration_id: 'exp_id0',
      exploration_summary: {
        last_updated_msec: 1591296737470.528,
        community_owned: false,
        objective: 'Test Objective',
        id: '44LKoKLlIbGe',
        num_views: 0,
        thumbnail_icon_url: '/subjects/Algebra.svg',
        human_readable_contributors_summary: {},
        language_code: 'en',
        thumbnail_bg_color: '#cc4b00',
        created_on_msec: 1591296635736.666,
        ratings: {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
        },
        status: 'public',
        tags: [],
        activity_type: 'exploration',
        category: 'Algebra',
        title: 'Test Title',
      },
    };
    var collectionNode = CollectionNode.create(collectionNodeBackendObject);

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
      exploration_summary: {
        last_updated_msec: 1591296737470.528,
        community_owned: false,
        objective: 'Test Objective',
        id: '44LKoKLlIbGe',
        num_views: 0,
        thumbnail_icon_url: '/subjects/Algebra.svg',
        human_readable_contributors_summary: {},
        language_code: 'en',
        thumbnail_bg_color: '#cc4b00',
        created_on_msec: 1591296635736.666,
        ratings: {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
        },
        status: 'public',
        tags: [],
        activity_type: 'exploration',
        category: 'Algebra',
        title: 'Test Title',
      },
    };
    var collectionNodeBackendObject2 = {
      exploration_id: 'exp_id1',
      exploration_summary: {
        last_updated_msec: 1591296737470.528,
        community_owned: false,
        objective: 'Test Objective',
        id: '44LKoKLlIbGe',
        num_views: 0,
        thumbnail_icon_url: '/subjects/Algebra.svg',
        human_readable_contributors_summary: {},
        language_code: 'en',
        thumbnail_bg_color: '#cc4b00',
        created_on_msec: 1591296635736.666,
        ratings: {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
        },
        status: 'public',
        tags: [],
        activity_type: 'exploration',
        category: 'Algebra',
        title: 'Test Title',
      },
    };
    var collectionNode1 = CollectionNode.create(collectionNodeBackendObject1);
    var collectionNode2 = CollectionNode.create(collectionNodeBackendObject2);

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

  it('should be able to retrieve a mutable collection node by exploration id', () => {
    expect(_getCollectionNode('exp_id0')).toBeUndefined();
    var collectionNodeBackendObject = {
      exploration_id: 'exp_id0',
      exploration_summary: {
        last_updated_msec: 1591296737470.528,
        community_owned: false,
        objective: 'Test Objective',
        id: '44LKoKLlIbGe',
        num_views: 0,
        thumbnail_icon_url: '/subjects/Algebra.svg',
        human_readable_contributors_summary: {},
        language_code: 'en',
        thumbnail_bg_color: '#cc4b00',
        created_on_msec: 1591296635736.666,
        ratings: {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
        },
        status: 'public',
        tags: [],
        activity_type: 'exploration',
        category: 'Algebra',
        title: 'Test Title',
      },
    };
    _sampleCollection.addCollectionNode(
      CollectionNode.create(collectionNodeBackendObject)
    );

    var collectionNodeBefore = _getCollectionNode('exp_id0');
    expect(collectionNodeBefore).toEqual(
      CollectionNode.create(collectionNodeBackendObject)
    );
  });

  it('should return a list of collection nodes in the order they were added', () => {
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
  });

  it('should ignore changes to the list of returned collection nodes', () => {
    _addCollectionNode('exp_id0');
    _addCollectionNode('exp_id1');
    expect(_sampleCollection.getCollectionNodeCount()).toEqual(2);

    // Ensure the array itself cannot be mutated and then reflected in the
    // collection object.
    var collectionNodes = _sampleCollection.getCollectionNodes();
    collectionNodes.splice(0, 1);

    expect(_sampleCollection.getCollectionNodes()).not.toEqual(collectionNodes);
    expect(_sampleCollection.getCollectionNodeCount()).toEqual(2);

    // Ensure contained collection nodes can be mutated and reflected in the
    // collection object.
    collectionNodes = _sampleCollection.getBindableCollectionNodes();
    expect(_sampleCollection.getBindableCollectionNodes()).toEqual(
      collectionNodes
    );
    expect(_getCollectionNode('exp_id1')).toEqual(collectionNodes[1]);
  });

  it('should accept changes to the bindable list of collection nodes', () => {
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
      collectionNodes
    );
    expect(_getCollectionNode('exp_id1')).toEqual(collectionNodes[1]);
  });

  it('should return a list of referenced exporation IDs', () => {
    _addCollectionNode('exp_id0');
    _addCollectionNode('exp_id1');
    _addCollectionNode('exp_id2');

    expect(_sampleCollection.getExplorationIds()).toEqual([
      'exp_id0',
      'exp_id1',
      'exp_id2',
    ]);

    _sampleCollection.deleteCollectionNode('exp_id1');

    expect(_sampleCollection.getExplorationIds()).toEqual([
      'exp_id0',
      'exp_id2',
    ]);
  });

  it('should be able to copy from another collection', () => {
    var secondCollection = Collection.create({
      id: 'col_id0',
      title: 'Another title',
      objective: 'Another objective',
      category: 'Another category',
      language_code: 'en',
      version: 15,
      nodes: [],
      tags: null,
      schema_version: null,
      playthrough_dict: {
        next_exploration_id: 'expId',
        completed_exploration_ids: ['expId2'],
      },
    });
    secondCollection.addCollectionNode(
      CollectionNode.create({
        exploration_id: 'exp_id5',
        exploration_summary: {
          last_updated_msec: 1591296737470.528,
          community_owned: false,
          objective: 'Test Objective',
          id: '44LKoKLlIbGe',
          num_views: 0,
          thumbnail_icon_url: '/subjects/Algebra.svg',
          human_readable_contributors_summary: {},
          language_code: 'en',
          thumbnail_bg_color: '#cc4b00',
          created_on_msec: 1591296635736.666,
          ratings: {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0,
          },
          status: 'public',
          tags: [],
          activity_type: 'exploration',
          category: 'Algebra',
          title: 'Test Title',
        },
      })
    );

    _addCollectionNode('exp_id0');
    _addCollectionNode('exp_id1');

    expect(_sampleCollection).not.toBe(secondCollection);
    expect(_sampleCollection).not.toEqual(secondCollection);

    _sampleCollection.copyFromCollection(secondCollection);
    expect(_sampleCollection).not.toBe(secondCollection);
    expect(_sampleCollection).toEqual(secondCollection);
  });

  it(
    'should be able to swap 2 nodes of the collection and ' +
      'update the exploration id to node index map',
    () => {
      let expId0 = 'exp_id0';
      let expId1 = 'exp_id1';

      _addCollectionNode(expId0);
      _addCollectionNode(expId1);

      // Before swapping.
      expect(_sampleCollection.nodes[0].getExplorationId()).toEqual(expId0);
      expect(_sampleCollection.nodes[1].getExplorationId()).toEqual(expId1);
      expect(_sampleCollection.explorationIdToNodeIndexMap[expId0]).toEqual(0);
      expect(_sampleCollection.explorationIdToNodeIndexMap[expId1]).toEqual(1);

      // Return false if invalid index is provided.
      expect(_sampleCollection.swapCollectionNodes(0, 6)).toBeFalse();
      expect(_sampleCollection.swapCollectionNodes(5, 1)).toBeFalse();
      expect(_sampleCollection.swapCollectionNodes(-1, 1)).toBeFalse();
      expect(_sampleCollection.swapCollectionNodes(0, -1)).toBeFalse();

      // Do the swapping if valid indices are provided.
      _sampleCollection.swapCollectionNodes(0, 1);

      expect(_sampleCollection.nodes[0].getExplorationId()).toEqual(expId1);
      expect(_sampleCollection.nodes[1].getExplorationId()).toEqual(expId0);
      expect(_sampleCollection.explorationIdToNodeIndexMap[expId0]).toEqual(1);
      expect(_sampleCollection.explorationIdToNodeIndexMap[expId1]).toEqual(0);
    }
  );

  it('should be able to get the starting collection node', () => {
    // Return null when no node is added.
    expect(_sampleCollection.getStartingCollectionNode()).toBeNull();

    _addCollectionNode('exp_id0');

    expect(_sampleCollection.getStartingCollectionNode()).toEqual(
      _sampleCollection.nodes[0]
    );
  });
});
