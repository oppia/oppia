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

import {ClassroomData} from 'domain/classroom/classroom-data.model';
import {
  CreatorTopicSummary,
  CreatorTopicSummaryBackendDict,
} from 'domain/topic/creator-topic-summary.model';

describe('Classroom data model', () => {
  let topicSummaryDicts: CreatorTopicSummaryBackendDict[];

  beforeEach(() => {
    topicSummaryDicts = [
      {
        id: 'topic1',
        name: 'Topic name',
        description: 'Topic description',
        canonical_story_count: 4,
        subtopic_count: 5,
        total_skill_count: 20,
        uncategorized_skill_count: 5,
        thumbnail_filename: 'image.svg',
        thumbnail_bg_color: '#C6DCDA',
        language_code: 'en',
        version: 1,
        additional_story_count: 0,
        total_published_node_count: 4,
        topic_model_created_on: 20160101,
        topic_model_last_updated: 20160110,
        can_edit_topic: true,
        is_published: true,
        url_fragment: 'some-url-fragment',
        classroom: 'math',
        total_upcoming_chapters_count: 1,
        total_overdue_chapters_count: 1,
        total_chapter_counts_for_each_story: [5, 4],
        published_chapter_counts_for_each_story: [3, 4],
      },
    ];
  });

  it('should create a new classroom object from a backend dictionary', () => {
    let classroomData = ClassroomData.createFromBackendData(
      'mathid',
      'Math',
      'math',
      topicSummaryDicts,
      'Course Details',
      'Topics Covered',
      'Learn math',
      true,
      false,
      {filename: 'thumbnail.svg', size_in_bytes: 100, bg_color: 'transparent'},
      {filename: 'banner.png', size_in_bytes: 100, bg_color: 'transparent'},
      1
    );
    expect(classroomData.getName()).toEqual('Math');
    expect(classroomData.getUrlFragment()).toEqual('math');
    expect(classroomData.getCourseDetails()).toEqual('Course Details');
    expect(classroomData.getTopicListIntro()).toEqual('Topics Covered');
    expect(classroomData.getTopicSummaries()[0]).toEqual(
      CreatorTopicSummary.createFromBackendDict(topicSummaryDicts[0])
    );
    expect(classroomData.getTeaserText()).toEqual('Learn math');
    expect(classroomData.getIsPublished()).toBeTrue();
    expect(classroomData.getIsDiagnosticTestEnabled()).toBeFalse();
    expect(classroomData.getThumbnailData().filename).toEqual('thumbnail.svg');
    expect(classroomData.getThumbnailData().size_in_bytes).toEqual(100);
    expect(classroomData.getThumbnailData().bg_color).toEqual('transparent');
    expect(classroomData.getBannerData().filename).toEqual('banner.png');
    expect(classroomData.getBannerData().size_in_bytes).toEqual(100);
    expect(classroomData.getBannerData().bg_color).toEqual('transparent');
  });
});
