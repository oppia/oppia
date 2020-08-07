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
 * @fileoverview Tests for TopicSummaryObjectFactory.
 */

import { TopicSummary, TopicSummaryObjectFactory } from
  'domain/topic/TopicSummaryObjectFactory';

describe('Topic summary object factory', () => {
  let topicSummaryObjectFactory: TopicSummaryObjectFactory = null;
  let _sampleTopicSummary: TopicSummary = null;

  beforeEach(() => {
    topicSummaryObjectFactory = new TopicSummaryObjectFactory();

    let sampleTopicSummaryBackendDict = {
      id: 'sample_topic_id',
      name: 'Topic Name',
      subtopic_count: 5,
      canonical_story_count: 4,
      total_skill_count: 10,
      uncategorized_skill_count: 3,
      language_code: 'en',
      description: 'description',
      version: 1,
      additional_story_count: 0,
      topic_model_created_on: 231241343,
      topic_model_last_updated: 3454354354,
      thumbnail_filename: 'image.svg',
      thumbnail_bg_color: '#C6DCDA'
    };
    _sampleTopicSummary = topicSummaryObjectFactory.createFromBackendDict(
      sampleTopicSummaryBackendDict);
  });

  it('should be able to get all the values', () => {
    expect(_sampleTopicSummary.getId()).toEqual('sample_topic_id');
    expect(_sampleTopicSummary.getName()).toEqual('Topic Name');
    expect(_sampleTopicSummary.getSubtopicCount()).toEqual(5);
    expect(_sampleTopicSummary.getCanonicalStoryCount()).toEqual(4);
    expect(_sampleTopicSummary.getTotalSkillCount()).toEqual(10);
    expect(_sampleTopicSummary.getUncategorizedSkillCount()).toEqual(3);
    expect(_sampleTopicSummary.getLanguageCode()).toEqual('en');
    expect(_sampleTopicSummary.getDescription()).toEqual('description');
    expect(_sampleTopicSummary.getVersion()).toEqual(1);
    expect(_sampleTopicSummary.getAdditionalStoryCount()).toEqual(0);
    expect(_sampleTopicSummary.getTopicModelCreatedOn()).toEqual(231241343);
    expect(_sampleTopicSummary.getTopicModelLastUpdated()).toEqual(3454354354);
    expect(_sampleTopicSummary.getThumbnailFilename()).toEqual('image.svg');
    expect(_sampleTopicSummary.getThumbnailBgColor()).toEqual('#C6DCDA');
  });
});
