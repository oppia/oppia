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

export interface ISubtitledHtmlBackendDict {
  'content_id': string;
  html: string;
}

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

export class SubtitledHtml {
  _html: string;
  _contentId: string;
  constructor(html: string, contentId: string) {
    this._html = html;
    this._contentId = contentId;
  }

  getHtml(): string {
    return this._html;
  }

  getContentId(): string {
    return this._contentId;
  }

  setHtml(newHtml: string): void {
    this._html = newHtml;
  }

  hasNoHtml(): boolean {
    return !this._html;
  }

  toBackendDict(): ISubtitledHtmlBackendDict {
    return {
      html: this._html,
      content_id: this._contentId
    };
  }

  isEmpty(): boolean {
    return this.hasNoHtml();
  }
}

@Injectable({
  providedIn: 'root'
})
export class SubtitledHtmlObjectFactory {
  createFromBackendDict(
      subtitledHtmlBackendDict: ISubtitledHtmlBackendDict): SubtitledHtml {
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
