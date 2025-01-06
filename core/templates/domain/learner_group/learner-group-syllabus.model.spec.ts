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

import {LearnerGroupSyllabus} from './learner-group-syllabus.model';

/**
 * @fileoverview Tests for learner group syllabus model.
 */

describe('Learner Group Syllabus', () => {
  it('should correctly convert backend dict to object', () => {
    const sampleLearnerGroupSubtopicSummaryDict = {
      subtopic_id: 1,
      subtopic_title: 'subtopicTitle',
      parent_topic_id: 'parentTopicId',
      parent_topic_name: 'parentTopicName',
      thumbnail_filename: 'thumbnailFilename',
      thumbnail_bg_color: 'red',
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
      planned_publication_date_msecs: 100.0,
      last_modified_msecs: 100.0,
      first_publication_date_msecs: 200.0,
      unpublishing_reason: null,
    };

    const sampleStorySummaryBackendDict = {
      id: 'sample_story_id',
      title: 'Story title',
      node_titles: ['Chapter 1', 'Chapter 2'],
      thumbnail_filename: 'image.svg',
      thumbnail_bg_color: '#F8BF74',
      description: 'Description',
      story_is_published: true,
      completed_node_titles: [],
      url_fragment: 'story-url-fragment',
      all_node_dicts: [nodeDict],
      topic_name: 'Topic one',
      topic_url_fragment: 'topic-one',
      classroom_url_fragment: 'math',
    };

    let sampleLearnerGroupSyllabusDict = {
      learner_group_id: 'groupId',
      story_summary_dicts: [sampleStorySummaryBackendDict],
      subtopic_summary_dicts: [sampleLearnerGroupSubtopicSummaryDict],
    };

    let sampleLearnerGroupSyllabus = LearnerGroupSyllabus.createFromBackendDict(
      sampleLearnerGroupSyllabusDict
    );

    expect(sampleLearnerGroupSyllabus.learnerGroupId).toEqual('groupId');
    expect(sampleLearnerGroupSyllabus.storySummaries.length).toEqual(1);
    expect(sampleLearnerGroupSyllabus.subtopicPageSummaries.length).toEqual(1);

    let storySummary = sampleLearnerGroupSyllabus.storySummaries[0];
    expect(storySummary.getId()).toEqual('sample_story_id');
    expect(storySummary.getCompletedNodeTitles()).toEqual([]);

    let learnerGroupSubtopicSummary =
      sampleLearnerGroupSyllabus.subtopicPageSummaries[0];
    expect(learnerGroupSubtopicSummary.subtopicId).toEqual(1);
    expect(learnerGroupSubtopicSummary.subtopicMastery).toBeUndefined();
  });
});
