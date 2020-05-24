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
 * @fileoverview Factory for creating filters of frontend topics
 * and skill dashboard
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

export class DashboardFilter {
    category: string;
    keywords: string;
    sort: string;
    status: string;
    /**
     * @param {String} category - category to filter
     * @param {String} keywords - keywords to filter
     * @param {String} sort - sort by filter value
     * @param {String} status - status to filter
     */
    constructor(category, keywords, sort, status) {
      this.category = category;
      this.keywords = keywords;
      this.sort = sort;
      this.status = status;
    }
    /**
     * Resets the filter object values
     */
    reset(): void {
      this.category = '';
      this.keywords = '';
      this.sort = '';
      this.status = '';
    }
}

@Injectable({
  providedIn: 'root'
})
export class DashboardFilterObjectFactory {
  /**
     * @returns {DashboardFilter} - A new DashboardFilter instance
     */
  createDefault(): DashboardFilter {
    return new DashboardFilter(
      '', '', '', '');
  }
}

angular.module('oppia').factory(
  'DashboardFilterObjectFactory',
  downgradeInjectable(DashboardFilterObjectFactory));
