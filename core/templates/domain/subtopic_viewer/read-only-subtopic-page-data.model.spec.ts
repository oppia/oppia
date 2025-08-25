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
    var _sampleSubtopicDataWithPageContents: ReadOnlySubtopicPageData;

    beforeEach(() => {
      var sampleSubtopicDataBackendDictWithPageContents = {
        topic_id: 'topic_id',
        topic_name: 'topic',
        next_subtopic_dict: null,
        prev_subtopic_dict: null,
        subtopic_title: 'sample_title',
        current_subtopic_id: 1,
        sections: null,
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

      _sampleSubtopicDataWithPageContents =
        ReadOnlySubtopicPageData.createFromBackendDict(
          sampleSubtopicDataBackendDictWithPageContents
        );
    });

    it('should be able to get all the values', function () {
      expect(_sampleSubtopicDataWithPageContents.getParentTopicId()).toEqual(
        'topic_id'
      );
      expect(_sampleSubtopicDataWithPageContents.getParentTopicName()).toEqual(
        'topic'
      );
      expect(_sampleSubtopicDataWithPageContents.getNextSubtopic()).toEqual(
        null
      );
      expect(_sampleSubtopicDataWithPageContents.getPrevSubtopic()).toEqual(
        null
      );
      expect(_sampleSubtopicDataWithPageContents.getSubtopicTitle()).toEqual(
        'sample_title'
      );
      expect(_sampleSubtopicDataWithPageContents.getSections()).toEqual([]);
      expect(_sampleSubtopicDataWithPageContents.getPageContents()).toEqual(
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

    it('should throw error if both sections and pageContents are null', function () {
      var sampleSubtopicDataBackendDictWithPageContents = {
        topic_id: 'topic_id',
        topic_name: 'topic',
        next_subtopic_dict: null,
        prev_subtopic_dict: null,
        subtopic_title: 'sample_title',
        current_subtopic_id: 1,
        sections: null,
        page_contents: null,
      };

      expect(function () {
        ReadOnlySubtopicPageData.createFromBackendDict(
          sampleSubtopicDataBackendDictWithPageContents
        );
      }).toThrowError('Neither sections nor page_contents provided.');
    });
  });
});
