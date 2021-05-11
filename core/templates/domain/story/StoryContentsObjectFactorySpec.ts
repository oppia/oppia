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

import { TestBed } from '@angular/core/testing';

import { StoryContents, StoryContentsBackendDict, StoryContentsObjectFactory } from
  'domain/story/StoryContentsObjectFactory';

describe('Story contents object factory', () => {
  let storyContentsObjectFactory: StoryContentsObjectFactory;
  let _sampleStoryContents: StoryContents;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StoryContentsObjectFactory]
    });

    storyContentsObjectFactory = TestBed.get(StoryContentsObjectFactory);

    var sampleStoryContentsBackendDict = {
      initial_node_id: 'node_1',
      nodes: [
        {
          id: 'node_1',
          title: 'Title 1',
          description: 'Description 1',
          prerequisite_skill_ids: ['skill_1'],
          acquired_skill_ids: ['skill_2'],
          destination_node_ids: ['node_2'],
          outline: 'Outline',
          exploration_id: null,
          outline_is_finalized: false,
          thumbnail_bg_color: '#a33f40',
          thumbnail_filename: 'filename'
        }, {
          id: 'node_2',
          title: 'Title 2',
          description: 'Description 2',
          prerequisite_skill_ids: ['skill_2'],
          acquired_skill_ids: ['skill_3', 'skill_4'],
          destination_node_ids: [],
          outline: 'Outline 2',
          exploration_id: 'exp_1',
          outline_is_finalized: true,
          thumbnail_bg_color: '#a33f40',
          thumbnail_filename: 'filename'
        }],
      next_node_id: 'node_3'
    };
    _sampleStoryContents = storyContentsObjectFactory.createFromBackendDict(
      sampleStoryContentsBackendDict);
  });

  it('should correctly return index of node (or -1, if not present) ' +
     'based on id', () => {
    expect(_sampleStoryContents.getNodeIndex('node_1')).toEqual(0);
    expect(_sampleStoryContents.getNodeIndex('node_10')).toEqual(-1);
  });

  it('should correctly correctly return the id to title map for story ' +
    'nodes', () => {
    expect(
      _sampleStoryContents.getNodeIdsToTitleMap(['node_1', 'node_2'])
    ).toEqual({
      node_1: 'Title 1',
      node_2: 'Title 2'
    });

    expect(() => {
      _sampleStoryContents.getNodeIdsToTitleMap(['node_1', 'node_2', 'node_3']);
    }).toThrowError('The node with id node_3 is invalid');
  });

  it('should correctly correctly validate valid story contents', () => {
    expect(_sampleStoryContents.validate()).toEqual([]);
  });

  it('should correctly set initial node id when first node is ' +
    'created', () => {
    var sampleStoryContentsBackendDict: StoryContentsBackendDict = {
      initial_node_id: 'node_1',
      next_node_id: '',
      nodes: []
    };
    var storyContents = storyContentsObjectFactory.createFromBackendDict(
      sampleStoryContentsBackendDict);
    storyContents.addNode('Title 1');
    expect(storyContents.getInitialNodeId()).toEqual('node_1');
    expect(storyContents.getNodes()[0].getTitle()).toEqual('Title 1');
  });

  it('should correctly throw error when node id is invalid for any function',
    () => {
      expect(() => {
        _sampleStoryContents.setInitialNodeId('node_5');
      }).toThrowError('The node with given id doesn\'t exist');
      expect(() => {
        _sampleStoryContents.deleteNode('node_5');
      }).toThrowError('The node does not exist');
      expect(() => {
        _sampleStoryContents.setNodeExplorationId('node_5', 'id');
      }).toThrowError('The node with given id doesn\'t exist');
      expect(() => {
        _sampleStoryContents.setNodeOutline('node_5', 'Outline');
      }).toThrowError('The node with given id doesn\'t exist');
      expect(() => {
        _sampleStoryContents.setNodeDescription('node_5', 'Description');
      }).toThrowError();
      expect(() => {
        _sampleStoryContents.markNodeOutlineAsFinalized('node_5');
      }).toThrowError('The node with given id doesn\'t exist');
      expect(() => {
        _sampleStoryContents.markNodeOutlineAsNotFinalized('node_5');
      }).toThrowError('The node with given id doesn\'t exist');
      expect(() => {
        _sampleStoryContents.setNodeTitle('node_5', 'Title 3');
      }).toThrowError('The node with given id doesn\'t exist');
      expect(() => {
        _sampleStoryContents.addPrerequisiteSkillIdToNode('node_5', 'skill_1');
      }).toThrowError('The node with given id doesn\'t exist');
      expect(() => {
        _sampleStoryContents.removePrerequisiteSkillIdFromNode(
          'node_5', 'skill_1');
      }).toThrowError('The node with given id doesn\'t exist');
      expect(() => {
        _sampleStoryContents.addAcquiredSkillIdToNode('node_5', 'skill_1');
      }).toThrowError('The node with given id doesn\'t exist');
      expect(() => {
        _sampleStoryContents.removeAcquiredSkillIdFromNode('node_5', 'skill_1');
      }).toThrowError('The node with given id doesn\'t exist');
      expect(() => {
        _sampleStoryContents.addDestinationNodeIdToNode('node_5', 'node_1');
      }).toThrowError('The node with given id doesn\'t exist');
      expect(() => {
        _sampleStoryContents.removeDestinationNodeIdFromNode(
          'node_5', 'node_1');
      }).toThrowError('The node with given id doesn\'t exist');
    });
});
