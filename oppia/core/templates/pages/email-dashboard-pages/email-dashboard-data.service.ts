// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Services for oppia email dashboard page.
 */

import {Injectable} from '@angular/core';

import {
  QueryData,
  EmailDashboardBackendApiService,
} from 'domain/email-dashboard/email-dashboard-backend-api.service';
import {EmailDashboardQuery} from 'domain/email-dashboard/email-dashboard-query.model';

@Injectable({
  providedIn: 'root',
})
export class EmailDashboardDataService {
  // No. of query results to display on a single page.
  QUERIES_PER_PAGE: number = 10;
  // Store latest cursor value for fetching next query page.
  // 'latestCursor' will be 'null' when there are no more query results
  // or when the returned result starts from the beginning of the full
  // list of results.
  latestCursor: string | null = null;
  // Array containing all fetched queries.
  queries: EmailDashboardQuery[] = [];
  // Index of currently-shown page of query results.
  currentPageIndex: number = -1;

  constructor(
    private emailDashboardBackendApiService: EmailDashboardBackendApiService
  ) {}

  getQueries(): EmailDashboardQuery[] {
    return this.queries;
  }

  getCurrentPageIndex(): number {
    return this.currentPageIndex;
  }

  getLatestCursor(): string | null {
    return this.latestCursor;
  }

  async submitQueryAsync(data: QueryData): Promise<EmailDashboardQuery[]> {
    var startQueryIndex = this.currentPageIndex * this.QUERIES_PER_PAGE;
    var endQueryIndex = (this.currentPageIndex + 1) * this.QUERIES_PER_PAGE;

    return this.emailDashboardBackendApiService
      .submitQueryAsync(data)
      .then(query => {
        var newQueries = [query];
        this.queries = newQueries.concat(this.queries);
        return this.queries.slice(startQueryIndex, endQueryIndex);
      });
  }

  async getNextQueriesAsync(): Promise<EmailDashboardQuery[]> {
    var startQueryIndex = (this.currentPageIndex + 1) * this.QUERIES_PER_PAGE;
    var endQueryIndex = (this.currentPageIndex + 2) * this.QUERIES_PER_PAGE;

    if (
      this.queries.length >= endQueryIndex ||
      (this.latestCursor === null && this.currentPageIndex !== -1)
    ) {
      this.currentPageIndex = this.currentPageIndex + 1;
      return new Promise(resolver => {
        resolver(this.queries.slice(startQueryIndex, endQueryIndex));
      });
    } else {
      this.currentPageIndex = this.currentPageIndex + 1;
      return this.emailDashboardBackendApiService
        .fetchQueriesPageAsync(this.QUERIES_PER_PAGE, this.latestCursor)
        .then(data => {
          this.queries = this.queries.concat(data.recentQueries);
          this.latestCursor = data.cursor;
          return this.queries.slice(startQueryIndex, endQueryIndex);
        });
    }
  }

  getPreviousQueries(): EmailDashboardQuery[] {
    var startQueryIndex = (this.currentPageIndex - 1) * this.QUERIES_PER_PAGE;
    var endQueryIndex = this.currentPageIndex * this.QUERIES_PER_PAGE;
    this.currentPageIndex = this.currentPageIndex - 1;
    return this.queries.slice(startQueryIndex, endQueryIndex);
  }

  isNextPageAvailable(): boolean {
    var nextQueryIndex = (this.currentPageIndex + 1) * this.QUERIES_PER_PAGE;
    return this.queries.length > nextQueryIndex || Boolean(this.latestCursor);
  }

  isPreviousPageAvailable(): boolean {
    return this.currentPageIndex > 0;
  }

  async fetchQueryAsync(queryId: string): Promise<EmailDashboardQuery> {
    return this.emailDashboardBackendApiService
      .fetchQueryAsync(queryId)
      .then(newQuery => {
        this.queries.forEach(function (query, index, queries) {
          if (query.id === queryId) {
            queries[index] = newQuery;
          }
        });
        return newQuery;
      });
  }
}
