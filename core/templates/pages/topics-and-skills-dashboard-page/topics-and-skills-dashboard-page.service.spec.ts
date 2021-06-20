// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for TopicsAndSkillsDashboardPageService.
 */

import { ETopicPublishedOptions, ETopicSortOptions } from
// eslint-disable-next-line max-len
  'pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page.constants';
import { TopicsAndSkillsDashboardFilter } from
  // eslint-disable-next-line max-len
  'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-filter.model';
import { TopicsAndSkillsDashboardPageService } from
  // eslint-disable-next-line max-len
  'pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page.service';
import { CreatorTopicSummary } from
  'domain/topic/creator-topic-summary.model';

describe('Topic and Skill dashboard page service', () => {
  let tsds: TopicsAndSkillsDashboardPageService = null;

  beforeEach(() => {
    tsds = new TopicsAndSkillsDashboardPageService();
  });

  it('should filter the topics', () => {
    const topic1 = CreatorTopicSummary.createFromBackendDict({
      topic_model_created_on: 1581839432987.596,
      uncategorized_skill_count: 0,
      canonical_story_count: 0,
      id: 'wbL5aAyTWfOH1',
      is_published: true,
      total_skill_count: 10,
      total_published_node_count: 3,
      can_edit_topic: true,
      topic_model_last_updated: 1581839492500.852,
      additional_story_count: 0,
      name: 'Alpha',
      classroom: 'Math',
      version: 1,
      description: 'Alpha description',
      subtopic_count: 0,
      language_code: 'en',
      url_fragment: 'alpha',
      thumbnail_filename: 'image.svg',
      thumbnail_bg_color: '#C6DCDA'
    });
    const topic2 = CreatorTopicSummary.createFromBackendDict({
      topic_model_created_on: 1681839432987.596,
      uncategorized_skill_count: 0,
      canonical_story_count: 0,
      id: 'wbL5aAyTWfOH1',
      is_published: false,
      total_skill_count: 10,
      total_published_node_count: 3,
      can_edit_topic: true,
      topic_model_last_updated: 1681839492500.852,
      additional_story_count: 0,
      name: 'Beta',
      classroom: 'Math',
      version: 1,
      description: 'Beta description',
      subtopic_count: 0,
      language_code: 'en',
      url_fragment: 'beta',
      thumbnail_filename: 'image.svg',
      thumbnail_bg_color: '#C6DCDA'
    });
    const topic3 = CreatorTopicSummary.createFromBackendDict({
      topic_model_created_on: 1781839432987.596,
      uncategorized_skill_count: 0,
      canonical_story_count: 0,
      id: 'wbL5aAyTWfOH1',
      is_published: true,
      total_skill_count: 10,
      total_published_node_count: 3,
      can_edit_topic: true,
      topic_model_last_updated: 1781839492500.852,
      additional_story_count: 0,
      name: 'Gamma',
      classroom: 'English',
      version: 1,
      description: 'Gamma description',
      subtopic_count: 0,
      language_code: 'en',
      url_fragment: 'gamma',
      thumbnail_filename: 'image.svg',
      thumbnail_bg_color: '#C6DCDA'
    });
    let topicsArray = [topic1, topic2, topic3];
    let filterOptions = TopicsAndSkillsDashboardFilter.createDefault();
    let filteredArray = tsds.getFilteredTopics(topicsArray, filterOptions);
    expect(filteredArray).toEqual(topicsArray);

    filterOptions.keywords = ['alp'];
    filteredArray = tsds.getFilteredTopics(topicsArray, filterOptions);
    expect(filteredArray).toEqual([topic1]);

    filterOptions.keywords = [];
    filterOptions.status = ETopicPublishedOptions.Published;
    filteredArray = tsds.getFilteredTopics(topicsArray, filterOptions);
    expect(filteredArray).toEqual([topic3, topic1]);

    filterOptions.status = ETopicPublishedOptions.NotPublished;
    filteredArray = tsds.getFilteredTopics(topicsArray, filterOptions);
    expect(filteredArray).toEqual([topic2]);

    filterOptions.status = ETopicPublishedOptions.All;
    filterOptions.sort = ETopicSortOptions.IncreasingUpdatedOn;
    filteredArray = tsds.getFilteredTopics(topicsArray, filterOptions);
    expect(filteredArray).toEqual([topic3, topic2, topic1]);

    filterOptions.sort = ETopicSortOptions.DecreasingUpdatedOn;
    filteredArray = tsds.getFilteredTopics(topicsArray, filterOptions);
    expect(filteredArray).toEqual([topic1, topic2, topic3]);

    filterOptions.sort = ETopicSortOptions.IncreasingCreatedOn;
    filteredArray = tsds.getFilteredTopics(topicsArray, filterOptions);
    expect(filteredArray).toEqual([topic3, topic2, topic1]);

    filterOptions.sort = ETopicSortOptions.DecreasingCreatedOn;
    filteredArray = tsds.getFilteredTopics(topicsArray, filterOptions);
    expect(filteredArray).toEqual([topic1, topic2, topic3]);

    filterOptions.sort = ETopicSortOptions.IncreasingCreatedOn;
    filterOptions.classroom = 'Math';
    filteredArray = tsds.getFilteredTopics(topicsArray, filterOptions);
    expect(filteredArray).toEqual([topic2, topic1]);

    filterOptions.classroom = 'Unassigned';
    filteredArray = tsds.getFilteredTopics(topicsArray, filterOptions);
    expect(filteredArray).toEqual([]);

    topic3.classroom = null;
    filteredArray = tsds.getFilteredTopics(topicsArray, filterOptions);
    expect(filteredArray).toEqual([topic3]);

    // This throws "Type '"Invalid sort value"' is not assignable to
    // type 'ETopicSortOptions'.". We need to suppress this error because
    // 'Invalid sort value' is not a valid sort option. We set the sort filter
    // option to 'Invalid sort value' to test validations.
    // @ts-expect-error
    filterOptions.sort = 'Invalid sort value';
    expect(() => {
      tsds.getFilteredTopics(topicsArray, filterOptions);
    }).toThrowError('Invalid filter by sort value provided.');
  });
});
