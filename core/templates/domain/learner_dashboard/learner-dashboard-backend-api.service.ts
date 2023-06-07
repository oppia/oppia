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
  LearnerExplorationSummary,
  LearnerExplorationSummaryBackendDict,
} from 'domain/summary/learner-exploration-summary.model';
import {
  NonExistentTopicsAndStories,
  NonExistentTopicsAndStoriesBackendDict,
} from 'domain/learner_dashboard/non-existent-topics-and-stories.model';
import {
  NonExistentCollections,
  NonExistentCollectionsBackendDict,
} from 'domain/learner_dashboard/non-existent-collections.model';
import {
  NonExistentExplorations,
  NonExistentExplorationsBackendDict,
} from 'domain/learner_dashboard/non-existent-explorations.model';
import {
  CreatorSummaryBackendDict,
  ProfileSummary,
} from 'domain/user/profile-summary.model';
import {
  ShortLearnerGroupSummary,
  ShortLearnerGroupSummaryBackendDict
} from 'domain/learner_group/short-learner-group-summary.model';
import { AppConstants } from 'app.constants';


interface LearnerDashboardTopicsAndStoriesDataBackendDict {
  'completed_stories_list': StorySummaryBackendDict[];
  'learnt_topics_list': LearnerTopicSummaryBackendDict[];
  'partially_learnt_topics_list': LearnerTopicSummaryBackendDict[];
  'topics_to_learn_list': LearnerTopicSummaryBackendDict[];
  'all_topics_list': LearnerTopicSummaryBackendDict[];
  'untracked_topics': Record<string, LearnerTopicSummaryBackendDict[]>;
  'completed_to_incomplete_stories': string[];
  'learnt_to_partially_learnt_topics': string[];
  'number_of_nonexistent_topics_and_stories':
    NonExistentTopicsAndStoriesBackendDict;
}


interface LearnerDashboardCollectionsDataBackendDict {
  'completed_collections_list': CollectionSummaryBackendDict[];
  'incomplete_collections_list': CollectionSummaryBackendDict[];
  'collection_playlist': CollectionSummaryBackendDict[];
  'completed_to_incomplete_collections': string[];
  'number_of_nonexistent_collections': NonExistentCollectionsBackendDict;
}


export interface LearnerDashboardExplorationsDataBackendDict {
  'completed_explorations_list': LearnerExplorationSummaryBackendDict[];
  'incomplete_explorations_list': LearnerExplorationSummaryBackendDict[];
  'exploration_playlist': LearnerExplorationSummaryBackendDict[];
  'number_of_nonexistent_explorations': NonExistentExplorationsBackendDict;
  'subscription_list': CreatorSummaryBackendDict[];
}


interface LearnerCompletedChaptersCountDataBackendDict {
  'completed_chapters_count': number;
}

interface LearnerDashboardLearnerGroupsBackendDict {
  'learner_groups_joined': ShortLearnerGroupSummaryBackendDict[];
  'invited_to_learner_groups': ShortLearnerGroupSummaryBackendDict[];
}

interface LearnerDashboardTopicsAndStoriesData {
  completedStoriesList: StorySummary[];
  learntTopicsList: LearnerTopicSummary[];
  partiallyLearntTopicsList: LearnerTopicSummary[];
  topicsToLearnList: LearnerTopicSummary[];
  allTopicsList: LearnerTopicSummary[];
  untrackedTopics: Record<string, LearnerTopicSummary[]>;
  completedToIncompleteStories: string[];
  learntToPartiallyLearntTopics: string[];
  numberOfNonexistentTopicsAndStories: NonExistentTopicsAndStories;
}


interface LearnerDashboardCollectionsData {
  completedCollectionsList: CollectionSummary[];
  incompleteCollectionsList: CollectionSummary[];
  collectionPlaylist: CollectionSummary[];
  completedToIncompleteCollections: string[];
  numberOfNonexistentCollections: NonExistentCollections;
}


interface LearnerDashboardExplorationsData {
  completedExplorationsList: LearnerExplorationSummary[];
  incompleteExplorationsList: LearnerExplorationSummary[];
  explorationPlaylist: LearnerExplorationSummary[];
  numberOfNonexistentExplorations: NonExistentExplorations;
  subscriptionList: ProfileSummary[];
}


interface LearnerCompletedChaptersCountData {
  completedChaptersCount: number;
}

interface LearnerDashboardLearnerGroups {
  learnerGroupsJoined: ShortLearnerGroupSummary[];
  invitedToLearnerGroups: ShortLearnerGroupSummary[];
}

export interface SubtopicMasterySummaryBackendDict {
  [mastery: string]: number;
}

export interface SubtopicMasteryDict {
  'subtopic_mastery_dict': Record<string, SubtopicMasterySummaryBackendDict>;
}


@Injectable({
  providedIn: 'root'
})
export class LearnerDashboardBackendApiService {
  constructor(
    private http: HttpClient) {}

  async _fetchLearnerDashboardTopicsAndStoriesDataAsync():
  Promise<LearnerDashboardTopicsAndStoriesData> {
    return new Promise((resolve, reject) => {
      this.http.get<LearnerDashboardTopicsAndStoriesDataBackendDict>(
        '/learnerdashboardtopicsandstoriesprogresshandler/data'
      ).toPromise().then(
        dashboardData => {
          resolve({
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
            topicsToLearnList: (
              dashboardData.topics_to_learn_list.map(
                topicSummary => LearnerTopicSummary
                  .createFromBackendDict(topicSummary))),
            allTopicsList: (
              dashboardData.all_topics_list.map(
                topicSummary => LearnerTopicSummary
                  .createFromBackendDict(topicSummary))),
            untrackedTopics: this.getUntrackedTopics(
              dashboardData.untracked_topics),
            completedToIncompleteStories: (
              dashboardData.completed_to_incomplete_stories),
            learntToPartiallyLearntTopics: (
              dashboardData.learnt_to_partially_learnt_topics),
            numberOfNonexistentTopicsAndStories: (
              NonExistentTopicsAndStories.createFromBackendDict(
                dashboardData.number_of_nonexistent_topics_and_stories)),
          });
        }, errorResponse => {
          reject(errorResponse.status);
        });
    });
  }

  async _fetchLearnerDashboardCollectionsDataAsync():
  Promise<LearnerDashboardCollectionsData> {
    return new Promise((resolve, reject) => {
      this.http.get<LearnerDashboardCollectionsDataBackendDict>(
        '/learnerdashboardcollectionsprogresshandler/data').toPromise().then(
        dashboardData => {
          resolve({
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
            completedToIncompleteCollections: (
              dashboardData.completed_to_incomplete_collections),
            numberOfNonexistentCollections: (
              NonExistentCollections.createFromBackendDict(
                dashboardData.number_of_nonexistent_collections)),
          });
        }, errorResponse => {
          reject(errorResponse.status);
        });
    });
  }

  async _fetchLearnerDashboardExplorationsDataAsync():
  Promise<LearnerDashboardExplorationsData> {
    return new Promise((resolve, reject) => {
      this.http.get<LearnerDashboardExplorationsDataBackendDict>(
        '/learnerdashboardexplorationsprogresshandler/data').toPromise().then(
        dashboardData => {
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
            numberOfNonexistentExplorations: (
              NonExistentExplorations.createFromBackendDict(
                dashboardData.number_of_nonexistent_explorations)),
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

  async _fetchLearnerCompletedChaptersCountDataAsync():
  Promise<LearnerCompletedChaptersCountData> {
    return new Promise((resolve, reject) => {
      this.http.get<LearnerCompletedChaptersCountDataBackendDict>(
        '/learnercompletedchapterscounthandler/data').toPromise().then(
        chapterCompletionData => {
          resolve({
            completedChaptersCount: (
              chapterCompletionData.completed_chapters_count)
          });
        }, errorResponse => {
          reject(errorResponse.status);
        });
    });
  }

  getUntrackedTopics(
      untrackedTopics: Record<string,
      LearnerTopicSummaryBackendDict[]>): Record<string,
      LearnerTopicSummary[]> {
    var topics: Record<string, LearnerTopicSummary[]> = {};
    for (var i in untrackedTopics) {
      topics[i] = untrackedTopics[i].map(
        topicSummary => LearnerTopicSummary.createFromBackendDict(
          topicSummary));
    }
    return topics;
  }

  async fetchLearnerDashboardTopicsAndStoriesDataAsync():
  Promise<LearnerDashboardTopicsAndStoriesData> {
    return this._fetchLearnerDashboardTopicsAndStoriesDataAsync();
  }

  async fetchLearnerDashboardCollectionsDataAsync():
  Promise<LearnerDashboardCollectionsData> {
    return this._fetchLearnerDashboardCollectionsDataAsync();
  }

  async fetchLearnerDashboardExplorationsDataAsync():
  Promise<LearnerDashboardExplorationsData> {
    return this._fetchLearnerDashboardExplorationsDataAsync();
  }

  async fetchLearnerCompletedChaptersCountDataAsync():
  Promise<LearnerCompletedChaptersCountData> {
    return this._fetchLearnerCompletedChaptersCountDataAsync();
  }

  async _fetchSubtopicMastery(
      topicIds: string[]
  ): Promise<Record<string, SubtopicMasterySummaryBackendDict>> {
    return new Promise((resolve, reject) => {
      this.http.get<SubtopicMasteryDict>(
        AppConstants.SUBTOPIC_MASTERY_DATA_URL_TEMPLATE, {
          params: { selected_topic_ids: JSON.stringify(topicIds) }}).toPromise()
        .then(response => {
          resolve(response.subtopic_mastery_dict);
        }, errorResponse => {
          reject(errorResponse.error.error);
        });
    });
  }

  async fetchSubtopicMastery(
      topicIds: string[]
  ): Promise<Record<string, SubtopicMasterySummaryBackendDict>> {
    return this._fetchSubtopicMastery(topicIds);
  }

  async _fetchLearnerDashboardLearnerGroupsAsync():
  Promise<LearnerDashboardLearnerGroups> {
    return new Promise((resolve, reject) => {
      this.http.get<LearnerDashboardLearnerGroupsBackendDict>(
        '/learner_dashboard_learner_groups_handler'
      ).toPromise().then(dashboardData => {
        resolve(
          {
            learnerGroupsJoined: (
              dashboardData.learner_groups_joined.map(
                shortLearnerGroupSummary => ShortLearnerGroupSummary
                  .createFromBackendDict(shortLearnerGroupSummary))),
            invitedToLearnerGroups: (
              dashboardData.invited_to_learner_groups.map(
                shortLearnerGroupSummary => ShortLearnerGroupSummary
                  .createFromBackendDict(shortLearnerGroupSummary)))
          });
      });
    });
  }

  async fetchLearnerDashboardLearnerGroupsAsync():
  Promise<LearnerDashboardLearnerGroups> {
    return this._fetchLearnerDashboardLearnerGroupsAsync();
  }
}

angular.module('oppia').factory(
  'LearnerDashboardBackendApiService',
  downgradeInjectable(LearnerDashboardBackendApiService));
