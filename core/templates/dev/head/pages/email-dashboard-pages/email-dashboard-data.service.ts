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
  constructor(private httpClient: HttpClient) {}
    QUERY_DATA_URL = '/emaildashboarddatahandler';
    QUERY_STATUS_CHECK_URL = '/querystatuscheck';
    // No. of query results to display on a single page.
    QUERIES_PER_PAGE = 10;
    // Store latest cursor value for fetching next query page.
    latestCursor = null;
    // Array containing all fetched queries.
    queries = [];
    // Index of currently-shown page of query results.
    currentPageIndex = -1;

    fetchQueriesPage(pageSize, cursor) {
      return this.httpClient.get(this.QUERY_DATA_URL, {
        params: {
          num_queries_to_fetch: pageSize,
          cursor: cursor
        }
      }).toPromise().then(function(response: any) {
        return response.data;
      });
    }


    getQueries() {
      return this.queries;
    }

    getCurrentPageIndex() {
      return this.currentPageIndex;
    }

    getLatestCursor() {
      return this.latestCursor;
    }

    submitQuery(data) {
      let startQueryIndex = this.currentPageIndex * this.QUERIES_PER_PAGE;
      let endQueryIndex = (this.currentPageIndex + 1) * this.QUERIES_PER_PAGE;

      return this.httpClient.post(this.QUERY_DATA_URL, {
        data: data
      }).toPromise().then((response: any) => {
        let data = response.data;
        let newQueries = [data.query];
        this.queries = newQueries.concat(this.queries);
        return this.queries.slice(startQueryIndex, endQueryIndex);
      });
    }

    getNextQueries() {
      let startQueryIndex = (this.currentPageIndex + 1) * this.QUERIES_PER_PAGE;
      let endQueryIndex = (this.currentPageIndex + 2) * this.QUERIES_PER_PAGE;

      if (this.queries.length >= endQueryIndex ||
            (this.latestCursor === null && this.currentPageIndex !== -1)) {
        this.currentPageIndex = this.currentPageIndex + 1;
        return Promise.resolve((resolver) => {
          resolver(this.queries.slice(startQueryIndex, endQueryIndex));
        });
      } else {
        this.currentPageIndex = this.currentPageIndex + 1;
        return this.fetchQueriesPage(this.QUERIES_PER_PAGE, this.latestCursor)
          .then((data) => {
            this.queries = this.queries.concat(data.recent_queries);
            this.latestCursor = data.cursor;
            return this.queries.slice(startQueryIndex, endQueryIndex);
          });
      }
    }

    getPreviousQueries() {
      let startQueryIndex = (this.currentPageIndex - 1) * this.QUERIES_PER_PAGE;
      let endQueryIndex = this.currentPageIndex * this.QUERIES_PER_PAGE;
      this.currentPageIndex = this.currentPageIndex - 1;
      return this.queries.slice(startQueryIndex, endQueryIndex);
    }

    isNextPageAvailable() {
      let nextQueryIndex = (this.currentPageIndex + 1) * this.QUERIES_PER_PAGE;
      return (this.queries.length > nextQueryIndex) || Boolean(
        this.latestCursor);
    }

    isPreviousPageAvailable() {
      return (this.currentPageIndex > 0);
    }

    fetchQuery(queryId) {
      return this.httpClient.get(this.QUERY_STATUS_CHECK_URL, {
        params: {
          query_id: queryId
        }
      }).toPromise().then((response: any) => {
        let data = response.data;
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
