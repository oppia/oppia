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
 * @fileoverview Factory for creating new frontend instances of SubtitledHtml
 * domain objects.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

export interface SubtitledHtmlBackendDict {
  'content_id': string;
  'html': string;
}

export class SubtitledHtml {
  _html: string;
  // A null content_id indicates that the SubtitledHtml has been created
  // but not saved. Before the SubtitledHtml object is saved into a State,
  // the content_id should be set to a string.
  _contentId: string;
  constructor(html: string, contentId: string) {
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

  get contentId(): string {
    return this._contentId;
  }

  set contentId(contentId: string) {
    this._contentId = contentId;
  }

  get html(): string {
    return this._html;
  }

  set html(html: string) {
    this._html = html;
  }
}

@Injectable({
  providedIn: 'root'
})
export class SubtitledHtmlObjectFactory {
  createFromBackendDict(
      subtitledHtmlBackendDict: SubtitledHtmlBackendDict): SubtitledHtml {
    return new SubtitledHtml(
      subtitledHtmlBackendDict.html, subtitledHtmlBackendDict.content_id);
  }

  createDefault(html: string, contentId: string): SubtitledHtml {
    return new SubtitledHtml(html, contentId);
  }
}

angular.module('oppia').factory(
  'SubtitledHtmlObjectFactory',
  downgradeInjectable(SubtitledHtmlObjectFactory));
