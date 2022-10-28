// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to retrieve information of creator dashboard from the
 * backend.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import {
  CollectionSummary,
  CollectionSummaryBackendDict,
} from 'domain/collection/collection-summary.model';
import {
  CreatorDashboardStatsBackendDict,
  CreatorDashboardStats,
} from 'domain/creator_dashboard/creator-dashboard-stats.model';
import {
  CreatorExplorationSummary,
  CreatorExplorationSummaryBackendDict
} from 'domain/summary/creator-exploration-summary.model';
import {
  FeedbackThread,
  FeedbackThreadObjectFactory,
  FeedbackThreadBackendDict
} from 'domain/feedback_thread/FeedbackThreadObjectFactory';
import {
  SuggestionBackendDict,
  Suggestion,
} from 'domain/suggestion/suggestion.model';
import {
  ProfileSummary,
  SubscriberSummaryBackendDict,
} from 'domain/user/profile-summary.model';
import {
  SuggestionThread
} from 'domain/suggestion/suggestion-thread-object.model';
import {
  CreatorTopicSummary,
  CreatorTopicSummaryBackendDict
} from 'domain/topic/creator-topic-summary.model';
import { LoggerService } from 'services/contextual/logger.service';
import { SuggestionsService } from
  'services/suggestions.service';

interface CreatorDashboardDataBackendDict {
  'dashboard_stats': CreatorDashboardStatsBackendDict;
  'last_week_stats': CreatorDashboardStatsBackendDict;
  'display_preference': 'card' | 'list';
  'subscribers_list': SubscriberSummaryBackendDict[];
  'threads_for_created_suggestions_list': FeedbackThreadBackendDict[];
  'threads_for_suggestions_to_review_list': FeedbackThreadBackendDict[];
  'created_suggestions_list': SuggestionBackendDict[];
  'suggestions_to_review_list': SuggestionBackendDict[];
  'explorations_list': CreatorExplorationSummaryBackendDict[];
  'collections_list': CollectionSummaryBackendDict[];
  'topic_summary_dicts': CreatorTopicSummaryBackendDict[];
}

export interface CreatorDashboardData {
  dashboardStats: CreatorDashboardStats;
  // 'lastWeekStats' is null for a new creator.
  lastWeekStats: CreatorDashboardStats | null;
  displayPreference: 'card' | 'list';
  subscribersList: ProfileSummary[];
  threadsForCreatedSuggestionsList: FeedbackThread[];
  threadsForSuggestionsToReviewList: FeedbackThread[];
  createdSuggestionsList: Suggestion[];
  suggestionsToReviewList: Suggestion[];
  createdSuggestionThreadsList: SuggestionThread[];
  suggestionThreadsToReviewList: SuggestionThread[];
  explorationsList: CreatorExplorationSummary[];
  collectionsList: CollectionSummary[];
  topicSummaries: CreatorTopicSummary[];
}

@Injectable({
  providedIn: 'root'
})
export class CreatorDashboardBackendApiService {
  constructor(
    private http: HttpClient,
    private feedbackThreadObjectFactory: FeedbackThreadObjectFactory,
    private suggestionsService: SuggestionsService,
    private loggerService: LoggerService) {}

  _getSuggestionThreads(
      feedbackDicts: FeedbackThreadBackendDict[],
      suggestionDicts: SuggestionBackendDict[]): SuggestionThread[] {
    var numberOfSuggestions = feedbackDicts.length;
    var suggestionThreads: SuggestionThread[] = [];

    if (suggestionDicts.length !== numberOfSuggestions) {
      this.loggerService.error(
        'Number of suggestions does not match number of suggestion threads');
    }

    for (var i = 0; i < numberOfSuggestions; i++) {
      for (var j = 0; j < numberOfSuggestions; j++) {
        var suggestionThreadId = this.suggestionsService
          .getThreadIdFromSuggestionBackendDict(suggestionDicts[j]);
        var threadDict = feedbackDicts[i];
        if (threadDict.thread_id === suggestionThreadId) {
          var suggestionThread = (
            SuggestionThread.createFromBackendDicts(
              threadDict, suggestionDicts[j]));
          suggestionThreads.push(suggestionThread);
        }
      }
    }

    return suggestionThreads;
  }

  async _fetchDashboardDataAsync(): Promise<CreatorDashboardData> {
    return new Promise((resolve, reject) => {
      this.http.get<CreatorDashboardDataBackendDict>(
        '/creatordashboardhandler/data').toPromise().then(
        dashboardData => {
          resolve({
            dashboardStats: CreatorDashboardStats
              .createFromBackendDict(dashboardData.dashboard_stats),
            // Because lastWeekStats may be null.
            lastWeekStats: dashboardData.last_week_stats ? (
          CreatorDashboardStats
            .createFromBackendDict(dashboardData.last_week_stats)) : null,
            displayPreference: dashboardData.display_preference,
            subscribersList: dashboardData.subscribers_list.map(
              subscriber => ProfileSummary
                .createFromSubscriberBackendDict(subscriber)),
            threadsForCreatedSuggestionsList: (
              dashboardData.threads_for_created_suggestions_list.map(
                feedbackThread => this.feedbackThreadObjectFactory
                  .createFromBackendDict(feedbackThread))),
            threadsForSuggestionsToReviewList: (
              dashboardData.threads_for_suggestions_to_review_list.map(
                feedbackThread => this.feedbackThreadObjectFactory
                  .createFromBackendDict(feedbackThread))),
            createdSuggestionsList: (
              dashboardData.created_suggestions_list.map(
                suggestionDict => Suggestion.createFromBackendDict(
                  suggestionDict))),
            suggestionsToReviewList: (
              dashboardData.suggestions_to_review_list.map(
                suggestionDict => Suggestion.createFromBackendDict(
                  suggestionDict))),
            createdSuggestionThreadsList: this._getSuggestionThreads(
              dashboardData.threads_for_created_suggestions_list,
              dashboardData.created_suggestions_list),
            suggestionThreadsToReviewList: this._getSuggestionThreads(
              dashboardData.threads_for_suggestions_to_review_list,
              dashboardData.suggestions_to_review_list),
            explorationsList: dashboardData.explorations_list.map(
              expSummary => CreatorExplorationSummary
                .createFromBackendDict(expSummary)),
            collectionsList: dashboardData.collections_list.map(
              collectionSummary => CollectionSummary
                .createFromBackendDict(collectionSummary)),
            topicSummaries: (
          dashboardData.topic_summary_dicts ? (
            dashboardData.topic_summary_dicts.map(
              topicSummaryDict => CreatorTopicSummary.createFromBackendDict(
                topicSummaryDict))) : [])
          });
        }, errorResponse => {
          reject(errorResponse.error.error);
        });
    });
  }

  async fetchDashboardDataAsync(): Promise<CreatorDashboardData> {
    return this._fetchDashboardDataAsync();
  }

  async postExplorationViewAsync(newViewType: string): Promise<void> {
    return this.http.post<void>('/creatordashboardhandler/data', {
      display_preference: newViewType
    }).toPromise();
  }
}

angular.module('oppia').factory(
  'CreatorDashboardBackendApiService',
  downgradeInjectable(CreatorDashboardBackendApiService));
