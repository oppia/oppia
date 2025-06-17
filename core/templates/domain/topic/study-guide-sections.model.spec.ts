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
 * @fileoverview Unit tests for study-guide-section.model.
 */

import {SubtitledHtml} from 'domain/exploration/subtitled-html.model';
import {SubtitledUnicode} from 'domain/exploration/subtitled-unicode.model';
import {
  StudyGuideSectionBackendDict,
  StudyGuideSection,
} from 'domain/topic/study-guide-sections.model';

describe('StudyGuideSection object factory', () => {
  let studyGuideSectionBackendDict: StudyGuideSectionBackendDict;
  let sampleStudyGuideSection: StudyGuideSection;

  beforeEach(() => {
    studyGuideSectionBackendDict = {
      heading: {
        content_id: 'section_heading_0',
        unicode_str: 'section heading',
      },
      content: {
        content_id: 'section_content_1',
        html: '<p>section content 1</p>',
      },
    };

    sampleStudyGuideSection = StudyGuideSection.createFromBackendDict(
      studyGuideSectionBackendDict
    );
  });

  it('should create a new study guide section from a backend dictionary', () => {
    let studyGuideSection = StudyGuideSection.createFromBackendDict(
      studyGuideSectionBackendDict
    );
    expect(studyGuideSection.getHeading()).toEqual(
      SubtitledUnicode.createDefault('section heading', 'section_heading_0')
    );
    expect(studyGuideSection.getContent()).toEqual(
      SubtitledHtml.createDefault(
        '<p>section content 1</p>',
        'section_content_1'
      )
    );
  });

  it('should convert to a backend dictionary', () => {
    let studyGuideSection = StudyGuideSection.createFromBackendDict(
      studyGuideSectionBackendDict
    );
    expect(studyGuideSection.toBackendDict()).toEqual(
      studyGuideSectionBackendDict
    );
  });

  it('should set and get heading', () => {
    let newHeading = SubtitledUnicode.createDefault(
      'new heading',
      'new_heading_id'
    );

    sampleStudyGuideSection.setHeading(newHeading);

    expect(sampleStudyGuideSection.getHeading()).toEqual(newHeading);
  });

  it('should get heading text', () => {
    expect(sampleStudyGuideSection.getHeadingText()).toBe('section heading');
  });

  it('should set heading plaintext', () => {
    sampleStudyGuideSection.setHeadingPlaintext('updated heading text');

    expect(sampleStudyGuideSection.getHeadingText()).toBe(
      'updated heading text'
    );
  });

  it('should set and get content', () => {
    let newContent = SubtitledHtml.createDefault(
      '<p>new content</p>',
      'new_content_id'
    );

    sampleStudyGuideSection.setContent(newContent);

    expect(sampleStudyGuideSection.getContent()).toEqual(newContent);
  });

  it('should get content HTML', () => {
    expect(sampleStudyGuideSection.getContentHtml()).toBe(
      '<p>section content 1</p>'
    );
  });

  it('should set content HTML', () => {
    sampleStudyGuideSection.setContentHtml('<div>updated content</div>');

    expect(sampleStudyGuideSection.getContentHtml()).toBe(
      '<div>updated content</div>'
    );
  });
});
