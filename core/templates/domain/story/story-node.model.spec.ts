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
 * @fileoverview Tests for StoryNode model.
 */

import { StoryNode, StoryNodeBackendDict } from 'domain/story/story-node.model';

describe('Story node model', () => {
  var _sampleStoryNode: StoryNode;

  beforeEach(() => {
    var sampleStoryNodeBackendDict: StoryNodeBackendDict = {
      id: 'node_1',
      thumbnail_filename: 'image.png',
      title: 'Title 1',
      description: 'Description 1',
      prerequisite_skill_ids: ['skill_1'],
      acquired_skill_ids: ['skill_2'],
      destination_node_ids: ['node_2'],
      outline: 'Outline',
      exploration_id: null,
      outline_is_finalized: false,
      thumbnail_bg_color: '#a33f40',
    };
    _sampleStoryNode = StoryNode.createFromBackendDict(
      sampleStoryNodeBackendDict);
  });

  it('should correctly create a node from node id alone', () => {
    var storyNode = StoryNode.createFromIdAndTitle(
      'node_1', 'Title 1');
    expect(storyNode.getId()).toEqual('node_1');
    expect(storyNode.getThumbnailFilename()).toEqual(null);
    expect(storyNode.getTitle()).toEqual('Title 1');
    expect(storyNode.getDescription()).toEqual('');
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

  it('should correctly perform prepublish validation for a story node', () => {
    expect(_sampleStoryNode.prepublishValidate()).toEqual([]);
    _sampleStoryNode.setThumbnailFilename('');
    expect(_sampleStoryNode.prepublishValidate()).toEqual([
      'Chapter Title 1 should have a thumbnail.']);
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
      }).toThrowError('The given node is already a destination node.');
      expect(() => {
        _sampleStoryNode.addPrerequisiteSkillId('skill_1');
      }).toThrowError('The given skill id is already a prerequisite skill.');
      expect(() => {
        _sampleStoryNode.addAcquiredSkillId('skill_2');
      }).toThrowError('The given skill is already an acquired skill.');
    });

  it('should correctly throw error when invalid values are deleted from arrays',
    () => {
      expect(() => {
        _sampleStoryNode.removeDestinationNodeId('node_5');
      }).toThrowError('The given node is not a destination node.');
      expect(() => {
        _sampleStoryNode.removePrerequisiteSkillId('skill_4');
      }).toThrowError('The given skill id is not a prerequisite skill.');
      expect(() => {
        _sampleStoryNode.removeAcquiredSkillId('skill_4');
      }).toThrowError('The given skill is not an acquired skill.');
    });
});
