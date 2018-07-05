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
      },
      language_code: 'en'
    };
    _sampleStory = StoryObjectFactory.createFromBackendDict(
      sampleStoryBackendObject);
  }));

  var _findValidationIssuesInStory = function() {
    return StoryValidationService.findValidationIssuesForStory(_sampleStory);
  };

  it('should correctly validate a valid story', function() {
    expect(_findValidationIssuesInStory()).toEqual([]);
  });

  it('should correctly validate story', function() {
    _sampleStory.setTitle('');
    expect(_findValidationIssuesInStory()).toEqual([
      'Story title should be a non-empty string'
    ]);
  });

  it('should correctly validate story nodes', function() {
    _sampleStory.getStoryContents().addPrerequisiteSkillIdToNode(
      'node_1', 'skill_2');
    _sampleStory.getStoryContents().addDestinationNodeIdToNode(
      'node_1', 'node_1');

    expect(_findValidationIssuesInStory()).toEqual([
      'Acquired and prerequisite skills for a node should not have any ' +
      'skill in common',
      'A destination node id of a node should not point to the same node.'
    ]);
  });

  it('should correctly correctly validate case where prerequisite skills ' +
     'are not acquired by the user', function() {
    var storyContents = _sampleStory.getStoryContents();
    storyContents.addNode();
    storyContents.addDestinationNodeIdToNode('node_1', 'node_3');
    storyContents.addPrerequisiteSkillIdToNode('node_3', 'skill_3');
    expect(_findValidationIssuesInStory()).toEqual([
      'The prerequisite skill with id skill_3 was not completed before node ' +
      'with id node_3 was unlocked'
    ]);
  });

  it('should correctly correctly validate the case where the story graph ' +
    'has loops', function() {
    var storyContents = _sampleStory.getStoryContents();
    storyContents.addNode();
    storyContents.addDestinationNodeIdToNode('node_2', 'node_3');
    storyContents.addDestinationNodeIdToNode('node_3', 'node_1');
    expect(_findValidationIssuesInStory()).toEqual([
      'Loops are not allowed in the node graph'
    ]);
  });

  it('should correctly correctly validate the case where the story graph is' +
    ' disconnected.', function() {
    var storyContents = _sampleStory.getStoryContents();
    storyContents.addNode();
    expect(_findValidationIssuesInStory()).toEqual([
      'The node with id node_3 is disconnected from the graph'
    ]);
  });
});
