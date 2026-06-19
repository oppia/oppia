// Copyright 2026 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit tests for TopicLessonCardComponent.
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';

import {TopicLessonCardComponent} from './topic-lesson-card.component';
import {LanguageUtilService} from 'domain/utilities/language-util.service';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {TopicSessionFallbackLanguageService} from 'pages/topic-viewer-page/services/topic-session-fallback-language.service';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {MockTranslatePipe} from 'tests/unit-test-utils';

class MockWindowRef {
  nativeWindow = {
    location: {
      assign: (url: string) => {},
      origin: 'https://www.oppia.org',
    },
  };
}

describe('TopicLessonCardComponent', () => {
  let component: TopicLessonCardComponent;
  let fixture: ComponentFixture<TopicLessonCardComponent>;
  let urlInterpolationService: jasmine.SpyObj<UrlInterpolationService>;
  let i18nLanguageCodeService: jasmine.SpyObj<I18nLanguageCodeService>;
  let languageUtilService: jasmine.SpyObj<LanguageUtilService>;
  let topicSessionFallbackLanguageService: jasmine.SpyObj<TopicSessionFallbackLanguageService>;
  let windowRef: WindowRef;

  beforeEach(waitForAsync(() => {
    const urlInterpolationServiceSpy = jasmine.createSpyObj(
      'UrlInterpolationService',
      ['getStaticImageUrl']
    );
    const i18nLanguageCodeServiceSpy = jasmine.createSpyObj(
      'I18nLanguageCodeService',
      ['getCurrentI18nLanguageCode']
    );
    const languageUtilServiceSpy = jasmine.createSpyObj('LanguageUtilService', [
      'getContentLanguageDescription',
      'getAudioLanguageDescription',
    ]);
    const topicSessionFallbackLanguageServiceSpy = jasmine.createSpyObj(
      'TopicSessionFallbackLanguageService',
      ['getFallbackSelection', 'saveFallbackSelection', 'clearSelection']
    );

    TestBed.configureTestingModule({
      imports: [NgbModule],
      declarations: [TopicLessonCardComponent, MockTranslatePipe],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        {
          provide: UrlInterpolationService,
          useValue: urlInterpolationServiceSpy,
        },
        {
          provide: I18nLanguageCodeService,
          useValue: i18nLanguageCodeServiceSpy,
        },
        {
          provide: LanguageUtilService,
          useValue: languageUtilServiceSpy,
        },
        {
          provide: TopicSessionFallbackLanguageService,
          useValue: topicSessionFallbackLanguageServiceSpy,
        },
        {
          provide: WindowRef,
          useClass: MockWindowRef,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TopicLessonCardComponent);
    component = fixture.componentInstance;
    urlInterpolationService = TestBed.inject(
      UrlInterpolationService
    ) as jasmine.SpyObj<UrlInterpolationService>;
    i18nLanguageCodeService = TestBed.inject(
      I18nLanguageCodeService
    ) as jasmine.SpyObj<I18nLanguageCodeService>;
    languageUtilService = TestBed.inject(
      LanguageUtilService
    ) as jasmine.SpyObj<LanguageUtilService>;
    topicSessionFallbackLanguageService = TestBed.inject(
      TopicSessionFallbackLanguageService
    ) as jasmine.SpyObj<TopicSessionFallbackLanguageService>;
    windowRef = TestBed.inject(WindowRef);

    i18nLanguageCodeService.getCurrentI18nLanguageCode.and.returnValue('pt');
    languageUtilService.getContentLanguageDescription.and.callFake(
      (languageCode: string) => languageCode
    );
    languageUtilService.getAudioLanguageDescription.and.callFake(
      (languageCode: string) => languageCode
    );
    topicSessionFallbackLanguageService.getFallbackSelection.and.returnValue(
      null
    );

    component.startUrl = '/explore/exp_1?topic_url_fragment=fractions';
    component.availableTextLanguageCodes = ['en', 'es'];
    component.availableVoiceoverLanguageCodes = ['en', 'es'];
  }));

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should use provided thumbnail url on initialization', () => {
    component.thumbnailUrl = '/assets/lesson-thumbnail.png';

    component.ngOnInit();

    expect(component.resolvedThumbnailUrl).toBe('/assets/lesson-thumbnail.png');
  });

  it('should use fallback thumbnail url when thumbnail url is empty', () => {
    urlInterpolationService.getStaticImageUrl.and.returnValue(
      '/assets/fallback-thumbnail.webp'
    );

    component.thumbnailUrl = '';

    component.ngOnInit();

    expect(urlInterpolationService.getStaticImageUrl).toHaveBeenCalledWith(
      '/splash/student_desk1x.webp'
    );
    expect(component.resolvedThumbnailUrl).toBe(
      '/assets/fallback-thumbnail.webp'
    );
  });

  it('should select preferred language when available', () => {
    i18nLanguageCodeService.getCurrentI18nLanguageCode.and.returnValue('en');
    component.availableTextLanguageCodes = ['en', 'es'];
    component.availableVoiceoverLanguageCodes = ['en', 'es'];

    component.ngOnInit();

    expect(component.selectedTextLanguageCode).toBe('en');
    expect(component.shouldShowFallbackCta()).toBe(false);
  });

  it('should fall back to session language when preferred language is unavailable', () => {
    i18nLanguageCodeService.getCurrentI18nLanguageCode.and.returnValue('pt');
    topicSessionFallbackLanguageService.getFallbackSelection.and.returnValue({
      textLanguageCode: 'es',
      voiceoverLanguageCode: 'es',
    });

    component.availableTextLanguageCodes = ['en', 'es'];
    component.availableVoiceoverLanguageCodes = ['en', 'es'];
    component.ngOnInit();

    expect(component.selectedTextLanguageCode).toBe('es');
    expect(component.selectedVoiceoverLanguageCode).toBe('es');
    expect(component.shouldShowFallbackCta()).toBe(true);
  });

  it('should fall back to English when preferred and session languages are unavailable', () => {
    i18nLanguageCodeService.getCurrentI18nLanguageCode.and.returnValue('pt');
    topicSessionFallbackLanguageService.getFallbackSelection.and.returnValue(
      null
    );

    component.availableTextLanguageCodes = ['en', 'fr'];
    component.availableVoiceoverLanguageCodes = ['en'];
    component.ngOnInit();

    expect(component.selectedTextLanguageCode).toBe('en');
    expect(component.selectedVoiceoverLanguageCode).toBe('en');
    expect(component.shouldShowFallbackCta()).toBe(true);
  });

  it('should persist manual fallback selection in current session', () => {
    component.ngOnInit();

    component.onSelectedTextLanguageCodeChange('es');
    component.onSelectedVoiceoverLanguageCodeChange('es');

    expect(
      topicSessionFallbackLanguageService.saveFallbackSelection
    ).toHaveBeenCalledWith('es', 'es');
  });

  it('should append selected language params to start URL when unavailable in preferred language', () => {
    component.ngOnInit();
    component.onSelectedTextLanguageCodeChange('es');
    component.onSelectedVoiceoverLanguageCodeChange('es');

    spyOn(windowRef.nativeWindow.location, 'assign');
    component.onStartButtonClick();

    expect(windowRef.nativeWindow.location.assign).toHaveBeenCalled();
    const navigatedUrl = (
      windowRef.nativeWindow.location.assign as jasmine.Spy
    ).calls.mostRecent().args[0] as string;
    expect(navigatedUrl).toContain('initialContentLanguageCode=es');
    expect(navigatedUrl).toContain('initialVoiceoverLanguageCode=es');
  });

  it('should navigate directly when preferred language is available', () => {
    i18nLanguageCodeService.getCurrentI18nLanguageCode.and.returnValue('en');
    component.availableTextLanguageCodes = ['en', 'es'];
    component.availableVoiceoverLanguageCodes = ['en', 'es'];
    component.ngOnInit();

    spyOn(windowRef.nativeWindow.location, 'assign');
    component.onStartButtonClick();

    expect(windowRef.nativeWindow.location.assign).toHaveBeenCalledWith(
      '/explore/exp_1?topic_url_fragment=fractions'
    );
  });

  it('should navigate with language params when user changes language even if preferred is available', () => {
    i18nLanguageCodeService.getCurrentI18nLanguageCode.and.returnValue('en');
    component.availableTextLanguageCodes = ['en', 'es'];
    component.availableVoiceoverLanguageCodes = ['en', 'es'];
    component.ngOnInit();

    component.onSelectedTextLanguageCodeChange('es');
    component.onSelectedVoiceoverLanguageCodeChange('es');

    spyOn(windowRef.nativeWindow.location, 'assign');
    component.onStartButtonClick();

    expect(windowRef.nativeWindow.location.assign).toHaveBeenCalled();
    const navigatedUrl = (
      windowRef.nativeWindow.location.assign as jasmine.Spy
    ).calls.mostRecent().args[0] as string;
    expect(navigatedUrl).toContain('initialContentLanguageCode=es');
    expect(navigatedUrl).toContain('initialVoiceoverLanguageCode=es');
  });

  it('should show fallback CTA when user selects different language even if preferred is available', () => {
    i18nLanguageCodeService.getCurrentI18nLanguageCode.and.returnValue('en');
    component.availableTextLanguageCodes = ['en', 'es'];
    component.availableVoiceoverLanguageCodes = ['en', 'es'];
    component.ngOnInit();

    expect(component.shouldShowFallbackCta()).toBe(false);

    component.onSelectedTextLanguageCodeChange('es');

    expect(component.shouldShowFallbackCta()).toBe(true);
    expect(component.getStartButtonLabel()).toBe('Play Lesson in es 🌐');
  });

  it('should persist session language even when preferred language is available', () => {
    i18nLanguageCodeService.getCurrentI18nLanguageCode.and.returnValue('en');
    component.availableTextLanguageCodes = ['en', 'es'];
    component.availableVoiceoverLanguageCodes = [];
    component.ngOnInit();

    component.onSelectedTextLanguageCodeChange('es');

    expect(
      topicSessionFallbackLanguageService.saveFallbackSelection
    ).toHaveBeenCalledWith('es', null);
  });

  it('should return fallback CTA label in Portuguese when site language is Portuguese', () => {
    i18nLanguageCodeService.getCurrentI18nLanguageCode.and.returnValue('pt');
    component.ngOnInit();

    component.onSelectedTextLanguageCodeChange('en');

    expect(component.getStartButtonLabel()).toBe('Jogar Lição em en 🌐');
  });

  it('should return fallback CTA label in English when site language is English', () => {
    i18nLanguageCodeService.getCurrentI18nLanguageCode.and.returnValue('en');
    component.availableTextLanguageCodes = ['en', 'es'];
    component.availableVoiceoverLanguageCodes = ['en', 'es'];
    component.ngOnInit();

    component.onSelectedTextLanguageCodeChange('es');

    expect(component.getStartButtonLabel()).toBe('Play Lesson in es 🌐');
  });

  it('should return helper text in site language when preferred language is unavailable', () => {
    i18nLanguageCodeService.getCurrentI18nLanguageCode.and.returnValue('pt');
    component.availableTextLanguageCodes = ['en'];
    component.ngOnInit();

    component.onSelectedTextLanguageCodeChange('en');

    const helperText = component.getFallbackInfoTooltipText();
    expect(helperText).toContain('Esta hist\u00f3ria ainda est\u00e1 em');
    expect(helperText).toContain('en');
    expect(helperText).toContain('mas voc\u00ea ainda pode jog\u00e1-la');
  });

  it('should return helper text in English when site language is English and preferred is unavailable', () => {
    i18nLanguageCodeService.getCurrentI18nLanguageCode.and.returnValue('fr');
    component.availableTextLanguageCodes = ['en'];
    component.ngOnInit();

    component.onSelectedTextLanguageCodeChange('en');

    const helperText = component.getFallbackInfoTooltipText();
    expect(helperText).toContain('This story is still in');
    expect(helperText).toContain('en');
    expect(helperText).toContain('but you can still play it');
  });

  it('should return helper text when preferred language is available but user selects different language', () => {
    i18nLanguageCodeService.getCurrentI18nLanguageCode.and.returnValue('en');
    component.availableTextLanguageCodes = ['en', 'es'];
    component.ngOnInit();

    component.onSelectedTextLanguageCodeChange('es');

    const helperText = component.getFallbackInfoTooltipText();
    expect(helperText).toContain('The story will be played in');
    expect(helperText).toContain('es');
  });

  it('should return thumbnail alt text with lesson title', () => {
    component.lessonTitle = 'Introduction to Fractions';

    expect(component.getThumbnailAltText()).toBe(
      'Lesson thumbnail for Introduction to Fractions'
    );
  });

  it('should return default thumbnail alt text when lesson title is empty', () => {
    component.lessonTitle = '';

    expect(component.getThumbnailAltText()).toBe('Lesson thumbnail');
  });

  describe('showCheckpointBar', () => {
    it('should return true when not coming_soon and totalCheckpointsCount > 0', () => {
      component.lessonProgressStatus = 'not_started';
      component.totalCheckpointsCount = 5;
      expect(component.showCheckpointBar).toBe(true);

      component.lessonProgressStatus = 'in_progress';
      component.totalCheckpointsCount = 3;
      expect(component.showCheckpointBar).toBe(true);

      component.lessonProgressStatus = 'completed';
      component.totalCheckpointsCount = 1;
      expect(component.showCheckpointBar).toBe(true);
    });

    it('should return false when lesson is coming_soon', () => {
      component.lessonProgressStatus = 'coming_soon';
      component.totalCheckpointsCount = 5;
      expect(component.showCheckpointBar).toBe(false);
    });

    it('should return false when totalCheckpointsCount is 0', () => {
      component.lessonProgressStatus = 'not_started';
      component.totalCheckpointsCount = 0;
      expect(component.showCheckpointBar).toBe(false);
    });
  });
});
