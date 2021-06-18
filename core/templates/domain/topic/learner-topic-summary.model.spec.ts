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
 * @fileoverview Tests for LearnerTopicSummaryModel.
 */

import { LearnerTopicSummary } from 'domain/topic/learner-topic-summary.model';
import { Subtopic } from './subtopic.model';

describe('Learner Topic summary model', () => {
  let _sampleLearnerTopicSummary: LearnerTopicSummary = null;

  beforeEach(() => {
    let subtopic = {
      skill_ids: ['skill_id_2'],
      id: 1,
      title: 'subtopic_name',
      thumbnail_filename: 'image.svg',
      thumbnail_bg_color: '#F8BF74',
      url_fragment: 'subtopic-name'
    };

    let sampleLearnerTopicSummaryBackendDict = {
      id: 'sample_topic_id',
      name: 'Topic Name',
      language_code: 'en',
      description: 'description',
      version: 1,
      story_titles: ['Story 1'],
      thumbnail_filename: 'image.svg',
      thumbnail_bg_color: '#C6DCDA',
      classroom: 'math',
      practice_tab_is_displayed: false,
      url_fragment: 'topic-name',
      subtopics: [subtopic],
      degrees_of_mastery: {
        skill_id_1: 0.5,
        skill_id_2: 0.3
      },
      skill_descriptions: {
        skill_id_1: 'Skill Description 1',
        skill_id_2: 'Skill Description 2'
      }
    };
    _sampleLearnerTopicSummary = LearnerTopicSummary.createFromBackendDict(
      sampleLearnerTopicSummaryBackendDict);
  });

  it('should be able to get all the values', () => {
    expect(_sampleLearnerTopicSummary.getId()).toEqual('sample_topic_id');
    expect(_sampleLearnerTopicSummary.getName()).toEqual('Topic Name');
    expect(_sampleLearnerTopicSummary.getUrlFragment()).toEqual('topic-name');
    expect(_sampleLearnerTopicSummary.getLanguageCode()).toEqual('en');
    expect(_sampleLearnerTopicSummary.getDescription()).toEqual('description');
    expect(_sampleLearnerTopicSummary.getVersion()).toEqual(1);
    expect(_sampleLearnerTopicSummary.getStoryTitles()).toEqual(['Story 1']);
    expect(_sampleLearnerTopicSummary.getPracticeTabIsDisplayed()).toEqual(
      false);
    expect(_sampleLearnerTopicSummary.getClassroom()).toEqual('math');
    expect(_sampleLearnerTopicSummary.getThumbnailFilename()).toEqual(
      'image.svg');
    expect(_sampleLearnerTopicSummary.getThumbnailBgColor()).toEqual('#C6DCDA');
    expect(_sampleLearnerTopicSummary.getDegreesOfMastery()).toEqual({
      skill_id_1: 0.5,
      skill_id_2: 0.3
    });
    expect(_sampleLearnerTopicSummary.getSkillDescriptions()).toEqual({
      skill_id_1: 'Skill Description 1',
      skill_id_2: 'Skill Description 2'
    });
    expect(_sampleLearnerTopicSummary.getSubtopics()).toEqual([Subtopic.create({
      skill_ids: ['skill_id_2'],
      id: 1,
      title: 'subtopic_name',
      thumbnail_filename: 'image.svg',
      thumbnail_bg_color: '#F8BF74',
      url_fragment: 'subtopic-name'
    }, _sampleLearnerTopicSummary.skillDescriptions)]);
  });
});
