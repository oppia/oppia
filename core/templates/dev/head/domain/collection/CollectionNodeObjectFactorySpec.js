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
 * @fileoverview Tests for CollectionNodeObjectFactory.
 */

describe('Collection node object factory', function() {
  var CollectionNodeObjectFactory = null;

  beforeEach(module('oppia'));

  beforeEach(inject(function($injector) {
    CollectionNodeObjectFactory = $injector.get('CollectionNodeObjectFactory');
  }));

  var _createEmptyCollectionNode = function(
      explorationId, prerequisiteSkillIds, acquiredSkillIds) {
    return CollectionNodeObjectFactory.create({
      exploration_id: explorationId,
      prerequisite_skill_ids: prerequisiteSkillIds || [],
      acquired_skill_ids: acquiredSkillIds || [],
      exploration_summary: {
        title: 'Title',
        status: 'private'
      }
    });
  };

  it('should contain initial prerequisite skill ids', function() {
    var collectionNode = _createEmptyCollectionNode(
      'exp_id0', ['pre_skill1', 'pre_skill0'], ['acq_skill1', 'acq_skill0']);
    expect(collectionNode.getPrerequisiteSkillIds()).toEqual([
      'pre_skill1', 'pre_skill0'
    ]);
  });

  it('should contain initial acquired skill ids', function() {
    var collectionNode = _createEmptyCollectionNode(
      'exp_id0', ['pre_skill1', 'pre_skill0'], ['acq_skill1', 'acq_skill0']);
    expect(collectionNode.getAcquiredSkillIds()).toEqual([
      'acq_skill1', 'acq_skill0'
    ]);
  });

  it('should provide a mutable prerequisite skill list object', function() {
    var collectionNode = _createEmptyCollectionNode('exp_id0');
    var prerequisiteSkillIds = collectionNode.getPrerequisiteSkillIds();
    prerequisiteSkillIds.push('pre_skill');
    expect(
      collectionNode.getPrerequisiteSkillIds().indexOf('pre_skill') !== -1);
  });

  it('should provide a mutable acquired skill list object', function() {
    var collectionNode = _createEmptyCollectionNode('exp_id0');
    var acquiredSkillIds = collectionNode.getAcquiredSkillIds();
    acquiredSkillIds.push('acq_skill');
    expect(collectionNode.getAcquiredSkillIds().indexOf('acq_skill') !== -1);
  });

  it('should correctly check prerequisite skill ID containment', function() {
    var collectionNode = _createEmptyCollectionNode(
      'exp_id0', ['pre_skill1', 'pre_skill0'], ['acq_skill1', 'acq_skill0']);
    expect(collectionNode.containsPrerequisiteSkillId('pre_skill1')).toBe(true);
    expect(collectionNode.containsPrerequisiteSkillId('nope')).toBe(false);
  });

  it('should correctly check acquired skill ID containment', function() {
    var collectionNode = _createEmptyCollectionNode(
      'exp_id0', ['pre_skill1', 'pre_skill0'], ['acq_skill1', 'acq_skill0']);
    expect(collectionNode.containsAcquiredSkillId('acq_skill1')).toBe(true);
    expect(collectionNode.containsAcquiredSkillId('nope')).toBe(false);
  });

  it('should correctly add prerequisite skill IDs', function() {
    var collectionNode = _createEmptyCollectionNode(
      'exp_id0', ['pre_skill1', 'pre_skill0'], ['acq_skill1', 'acq_skill0']);
    expect(collectionNode.addPrerequisiteSkillId('pre_skill2')).toBe(true);
    expect(collectionNode.getPrerequisiteSkillIds()).toEqual([
      'pre_skill1', 'pre_skill0', 'pre_skill2']);
    // Adding the same skill again results in a return value of false, and no
    // change to the prerequisite skill list.
    expect(collectionNode.addPrerequisiteSkillId('pre_skill2')).toBe(false);
    expect(collectionNode.getPrerequisiteSkillIds()).toEqual([
      'pre_skill1', 'pre_skill0', 'pre_skill2']);
  });

  it('should correctly add acquired skill IDs', function() {
    var collectionNode = _createEmptyCollectionNode(
      'exp_id0', ['pre_skill1', 'pre_skill0'], ['acq_skill1', 'acq_skill0']);
    expect(collectionNode.addAcquiredSkillId('acq_skill2')).toBe(true);
    expect(collectionNode.getAcquiredSkillIds()).toEqual([
      'acq_skill1', 'acq_skill0', 'acq_skill2']);
    // Adding the same skill again results in a return value of false, and no
    // change to the prerequisite skill list.
    expect(collectionNode.addAcquiredSkillId('acq_skill2')).toBe(false);
    expect(collectionNode.getAcquiredSkillIds()).toEqual([
      'acq_skill1', 'acq_skill0', 'acq_skill2']);
  });

  it('should correctly remove prerequisite skill IDs', function() {
    var collectionNode = _createEmptyCollectionNode(
      'exp_id0', ['pre_skill1', 'pre_skill0'], ['acq_skill1', 'acq_skill0']);
    expect(collectionNode.removePrerequisiteSkillId('pre_skill1')).toBe(true);
    expect(collectionNode.getPrerequisiteSkillIds()).toEqual(['pre_skill0']);

    // Removing a non-existent skill ID results in a return value of false, and
    // no change to the prerequisite skill list.
    expect(collectionNode.removePrerequisiteSkillId('invalid')).toBe(false);
    expect(collectionNode.getPrerequisiteSkillIds()).toEqual(['pre_skill0']);
  });

  it('should correctly remove acquired skill IDs', function() {
    var collectionNode = _createEmptyCollectionNode(
      'exp_id0', ['pre_skill1', 'pre_skill0'], ['acq_skill1', 'acq_skill0']);
    expect(collectionNode.removeAcquiredSkillId('acq_skill1')).toBe(true);
    expect(collectionNode.getAcquiredSkillIds()).toEqual(['acq_skill0']);

    // Removing a non-existent skill ID results in a return value of false, and
    // no change to the prerequisite skill list.
    expect(collectionNode.removeAcquiredSkillId('invalid')).toBe(false);
    expect(collectionNode.getAcquiredSkillIds()).toEqual(['acq_skill0']);
  });

  it('should correctly clear prerequisite skill IDs', function() {
    var collectionNode = _createEmptyCollectionNode(
      'exp_id0', ['pre_skill1', 'pre_skill0'], ['acq_skill1', 'acq_skill0']);
    collectionNode.clearPrerequisiteSkillIds();
    expect(collectionNode.getPrerequisiteSkillIds()).toEqual([]);
    expect(collectionNode.getAcquiredSkillIds()).toEqual([
      'acq_skill1', 'acq_skill0']);
  });

  it('should correctly clear acquired skill IDs', function() {
    var collectionNode = _createEmptyCollectionNode(
      'exp_id0', ['pre_skill1', 'pre_skill0'], ['acq_skill1', 'acq_skill0']);
    collectionNode.clearAcquiredSkillIds();
    expect(collectionNode.getPrerequisiteSkillIds()).toEqual([
      'pre_skill1', 'pre_skill0']);
    expect(collectionNode.getAcquiredSkillIds()).toEqual([]);
  });

  it('should provide an immutable exploration summary', function() {
    var explorationSummaryBackendObject = {
      title: 'exp title',
      category: 'exp category',
      objective: 'exp objective'
    };
    var collectionNodeBackendObject = {
      exploration_id: 'exp_id0',
      prerequisite_skill_ids: [],
      acquired_skill_ids: [],
      exploration_summary: explorationSummaryBackendObject
    };

    var collectionNode = CollectionNodeObjectFactory.create(
      collectionNodeBackendObject);
    expect(collectionNode.getExplorationId()).toEqual('exp_id0');
    expect(collectionNode.getExplorationTitle()).toEqual('exp title');

    var summaryObject = collectionNode.getExplorationSummaryObject();
    expect(summaryObject).toEqual(explorationSummaryBackendObject);

    delete summaryObject.category;
    expect(summaryObject).not.toEqual(
      collectionNode.getExplorationSummaryObject());
  });

  it('should be able to create a new collection node by exploration ID',
    function() {
      var collectionNode = CollectionNodeObjectFactory.createFromExplorationId(
        'exp_id0');
      var prerequisiteSkillIds = collectionNode.getPrerequisiteSkillIds();
      var acquiredSkillIds = collectionNode.getAcquiredSkillIds();
      expect(collectionNode.getExplorationId()).toEqual('exp_id0');
      expect(prerequisiteSkillIds.length).toEqual(0);
      expect(acquiredSkillIds.length).toEqual(0);
      expect(collectionNode.doesExplorationExist()).toBe(false);
    }
  );
});
