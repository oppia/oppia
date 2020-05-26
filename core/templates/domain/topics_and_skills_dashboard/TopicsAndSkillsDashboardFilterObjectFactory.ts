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
 * @fileoverview Factory for creating filters of frontend topics
 * and skill dashboard
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { ETopicPublishedOptions, ETopicSortOptions } from
  // eslint-disable-next-line max-len
  'pages/topics-and-skills-dashboard-page/topics-and-skills-dashboard-page.constants';

export class TopicsAndSkillsDashboardFilter {
  category: string;
  keyword: string;
  sort: ETopicSortOptions;
  status: ETopicPublishedOptions;

  /**
   * @param {String} category - category to filter for.
   * @param {String} keyword - keyword to filter for.
   * @param {ETopicSortOptions} sort - Enum, allowed sort-by values.
   * @param {ETopicPublishedOptions} status - Enum. allowed status values.
   */
  constructor(category, keyword, sort, status) {
    this.category = category;
    this.keyword = keyword;
    this.sort = sort;
    this.status = status;
  }
  /**
   * Resets the filter object values
   */
  reset(): void {
    this.category = '';
    this.keyword = '';
    this.sort = null;
    this.status = null;
  }
}

@Injectable({
  providedIn: 'root'
})
export class TopicsAndSkillsDashboardFilterObjectFactory {
  /**
   * @returns {TopicsAndSkillsDashboardFilter} - A new
   * TopicsAndSkillsDashboardFilter instance
   */
  createDefault(): TopicsAndSkillsDashboardFilter {
    return new TopicsAndSkillsDashboardFilter('', '', null, null);
  }
}

angular.module('oppia').factory(
  'TopicsAndSkillsDashboardFilterObjectFactory',
  downgradeInjectable(TopicsAndSkillsDashboardFilterObjectFactory));
