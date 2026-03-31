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
  SubtopicPageContents,
} from 'domain/topic/subtopic-page-contents.model';

export interface SubtopicPageBackendDict {
  id: string;
  topic_id: string;
  page_contents: SubtopicPageContentsBackendDict;
  language_code: string;
}

export class SubtopicPage {
  constructor(
    private id: string,
    private topicId: string,
    private pageContents: SubtopicPageContents,
    private languageCode: string
  ) {}

  getId(): string {
    return this.id;
  }

  setId(id: string): void {
    this.id = id;
  }

  getTopicId(): string {
    return this.topicId;
  }

  getPageContents(): SubtopicPageContents {
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
    subtopicPageBackendDict: SubtopicPageBackendDict
  ): SubtopicPage {
    return new SubtopicPage(
      subtopicPageBackendDict.id,
      subtopicPageBackendDict.topic_id,
      SubtopicPageContents.createFromBackendDict(
        subtopicPageBackendDict.page_contents
      ),
      subtopicPageBackendDict.language_code
    );
  }

  static getSubtopicPageId(topicId: string, subtopicId: number): string {
    return topicId + '-' + subtopicId.toString();
  }

  static createDefault(topicId: string, subtopicId: number): SubtopicPage {
    return new SubtopicPage(
      this.getSubtopicPageId(topicId, subtopicId),
      topicId,
      SubtopicPageContents.createDefault(),
      'en'
    );
  }
}
