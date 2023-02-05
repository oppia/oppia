// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for reviewTestPage.
 */

import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TranslateModule, TranslateLoader, TranslateFakeLoader, TranslateService } from '@ngx-translate/core';
import { ReviewTestBackendApiService } from 'domain/review_test/review-test-backend-api.service';
import { PageTitleService } from 'services/page-title.service';
import { ReviewTestPageComponent } from './review-test-page.component';
import { UrlService } from 'services/contextual/url.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { PracticeSessionsBackendApiService } from 'pages/practice-session-page/practice-session-backend-api.service';
import { CsrfTokenService } from 'services/csrf-token.service';
import { ReviewTest } from 'domain/review_test/review-test.model';

describe('Review test page component', () => {
  let component: ReviewTestPageComponent;
  let fixture: ComponentFixture<ReviewTestPageComponent>;
  let pageTitleService: PageTitleService;
  let reviewTestBackendApiService: ReviewTestBackendApiService;
  let urlService: UrlService;
  let i18nLanguageCodeService: I18nLanguageCodeService;
  let translateService: TranslateService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useClass: TranslateFakeLoader
          }
        })
      ],
      declarations: [
        ReviewTestPageComponent,
      ],
      providers: [
        TranslateService,
        PracticeSessionsBackendApiService,
        CsrfTokenService,
        PageTitleService,
        UrlService,
        I18nLanguageCodeService,
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));


  beforeEach(() => {
    fixture = TestBed.createComponent(ReviewTestPageComponent);
    component = fixture.componentInstance;

    pageTitleService = TestBed.inject(PageTitleService);
    reviewTestBackendApiService = TestBed.inject(ReviewTestBackendApiService);
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
    translateService = TestBed.inject(TranslateService);
    urlService = TestBed.inject(UrlService);

    spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue(
      'topic_1');
    spyOn(urlService, 'getClassroomUrlFragmentFromLearnerUrl').and.returnValue(
      'classroom_1');

    spyOn(
      reviewTestBackendApiService, 'fetchReviewTestDataAsync').and.returnValue(
      Promise.resolve(
        new ReviewTest(
          '', {skill_1: 'skill_1'})
      ));
    spyOn(translateService, 'use').and.stub();
    spyOn(translateService, 'instant').and.returnValue('translatedTitle');
  });

  it('should initialize correctly controller properties after its' +
  ' initialization and get skill details from backend', fakeAsync(() => {
    spyOn(urlService, 'getStoryUrlFragmentFromLearnerUrl').and.returnValue(
      'story_1');
    spyOn(component, 'subscribeToOnLanguageCodeChange');

    component.ngOnInit();
    tick();

    expect(component.subscribeToOnLanguageCodeChange).toHaveBeenCalled();
    expect(component.questionPlayerConfig).toEqual({
      resultActionButtons: [{
        type: 'REVIEW_LOWEST_SCORED_SKILL',
        i18nId: 'I18N_QUESTION_PLAYER_REVIEW_LOWEST_SCORED_SKILL'
      }, {
        type: 'RETRY_SESSION',
        i18nId: 'I18N_QUESTION_PLAYER_RETRY_TEST',
        url: '/learn/classroom_1/topic_1/review-test/story_1'
      }, {
        type: 'DASHBOARD',
        i18nId: 'I18N_QUESTION_PLAYER_RETURN_TO_STORY',
        url: '/learn/classroom_1/topic_1/story/story_1'
      }],
      skillList: ['skill_1'],
      skillDescriptions: ['skill_1'],
      questionCount: 3,
      questionPlayerMode: {
        modeType: 'PASS_FAIL',
        passCutoff: 0.75
      },
      questionsSortedByDifficulty: true
    });
  }));

  it('should throw error if story url is null', fakeAsync(() => {
    spyOn(urlService, 'getStoryUrlFragmentFromLearnerUrl').and.returnValue(
      null);
    expect(() => {
      component.ngOnInit();
      tick();
    }).toThrowError('Story url fragment cannot be null.');
  }));

  it('should subscribe to onLanguageCodeChange', () => {
    spyOn(urlService, 'getStoryUrlFragmentFromLearnerUrl').and.returnValue(
      'story_1');
    spyOn(component.directiveSubscriptions, 'add');
    spyOn(i18nLanguageCodeService.onI18nLanguageCodeChange, 'subscribe');

    component.subscribeToOnLanguageCodeChange();

    expect(component.directiveSubscriptions.add).toHaveBeenCalled();
    expect(i18nLanguageCodeService.onI18nLanguageCodeChange.subscribe)
      .toHaveBeenCalled();
  });

  it('should update title whenever the language changes', () => {
    spyOn(urlService, 'getStoryUrlFragmentFromLearnerUrl').and.returnValue(
      'story_1');
    component.subscribeToOnLanguageCodeChange();
    spyOn(component, 'setPageTitle');

    i18nLanguageCodeService.onI18nLanguageCodeChange.emit();

    expect(component.setPageTitle).toHaveBeenCalled();
  });

  it('should obtain translated title and set it', () => {
    spyOn(urlService, 'getStoryUrlFragmentFromLearnerUrl').and.returnValue(
      'story_1');
    spyOn(pageTitleService, 'setDocumentTitle');
    component.storyName = 'dummy_story_name';

    component.setPageTitle();

    expect(pageTitleService.setDocumentTitle)
      .toHaveBeenCalledWith('translatedTitle');
  });

  it('should unsubscribe on component destruction', () => {
    spyOn(urlService, 'getStoryUrlFragmentFromLearnerUrl').and.returnValue(
      'story_1');
    spyOn(component.directiveSubscriptions, 'unsubscribe');

    component.ngOnDestroy();

    expect(component.directiveSubscriptions.unsubscribe).toHaveBeenCalled();
  });
});
