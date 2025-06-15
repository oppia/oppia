// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * study guide section domain objects.
 */

import {
  SubtitledHtmlBackendDict,
  SubtitledHtml,
} from 'domain/exploration/subtitled-html.model';
import {
  SubtitledUnicode,
  SubtitledUnicodeBackendDict,
} from 'domain/exploration/subtitled-unicode.model';

export interface StudyGuideSectionBackendDict {
  heading: SubtitledUnicodeBackendDict;
  content: SubtitledHtmlBackendDict;
}

export class StudyGuideSection {
  heading: SubtitledUnicode;
  content: SubtitledHtml;
  constructor(heading: SubtitledUnicode, content: SubtitledHtml) {
    this.heading = heading;
    this.content = content;
  }

  getHeading(): SubtitledUnicode {
    return this.heading;
  }

  setHeading(newHeading: SubtitledUnicode): void {
    this.heading = newHeading;
  }

  getHeadingText(): string {
    return this.heading.unicode;
  }

  setHeadingPlaintext(unicode: string): void {
    this.heading.unicode = unicode;
  }

  getContent(): SubtitledHtml {
    return this.content;
  }

  setContent(newContent: SubtitledHtml): void {
    this.content = newContent;
  }

  getContentHtml(): string {
    return this.content.html;
  }

  setContentHtml(html: string): void {
    this.content.html = html;
  }

  toBackendDict(): StudyGuideSectionBackendDict {
    return {
      heading: this.heading.toBackendDict(),
      content: this.content.toBackendDict(),
    };
  }

  static create(
    headingPlaintext: string,
    contentHtml: string,
    headingContentId: string,
    contentContentId: string
  ): StudyGuideSection {
    return new StudyGuideSection(
      SubtitledUnicode.createDefault(headingPlaintext, headingContentId),
      SubtitledHtml.createDefault(contentHtml, contentContentId)
    );
  }

  static createDefault(
    headingContentId: string,
    contentContentId: string
  ): StudyGuideSection {
    return new StudyGuideSection(
      SubtitledUnicode.createDefault('', headingContentId),
      SubtitledHtml.createDefault('', contentContentId)
    );
  }

  static createFromBackendDict(
    backendDict: StudyGuideSectionBackendDict
  ): StudyGuideSection {
    return new StudyGuideSection(
      SubtitledUnicode.createFromBackendDict(backendDict.heading),
      SubtitledHtml.createFromBackendDict(backendDict.content)
    );
  }
}
