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
      explorationId, prerequisiteSkills, acquiredSkills) {
    return CollectionNodeObjectFactory.create({
      exploration_id: explorationId,
      prerequisite_skills: prerequisiteSkills ? prerequisiteSkills : [],
      acquired_skills: acquiredSkills ? acquiredSkills : [],
      exploration_summary: {
        title: 'Title',
        status: 'private'
      }
    });
  };

  it('should contain initial prerequisite skills', function() {
    var collectionNode = _createEmptyCollectionNode(
      'exp_id0', ['pre_skill1', 'pre_skill0'], ['acq_skill1', 'acq_skill0']);
    expect(collectionNode.getPrerequisiteSkillList().getSkills()).toEqual([
      'pre_skill1', 'pre_skill0'
    ]);
  });

  it('should contain initial acquired skills', function() {
    var collectionNode = _createEmptyCollectionNode(
      'exp_id0', ['pre_skill1', 'pre_skill0'], ['acq_skill1', 'acq_skill0']);
    expect(collectionNode.getAcquiredSkillList().getSkills()).toEqual([
      'acq_skill1', 'acq_skill0'
    ]);
  });

  it('should provide a mutable prerequisite skill list object', function() {
    var collectionNode = _createEmptyCollectionNode('exp_id0');
    var prerequisiteSkillList = collectionNode.getPrerequisiteSkillList();
    prerequisiteSkillList.addSkill('pre_skill');
    expect(collectionNode.getPrerequisiteSkillList().containsSkill(
      'pre_skill'));
  });

  it('should provide a mutable acquired skill list object', function() {
    var collectionNode = _createEmptyCollectionNode('exp_id0');
    var acquiredSkillList = collectionNode.getAcquiredSkillList();
    acquiredSkillList.addSkill('acq_skill');
    expect(collectionNode.getAcquiredSkillList().containsSkill('acq_skill'));
  });

  it('should provide an immutable exploration summary', function() {
    var explorationSummaryBackendObject = {
      title: 'exp title',
      category: 'exp category',
      objective: 'exp objective'
    };
    var collectionNodeBackendObject = {
      exploration_id: 'exp_id0',
      prerequisite_skills: [],
      acquired_skills: [],
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
    var prerequisiteSkillList = collectionNode.getPrerequisiteSkillList();
    var acquiredSkillList = collectionNode.getAcquiredSkillList();
    expect(collectionNode.getExplorationId()).toEqual('exp_id0');
    expect(prerequisiteSkillList.getSkillCount()).toEqual(0);
    expect(acquiredSkillList.getSkillCount()).toEqual(0);
    expect(collectionNode.doesExplorationExist()).toBe(false);
  });
});
