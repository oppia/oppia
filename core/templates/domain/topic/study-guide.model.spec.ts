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
 * @fileoverview Tests for study-guide Model.
 */

import {TestBed} from '@angular/core/testing';

import {StudyGuide} from 'domain/topic/study-guide.model';
import {StudyGuideSection} from './study-guide-sections.model';

describe('Study Guide Model', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StudyGuide],
    });
  });

  it(
    'should be able to create a study guide object with given topic and ' +
      'subtopic id',
    () => {
      var studyGuide = StudyGuide.createDefault('topic_id', 2);
      let sections = studyGuide.getSections() as StudyGuideSection[];
      expect(studyGuide.getId()).toBe('topic_id-2');
      expect(studyGuide.getTopicId()).toBe('topic_id');
      expect(sections[0].heading.contentId).toBe('section_heading_0');
      expect(sections[0].content.contentId).toBe('section_content_1');
      expect(studyGuide.getNextContentIdIndex()).toEqual(2);
      expect(studyGuide.getLanguageCode()).toEqual('en');
    }
  );

  it('should update id and next content id', () => {
    var studyGuide = StudyGuide.createDefault('topic_id', 2);
    studyGuide.setId('topic_id-3');
    expect(studyGuide.getId()).toBe('topic_id-3');
    studyGuide.setNextContentIdIndex(3);
    expect(studyGuide.getNextContentIdIndex()).toEqual(3);
  });

  it('should be able to copy from another study guide', () => {
    var firstStudyGuide = StudyGuide.createFromBackendDict({
      id: 'topic_id-1',
      topic_id: 'topic_id',
      sections: [
        {
          heading: {
            content_id: 'section_heading_0',
            unicode_str: 'section heading',
          },
          content: {
            content_id: 'section_content_1',
            html: '<p>section content</p>',
          },
        },
      ],
      next_content_id_index: 2,
      language_code: 'en',
    });

    var secondStudyGuide = StudyGuide.createFromBackendDict({
      id: 'topic_id2-2',
      topic_id: 'topic_id2',
      sections: [
        {
          heading: {
            content_id: 'section_heading_0',
            unicode_str: 'section heading 2',
          },
          content: {
            content_id: 'section_content_1',
            html: '<p>section content 2</p>',
          },
        },
      ],
      next_content_id_index: 2,
      language_code: 'en',
    });

    expect(firstStudyGuide).not.toBe(secondStudyGuide);
    expect(firstStudyGuide).not.toEqual(secondStudyGuide);

    firstStudyGuide.copyFromStudyGuide(secondStudyGuide);
    expect(firstStudyGuide).not.toBe(secondStudyGuide);
    expect(firstStudyGuide).toEqual(secondStudyGuide);
  });
});
