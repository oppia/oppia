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
 * @fileoverview Frontend Model for translatable texts
 */

import {
  TranslatableItem,
  TranslatableItemBackendDict,
} from './translatable-content.model';

export interface ContentIdToContentBackendDictMapping {
  [contentId: string]: TranslatableItemBackendDict;
}

export interface StateNamesToContentIdBackendDictMapping {
  [state: string]: ContentIdToContentBackendDictMapping;
}
export interface ContentIdToContentMapping {
  [contentId: string]: TranslatableItem;
}

export interface StateNamesToContentIdMapping {
  [state: string]: ContentIdToContentMapping;
}

export interface TranslatableTextsBackendDict {
  state_names_to_content_id_mapping: StateNamesToContentIdBackendDictMapping;
  version: string;
}

export class TranslatableTexts {
  constructor(
    private readonly stateNamesToContentIdMapping: StateNamesToContentIdMapping,
    private readonly version: string
  ) {}

  static createFromBackendDict(
    backendDict: TranslatableTextsBackendDict
  ): TranslatableTexts {
    const stateNamesToContentIdMapping: StateNamesToContentIdMapping = {};
    for (let stateName in backendDict.state_names_to_content_id_mapping) {
      const contentIdToWrittenTranslationMapping =
        backendDict.state_names_to_content_id_mapping[stateName];
      const contentIdMapping: ContentIdToContentMapping = {};
      for (const contentId in contentIdToWrittenTranslationMapping) {
        contentIdMapping[contentId] = TranslatableItem.createFromBackendDict(
          contentIdToWrittenTranslationMapping[contentId]
        );
      }
      stateNamesToContentIdMapping[stateName] = contentIdMapping;
    }
    return new TranslatableTexts(
      stateNamesToContentIdMapping,
      backendDict.version
    );
  }

  get stateWiseContents(): StateNamesToContentIdMapping {
    return this.stateNamesToContentIdMapping;
  }

  get explorationVersion(): string {
    return this.version;
  }
}
