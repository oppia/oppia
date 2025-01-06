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
 * @fileoverview Unit tests for SkillCardComponent
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {FormsModule} from '@angular/forms';
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  flushMicrotasks,
  tick,
} from '@angular/core/testing';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {SkillCardComponent} from './skill-card.component';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {LearnerTopicSummary} from 'domain/topic/learner-topic-summary.model';
import {Subtopic} from '../../../domain/topic/subtopic.model';
import {AppConstants} from 'app.constants';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {LoaderService} from 'services/loader.service';
import {QuestionBackendApiService} from 'domain/question/question-backend-api.service';
import {SiteAnalyticsService} from 'services/site-analytics.service';
import {WindowRef} from 'services/contextual/window-ref.service';

class MockQuestionBackendApiService {
  async fetchTotalQuestionCountForSkillIdsAsync() {
    return Promise.resolve(1);
  }
}

class MockWindowRef {
  _window = {
    location: {
      href: '',
      reload: (val: boolean) => val,
    },
    gtag: () => {},
  };

  get nativeWindow() {
    return this._window;
  }
}

describe('SkillCardComponent', () => {
  let assetsBackendApiService: AssetsBackendApiService;
  let component: SkillCardComponent;
  let loaderService: LoaderService;
  let fixture: ComponentFixture<SkillCardComponent>;
  let siteAnalyticsService: SiteAnalyticsService;
  let questionBackendApiService: MockQuestionBackendApiService;
  let windowRef: MockWindowRef;
  let subtopic = {
    skill_ids: ['skill_id_2'],
    id: 1,
    title: 'subtopic_name',
    thumbnail_filename: 'image.svg',
    thumbnail_bg_color: '#F8BF74',
    url_fragment: 'subtopic-name',
  };
  let noSkillSubtopic = {
    skill_ids: [],
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
    prerequisite_skill_ids: ['skill_1'],
    acquired_skill_ids: ['skill_2'],
    destination_node_ids: ['node_2'],
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
  let nodeDict2 = {
    id: 'node_2',
    thumbnail_filename: 'image2.png',
    title: 'Chapter 2',
    description: 'Description 1',
    prerequisite_skill_ids: ['skill_1'],
    acquired_skill_ids: ['skill_2'],
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
  const learnerTopicSummaryBackendDict1 = {
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
      skill_id_1: 0.5,
      skill_id_2: 0.3,
    },
    skill_descriptions: {
      skill_id_1: 'Skill Description 1',
      skill_id_2: 'Skill Description 2',
    },
  };

  beforeEach(() => {
    windowRef = new MockWindowRef();
    questionBackendApiService = new MockQuestionBackendApiService();
    TestBed.configureTestingModule({
      imports: [FormsModule, HttpClientTestingModule],
      declarations: [SkillCardComponent, MockTranslatePipe],
      providers: [
        LoaderService,
        SiteAnalyticsService,
        {
          provide: QuestionBackendApiService,
          useValue: questionBackendApiService,
        },
        {provide: WindowRef, useValue: windowRef},
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SkillCardComponent);
    component = fixture.componentInstance;
    component.topic = LearnerTopicSummary.createFromBackendDict(
      learnerTopicSummaryBackendDict1
    );
    component.subtopic = Subtopic.create(subtopic, {
      skill_2: 'Skill Description 2',
    });
    component.progress = 100;

    assetsBackendApiService = TestBed.inject(AssetsBackendApiService);
    loaderService = TestBed.inject(LoaderService);
    siteAnalyticsService = TestBed.inject(SiteAnalyticsService);

    fixture.detectChanges();
  });

  it('should get thumbnail info on ngOnInIt', () => {
    spyOn(assetsBackendApiService, 'getThumbnailUrlForPreview')
      .withArgs(
        AppConstants.ENTITY_TYPE.TOPIC,
        component.topic.getId(),
        component.subtopic.getThumbnailFilename()
      )
      .and.callThrough();

    fixture.detectChanges();

    expect(component.imgUrl).toBe(
      '/assetsdevhandler/topic/sample_topic_id/assets/thumbnail/image.svg'
    );
    expect(component.imgColor).toBe('#F8BF74');
  });

  it('should check if there are questions', fakeAsync(() => {
    const totalQuestionSpy = spyOn(
      questionBackendApiService,
      'fetchTotalQuestionCountForSkillIdsAsync'
    ).and.callThrough();

    component.checkQuestionsExist();

    fixture.detectChanges();
    flushMicrotasks();

    expect(totalQuestionSpy).toHaveBeenCalledWith(['skill_id_2']);
    expect(component.questionStatus).toBeTruthy();
  }));

  it('should not check for questions because they are no skill ids', fakeAsync(() => {
    component.subtopic = Subtopic.create(noSkillSubtopic, {});
    component.checkQuestionsExist();

    fixture.detectChanges();

    expect(component.questionStatus).toBeFalsy();
  }));

  it('should open a new practice session', fakeAsync(() => {
    const registerPracticeSpy = spyOn(
      siteAnalyticsService,
      'registerPracticeSessionStartEvent'
    );
    const showLoadingSpy = spyOn(loaderService, 'showLoadingScreen');

    component.openNewPracticeSession();
    tick();

    expect(windowRef.nativeWindow.location.href).toBe(
      '/learn/math/topic-name/practice/session?' +
        'selected_subtopic_ids=%5B1%5D'
    );
    expect(registerPracticeSpy).toHaveBeenCalledWith('math', 'Topic Name', '1');
    expect(showLoadingSpy).toHaveBeenCalledWith('Loading');
  }));

  it('should return Redo translation key when progress is 100', () => {
    const buttonText = component.getButtonTranslationKey();
    expect(buttonText).toBe('I18N_LEARNER_DASHBOARD_CARD_BUTTON_REDO');
  });

  it('should return Resume translation key when progress is < 100', () => {
    component.progress = 40;

    fixture.detectChanges();

    const buttonText = component.getButtonTranslationKey();
    expect(buttonText).toBe('I18N_LEARNER_DASHBOARD_CARD_BUTTON_RESUME');
  });

  it('should return Start translation key when progress is 0', () => {
    component.progress = 0;

    fixture.detectChanges();

    const buttonText = component.getButtonTranslationKey();
    expect(buttonText).toBe('I18N_LEARNER_DASHBOARD_CARD_BUTTON_START');
  });
});
