// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for TopicViewerDataService.
 */

import {
  ReadOnlyTopic,
  ReadOnlyTopicBackendDict,
} from 'domain/topic_viewer/read-only-topic.model';

import {TopicViewerDataService} from './topic-viewer-data.service';

describe('TopicViewerDataService', () => {
  let service: TopicViewerDataService;

  const baseTopicBackendDict: ReadOnlyTopicBackendDict = {
    topic_id: 'topic_id',
    topic_name: 'Fractions',
    topic_description: 'Learn fractions.',
    canonical_story_dicts: [
      {
        id: 'story_1',
        title: 'Finding Parts',
        node_titles: ['Intro', 'Halves'],
        thumbnail_filename: '',
        thumbnail_bg_color: '',
        description: 'Start by finding equal parts.',
        story_is_published: true,
        completed_node_titles: [],
        url_fragment: 'finding-parts',
        all_node_dicts: [],
      },
      {
        id: 'story_2',
        title: 'Comparing Fractions',
        node_titles: ['Compare'],
        thumbnail_filename: '',
        thumbnail_bg_color: '',
        description: 'Compare fractions with common denominators.',
        story_is_published: true,
        completed_node_titles: [],
        url_fragment: 'comparing-fractions',
        all_node_dicts: [],
      },
    ],
    additional_story_dicts: [],
    uncategorized_skill_ids: [],
    subtopics: [
      {
        id: 1,
        title: 'Practice equal parts',
        skill_ids: ['skill_1'],
        thumbnail_filename: null,
        thumbnail_bg_color: null,
        url_fragment: 'practice-equal-parts',
      },
      {
        id: 2,
        title: 'Coming soon',
        skill_ids: [],
        thumbnail_filename: null,
        thumbnail_bg_color: null,
        url_fragment: null,
      },
    ],
    degrees_of_mastery: {},
    skill_descriptions: {
      skill_1: 'Identify equal parts.',
    },
    practice_tab_is_displayed: true,
    meta_tag_content: 'Fractions meta tag.',
    page_title_fragment_for_web: 'Fractions page title.',
    classroom_name: 'Math',
  };

  const createReadOnlyTopic = (
    topicBackendDict?: Partial<ReadOnlyTopicBackendDict>
  ): ReadOnlyTopic => {
    return ReadOnlyTopic.createFromBackendDict({
      ...baseTopicBackendDict,
      ...topicBackendDict,
    });
  };

  beforeEach(() => {
    service = new TopicViewerDataService();
  });

  it('should store topic and story section data from readonly topic', () => {
    service.setFromReadOnlyTopic(createReadOnlyTopic(), 'math', 'fractions');

    expect(service.getTopicId()).toBe('topic_id');
    expect(service.getTopicName()).toBe('Fractions');
    expect(service.getTopicDescription()).toBe('Learn fractions.');
    expect(service.getClassroomName()).toBe('Math');
    expect(service.getClassroomUrlFragment()).toBe('math');
    expect(service.getTopicUrlFragment()).toBe('fractions');
    expect(service.getStoryTitle()).toBe('Finding Parts');
    expect(service.getStoryDescription()).toBe('Start by finding equal parts.');
    expect(service.getLessonCount()).toBe(3);
    expect(service.getPracticeCount()).toBe(1);
    expect(service.getCanonicalStoryData()).toEqual([
      {
        storyId: 'story_1',
        storyTitle: 'Finding Parts',
        storyDescription: 'Start by finding equal parts.',
        lessonCount: 2,
        practiceCount: 1,
      },
      {
        storyId: 'story_2',
        storyTitle: 'Comparing Fractions',
        storyDescription: 'Compare fractions with common denominators.',
        lessonCount: 1,
        practiceCount: 1,
      },
    ]);
  });

  it('should use topic text when readonly topic has no canonical stories', () => {
    service.setFromReadOnlyTopic(
      createReadOnlyTopic({
        canonical_story_dicts: [],
      }),
      'math',
      'fractions'
    );

    expect(service.getStoryTitle()).toBe('Fractions');
    expect(service.getStoryDescription()).toBe('Learn fractions.');
    expect(service.getLessonCount()).toBe(0);
    expect(service.getPracticeCount()).toBe(1);
    expect(service.getCanonicalStoryData()).toEqual([]);
  });

  it('should merge manually-set topic data with existing service data', () => {
    service.setFromReadOnlyTopic(createReadOnlyTopic(), 'math', 'fractions');

    service.setTopicData({
      topicName: 'Updated Fractions',
    });

    expect(service.getTopicName()).toBe('Updated Fractions');
    expect(service.getLessonCount()).toBe(3);
    expect(service.getCanonicalStoryData().length).toBe(2);
  });
});
