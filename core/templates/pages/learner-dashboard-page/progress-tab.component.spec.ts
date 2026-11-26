// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for ProgressTabComponent.
 */

import {waitForAsync, ComponentFixture, TestBed} from '@angular/core/testing';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {ProgressTabComponent} from './progress-tab.component';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {LearnerTopicSummary} from 'domain/topic/learner-topic-summary.model';

describe('Progress Tab Component', () => {
  let component: ProgressTabComponent;
  let fixture: ComponentFixture<ProgressTabComponent>;

  let subtopic = {
    skill_ids: ['skill_id_2'],
    id: 1,
    title: 'subtopic_name',
    thumbnail_filename: 'image.svg',
    thumbnail_bg_color: '#F8BF74',
    url_fragment: 'subtopic-name',
  };

  let nodeDict1 = {
    id: 'node_1',
    thumbnail_filename: 'image1.png',
    title: 'Chapter 1',
    description: 'Description 1',
    prerequisite_skill_ids: ['skill_id_1'],
    acquired_skill_ids: ['skill_id_2'],
    destination_node_ids: ['node_2'],
    outline: 'Outline',
    exploration_id: 'exp_1',
    outline_is_finalized: false,
    thumbnail_bg_color: '#a33f40',
    status: 'Published',
    planned_publication_date_msecs: 100,
    last_modified_msecs: 100,
    first_publication_date_msecs: 200,
    unpublishing_reason: null,
  };
  let nodeDict2 = {
    id: 'node_2',
    thumbnail_filename: 'image2.png',
    title: 'Chapter 2',
    description: 'Description 1',
    prerequisite_skill_ids: ['skill_id_1'],
    acquired_skill_ids: ['skill_id_2'],
    destination_node_ids: ['node_3'],
    outline: 'Outline',
    exploration_id: 'exp_2',
    outline_is_finalized: false,
    thumbnail_bg_color: '#a33f40',
    status: 'Published',
    planned_publication_date_msecs: 100.0,
    last_modified_msecs: 100.0,
    first_publication_date_msecs: 200.0,
    unpublishing_reason: null,
  };
  const learntTopicSummaryDict = {
    id: 'sample_topic_id',
    name: 'Topic Name',
    language_code: 'en',
    description: 'description',
    version: 1,
    story_titles: ['Story 1'],
    total_published_node_count: 2,
    thumbnail_filename: 'image.svg',
    thumbnail_bg_color: '#C6DCDA',
    classroom_name: 'math',
    classroom_url_fragment: 'math',
    practice_tab_is_displayed: false,
    canonical_story_summary_dict: [
      {
        id: '0',
        title: 'Story Title',
        description: 'Story Description',
        node_titles: ['Chapter 1', 'Chapter 2'],
        thumbnail_filename: 'image.svg',
        thumbnail_bg_color: '#F8BF74',
        story_is_published: true,
        completed_node_titles: ['Chapter 2'],
        all_node_dicts: [nodeDict1, nodeDict2],
        url_fragment: 'story-title',
        topic_name: 'Topic Name',
        classroom_url_fragment: 'math',
        topic_url_fragment: 'topic-name',
      },
    ],
    url_fragment: 'topic-name',
    subtopics: [subtopic],
    degrees_of_mastery: {
      skill_id_1: 1,
      skill_id_2: 1,
    },
    skill_descriptions: {
      skill_id_1: 'Skill Description 1',
      skill_id_2: 'Skill Description 2',
    },
  };

  let newSubtopic = {
    skill_ids: ['skill_id_3'],
    id: 1,
    title: 'subtopic_name',
    thumbnail_filename: 'image.svg',
    thumbnail_bg_color: '#F8BF74',
    url_fragment: 'subtopic-name',
  };

  let newNodeDict = {
    id: 'node_1',
    thumbnail_filename: 'image1.png',
    title: 'Chapter 1',
    description: 'Description 1',
    prerequisite_skill_ids: ['skill_id_3'],
    acquired_skill_ids: ['skill_id_4'],
    destination_node_ids: [''],
    outline: 'Outline',
    exploration_id: 'exp_1',
    outline_is_finalized: false,
    thumbnail_bg_color: '#a33f40',
    status: 'Published',
    planned_publication_date_msecs: 100.0,
    last_modified_msecs: 100.0,
    first_publication_date_msecs: 200.0,
    unpublishing_reason: null,
  };

  const newTopicSummaryDict = {
    id: 'new_sample_topic_id',
    name: 'New Topic Name',
    language_code: 'en',
    description: 'description',
    version: 1,
    story_titles: ['Story 1'],
    total_published_node_count: 2,
    thumbnail_filename: 'image.svg',
    thumbnail_bg_color: '#C6DCDA',
    classroom_name: 'math',
    classroom_url_fragment: 'math',
    practice_tab_is_displayed: false,
    canonical_story_summary_dict: [
      {
        id: '0',
        title: 'Story Title',
        description: 'Story Description',
        node_titles: ['Chapter 1'],
        thumbnail_filename: 'image.svg',
        thumbnail_bg_color: '#F8BF74',
        story_is_published: true,
        completed_node_titles: [''],
        all_node_dicts: [newNodeDict],
        url_fragment: 'new-story-title',
        topic_name: 'New Topic Name',
        classroom_url_fragment: 'math',
        topic_url_fragment: 'new-topic-name',
      },
    ],
    url_fragment: 'new-topic-name',
    subtopics: [newSubtopic],
    degrees_of_mastery: {
      skill_id_3: 0,
    },
    skill_descriptions: {
      skill_id_3: 'Skill Description 3',
    },
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ProgressTabComponent, MockTranslatePipe],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProgressTabComponent);
    component = fixture.componentInstance;
    component.currentGoals = [];
    component.partiallyLearntTopicsList = [
      LearnerTopicSummary.createFromBackendDict(newTopicSummaryDict),
    ];
    component.learntTopicsList = [
      LearnerTopicSummary.createFromBackendDict(learntTopicSummaryDict),
    ];
    component.subtopicMasteries = {
      new_sample_topic_id: {},
      sample_topic_id: {1: 1},
    };

    fixture.detectChanges();
  });

  it('should set the goal ids and topic masteries on init', () => {
    component.currentGoals = [component.partiallyLearntTopicsList[0]];
    component.partialTopicMastery = [];
    component.learntTopicMastery = [];

    component.ngOnInit();

    expect(component.currentGoalIds).toEqual(new Set(['new_sample_topic_id']));
    expect(component.completedGoalIds).toEqual(new Set(['sample_topic_id']));
    expect(component.partialTopicMastery).toEqual([
      {topic: component.partiallyLearntTopicsList[0], progress: [0]},
    ]);
    expect(component.learntTopicMastery).toEqual([
      {topic: component.learntTopicsList[0], progress: [100]},
    ]);
  });

  it('should return true when there are no topics in progress or learnt', () => {
    component.partiallyLearntTopicsList = [];
    component.learntTopicsList = [];

    expect(component.isLearnerStateEmpty()).toBe(true);
  });

  it('should return false when there are only partially learnt topics', () => {
    component.learntTopicsList = [];

    expect(component.isLearnerStateEmpty()).toBe(false);
  });

  it('should return false when there are only learnt topics', () => {
    component.partiallyLearntTopicsList = [];

    expect(component.isLearnerStateEmpty()).toBe(false);
  });

  it('should return false when there are partially learnt and learnt topics', () => {
    expect(component.isLearnerStateEmpty()).toBe(false);
  });

  it('should correctly calculate subtopic progress', () => {
    const mockSubtopics = component.partiallyLearntTopicsList[0].subtopics;

    expect(component.getSubtopicProgress(mockSubtopics, {1: 0.5})).toEqual([
      50,
    ]);
    expect(component.getSubtopicProgress(mockSubtopics, {})).toEqual([0]);
  });
});
