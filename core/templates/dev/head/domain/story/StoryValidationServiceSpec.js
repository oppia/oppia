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
 * @fileoverview Tests for StoryValidationService.
 */

describe('Story validation service', function() {
  var StoryValidationService = null;
  var StoryObjectFactory = null;
  var StoryNodeObjectFactory = null;

  beforeEach(module('oppia'));

  beforeEach(inject(function($injector) {
    StoryValidationService = $injector.get('StoryValidationService');
    StoryObjectFactory = $injector.get('StoryObjectFactory');
    StoryNodeObjectFactory = $injector.get('StoryNodeObjectFactory');

    var sampleStoryBackendObject = {
      id: 'sample_story_id',
      title: 'Story title',
      description: 'Story description',
      notes: 'Story notes',
      version: 1,
      story_contents: {
        initial_node_id: 'node_2',
        nodes: [
          {
            id: 'node_1',
            prerequisite_skill_ids: ['skill_1'],
            acquired_skill_ids: ['skill_2'],
            destination_node_ids: [],
            outline: 'Outline',
            exploration_id: null,
            outline_is_finalized: false
          }, {
            id: 'node_2',
            prerequisite_skill_ids: ['skill_3'],
            acquired_skill_ids: ['skill_4'],
            destination_node_ids: ['node_1'],
            outline: 'Outline 2',
            exploration_id: 'exp_1',
            outline_is_finalized: true
          }],
        next_node_id: 'node_3'
      },
      language_code: 'en'
    };
    _sampleStory = StoryObjectFactory.createFromBackendDict(
      sampleStoryBackendObject);
  }));

  it('should correctly validate story', function() {
    _sampleStory.setTitle('');
    _sampleStory.setDescription(123);
    _sampleStory.setNotes(123);
    _sampleStory.setLanguageCode(123);
    expect(
      StoryValidationService.findValidationIssuesInStory(_sampleStory)
    ).toEqual([
      'Story title should be a non-empty string',
      'Story description should be a string',
      'Story notes should be a string',
      'Story language code should be a string'
    ]);
  });

  it('should correctly validate node ids', function() {
    _sampleStory.getStoryContents().getNodes()[0].addDestinationNodeId('node1');
    expect(
      StoryValidationService.findValidationIssuesInStory(_sampleStory)
    ).toEqual([
      'Each destination node id should be valid'
    ]);

    _sampleStory.getStoryContents().getNodes()[0].removeDestinationNodeId(
      'node1');
    _sampleStory.getStoryContents().getNodes()[0].addDestinationNodeId(
      'node_a');
    expect(
      StoryValidationService.findValidationIssuesInStory(_sampleStory)
    ).toEqual([
      'Each destination node id should be valid'
    ]);

    _sampleStory.getStoryContents().getNodes()[0].removeDestinationNodeId(
      'node_a');
    _sampleStory.getStoryContents().getNodes()[0].addDestinationNodeId(
      'node_111');
    expect(
      StoryValidationService.findValidationIssuesInStory(_sampleStory)
    ).toEqual([]);
  });

  it('should correctly validate story nodes', function() {
    _sampleStory.getStoryContents().setNodeExplorationId('node_1', 123);
    _sampleStory.getStoryContents().setNodeOutline('node_1', 123);
    _sampleStory.getStoryContents().addPrerequisiteSkillIdToNode('node_1', 123);
    _sampleStory.getStoryContents().addAcquiredSkillIdToNode('node_1', 123);
    _sampleStory.getStoryContents().addDestinationNodeIdToNode(
      'node_1', 'node_1');

    expect(
      StoryValidationService.findValidationIssuesInStory(_sampleStory)
    ).toEqual([
      'Node outline should be a string',
      'Exploration id should be a string or null',
      'Each prerequisite skill id should be a string',
      'Each acquired skill id should be a string',
      'Acquired and prerequisite skills for a node should not have any ' +
      'skill in common',
      'A destination node id of a node should not point to the same node.'
    ]);
  });
});
