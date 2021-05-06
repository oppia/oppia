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
 * @fileoverview Frontend model for the number of non existent
 * activities.
 */

export interface NonExistentActivitiesBackendDict {
  'incomplete_explorations': number;
  'incomplete_collections': number;
  'completed_explorations': number;
  'completed_collections': number;
  'exploration_playlist': number;
  'collection_playlist': number;
}

export class NonExistentActivities {
  constructor(
    public incompleteExplorations: number,
    public incompleteCollections: number,
    public completedExplorations: number,
    public completedCollections: number,
    public explorationPlaylist: number,
    public collectionPlaylist: number) { }

  static createFromBackendDict(
      backendDict: NonExistentActivitiesBackendDict): NonExistentActivities {
    return new NonExistentActivities(
      backendDict.incomplete_explorations,
      backendDict.incomplete_collections,
      backendDict.completed_explorations,
      backendDict.completed_collections,
      backendDict.exploration_playlist,
      backendDict.collection_playlist);
  }
}
