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
 * study guide domain objects.
 */

import cloneDeep from 'lodash/cloneDeep';
import {
  StudyGuideSection,
  StudyGuideSectionBackendDict,
} from './study-guide-sections.model';
import {AppConstants} from 'app.constants';

export interface StudyGuideBackendDict {
  id: string;
  topic_id: string;
  sections: StudyGuideSectionBackendDict[];
  next_content_id_index: number;
  language_code: string;
}

export class StudyGuide {
  constructor(
    private id: string,
    private topicId: string,
    private sections: StudyGuideSection[],
    private nextContentIdIndex: number,
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

  getSections(): StudyGuideSection[] {
    return this.sections;
  }

  // Sets the sections data for the study guide.
  setSections(sections: StudyGuideSection[]): void {
    this.sections = sections;
  }

  getNextContentIdIndex(): number {
    return this.nextContentIdIndex;
  }

  setNextContentIdIndex(newNextContentIdIndex: number): void {
    this.nextContentIdIndex = newNextContentIdIndex;
  }

  // Returns the language code for the study guide.
  getLanguageCode(): string {
    return this.languageCode;
  }

  copyFromStudyGuide(otherStudyGuide: StudyGuide): void {
    this.id = otherStudyGuide.getId();
    this.topicId = otherStudyGuide.getTopicId();
    this.sections = cloneDeep(otherStudyGuide.getSections());
    this.nextContentIdIndex = otherStudyGuide.nextContentIdIndex;
    this.languageCode = otherStudyGuide.getLanguageCode();
  }

  static createFromBackendDict(
    studyGuideBackendDict: StudyGuideBackendDict
  ): StudyGuide {
    let sections = studyGuideBackendDict.sections.map(section =>
      StudyGuideSection.createFromBackendDict(section)
    );
    return new StudyGuide(
      studyGuideBackendDict.id,
      studyGuideBackendDict.topic_id,
      sections,
      studyGuideBackendDict.next_content_id_index,
      studyGuideBackendDict.language_code
    );
  }

  static getStudyGuideId(topicId: string, subtopicId: number): string {
    return topicId + '-' + subtopicId.toString();
  }

  static createDefault(topicId: string, subtopicId: number): StudyGuide {
    let sections: StudyGuideSection[] = [];
    sections.push(
      StudyGuideSection.createDefault(
        AppConstants.DEFAULT_SECTION_HEADING_CONTENT_ID,
        AppConstants.DEFAULT_SECTION_CONTENT_CONTENT_ID
      )
    );
    return new StudyGuide(
      this.getStudyGuideId(topicId, subtopicId),
      topicId,
      sections,
      2,
      'en'
    );
  }
}
