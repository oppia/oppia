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
 * @fileoverview Unit tests for ClassroomDataObjectFactory.
 */

import { TestBed } from '@angular/core/testing';

import { ClassroomDataObjectFactory } from
  'domain/classroom/ClassroomDataObjectFactory';
import { TopicSummaryObjectFactory } from
  'domain/topic/TopicSummaryObjectFactory';

describe('Classroom data object factory', () => {
  let classroomDataDict;
  let classroomDataObjectFactory: ClassroomDataObjectFactory;
  let topicSummaryObjectFactory: TopicSummaryObjectFactory;

  beforeEach(() => {
    classroomDataObjectFactory = TestBed.get(ClassroomDataObjectFactory);
    topicSummaryObjectFactory = TestBed.get(TopicSummaryObjectFactory);

    classroomDataDict = {
      name: 'Math',
      topic_summary_dicts: [{
        id: 'topic1',
        name: 'Topic name',
        description: 'Topic description',
        canonical_story_count: 4,
        subtopic_count: 5,
        total_skill_count: 20,
        uncategorized_skill_count: 5,
        thumbnail_filename: 'image.svg',
        thumbnail_bg_color: '#C6DCDA'
      }, {
        id: 'topic2',
        name: 'Topic name 2',
        description: 'Topic description 2',
        canonical_story_count: 3,
        subtopic_count: 2,
        total_skill_count: 10,
        uncategorized_skill_count: 3,
        thumbnail_filename: 'image2.svg',
        thumbnail_bg_color: '#C6DCDA'
      }],
      course_details: 'Course Details',
      topics_covered: 'Topics Covered'
    };
  });

  it('should create a new classroom object from a backend dictionary', () => {
    let classroomData =
          classroomDataObjectFactory.createFromBackendDict(classroomDataDict);
    expect(classroomData.getName()).toEqual('Math');
    expect(classroomData.getCourseDetails()).toEqual('Course Details');
    expect(classroomData.getTopicsCovered()).toEqual('Topics Covered');
    expect(classroomData.getTopicSummaries()[0]).toEqual(
      topicSummaryObjectFactory.createFromBackendDict(
        classroomDataDict.topic_summary_dicts[0]));
    expect(classroomData.getTopicSummaries()[1]).toEqual(
      topicSummaryObjectFactory.createFromBackendDict(
        classroomDataDict.topic_summary_dicts[1]));
  });
});
