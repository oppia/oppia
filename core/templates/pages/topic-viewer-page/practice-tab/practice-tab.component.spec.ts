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
 * @fileoverview Unit tests for practiceTab.
 */

import { TestBed, async, ComponentFixture, fakeAsync, flushMicrotasks, tick } from
  '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA, EventEmitter } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { TranslateService } from '@ngx-translate/core';

import { Subtopic } from 'domain/topic/subtopic.model';
import { PracticeTabComponent } from './practice-tab.component';
import { QuestionBackendApiService } from
  'domain/question/question-backend-api.service';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { UrlService } from 'services/contextual/url.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { LoaderService } from 'services/loader.service';

class MockUrlService {
  getTopicUrlFragmentFromLearnerUrl() {
    return 'topic_1';
  }

  getClassroomUrlFragmentFromLearnerUrl() {
    return 'classroom_1';
  }
}

class MockWindowRef {
  _window = {
    location: {
      href: '',
      reload: (val: boolean) => val
    },
    gtag: () => {}
  };

  get nativeWindow() {
    return this._window;
  }
}

class MockQuestionBackendApiService {
  async fetchTotalQuestionCountForSkillIdsAsync() {
    return Promise.resolve(1);
  }
}

class MockTranslateService {
  onLangChange: EventEmitter<string> = new EventEmitter();
  instant(key: string, interpolateParams?: Object): string {
    return key;
  }
}


describe('Practice tab component', function() {
  let component: PracticeTabComponent;
  let fixture: ComponentFixture<PracticeTabComponent>;
  let windowRef: MockWindowRef;
  let questionBackendApiService: MockQuestionBackendApiService;
  let ngbModal: NgbModal;
  let i18nLanguageCodeService: I18nLanguageCodeService;
  let loaderService: LoaderService;
  let translateService: TranslateService;

  beforeEach(async(() => {
    windowRef = new MockWindowRef();
    questionBackendApiService = new MockQuestionBackendApiService();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [PracticeTabComponent, MockTranslatePipe],
      providers: [
        NgbModal,
        I18nLanguageCodeService,
        LoaderService,
        UrlInterpolationService,
        { provide: UrlService, useClass: MockUrlService },
        { provide: WindowRef, useValue: windowRef },
        {
          provide: QuestionBackendApiService,
          useValue: questionBackendApiService
        },
        {
          provide: TranslateService,
          useClass: MockTranslateService
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PracticeTabComponent);
    component = fixture.componentInstance;
    component.topicName = 'Topic Name';
    component.subtopicsList = [
      Subtopic.create({
        id: 1,
        title: 'Subtopic 1',
        skill_ids: ['1', '2'],
        thumbnail_filename: '',
        thumbnail_bg_color: '',
        url_fragment: ''
      }, {
        1: 'First skill',
        2: 'Second skill'
      }),
      Subtopic.create({
        id: 2,
        title: 'Subtopic 2',
        skill_ids: [],
        thumbnail_filename: '',
        thumbnail_bg_color: '',
        url_fragment: ''
      }, {
        1: 'First skill',
        2: 'Second skill'
      })
    ];
    component.subtopicIds = [1, 2, 3];
    component.subtopicMastery = {
      1: 0,
      2: 1
    };
    fixture.detectChanges();
    ngbModal = TestBed.inject(NgbModal);
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
    loaderService = TestBed.inject(LoaderService);
    translateService = TestBed.inject(TranslateService);
  });

  it('should initialize controller properties after its initilization',
    function() {
      component.ngOnInit();

      expect(component.selectedSubtopics).toEqual([]);
      expect(component.availableSubtopics.length).toBe(1);
      expect(component.selectedSubtopicIndices).toEqual([false]);
    });

  it('should obtain topic translation key upon initialization, and subscribe ' +
  'to the language change event emitter', () => {
    component.topicId = 'topic_id_1';
    spyOn(i18nLanguageCodeService, 'getTopicTranslationKey').and.returnValue(
      'dummy_topic_translation_key');
    spyOn(component, 'subscribeToOnLangChange');
    spyOn(component, 'getTranslatedTopicName');

    component.ngOnInit();

    expect(i18nLanguageCodeService.getTopicTranslationKey)
      .toHaveBeenCalledWith('topic_id_1', 'TITLE');
    expect(component.topicNameTranslationKey).toEqual(
      'dummy_topic_translation_key');
    expect(component.subscribeToOnLangChange).toHaveBeenCalled();
    expect(component.getTranslatedTopicName).toHaveBeenCalled();
  });

  it('should obtain translated topic name whenever selected language changes',
    () => {
      component.subscribeToOnLangChange();
      spyOn(component, 'getTranslatedTopicName');

      translateService.onLangChange.emit();

      expect(component.getTranslatedTopicName).toHaveBeenCalled();
    });

  it('should obtain translated topic name and set it when hacky ' +
    'translations are available', () => {
    spyOn(i18nLanguageCodeService, 'isHackyTranslationAvailable')
      .and.returnValue(true);
    spyOn(i18nLanguageCodeService, 'isCurrentLanguageEnglish')
      .and.returnValue(false);
    spyOn(translateService, 'instant').and.callThrough();
    component.topicNameTranslationKey = 'dummy_translation_key';

    component.getTranslatedTopicName();

    expect(translateService.instant)
      .toHaveBeenCalledWith('dummy_translation_key');
    expect(component.translatedTopicName).toEqual('dummy_translation_key');
  });

  it('should not obtain translated topic name when hacky translations are ' +
    'unavailable, and use the default english topic name instead', () => {
    spyOn(i18nLanguageCodeService, 'isHackyTranslationAvailable')
      .and.returnValue(false);
    spyOn(i18nLanguageCodeService, 'isCurrentLanguageEnglish')
      .and.returnValue(false);
    spyOn(translateService, 'instant');
    component.topicName = 'default_topic_name';

    component.getTranslatedTopicName();

    expect(translateService.instant).not.toHaveBeenCalled();
    expect(component.translatedTopicName).toEqual('default_topic_name');
  });

  it('should have start button enabled when a subtopic is selected',
    function() {
      component.selectedSubtopicIndices[0] = true;
      component.questionsAreAvailable = true;

      expect(component.isStartButtonDisabled()).toBe(false);
    });

  it('should have start button disabled when there is no subtopic selected',
    function() {
      component.selectedSubtopicIndices[0] = false;

      expect(component.isStartButtonDisabled()).toBe(true);
    });

  it('should have start button disabled when the disable boolean is set',
    function() {
      component.previewMode = true;

      expect(component.isStartButtonDisabled()).toBe(true);
    });

  it('should open a new practice session containing the selected subtopic' +
    ' when start button is clicked for topicViewer display area', function() {
    spyOn(loaderService, 'showLoadingScreen');
    component.selectedSubtopicIndices[0] = true;

    component.openNewPracticeSession();

    expect(windowRef.nativeWindow.location.href).toBe(
      '/learn/classroom_1/topic_1/practice/session?' +
      'selected_subtopic_ids=%5B1%5D'
    );
    expect(loaderService.showLoadingScreen).toHaveBeenCalledWith('Loading');
  });

  it('should check if questions exist for the selected subtopics',
    fakeAsync(() => {
      component.checkIfQuestionsExist([true]);
      flushMicrotasks();

      expect(component.questionsAreAvailable).toBeTrue();

      component.checkIfQuestionsExist([false]);
      flushMicrotasks();

      expect(component.questionsAreAvailable).toBeFalse();
    }));

  it('should not ask learner for confirmation before starting a new practice ' +
    'session if site language is set to English', fakeAsync(() => {
    let isLanguageEnglishSpy = spyOn(
      i18nLanguageCodeService, 'isCurrentLanguageEnglish')
      .and.returnValue(true);
    let ngbModalSpy = spyOn(ngbModal, 'open').and.callFake(
      (modal, modalOptions) => {
        return ({
          result: Promise.resolve()
        } as NgbModalRef);
      });

    component.checkSiteLanguageBeforeBeginningPracticeSession();
    tick();

    expect(isLanguageEnglishSpy).toHaveBeenCalled();
    expect(ngbModalSpy).not.toHaveBeenCalled();
  }));

  it('should ask learner for confirmation before starting a new practice ' +
    'session if site language is not set to English', fakeAsync(() => {
    let isLanguageEnglishSpy = spyOn(
      i18nLanguageCodeService, 'isCurrentLanguageEnglish')
      .and.returnValue(false);
    let ngbModalSpy = spyOn(ngbModal, 'open').and.callFake(
      (modal, modalOptions) => {
        return ({
          result: Promise.resolve()
        } as NgbModalRef);
      });

    component.checkSiteLanguageBeforeBeginningPracticeSession();
    tick();

    expect(isLanguageEnglishSpy).toHaveBeenCalled();
    expect(ngbModalSpy).toHaveBeenCalled();
  }));

  it('should start a new practice session if the learner agrees to ' +
  'continue when site language is not set to English', fakeAsync(() => {
    let isLanguageEnglishSpy = spyOn(
      i18nLanguageCodeService, 'isCurrentLanguageEnglish')
      .and.returnValue(false);
    let newPracticeSessionSpy = spyOn(component, 'openNewPracticeSession');
    let ngbModalSpy = spyOn(ngbModal, 'open').and.callFake(
      (modal, modalOptions) => {
        return ({
          result: Promise.resolve()
        } as NgbModalRef);
      });

    component.checkSiteLanguageBeforeBeginningPracticeSession();
    tick();

    expect(isLanguageEnglishSpy).toHaveBeenCalled();
    expect(ngbModalSpy).toHaveBeenCalled();
    expect(newPracticeSessionSpy).toHaveBeenCalled();
  }));

  it('should not start a new practice session if the learner refuses to ' +
  'continue when site language is not set to English', fakeAsync(() => {
    let isLanguageEnglishSpy = spyOn(
      i18nLanguageCodeService, 'isCurrentLanguageEnglish')
      .and.returnValue(false);
    let newPracticeSessionSpy = spyOn(component, 'openNewPracticeSession');
    let ngbModalSpy = spyOn(ngbModal, 'open').and.callFake(
      (modal, modalOptions) => {
        return ({
          result: Promise.reject()
        } as NgbModalRef);
      });

    component.checkSiteLanguageBeforeBeginningPracticeSession();
    tick();

    expect(isLanguageEnglishSpy).toHaveBeenCalled();
    expect(ngbModalSpy).toHaveBeenCalled();
    expect(newPracticeSessionSpy).not.toHaveBeenCalled();
  }));

  it('should open a new practice session containing the selected subtopic' +
    ' when start button is clicked and learner agrees to continue', function() {
    spyOn(loaderService, 'showLoadingScreen');
    component.displayArea = 'progressTab';
    component.topicUrlFragment = 'topic_1';
    component.classroomUrlFragment = 'classroom_1';
    component.selectedSubtopicIndices[0] = true;

    component.openNewPracticeSession();

    expect(windowRef.nativeWindow.location.href).toBe(
      '/learn/classroom_1/topic_1/practice/session?' +
      'selected_subtopic_ids=%5B1%5D'
    );
    expect(loaderService.showLoadingScreen).toHaveBeenCalledWith('Loading');
  });

  it('should return background for progress of a subtopic', () => {
    component.subtopicMasteryArray = [10, 20];

    expect(component.getBackgroundForProgress(0)).toEqual(10);
  });

  it('should get subtopic mastery position for capsule', () => {
    component.clientWidth = 700;
    component.subtopicMasteryArray = [20, 99];

    expect(component.subtopicMasteryPosition(0)).toEqual(175);
    expect(component.subtopicMasteryPosition(1)).toEqual(12);

    component.clientWidth = 400;

    expect(component.subtopicMasteryPosition(0)).toEqual(150);
    expect(component.subtopicMasteryPosition(1)).toEqual(7);
  });

  it('should get mastery text color', () => {
    component.subtopicMasteryArray = [20, 99];

    expect(component.masteryTextColor(0)).toEqual('black');
    expect(component.masteryTextColor(1)).toEqual('white');
  });

  it('should unsubscribe upon component destruction', () => {
    spyOn(component.directiveSubscriptions, 'unsubscribe');

    component.ngOnDestroy();

    expect(component.directiveSubscriptions.unsubscribe).toHaveBeenCalled();
  });
});
