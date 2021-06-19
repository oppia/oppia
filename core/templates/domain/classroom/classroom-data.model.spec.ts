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
 * @fileoverview Unit tests for ClassroomDataModel.
 */

import { ClassroomData} from
  'domain/classroom/classroom-data.model';
import { CreatorTopicSummary } from
  'domain/topic/creator-topic-summary.model';

describe('Classroom data model', () => {
  let topicSummaryDicts;

  beforeEach(() => {
    topicSummaryDicts = [{
      id: 'topic1',
      name: 'Topic name',
      description: 'Topic description',
      canonical_story_count: 4,
      subtopic_count: 5,
      total_skill_count: 20,
      uncategorized_skill_count: 5,
      thumbnail_filename: 'image.svg',
      thumbnail_bg_color: '#C6DCDA'
    }];
  });

  it('should create a new classroom object from a backend dictionary', () => {
    let classroomData = (
      ClassroomData.createFromBackendData(
        'Math', topicSummaryDicts, 'Course Details', 'Topics Covered'));
    expect(classroomData.getName()).toEqual('Math');
    expect(classroomData.getCourseDetails()).toEqual('Course Details');
    expect(classroomData.getTopicListIntro()).toEqual('Topics Covered');
    expect(classroomData.getTopicSummaries()[0]).toEqual(
      CreatorTopicSummary.createFromBackendDict(topicSummaryDicts[0]));
  });
});
