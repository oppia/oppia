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
 * @fileoverview Factory for creating new frontend instances of
 * SubtitledSetOfNormalizedString domain objects.
 */

export interface SubtitledSetOfNormalizedStringBackendDict {
  'content_id': string;
  'normalized_str_set': string[];
}

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

export class SubtitledSetOfNormalizedString {
  // A null content_id indicates that the SubtitledHtml has been created
  // but not saved. Before the SubtitledHtml object is saved into a State,
  // the content_id should be set to a string.
  constructor(
    private _normalizedStrings: string[],
    private _contentId: string | null
  ) {}

  getNormalizedStrings(): string[] {
    return this._normalizedStrings;
  }

  getContentId(): string | null {
    return this._contentId;
  }

  setContentId(newContentId: string): void {
    this._contentId = newContentId;
  }

  toBackendDict(): SubtitledSetOfNormalizedStringBackendDict {
    if (this._contentId === null) {
      throw new Error('Content id is null');
    }

    return {
      normalized_str_set: this._normalizedStrings,
      content_id: this._contentId
    };
  }
}

@Injectable({
  providedIn: 'root'
})
export class SubtitledSetOfNormalizedStringObjectFactory {
  createFromBackendDict(
      subtitledUnicodeBackendDict: SubtitledSetOfNormalizedStringBackendDict
  ): SubtitledSetOfNormalizedString {
    return new SubtitledSetOfNormalizedString(
      subtitledUnicodeBackendDict.normalized_str_set,
      subtitledUnicodeBackendDict.content_id);
  }

  createDefault():
      SubtitledSetOfNormalizedString {
    return new SubtitledSetOfNormalizedString([], null);
  }
}

angular.module('oppia').factory(
  'SubtitledSetOfNormalizedStringObjectFactory',
  downgradeInjectable(SubtitledSetOfNormalizedStringObjectFactory));
