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
 * SubtitledSetOfUnicodeString domain objects.
 */

export interface SubtitledSetOfUnicodeStringBackendDict {
  'content_id': string;
  'unicode_str_set': string[];
}

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

export class SubtitledSetOfUnicodeString {
  // A null content_id indicates that the SubtitledHtml has been created
  // but not saved. Before the SubtitledHtml object is saved into a State,
  // the content_id should be set to a string.
  constructor(
    private _unicodeStrings: string[],
    private _contentId: string | null
  ) {}

  getUnicodeStrings(): string[] {
    return this._unicodeStrings;
  }

  getContentId(): string {
    return this._contentId;
  }

  setContentId(newContentId: string): void {
    this._contentId = newContentId;
  }

  toBackendDict(): SubtitledSetOfUnicodeStringBackendDict {
    return {
      unicode_str_set: this._unicodeStrings,
      content_id: this._contentId
    };
  }
}

@Injectable({
  providedIn: 'root'
})
export class SubtitledSetOfUnicodeStringObjectFactory {
  createFromBackendDict(
      subtitledUnicodeBackendDict: SubtitledSetOfUnicodeStringBackendDict
  ): SubtitledSetOfUnicodeString {
    return new SubtitledSetOfUnicodeString(
      subtitledUnicodeBackendDict.unicode_str_set,
      subtitledUnicodeBackendDict.content_id);
  }

  createDefault():
      SubtitledSetOfUnicodeString {
    return new SubtitledSetOfUnicodeString([], null);
  }
}

angular.module('oppia').factory(
  'SubtitledSetOfUnicodeStringObjectFactory',
  downgradeInjectable(SubtitledSetOfUnicodeStringObjectFactory));
