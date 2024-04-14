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
 * @fileoverview Model class for creating new frontend instances of learner
   dashboard activity ids domain object.
 */

export interface LearnerDashboardActivityIdsDict {
  incomplete_exploration_ids: string[];
  incomplete_collection_ids: string[];
  partially_learnt_topic_ids: string[];
  completed_exploration_ids: string[];
  completed_story_ids: string[];
  learnt_topic_ids: string[];
  completed_collection_ids: string[];
  topic_ids_to_learn: string[];
  all_topic_ids: string[];
  untracked_topic_ids: string[];
  exploration_playlist_ids: string[];
  collection_playlist_ids: string[];
}

export class LearnerDashboardActivityIds {
  incompleteExplorationIds: string[];
  incompleteCollectionIds: string[];
  partiallyLearntTopicIds: string[];
  completedExplorationIds: string[];
  completedCollectionIds: string[];
  completedStoryIds: string[];
  learntTopicIds: string[];
  topicIdsToLearn: string[];
  allTopicIds: string[];
  untrackedTopicIds: string[];
  explorationPlaylistIds: string[];
  collectionPlaylistIds: string[];

  constructor(
    incompleteExplorationIds: string[],
    incompleteCollectionIds: string[],
    partiallyLearntTopicIds: string[],
    completedExplorationIds: string[],
    completedCollectionIds: string[],
    completedStoryIds: string[],
    learntTopicIds: string[],
    topicIdsToLearn: string[],
    allTopicIds: string[],
    untrackedTopicIds: string[],
    explorationPlaylistIds: string[],
    collectionPlaylistIds: string[]
  ) {
    this.incompleteExplorationIds = incompleteExplorationIds;
    this.incompleteCollectionIds = incompleteCollectionIds;
    this.partiallyLearntTopicIds = partiallyLearntTopicIds;
    this.completedExplorationIds = completedExplorationIds;
    this.completedCollectionIds = completedCollectionIds;
    this.completedStoryIds = completedStoryIds;
    this.learntTopicIds = learntTopicIds;
    this.topicIdsToLearn = topicIdsToLearn;
    this.allTopicIds = allTopicIds;
    this.untrackedTopicIds = untrackedTopicIds;
    this.explorationPlaylistIds = explorationPlaylistIds;
    this.collectionPlaylistIds = collectionPlaylistIds;
  }

  includesActivity(activityId: string): boolean {
    if (
      this.incompleteCollectionIds.indexOf(activityId) !== -1 ||
      this.completedCollectionIds.indexOf(activityId) !== -1 ||
      this.collectionPlaylistIds.indexOf(activityId) !== -1 ||
      this.incompleteExplorationIds.indexOf(activityId) !== -1 ||
      this.completedExplorationIds.indexOf(activityId) !== -1 ||
      this.explorationPlaylistIds.indexOf(activityId) !== -1 ||
      this.completedStoryIds.indexOf(activityId) !== -1 ||
      this.partiallyLearntTopicIds.indexOf(activityId) !== -1 ||
      this.learntTopicIds.indexOf(activityId) !== -1 ||
      this.topicIdsToLearn.indexOf(activityId) !== -1 ||
      this.allTopicIds.indexOf(activityId) !== -1 ||
      this.untrackedTopicIds.indexOf(activityId) !== -1
    ) {
      return true;
    }
    return false;
  }

  belongsToExplorationPlaylist(explorationId: string): boolean {
    if (this.explorationPlaylistIds.indexOf(explorationId) !== -1) {
      return true;
    }
    return false;
  }

  belongsToCollectionPlaylist(collectionId: string): boolean {
    if (this.collectionPlaylistIds.indexOf(collectionId) !== -1) {
      return true;
    }
    return false;
  }

  belongsToTopicsToLearn(topicId: string): boolean {
    if (this.topicIdsToLearn.indexOf(topicId) !== -1) {
      return true;
    }
    return false;
  }

  belongsToCompletedExplorations(explorationId: string): boolean {
    if (this.completedExplorationIds.indexOf(explorationId) !== -1) {
      return true;
    }
    return false;
  }

  belongsToCompletedCollections(collectionId: string): boolean {
    if (this.completedCollectionIds.indexOf(collectionId) !== -1) {
      return true;
    }
    return false;
  }

  belongsToCompletedStories(storyId: string): boolean {
    if (this.completedStoryIds.indexOf(storyId) !== -1) {
      return true;
    }
    return false;
  }

  belongsToLearntTopics(topicId: string): boolean {
    if (this.learntTopicIds.indexOf(topicId) !== -1) {
      return true;
    }
    return false;
  }

  belongsToIncompleteExplorations(explorationId: string): boolean {
    if (this.incompleteExplorationIds.indexOf(explorationId) !== -1) {
      return true;
    }
    return false;
  }

  belongsToIncompleteCollections(collectionId: string): boolean {
    if (this.incompleteCollectionIds.indexOf(collectionId) !== -1) {
      return true;
    }
    return false;
  }

  belongsToPartiallyLearntTopics(topicId: string): boolean {
    if (this.partiallyLearntTopicIds.indexOf(topicId) !== -1) {
      return true;
    }
    return false;
  }

  addToExplorationLearnerPlaylist(explorationId: string): void {
    this.explorationPlaylistIds.push(explorationId);
  }

  removeFromExplorationLearnerPlaylist(explorationId: string): void {
    var index = this.explorationPlaylistIds.indexOf(explorationId);
    if (index !== -1) {
      this.explorationPlaylistIds.splice(index, 1);
    }
  }

  addToCollectionLearnerPlaylist(collectionId: string): void {
    this.collectionPlaylistIds.push(collectionId);
  }

  removeFromCollectionLearnerPlaylist(collectionId: string): void {
    var index = this.collectionPlaylistIds.indexOf(collectionId);
    if (index !== -1) {
      this.collectionPlaylistIds.splice(index, 1);
    }
  }

  removeTopicFromLearn(topicId: string): void {
    var index = this.topicIdsToLearn.indexOf(topicId);
    if (index !== -1) {
      this.topicIdsToLearn.splice(index, 1);
    }
  }

  static createFromBackendDict(
    learnerDashboardActivityIdsDict: LearnerDashboardActivityIdsDict
  ): LearnerDashboardActivityIds {
    return new LearnerDashboardActivityIds(
      learnerDashboardActivityIdsDict.incomplete_exploration_ids,
      learnerDashboardActivityIdsDict.incomplete_collection_ids,
      learnerDashboardActivityIdsDict.partially_learnt_topic_ids,
      learnerDashboardActivityIdsDict.completed_exploration_ids,
      learnerDashboardActivityIdsDict.completed_collection_ids,
      learnerDashboardActivityIdsDict.completed_story_ids,
      learnerDashboardActivityIdsDict.learnt_topic_ids,
      learnerDashboardActivityIdsDict.topic_ids_to_learn,
      learnerDashboardActivityIdsDict.all_topic_ids,
      learnerDashboardActivityIdsDict.untracked_topic_ids,
      learnerDashboardActivityIdsDict.exploration_playlist_ids,
      learnerDashboardActivityIdsDict.collection_playlist_ids
    );
  }
}
