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
 * @fileoverview Model class for creating filters of frontend topics
 * and skill dashboard.
 */

import {
  ETopicPublishedOptions,
  ETopicStatusOptions,
  ETopicSortOptions,
  ETopicNewSortingOptions,
  TopicsAndSkillsDashboardPageConstants,
  // eslint-disable-next-line max-len
} from 'pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page.constants';

export class TopicsAndSkillsDashboardFilter {
  classroom: string;
  keywords: string[];
  sort: ETopicSortOptions | ETopicNewSortingOptions;
  status: ETopicPublishedOptions | ETopicStatusOptions;

  /**
   * @param {String} classroom - classroom to filter for.
   * @param {String[]} keywords - keywords to filter for.
   * @param {ETopicSortOptions} sort - One of the values in ETopicSortOptions.
   * @param {ETopicPublishedOptions | ETopicStatusOptions} status - One of the
   *   calues in ETopicPublishedOptions or ETopicStatusOptions.
   */
  constructor(
    classroom: string,
    keywords: string[],
    sort: ETopicSortOptions | ETopicNewSortingOptions,
    status: ETopicPublishedOptions | ETopicStatusOptions
  ) {
    this.classroom = classroom;
    this.keywords = keywords;
    this.sort = sort;
    this.status = status;
  }

  /**
   * Resets the filter object values
   */
  reset(): void {
    this.classroom =
      TopicsAndSkillsDashboardPageConstants.TOPIC_FILTER_CLASSROOM_ALL;
    this.keywords = [];
    this.sort = ETopicSortOptions.IncreasingUpdatedOn;
    this.status = ETopicPublishedOptions.All;
  }

  /**
   * @returns {TopicsAndSkillsDashboardFilter} - A new
   *   TopicsAndSkillsDashboardFilter instance.
   */
  static createDefault(): TopicsAndSkillsDashboardFilter {
    return new TopicsAndSkillsDashboardFilter(
      TopicsAndSkillsDashboardPageConstants.TOPIC_FILTER_CLASSROOM_ALL,
      [],
      ETopicSortOptions.IncreasingUpdatedOn,
      ETopicPublishedOptions.All
    );
  }
}
