// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Model for creating new frontend instances of SubtitledHtml
 * domain objects.
 */

export interface SubtitledHtmlBackendDict {
  'content_id': string | null;
  'html': string;
}

export class SubtitledHtml {
  _html: string;
  // A null 'content_id' indicates that the 'SubtitledHtml' has been created
  // but not saved. Before the 'SubtitledHtml' object is saved into a State,
  // the 'content_id' should be set to a string.
  _contentId: string | null;
  constructor(html: string, contentId: string | null) {
    this._html = html;
    this._contentId = contentId;
  }

  toBackendDict(): SubtitledHtmlBackendDict {
    return {
      html: this._html,
      content_id: this._contentId
    };
  }

  isEmpty(): boolean {
    return !this._html;
  }

  get contentId(): string | null {
    return this._contentId;
  }

  set contentId(contentId: string | null) {
    this._contentId = contentId;
  }

  get html(): string {
    return this._html;
  }

  set html(html: string) {
    this._html = html;
  }

  static createFromBackendDict(
      subtitledHtmlBackendDict: SubtitledHtmlBackendDict): SubtitledHtml {
    return new SubtitledHtml(
      subtitledHtmlBackendDict.html, subtitledHtmlBackendDict.content_id);
  }

  static createDefault(html: string, contentId: string): SubtitledHtml {
    return new SubtitledHtml(html, contentId);
  }
}
