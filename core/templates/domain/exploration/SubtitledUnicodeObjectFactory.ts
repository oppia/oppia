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

export interface SubtitledUnicodeBackendDict {
  content_id: string | null;
  unicode_str: string;
}

import {Injectable} from '@angular/core';

export class SubtitledUnicode {
  // A null 'content_id' indicates that the 'SubtitledHtml' has been created
  // but not saved. Before the 'SubtitledHtml' object is saved into a State,
  // the 'content_id' should be set to a string.
  constructor(
    private _unicode: string,
    private _contentId: string | null
  ) {}

  toBackendDict(): SubtitledUnicodeBackendDict {
    return {
      unicode_str: this._unicode,
      content_id: this._contentId,
    };
  }

  isEmpty(): boolean {
    return !this._unicode;
  }

  get contentId(): string | null {
    return this._contentId;
  }

  set contentId(contentId: string | null) {
    this._contentId = contentId;
  }

  get unicode(): string {
    return this._unicode;
  }

  set unicode(unicode: string) {
    this._unicode = unicode;
  }
}

@Injectable({
  providedIn: 'root',
})
export class SubtitledUnicodeObjectFactory {
  createFromBackendDict(
    subtitledUnicodeBackendDict: SubtitledUnicodeBackendDict
  ): SubtitledUnicode {
    return new SubtitledUnicode(
      subtitledUnicodeBackendDict.unicode_str,
      subtitledUnicodeBackendDict.content_id
    );
  }

  createDefault(unicode: string, contentId: string | null): SubtitledUnicode {
    return new SubtitledUnicode(unicode, contentId);
  }
}
