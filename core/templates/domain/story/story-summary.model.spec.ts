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
      thumbnail_bg_color: '#a33f40',
      status: 'Published',
      planned_publication_date_msecs: 100,
      last_modified_msecs: 100,
      first_publication_date_msecs: 200,
      unpublishing_reason: null
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
      topic_name: 'Topic one',
      topic_url_fragment: 'topic-one',
      classroom_url_fragment: 'math',
      published_chapters_count: 2,
      total_chapters_count: 5,
      upcoming_chapters_count: 1,
      upcoming_chapters_expected_days: [3],
      overdue_chapters_count: 1,
      visited_chapter_titles: ['Chapter 2']
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
        thumbnail_bg_color: '#a33f40',
        status: 'Published',
        planned_publication_date_msecs: 100,
        last_modified_msecs: 100,
        first_publication_date_msecs: 200,
        unpublishing_reason: null
      })
    ]);
    expect(_sampleStorySummary.getCompletedNodeTitles()).toEqual(['Chapter 1']);
    expect(_sampleStorySummary.getTopicName()).toEqual('Topic one');
    expect(_sampleStorySummary.getTopicUrlFragment()).toEqual('topic-one');
    expect(_sampleStorySummary.getClassroomUrlFragment()).toEqual('math');
    expect(_sampleStorySummary.getPublishedChaptersCount()).toEqual(2);
    expect(_sampleStorySummary.getTotalChaptersCount()).toEqual(5);
    expect(_sampleStorySummary.getUpcomingChaptersCount()).toEqual(1);
    expect(_sampleStorySummary.getUpcomingChaptersExpectedDays()).toEqual([3]);
    expect(_sampleStorySummary.getOverdueChaptersCount()).toEqual(1);
    expect(_sampleStorySummary.getVisitedChapterTitles()).toEqual(
      ['Chapter 2']);
  });
});
