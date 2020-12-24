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

import { CollectionPlaythrough } from './collection-playthrough.model';

/**
 * @fileoverview Tests for CollectionPlaythroughModel.
 */

describe('Collection playthrough model', () => {

  it('should create a new CollectionPlaythrough instance', () => {
    let collectionPlaythroughObject = new CollectionPlaythrough(
      'exp_id0', ['exp_id1']);
    expect(collectionPlaythroughObject.getNextExplorationId())
      .toEqual('exp_id0');
    expect(collectionPlaythroughObject.getCompletedExplorationIds())
      .toEqual(['exp_id1']);
  });

  it('should create a new CollectionPlaythrough instance from create', () => {
    let collectionPlaythroughObject = CollectionPlaythrough.create(
      'exp_id0', ['exp_id1']);
    expect(collectionPlaythroughObject.getNextExplorationId())
      .toEqual('exp_id0');
    expect(collectionPlaythroughObject.getCompletedExplorationIds())
      .toEqual(['exp_id1']);
  });

  it('should get the correct next exploration id', () => {
    var collectionPlaythroughBackendDict = {
      next_exploration_id: 'exp_id0',
      completed_exploration_ids: ['exp_id1']
    };
    let collectionPlaythroughObject = CollectionPlaythrough
      .createFromBackendObject(collectionPlaythroughBackendDict);
    expect(collectionPlaythroughObject.getNextExplorationId())
      .toEqual('exp_id0');
  });

  it('should get 1 for next recommended collection node count', () => {
    var collectionPlaythroughBackendDict = {
      next_exploration_id: 'exp_id0',
      completed_exploration_ids: ['exp_id1']
    };
    let collectionPlaythroughObject = CollectionPlaythrough
      .createFromBackendObject(collectionPlaythroughBackendDict);
    expect(collectionPlaythroughObject
      .getNextRecommendedCollectionNodeCount()).toEqual(1);
  });

  it('should get the completed exploration ids', () => {
    var collectionPlaythroughBackendDict = {
      next_exploration_id: 'exp_id0',
      completed_exploration_ids: ['exp_id1']
    };
    let collectionPlaythroughObject = CollectionPlaythrough
      .createFromBackendObject(collectionPlaythroughBackendDict);
    expect(collectionPlaythroughObject
      ._completedExplorationIds).toEqual(['exp_id1']);
  });

  it('should get the completed exploration node count', () => {
    var collectionPlaythroughBackendDict = {
      next_exploration_id: 'exp_id0',
      completed_exploration_ids: ['exp_id1']
    };
    let collectionPlaythroughObject = CollectionPlaythrough
      .createFromBackendObject(collectionPlaythroughBackendDict);
    expect(collectionPlaythroughObject.getCompletedExplorationNodeCount())
      .toEqual(1);
  });

  it('should get whether the collection is started when no exploration is' +
    'completed',
    () => {
    var collectionPlaythroughBackendDict = {
      next_exploration_id: 'exp_id0',
      completed_exploration_ids: []
    };
    let collectionPlaythroughObject = CollectionPlaythrough
      .createFromBackendObject(collectionPlaythroughBackendDict);
    expect(collectionPlaythroughObject.hasStartedCollection())
      .toEqual(false);
    }
  );

  it(
      'should get whether the collection is started when any exploration is' +
      'completed',
    () => {
      var collectionPlaythroughBackendDict = {
        next_exploration_id: 'exp_id0',
        completed_exploration_ids: ['exp_id1']
      };
      let collectionPlaythroughObject = CollectionPlaythrough
        .createFromBackendObject(collectionPlaythroughBackendDict);
      expect(collectionPlaythroughObject.hasStartedCollection())
        .toEqual(true);
  });

  it(
      'should get whether the collection is finished when a next' + 
      'exploration is available', () => {
      var collectionPlaythroughBackendDict = {
        next_exploration_id: 'exp_id0',
        completed_exploration_ids: ['exp_id1']
      };
      let collectionPlaythroughObject = CollectionPlaythrough
        .createFromBackendObject(collectionPlaythroughBackendDict);
      expect(collectionPlaythroughObject.hasFinishedCollection())
        .toEqual(false);
  });

  it(
    'should get whether the collection is finished when a next' + 
    'exploration is not available', () => {
    var collectionPlaythroughBackendDict = {
      next_exploration_id: null,
      completed_exploration_ids: ['exp_id1']
    };
    let collectionPlaythroughObject = CollectionPlaythrough
      .createFromBackendObject(collectionPlaythroughBackendDict);
    expect(collectionPlaythroughObject.hasFinishedCollection())
      .toEqual(true);
  });
})