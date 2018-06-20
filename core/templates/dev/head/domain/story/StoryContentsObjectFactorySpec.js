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
          prerequisite_skill_ids: [],
          acquired_skill_ids: [],
          destination_node_ids: [],
          outline: 'Outline',
          exploration_id: null,
          outline_is_finalized: false
        }, {
          id: 'node_2',
          prerequisite_skill_ids: [],
          acquired_skill_ids: [],
          destination_node_ids: [],
          outline: 'Outline 2',
          exploration_id: null,
          outline_is_finalized: false
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

  it('should correctly increment given node id', function() {
    expect(
      StoryContentsObjectFactory.incrementNodeId('node_3')).toEqual('node_4');
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
