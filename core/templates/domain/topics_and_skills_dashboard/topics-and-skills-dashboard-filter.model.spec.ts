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
 * @fileoverview Unit tests for TopicsAndSkillsDashboardFilter model.
 */

import {
  ETopicPublishedOptions,
  ETopicSortOptions,
} from 'pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page.constants';

import {TopicsAndSkillsDashboardFilter} from 'domain/topics_and_skills_dashboard/topics-and-skills-dashboard-filter.model';

describe('Topics And Skills Dashboard Filter Model', () => {
  let filter: TopicsAndSkillsDashboardFilter;

  beforeEach(() => {
    filter = TopicsAndSkillsDashboardFilter.createDefault();
  });

  it('should create a new dashboard filter object', () => {
    expect(filter.classroom).toEqual('All');
    expect(filter.sort).toEqual(ETopicSortOptions.IncreasingUpdatedOn);
    expect(filter.status).toEqual(ETopicPublishedOptions.All);
    expect(filter.keywords).toEqual([]);
  });

  it('should reset values of the filter', () => {
    expect(filter.classroom).toEqual('All');
    expect(filter.sort).toEqual(ETopicSortOptions.IncreasingUpdatedOn);
    expect(filter.status).toEqual(ETopicPublishedOptions.All);
    expect(filter.keywords).toEqual([]);

    const classroom = 'Math';
    const sort = 'Most Recently Updated';
    const status = 'Published';
    const keywords = ['Key1'];

    filter.classroom = classroom;
    filter.sort = ETopicSortOptions.IncreasingUpdatedOn;
    filter.status = ETopicPublishedOptions.Published;
    filter.keywords = keywords;

    expect(filter.classroom).toEqual(classroom);
    expect(filter.sort).toEqual(sort);
    expect(filter.status).toEqual(status);
    expect(filter.keywords).toEqual(keywords);

    filter.reset();
    expect(filter.classroom).toEqual('All');
    expect(filter.sort).toEqual(ETopicSortOptions.IncreasingUpdatedOn);
    expect(filter.status).toEqual(ETopicPublishedOptions.All);
    expect(filter.keywords).toEqual([]);
  });
});
