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
 * @fileoverview Model for creating and mutating instances of frontend
 * subtopic page domain objects.
 */

import cloneDeep from 'lodash/cloneDeep';
import {
  SubtopicPageContentsBackendDict,
  SubtopicPageContents
} from 'domain/topic/subtopic-page-contents.model';

export interface SubtopicPageBackendDict {
  'id': string;
  'topic_id': string;
  'page_contents': SubtopicPageContentsBackendDict;
  'language_code': string;
}

export class SubtopicPage {
  // When creating a subtopicPage, property below are always
  // initialized with null values. These are null until populated
  // from the backend and are not null afterwards.
  constructor(
    private id: string | null,
    private topicId: string | null,
    private pageContents: SubtopicPageContents | null,
    private languageCode: string,
  ) {}

  // Returns 'null' when the subtopic page is not yet saved on the backend.
  // Returns the id of the subtopic page.
  getId(): string | null {
    return this.id;
  }

  setId(id: string): void {
    this.id = id;
  }

  // Returns the topic id that the subtopic page is linked to.
  getTopicId(): string | null {
    return this.topicId;
  }

  // Returns the page data for the subtopic page.
  getPageContents(): SubtopicPageContents | null {
    return this.pageContents;
  }

  // Sets the page data for the subtopic page.
  setPageContents(pageContents: SubtopicPageContents): void {
    this.pageContents = cloneDeep(pageContents);
  }

  // Returns the language code for the subtopic page.
  getLanguageCode(): string {
    return this.languageCode;
  }

  copyFromSubtopicPage(otherSubtopicPage: SubtopicPage): void {
    this.id = otherSubtopicPage.getId();
    this.topicId = otherSubtopicPage.getTopicId();
    this.pageContents = cloneDeep(otherSubtopicPage.getPageContents());
    this.languageCode = otherSubtopicPage.getLanguageCode();
  }

  static createFromBackendDict(
      subtopicPageBackendDict: SubtopicPageBackendDict): SubtopicPage {
    return new SubtopicPage(
      subtopicPageBackendDict.id, subtopicPageBackendDict.topic_id,
      SubtopicPageContents.createFromBackendDict(
        subtopicPageBackendDict.page_contents),
      subtopicPageBackendDict.language_code,
    );
  }

  static getSubtopicPageId(topicId: string, subtopicId: number): string {
    return topicId + '-' + subtopicId.toString();
  }

  static createDefault(topicId: string, subtopicId: number): SubtopicPage {
    return new SubtopicPage(
      this.getSubtopicPageId(topicId, subtopicId),
      topicId, SubtopicPageContents.createDefault(),
      'en');
  }

  // TODO(#14310): Remove the interstitial subtopic so that full subtopic can be
  // created from start.
  // Create an interstitial subtopic that would be displayed in the editor until
  // the actual subtopic is fetched from the backend.
  static createInterstitialSubtopicPage(): SubtopicPage {
    return new SubtopicPage(null, null, null, 'en');
  }
}
