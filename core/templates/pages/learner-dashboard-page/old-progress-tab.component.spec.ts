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
 * @fileoverview Unit tests for for OldProgressTabComponent.
 */

import {
  async,
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import {MaterialModule} from 'modules/material.module';
import {FormsModule} from '@angular/forms';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {OldProgressTabComponent} from './old-progress-tab.component';
import {EventEmitter, NO_ERRORS_SCHEMA} from '@angular/core';
import {LearnerDashboardBackendApiService} from 'domain/learner_dashboard/learner-dashboard-backend-api.service';
import {StorySummary} from 'domain/story/story-summary.model';
import {LearnerTopicSummary} from 'domain/topic/learner-topic-summary.model';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';

describe('Old Progress tab Component', () => {
  let component: OldProgressTabComponent;
  let fixture: ComponentFixture<OldProgressTabComponent>;
  let urlInterpolationService: UrlInterpolationService;
  let learnerDashboardBackendApiService: LearnerDashboardBackendApiService;
  let windowDimensionsService: WindowDimensionsService;
  let mockResizeEmitter: EventEmitter<void> = new EventEmitter();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [MaterialModule, FormsModule, HttpClientTestingModule],
      declarations: [MockTranslatePipe, OldProgressTabComponent],
      providers: [
        UrlInterpolationService,
        LearnerDashboardBackendApiService,
        {
          provide: WindowDimensionsService,
          useValue: {
            isWindowNarrow: () => true,
            getResizeEvent: () => mockResizeEmitter,
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OldProgressTabComponent);
    component = fixture.componentInstance;
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    learnerDashboardBackendApiService = TestBed.inject(
      LearnerDashboardBackendApiService
    );
    windowDimensionsService = TestBed.inject(WindowDimensionsService);
    const sampleStorySummaryBackendDict = {
      id: '0',
      title: 'Story Title',
      description: 'Story Description',
      node_titles: ['Chapter 1'],
      thumbnail_filename: 'image.svg',
      thumbnail_bg_color: '#F8BF74',
      story_is_published: true,
      completed_node_titles: ['Chapter 1'],
      url_fragment: 'story-title',
      all_node_dicts: [],
      topic_name: 'Topic',
      classroom_url_fragment: 'math',
      topic_url_fragment: 'topic',
    };
    let storySummary = StorySummary.createFromBackendDict(
      sampleStorySummaryBackendDict
    );
    component.completedStoriesList = [storySummary];
    let subtopic = {
      skill_ids: ['skill_id_2'],
      id: 1,
      title: 'subtopic_name',
      thumbnail_filename: 'image.svg',
      thumbnail_bg_color: '#F8BF74',
      url_fragment: 'subtopic-name',
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
    const learnerTopicSummaryBackendDict1 = {
      id: 'BqXdwH8YOsGX',
      name: 'Topic Name',
      language_code: 'en',
      description: 'description',
      version: 1,
      total_published_node_count: 0,
      story_titles: ['Story 1'],
      thumbnail_filename: 'image.svg',
      thumbnail_bg_color: '#C6DCDA',
      classroom: 'math',
      practice_tab_is_displayed: true,
      canonical_story_summary_dict: [
        {
          id: '0',
          title: 'Story Title',
          description: 'Story Description',
          node_titles: ['Chapter 1'],
          thumbnail_filename: 'image.svg',
          thumbnail_bg_color: '#F8BF74',
          story_is_published: true,
          completed_node_titles: ['Chapter 1'],
          url_fragment: 'story-title',
          all_node_dicts: [nodeDict],
        },
      ],
      url_fragment: 'topic-name',
      subtopics: [subtopic],
      degrees_of_mastery: {
        skill_id_1: 0.5,
        skill_id_2: 0.3,
      },
      skill_descriptions: {
        skill_id_1: 'Skill Description 1',
        skill_id_2: 'Skill Description 2',
      },
    };
    component.partiallyLearntTopicsList = [
      LearnerTopicSummary.createFromBackendDict(
        learnerTopicSummaryBackendDict1
      ),
    ];
    component.learntTopicsList = [];
    spyOn(
      learnerDashboardBackendApiService,
      'fetchSubtopicMastery'
    ).and.returnValue(Promise.resolve({}));
    component.displaySkills = [false];
    fixture.detectChanges();
  });

  it('should get the correct width in mobile view', () => {
    component.ngOnInit();
    expect(component.width).toEqual(233);
  });

  it('should check whether window is narrow', fakeAsync(() => {
    // We use tick() as ngOnInit is an async function in the component.
    component.ngOnInit();
    tick();

    expect(component.windowIsNarrow).toBeTrue();

    spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(false);
    mockResizeEmitter.emit();

    expect(component.windowIsNarrow).toBeFalse();
  }));

  it('should get static image url', () => {
    const urlSpy = spyOn(
      urlInterpolationService,
      'getStaticImageUrl'
    ).and.returnValue('/assets/images/learner_dashboard/star.svg');

    component.getStaticImageUrl('/learner_dashboard/star.svg');
    fixture.detectChanges();

    expect(urlSpy).toHaveBeenCalled();
  });

  it('should display skills', () => {
    component.showSkills(0);
    expect(component.displaySkills[0]).toEqual(true);
  });

  it('should switch the tab to Goals', () => {
    const setActiveSection = spyOn(component.setActiveSection, 'emit');
    component.changeActiveSection();
    expect(setActiveSection).toHaveBeenCalled();
  });

  it('should get the topic Mastery', () => {
    component.subtopicMastery = {
      BqXdwH8YOsGX: {
        1: 1,
        2: 0,
      },
      QqXdwH8YOsGX: {
        1: 0,
        2: 0,
      },
    };
    let subtopic = {
      skill_ids: ['skill_id_2'],
      id: 1,
      title: 'subtopic_name',
      thumbnail_filename: 'image.svg',
      thumbnail_bg_color: '#F8BF74',
      url_fragment: 'subtopic-name',
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
    const learnerTopicSummaryBackendDict = {
      id: 'BqXdwH8YOsGX',
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
          node_titles: ['Chapter 1'],
          thumbnail_filename: 'image.svg',
          thumbnail_bg_color: '#F8BF74',
          story_is_published: true,
          completed_node_titles: ['Chapter 1'],
          url_fragment: 'story-title',
          all_node_dicts: [nodeDict],
        },
      ],
      url_fragment: 'topic-name',
      subtopics: [subtopic],
      degrees_of_mastery: {
        skill_id_1: 0.5,
        skill_id_2: 0.3,
      },
      skill_descriptions: {
        skill_id_1: 'Skill Description 1',
        skill_id_2: 'Skill Description 2',
      },
    };
    let subtopic1 = {
      skill_ids: ['skill_id_2'],
      id: 1,
      title: 'subtopic_name',
      thumbnail_filename: 'image.svg',
      thumbnail_bg_color: '#F8BF74',
      url_fragment: 'subtopic-name',
    };
    const learnerTopicSummaryBackendDict1 = {
      id: 'QqXdwH8YOsGX',
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
          node_titles: ['Chapter 1'],
          thumbnail_filename: 'image.svg',
          thumbnail_bg_color: '#F8BF74',
          story_is_published: true,
          completed_node_titles: ['Chapter 1'],
          url_fragment: 'story-title',
          all_node_dicts: [nodeDict],
        },
      ],
      url_fragment: 'topic-name',
      subtopics: [subtopic1],
      degrees_of_mastery: {
        skill_id_1: 0,
        skill_id_2: 0,
      },
      skill_descriptions: {
        skill_id_1: 'Skill Description 1',
        skill_id_2: 'Skill Description 2',
      },
    };
    component.topicsInSkillProficiency = [
      LearnerTopicSummary.createFromBackendDict(learnerTopicSummaryBackendDict),
      LearnerTopicSummary.createFromBackendDict(
        learnerTopicSummaryBackendDict1
      ),
    ];
    component.getTopicMastery();
    expect(component.topicMastery).toEqual([
      [100, component.topicsInSkillProficiency[0]],
      [0, component.topicsInSkillProficiency[1]],
    ]);
  });

  it('should get circular progress', () => {
    let subtopic = {
      skill_ids: ['skill_id_2'],
      id: 1,
      title: 'subtopic_name',
      thumbnail_filename: 'image.svg',
      thumbnail_bg_color: '#F8BF74',
      url_fragment: 'subtopic-name',
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
    const learnerTopicSummaryBackendDict = {
      id: 'BqXdwH8YOsGX',
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
          node_titles: ['Chapter 1'],
          thumbnail_filename: 'image.svg',
          thumbnail_bg_color: '#F8BF74',
          story_is_published: true,
          completed_node_titles: ['Chapter 1'],
          url_fragment: 'story-title',
          all_node_dicts: [nodeDict],
        },
      ],
      url_fragment: 'topic-name',
      subtopics: [subtopic],
      degrees_of_mastery: {
        skill_id_1: 0.5,
        skill_id_2: 0.3,
      },
      skill_descriptions: {
        skill_id_1: 'Skill Description 1',
        skill_id_2: 'Skill Description 2',
      },
    };
    var topic = LearnerTopicSummary.createFromBackendDict(
      learnerTopicSummaryBackendDict
    );
    component.topicMastery = [[20, topic]];
    var cssStyle = component.calculateCircularProgress(0);
    expect(cssStyle).toEqual(
      'linear-gradient(162deg, transparent 50%, #CCCCCC 50%)' +
        ', linear-gradient(90deg, #CCCCCC 50%, transparent 50%)'
    );

    component.topicMastery = [[60, topic]];
    cssStyle = component.calculateCircularProgress(0);
    expect(cssStyle).toEqual(
      'linear-gradient(270deg, #00645C 50%, transparent 50%), ' +
        'linear-gradient(-54deg, #00645C 50%, #CCCCCC 50%)'
    );
  });
});
