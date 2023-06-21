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
 * @fileoverview Tests for ReadOnlyStoryNodeModel.
 */

import { ReadOnlyStoryNode } from
  'domain/story_viewer/read-only-story-node.model';
import { LearnerExplorationSummary } from
  'domain/summary/learner-exploration-summary.model';

describe('Read only story node model', () => {
  var _sampleStoryNode: ReadOnlyStoryNode;

  beforeEach(() => {
    var sampleReadOnlyStoryNodeBackendDict = {
      id: 'node_1',
      title: 'Title 1',
      description: 'Description',
      prerequisite_skill_ids: ['skill_1'],
      acquired_skill_ids: ['skill_2'],
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
          5: 0
        },
        tags: [],
        activity_type: 'exploration',
        category: 'Algebra'
      },
      completed: true,
      thumbnail_bg_color: '#a33f40',
      thumbnail_filename: 'image.png'
    };
    _sampleStoryNode = ReadOnlyStoryNode.createFromBackendDict(
      sampleReadOnlyStoryNodeBackendDict);
  });

  it('should correctly return all the values', function() {
    expect(_sampleStoryNode.getId()).toEqual('node_1');
    expect(_sampleStoryNode.getTitle()).toEqual('Title 1');
    expect(_sampleStoryNode.getDescription()).toEqual('Description');
    expect(_sampleStoryNode.getExplorationId()).toEqual('exp_id');
    expect(_sampleStoryNode.isCompleted()).toEqual(true);
    expect(_sampleStoryNode.getExplorationSummaryObject()).toEqual(
      LearnerExplorationSummary.createFromBackendDict({
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
          5: 0
        },
        tags: [],
        activity_type: 'exploration',
        category: 'Algebra'
      }));
    expect(_sampleStoryNode.getOutline()).toEqual('Outline');
    expect(_sampleStoryNode.getOutlineStatus()).toEqual(false);
    expect(_sampleStoryNode.getOutlineStatus()).toEqual(false);
    expect(_sampleStoryNode.getThumbnailFilename()).toEqual('image.png');
    expect(_sampleStoryNode.getThumbnailBgColor()).toEqual('#a33f40');
  });
});
