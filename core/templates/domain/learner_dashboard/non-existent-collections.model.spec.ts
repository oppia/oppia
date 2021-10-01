// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for NonExistentCollections.
 */

import { NonExistentCollections } from
  'domain/learner_dashboard/non-existent-collections.model';

describe('Non existent collections model', () => {
  it('should correctly convert backend dict to object', () => {
    let backendDict = {
      incomplete_collections: 1,
      completed_collections: 2,
      collection_playlist: 3
    };

    let object = NonExistentCollections.createFromBackendDict(backendDict);

    expect(object.incompleteCollections).toEqual(1);
    expect(object.completedCollections).toEqual(2);
    expect(object.collectionPlaylist).toEqual(3);
  });
});
