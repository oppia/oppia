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

import { LearnerGroupUserProgress } from './learner-group-user-progress.model';

/**
 * @fileoverview Tests for learner group user progress model.
 */

describe('Learner Group User Progress', () => {
  it('should correctly convert backend dict to object', () => {
    const sampleLearnerGroupSubtopicSummaryDict = {
      subtopic_id: 1,
      subtopic_title: 'subtopicTitle',
      parent_topic_id: 'parentTopicId',
      parent_topic_name: 'parentTopicName',
      thumbnail_filename: 'thumbnailFilename',
      thumbnail_bg_color: 'red',
      subtopic_mastery: 0.5
    };

    let nodeDict = {
      id: 'node_1',
      thumbnail_filename: 'image.png',
      title: 'Title 1',
      description: 'Description 1',
      prerequisite_skill_ids: ['skill_1'],
      acquired_skill_ids: ['skill_2'],
      destination_node_ids: ['node_2'],
      outline: 'Outline',
      exploration_id: null,
      outline_is_finalized: false,
      thumbnail_bg_color: '#a33f40',
      status: 'Published',
      planned_publication_date_msecs: 100,
      last_modified_msecs: 100,
      first_publication_date_msecs: 200,
      unpublishing_reason: null
    };

    const sampleStorySummaryBackendDict = {
      id: 'sample_story_id',
      title: 'Story title',
      node_titles: ['Chapter 1', 'Chapter 2'],
      thumbnail_filename: 'image.svg',
      thumbnail_bg_color: '#F8BF74',
      description: 'Description',
      story_is_published: true,
      completed_node_titles: ['Chapter 1'],
      url_fragment: 'story-url-fragment',
      all_node_dicts: [nodeDict],
      topic_name: 'Topic one',
      topic_url_fragment: 'topic-one',
      classroom_url_fragment: 'math'
    };

    let sampleLearnerGroupUserProgDict = {
      username: 'user1',
      progress_sharing_is_turned_on: true,
      stories_progress: [sampleStorySummaryBackendDict],
      subtopic_pages_progress: [sampleLearnerGroupSubtopicSummaryDict]
    };

    let sampleLearnerGroupUserProg = (
      LearnerGroupUserProgress.createFromBackendDict(
        sampleLearnerGroupUserProgDict)
    );

    expect(sampleLearnerGroupUserProg.username).toEqual('user1');
    expect(sampleLearnerGroupUserProg.isProgressSharingTurnedOn).toEqual(true);
    expect(sampleLearnerGroupUserProg.storiesProgress.length).toEqual(1);
    expect(sampleLearnerGroupUserProg.subtopicsProgress.length).toEqual(1);

    let storyProgress = sampleLearnerGroupUserProg.storiesProgress[0];
    expect(storyProgress.getId()).toEqual('sample_story_id');

    let subtopicProgress = sampleLearnerGroupUserProg.subtopicsProgress[0];
    expect(subtopicProgress.subtopicId).toEqual(1);
  });
});
