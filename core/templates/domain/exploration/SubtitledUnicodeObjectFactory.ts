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
 * @fileoverview Factory for creating new frontend instances of SubtitledUnicode
 * domain objects.
 */

export interface ISubtitledUnicodeBackendDict {
  'content_id': string;
  'unicode_str': string;
}

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

export class SubtitledUnicode {
  constructor(
    public unicode: string,
    readonly contentId: string) {}

  hasNoUnicode(): boolean {
    return !this.unicode;
  }

  toBackendDict(): ISubtitledUnicodeBackendDict {
    return {
      unicode_str: this.unicode,
      content_id: this.contentId
    };
  }

  isEmpty(): boolean {
    return this.hasNoUnicode();
  }
}

@Injectable({
  providedIn: 'root'
})
export class SubtitledUnicodeObjectFactory {
  createFromBackendDict(
      subtitledUnicodeBackendDict: ISubtitledUnicodeBackendDict
  ): SubtitledUnicode {
    return new SubtitledUnicode(
      subtitledUnicodeBackendDict.unicode_str,
      subtitledUnicodeBackendDict.content_id);
  }

  createDefault(unicode: string, contentId: string): SubtitledUnicode {
    return new SubtitledUnicode(unicode, contentId);
  }
}

angular.module('oppia').factory(
  'SubtitledUnicodeObjectFactory',
  downgradeInjectable(SubtitledUnicodeObjectFactory));
