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
 * @fileoverview Unit tests for practice session page component.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {
  TranslateFakeLoader,
  TranslateLoader,
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';
import {PracticeSessionPageComponent} from 'pages/practice-session-page/practice-session-page.component';
import {UrlService} from 'services/contextual/url.service';
import {CsrfTokenService} from 'services/csrf-token.service';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {LoaderService} from 'services/loader.service';
import {PageTitleService} from 'services/page-title.service';
import {PracticeSessionsBackendApiService} from './practice-session-backend-api.service';

describe('Practice session page', () => {
  let component: PracticeSessionPageComponent;
  let fixture: ComponentFixture<PracticeSessionPageComponent>;
  let csrfTokenService: CsrfTokenService;
  let pageTitleService: PageTitleService;
  let urlService: UrlService;
  let translateService: TranslateService;
  let loaderService: LoaderService;
  let i18nLanguageCodeService: I18nLanguageCodeService;
  let practiceSessionsBackendApiService: PracticeSessionsBackendApiService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useClass: TranslateFakeLoader,
          },
        }),
      ],
      declarations: [PracticeSessionPageComponent],
      providers: [
        TranslateService,
        PracticeSessionsBackendApiService,
        CsrfTokenService,
        PageTitleService,
        UrlService,
        LoaderService,
        I18nLanguageCodeService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PracticeSessionPageComponent);
    component = fixture.componentInstance;

    csrfTokenService = TestBed.inject(CsrfTokenService);
    pageTitleService = TestBed.inject(PageTitleService);
    urlService = TestBed.inject(UrlService);
    loaderService = TestBed.inject(LoaderService);
    translateService = TestBed.inject(TranslateService);
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
    practiceSessionsBackendApiService = TestBed.inject(
      PracticeSessionsBackendApiService
    );

    spyOn(translateService, 'use').and.stub();
    spyOn(translateService, 'instant').and.returnValue('translatedTitle');
    spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue(
      'abbrev-topic'
    );
    spyOn(urlService, 'getSelectedSubtopicsFromUrl').and.returnValue(
      '["1","2","3","4","5"]'
    );
    spyOn(urlService, 'getClassroomUrlFragmentFromLearnerUrl').and.returnValue(
      'math'
    );
    spyOn(csrfTokenService, 'getTokenAsync').and.returnValue(
      Promise.resolve('sample-csrf-token')
    );

    fixture.detectChanges();
  });

  it(
    'should load topic based on its id on url when component is initialized' +
      ' and subscribe to languageCodeChange emitter',
    fakeAsync(() => {
      spyOn(loaderService, 'hideLoadingScreen');
      spyOn(component, 'subscribeToOnLanguageCodeChange');

      spyOn(
        practiceSessionsBackendApiService,
        'fetchPracticeSessionsData'
      ).and.returnValue(
        Promise.resolve({
          skill_ids_to_descriptions_map: {
            skill_1: 'Description 1',
            skill_2: 'Description 2',
          },
          topic_name: 'Foo Topic',
        })
      );

      component.ngOnInit();
      tick();

      expect(component.topicName).toBe('Foo Topic');
      expect(component.stringifiedSubtopicIds).toBe('["1","2","3","4","5"]');
      expect(component.questionPlayerConfig).toEqual({
        resultActionButtons: [
          {
            type: 'REVIEW_LOWEST_SCORED_SKILL',
            i18nId: 'I18N_QUESTION_PLAYER_REVIEW_LOWEST_SCORED_SKILL',
          },
          {
            type: 'DASHBOARD',
            i18nId: 'I18N_QUESTION_PLAYER_MY_DASHBOARD',
            url: '/learn/math/abbrev-topic',
          },
          {
            type: 'RETRY_SESSION',
            i18nId: 'I18N_QUESTION_PLAYER_NEW_SESSION',
            url:
              '/learn/math/abbrev-topic/practice/session?' +
              'selected_subtopic_ids=' +
              encodeURIComponent('["1","2","3","4","5"]'),
          },
        ],
        skillList: ['skill_1', 'skill_2'],
        skillDescriptions: ['Description 1', 'Description 2'],
        questionCount: 20,
        questionsSortedByDifficulty: false,
      });
      expect(component.subscribeToOnLanguageCodeChange).toHaveBeenCalled();
      expect(loaderService.hideLoadingScreen).toHaveBeenCalled();
    })
  );

  it('should subscribe to onLanguageCodeChange', () => {
    spyOn(component.directiveSubscriptions, 'add');
    spyOn(i18nLanguageCodeService.onI18nLanguageCodeChange, 'subscribe');

    component.subscribeToOnLanguageCodeChange();

    expect(component.directiveSubscriptions.add).toHaveBeenCalled();
    expect(
      i18nLanguageCodeService.onI18nLanguageCodeChange.subscribe
    ).toHaveBeenCalled();
  });

  it('should update title whenever the language changes', () => {
    component.subscribeToOnLanguageCodeChange();
    spyOn(component, 'setPageTitle');

    i18nLanguageCodeService.onI18nLanguageCodeChange.emit();

    expect(component.setPageTitle).toHaveBeenCalled();
  });

  it('should obtain translated title and set it', () => {
    spyOn(pageTitleService, 'setDocumentTitle');
    component.topicName = 'dummy_topic_name';

    component.setPageTitle();

    expect(pageTitleService.setDocumentTitle).toHaveBeenCalledWith(
      'translatedTitle'
    );
  });

  it('should unsubscribe on component destruction', () => {
    spyOn(component.directiveSubscriptions, 'unsubscribe');

    component.ngOnDestroy();

    expect(component.directiveSubscriptions.unsubscribe).toHaveBeenCalled();
  });
});
