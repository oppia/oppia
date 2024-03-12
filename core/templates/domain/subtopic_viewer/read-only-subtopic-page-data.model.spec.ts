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
 * @fileoverview Tests for SubtopicData Model.
 */

import {SubtopicPageContents} from 'domain/topic/subtopic-page-contents.model';

import {ReadOnlySubtopicPageData} from 'domain/subtopic_viewer/read-only-subtopic-page-data.model';

describe('Subtopic data object factory', () => {
  describe('subtopic data object factory', () => {
    var _sampleSubtopicData: ReadOnlySubtopicPageData;

    beforeEach(() => {
      var sampleSubtopicDataBackendDict = {
        topic_id: 'topic_id',
        topic_name: 'topic',
        next_subtopic_dict: null,
        prev_subtopic_dict: null,
        subtopic_title: 'sample_title',
        page_contents: {
          subtitled_html: {
            html: 'test content',
            content_id: 'content',
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {
                en: {
                  filename: 'test.mp3',
                  file_size_bytes: 100,
                  needs_update: false,
                  duration_secs: 10,
                },
              },
            },
          },
        },
      };

      _sampleSubtopicData = ReadOnlySubtopicPageData.createFromBackendDict(
        sampleSubtopicDataBackendDict
      );
    });

    it('should be able to get all the values', function () {
      expect(_sampleSubtopicData.getParentTopicId()).toEqual('topic_id');
      expect(_sampleSubtopicData.getParentTopicName()).toEqual('topic');
      expect(_sampleSubtopicData.getNextSubtopic()).toEqual(null);
      expect(_sampleSubtopicData.getSubtopicTitle()).toEqual('sample_title');
      expect(_sampleSubtopicData.getPageContents()).toEqual(
        SubtopicPageContents.createFromBackendDict({
          subtitled_html: {
            html: 'test content',
            content_id: 'content',
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {
                en: {
                  filename: 'test.mp3',
                  file_size_bytes: 100,
                  needs_update: false,
                  duration_secs: 10,
                },
              },
            },
          },
        })
      );
    });
  });
});
