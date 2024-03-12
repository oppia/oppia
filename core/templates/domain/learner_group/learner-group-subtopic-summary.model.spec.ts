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

import {LearnerGroupSubtopicSummary} from './learner-group-subtopic-summary.model';

describe('Subtopic Page Summary', () => {
  let sampleLearnerGroupSubtopicSummary: LearnerGroupSubtopicSummary;

  it(
    'should correctly convert backend dict to object with subtopic ' +
      'mastery present',
    () => {
      let sampleLearnerGroupSubtopicSummaryDict = {
        subtopic_id: 1,
        subtopic_title: 'subtopicTitle',
        parent_topic_id: 'parentTopicId',
        parent_topic_name: 'parentTopicName',
        thumbnail_filename: 'thumbnailFilename',
        thumbnail_bg_color: 'red',
        subtopic_mastery: 0.5,
        parent_topic_url_fragment: 'url_fragment',
        classroom_url_fragment: 'math',
      };

      sampleLearnerGroupSubtopicSummary =
        LearnerGroupSubtopicSummary.createFromBackendDict(
          sampleLearnerGroupSubtopicSummaryDict
        );

      expect(sampleLearnerGroupSubtopicSummary.subtopicId).toEqual(1);
      expect(sampleLearnerGroupSubtopicSummary.subtopicTitle).toEqual(
        'subtopicTitle'
      );
      expect(sampleLearnerGroupSubtopicSummary.parentTopicId).toEqual(
        'parentTopicId'
      );
      expect(sampleLearnerGroupSubtopicSummary.parentTopicName).toEqual(
        'parentTopicName'
      );
      expect(sampleLearnerGroupSubtopicSummary.thumbnailFilename).toEqual(
        'thumbnailFilename'
      );
      expect(sampleLearnerGroupSubtopicSummary.thumbnailBgColor).toEqual('red');
      expect(sampleLearnerGroupSubtopicSummary.subtopicMastery).toEqual(0.5);
      expect(sampleLearnerGroupSubtopicSummary.parentTopicUrlFragment).toEqual(
        'url_fragment'
      );
      expect(sampleLearnerGroupSubtopicSummary.classroomUrlFragment).toEqual(
        'math'
      );
    }
  );

  it(
    'should correctly convert backend dict to object without subtopic ' +
      'mastery present',
    () => {
      let sampleLearnerGroupSubtopicSummaryDict = {
        subtopic_id: 1,
        subtopic_title: 'subtopicTitle',
        parent_topic_id: 'parentTopicId',
        parent_topic_name: 'parentTopicName',
        thumbnail_filename: 'thumbnailFilename',
        thumbnail_bg_color: 'red',
      };

      sampleLearnerGroupSubtopicSummary =
        LearnerGroupSubtopicSummary.createFromBackendDict(
          sampleLearnerGroupSubtopicSummaryDict
        );

      expect(sampleLearnerGroupSubtopicSummary.subtopicId).toEqual(1);
      expect(sampleLearnerGroupSubtopicSummary.subtopicTitle).toEqual(
        'subtopicTitle'
      );
      expect(sampleLearnerGroupSubtopicSummary.parentTopicId).toEqual(
        'parentTopicId'
      );
      expect(sampleLearnerGroupSubtopicSummary.parentTopicName).toEqual(
        'parentTopicName'
      );
      expect(sampleLearnerGroupSubtopicSummary.thumbnailFilename).toEqual(
        'thumbnailFilename'
      );
      expect(sampleLearnerGroupSubtopicSummary.thumbnailBgColor).toEqual('red');
      expect(sampleLearnerGroupSubtopicSummary.subtopicMastery).toBeUndefined();
      expect(sampleLearnerGroupSubtopicSummary.subtopicPageId).toEqual(
        'parentTopicId:1'
      );
      expect(
        sampleLearnerGroupSubtopicSummary.parentTopicUrlFragment
      ).toBeUndefined();
      expect(
        sampleLearnerGroupSubtopicSummary.classroomUrlFragment
      ).toBeUndefined();
    }
  );
});
