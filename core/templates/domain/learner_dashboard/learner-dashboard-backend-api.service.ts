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
  CollectionSummaryObjectFactory
} from 'domain/collection/collection-summary-object.factory';
import {
  FeedbackThreadSummary,
  FeedbackThreadSummaryObjectFactory,
  FeedbackThreadSummaryBackendDict
} from 'domain/feedback_thread/FeedbackThreadSummaryObjectFactory';
import {
  LearnerExplorationSummary,
  LearnerExplorationSummaryBackendDict,
  LearnerExplorationSummaryObjectFactory
} from 'domain/summary/learner-exploration-summary-object.factory';
import {
  NonExistentActivities,
  NonExistentActivitiesBackendDict,
  NonExistentActivitiesObjectFactory
} from 'domain/learner_dashboard/non-existent-activities-object.factory';
import {
  CreatorSummaryBackendDict,
  ProfileSummary,
  ProfileSummaryObjectFactory
} from 'domain/profile/profile-summary-object.factory';

interface LearnerDashboardDataBackendDict {
  'completed_explorations_list': LearnerExplorationSummaryBackendDict[];
  'incomplete_explorations_list': LearnerExplorationSummaryBackendDict[];
  'exploration_playlist': LearnerExplorationSummaryBackendDict[];
  'completed_collections_list': CollectionSummaryBackendDict[];
  'incomplete_collections_list': CollectionSummaryBackendDict[];
  'collection_playlist': CollectionSummaryBackendDict[];
  'number_of_unread_threads': number;
  'thread_summaries': FeedbackThreadSummaryBackendDict[];
  'completed_to_incomplete_collections': string[];
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
  numberOfUnreadThreads: number;
  threadSummaries: FeedbackThreadSummary[];
  completedToIncompleteCollections: string[];
  numberOfNonexistentActivities: NonExistentActivities;
  subscriptionList: ProfileSummary[];
}

@Injectable({
  providedIn: 'root'
})
export class LearnerDashboardBackendApiService {
  constructor(
    private http: HttpClient,
    private collectionSummaryObjectFactory: CollectionSummaryObjectFactory,
    private feedbackThreadSummaryObjectFactory:
    FeedbackThreadSummaryObjectFactory,
    private learnerExplorationSummaryObjectFactory:
    LearnerExplorationSummaryObjectFactory,
    private nonExistentActivitiesObjectFactory:
    NonExistentActivitiesObjectFactory,
    private profileSummaryObjectFactory: ProfileSummaryObjectFactory) {}

  _fetchLearnerDashboardData(): Promise<LearnerDashboardData> {
    return this.http.get<LearnerDashboardDataBackendDict>(
      '/learnerdashboardhandler/data').toPromise().then(dashboardData => {
      return {
        completedExplorationsList: (
          dashboardData.completed_explorations_list.map(
            expSummary => this.learnerExplorationSummaryObjectFactory
              .createFromBackendDict(expSummary))),
        incompleteExplorationsList: (
          dashboardData.incomplete_explorations_list.map(
            expSummary => this.learnerExplorationSummaryObjectFactory
              .createFromBackendDict(expSummary))),
        explorationPlaylist: (
          dashboardData.exploration_playlist.map(
            expSummary => this.learnerExplorationSummaryObjectFactory
              .createFromBackendDict(expSummary))),
        completedCollectionsList: (
          dashboardData.completed_collections_list.map(
            collectionSummary => this.collectionSummaryObjectFactory
              .createFromBackendDict(collectionSummary))),
        incompleteCollectionsList: (
          dashboardData.incomplete_collections_list.map(
            collectionSummary => this.collectionSummaryObjectFactory
              .createFromBackendDict(collectionSummary))),
        collectionPlaylist: (
          dashboardData.collection_playlist.map(
            collectionSummary => this.collectionSummaryObjectFactory
              .createFromBackendDict(collectionSummary))),
        numberOfUnreadThreads: dashboardData.number_of_unread_threads,
        threadSummaries: (
          dashboardData.thread_summaries.map(
            threadSummary => this.feedbackThreadSummaryObjectFactory
              .createFromBackendDict(threadSummary))),
        completedToIncompleteCollections: (
          dashboardData.completed_to_incomplete_collections),
        numberOfNonexistentActivities: (
          this.nonExistentActivitiesObjectFactory.createFromBackendDict(
            dashboardData.number_of_nonexistent_activities)),
        subscriptionList: (
          dashboardData.subscription_list.map(
            profileSummary => this.profileSummaryObjectFactory
              .createFromCreatorBackendDict(profileSummary)))
      };
    });
  }

  fetchLearnerDashboardData(): Promise<LearnerDashboardData> {
    return this._fetchLearnerDashboardData();
  }
}

angular.module('oppia').factory(
  'LearnerDashboardBackendApiService',
  downgradeInjectable(LearnerDashboardBackendApiService));
