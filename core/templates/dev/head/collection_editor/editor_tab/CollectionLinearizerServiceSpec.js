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

describe('Collection linearizer service', function() {
  var CollectionObjectFactory = null;
  var CollectionNodeObjectFactory = null;
  var CollectionLinearizerService = null;

  var firstCollectionNode = null;
  var secondCollectionNode = null;
  var thirdCollectionNode = null;

  beforeEach(module('oppia'));

  beforeEach(inject(function($injector) {
    CollectionObjectFactory = $injector.get('CollectionObjectFactory');
    CollectionNodeObjectFactory = $injector.get('CollectionNodeObjectFactory');
    CollectionLinearizerService = $injector.get('CollectionLinearizerService');

    var firstCollectionNodeBackendObject = {
      exploration_id: 'exp_id0',
      prerequisite_skills: [],
      acquired_skills: ['exp title0'],
      exploration_summary: {
        title: 'exp title0',
        category: 'exp category',
        objective: 'exp objective'
      }
    };
    firstCollectionNode = CollectionNodeObjectFactory.create(
        firstCollectionNodeBackendObject);

    var secondCollectionNodeBackendObject = {
      exploration_id: 'exp_id1',
      prerequisite_skills: ['exp title0'],
      acquired_skills: ['exp title1'],
      exploration_summary: {
        title: 'exp title1',
        category: 'exp category',
        objective: 'exp objective'
      }
    };
    secondCollectionNode = CollectionNodeObjectFactory.create(
        secondCollectionNodeBackendObject);

    var thirdCollectionNodeBackendObject = {
      exploration_id: 'exp_id2',
      prerequisite_skills: ['exp title1'],
      acquired_skills: ['exp title2'],
      exploration_summary: {
        title: 'exp title2',
        category: 'exp category',
        objective: 'exp objective'
      }
    };
    thirdCollectionNode = CollectionNodeObjectFactory.create(
        thirdCollectionNodeBackendObject);
  }));

  var _createLinearCollection = function() {
    var collection = CollectionObjectFactory.createEmptyCollection();
    collection.addCollectionNode(firstCollectionNode);
    collection.addCollectionNode(secondCollectionNode);
    collection.addCollectionNode(thirdCollectionNode);
    return collection;
  };

  describe('Collection linearizer node removal function', function() {
    it('should correctly remove a node from a collection with a single node',
        function() {
          var collection = CollectionObjectFactory.createEmptyCollection();
          collection.addCollectionNode(firstCollectionNode);
          expect(collection.containsCollectionNode('exp_id0')).toBe(true);
          CollectionLinearizerService.removeCollectionNode(
              collection, 'exp_id0');
          expect(collection.containsCollectionNode('exp_id0')).toBe(false);
          expect(
              CollectionLinearizerService.getCollectionNodesInPlayableOrder(
                  collection)).toEqual([]);
        });

    it('should correctly remove the first node from a collection', function() {
      var collection = _createLinearCollection();
      CollectionLinearizerService.removeCollectionNode(collection, 'exp_id0');
      expect(collection.containsCollectionNode('exp_id0')).toBe(false);
      expect(
          CollectionLinearizerService.getCollectionNodesInPlayableOrder(
              collection)).toEqual([secondCollectionNode, thirdCollectionNode]);
    });

    it('should correctly remove the last node from a collection', function() {
      var collection = _createLinearCollection();
      CollectionLinearizerService.removeCollectionNode(collection, 'exp_id2');
      expect(collection.containsCollectionNode('exp_id2')).toBe(false);
      expect(
          CollectionLinearizerService.getCollectionNodesInPlayableOrder(
              collection)).toEqual([firstCollectionNode, secondCollectionNode]);
    });

    it('should correctly remove a middle node from a collection', function() {
      var collection = _createLinearCollection();
      CollectionLinearizerService.removeCollectionNode(collection, 'exp_id1');
      expect(collection.containsCollectionNode('exp_id1')).toBe(false);
      expect(
          CollectionLinearizerService.getCollectionNodesInPlayableOrder(
              collection)).toEqual([firstCollectionNode, thirdCollectionNode]);
    });
  });

  describe('Collection linearizer node append function', function() {
    it('should correctly append a node in an empty collection', function() {
      var collection = CollectionObjectFactory.createEmptyCollection();
      CollectionLinearizerService.appendCollectionNode(collection, 'exp_id0',
          firstCollectionNode.getExplorationSummaryObject());
      expect(
          CollectionLinearizerService.getCollectionNodesInPlayableOrder(
                  collection)).toEqual([firstCollectionNode]);
    });

    it('should correctly append a node in a non-empty collection', function() {
      var collection = CollectionObjectFactory.createEmptyCollection();
      collection.addCollectionNode(firstCollectionNode);
      collection.addCollectionNode(secondCollectionNode);
      expect(
          CollectionLinearizerService.getCollectionNodesInPlayableOrder(
              collection)).toEqual([firstCollectionNode, secondCollectionNode]);
      CollectionLinearizerService.appendCollectionNode(collection, 'exp_id2',
          thirdCollectionNode.getExplorationSummaryObject());
      expect(
          CollectionLinearizerService.getCollectionNodesInPlayableOrder(
              collection)).toEqual([firstCollectionNode, secondCollectionNode,
                  thirdCollectionNode]);
    });
  });

  describe('Collection linearizer node shifting function', function() {
    it('should correctly shift the first node to the right', function() {
      var collection = _createLinearCollection();
      expect(
          CollectionLinearizerService.getCollectionNodesInPlayableOrder(
              collection)).toEqual([firstCollectionNode, secondCollectionNode,
                  thirdCollectionNode]);
      CollectionLinearizerService.shiftNodeRight(collection, 'exp_id0');
      expect(
          CollectionLinearizerService.getCollectionNodesInPlayableOrder(
              collection)).toEqual([secondCollectionNode, firstCollectionNode,
                  thirdCollectionNode]);
    });

    it('should correctly shift the last node to the left', function() {
      var collection = _createLinearCollection();
      expect(
          CollectionLinearizerService.getCollectionNodesInPlayableOrder(
              collection)).toEqual([firstCollectionNode, secondCollectionNode,
                  thirdCollectionNode]);
      CollectionLinearizerService.shiftNodeLeft(collection, 'exp_id2');
      expect(
          CollectionLinearizerService.getCollectionNodesInPlayableOrder(
              collection)).toEqual([firstCollectionNode, thirdCollectionNode,
                secondCollectionNode]);
    });

    it('should correctly shift middle node to the right', function() {
      var collection = _createLinearCollection();
      expect(
          CollectionLinearizerService.getCollectionNodesInPlayableOrder(
              collection)).toEqual([firstCollectionNode, secondCollectionNode,
                  thirdCollectionNode]);
      CollectionLinearizerService.shiftNodeRight(collection, 'exp_id1');
      expect(
          CollectionLinearizerService.getCollectionNodesInPlayableOrder(
              collection)).toEqual([firstCollectionNode, thirdCollectionNode,
                secondCollectionNode]);
    });

    it('should correctly shift middle node to the left', function() {
      var collection = _createLinearCollection();
      expect(
          CollectionLinearizerService.getCollectionNodesInPlayableOrder(
              collection)).toEqual([firstCollectionNode, secondCollectionNode,
                  thirdCollectionNode]);
      CollectionLinearizerService.shiftNodeLeft(collection, 'exp_id1');
      expect(
          CollectionLinearizerService.getCollectionNodesInPlayableOrder(
              collection)).toEqual([secondCollectionNode, firstCollectionNode,
                  thirdCollectionNode]);
    });
  });
});
