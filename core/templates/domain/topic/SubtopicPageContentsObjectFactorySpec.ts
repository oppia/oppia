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
  'domain/topic/SubtopicPageContentsObjectFactory';
import { RecordedVoiceoversObjectFactory } from
  'domain/exploration/RecordedVoiceoversObjectFactory';
import { SubtitledHtmlObjectFactory } from
  'domain/exploration/SubtitledHtmlObjectFactory';

describe('Subtopic page contents object factory', () => {
  let subtopicPageContentsObjectFactory: SubtopicPageContentsObjectFactory =
    null;
  let recordedVoiceoversObjectFactory: RecordedVoiceoversObjectFactory = null;
  let subtitledHtmlObjectFactory: SubtitledHtmlObjectFactory = null;

  const expectedDefaultObject = {
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

  const backendDict = {
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
            needs_update: false,
            duration_secs: 0.2
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
    recordedVoiceoversObjectFactory = TestBed.get(
      RecordedVoiceoversObjectFactory);
    subtitledHtmlObjectFactory = TestBed.get(SubtitledHtmlObjectFactory);
  });

  it('should be able to create a default object', () => {
    const defaultObject = subtopicPageContentsObjectFactory.createDefault();
    expect(defaultObject.toBackendDict()).toEqual(expectedDefaultObject);
  });

  it('should convert from a backend dictionary', () => {
    const sampleSubtopicPageContents = (
      subtopicPageContentsObjectFactory.createFromBackendDict(backendDict));

    expect(sampleSubtopicPageContents.getSubtitledHtml().getHtml())
      .toEqual('test content');
    expect(sampleSubtopicPageContents.getHtml()).toEqual('test content');
    expect(sampleSubtopicPageContents.getSubtitledHtml().getContentId())
      .toEqual('content');
    expect(sampleSubtopicPageContents.getRecordedVoiceovers().getVoiceover(
      'content', 'en').toBackendDict()).toEqual({
      filename: 'test.mp3',
      file_size_bytes: 100,
      needs_update: false,
      duration_secs: 0.2
    });
  });

  it('should convert from a backend dictionary', () => {
    const sampleSubtopicPageContents = (
      subtopicPageContentsObjectFactory.createFromBackendDict(backendDict));
    expect(sampleSubtopicPageContents.toBackendDict()).toEqual(backendDict);
  });

  it('should change html from subtitleHtml property in object', () => {
    const sampleSubtopicPageContents = (
      subtopicPageContentsObjectFactory.createFromBackendDict(backendDict));

    expect(sampleSubtopicPageContents.getSubtitledHtml().getHtml())
      .toEqual('test content');
    expect(sampleSubtopicPageContents.getHtml()).toEqual('test content');

    sampleSubtopicPageContents.setHtml('new html content');

    expect(sampleSubtopicPageContents.getSubtitledHtml().getHtml())
      .toEqual('new html content');
    expect(sampleSubtopicPageContents.getHtml()).toEqual('new html content');
  });

  it('should change subtitled html in object', () => {
    const sampleSubtopicPageContents = (
      subtopicPageContentsObjectFactory.createFromBackendDict(backendDict));

    expect(sampleSubtopicPageContents.getSubtitledHtml()).toEqual(
      subtitledHtmlObjectFactory.createFromBackendDict({
        html: 'test content',
        content_id: 'content'
      }));

    sampleSubtopicPageContents.setSubtitledHtml(
      subtitledHtmlObjectFactory.createDefault('new html content', 'new id'));

    expect(sampleSubtopicPageContents.getSubtitledHtml()).toEqual(
      subtitledHtmlObjectFactory.createFromBackendDict({
        html: 'new html content',
        content_id: 'new id'
      }));
  });

  it('should change recorded voiceovers in object', () => {
    const sampleSubtopicPageContents = (
      subtopicPageContentsObjectFactory.createFromBackendDict(backendDict));

    expect(sampleSubtopicPageContents.getRecordedVoiceovers().getVoiceover(
      'content', 'en').toBackendDict()).toEqual({
      filename: 'test.mp3',
      file_size_bytes: 100,
      needs_update: false,
      duration_secs: 0.2
    });

    sampleSubtopicPageContents.setRecordedVoiceovers(
      recordedVoiceoversObjectFactory.createFromBackendDict({
        voiceovers_mapping: {
          content: {
            en: {
              filename: 'new_file.mp3',
              file_size_bytes: 300,
              needs_update: false,
              duration_secs: 0.6
            }
          }
        }
      }));

    expect(sampleSubtopicPageContents.getRecordedVoiceovers().getVoiceover(
      'content', 'en').toBackendDict()).toEqual({
      filename: 'new_file.mp3',
      file_size_bytes: 300,
      needs_update: false,
      duration_secs: 0.6
    });
  });
});
