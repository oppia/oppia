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
 * @fileoverview Tests for LearnerDashboardActivityIdsObjectFactory.
 */

import { LearnerDashboardActivityIdsObjectFactory } from
  'domain/learner_dashboard/LearnerDashboardActivityIdsObjectFactory.ts';

describe('Learner dashboard activity ids object factory', () => {
  let learnerDashboardActivityIdsObjectFactory:
    LearnerDashboardActivityIdsObjectFactory;
  let learnerDashboardActivityIdsDict: any;

  beforeEach(() => {
    learnerDashboardActivityIdsObjectFactory = (
      new LearnerDashboardActivityIdsObjectFactory());
    learnerDashboardActivityIdsDict = {
      incomplete_exploration_ids: ['0', '1'],
      incomplete_collection_ids: ['2', '3'],
      completed_exploration_ids: ['4', '5'],
      completed_collection_ids: ['6', '7'],
      exploration_playlist_ids: ['8', '9'],
      collection_playlist_ids: ['10', '11']
    };
  });

  it('should check if activity id is present among learner dashboard ' +
     ' activity ids', () => {
    var learnerDashboardActivityIds = (
      learnerDashboardActivityIdsObjectFactory.createFromBackendDict(
        learnerDashboardActivityIdsDict));

    expect(learnerDashboardActivityIds.includesActivity('0')).toEqual(true);
    expect(learnerDashboardActivityIds.includesActivity('1')).toEqual(true);
    expect(learnerDashboardActivityIds.includesActivity('8')).toEqual(true);

    expect(learnerDashboardActivityIds.includesActivity('12')).toEqual(false);
    expect(learnerDashboardActivityIds.includesActivity('13')).toEqual(false);
    expect(learnerDashboardActivityIds.includesActivity('14')).toEqual(false);
  });


  it('should add exploration to learner playlist', () => {
    var learnerDashboardActivityIds = (
      learnerDashboardActivityIdsObjectFactory.createFromBackendDict(
        learnerDashboardActivityIdsDict));

    learnerDashboardActivityIds.addToExplorationLearnerPlaylist('12');
    expect(learnerDashboardActivityIds.explorationPlaylistIds).toEqual(
      ['8', '9', '12']);

    learnerDashboardActivityIds.addToExplorationLearnerPlaylist('13');
    expect(learnerDashboardActivityIds.explorationPlaylistIds).toEqual(
      ['8', '9', '12', '13']);
  });

  it('should add collection to learner playlist', () => {
    var learnerDashboardActivityIds = (
      learnerDashboardActivityIdsObjectFactory.createFromBackendDict(
        learnerDashboardActivityIdsDict));

    learnerDashboardActivityIds.addToCollectionLearnerPlaylist('12');
    expect(learnerDashboardActivityIds.collectionPlaylistIds).toEqual(
      ['10', '11', '12']);

    learnerDashboardActivityIds.addToCollectionLearnerPlaylist('13');
    expect(learnerDashboardActivityIds.collectionPlaylistIds).toEqual(
      ['10', '11', '12', '13']);
  });

  it('should remove exploration from learner playlist', () => {
    var learnerDashboardActivityIds = (
      learnerDashboardActivityIdsObjectFactory.createFromBackendDict(
        learnerDashboardActivityIdsDict));

    learnerDashboardActivityIds.removeFromExplorationLearnerPlaylist('9');
    expect(learnerDashboardActivityIds.explorationPlaylistIds).toEqual(
      ['8']);

    learnerDashboardActivityIds.removeFromExplorationLearnerPlaylist('8');
    expect(learnerDashboardActivityIds.explorationPlaylistIds).toEqual([]);
  });

  it('should remove collection from learner playlist', () => {
    var learnerDashboardActivityIds = (
      learnerDashboardActivityIdsObjectFactory.createFromBackendDict(
        learnerDashboardActivityIdsDict));

    learnerDashboardActivityIds.removeFromCollectionLearnerPlaylist('11');
    expect(learnerDashboardActivityIds.collectionPlaylistIds).toEqual(
      ['10']);

    learnerDashboardActivityIds.removeFromCollectionLearnerPlaylist('10');
    expect(learnerDashboardActivityIds.collectionPlaylistIds).toEqual([]);
  });

  it('should fetch the learner dashboard activity ids domain object from the ' +
     ' backend summary dict', () => {
    var learnerDashboardActivityIdsDict = {
      incomplete_exploration_ids: ['0', '1'],
      incomplete_collection_ids: ['2', '3'],
      completed_exploration_ids: ['4', '5'],
      completed_collection_ids: ['6', '7'],
      exploration_playlist_ids: ['8', '9'],
      collection_playlist_ids: ['10', '11']
    };

    var learnerDashboardActivityIds = (
      learnerDashboardActivityIdsObjectFactory.createFromBackendDict(
        learnerDashboardActivityIdsDict));

    expect(learnerDashboardActivityIds.incompleteExplorationIds).toEqual(
      ['0', '1']);
    expect(learnerDashboardActivityIds.incompleteCollectionIds).toEqual(
      ['2', '3']);
    expect(learnerDashboardActivityIds.completedExplorationIds).toEqual(
      ['4', '5']);
    expect(learnerDashboardActivityIds.completedCollectionIds).toEqual(
      ['6', '7']);
    expect(learnerDashboardActivityIds.explorationPlaylistIds).toEqual(
      ['8', '9']);
    expect(learnerDashboardActivityIds.collectionPlaylistIds).toEqual(
      ['10', '11']);
  });
});
