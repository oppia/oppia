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
    const collectionPlaythroughObject = new CollectionPlaythrough(
      'exp_id0', ['exp_id1']);
    expect(collectionPlaythroughObject.getNextExplorationId())
      .toEqual('exp_id0');
    expect(collectionPlaythroughObject.getCompletedExplorationIds())
      .toEqual(['exp_id1']);
  });

  it('should create a new CollectionPlaythrough instance from create', () => {
    const collectionPlaythroughObject = CollectionPlaythrough.create(
      'exp_id0', ['exp_id1']);
    expect(collectionPlaythroughObject.getNextExplorationId())
      .toEqual('exp_id0');
    expect(collectionPlaythroughObject.getCompletedExplorationIds())
      .toEqual(['exp_id1']);
  });

  it('should get the correct next exploration id', () => {
    const collectionPlaythroughBackendDict = {
      next_exploration_id: 'exp_id0',
      completed_exploration_ids: ['exp_id1']
    };
    const collectionPlaythroughObject = CollectionPlaythrough
      .createFromBackendObject(collectionPlaythroughBackendDict);
    expect(collectionPlaythroughObject.getNextExplorationId())
      .toEqual('exp_id0');
  });

  it('should get next recommended collection node count', () => {
    const collectionPlaythroughBackendDict = {
      next_exploration_id: 'exp_id0',
      completed_exploration_ids: ['exp_id1']
    };
    const collectionPlaythroughObject = CollectionPlaythrough
      .createFromBackendObject(collectionPlaythroughBackendDict);
    expect(
      collectionPlaythroughObject.getNextRecommendedCollectionNodeCount()
    ).toEqual(1);
  });

  it('should get the completed exploration ids', () => {
    const collectionPlaythroughBackendDictCase1 = {
      next_exploration_id: 'exp_id0',
      completed_exploration_ids: ['exp_id1']
    };
    const collectionPlaythroughBackendDictCase2 = {
      next_exploration_id: 'exp_id0',
      completed_exploration_ids: []
    };
    const collectionPlaythroughBackendDictCase3 = {
      next_exploration_id: 'exp_id0',
      completed_exploration_ids: ['exp_id1', 'exp_id2']
    };
    const collectionPlaythroughObjectCase1 = CollectionPlaythrough
      .createFromBackendObject(collectionPlaythroughBackendDictCase1);
    const collectionPlaythroughObjectCase2 = CollectionPlaythrough
      .createFromBackendObject(collectionPlaythroughBackendDictCase2);
    const collectionPlaythroughObjectCase3 = CollectionPlaythrough
      .createFromBackendObject(collectionPlaythroughBackendDictCase3);
    expect(
      collectionPlaythroughObjectCase1._completedExplorationIds
    ).toEqual(['exp_id1']);
    expect(
      collectionPlaythroughObjectCase2._completedExplorationIds
    ).toEqual([]);
    expect(
      collectionPlaythroughObjectCase3._completedExplorationIds
    ).toEqual(['exp_id1', 'exp_id2']);
  });

  it('should get the completed exploration node count', () => {
    const collectionPlaythroughBackendDictCase1 = {
      next_exploration_id: 'exp_id0',
      completed_exploration_ids: ['exp_id1']
    };
    const collectionPlaythroughBackendDictCase2 = {
      next_exploration_id: 'exp_id0',
      completed_exploration_ids: []
    };
    const collectionPlaythroughBackendDictCase3 = {
      next_exploration_id: 'exp_id0',
      completed_exploration_ids: ['exp_id1', 'exp_id2']
    };
    const collectionPlaythroughObjectCase1 = CollectionPlaythrough
      .createFromBackendObject(collectionPlaythroughBackendDictCase1);
    const collectionPlaythroughObjectCase2 = CollectionPlaythrough
      .createFromBackendObject(collectionPlaythroughBackendDictCase2);
    const collectionPlaythroughObjectCase3 = CollectionPlaythrough
      .createFromBackendObject(collectionPlaythroughBackendDictCase3);
    expect(collectionPlaythroughObjectCase1.getCompletedExplorationNodeCount())
      .toEqual(1);
    expect(collectionPlaythroughObjectCase2.getCompletedExplorationNodeCount())
      .toEqual(0);
    expect(collectionPlaythroughObjectCase3.getCompletedExplorationNodeCount())
      .toEqual(2);
  });

  it('should return collection is not started when no exploration is' +
    'completed', () => {
    const collectionPlaythroughBackendDict = {
      next_exploration_id: 'exp_id0',
      completed_exploration_ids: []
    };
    const collectionPlaythroughObject = CollectionPlaythrough
      .createFromBackendObject(collectionPlaythroughBackendDict);
    expect(collectionPlaythroughObject.hasStartedCollection())
      .toEqual(false);
  }
  );

  it('should return collection is started when any exploration is' +
    'completed', () => {
    const collectionPlaythroughBackendDict = {
      next_exploration_id: 'exp_id0',
      completed_exploration_ids: ['exp_id1']
    };
    const collectionPlaythroughObject = CollectionPlaythrough
      .createFromBackendObject(collectionPlaythroughBackendDict);
    expect(collectionPlaythroughObject.hasStartedCollection())
      .toEqual(true);
  });

  it('should return collection is finished when a next' +
    'exploration is available', () => {
    const collectionPlaythroughBackendDict = {
      next_exploration_id: 'exp_id0',
      completed_exploration_ids: ['exp_id1']
    };
    const collectionPlaythroughObject = CollectionPlaythrough
      .createFromBackendObject(collectionPlaythroughBackendDict);
    expect(collectionPlaythroughObject.hasFinishedCollection())
      .toEqual(false);
  });

  it('should return collection is not finished when a next' +
    'exploration is not available', () => {
    const collectionPlaythroughBackendDict = {
      next_exploration_id: null,
      completed_exploration_ids: ['exp_id1']
    };
    const collectionPlaythroughObject = CollectionPlaythrough
      .createFromBackendObject(collectionPlaythroughBackendDict);
    expect(collectionPlaythroughObject.hasFinishedCollection())
      .toEqual(true);
  });
});
