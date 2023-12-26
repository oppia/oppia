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
 * @fileoverview Tests for CreatorTopicSummaryModel.
 */

import { CreatorTopicSummary } from 'domain/topic/creator-topic-summary.model';

describe('Creator topic summary model', () => {
  let _sampleCreatorTopicSummary: CreatorTopicSummary;

  beforeEach(() => {
    let sampleCreatorTopicSummaryBackendDict = {
      id: 'sample_topic_id',
      name: 'Topic Name',
      subtopic_count: 5,
      canonical_story_count: 4,
      total_skill_count: 10,
      total_published_node_count: 3,
      uncategorized_skill_count: 3,
      language_code: 'en',
      description: 'description',
      version: 1,
      additional_story_count: 0,
      topic_model_created_on: 231241343,
      topic_model_last_updated: 3454354354,
      classroom: 'math',
      url_fragment: 'topic-name',
      thumbnail_filename: 'image.svg',
      thumbnail_bg_color: '#C6DCDA',
      is_published: false,
      can_edit_topic: false,
      total_upcoming_chapters_count: 1,
      total_overdue_chapters_count: 1,
      total_chapter_counts_for_each_story: [2],
      published_chapter_counts_for_each_story: [1]
    };
    _sampleCreatorTopicSummary = CreatorTopicSummary.createFromBackendDict(
      sampleCreatorTopicSummaryBackendDict);
  });

  it('should be able to get all the values', () => {
    expect(_sampleCreatorTopicSummary.getId()).toEqual('sample_topic_id');
    expect(_sampleCreatorTopicSummary.getName()).toEqual('Topic Name');
    expect(_sampleCreatorTopicSummary.getUrlFragment()).toEqual('topic-name');
    expect(_sampleCreatorTopicSummary.getSubtopicCount()).toEqual(5);
    expect(_sampleCreatorTopicSummary.getCanonicalStoryCount()).toEqual(4);
    expect(_sampleCreatorTopicSummary.getTotalSkillCount()).toEqual(10);
    expect(_sampleCreatorTopicSummary.getTotalPublishedNodeCount()).toEqual(3);
    expect(_sampleCreatorTopicSummary.getUncategorizedSkillCount()).toEqual(3);
    expect(_sampleCreatorTopicSummary.getLanguageCode()).toEqual('en');
    expect(_sampleCreatorTopicSummary.getDescription()).toEqual('description');
    expect(_sampleCreatorTopicSummary.getVersion()).toEqual(1);
    expect(_sampleCreatorTopicSummary.getAdditionalStoryCount()).toEqual(0);
    expect(_sampleCreatorTopicSummary.getTopicModelCreatedOn()).toEqual(
      231241343);
    expect(_sampleCreatorTopicSummary.getTopicModelLastUpdated()).toEqual(
      3454354354);
    expect(_sampleCreatorTopicSummary.getClassroom()).toEqual('math');
    expect(_sampleCreatorTopicSummary.getThumbnailFilename()).toEqual(
      'image.svg');
    expect(_sampleCreatorTopicSummary.getThumbnailBgColor()).toEqual('#C6DCDA');
    expect(_sampleCreatorTopicSummary.isTopicPublished()).toBeFalse();
    expect(_sampleCreatorTopicSummary.getTotalUpcomingChaptersCount()).toEqual(
      1);
    expect(_sampleCreatorTopicSummary.getTotalOverdueChaptersCount()).toEqual(
      1);
    expect(_sampleCreatorTopicSummary.getTotalChaptersCounts()).toEqual([2]);
    expect(_sampleCreatorTopicSummary.getPublishedChaptersCounts()).
      toEqual([1]);
  });
});
