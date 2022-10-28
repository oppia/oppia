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
 * @fileoverview Tests for LearnerDashboardActivityIds model.
 */

import {
  LearnerDashboardActivityIds,
  LearnerDashboardActivityIdsDict
} from 'domain/learner_dashboard/learner-dashboard-activity-ids.model';

describe('Learner dashboard activity ids model', () => {
  let learnerDashboardActivityIdsDict: LearnerDashboardActivityIdsDict;

  beforeEach(() => {
    learnerDashboardActivityIdsDict = {
      incomplete_exploration_ids: ['0', '1'],
      incomplete_collection_ids: ['2', '3'],
      partially_learnt_topic_ids: ['4', '5'],
      completed_exploration_ids: ['6', '7'],
      completed_collection_ids: ['8', '9'],
      completed_story_ids: ['10', '11'],
      learnt_topic_ids: ['12', '13'],
      exploration_playlist_ids: ['14', '15'],
      collection_playlist_ids: ['16', '17'],
      topic_ids_to_learn: ['18', '19'],
      all_topic_ids: ['20', '21'],
      untracked_topic_ids: ['22', '23']
    };
  });

  it('should check if activity id is present among learner dashboard ' +
     'activity ids', () => {
    var learnerDashboardActivityIds = (
      LearnerDashboardActivityIds.createFromBackendDict(
        learnerDashboardActivityIdsDict));

    expect(learnerDashboardActivityIds.includesActivity('0')).toEqual(true);
    expect(learnerDashboardActivityIds.includesActivity('1')).toEqual(true);
    expect(learnerDashboardActivityIds.includesActivity('8')).toEqual(true);

    expect(learnerDashboardActivityIds.includesActivity('24')).toEqual(false);
    expect(learnerDashboardActivityIds.includesActivity('25')).toEqual(false);
    expect(learnerDashboardActivityIds.includesActivity('26')).toEqual(false);
  });


  it('should add exploration to learner playlist', () => {
    var learnerDashboardActivityIds = (
      LearnerDashboardActivityIds.createFromBackendDict(
        learnerDashboardActivityIdsDict));

    learnerDashboardActivityIds.addToExplorationLearnerPlaylist('12');
    expect(learnerDashboardActivityIds.explorationPlaylistIds).toEqual(
      ['14', '15', '12']);

    learnerDashboardActivityIds.addToExplorationLearnerPlaylist('13');
    expect(learnerDashboardActivityIds.explorationPlaylistIds).toEqual(
      ['14', '15', '12', '13']);
  });

  it('should add collection to learner playlist', () => {
    var learnerDashboardActivityIds = (
      LearnerDashboardActivityIds.createFromBackendDict(
        learnerDashboardActivityIdsDict));

    learnerDashboardActivityIds.addToCollectionLearnerPlaylist('12');
    expect(learnerDashboardActivityIds.collectionPlaylistIds).toEqual(
      ['16', '17', '12']);

    learnerDashboardActivityIds.addToCollectionLearnerPlaylist('13');
    expect(learnerDashboardActivityIds.collectionPlaylistIds).toEqual(
      ['16', '17', '12', '13']);
  });

  it('should remove exploration from learner playlist', () => {
    var learnerDashboardActivityIds = (
      LearnerDashboardActivityIds.createFromBackendDict(
        learnerDashboardActivityIdsDict));

    learnerDashboardActivityIds.removeFromExplorationLearnerPlaylist('14');
    expect(learnerDashboardActivityIds.explorationPlaylistIds).toEqual(
      ['15']);

    learnerDashboardActivityIds.removeFromExplorationLearnerPlaylist('15');
    expect(learnerDashboardActivityIds.explorationPlaylistIds).toEqual([]);
  });

  it('should remove collection from learner playlist', () => {
    var learnerDashboardActivityIds = (
      LearnerDashboardActivityIds.createFromBackendDict(
        learnerDashboardActivityIdsDict));

    learnerDashboardActivityIds.removeFromCollectionLearnerPlaylist('16');
    expect(learnerDashboardActivityIds.collectionPlaylistIds).toEqual(
      ['17']);

    learnerDashboardActivityIds.removeFromCollectionLearnerPlaylist('17');
    expect(learnerDashboardActivityIds.collectionPlaylistIds).toEqual([]);
  });

  it('should remove topic from learn', () => {
    var learnerDashboardActivityIds = (
      LearnerDashboardActivityIds.createFromBackendDict(
        learnerDashboardActivityIdsDict));

    learnerDashboardActivityIds.removeTopicFromLearn('18');
    expect(learnerDashboardActivityIds.topicIdsToLearn).toEqual(
      ['19']);

    learnerDashboardActivityIds.removeTopicFromLearn('19');
    expect(learnerDashboardActivityIds.topicIdsToLearn).toEqual([]);
  });

  it('should fetch the learner dashboard activity ids domain object from ' +
     'the backend summary dict', () => {
    var learnerDashboardActivityIds = (
      LearnerDashboardActivityIds.createFromBackendDict(
        learnerDashboardActivityIdsDict));

    expect(learnerDashboardActivityIds.incompleteExplorationIds).toEqual(
      ['0', '1']);
    expect(learnerDashboardActivityIds.incompleteCollectionIds).toEqual(
      ['2', '3']);
    expect(learnerDashboardActivityIds.partiallyLearntTopicIds).toEqual(
      ['4', '5']);
    expect(learnerDashboardActivityIds.completedExplorationIds).toEqual(
      ['6', '7']);
    expect(learnerDashboardActivityIds.completedCollectionIds).toEqual(
      ['8', '9']);
    expect(learnerDashboardActivityIds.completedStoryIds).toEqual(
      ['10', '11']);
    expect(learnerDashboardActivityIds.learntTopicIds).toEqual(
      ['12', '13']);
    expect(learnerDashboardActivityIds.explorationPlaylistIds).toEqual(
      ['14', '15']);
    expect(learnerDashboardActivityIds.collectionPlaylistIds).toEqual(
      ['16', '17']);
  });

  it('should check if explorationId belongs to exploration playlist', () => {
    var learnerDashboardActivityIds = (
      LearnerDashboardActivityIds.createFromBackendDict(
        learnerDashboardActivityIdsDict));

    expect(learnerDashboardActivityIds.belongsToExplorationPlaylist('14'))
      .toBe(true);
    expect(learnerDashboardActivityIds.belongsToExplorationPlaylist('15'))
      .toBe(true);

    expect(learnerDashboardActivityIds.belongsToExplorationPlaylist('0'))
      .toBe(false);
    expect(learnerDashboardActivityIds.belongsToExplorationPlaylist('2'))
      .toBe(false);
    expect(learnerDashboardActivityIds.belongsToExplorationPlaylist('4'))
      .toBe(false);
    expect(learnerDashboardActivityIds.belongsToExplorationPlaylist('6'))
      .toBe(false);
    expect(learnerDashboardActivityIds.belongsToExplorationPlaylist('10'))
      .toBe(false);
  });

  it('should check if collectionId belongs to collection playlist', () => {
    var learnerDashboardActivityIds = (
      LearnerDashboardActivityIds.createFromBackendDict(
        learnerDashboardActivityIdsDict));

    expect(learnerDashboardActivityIds.belongsToCollectionPlaylist('16'))
      .toBe(true);
    expect(learnerDashboardActivityIds.belongsToCollectionPlaylist('17'))
      .toBe(true);

    expect(learnerDashboardActivityIds.belongsToCollectionPlaylist('0'))
      .toBe(false);
    expect(learnerDashboardActivityIds.belongsToCollectionPlaylist('2'))
      .toBe(false);
    expect(learnerDashboardActivityIds.belongsToCollectionPlaylist('4'))
      .toBe(false);
    expect(learnerDashboardActivityIds.belongsToCollectionPlaylist('6'))
      .toBe(false);
    expect(learnerDashboardActivityIds.belongsToCollectionPlaylist('8'))
      .toBe(false);
  });

  it('should check if topicId belongs to learn', () => {
    var learnerDashboardActivityIds = (
      LearnerDashboardActivityIds.createFromBackendDict(
        learnerDashboardActivityIdsDict));

    expect(learnerDashboardActivityIds.belongsToTopicsToLearn('18'))
      .toBe(true);
    expect(learnerDashboardActivityIds.belongsToTopicsToLearn('19'))
      .toBe(true);

    expect(learnerDashboardActivityIds.belongsToTopicsToLearn('0'))
      .toBe(false);
    expect(learnerDashboardActivityIds.belongsToTopicsToLearn('2'))
      .toBe(false);
    expect(learnerDashboardActivityIds.belongsToTopicsToLearn('4'))
      .toBe(false);
    expect(learnerDashboardActivityIds.belongsToTopicsToLearn('6'))
      .toBe(false);
    expect(learnerDashboardActivityIds.belongsToTopicsToLearn('10'))
      .toBe(false);
  });

  it('should check if explorationId belongs to completed explorations', () => {
    var learnerDashboardActivityIds = (
      LearnerDashboardActivityIds.createFromBackendDict(
        learnerDashboardActivityIdsDict));

    expect(learnerDashboardActivityIds.belongsToCompletedExplorations('6'))
      .toBe(true);
    expect(learnerDashboardActivityIds.belongsToCompletedExplorations('7'))
      .toBe(true);

    expect(learnerDashboardActivityIds.belongsToCompletedExplorations('0'))
      .toBe(false);
    expect(learnerDashboardActivityIds.belongsToCompletedExplorations('2'))
      .toBe(false);
    expect(learnerDashboardActivityIds.belongsToCompletedExplorations('5'))
      .toBe(false);
    expect(learnerDashboardActivityIds.belongsToCompletedExplorations('8'))
      .toBe(false);
    expect(learnerDashboardActivityIds.belongsToCompletedExplorations('10'))
      .toBe(false);
  });

  it('should check if collectionId belongs to completed collections', () => {
    var learnerDashboardActivityIds = (
      LearnerDashboardActivityIds.createFromBackendDict(
        learnerDashboardActivityIdsDict));

    expect(learnerDashboardActivityIds.belongsToCompletedCollections('8'))
      .toBe(true);
    expect(learnerDashboardActivityIds.belongsToCompletedCollections('9'))
      .toBe(true);

    expect(learnerDashboardActivityIds.belongsToCompletedCollections('0'))
      .toBe(false);
    expect(learnerDashboardActivityIds.belongsToCompletedCollections('2'))
      .toBe(false);
    expect(learnerDashboardActivityIds.belongsToCompletedCollections('4'))
      .toBe(false);
    expect(learnerDashboardActivityIds.belongsToCompletedCollections('7'))
      .toBe(false);
    expect(learnerDashboardActivityIds.belongsToCompletedCollections('12'))
      .toBe(false);
  });

  it('should check if storyId belongs to completed stories', () => {
    var learnerDashboardActivityIds = (
      LearnerDashboardActivityIds.createFromBackendDict(
        learnerDashboardActivityIdsDict));

    expect(learnerDashboardActivityIds.belongsToCompletedStories('10'))
      .toBe(true);
    expect(learnerDashboardActivityIds.belongsToCompletedStories('11'))
      .toBe(true);

    expect(learnerDashboardActivityIds.belongsToCompletedStories('0'))
      .toBe(false);
    expect(learnerDashboardActivityIds.belongsToCompletedStories('2'))
      .toBe(false);
    expect(learnerDashboardActivityIds.belongsToCompletedStories('4'))
      .toBe(false);
    expect(learnerDashboardActivityIds.belongsToCompletedStories('8'))
      .toBe(false);
    expect(learnerDashboardActivityIds.belongsToCompletedStories('12'))
      .toBe(false);
  });

  it('should check if topicId belongs to learnt topics', () => {
    var learnerDashboardActivityIds = (
      LearnerDashboardActivityIds.createFromBackendDict(
        learnerDashboardActivityIdsDict));

    expect(learnerDashboardActivityIds.belongsToLearntTopics('12'))
      .toBe(true);
    expect(learnerDashboardActivityIds.belongsToLearntTopics('13'))
      .toBe(true);

    expect(learnerDashboardActivityIds.belongsToLearntTopics('0'))
      .toBe(false);
    expect(learnerDashboardActivityIds.belongsToLearntTopics('2'))
      .toBe(false);
    expect(learnerDashboardActivityIds.belongsToLearntTopics('4'))
      .toBe(false);
    expect(learnerDashboardActivityIds.belongsToLearntTopics('8'))
      .toBe(false);
    expect(learnerDashboardActivityIds.belongsToLearntTopics('11'))
      .toBe(false);
  });

  it('should check if explorationId belongs to incomplete explorations', () => {
    var learnerDashboardActivityIds = (
      LearnerDashboardActivityIds.createFromBackendDict(
        learnerDashboardActivityIdsDict));

    expect(learnerDashboardActivityIds.belongsToIncompleteExplorations('0'))
      .toBe(true);
    expect(learnerDashboardActivityIds.belongsToIncompleteExplorations('1'))
      .toBe(true);

    expect(learnerDashboardActivityIds.belongsToIncompleteExplorations('2'))
      .toBe(false);
    expect(learnerDashboardActivityIds.belongsToIncompleteExplorations('4'))
      .toBe(false);
    expect(learnerDashboardActivityIds.belongsToIncompleteExplorations('6'))
      .toBe(false);
    expect(learnerDashboardActivityIds.belongsToIncompleteExplorations('8'))
      .toBe(false);
    expect(learnerDashboardActivityIds.belongsToIncompleteExplorations('10'))
      .toBe(false);
  });

  it('should check if collectionId belongs to incomplete collections', () => {
    var learnerDashboardActivityIds = (
      LearnerDashboardActivityIds.createFromBackendDict(
        learnerDashboardActivityIdsDict));

    expect(learnerDashboardActivityIds.belongsToIncompleteCollections('2'))
      .toBe(true);
    expect(learnerDashboardActivityIds.belongsToIncompleteCollections('3'))
      .toBe(true);

    expect(learnerDashboardActivityIds.belongsToIncompleteCollections('0'))
      .toBe(false);
    expect(learnerDashboardActivityIds.belongsToIncompleteCollections('4'))
      .toBe(false);
    expect(learnerDashboardActivityIds.belongsToIncompleteCollections('6'))
      .toBe(false);
    expect(learnerDashboardActivityIds.belongsToIncompleteCollections('8'))
      .toBe(false);
    expect(learnerDashboardActivityIds.belongsToIncompleteCollections('10'))
      .toBe(false);
  });

  it('should check if topicsId belongs to partially learnt topics', () => {
    var learnerDashboardActivityIds = (
      LearnerDashboardActivityIds.createFromBackendDict(
        learnerDashboardActivityIdsDict));

    expect(learnerDashboardActivityIds.belongsToPartiallyLearntTopics('4'))
      .toBe(true);
    expect(learnerDashboardActivityIds.belongsToPartiallyLearntTopics('5'))
      .toBe(true);

    expect(learnerDashboardActivityIds.belongsToPartiallyLearntTopics('0'))
      .toBe(false);
    expect(learnerDashboardActivityIds.belongsToPartiallyLearntTopics('2'))
      .toBe(false);
    expect(learnerDashboardActivityIds.belongsToPartiallyLearntTopics('3'))
      .toBe(false);
    expect(learnerDashboardActivityIds.belongsToPartiallyLearntTopics('8'))
      .toBe(false);
    expect(learnerDashboardActivityIds.belongsToPartiallyLearntTopics('10'))
      .toBe(false);
  });
});
