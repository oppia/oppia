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
 * @fileoverview Tests for CollectionValidationService.
 */

describe('Collection validation service', function() {
  var CollectionValidationService = null;
  var CollectionObjectFactory = null;
  var CollectionNodeObjectFactory = null;

  var EXISTS = true;
  var DOES_NOT_EXIST = false;
  var PUBLIC_STATUS = true;
  var PRIVATE_STATUS = false;

  beforeEach(module('oppia'));

  beforeEach(inject(function($injector) {
    CollectionValidationService = $injector.get('CollectionValidationService');
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
    _addCollectionNode('exp_id0', EXISTS, PRIVATE_STATUS);
  }));

  var _addCollectionNode = function(explorationId, exists, isPublic) {
    var collectionNode = CollectionNodeObjectFactory.createFromExplorationId(
      explorationId);
    if (exists) {
      collectionNode.setExplorationSummaryObject({
        status: isPublic ? 'public' : 'private'
      });
    }
    return _sampleCollection.addCollectionNode(collectionNode);
  };

  var _getCollectionNode = function(explorationId) {
    return _sampleCollection.getCollectionNodeByExplorationId(explorationId);
  };

  var _findPrivateValidationIssues = function() {
    return CollectionValidationService.findValidationIssuesForPrivateCollection(
      _sampleCollection);
  };

  var _findPublicValidationIssues = function() {
    return CollectionValidationService.findValidationIssuesForPublicCollection(
      _sampleCollection);
  };

  it('should not find issues with a collection with one node', function() {
    var issues = _findPrivateValidationIssues();
    expect(issues).toEqual([]);
  });

  it('should expect at least one collection node', function() {
    expect(_sampleCollection.deleteCollectionNode('exp_id0')).toBe(true);
    expect(_sampleCollection.getCollectionNodeCount()).toEqual(0);

    var issues = _findPrivateValidationIssues();
    expect(issues).toEqual([
      'There should be at least 1 exploration in the collection.']);
  });

  it('should expect at least one node with no prereq skills', function() {
    var node = _getCollectionNode('exp_id0');
    node.getPrerequisiteSkillList().addSkill('test');

    var issues = _findPrivateValidationIssues();
    expect(issues.length).toEqual(2);
    expect(issues[0]).toEqual(
      'There should be exactly 1 exploration initially available to the ' +
      'learner.');

    // However, removing the prerequisite skill makes the node accessible again.
    node.getPrerequisiteSkillList().clearSkills();

    issues = _findPrivateValidationIssues();
    expect(issues).toEqual([]);
  });

  it('should detect non-linear progression', function() {
    expect(_addCollectionNode('exp_id1', EXISTS, PRIVATE_STATUS)).toBe(true);
    expect(_addCollectionNode('exp_id2', EXISTS, PRIVATE_STATUS)).toBe(true);
    expect(_addCollectionNode('exp_id3', EXISTS, PRIVATE_STATUS)).toBe(true);
    expect(_addCollectionNode('exp_id4', EXISTS, PRIVATE_STATUS)).toBe(true);

    var node0 = _getCollectionNode('exp_id0');
    var node1 = _getCollectionNode('exp_id1');
    var node2 = _getCollectionNode('exp_id2');
    var node3 = _getCollectionNode('exp_id3');
    var node4 = _getCollectionNode('exp_id4');

    node0.getAcquiredSkillList().addSkill('skill0');
    node1.getPrerequisiteSkillList().addSkill('skill0');
    node2.getPrerequisiteSkillList().addSkill('skill0');
    node1.getAcquiredSkillList().addSkill('skill1');
    node2.getAcquiredSkillList().addSkill('skill1');
    node3.getPrerequisiteSkillList().addSkill('skill1');
    node4.getPrerequisiteSkillList().addSkill('skill1');

    var issues = _findPrivateValidationIssues();
    expect(issues).toEqual([
      'The collection should have linear progression. The following ' +
      'explorations are a part of a branch: exp_id1, exp_id2',
      'The collection should have linear progression. The following ' +
      'explorations are a part of a branch: exp_id3, exp_id4'
    ]);
  });

  it('should detect nodes with similar acquired and prereq skills', function() {
    expect(_addCollectionNode('exp_id1', EXISTS, PRIVATE_STATUS)).toBe(true);
    expect(_addCollectionNode('exp_id2', EXISTS, PRIVATE_STATUS)).toBe(true);

    var node0 = _getCollectionNode('exp_id0');
    var node1 = _getCollectionNode('exp_id1');
    var node2 = _getCollectionNode('exp_id2');

    node0.getAcquiredSkillList().addSkill('skill0');
    node1.getPrerequisiteSkillList().addSkill('skill0');
    node1.getAcquiredSkillList().addSkill('skill0');
    node1.getAcquiredSkillList().addSkill('skill1');
    node2.getPrerequisiteSkillList().addSkill('skill1');

    // 'skill0' is required and acquired for exp 1
    var issues = _findPrivateValidationIssues();
    expect(issues).toEqual([
      'Exploration exp_id1 has skills which are both required for playing it ' +
      'and acquired after playing it: skill0'
    ]);

    // The issue will be detected for other collection nodes, too.
    node2.getPrerequisiteSkillList().addSkill('skill1');
    node2.getAcquiredSkillList().addSkill('skill0');
    node2.getAcquiredSkillList().addSkill('skill1');
    issues = _findPrivateValidationIssues();
    expect(issues).toEqual([
      'Exploration exp_id1 has skills which are both required for playing it ' +
      'and acquired after playing it: skill0',
      'Exploration exp_id2 has skills which are both required for playing it ' +
      'and acquired after playing it: skill1'
    ]);

    // Multiple skills can overlap between the two lists.
    node2.getPrerequisiteSkillList().addSkill('skill0');
    issues = _findPrivateValidationIssues();
    expect(issues).toEqual([
      'Exploration exp_id1 has skills which are both required for playing it ' +
      'and acquired after playing it: skill0',
      'Exploration exp_id2 has skills which are both required for playing it ' +
      'and acquired after playing it: skill1, skill0'
    ]);

    node1.getAcquiredSkillList().removeSkillByName('skill0');
    node2.getAcquiredSkillList().clearSkills();
    issues = _findPrivateValidationIssues();
    expect(issues).toEqual([]);
  });

  it('should detect unreachable explorations', function() {
    expect(_addCollectionNode('exp_id1', EXISTS, PRIVATE_STATUS)).toBe(true);
    expect(_addCollectionNode('exp_id2', EXISTS, PRIVATE_STATUS)).toBe(true);

    var node0 = _getCollectionNode('exp_id0');
    var node1 = _getCollectionNode('exp_id1');
    var node2 = _getCollectionNode('exp_id2');

    node0.getAcquiredSkillList().addSkill('skill0');
    node1.getPrerequisiteSkillList().addSkill('skill0');
    node2.getPrerequisiteSkillList().addSkill('skill1');

    var issues = _findPrivateValidationIssues();
    expect(issues).toEqual([
      'The following exploration(s) are unreachable from the initial ' +
      'exploration(s): exp_id2'
    ]);

    node1.getAcquiredSkillList().addSkill('skill1');
    issues = _findPrivateValidationIssues();
    expect(issues).toEqual([]);

    node0.getAcquiredSkillList().removeSkillByName('skill0');
    issues = _findPrivateValidationIssues();
    expect(issues).toEqual([
      'The following exploration(s) are unreachable from the initial ' +
      'exploration(s): exp_id1, exp_id2'
    ]);
  });

  it('should detect nonexistent/inaccessible explorations', function() {
    expect(_addCollectionNode(
      'exp_id1', DOES_NOT_EXIST, PRIVATE_STATUS)).toBe(true);
    var node0 = _getCollectionNode('exp_id0');
    var node1 = _getCollectionNode('exp_id1');
    node0.getPrerequisiteSkillList().addSkill('skill0');
    node1.getAcquiredSkillList().addSkill('skill0');

    var issues = _findPrivateValidationIssues();
    expect(issues).toEqual([
      'The following exploration(s) either do not exist, or you do not have ' +
      'edit access to add them to this collection: exp_id1'
    ]);
  });

  it('should allow private and public explorations in a private collection',
      function() {
    expect(_addCollectionNode('exp_id1', EXISTS, PRIVATE_STATUS)).toBe(true);
    expect(_addCollectionNode('exp_id2', EXISTS, PUBLIC_STATUS)).toBe(true);
    var node0 = _getCollectionNode('exp_id0');
    var node1 = _getCollectionNode('exp_id1');
    var node2 = _getCollectionNode('exp_id2');
    node0.getAcquiredSkillList().addSkill('skill0');
    node1.getPrerequisiteSkillList().addSkill('skill0');
    node1.getAcquiredSkillList().addSkill('skill1');
    node2.getPrerequisiteSkillList().addSkill('skill1');
    var issues = _findPrivateValidationIssues();
    expect(issues).toEqual([]);
  });

  it('should not allow private explorations in a public collection',
      function() {
    expect(_addCollectionNode('exp_id1', EXISTS, PUBLIC_STATUS)).toBe(true);
    var node1 = _getCollectionNode('exp_id1');
    var node0 = _getCollectionNode('exp_id0');
    node0.getAcquiredSkillList().addSkill('skill0');
    node1.getPrerequisiteSkillList().addSkill('skill0');

    var issues = _findPublicValidationIssues();
    expect(issues).toEqual([
      'Private explorations cannot be added to a public collection: exp_id0'
    ]);

    node1.getPrerequisiteSkillList().removeSkillByName('skill0');
    expect(_sampleCollection.deleteCollectionNode('exp_id0')).toBe(true);
    issues = _findPublicValidationIssues();
    expect(issues).toEqual([]);
  });

  it('should be able to detect multiple validation issues', function() {
    expect(_addCollectionNode('exp_id1', EXISTS, PUBLIC_STATUS)).toBe(true);
    expect(_addCollectionNode('exp_id2', EXISTS, PRIVATE_STATUS)).toBe(true);

    var node0 = _getCollectionNode('exp_id0');
    var node1 = _getCollectionNode('exp_id1');
    var node2 = _getCollectionNode('exp_id2');

    node0.getPrerequisiteSkillList().addSkill('skill0');
    node0.getAcquiredSkillList().addSkill('skill1');
    node1.getPrerequisiteSkillList().addSkill('skill1');
    node2.getPrerequisiteSkillList().addSkill('skill1');

    var issues = _findPublicValidationIssues();
    expect(issues).toEqual([
      'There should be exactly 1 exploration initially available to the ' +
      'learner.',
      'The following exploration(s) are unreachable from the initial ' +
      'exploration(s): exp_id0, exp_id1, exp_id2',
      'Private explorations cannot be added to a public collection: ' +
      'exp_id0, exp_id2'
    ]);
  });

  it('should return false if the tags are not valid', function() {
    expect(CollectionValidationService.isTagValid(['test'])).toBe(true);
    expect(CollectionValidationService.isTagValid(['test', 'math'])).toBe(true);

    expect(CollectionValidationService.isTagValid(
      ['test', 'test'])).toBe(false);
    expect(CollectionValidationService.isTagValid(
      ['test '])).toBe(false);
  });
});
