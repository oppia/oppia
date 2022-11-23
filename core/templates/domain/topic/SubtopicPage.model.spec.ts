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
 * @fileoverview Tests for subtopic-page Model.
 */

import { TestBed } from '@angular/core/testing';
import { RecordedVoiceovers } from 'domain/exploration/recorded-voiceovers.model';
import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';

import { SubtopicPage } from 'domain/topic/subtopic-page.model';
import { SubtopicPageContents } from './subtopic-page-contents.model';

describe('Subtopic page Model', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SubtopicPage]
    });
  });

  it('should be able to create a subtopic page object with given topic and ' +
    'subtopic id', () => {
    var subtopicPage = SubtopicPage.createDefault(
      'topic_id', 2);
    let pageContents = subtopicPage.getPageContents() as SubtopicPageContents;
    expect(subtopicPage.getId()).toBe('topic_id-2');
    expect(subtopicPage.getTopicId()).toBe('topic_id');
    expect(pageContents.getHtml()).toEqual('');
    expect(subtopicPage.getLanguageCode()).toEqual('en');
  });

  it('should be able to set language code',
    () => {
      let recordedVoiceovers = RecordedVoiceovers.createEmpty();
      recordedVoiceovers.addContentId('content');
      let subtopicPage = new SubtopicPage(
        'id', 'topic_id', SubtopicPageContents.createDefault(), 'en');
      expect(subtopicPage.getId()).toEqual('id');
      expect(subtopicPage.getTopicId()).toEqual('topic_id');
      expect(subtopicPage.getPageContents()).toEqual(
        new SubtopicPageContents(
          SubtitledHtml.createDefault('', 'content'),
          recordedVoiceovers)
      );
      expect(subtopicPage.getLanguageCode()).toEqual('en');
    });

  it('should be able to copy from another subtopic page', () => {
    var firstSubtopicPage = SubtopicPage.createFromBackendDict({
      id: 'topic_id-1',
      topic_id: 'topic_id',
      page_contents: {
        subtitled_html: {
          html: '<p>Data</p>',
          content_id: 'content'
        },
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {}
          }
        }
      },
      language_code: 'en'
    });

    var secondSubtopicPage = SubtopicPage.createFromBackendDict({
      id: 'topic_id2-2',
      topic_id: 'topic_id2',
      page_contents: {
        subtitled_html: {
          html: '<p>Data2</p>',
          content_id: 'content'
        },
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {}
          }
        }
      },
      language_code: 'en'
    });

    expect(firstSubtopicPage).not.toBe(secondSubtopicPage);
    expect(firstSubtopicPage).not.toEqual(secondSubtopicPage);

    firstSubtopicPage.copyFromSubtopicPage(secondSubtopicPage);
    expect(firstSubtopicPage).not.toBe(secondSubtopicPage);
    expect(firstSubtopicPage).toEqual(secondSubtopicPage);
  });
});
