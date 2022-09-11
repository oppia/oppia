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
 * @fileoverview Frontend Model for translatable item.
 */

export interface TranslatableItemBackendDict {
  'content_value': string | string[];
  'content_format': string;
  'content_type': string;
  'interaction_id': string | null;
  'rule_type': string | null;
}

export class TranslatableItem {
  constructor(
    readonly content: string | string[],
    readonly dataFormat: string,
    readonly contentType: string,
    readonly interactionId: string | null,
    readonly ruleType: string | null
  ) {}

  static createFromBackendDict(
      backendDict: TranslatableItemBackendDict): TranslatableItem {
    return new TranslatableItem(
      backendDict.content_value,
      backendDict.content_format,
      backendDict.content_type,
      backendDict.interaction_id,
      backendDict.rule_type);
  }
}
