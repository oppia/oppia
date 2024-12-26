// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for LessonCardComponent
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {FormsModule} from '@angular/forms';
import {waitForAsync, ComponentFixture, TestBed} from '@angular/core/testing';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {LessonCardComponent} from './lesson-card.component';
import {NO_ERRORS_SCHEMA} from '@angular/core';

import {CollectionSummary} from 'domain/collection/collection-summary.model';
import {LearnerExplorationSummary} from 'domain/summary/learner-exploration-summary.model';
import {StorySummary} from 'domain/story/story-summary.model';

describe('LessonCardComponent', () => {
  let component: LessonCardComponent;
  let fixture: ComponentFixture<LessonCardComponent>;

  const sampleCollection = {
    last_updated_msec: 1591296737470.528,
    community_owned: false,
    objective: 'Test Objective',
    id: '44LKoKLlIbGe',
    thumbnail_icon_url: '/subjects/Algebra.svg',
    language_code: 'en',
    thumbnail_bg_color: '#cc4b00',
    created_on: 1591296635736.666,
    status: 'public',
    category: 'Algebra',
    title: 'Test Title',
    node_count: 0,
  };

  const sampleExploration = {
    last_updated_msec: 1591296737470.528,
    community_owned: false,
    objective: 'Test Objective',
    id: '44LKoKLlIbGe',
    num_views: 0,
    thumbnail_icon_url: '/subjects/Algebra.svg',
    human_readable_contributors_summary: {},
    language_code: 'en',
    thumbnail_bg_color: '#cc4b00',
    created_on_msec: 1591296635736.666,
    ratings: {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    },
    status: 'public',
    tags: [],
    activity_type: 'exploration',
    category: 'Algebra',
    title: 'Test Title',
  };

  const sampleNode = {
    id: 'node_1',
    thumbnail_filename: 'image.png',
    title: 'Title 1',
    description: 'Description 1',
    prerequisite_skill_ids: ['skill_1'],
    acquired_skill_ids: ['skill_2'],
    destination_node_ids: ['node_2'],
    outline: 'Outline',
    exploration_id: 'exp_id_1',
    outline_is_finalized: false,
    thumbnail_bg_color: '#a33f40',
    status: 'Published',
    planned_publication_date_msecs: 100.0,
    last_modified_msecs: 100.0,
    first_publication_date_msecs: 200.0,
    unpublishing_reason: null,
  };

  const sampleTopic = {
    id: '0',
    title: 'Story Title',
    description: 'Story Description',
    node_titles: ['Title 1'],
    thumbnail_filename: 'image.svg',
    thumbnail_bg_color: '#F8BF74',
    story_is_published: true,
    completed_node_titles: ['Title 1'],
    url_fragment: 'story-title',
    all_node_dicts: [sampleNode],
    topic_name: 'Topic',
    classroom_url_fragment: 'math',
    topic_url_fragment: 'topic',
  };

  const incompleteTopic = {
    id: '0',
    title: 'Story Title',
    description: 'Story Description',
    node_titles: ['Title 1', 'Title 2'],
    thumbnail_filename: 'image.svg',
    thumbnail_bg_color: '#F8BF74',
    story_is_published: true,
    completed_node_titles: ['Title 1'],
    url_fragment: 'story-title',
    all_node_dicts: [sampleNode, sampleNode],
    topic_name: 'Topic',
    classroom_url_fragment: 'math',
    topic_url_fragment: 'topic',
  };

  const newTopic = {
    id: '0',
    title: 'Story Title',
    description: 'Story Description',
    node_titles: ['Title 1', 'Title 2'],
    thumbnail_filename: 'image.svg',
    thumbnail_bg_color: '#F8BF74',
    story_is_published: true,
    completed_node_titles: [],
    url_fragment: 'story-title',
    all_node_dicts: [sampleNode, sampleNode],
    topic_name: 'Topic',
    classroom_url_fragment: 'math',
    topic_url_fragment: 'topic',
  };

  const undefinedTopic = {
    id: '0',
    title: 'Story Title',
    description: 'Story Description',
    node_titles: ['Title 1', 'Title 2'],
    thumbnail_filename: 'image.svg',
    thumbnail_bg_color: '#F8BF74',
    story_is_published: true,
    completed_node_titles: [],
    url_fragment: 'story-title',
    all_node_dicts: [sampleNode, sampleNode],
    topic_name: 'Topic',
    classroom_url_fragment: 'math',
    topic_url_fragment: undefined,
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule, HttpClientTestingModule],
      declarations: [LessonCardComponent, MockTranslatePipe],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LessonCardComponent);
    component = fixture.componentInstance;
  });

  it('should set story to CollectionSummary and its non-url values to the respective fields', () => {
    component.story = CollectionSummary.createFromBackendDict(sampleCollection);

    fixture.detectChanges();

    expect(component.desc).toEqual(sampleCollection.objective);
    expect(component.imgColor).toEqual(sampleCollection.thumbnail_bg_color);
    expect(component.title).toEqual(sampleCollection.title);

    expect(component.progress).toEqual(0);
    expect(component.lessonTopic).toEqual('Collections');
  });

  it('should set story to LearnerExplorationSummary and its non-url values to the respective fields', () => {
    component.story =
      LearnerExplorationSummary.createFromBackendDict(sampleExploration);

    fixture.detectChanges();

    expect(component.desc).toEqual(sampleExploration.objective);
    expect(component.imgColor).toEqual(sampleExploration.thumbnail_bg_color);
    expect(component.title).toEqual(sampleExploration.title);

    expect(component.progress).toEqual(0);
    expect(component.lessonTopic).toEqual('Community Lesson');
  });

  it('should set story to complete StorySummary and its non-url values to the respective fields', () => {
    component.story = StorySummary.createFromBackendDict(sampleTopic);
    component.topic = sampleTopic.topic_name;

    fixture.detectChanges();

    expect(component.desc).toEqual(sampleTopic.title);
    expect(component.imgColor).toEqual(sampleTopic.thumbnail_bg_color);
    expect(component.title).toEqual('Chapter 1: Title 1');
    expect(component.progress).toEqual(100);
    expect(component.lessonTopic).toEqual(sampleTopic.topic_name);
  });

  it('should set story to incomplete StorySummary and its non-url values to the respective fields', () => {
    component.story = StorySummary.createFromBackendDict(incompleteTopic);
    component.topic = incompleteTopic.topic_name;

    fixture.detectChanges();

    expect(component.title).toEqual('Chapter 2: Title 2');
    expect(component.progress).toEqual(50);
    expect(component.lessonTopic).toEqual(incompleteTopic.topic_name);
  });

  it('should set story to CollectionSummary and set its imgUrl correctly', () => {
    component.story = CollectionSummary.createFromBackendDict(sampleCollection);

    fixture.detectChanges();

    expect(component.imgUrl).toBe('/assets/images/subjects/Algebra.svg');
  });

  it('should set story to StorySummary and set its lessonUrl correctly', () => {
    component.story = StorySummary.createFromBackendDict(sampleTopic);
    component.topic = sampleTopic.topic_name;

    fixture.detectChanges();

    expect(component.lessonUrl).toBe(
      `/explore/${sampleNode.exploration_id}?topic_url_fragment=${sampleTopic.topic_url_fragment}&classroom_url_fragment=${sampleTopic.classroom_url_fragment}&story_url_fragment=${sampleTopic.url_fragment}&node_id=${sampleNode.id}`
    );
  });

  it('should set story to StorySummary and set its imgUrl correctly', () => {
    component.story = StorySummary.createFromBackendDict(sampleTopic);
    component.topic = sampleTopic.topic_name;
    fixture.detectChanges();

    expect(component.imgUrl).toBe(
      '/assetsdevhandler/story/0/assets/thumbnail/image.svg'
    );
  });

  it('should set story to StorySummary and throw error for undefined topic_url_fragment', () => {
    expect(() => {
      component.story = StorySummary.createFromBackendDict(undefinedTopic);
      fixture.detectChanges();
    }).toThrowError('Class and/or topic does not exist');
  });

  it('should return Redo translation key when progress is 100', () => {
    component.story = StorySummary.createFromBackendDict(sampleTopic);
    component.topic = sampleTopic.topic_name;

    fixture.detectChanges();

    const buttonText = component.getButtonTranslationKey();
    expect(buttonText).toBe('I18N_LEARNER_DASHBOARD_CARD_BUTTON_REDO');
  });

  it('should return Resume translation key when progress is < 100', () => {
    component.story = StorySummary.createFromBackendDict(incompleteTopic);
    component.topic = incompleteTopic.topic_name;

    fixture.detectChanges();

    const buttonText = component.getButtonTranslationKey();
    expect(buttonText).toBe('I18N_LEARNER_DASHBOARD_CARD_BUTTON_RESUME');
  });

  it('should return Start translation key when progress is 0', () => {
    component.story = StorySummary.createFromBackendDict(newTopic);
    component.topic = newTopic.topic_name;

    fixture.detectChanges();

    const buttonText = component.getButtonTranslationKey();
    expect(buttonText).toBe('I18N_LEARNER_DASHBOARD_CARD_BUTTON_START');
  });
});
