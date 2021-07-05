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

/**
 * @fileoverview Unit tests for NonExistentActivities.
 */

import { NonExistentActivities } from
  'domain/learner_dashboard/non-existent-activities.model';

describe('Non existent activities model', () => {
  it('should correctly convert backend dict to object', () => {
    let backendDict = {
      incomplete_explorations: 1,
      incomplete_collections: 2,
      partially_learnt_topics: 3,
      completed_explorations: 4,
      completed_collections: 5,
      completed_stories: 6,
      learnt_topics: 7,
      topics_to_learn: 8,
      exploration_playlist: 9,
      collection_playlist: 10
    };

    let object = NonExistentActivities.createFromBackendDict(backendDict);

    expect(object.incompleteExplorations).toEqual(1);
    expect(object.incompleteCollections).toEqual(2);
    expect(object.partiallyLearntTopics).toEqual(3);
    expect(object.completedExplorations).toEqual(4);
    expect(object.completedCollections).toEqual(5);
    expect(object.completedStories).toEqual(6);
    expect(object.learntTopics).toEqual(7);
    expect(object.topicsToLearn).toEqual(8);
    expect(object.explorationPlaylist).toEqual(9);
    expect(object.collectionPlaylist).toEqual(10);
  });
});
