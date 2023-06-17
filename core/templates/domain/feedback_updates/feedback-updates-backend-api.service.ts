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
 * @fileoverview Service to retrieve information of feedback updates from the
 * backend.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  FeedbackThreadSummary,
  FeedbackThreadSummaryBackendDict
} from 'domain/feedback_thread/feedback-thread-summary.model';
import { FeedbackMessageSummaryBackendDict } from 'domain/feedback_message/feedback-message-summary.model';


interface FeedbackUpdatesDataBackendDict {
  'number_of_unread_threads': number;
  'thread_summaries': FeedbackThreadSummaryBackendDict[];
  'paginated_threads_list': FeedbackThreadSummaryBackendDict[][];
}

interface FeedbackUpdatesData {
  numberOfUnreadThreads: number;
  threadSummaries: FeedbackThreadSummary[];
  paginatedThreadsList: FeedbackThreadSummaryBackendDict[][];
}

export interface AddMessagePayload {
  'updated_status': boolean;
  // Subject for frontend instances of thread message domain objects
  // are null and are only required to be supplied if the message is first
  // message of the thread. Otherwise, these properties are only non-null
  // when the subject changes.
  'updated_subject': string | null;
  'text': string;
}


interface MessageSummaryList {
  'message_summary_list': FeedbackMessageSummaryBackendDict[];
}

@Injectable({
  providedIn: 'root'
})
export class FeedbackUpdatesBackendApiService {
  constructor(
    private http: HttpClient) {}

  async _fetchFeedbackUpdatesDataAsync(
      paginatedThreadsList: FeedbackThreadSummaryBackendDict[][]
  ):
  Promise<FeedbackUpdatesData> {
    return new Promise((resolve, reject) => {
      this.http.post<FeedbackUpdatesDataBackendDict>(
        '/feedbackupdateshandler/data',
        {
          paginated_threads_list: paginatedThreadsList
        }).toPromise().then(
        dashboardData => {
          resolve({
            numberOfUnreadThreads: dashboardData.number_of_unread_threads,
            threadSummaries: (
              dashboardData.thread_summaries.map(
                threadSummary => FeedbackThreadSummary
                  .createFromBackendDict(threadSummary))),
            paginatedThreadsList: dashboardData.paginated_threads_list
          });
        }, errorResponse => {
          reject(errorResponse.status);
        });
    });
  }

  async fetchFeedbackUpdatesDataAsync(
      paginatedThreadsList: FeedbackThreadSummaryBackendDict[][] = []
  ):
  Promise<FeedbackUpdatesData> {
    return this._fetchFeedbackUpdatesDataAsync(
      paginatedThreadsList);
  }

  async addNewMessageAsync(
      url: string, payload: AddMessagePayload): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.post<void>(url, payload).toPromise()
        .then(response => {
          resolve(response);
        }, errorResonse => {
          reject(errorResonse.error.error);
        });
    });
  }

  async onClickThreadAsync(
      threadDataUrl: string): Promise<FeedbackMessageSummaryBackendDict[]> {
    return new Promise((resolve, reject) => {
      this.http.get<MessageSummaryList>(
        threadDataUrl).toPromise().then(response => {
        resolve(response.message_summary_list);
      }, errorResponse => {
        reject(errorResponse.error.error);
      });
    });
  }
}

angular.module('oppia').factory(
  'FeedbackUpdatesBackendApiService',
  downgradeInjectable(FeedbackUpdatesBackendApiService));
