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
 * @fileoverview Tests for CollectionLinearizerService.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// collection-linearizer.service.ts is upgraded to Angular 8.
import { Change } from 'domain/editor/undo_redo/change.model';
import { CollectionNode, CollectionNodeBackendDict } from
  'domain/collection/collection-node.model';
import { Collection } from
  'domain/collection/collection.model';
import { UpgradedServices } from 'services/UpgradedServices';
import { importAllAngularServices } from 'tests/unit-test-utils';
// ^^^ This block is to be removed.

require(
  'pages/collection-editor-page/services/collection-linearizer.service.ts');

describe('Collection linearizer service', function() {
  var CollectionLinearizerService = null;

  var firstCollectionNode = null;
  var secondCollectionNode = null;
  var thirdCollectionNode = null;

  importAllAngularServices();

  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('Change', Change);
  }));
  beforeEach(angular.mock.module('oppia', function($provide) {
    var ugs = new UpgradedServices();
    for (let [key, value] of Object.entries(ugs.getUpgradedServices())) {
      $provide.value(key, value);
    }
  }));

  beforeEach(angular.mock.inject(function($injector) {
    CollectionLinearizerService = $injector.get('CollectionLinearizerService');

    var firstCollectionNodeBackendObject = {
      exploration_id: 'exp_id0',
      exploration_summary: {
        title: 'exp title0',
        category: 'exp category',
        objective: 'exp objective'
      }
    };
    firstCollectionNode = CollectionNode.create(
      firstCollectionNodeBackendObject as CollectionNodeBackendDict);

    var secondCollectionNodeBackendObject = {
      exploration_id: 'exp_id1',
      exploration_summary: {
        title: 'exp title1',
        category: 'exp category',
        objective: 'exp objective'
      }
    };
    secondCollectionNode = CollectionNode.create(
      secondCollectionNodeBackendObject as CollectionNodeBackendDict);

    var thirdCollectionNodeBackendObject = {
      exploration_id: 'exp_id2',
      exploration_summary: {
        title: 'exp title2',
        category: 'exp category',
        objective: 'exp objective'
      }
    };
    thirdCollectionNode = CollectionNode.create(
      thirdCollectionNodeBackendObject as CollectionNodeBackendDict);
  }));

  // The linear order of explorations is: exp_id0 -> exp_id1 -> exp_id2.
  var createLinearCollection = function() {
    var collection = Collection.createEmptyCollection();

    // Add collections in a different order from which they will be displayed
    // by the linearizer for robustness.
    collection.addCollectionNode(firstCollectionNode);
    collection.addCollectionNode(secondCollectionNode);
    collection.addCollectionNode(thirdCollectionNode);
    return collection;
  };

  describe('removeCollectionNode()', function() {
    it('should not remove a non-existent node from a single node collection',
      function() {
        var collection = Collection.createEmptyCollection();
        collection.addCollectionNode(firstCollectionNode);
        expect(collection.containsCollectionNode('exp_id0')).toBe(true);
        expect(
          CollectionLinearizerService.removeCollectionNode(
            collection, 'non_existent')).toBe(false);
        expect(collection.containsCollectionNode('exp_id0')).toBe(true);
        expect(
          CollectionLinearizerService.getCollectionNodesInPlayableOrder(
            collection)).toEqual([firstCollectionNode]);
      }
    );

    it('should not remove a non-existent node from a multiple nodes collection',
      function() {
        var collection = createLinearCollection();
        expect(
          CollectionLinearizerService.getCollectionNodesInPlayableOrder(
            collection)).toEqual(
          [firstCollectionNode, secondCollectionNode, thirdCollectionNode]);
        expect(
          CollectionLinearizerService.removeCollectionNode(
            collection, 'non_existent')).toBe(false);
        expect(
          CollectionLinearizerService.getCollectionNodesInPlayableOrder(
            collection)).toEqual(
          [firstCollectionNode, secondCollectionNode, thirdCollectionNode]);
      }
    );

    it('should correctly remove a node from a single node collection',
      function() {
        var collection = Collection.createEmptyCollection();
        collection.addCollectionNode(firstCollectionNode);
        expect(collection.containsCollectionNode('exp_id0')).toBe(true);
        expect(
          CollectionLinearizerService.removeCollectionNode(
            collection, 'exp_id0')).toBe(true);
        expect(collection.containsCollectionNode('exp_id0')).toBe(false);
        expect(
          CollectionLinearizerService.getCollectionNodesInPlayableOrder(
            collection)).toEqual([]);
      }
    );

    it('should correctly remove the first node from a collection', function() {
      var collection = createLinearCollection();
      expect(collection.containsCollectionNode('exp_id0')).toBe(true);
      expect(
        CollectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual(
        [firstCollectionNode, secondCollectionNode, thirdCollectionNode]);
      expect(
        CollectionLinearizerService.removeCollectionNode(
          collection, 'exp_id0')).toBe(true);
      expect(collection.containsCollectionNode('exp_id0')).toBe(false);
      expect(
        CollectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual([secondCollectionNode, thirdCollectionNode]);
    });

    it('should correctly remove the last node from a collection', function() {
      var collection = createLinearCollection();
      expect(collection.containsCollectionNode('exp_id2')).toBe(true);
      expect(
        CollectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual(
        [firstCollectionNode, secondCollectionNode, thirdCollectionNode]);
      expect(
        CollectionLinearizerService.removeCollectionNode(
          collection, 'exp_id2')).toBe(true);
      expect(collection.containsCollectionNode('exp_id2')).toBe(false);
      expect(
        CollectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual([firstCollectionNode, secondCollectionNode]);
    });

    it('should correctly remove a middle node from a collection', function() {
      var collection = createLinearCollection();
      expect(collection.containsCollectionNode('exp_id1')).toBe(true);
      expect(
        CollectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual(
        [firstCollectionNode, secondCollectionNode, thirdCollectionNode]);
      expect(
        CollectionLinearizerService.removeCollectionNode(
          collection, 'exp_id1')).toBe(true);
      expect(collection.containsCollectionNode('exp_id1')).toBe(false);
      expect(
        CollectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual([firstCollectionNode, thirdCollectionNode]);
    });
  });

  describe('appendCollectionNode()', function() {
    it('should correctly append a node to an empty collection', function() {
      var collection = Collection.createEmptyCollection();
      expect(collection.containsCollectionNode('exp_id0')).toBe(false);
      expect(
        CollectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual([]);
      CollectionLinearizerService.appendCollectionNode(
        collection,
        'exp_id0',
        firstCollectionNode.getExplorationSummaryObject());
      firstCollectionNode = collection.getCollectionNodeByExplorationId(
        'exp_id0');
      expect(
        CollectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual([firstCollectionNode]);
    });

    it('should correctly append a node to a non-empty collection', function() {
      var collection = createLinearCollection();
      var newCollectionNodeBackendObject = {
        exploration_id: 'exp_id3',
        exploration_summary: {
          title: 'exp title3',
          category: 'exp category',
          objective: 'exp objective'
        }
      };
      var newCollectionNode = CollectionNode.create(
        newCollectionNodeBackendObject as CollectionNodeBackendDict);
      expect(
        CollectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual(
        [firstCollectionNode, secondCollectionNode, thirdCollectionNode]);
      CollectionLinearizerService.appendCollectionNode(
        collection, 'exp_id3', newCollectionNode.getExplorationSummaryObject());
      newCollectionNode = collection.getCollectionNodeByExplorationId(
        'exp_id3');
      expect(
        CollectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual([
        collection.getCollectionNodeByExplorationId('exp_id0'),
        collection.getCollectionNodeByExplorationId('exp_id1'),
        collection.getCollectionNodeByExplorationId('exp_id2'),
        collection.getCollectionNodeByExplorationId('exp_id3')]);
    });
  });

  describe('shiftNodeLeft()', function() {
    it('should correctly shift a node in a single node collection',
      function() {
        var collection = Collection.createEmptyCollection();
        collection.addCollectionNode(firstCollectionNode);
        expect(
          CollectionLinearizerService.getCollectionNodesInPlayableOrder(
            collection)).toEqual([firstCollectionNode]);
        expect(
          CollectionLinearizerService.shiftNodeLeft(
            collection, 'exp_id0')).toBe(true);
        expect(
          CollectionLinearizerService.getCollectionNodesInPlayableOrder(
            collection)).toEqual([firstCollectionNode]);
      }
    );

    it('should not shift a non-existent node', function() {
      var collection = createLinearCollection();
      expect(
        CollectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual(
        [firstCollectionNode, secondCollectionNode, thirdCollectionNode]);
      expect(CollectionLinearizerService.shiftNodeLeft(
        collection, 'non_existent')).toBe(false);
      expect(
        CollectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual(
        [firstCollectionNode, secondCollectionNode, thirdCollectionNode]);
    });

    it('should correctly shift the first node', function() {
      var collection = createLinearCollection();
      expect(
        CollectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual(
        [firstCollectionNode, secondCollectionNode, thirdCollectionNode]);
      expect(
        CollectionLinearizerService.shiftNodeLeft(
          collection, 'exp_id0')).toBe(true);
      expect(
        CollectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual(
        [firstCollectionNode, secondCollectionNode, thirdCollectionNode]);
    });

    it('should correctly shift the last node', function() {
      var collection = createLinearCollection();
      expect(
        CollectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual(
        [firstCollectionNode, secondCollectionNode, thirdCollectionNode]);
      expect(
        CollectionLinearizerService.shiftNodeLeft(
          collection, 'exp_id2')).toBe(true);
      expect(
        CollectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual(
        [firstCollectionNode, thirdCollectionNode, secondCollectionNode]);
    });

    it('should correctly shift a middle node', function() {
      var collection = createLinearCollection();
      expect(
        CollectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual(
        [firstCollectionNode, secondCollectionNode, thirdCollectionNode]);
      expect(
        CollectionLinearizerService.shiftNodeLeft(
          collection, 'exp_id1')).toBe(true);
      expect(
        CollectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual(
        [secondCollectionNode, firstCollectionNode, thirdCollectionNode]);
    });
  });

  describe('shiftNodeRight()', function() {
    it('should correctly shift a node in a single node collection',
      function() {
        var collection = Collection.createEmptyCollection();
        collection.addCollectionNode(firstCollectionNode);
        expect(
          CollectionLinearizerService.getCollectionNodesInPlayableOrder(
            collection)).toEqual([firstCollectionNode]);
        expect(
          CollectionLinearizerService.shiftNodeRight(
            collection, 'exp_id0')).toBe(true);
        expect(
          CollectionLinearizerService.getCollectionNodesInPlayableOrder(
            collection)).toEqual([firstCollectionNode]);
      }
    );

    it('should not shift a non-existent node', function() {
      var collection = createLinearCollection();
      expect(
        CollectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual(
        [firstCollectionNode, secondCollectionNode, thirdCollectionNode]);
      expect(
        CollectionLinearizerService.shiftNodeRight(
          collection, 'non_existent')).toBe(false);
      expect(
        CollectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual(
        [firstCollectionNode, secondCollectionNode, thirdCollectionNode]);
    });

    it('should correctly shift the first node', function() {
      var collection = createLinearCollection();
      expect(
        CollectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual(
        [firstCollectionNode, secondCollectionNode, thirdCollectionNode]);
      expect(
        CollectionLinearizerService.shiftNodeRight(
          collection, 'exp_id0')).toBe(true);
      expect(
        CollectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual(
        [secondCollectionNode, firstCollectionNode, thirdCollectionNode]);
    });

    it('should correctly shift the last node', function() {
      var collection = createLinearCollection();
      expect(
        CollectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual(
        [firstCollectionNode, secondCollectionNode, thirdCollectionNode]);
      expect(
        CollectionLinearizerService.shiftNodeRight(
          collection, 'exp_id2')).toBe(true);
      expect(
        CollectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual(
        [firstCollectionNode, secondCollectionNode, thirdCollectionNode]);
    });

    it('should correctly shift middle node', function() {
      var collection = createLinearCollection();
      expect(
        CollectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual(
        [firstCollectionNode, secondCollectionNode, thirdCollectionNode]);
      expect(
        CollectionLinearizerService.shiftNodeRight(
          collection, 'exp_id1')).toBe(true);
      expect(
        CollectionLinearizerService.getCollectionNodesInPlayableOrder(
          collection)).toEqual(
        [firstCollectionNode, thirdCollectionNode, secondCollectionNode]);
    });
  });

  describe('getNextExplorationId()', function() {
    it('should return no exploration ids for a completed linear collection',
      function() {
        var collection = createLinearCollection();
        expect(
          CollectionLinearizerService.getNextExplorationId(
            collection, ['exp_id0', 'exp_id1', 'exp_id2'])).toEqual(null);
      }
    );

    it('should return next exploration id for a partially completed collection',
      function() {
        var collection = createLinearCollection();
        expect(
          CollectionLinearizerService.getNextExplorationId(
            collection, ['exp_id0', 'exp_id1'])).toEqual('exp_id2');
      }
    );
  });

  describe('getCollectionNodesInPlayableOrder()', function() {
    it('should correctly return an empty list for an empty collection',
      function() {
        var collection = Collection.createEmptyCollection();
        expect(
          CollectionLinearizerService.getCollectionNodesInPlayableOrder(
            collection)).toEqual([]);
      }
    );

    it('should correctly return a list for a collection with a single node',
      function() {
        var collection = Collection.createEmptyCollection();
        collection.addCollectionNode(firstCollectionNode);
        expect(
          CollectionLinearizerService.getCollectionNodesInPlayableOrder(
            collection)).toEqual([firstCollectionNode]);
      }
    );

    it('should correctly return a list for a collection with multiple nodes',
      function() {
        var collection = createLinearCollection();
        expect(
          CollectionLinearizerService.getCollectionNodesInPlayableOrder(
            collection)).toEqual(
          [firstCollectionNode, secondCollectionNode, thirdCollectionNode]);
      }
    );
  });
});
