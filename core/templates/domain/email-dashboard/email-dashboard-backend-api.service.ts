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
 * @fileoverview Backend api service for email dashboard pages.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import {
  EmailDashboardQueryResults,
  EmailDashboardQueryResultsBackendDict
} from 'domain/email-dashboard/email-dashboard-query-results.model';
import {
  EmailDashboardQuery,
  EmailDashboardQueryBackendDict,
} from 'domain/email-dashboard/email-dashboard-query.model';

export type QueryData = Record<string, boolean | number | null>;

@Injectable({
  providedIn: 'root'
})
export class EmailDashboardBackendApiService {
  QUERY_DATA_URL: string = '/emaildashboarddatahandler';
  QUERY_STATUS_CHECK_URL: string = '/querystatuscheck';

  constructor(
    private http: HttpClient) {}

  async fetchQueriesPageAsync(
      pageSize: number, cursor: string | null
  ): Promise<EmailDashboardQueryResults> {
    // Here 'cursor' property is optional because it is present only if this
    // function is called with a non-null value to 'cursor' arg.
    // If we send a null value of 'cursor' the request URL would have
    // something like '?cursor=null' and the backend would start looking for
    // cursor with value 'null' which is not correct.
    let params: { 'cursor'?: string; 'num_queries_to_fetch': string } = {
      num_queries_to_fetch: String(pageSize)
    };
    if (cursor) {
      params.cursor = cursor;
    }

    return new Promise((resolve, reject) => {
      this.http.get<EmailDashboardQueryResultsBackendDict>(
        this.QUERY_DATA_URL, {
          params: params
        } as Object).toPromise().then(data => {
        let emailDashboardQueryResultsObject = (
          EmailDashboardQueryResults.createFromBackendDict(data));
        resolve(emailDashboardQueryResultsObject);
      }, errorResponse => {
        reject(errorResponse.error.error);
      });
    });
  }

  async fetchQueryAsync(queryId: string): Promise<EmailDashboardQuery> {
    return new Promise((resolve, reject) => {
      this.http.get<EmailDashboardQueryBackendDict>(
        this.QUERY_STATUS_CHECK_URL, {
          params: {
            query_id: queryId
          }
        }).toPromise().then(data => {
        let queryObject = EmailDashboardQuery.createFromBackendDict(data);
        resolve(queryObject);
      }, errorResponse => {
        reject(errorResponse.error.error);
      });
    });
  }

  async submitQueryAsync(data: QueryData): Promise<EmailDashboardQuery> {
    return new Promise((resolve, reject) => {
      this.http.post<EmailDashboardQueryBackendDict>(
        this.QUERY_DATA_URL, {
          data: data}).toPromise().then(data => {
        let queryObject = EmailDashboardQuery.createFromBackendDict(data);
        resolve(queryObject);
      }, errorResponse => {
        reject(errorResponse.error.error);
      });
    });
  }
}

angular.module('oppia').factory(
  'EmailDashboardBackendApiService',
  downgradeInjectable(EmailDashboardBackendApiService));
