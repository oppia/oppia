// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Model for creating instances of frontend
 * subtopic data domain objects.
 */

import {
  StudyGuideSection,
  StudyGuideSectionBackendDict,
} from 'domain/topic/study-guide-sections.model';
import {
  SubtopicPageContentsBackendDict,
  SubtopicPageContents,
} from 'domain/topic/subtopic-page-contents.model';
import {SubtopicBackendDict, Subtopic} from 'domain/topic/subtopic.model';

// Remove null from sections type and deprecate page_contents
// once study guides become standard.
export interface SubtopicDataBackendDict {
  subtopic_title: string;
  sections: StudyGuideSectionBackendDict[] | null;
  page_contents: SubtopicPageContentsBackendDict | null;
  current_subtopic_id: number;
  next_subtopic_dict: SubtopicBackendDict | null;
  prev_subtopic_dict: SubtopicBackendDict | null;
  topic_id: string;
  topic_name: string;
}

export class ReadOnlySubtopicPageData {
  parentTopicId: string;
  parentTopicName: string;
  subtopicTitle: string;
  sections: StudyGuideSection[] | null;
  pageContents: SubtopicPageContents | null;
  currentSubtopicId: number;
  nextSubtopic: Subtopic | null;
  prevSubtopic: Subtopic | null;

  constructor(
    parentTopicId: string,
    parentTopicName: string,
    subtopicTitle: string,
    currentSubtopicId: number,
    nextSubtopic: Subtopic | null,
    prevSubtopic: Subtopic | null,
    sections: StudyGuideSection[] | null,
    pageContents: SubtopicPageContents | null
  ) {
    this.parentTopicId = parentTopicId;
    this.parentTopicName = parentTopicName;
    this.subtopicTitle = subtopicTitle;
    this.sections = sections;
    this.pageContents = pageContents;
    this.currentSubtopicId = currentSubtopicId;
    this.nextSubtopic = nextSubtopic;
    this.prevSubtopic = prevSubtopic;
  }

  getParentTopicId(): string {
    return this.parentTopicId;
  }

  getParentTopicName(): string {
    return this.parentTopicName;
  }

  getSubtopicTitle(): string {
    return this.subtopicTitle;
  }

  getPageContents(): SubtopicPageContents | null {
    return this.pageContents;
  }

  getSections(): StudyGuideSection[] | null {
    return this.sections;
  }

  getCurrentSubtopicId(): number {
    return this.currentSubtopicId;
  }

  getNextSubtopic(): Subtopic | null {
    return this.nextSubtopic;
  }

  getPrevSubtopic(): Subtopic | null {
    return this.prevSubtopic;
  }

  static createFromBackendDict(
    subtopicDataBackendDict: SubtopicDataBackendDict
  ): ReadOnlySubtopicPageData {
    let nextSubtopic = subtopicDataBackendDict.next_subtopic_dict
      ? Subtopic.create(subtopicDataBackendDict.next_subtopic_dict, {})
      : null;
    let prevSubtopic = subtopicDataBackendDict.prev_subtopic_dict
      ? Subtopic.create(subtopicDataBackendDict.prev_subtopic_dict, {})
      : null;
    let sections: StudyGuideSection[] = [];
    let pageContents: SubtopicPageContents =
      SubtopicPageContents.createDefault();
    if (subtopicDataBackendDict.sections) {
      sections = subtopicDataBackendDict.sections.map(section =>
        StudyGuideSection.createFromBackendDict(section)
      );
    }
    if (subtopicDataBackendDict.page_contents) {
      pageContents = SubtopicPageContents.createFromBackendDict(
        subtopicDataBackendDict.page_contents
      );
    } else {
      throw new Error('Neither sections nor page_contents provided.');
    }
    return new ReadOnlySubtopicPageData(
      subtopicDataBackendDict.topic_id,
      subtopicDataBackendDict.topic_name,
      subtopicDataBackendDict.subtopic_title,
      subtopicDataBackendDict.current_subtopic_id,
      nextSubtopic,
      prevSubtopic,
      sections,
      pageContents
    );
  }
}
