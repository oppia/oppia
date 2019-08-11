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
 * @fileoverview Tests for SubtopicPageObjectFactory.
 */

import { TestBed } from '@angular/core/testing';

import { SubtopicPageObjectFactory } from
  'domain/topic/SubtopicPageObjectFactory.ts';

describe('Subtopic page object factory', () => {
  let subtopicPageObjectFactory: SubtopicPageObjectFactory = null;
  var _sampleSubtopic = null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SubtopicPageObjectFactory]
    });

    subtopicPageObjectFactory = TestBed.get(SubtopicPageObjectFactory);
  });

  it('should be able to create a subtopic page object with given topic and ' +
    'subtopic id', () => {
    var subtopicPage = subtopicPageObjectFactory.createDefault(
      'topic_id', 2);
    expect(subtopicPage.getId()).toBe('topic_id-2');
    expect(subtopicPage.getTopicId()).toBe('topic_id');
    expect(subtopicPage.getPageContents().getHtml()).toEqual('');
    expect(subtopicPage.getLanguageCode()).toEqual('en');
  });

  it('should be able to create an interstitial subtopic page object',
    () => {
      var subtopicPage =
        subtopicPageObjectFactory.createInterstitialSubtopicPage();
      expect(subtopicPage.getId()).toEqual(null);
      expect(subtopicPage.getTopicId()).toEqual(null);
      expect(subtopicPage.getPageContents()).toEqual(null);
      expect(subtopicPage.getLanguageCode()).toBe('en');
    });

  it('should be able to copy from another subtopic page', () => {
    var firstSubtopicPage = subtopicPageObjectFactory.createFromBackendDict({
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

    var secondSubtopicPage = subtopicPageObjectFactory.createFromBackendDict({
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
