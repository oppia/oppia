// Copyright 2023 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Model class for creating filters of frontend contributor
 * admin Dashboard.
 */

import {ContributorDashboardAdminPageConstants as PageConstants} from './contributor-dashboard-admin-page.constants';

export class ContributorAdminDashboardFilter {
  topicIds: string[];
  languageCode?: string;
  sort?: string | null;
  maxDaysSinceLastActivity?: number;

  /**
   * @param {String} languageCode - Language Code to filter for.
   * @param {String[]} topicIds - keywords to filter for.
   * @param {string} sort - sort options.
   * @param {number} maxDaysSinceLastActivity - The number of days before today from which to start considering
    users' contributions, to filter users.
   */
  constructor(
    topicIds: string[],
    languageCode?: string,
    sort?: string | null,
    maxDaysSinceLastActivity?: number
  ) {
    this.languageCode = languageCode;
    this.topicIds = topicIds;
    this.sort = sort;
    this.maxDaysSinceLastActivity = maxDaysSinceLastActivity;
  }

  /**
   * @returns {ContributorAdminDashboardFilter} - A new
   *   ContributorAdminDashboardFilter instance.
   */
  static createDefault(): ContributorAdminDashboardFilter {
    return new ContributorAdminDashboardFilter(
      [],
      PageConstants.DEFAULT_LANGUAGE_FILTER
    );
  }
}
