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

describe('Collection object factory', function() {
  var CollectionObjectFactory = null;
  var CollectionNodeObjectFactory = null;
  var _sampleCollection = null;

  beforeEach(module('oppia'));

  beforeEach(inject(function($injector) {
    CollectionObjectFactory = $injector.get('CollectionObjectFactory');
    CollectionNodeObjectFactory = $injector.get('CollectionNodeObjectFactory');

    var sampleCollectionBackendObject = {
      id: 'sample_collection_id',
      title: 'a title',
      objective: 'an objective',
      category: 'a category',
      version: '1',
      nodes: []
    };
    _sampleCollection = CollectionObjectFactory.create(
      sampleCollectionBackendObject);
  }));

  var _addCollectionNode = function(explorationId) {
    var collectionNodeBackendObject = {
      exploration_id: explorationId,
      prerequisite_skills: [],
      acquired_skills: [],
      exploration: {}
    };
    return _sampleCollection.addCollectionNode(
      CollectionNodeObjectFactory.create(collectionNodeBackendObject));
  };

  var _getCollectionNode = function(explorationId) {
    return _sampleCollection.getCollectionNodeByExplorationId(explorationId);
  };

  it('should be able to create an empty collection object', function() {
    var collection = CollectionObjectFactory.createEmptyCollection();
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
      function() {
    var collectionNodeBackendObject = {
      exploration_id: 'exp_id0',
      prerequisite_skills: [],
      acquired_skills: [],
      exploration: {}
    };
    var collection = CollectionObjectFactory.create({
      id: 'collection_id',
      nodes: [collectionNodeBackendObject]
    });
    expect(collection.containsCollectionNode('exp_id0')).toBe(true);
    expect(collection.getCollectionNodes()).toEqual([
      CollectionNodeObjectFactory.create(collectionNodeBackendObject)
    ]);
  });

  it('should contain added explorations and not contain removed ones',
      function() {
    expect(_sampleCollection.containsCollectionNode('exp_id0')).toBe(false);
    expect(_sampleCollection.getCollectionNodeCount()).toEqual(0);

    var collectionNodeBackendObject = {
      exploration_id: 'exp_id0',
      prerequisite_skills: [],
      acquired_skills: [],
      exploration: {}
    };
    var collectionNode = CollectionNodeObjectFactory.create(
      collectionNodeBackendObject);

    expect(_sampleCollection.addCollectionNode(collectionNode)).toBe(true);
    expect(_sampleCollection.containsCollectionNode('exp_id0')).toBe(true);
    expect(_sampleCollection.getCollectionNodes()).toEqual([
      CollectionNodeObjectFactory.create(collectionNodeBackendObject)
    ]);
    expect(_sampleCollection.getCollectionNodeCount()).toEqual(1);

    expect(_sampleCollection.deleteCollectionNode('exp_id0')).toBe(true);
    expect(_sampleCollection.containsCollectionNode('exp_id0')).toBe(false);
    expect(_sampleCollection.getCollectionNodeCount()).toEqual(0);
  });

  it('should not add duplicate explorations', function() {
    var collectionNodeBackendObject = {
      exploration_id: 'exp_id0',
      prerequisite_skills: [],
      acquired_skills: [],
      exploration: {}
    };
    var collectionNode = CollectionNodeObjectFactory.create(
      collectionNodeBackendObject);

    expect(_sampleCollection.addCollectionNode(collectionNode)).toBe(true);
    expect(_sampleCollection.addCollectionNode(collectionNode)).toBe(false);
  });

  it('should fail to delete nonexistent explorations', function() {
    expect(_sampleCollection.deleteCollectionNode('fake_exp_id')).toBe(false);
  });

  it('should be able to clear all nodes from a collection', function() {
    expect(_sampleCollection.getCollectionNodeCount()).toEqual(0);

    var collectionNodeBackendObject1 = {
      exploration_id: 'exp_id0',
      prerequisite_skills: [],
      acquired_skills: [],
      exploration: {}
    };
    var collectionNodeBackendObject2 = {
      exploration_id: 'exp_id1',
      prerequisite_skills: [],
      acquired_skills: [],
      exploration: {}
    };
    var collectionNode1 = CollectionNodeObjectFactory.create(
      collectionNodeBackendObject1);
    var collectionNode2 = CollectionNodeObjectFactory.create(
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
      function() {
    expect(_getCollectionNode('exp_id0')).toBeUndefined();
    var collectionNodeBackendObject = {
      exploration_id: 'exp_id0',
      prerequisite_skills: [],
      acquired_skills: [],
      exploration: {}
    };
    _sampleCollection.addCollectionNode(
      CollectionNodeObjectFactory.create(collectionNodeBackendObject));

    var collectionNodeBefore = _getCollectionNode('exp_id0');
    expect(collectionNodeBefore).toEqual(CollectionNodeObjectFactory.create(
      collectionNodeBackendObject));

    // Ensure mutability.
    collectionNodeBefore.getPrerequisiteSkillList().addSkill('example');
    expect(collectionNodeBefore).not.toEqual(CollectionNodeObjectFactory.create(
      collectionNodeBackendObject));

    var collectionNodeAfter = _getCollectionNode('exp_id0');
    expect(collectionNodeAfter).not.toEqual(CollectionNodeObjectFactory.create(
      collectionNodeBackendObject));
    expect(collectionNodeAfter.getPrerequisiteSkillList().containsSkill(
      'example')).toBe(true);
  });

  it('should return a list of collection nodes in the order they were added',
      function() {
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

  it('should ignore changes to the list of returned collection nodes',
      function() {
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
    collectionNodes[1].getPrerequisiteSkillList().addSkill('example');
    expect(_sampleCollection.getBindableCollectionNodes()).toEqual(
      collectionNodes);
    expect(_getCollectionNode('exp_id1')).toEqual(collectionNodes[1]);
  });

  it('should accept changes to the bindable list of collection nodes',
      function() {
    _addCollectionNode('exp_id0');
    _addCollectionNode('exp_id1');
    expect(_sampleCollection.getCollectionNodeCount()).toEqual(2);

    // The array itself can be mutated.
    var collectionNodes = _sampleCollection.getBindableCollectionNodes();
    collectionNodes.splice(0, 1);
    expect(_sampleCollection.getCollectionNodeCount()).toEqual(1);

    // Collection nodes can be mutated and reflected in the collection object.
    collectionNodes = _sampleCollection.getBindableCollectionNodes();
    collectionNodes[0].getPrerequisiteSkillList().addSkill('example');
    expect(_sampleCollection.getBindableCollectionNodes()).toEqual(
      collectionNodes);
    expect(_getCollectionNode('exp_id1')).toEqual(collectionNodes[1]);
  });

  it('should provide starting explorations with no prerequisite skills',
      function() {
    expect(_sampleCollection.getStartingCollectionNodes()).toEqual([]);

    _addCollectionNode('exp_id0');
    _addCollectionNode('exp_id1');

    var startingNodes = _sampleCollection.getStartingCollectionNodes();
    expect(startingNodes.length).toEqual(2);
    expect(startingNodes[0].getExplorationId()).toEqual('exp_id0');
    expect(startingNodes[1].getExplorationId()).toEqual('exp_id1');

    startingNodes[0].getPrerequisiteSkillList().addSkill('example');

    startingNodes = _sampleCollection.getStartingCollectionNodes();
    expect(startingNodes.length).toEqual(1);
    expect(startingNodes[0].getExplorationId()).toEqual('exp_id1');
  });

  it('should return a list of referenced exporation IDs', function() {
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

  it('should return a combined skill list of all collection node skills',
      function() {
    _addCollectionNode('exp_id0');
    _addCollectionNode('exp_id1');
    _addCollectionNode('exp_id2');

    var collectionNode0 = _getCollectionNode('exp_id0');
    var collectionNode1 = _getCollectionNode('exp_id1');
    var collectionNode2 = _getCollectionNode('exp_id2');
    collectionNode0.getPrerequisiteSkillList().addSkill('c_needed_for_0');
    collectionNode0.getPrerequisiteSkillList().addSkill('a_needed_for_01');
    collectionNode0.getAcquiredSkillList().addSkill('b_final_skill');
    collectionNode1.getPrerequisiteSkillList().addSkill('a_needed_for_01');
    collectionNode1.getAcquiredSkillList().addSkill('c_needed_for_0');
    collectionNode2.getAcquiredSkillList().addSkill('a_needed_for_01');

    // Subsequent calls should return different lists.
    var skillList = _sampleCollection.getSkillList();
    var otherSkillList = _sampleCollection.getSkillList();
    expect(skillList).toEqual(otherSkillList);
    expect(skillList).not.toBe(otherSkillList);

    // The skills will not be provided in sorted order.
    var expectedSkills = ['a_needed_for_01', 'b_final_skill', 'c_needed_for_0'];
    expect(skillList.getSkills()).not.toEqual(expectedSkills);

    skillList.sortSkills();
    expect(skillList.getSkills()).toEqual(expectedSkills);
  });

  it('should be able to copy from another collection', function() {
    var secondCollection = CollectionObjectFactory.create({
      id: 'col_id0',
      title: 'Another title',
      objective: 'Another objective',
      category: 'Another category',
      language_code: 'en',
      version: '15',
      nodes: []
    });
    secondCollection.addCollectionNode(CollectionNodeObjectFactory.create({
      exploration_id: 'exp_id5',
      prerequisite_skills: [],
      acquired_skills: [],
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
