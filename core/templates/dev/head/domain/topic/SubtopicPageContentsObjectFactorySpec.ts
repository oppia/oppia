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
 * @fileoverview Tests for SubtopicPageContentsObjectFactory.
 */

import { TestBed } from '@angular/core/testing';

import { SubtopicPageContentsObjectFactory } from
  'domain/topic/SubtopicPageContentsObjectFactory.ts';

describe('Subtopic page contents object factory', () => {
  let subtopicPageContentsObjectFactory: SubtopicPageContentsObjectFactory =
    null;

  var expectedDefaultObject = {
    subtitled_html: {
      html: '',
      content_id: 'content'
    },
    recorded_voiceovers: {
      voiceovers_mapping: {
        content: {}
      }
    }
  };

  var backendDict = {
    subtitled_html: {
      html: 'test content',
      content_id: 'content'
    },
    recorded_voiceovers: {
      voiceovers_mapping: {
        content: {
          en: {
            filename: 'test.mp3',
            file_size_bytes: 100,
            needs_update: false
          }
        }
      }
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SubtopicPageContentsObjectFactory]
    });

    subtopicPageContentsObjectFactory = TestBed.get(
      SubtopicPageContentsObjectFactory);
  });

  it('should be able to create a default object', () => {
    var defaultObject = subtopicPageContentsObjectFactory.createDefault();
    expect(defaultObject.toBackendDict()).toEqual(expectedDefaultObject);
  });

  it('should convert from a backend dictionary', () => {
    var sampleSubtopicPageContents =
      subtopicPageContentsObjectFactory.createFromBackendDict(backendDict);
    expect(sampleSubtopicPageContents.getSubtitledHtml().getHtml())
      .toEqual('test content');
    expect(sampleSubtopicPageContents.getSubtitledHtml().getContentId())
      .toEqual('content');
    expect(sampleSubtopicPageContents.getRecordedVoiceovers().getVoiceover(
      'content', 'en').toBackendDict()).toEqual({
      filename: 'test.mp3',
      file_size_bytes: 100,
      needs_update: false
    });
  });

  it('should convert from a backend dictionary', () => {
    var sampleSubtopicPageContents =
      subtopicPageContentsObjectFactory.createFromBackendDict(backendDict);
    expect(sampleSubtopicPageContents.toBackendDict()).toEqual(backendDict);
  });
});
