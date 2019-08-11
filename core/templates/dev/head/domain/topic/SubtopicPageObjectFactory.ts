// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Factory for creating and mutating instances of frontend
 * subtopic page domain objects.
 */

import * as cloneDeep from 'lodash/cloneDeep';

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import { SubtopicPageContentsObjectFactory } from
  'domain/topic/SubtopicPageContentsObjectFactory.ts';

export interface ISubtopicPage {
  getId: () => string;
  getTopicId: () => string;
  getPageContents: () => void;
  getLanguageCode: () => string;
}

export class SubtopicPage {
  _id: string;
  _topicId: string;
  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because '_pageContents' is a dict with underscore_cased
  // keys which give tslint errors against underscore_casing in favor of
  // camelCasing.
  _pageContents: any;
  _languageCode: string;
  constructor(
      subtopicPageId: string, topicId: string, pageContents: any,
      languageCode: string) {
    this._id = subtopicPageId;
    this._topicId = topicId;
    this._pageContents = pageContents;
    this._languageCode = languageCode;
  }

  // Returns the id of the subtopic page.
  getId(): string {
    return this._id;
  }

  setId(id: string): void {
    this._id = id;
  }

  // Returns the topic id that the subtopic page is linked to.
  getTopicId(): string {
    return this._topicId;
  }

  // Returns the page data for the subtopic page.
  getPageContents(): any {
    return this._pageContents;
  }

  // Sets the page data for the subtopic page.
  setPageContents(pageContents: any): void {
    this._pageContents = cloneDeep(pageContents);
  }

  // Returns the language code for the subtopic page.
  getLanguageCode(): string {
    return this._languageCode;
  }

  copyFromSubtopicPage(otherSubtopicPage: ISubtopicPage): void {
    this._id = otherSubtopicPage.getId();
    this._topicId = otherSubtopicPage.getTopicId();
    this._pageContents = cloneDeep(otherSubtopicPage.getPageContents());
    this._languageCode = otherSubtopicPage.getLanguageCode();
  }
}

@Injectable({
  providedIn: 'root'
})
export class SubtopicPageObjectFactory {
  constructor(
    private subtopicPageContentsObjectFactory:
      SubtopicPageContentsObjectFactory) {}

  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'subtopicPageBackendDict' is a dict with underscore_cased
  // keys which give tslint errors against underscore_casing in favor of
  // camelCasing.
  createFromBackendDict(subtopicPageBackendDict: any): SubtopicPage {
    return new SubtopicPage(
      subtopicPageBackendDict.id, subtopicPageBackendDict.topic_id,
      this.subtopicPageContentsObjectFactory.createFromBackendDict(
        subtopicPageBackendDict.page_contents),
      subtopicPageBackendDict.language_code
    );
  }

  private getSubtopicPageId(topicId: string, subtopicId: number): string {
    return topicId + '-' + subtopicId.toString();
  }

  createDefault(topicId: string, subtopicId: number): SubtopicPage {
    return new SubtopicPage(
      this.getSubtopicPageId(topicId, subtopicId),
      topicId, this.subtopicPageContentsObjectFactory.createDefault(),
      'en');
  }

  // Create an interstitial subtopic page that would be displayed in the
  // editor until the actual subtopic page is fetched from the backend.
  createInterstitialSubtopicPage(): SubtopicPage {
    return new SubtopicPage(null, null, null, 'en');
  }
}

angular.module('oppia').factory(
  'SubtopicPageObjectFactory', downgradeInjectable(SubtopicPageObjectFactory));
