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

export interface Query {
  id: string,
  status: string
}

@Injectable({
  providedIn: 'root'
})
export class EmailDashboardDataService {
  QUERY_DATA_URL: string = '/emaildashboarddatahandler';
  QUERY_STATUS_CHECK_URL: string = '/querystatuscheck';
  // No. of query results to display on a single page.
  QUERIES_PER_PAGE: number = 10;
  // Store latest cursor value for fetching next query page.
  latestCursor: string = null;
  // Array containing all fetched queries.
  queries: Array<Query> = [];
  // Index of currently-shown page of query results.
  currentPageIndex: number = -1;

  constructor(
    private http: HttpClient
  ) {}

  fetchQueriesPage(pageSize: number, cursor: string): Promise<Object> {
    let params: any = {
      num_queries_to_fetch: pageSize
    };
    if (cursor) {
      params.cursor = cursor;
    }
    return this.http.get(this.QUERY_DATA_URL, {
      params: params
    }).toPromise();
  }

  getQueries(): Array<Query> {
    return this.queries;
  }

  getCurrentPageIndex(): number {
    return this.currentPageIndex;
  }

  getLatestCursor(): string {
    return this.latestCursor;
  }

  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'data' is a dict with underscore_cased
  // keys which give tslint errors against underscore_casing in favor of
  // camelCasing.
  submitQuery(data: any): Promise<Array<Query>> {
    var startQueryIndex = this.currentPageIndex * this.QUERIES_PER_PAGE;
    var endQueryIndex = (this.currentPageIndex + 1) * this.QUERIES_PER_PAGE;

    return this.http.post(this.QUERY_DATA_URL, {
      data: data}).toPromise().then((data: any) => {
      var newQueries = [data.query];
      this.queries = newQueries.concat(this.queries);
      return this.queries.slice(startQueryIndex, endQueryIndex);
    });
  }

  getNextQueries(): Promise<Array<Query>> {
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
        .then((data: any) => {
          this.queries = this.queries.concat(data.recent_queries);
          this.latestCursor = data.cursor;
          return this.queries.slice(startQueryIndex, endQueryIndex);
        });
    }
  }

  getPreviousQueries(): Array<Query> {
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

  fetchQuery(queryId: string): Promise<Query> {
    return this.http.get(this.QUERY_STATUS_CHECK_URL, {
      params: {
        query_id: queryId
      }
    }).toPromise().then((data: any) => {
      this.queries.forEach(function(query, index, queries) {
        if (query.id === queryId) {
          queries[index] = data.query;
        }
      });
      return data.query;
    });
  }
}

angular.module('oppia').factory(
  'EmailDashboardDataService',
  downgradeInjectable(EmailDashboardDataService));
