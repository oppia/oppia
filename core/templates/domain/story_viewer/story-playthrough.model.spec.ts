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
 * @fileoverview Tests for StoryPlaythroughModel.
 */

import {StoryPlaythrough} from 'domain/story_viewer/story-playthrough.model';

describe('Story playthrough model', () => {
  var _samplePlaythroughObject: StoryPlaythrough;

  beforeEach(() => {
    var firstSampleReadOnlyStoryNodeBackendDict = {
      id: 'node_1',
      description: 'description',
      title: 'Title 1',
      prerequisite_skill_ids: [],
      acquired_skill_ids: [],
      destination_node_ids: ['node_2'],
      outline: 'Outline',
      exploration_id: 'exp_id',
      outline_is_finalized: false,
      exp_summary_dict: {
        title: 'Title',
        status: 'private',
        last_updated_msec: 1591296737470.528,
        community_owned: false,
        objective: 'Test Objective',
        id: '44LKoKLlIbGe',
        num_views: 0,
        thumbnail_icon_url: '/subjects/Algebra.svg',
        human_readable_contributors_summary: {},
        language_code: 'en',
        thumbnail_bg_color: '#cc4b00',
        created_on_msec: 1591296635736.666,
        ratings: {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
        },
        tags: [],
        activity_type: 'exploration',
        category: 'Algebra',
      },
      completed: true,
      thumbnail_bg_color: '#927117',
      thumbnail_filename: 'filename',
    };
    var secondSampleReadOnlyStoryNodeBackendDict = {
      id: 'node_2',
      description: 'description',
      title: 'Title 2',
      prerequisite_skill_ids: [],
      acquired_skill_ids: [],
      destination_node_ids: ['node_3'],
      outline: 'Outline',
      exploration_id: 'exp_id',
      outline_is_finalized: false,
      exp_summary_dict: {
        title: 'Title',
        status: 'private',
        last_updated_msec: 1591296737470.528,
        community_owned: false,
        objective: 'Test Objective',
        id: '44LKoKLlIbGe',
        num_views: 0,
        thumbnail_icon_url: '/subjects/Algebra.svg',
        human_readable_contributors_summary: {},
        language_code: 'en',
        thumbnail_bg_color: '#cc4b00',
        created_on_msec: 1591296635736.666,
        ratings: {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
        },
        tags: [],
        activity_type: 'exploration',
        category: 'Algebra',
      },
      completed: false,
      thumbnail_bg_color: '#927117',
      thumbnail_filename: 'filename',
    };
    var storyPlaythroughBackendObject = {
      story_id: 'qwerty',
      story_nodes: [
        firstSampleReadOnlyStoryNodeBackendDict,
        secondSampleReadOnlyStoryNodeBackendDict,
      ],
      story_title: 'Story',
      story_description: 'Description',
      topic_name: 'Topic 1',
      meta_tag_content: 'Story meta tag content',
    };
    _samplePlaythroughObject = StoryPlaythrough.createFromBackendDict(
      storyPlaythroughBackendObject
    );
  });

  it('should correctly return all the values', function () {
    expect(_samplePlaythroughObject.getInitialNode().getId()).toEqual('node_1');
    expect(_samplePlaythroughObject.getStoryNodeCount()).toEqual(2);
    expect(_samplePlaythroughObject.getStoryNodes()[0].getId()).toEqual(
      'node_1'
    );
    expect(_samplePlaythroughObject.getStoryNodes()[1].getId()).toEqual(
      'node_2'
    );
    expect(_samplePlaythroughObject.hasFinishedStory()).toEqual(false);
    expect(_samplePlaythroughObject.getNextPendingNodeId()).toEqual('node_2');
    expect(_samplePlaythroughObject.hasStartedStory()).toEqual(true);
    expect(_samplePlaythroughObject.getStoryId()).toEqual('qwerty');
    expect(_samplePlaythroughObject.getMetaTagContent()).toEqual(
      'Story meta tag content'
    );
  });

  it('should throw an error if there are no nodes', () => {
    _samplePlaythroughObject.nodes.length = 0;
    expect(() => {
      _samplePlaythroughObject.getNextPendingNodeId();
    }).toThrowError('No story nodes found!');
  });
});
