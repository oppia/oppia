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
 * @fileoverview Tests for StoryNodeObjectFactory.
 */

import { StoryNodeObjectFactory } from
  'domain/story/StoryNodeObjectFactory';

describe('Story node object factory', () => {
  let storyNodeObjectFactory: StoryNodeObjectFactory = null;
  var _sampleSubtopic = null;
  var _sampleStoryNode = null;

  beforeEach(() => {
    storyNodeObjectFactory = new StoryNodeObjectFactory();

    var sampleStoryNodeBackendDict = {
      id: 'node_1',
      title: 'Title 1',
      prerequisite_skill_ids: ['skill_1'],
      acquired_skill_ids: ['skill_2'],
      destination_node_ids: ['node_2'],
      outline: 'Outline',
      exploration_id: null,
      outline_is_finalized: false
    };
    _sampleStoryNode = storyNodeObjectFactory.createFromBackendDict(
      sampleStoryNodeBackendDict);
  });

  it('should correctly create a node from node id alone', () => {
    var storyNode = storyNodeObjectFactory.createFromIdAndTitle(
      'node_1', 'Title 1');
    expect(storyNode.getId()).toEqual('node_1');
    expect(storyNode.getTitle()).toEqual('Title 1');
    expect(storyNode.getDestinationNodeIds()).toEqual([]);
    expect(storyNode.getPrerequisiteSkillIds()).toEqual([]);
    expect(storyNode.getAcquiredSkillIds()).toEqual([]);
    expect(storyNode.getOutline()).toEqual('');
    expect(storyNode.getOutlineStatus()).toEqual(false);
    expect(storyNode.getExplorationId()).toEqual(null);
  });

  it('should correctly validate a valid story node', () => {
    expect(_sampleStoryNode.validate()).toEqual([]);
  });

  it('should correctly validate story nodes', () => {
    _sampleStoryNode.addPrerequisiteSkillId('skill_2');
    _sampleStoryNode.addDestinationNodeId('node_1');
    _sampleStoryNode.setExplorationId('');

    expect(_sampleStoryNode.validate()).toEqual([
      'The skill with id skill_2 is common to both the acquired and' +
      ' prerequisite skill id list in node with id node_1',
      'The destination node id of node with id node_1 points to itself.'
    ]);
  });

  it('should correctly throw error when duplicate values are added to arrays',
    () => {
      expect(() => {
        _sampleStoryNode.addDestinationNodeId('node_2');
      }).toThrow();
      expect(() => {
        _sampleStoryNode.addPrerequisiteSkillId('skill_1');
      }).toThrow();
      expect(() => {
        _sampleStoryNode.addAcquiredSkillId('skill_2');
      }).toThrow();
    });

  it('should correctly throw error when invalid values are deleted from arrays',
    () => {
      expect(() => {
        _sampleStoryNode.removeDestinationNodeId('node_5');
      }).toThrow();
      expect(() => {
        _sampleStoryNode.removePrerequisiteSkillId('skill_4');
      }).toThrow();
      expect(() => {
        _sampleStoryNode.removeAcquiredSkillId('skill_4');
      }).toThrow();
    });
});
