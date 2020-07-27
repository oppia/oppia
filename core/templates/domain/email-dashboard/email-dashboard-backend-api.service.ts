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
  EmailDashboardQueryResultsBackendDict,
  EmailDashboardQueryResultsObjectFactory
} from 'domain/email-dashboard/email-dashboard-query-results-object.factory';
import {
  EmailDashboardQuery,
  EmailDashboardQueryBackendDict,
  EmailDashboardQueryObjectFactory
} from 'domain/email-dashboard/email-dashboard-query-object.factory';

export interface QueryData {
  hasNotLoggedInForNDays?: string;
  inactiveInLastNDays?: string;
  createdAtLeastNExps?: string;
  createdFewerThanNExps?: string;
  editedAtLeastNExps?: string;
  editedFewerThanNExps?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EmailDashboardBackendApiService {
  QUERY_DATA_URL: string = '/emaildashboarddatahandler';
  QUERY_STATUS_CHECK_URL: string = '/querystatuscheck';

  constructor(
    private http: HttpClient,
    private queryResultsObjectFactory:
    EmailDashboardQueryResultsObjectFactory,
    private queryObjectFactory: EmailDashboardQueryObjectFactory) {}

  fetchQueriesPage(
      pageSize: number, cursor: string): Promise<EmailDashboardQueryResults> {
    let params: {'cursor'?: string; 'num_queries_to_fetch'?: string;} = {
      num_queries_to_fetch: String(pageSize)
    };
    if (cursor) {
      params.cursor = cursor;
    }

    return new Promise((resolve, reject) => {
      this.http.get<EmailDashboardQueryResultsBackendDict>(
        this.QUERY_DATA_URL, {
          params: params
        }).toPromise().then(data => {
        let emailDashboardQueryResultsObject = (
          this.queryResultsObjectFactory.createFromBackendDict(data));
        resolve(emailDashboardQueryResultsObject);
      }, errorResponse => {
        reject(errorResponse.error.error);
      });
    });
  }

  fetchQuery(queryId: string): Promise<EmailDashboardQuery> {
    return new Promise((resolve, reject) => {
      this.http.get<EmailDashboardQueryBackendDict>(
        this.QUERY_STATUS_CHECK_URL, {
          params: {
            query_id: queryId
          }
        }).toPromise().then(data => {
        let queryObject = this.queryObjectFactory.createFromBackendDict(data);
        resolve(queryObject);
      }, errorResponse => {
        reject(errorResponse.error.error);
      });
    });
  }

  submitQuery(data: QueryData): Promise<EmailDashboardQuery> {
    const postData = {
      has_not_logged_in_for_n_days: data.hasNotLoggedInForNDays,
      inactive_in_last_n_days: data.inactiveInLastNDays,
      created_at_least_n_exps: data.createdAtLeastNExps,
      created_fewer_than_n_exps: data.createdFewerThanNExps,
      edited_at_least_n_exps: data.editedAtLeastNExps,
      edited_fewer_than_n_exps: data.editedFewerThanNExps
    };

    return new Promise((resolve, reject) => {
      this.http.post<EmailDashboardQueryBackendDict>(
        this.QUERY_DATA_URL, {
          data: postData}).toPromise().then(data => {
        let queryObject = this.queryObjectFactory.createFromBackendDict(data);
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
