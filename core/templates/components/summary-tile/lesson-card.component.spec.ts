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
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {LessonCardComponent} from './lesson-card.component';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {AppConstants} from 'app.constants';

import {CollectionSummary} from 'domain/collection/collection-summary.model';
import {LearnerExplorationSummary} from 'domain/summary/learner-exploration-summary.model';
import {StorySummary} from 'domain/story/story-summary.model';

describe('LessonCardComponent', () => {
  let component: LessonCardComponent;
  let fixture: ComponentFixture<LessonCardComponent>;

  let urlInterpolationService: UrlInterpolationService;
  let assetsBackendApiService: AssetsBackendApiService;

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
    title: 'Chapter 1',
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
    unpublishing_reason: null,
  };

  const sampleTopic = {
    id: '0',
    title: 'Story Title',
    description: 'Story Description',
    node_titles: ['Chapter 1'],
    thumbnail_filename: 'image.svg',
    thumbnail_bg_color: '#F8BF74',
    story_is_published: true,
    completed_node_titles: ['Chapter 1'],
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
    node_titles: ['Chapter 1', 'Chapter 2'],
    thumbnail_filename: 'image.svg',
    thumbnail_bg_color: '#F8BF74',
    story_is_published: true,
    completed_node_titles: ['Chapter 1'],
    url_fragment: 'story-title',
    all_node_dicts: [sampleNode, sampleNode],
    topic_name: 'Topic',
    classroom_url_fragment: 'math',
    topic_url_fragment: 'topic',
  };

  const emptyImgTopic = {
    id: '0',
    title: 'Story Title',
    description: 'Story Description',
    node_titles: ['Chapter 1', 'Chapter 2'],
    thumbnail_filename: null,
    thumbnail_bg_color: '#F8BF74',
    story_is_published: true,
    completed_node_titles: [],
    url_fragment: 'story-title',
    all_node_dicts: [sampleNode, sampleNode],
    topic_name: 'Topic',
    classroom_url_fragment: 'math',
    topic_url_fragment: 'topic',
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule, HttpClientTestingModule],
      declarations: [LessonCardComponent, MockTranslatePipe],
      providers: [UrlInterpolationService, AssetsBackendApiService],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LessonCardComponent);
    component = fixture.componentInstance;

    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    assetsBackendApiService = TestBed.inject(AssetsBackendApiService);
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
    expect(component.lessonTopic).toEqual('Community Lessons');
  });

  it('should set story to complete StorySummary and its non-url values to the respective fields', () => {
    component.story = StorySummary.createFromBackendDict(sampleTopic);
    component.topic = sampleTopic.topic_name;

    fixture.detectChanges();

    expect(component.desc).toEqual(sampleTopic.title);
    expect(component.imgColor).toEqual(sampleTopic.thumbnail_bg_color);

    let nextStory =
      sampleTopic.completed_node_titles.length -
      (sampleTopic.completed_node_titles.length ===
      sampleTopic.node_titles.length
        ? 1
        : 0);

    expect(component.title).toEqual(
      `Chapter ${nextStory + 1}: ${sampleTopic.node_titles[nextStory]}`
    );
    expect(component.progress).toEqual(
      Math.floor(
        (sampleTopic.completed_node_titles.length /
          sampleTopic.node_titles.length) *
          100
      )
    );
    expect(component.lessonTopic).toEqual(sampleTopic.topic_name);
  });

  it('should set story to incomplete StorySummary and its non-url values to the respective fields', () => {
    component.story = StorySummary.createFromBackendDict(incompleteTopic);
    component.topic = incompleteTopic.topic_name;

    fixture.detectChanges();

    let nextStory =
      incompleteTopic.completed_node_titles.length -
      (incompleteTopic.completed_node_titles.length ===
      incompleteTopic.node_titles.length
        ? 1
        : 0);

    expect(component.title).toEqual(
      `Chapter ${nextStory + 1}: ${incompleteTopic.node_titles[nextStory]}`
    );
    expect(component.progress).toEqual(
      Math.floor(
        (incompleteTopic.completed_node_titles.length /
          incompleteTopic.node_titles.length) *
          100
      )
    );
    expect(component.lessonTopic).toEqual(incompleteTopic.topic_name);
  });

  it('should set story to CollectionSummary and set its imgUrl correctly', () => {
    component.story = CollectionSummary.createFromBackendDict(sampleCollection);

    fixture.detectChanges();

    expect(component.imgUrl).toBe(
      urlInterpolationService.getStaticImageUrl(
        sampleCollection.thumbnail_icon_url
      )
    );
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
      assetsBackendApiService.getThumbnailUrlForPreview(
        AppConstants.ENTITY_TYPE.STORY,
        sampleTopic.id,
        sampleTopic.thumbnail_filename
      )
    );
  });

  it('should set story to StorySummary and set its null imgUrl correctly', () => {
    component.story = StorySummary.createFromBackendDict(emptyImgTopic);
    component.topic = emptyImgTopic.topic_name;

    fixture.detectChanges();

    expect(component.imgUrl).toBe(
      urlInterpolationService.getStaticImageUrl('/subjects/Lightbulb.svg')
    );
  });

  it('should set imgUrl to default if encountering an error', () => {
    component.story = StorySummary.createFromBackendDict(sampleTopic);
    component.topic = sampleTopic.topic_name;

    fixture.detectChanges();
    const img = fixture.debugElement.nativeElement.querySelector('img');
    const spyError = spyOn(component, 'handleImageError').and.callThrough();
    img.dispatchEvent(new Event('error'));

    fixture.detectChanges();

    expect(spyError).toHaveBeenCalled();
    expect(component.imgUrl).toBe(
      urlInterpolationService.getStaticImageUrl('/subjects/Lightbulb.svg')
    );
  });

  it('should return Redo translation key when progress is 100', () => {
    component.story = StorySummary.createFromBackendDict(sampleTopic);
    component.topic = sampleTopic.topic_name;

    fixture.detectChanges();

    const buttonText = component.setButtonText();
    expect(buttonText).toBe('I18N_LEARNER_DASHBOARD_CARD_BUTTON_REDO');
  });

  it('should return Resume translation key when progress is < 100', () => {
    component.story = StorySummary.createFromBackendDict(incompleteTopic);
    component.topic = incompleteTopic.topic_name;

    fixture.detectChanges();

    const buttonText = component.setButtonText();
    expect(buttonText).toBe('I18N_LEARNER_DASHBOARD_CARD_BUTTON_RESUME');
  });

  it('should return Start translation key when progress is 0', () => {
    component.story = StorySummary.createFromBackendDict(emptyImgTopic);
    component.topic = emptyImgTopic.topic_name;

    fixture.detectChanges();

    const buttonText = component.setButtonText();
    expect(buttonText).toBe('I18N_LEARNER_DASHBOARD_CARD_BUTTON_START');
  });
});
