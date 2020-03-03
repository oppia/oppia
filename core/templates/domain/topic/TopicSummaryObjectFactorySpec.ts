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

import { TopicSummaryObjectFactory } from
  'domain/topic/TopicSummaryObjectFactory';

describe('Topic summary object factory', () => {
  let topicSummaryObjectFactory: TopicSummaryObjectFactory = null;
  let _sampleTopicSummary = null;

  beforeEach(() => {
    topicSummaryObjectFactory = new TopicSummaryObjectFactory();

    let sampleTopicSummaryBackendDict = {
      id: 'sample_topic_id',
      name: 'Topic Name',
      subtopicCount: 5,
      canonicalStoryCount: 4,
      totalSkillCount: 10,
      uncategorizedSkillCount: 3,
      additionalStoryCount: 1,
      topicModelCreatedOn: 100001515,
      topicModelLastUpdated: 5454542545,
      version: 1,
      languageCode: 'en'
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
  });
});
