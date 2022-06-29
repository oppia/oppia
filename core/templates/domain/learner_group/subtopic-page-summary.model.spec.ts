// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for subtopic page summary model.
 */

import { SubtopicPageSummary } from './subtopic-page-summary.model';

describe('Subtopic Page Summary', () => {
  let sampleSubtopicPageSummary: SubtopicPageSummary;

  it('should correctly convert backend dict to object with subtopic ' +
    'mastery present', () => {
    let sampleSubtopicPageSummaryDict = {
      subtopic_id: 'subtopicId',
      subtopic_title: 'subtopicTitle',
      parent_topic_id: 'parentTopicId',
      parent_topic_name: 'parentTopicName',
      thumbnail_filename: 'thumbnailFilename',
      thumbnail_bg_color: 'red',
      subtopic_mastery: 0.5
    };

    sampleSubtopicPageSummary = SubtopicPageSummary.createFromBackendDict(
      sampleSubtopicPageSummaryDict);

    expect(sampleSubtopicPageSummary.subtopicId).toEqual('subtopicId');
    expect(sampleSubtopicPageSummary.subtopicTitle).toEqual('subtopicTitle');
    expect(sampleSubtopicPageSummary.parentTopicId).toEqual('parentTopicId');
    expect(sampleSubtopicPageSummary.parentTopicName).toEqual(
      'parentTopicName');
    expect(sampleSubtopicPageSummary.thumbnailFilename).toEqual(
      'thumbnailFilename');
    expect(sampleSubtopicPageSummary.thumbnailBgColor).toEqual('red');
    expect(sampleSubtopicPageSummary.subtopicMastery).toEqual(0.5);
  });

  it('should correctly convert backend dict to object without subtopic ' +
  'mastery present', () => {
    let sampleSubtopicPageSummaryDict = {
      subtopic_id: 'subtopicId',
      subtopic_title: 'subtopicTitle',
      parent_topic_id: 'parentTopicId',
      parent_topic_name: 'parentTopicName',
      thumbnail_filename: 'thumbnailFilename',
      thumbnail_bg_color: 'red'
    };

    sampleSubtopicPageSummary = SubtopicPageSummary.createFromBackendDict(
      sampleSubtopicPageSummaryDict);

    expect(sampleSubtopicPageSummary.subtopicId).toEqual('subtopicId');
    expect(sampleSubtopicPageSummary.subtopicTitle).toEqual('subtopicTitle');
    expect(sampleSubtopicPageSummary.parentTopicId).toEqual('parentTopicId');
    expect(sampleSubtopicPageSummary.parentTopicName).toEqual(
      'parentTopicName');
    expect(sampleSubtopicPageSummary.thumbnailFilename).toEqual(
      'thumbnailFilename');
    expect(sampleSubtopicPageSummary.thumbnailBgColor).toEqual('red');
    expect(sampleSubtopicPageSummary.subtopicMastery).toBeUndefined();
  });
});
