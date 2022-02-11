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
 * @fileoverview Model class for creating instances of frontend
 * exploration metadata domain objects.
 */

export interface ExplorationMetaDataBackendDict {
  id: string;
  objective: string;
  title: string;
}

export class ExplorationMetadata {
  constructor(
    public id: string,
    public objective: string,
    public title: string) {}

  static createFromBackendDict(
      explorationMetadataBackendDict: ExplorationMetaDataBackendDict):
        ExplorationMetadata {
    return new ExplorationMetadata(
      explorationMetadataBackendDict.id,
      explorationMetadataBackendDict.objective,
      explorationMetadataBackendDict.title);
  }
}
