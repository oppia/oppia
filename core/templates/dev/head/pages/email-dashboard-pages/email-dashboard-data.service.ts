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

import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EmailDashboardDataService {
  latestCursor: any;
  queries: any[];
  currentPageIndex: number;

  constructor(private http: HttpClient) {
    // Store latest cursor value for fetching next query page.
    this.latestCursor = null;
    // Array containing all fetched queries.
    this.queries = [];
    // Index of currently-shown page of query results.
    this.currentPageIndex = -1;
  }

  private readonly QUERY_DATA_URL = '/emaildashboarddatahandler';
  private readonly QUERY_STATUS_CHECK_URL = '/querystatuscheck';
  // No. of query results to display on a single page.
  private readonly QUERIES_PER_PAGE = 10;

  fetchQueriesPage(pageSize, cursor): Promise<Object> {
    return this.http.get(this.QUERY_DATA_URL, {
      params: {
        num_queries_to_fetch: pageSize,
        cursor: cursor
      }
    }).toPromise().then((response) => {
      return response;
    });
  }

  getQueries(): any[] {
    return this.queries;
  }

  getCurrentPageIndex(): number {
    return this.currentPageIndex;
  }

  getLatestCursor(): any {
    return this.latestCursor;
  }

  submitQuery(data): Promise<any[]> {
    var startQueryIndex = this.currentPageIndex * this.QUERIES_PER_PAGE;
    var endQueryIndex = (this.currentPageIndex + 1) * this.QUERIES_PER_PAGE;

    return this.http.post(this.QUERY_DATA_URL, {
      data: data
    }).toPromise().then((response) => {
      var data = response;
      /* eslint-disable dot-notation */
      var newQueries = [data['query']];
      /* eslint-enable dot-notation */
      this.queries = newQueries.concat(this.queries);
      return this.queries.slice(startQueryIndex, endQueryIndex);
    });
  }

  getNextQueries(): Promise<any> {
    var startQueryIndex = (this.currentPageIndex + 1) * this.QUERIES_PER_PAGE;
    var endQueryIndex = (this.currentPageIndex + 2) * this.QUERIES_PER_PAGE;

    if (this.queries.length >= endQueryIndex ||
        (this.latestCursor === null && this.currentPageIndex !== -1)) {
      this.currentPageIndex = this.currentPageIndex + 1;
      return new Promise((resolver) => {
        resolver(this.queries.slice(startQueryIndex, endQueryIndex));
      });
    } else {
      this.currentPageIndex = this.currentPageIndex + 1;
      return this.fetchQueriesPage(this.QUERIES_PER_PAGE, this.latestCursor)
        .then((data) => {
          /* eslint-disable dot-notation */
          this.queries = this.queries.concat(data['recent_queries']);
          this.latestCursor = data['cursor'];
          /* eslint-enable dot-notation */
          return this.queries.slice(startQueryIndex, endQueryIndex);
        });
    }
  }

  getPreviousQueries(): any[] {
    var startQueryIndex = (this.currentPageIndex - 1) * this.QUERIES_PER_PAGE;
    var endQueryIndex = this.currentPageIndex * this.QUERIES_PER_PAGE;
    this.currentPageIndex = this.currentPageIndex - 1;
    return this.queries.slice(startQueryIndex, endQueryIndex);
  }

  isNextPageAvailable(): boolean {
    var nextQueryIndex = (this.currentPageIndex + 1) * this.QUERIES_PER_PAGE;
    return (this.queries.length > nextQueryIndex) || Boolean(this.latestCursor);
  }

  isPreviousPageAvailable(): boolean {
    return (this.currentPageIndex > 0);
  }

  fetchQuery(queryId: string): Promise<any> {
    return this.http.get(this.QUERY_STATUS_CHECK_URL, {
      params: {
        query_id: queryId
      }
    }).toPromise().then((response) => {
      var data = response;
      this.queries.forEach((query, index) => {
        if (query.id === queryId) {
          /* eslint-disable dot-notation */
          this.queries[index] = data['query'];
          /* eslint-enable dot-notation */
        }
      });
      /* eslint-disable dot-notation */
      return data['query'];
      /* eslint-enable dot-notation */
    });
  }
}

var oppia = require('AppInit.ts').module;

oppia.factory(
  'EmailDashboardDataService', downgradeInjectable(EmailDashboardDataService));
