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
 * @fileoverview Frontend model for the number of non existent
 * explorations.
 */

export interface NonExistentExplorationsBackendDict {
  'incomplete_explorations': number;
  'completed_explorations': number;
  'exploration_playlist': number;
}

export class NonExistentExplorations {
  constructor(
    public incompleteExplorations: number,
    public completedExplorations: number,
    public explorationPlaylist: number) { }

  static createFromBackendDict(
      backendDict: NonExistentExplorationsBackendDict):
      NonExistentExplorations {
    return new NonExistentExplorations(
      backendDict.incomplete_explorations,
      backendDict.completed_explorations,
      backendDict.exploration_playlist);
  }
}
