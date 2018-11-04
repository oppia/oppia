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

describe('Subtopic page contents object factory', function() {
  var SubtopicPageContentsObjectFactory = null;

  var expectedDefaultObject = {
    subtitled_html: {
      html: '',
      content_id: 'content'
    },
    content_ids_to_audio_translations: {
      content: {}
    }
  };

  var backendDict = {
    subtitled_html: {
      html: 'test content',
      content_id: 'content'
    },
    content_ids_to_audio_translations: {
      content: {
        en: {
          filename: 'test.mp3',
          file_size_bytes: 100,
          needs_update: false
        }
      }
    }
  };

  beforeEach(module('oppia'));

  beforeEach(inject(function($injector) {
    SubtopicPageContentsObjectFactory =
      $injector.get('SubtopicPageContentsObjectFactory');
  }));

  it('should be able to create a default object', function() {
    var defaultObject = SubtopicPageContentsObjectFactory.createDefault();
    expect(defaultObject.toBackendDict()).toEqual(expectedDefaultObject);
  });

  it('should convert from a backend dictionary', function() {
    var sampleSubtopicPageContents =
      SubtopicPageContentsObjectFactory.createFromBackendDict(backendDict);
    expect(sampleSubtopicPageContents.getSubtitledHtml().getHtml())
      .toEqual('test content');
    expect(sampleSubtopicPageContents.getSubtitledHtml().getContentId())
      .toEqual('content');
    expect(sampleSubtopicPageContents.getContentIdsToAudioTranslations()
      .getAudioTranslation('content', 'en').toBackendDict())
      .toEqual({
        filename: 'test.mp3',
        file_size_bytes: 100,
        needs_update: false
      });
  });

  it('should convert from a backend dictionary', function() {
    var sampleSubtopicPageContents =
      SubtopicPageContentsObjectFactory.createFromBackendDict(backendDict);
    expect(sampleSubtopicPageContents.toBackendDict()).toEqual(backendDict);
  });
});
