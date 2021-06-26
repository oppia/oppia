// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to retrieve information of learner dashboard from the
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
  StorySummary,
  StorySummaryBackendDict
} from 'domain/story/story-summary.model';
import {
  LearnerTopicSummary,
  LearnerTopicSummaryBackendDict
} from 'domain/topic/learner-topic-summary.model';
import {
  FeedbackThreadSummary,
  FeedbackThreadSummaryBackendDict
} from 'domain/feedback_thread/feedback-thread-summary.model';
import {
  LearnerExplorationSummary,
  LearnerExplorationSummaryBackendDict,
} from 'domain/summary/learner-exploration-summary.model';
import {
  NonExistentActivities,
  NonExistentActivitiesBackendDict,
} from 'domain/learner_dashboard/non-existent-activities.model';
import {
  CreatorSummaryBackendDict,
  ProfileSummary,
} from 'domain/user/profile-summary.model';
import { FeedbackMessageSummaryBackendDict } from 'domain/feedback_message/feedback-message-summary.model';

interface LearnerDashboardDataBackendDict {
  'completed_explorations_list': LearnerExplorationSummaryBackendDict[];
  'incomplete_explorations_list': LearnerExplorationSummaryBackendDict[];
  'exploration_playlist': LearnerExplorationSummaryBackendDict[];
  'completed_collections_list': CollectionSummaryBackendDict[];
  'incomplete_collections_list': CollectionSummaryBackendDict[];
  'collection_playlist': CollectionSummaryBackendDict[];
  'completed_stories_list': StorySummaryBackendDict[];
  'learnt_topics_list': LearnerTopicSummaryBackendDict[];
  'partially_learnt_topics_list': LearnerTopicSummaryBackendDict[];
  'number_of_unread_threads': number;
  'thread_summaries': FeedbackThreadSummaryBackendDict[];
  'completed_to_incomplete_collections': string[];
  'completed_to_incomplete_stories': string[];
  'learnt_to_partially_learnt_topics': string[];
  'number_of_nonexistent_activities': NonExistentActivitiesBackendDict;
  'subscription_list': CreatorSummaryBackendDict[];
}

interface LearnerDashboardData {
  completedExplorationsList: LearnerExplorationSummary[];
  incompleteExplorationsList: LearnerExplorationSummary[];
  explorationPlaylist: LearnerExplorationSummary[];
  completedCollectionsList: CollectionSummary[];
  incompleteCollectionsList: CollectionSummary[];
  collectionPlaylist: CollectionSummary[];
  completedStoriesList: StorySummary[];
  learntTopicsList: LearnerTopicSummary[];
  partiallyLearntTopicsList: LearnerTopicSummary[];
  numberOfUnreadThreads: number;
  threadSummaries: FeedbackThreadSummary[];
  completedToIncompleteCollections: string[];
  completedToIncompleteStories: string[];
  learntToPartiallyLearntTopics: string[];
  numberOfNonexistentActivities: NonExistentActivities;
  subscriptionList: ProfileSummary[];
}

interface AddMessagePayload {
  'updated_status': boolean,
  'updated_subject': string,
  'text': string;
}

interface MessageSummaryList {
  'message_summary_list': FeedbackMessageSummaryBackendDict[]
}

@Injectable({
  providedIn: 'root'
})
export class LearnerDashboardBackendApiService {
  constructor(
    private http: HttpClient) {}

  async _fetchLearnerDashboardDataAsync(): Promise<LearnerDashboardData> {
    return new Promise((resolve, reject) => {
      this.http.get<LearnerDashboardDataBackendDict>(
        '/learnerdashboardhandler/data').toPromise().then(dashboardData => {
        resolve({
          completedExplorationsList: (
            dashboardData.completed_explorations_list.map(
              expSummary => LearnerExplorationSummary.createFromBackendDict(
                expSummary))),
          incompleteExplorationsList: (
            dashboardData.incomplete_explorations_list.map(
              expSummary => LearnerExplorationSummary.createFromBackendDict(
                expSummary))),
          explorationPlaylist: (
            dashboardData.exploration_playlist.map(
              expSummary => LearnerExplorationSummary.createFromBackendDict(
                expSummary))),
          completedCollectionsList: (
            dashboardData.completed_collections_list.map(
              collectionSummary => CollectionSummary
                .createFromBackendDict(collectionSummary))),
          incompleteCollectionsList: (
            dashboardData.incomplete_collections_list.map(
              collectionSummary => CollectionSummary
                .createFromBackendDict(collectionSummary))),
          collectionPlaylist: (
            dashboardData.collection_playlist.map(
              collectionSummary => CollectionSummary
                .createFromBackendDict(collectionSummary))),
          completedStoriesList: (
            dashboardData.completed_stories_list.map(
              storySummary => StorySummary
                .createFromBackendDict(storySummary))),
          learntTopicsList: (
            dashboardData.learnt_topics_list.map(
              topicSummary => LearnerTopicSummary
                .createFromBackendDict(topicSummary))),
          partiallyLearntTopicsList: (
            dashboardData.partially_learnt_topics_list.map(
              topicSummary => LearnerTopicSummary
                .createFromBackendDict(topicSummary))),
          numberOfUnreadThreads: dashboardData.number_of_unread_threads,
          threadSummaries: (
            dashboardData.thread_summaries.map(
              threadSummary => FeedbackThreadSummary
                .createFromBackendDict(threadSummary))),
          completedToIncompleteCollections: (
            dashboardData.completed_to_incomplete_collections),
          completedToIncompleteStories: (
            dashboardData.completed_to_incomplete_stories),
          learntToPartiallyLearntTopics: (
            dashboardData.learnt_to_partially_learnt_topics),
          numberOfNonexistentActivities: (
            NonExistentActivities.createFromBackendDict(
              dashboardData.number_of_nonexistent_activities)),
          subscriptionList: (
            dashboardData.subscription_list.map(
              profileSummary => ProfileSummary
                .createFromCreatorBackendDict(profileSummary)))
        });
      }, errorResponse => {
        reject(errorResponse.status);
      });
    });
  }

  async fetchLearnerDashboardDataAsync(): Promise<LearnerDashboardData> {
    return this._fetchLearnerDashboardDataAsync();
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
  'LearnerDashboardBackendApiService',
  downgradeInjectable(LearnerDashboardBackendApiService));
