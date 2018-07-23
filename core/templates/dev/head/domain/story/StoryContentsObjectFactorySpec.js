// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for StoryContentsObjectFactory.
 */

describe('Story contents object factory', function() {
  var StoryContentsObjectFactory = null;
  var _sampleSubtopic = null;

  beforeEach(module('oppia'));

  beforeEach(inject(function($injector) {
    StoryContentsObjectFactory = $injector.get('StoryContentsObjectFactory');

    var sampleStoryContentsBackendDict = {
      initial_node_id: 'node_1',
      nodes: [
        {
          id: 'node_1',
          prerequisite_skill_ids: ['skill_1'],
          acquired_skill_ids: ['skill_2'],
          destination_node_ids: ['node_2'],
          outline: 'Outline',
          exploration_id: null,
          outline_is_finalized: false
        }, {
          id: 'node_2',
          prerequisite_skill_ids: ['skill_2'],
          acquired_skill_ids: ['skill_3', 'skill_4'],
          destination_node_ids: [],
          outline: 'Outline 2',
          exploration_id: 'exp_1',
          outline_is_finalized: true
        }],
      next_node_id: 'node_3'
    };
    _sampleStoryContents = StoryContentsObjectFactory.createFromBackendDict(
      sampleStoryContentsBackendDict);
  }));

  it('should correctly return index of node (or -1, if not present) ' +
     'based on id', function() {
    expect(_sampleStoryContents.getNodeIndex('node_1')).toEqual(0);
    expect(_sampleStoryContents.getNodeIndex('node_10')).toEqual(-1);
  });

  it('should correctly correctly validate valid story contents', function() {
    expect(_sampleStoryContents.validate()).toEqual([]);
  });

  it('should correctly correctly validate case where prerequisite skills ' +
     'are not acquired by the user', function() {
    _sampleStoryContents.addNode();
    _sampleStoryContents.addDestinationNodeIdToNode('node_1', 'node_3');
    _sampleStoryContents.addPrerequisiteSkillIdToNode('node_3', 'skill_3');
    expect(_sampleStoryContents.validate()).toEqual([
      'The prerequisite skill with id skill_3 was not completed before node ' +
      'with id node_3 was unlocked'
    ]);
  });

  it('should correctly correctly validate the case where the story graph ' +
    'has loops', function() {
    _sampleStoryContents.addNode();
    _sampleStoryContents.addDestinationNodeIdToNode('node_2', 'node_3');
    _sampleStoryContents.addDestinationNodeIdToNode('node_3', 'node_1');
    expect(_sampleStoryContents.validate()).toEqual([
      'Loops are not allowed in the node graph'
    ]);
  });

  it('should correctly correctly validate the case where the story graph is' +
    ' disconnected.', function() {
    _sampleStoryContents.addNode();
    expect(_sampleStoryContents.validate()).toEqual([
      'The node with id node_3 is disconnected from the graph'
    ]);
  });

  it('should correctly throw error when node id is invalid for any function',
    function() {
      expect(function() {
        _sampleStoryContents.setInitialNodeId('node_5');
      }).toThrow();
      expect(function() {
        _sampleStoryContents.deleteNode('node_5');
      }).toThrow();
      expect(function() {
        _sampleStoryContents.setNodeExplorationId('node_5', 'id');
      }).toThrow();
      expect(function() {
        _sampleStoryContents.setNodeOutline('node_5', 'Outline');
      }).toThrow();
      expect(function() {
        _sampleStoryContents.markNodeOutlineAsFinalized('node_5');
      }).toThrow();
      expect(function() {
        _sampleStoryContents.markNodeOutlineAsNotFinalized('node_5');
      }).toThrow();
      expect(function() {
        _sampleStoryContents.addPrerequisiteSkillIdToNode('node_5', 'skill_1');
      }).toThrow();
      expect(function() {
        _sampleStoryContents.removePrerequisiteSkillIdFromNode(
          'node_5', 'skill_1');
      }).toThrow();
      expect(function() {
        _sampleStoryContents.addAcquiredSkillIdToNode('node_5', 'skill_1');
      }).toThrow();
      expect(function() {
        _sampleStoryContents.removeAcquiredSkillIdFromNode('node_5', 'skill_1');
      }).toThrow();
      expect(function() {
        _sampleStoryContents.addDestinationNodeIdToNode('node_5', 'node_1');
      }).toThrow();
      expect(function() {
        _sampleStoryContents.removeDestinationNodeIdFromNode(
          'node_5', 'node_1');
      }).toThrow();
    });
});
