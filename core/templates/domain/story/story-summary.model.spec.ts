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
 * @fileoverview Tests for StorySummary model.
 */

import { StoryNode } from './story-node.model';
import { StorySummary } from 'domain/story/story-summary.model';

describe('Story summary model', () => {
  let _sampleStorySummary: StorySummary;

  beforeEach(() => {
    let nodeDict = {
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
      thumbnail_bg_color: '#a33f40'
    };

    const sampleStorySummaryBackendDict = {
      id: 'sample_story_id',
      title: 'Story title',
      node_titles: ['Chapter 1', 'Chapter 2'],
      thumbnail_filename: 'image.svg',
      thumbnail_bg_color: '#F8BF74',
      description: 'Description',
      story_is_published: true,
      completed_node_titles: ['Chapter 1'],
      url_fragment: 'story-url-fragment',
      all_node_dicts: [nodeDict],
      topic_url_fragment: 'topic-one',
      classroom_url_fragment: 'math'
    };
    _sampleStorySummary = StorySummary.createFromBackendDict(
      sampleStorySummaryBackendDict
    );
  });

  it('should be able to get all the values', () => {
    expect(_sampleStorySummary.getId()).toEqual('sample_story_id');
    expect(_sampleStorySummary.getTitle()).toEqual('Story title');
    expect(_sampleStorySummary.getUrlFragment()).toEqual('story-url-fragment');
    expect(_sampleStorySummary.getNodeTitles()).toEqual([
      'Chapter 1', 'Chapter 2']);
    expect(_sampleStorySummary.getThumbnailFilename()).toEqual('image.svg');
    expect(_sampleStorySummary.getThumbnailBgColor()).toEqual('#F8BF74');
    expect(_sampleStorySummary.getDescription()).toEqual('Description');
    expect(_sampleStorySummary.isStoryPublished()).toBe(true);
    expect(_sampleStorySummary.isNodeCompleted('Chapter 1')).toBe(true);
    expect(_sampleStorySummary.isNodeCompleted('Chapter 2')).toBe(false);
    expect(_sampleStorySummary.getAllNodes()).toEqual([
      StoryNode.createFromBackendDict({
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
        thumbnail_bg_color: '#a33f40'
      })
    ]);
    expect(_sampleStorySummary.getTopicUrlFragment()).toEqual('topic-one');
    expect(_sampleStorySummary.getClassroomUrlFragment()).toEqual('math');
  });
});
