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
 * @fileoverview Tests for SubtopicDataObjectFactory.
 */

import { TestBed } from '@angular/core/testing';

import { SubtopicPageContentsObjectFactory } from
  'domain/topic/SubtopicPageContentsObjectFactory';

import { ReadOnlySubtopicPageObjectFactory } from
  'domain/subtopic_viewer/ReadOnlySubtopicPageObjectFactory';

describe('Subtopic data object factory', () => {
  describe('subtopic data object factory', () => {
    var _sampleSubtopicData = null;
    let readOnlySubtopicPageObjectFactory: ReadOnlySubtopicPageObjectFactory =
      (null);
    let subtopicPageContentsObjectFactory: SubtopicPageContentsObjectFactory =
      null;

    beforeEach(() => {
      readOnlySubtopicPageObjectFactory = TestBed.get(
        ReadOnlySubtopicPageObjectFactory
      );
      subtopicPageContentsObjectFactory = TestBed.get(
        SubtopicPageContentsObjectFactory);

      var sampleSubtopicDataBackendDict = {
        subtopic_title: 'sample_title',
        page_contents: {
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
        }
      };

      _sampleSubtopicData = readOnlySubtopicPageObjectFactory.
        createFromBackendDict(sampleSubtopicDataBackendDict);
    });

    it('should be able to get all the values', function() {
      expect(_sampleSubtopicData.getSubtopicTitle()).toEqual('sample_title');
      expect(_sampleSubtopicData.getPageContents()).toEqual(
        subtopicPageContentsObjectFactory.createFromBackendDict({
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
        })
      );
    });
  });
});
