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
      'getLanguageCodesRelatedToAudioLanguageCode',
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
    languageUtilService.getLanguageCodesRelatedToAudioLanguageCode.and.callFake(
      (code: string) => [code]
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
    expect(component.shouldShowFallbackCta()).toBe(true);
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

  it('should navigate with language params when preferred language is selected', () => {
    i18nLanguageCodeService.getCurrentI18nLanguageCode.and.returnValue('en');
    component.availableTextLanguageCodes = ['en', 'es'];
    component.availableVoiceoverLanguageCodes = ['en', 'es'];
    component.ngOnInit();

    spyOn(windowRef.nativeWindow.location, 'assign');
    component.onStartButtonClick();

    expect(windowRef.nativeWindow.location.assign).toHaveBeenCalled();
    const navigatedUrl = (
      windowRef.nativeWindow.location.assign as jasmine.Spy
    ).calls.mostRecent().args[0] as string;
    expect(navigatedUrl).toContain(
      '/explore/exp_1?topic_url_fragment=fractions'
    );
    expect(navigatedUrl).toContain('initialContentLanguageCode=en');
    expect(navigatedUrl).toContain('initialVoiceoverLanguageCode=en');
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

  it('should handle onStartButtonClick when startUrl is empty', () => {
    component.startUrl = '';
    spyOn(windowRef.nativeWindow.location, 'assign');
    component.onStartButtonClick();
    expect(windowRef.nativeWindow.location.assign).not.toHaveBeenCalled();
  });

  it('should navigate directly when no text language is selected', () => {
    component.startUrl = '/explore/123';
    component.selectedTextLanguageCode = null;
    component.selectedVoiceoverLanguageCode = null;
    spyOn(windowRef.nativeWindow.location, 'assign');
    component.onStartButtonClick();
    expect(windowRef.nativeWindow.location.assign).toHaveBeenCalledWith(
      '/explore/123'
    );
  });

  it('should auto-set voiceover when selected text language matches available voiceover codes', () => {
    i18nLanguageCodeService.getCurrentI18nLanguageCode.and.returnValue('en');
    component.availableTextLanguageCodes = ['en', 'es', 'fr'];
    component.availableVoiceoverLanguageCodes = ['en', 'es', 'fr'];
    component.selectedVoiceoverLanguageCode = null;
    component.selectedTextLanguageCode = null;
    component.ngOnInit();

    component.selectedVoiceoverLanguageCode = null;
    component.onSelectedTextLanguageCodeChange('fr');

    expect(component.selectedVoiceoverLanguageCode).toBe('fr');
  });

  it('should return Portuguese helper text when preferred language is available and site language is Portuguese', () => {
    i18nLanguageCodeService.getCurrentI18nLanguageCode.and.returnValue('pt');
    component.availableTextLanguageCodes = ['en', 'pt'];
    component.availableVoiceoverLanguageCodes = ['en', 'pt'];
    component.ngOnInit();

    component.onSelectedTextLanguageCodeChange('en');

    const helperText = component.getFallbackInfoTooltipText();
    expect(helperText).toContain('A hist\u00f3ria ser\u00e1 reproduzida em');
    expect(helperText).toContain('en');
  });

  it('should fall back to first available language when English is not available', () => {
    i18nLanguageCodeService.getCurrentI18nLanguageCode.and.returnValue('pt');
    component.availableTextLanguageCodes = ['fr', 'de'];
    component.availableVoiceoverLanguageCodes = ['fr', 'de'];
    component.ngOnInit();

    expect(component.selectedTextLanguageCode).toBe('fr');
    expect(component.selectedVoiceoverLanguageCode).toBe('fr');
  });

  it('should fall back to English voiceover when selected text code is not available as voiceover', () => {
    i18nLanguageCodeService.getCurrentI18nLanguageCode.and.returnValue('pt');
    component.availableTextLanguageCodes = ['fr'];
    component.availableVoiceoverLanguageCodes = ['en'];
    topicSessionFallbackLanguageService.getFallbackSelection.and.returnValue(
      null
    );
    component.ngOnInit();

    expect(component.selectedTextLanguageCode).toBe('fr');
    expect(component.selectedVoiceoverLanguageCode).toBe('en');
  });

  it('should prefer a compatible accent voiceover over English fallback', () => {
    i18nLanguageCodeService.getCurrentI18nLanguageCode.and.returnValue('pt');
    component.availableTextLanguageCodes = ['pt'];
    component.availableVoiceoverLanguageCodes = ['pt-br', 'en'];
    component.ngOnInit();

    expect(component.selectedTextLanguageCode).toBe('pt');
    expect(component.selectedVoiceoverLanguageCode).toBe('pt-br');
  });

  it('should handle navigateTo with empty url', () => {
    spyOn(windowRef.nativeWindow.location, 'assign');
    component.navigateTo('');
    expect(windowRef.nativeWindow.location.assign).not.toHaveBeenCalled();
  });

  it('should return false from isLessonUnavailableInPreferredLanguage when no text codes are available', () => {
    component.availableTextLanguageCodes = [];
    expect(component.isLessonUnavailableInPreferredLanguage()).toBeFalse();
  });

  it('should not save session fallback when selected text language code is null', () => {
    component.selectedTextLanguageCode = null;
    component.onSelectedTextLanguageCodeChange(null);
    expect(
      topicSessionFallbackLanguageService.saveFallbackSelection
    ).not.toHaveBeenCalled();
  });

  describe('ngOnChanges', () => {
    it('should update checkpoint statuses when lesson progress inputs change', () => {
      component.lessonProgressStatus = 'not_started';
      component.totalCheckpointsCount = 3;
      component.visitedCheckpointsCount = 0;

      component.ngOnChanges({
        lessonProgressStatus: {
          previousValue: undefined,
          currentValue: 'not_started',
          firstChange: true,
          isFirstChange: () => true,
        },
      });

      expect(component.checkpointStatuses.length).toBe(4);
    });

    it('should reinitialize language selection when language codes change', () => {
      component.availableTextLanguageCodes = [];

      component.ngOnChanges({
        availableTextLanguageCodes: {
          previousValue: ['en', 'es'],
          currentValue: [],
          firstChange: false,
          isFirstChange: () => false,
        },
      });

      expect(component.selectedTextLanguageCode).toBeNull();
      expect(component.selectedVoiceoverLanguageCode).toBeNull();
    });
  });

  describe('checkpointStatuses', () => {
    it('should compute checkpoint statuses for a completed lesson', () => {
      component.lessonProgressStatus = 'completed';
      component.totalCheckpointsCount = 2;
      component.visitedCheckpointsCount = 2;

      component.ngOnChanges({
        lessonProgressStatus: {
          previousValue: undefined,
          currentValue: 'completed',
          firstChange: true,
          isFirstChange: () => true,
        },
      });

      expect(component.checkpointStatuses).toEqual([
        'completed',
        'completed',
        'completed',
      ]);
    });

    it('should compute checkpoint statuses when visited count meets total', () => {
      component.lessonProgressStatus = 'in_progress';
      component.totalCheckpointsCount = 3;
      component.visitedCheckpointsCount = 3;

      component.ngOnChanges({
        lessonProgressStatus: {
          previousValue: undefined,
          currentValue: 'in_progress',
          firstChange: true,
          isFirstChange: () => true,
        },
      });

      expect(component.checkpointStatuses).toEqual([
        'completed',
        'completed',
        'completed',
        'completed',
      ]);
    });

    it('should compute checkpoint statuses for partial progress', () => {
      component.lessonProgressStatus = 'in_progress';
      component.totalCheckpointsCount = 3;
      component.visitedCheckpointsCount = 2;

      component.ngOnChanges({
        lessonProgressStatus: {
          previousValue: undefined,
          currentValue: 'in_progress',
          firstChange: true,
          isFirstChange: () => true,
        },
      });

      expect(component.checkpointStatuses).toEqual([
        'completed',
        'in-progress',
        'incomplete',
        'incomplete',
      ]);
    });

    it('should return empty array when lesson is coming_soon', () => {
      component.lessonProgressStatus = 'coming_soon';
      component.totalCheckpointsCount = 3;

      component.ngOnChanges({
        lessonProgressStatus: {
          previousValue: undefined,
          currentValue: 'coming_soon',
          firstChange: true,
          isFirstChange: () => true,
        },
      });

      expect(component.checkpointStatuses).toEqual([]);
    });

    it('should return empty array when totalCheckpointsCount is 0', () => {
      component.lessonProgressStatus = 'not_started';
      component.totalCheckpointsCount = 0;

      component.ngOnChanges({
        lessonProgressStatus: {
          previousValue: undefined,
          currentValue: 'not_started',
          firstChange: true,
          isFirstChange: () => true,
        },
      });

      expect(component.checkpointStatuses).toEqual([]);
    });
  });

  describe('progressPercent', () => {
    it('should return 0 when totalCheckpointsCount is 0', () => {
      component.totalCheckpointsCount = 0;
      expect(component.progressPercent).toBe(0);
    });

    it('should return 0 when lesson is coming_soon', () => {
      component.lessonProgressStatus = 'coming_soon';
      component.totalCheckpointsCount = 5;
      expect(component.progressPercent).toBe(0);
    });

    it('should return 100 when lesson is completed', () => {
      component.lessonProgressStatus = 'completed';
      component.totalCheckpointsCount = 3;
      component.visitedCheckpointsCount = 2;
      expect(component.progressPercent).toBe(100);
    });

    it('should return 100 when visited count exceeds total', () => {
      component.lessonProgressStatus = 'in_progress';
      component.totalCheckpointsCount = 3;
      component.visitedCheckpointsCount = 5;
      expect(component.progressPercent).toBe(100);
    });

    it('should compute progress percentage for partial progress', () => {
      component.lessonProgressStatus = 'in_progress';
      component.totalCheckpointsCount = 5;
      component.visitedCheckpointsCount = 2;
      expect(component.progressPercent).toBe(20);
    });
  });

  it('should navigate with correct URL when start button is clicked', () => {
    component.startUrl = '/explore/123';
    component.selectedTextLanguageCode = 'es';
    component.selectedVoiceoverLanguageCode = null;
    spyOn(windowRef.nativeWindow.location, 'assign');
    component.onStartButtonClick();
    expect(windowRef.nativeWindow.location.assign).toHaveBeenCalledWith(
      jasmine.stringMatching('initialContentLanguageCode=es')
    );
  });

  it('should set voiceover to first available when preferred language is not available', () => {
    i18nLanguageCodeService.getCurrentI18nLanguageCode.and.returnValue('pt');
    component.availableTextLanguageCodes = ['pt', 'de'];
    component.availableVoiceoverLanguageCodes = ['de'];
    topicSessionFallbackLanguageService.getFallbackSelection.and.returnValue(
      null
    );
    component.ngOnInit();

    expect(component.selectedTextLanguageCode).toBe('pt');
    expect(component.selectedVoiceoverLanguageCode).toBe('de');
  });

  it('should use saved fallback voiceover when it matches available codes', () => {
    i18nLanguageCodeService.getCurrentI18nLanguageCode.and.returnValue('en');
    component.availableTextLanguageCodes = ['es', 'de'];
    component.availableVoiceoverLanguageCodes = ['es', 'de'];
    topicSessionFallbackLanguageService.getFallbackSelection.and.returnValue({
      textLanguageCode: 'es',
      voiceoverLanguageCode: 'es',
    });
    component.ngOnInit();

    expect(component.selectedTextLanguageCode).toBe('es');
    expect(component.selectedVoiceoverLanguageCode).toBe('es');
  });

  describe('onSelectedTextLanguageCodeChange', () => {
    it('should not auto-set voiceover when selected text lang is not in voiceover list', () => {
      i18nLanguageCodeService.getCurrentI18nLanguageCode.and.returnValue('en');
      component.availableTextLanguageCodes = ['en', 'es', 'fr'];
      component.availableVoiceoverLanguageCodes = ['en', 'es'];
      component.selectedVoiceoverLanguageCode = null;
      component.selectedTextLanguageCode = null;
      component.ngOnInit();

      component.selectedVoiceoverLanguageCode = null;
      component.onSelectedTextLanguageCodeChange('fr');

      expect(component.selectedVoiceoverLanguageCode).toBeNull();
    });
  });

  describe('initializeLanguageSelection', () => {
    it('should set both language codes to null when no text codes are available', () => {
      component.availableTextLanguageCodes = [];
      component.availableVoiceoverLanguageCodes = [];
      component.ngOnInit();

      expect(component.selectedTextLanguageCode).toBeNull();
      expect(component.selectedVoiceoverLanguageCode).toBeNull();
    });
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

  describe('isVoiceoverCompatibleWithTextLanguage', () => {
    it('should match voiceover when related language codes include the text language root', () => {
      i18nLanguageCodeService.getCurrentI18nLanguageCode.and.returnValue('en');

      languageUtilService.getLanguageCodesRelatedToAudioLanguageCode.and.callFake(
        (code: string) => {
          if (code === 'fat') {
            return ['ak', 'fat'];
          }
          return [code];
        }
      );

      component.availableTextLanguageCodes = ['ak'];
      component.availableVoiceoverLanguageCodes = ['fat'];
      component.ngOnInit();

      expect(component.selectedTextLanguageCode).toBe('ak');
      expect(component.selectedVoiceoverLanguageCode).toBe('fat');
    });

    it('should not match voiceover when related language codes do not include the text root', () => {
      i18nLanguageCodeService.getCurrentI18nLanguageCode.and.returnValue('en');

      languageUtilService.getLanguageCodesRelatedToAudioLanguageCode.and.callFake(
        (code: string) => [code]
      );

      component.availableTextLanguageCodes = ['ak'];
      component.availableVoiceoverLanguageCodes = ['en'];
      component.ngOnInit();

      expect(component.selectedTextLanguageCode).toBe('ak');
      expect(component.selectedVoiceoverLanguageCode).toBe('en');
    });

    it('should gracefully handle errors from getLanguageCodesRelatedToAudioLanguageCode', () => {
      i18nLanguageCodeService.getCurrentI18nLanguageCode.and.returnValue('en');

      languageUtilService.getLanguageCodesRelatedToAudioLanguageCode.and.throwError(
        'Unknown language code'
      );

      component.availableTextLanguageCodes = ['ak'];
      component.availableVoiceoverLanguageCodes = ['en'];
      component.ngOnInit();

      expect(component.selectedTextLanguageCode).toBe('ak');
      expect(component.selectedVoiceoverLanguageCode).toBe('en');
    });
  });
});
