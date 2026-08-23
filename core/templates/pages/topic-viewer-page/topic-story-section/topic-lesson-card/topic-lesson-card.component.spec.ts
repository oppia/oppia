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

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA, SimpleChange} from '@angular/core';

import {TopicLessonCardComponent} from './topic-lesson-card.component';
import {LanguageUtilService} from 'domain/utilities/language-util.service';
import {TopicSessionFallbackLanguageService} from 'pages/topic-viewer-page/services/topic-session-fallback-language.service';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
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
  let componentRef: {
    isVoiceoverCompatibleWithTextLanguage: (
      voiceoverCode: string,
      textLanguageCode: string
    ) => boolean;
    getInitialVoiceoverLanguageCode: (
      sessionFallbackVoiceoverLanguageCode: string | null,
      selectedTextLanguageCode: string | null
    ) => string | null;
    getFallbackTextLanguageCode: () => string;
    saveSessionFallbackLanguageSelection: () => void;
    getLanguageDescription: (languageCode: string) => string;
    getLessonStartUrlWithLanguageSelection: (
      textLanguageCode: string,
      voiceoverLanguageCode: string | null
    ) => string;
  };
  let fixture: ComponentFixture<TopicLessonCardComponent>;
  let urlInterpolationService: jasmine.SpyObj<UrlInterpolationService>;
  let windowRef: WindowRef;
  let languageUtilService: jasmine.SpyObj<LanguageUtilService>;
  let i18nLanguageCodeService: jasmine.SpyObj<I18nLanguageCodeService>;
  let topicSessionFallbackLanguageService: jasmine.SpyObj<TopicSessionFallbackLanguageService>;

  beforeEach(waitForAsync(() => {
    const urlInterpolationServiceSpy = jasmine.createSpyObj(
      'UrlInterpolationService',
      ['getStaticImageUrl']
    );
    const languageUtilServiceSpy = jasmine.createSpyObj('LanguageUtilService', [
      'getContentLanguageDescription',
      'getAudioLanguageDescription',
      'getLanguageCodesRelatedToAudioLanguageCode',
    ]);
    const i18nLanguageCodeServiceSpy = jasmine.createSpyObj(
      'I18nLanguageCodeService',
      ['getCurrentI18nLanguageCode']
    );
    const topicSessionFallbackLanguageServiceSpy = jasmine.createSpyObj(
      'TopicSessionFallbackLanguageService',
      ['getFallbackSelection', 'saveFallbackSelection']
    );

    TestBed.configureTestingModule({
      declarations: [TopicLessonCardComponent, MockTranslatePipe],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        {
          provide: UrlInterpolationService,
          useValue: urlInterpolationServiceSpy,
        },
        {
          provide: LanguageUtilService,
          useValue: languageUtilServiceSpy,
        },
        {
          provide: I18nLanguageCodeService,
          useValue: i18nLanguageCodeServiceSpy,
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
    componentRef = component as unknown as typeof componentRef;
    urlInterpolationService = TestBed.inject(
      UrlInterpolationService
    ) as jasmine.SpyObj<UrlInterpolationService>;
    languageUtilService = TestBed.inject(
      LanguageUtilService
    ) as jasmine.SpyObj<LanguageUtilService>;
    i18nLanguageCodeService = TestBed.inject(
      I18nLanguageCodeService
    ) as jasmine.SpyObj<I18nLanguageCodeService>;
    topicSessionFallbackLanguageService = TestBed.inject(
      TopicSessionFallbackLanguageService
    ) as jasmine.SpyObj<TopicSessionFallbackLanguageService>;
    windowRef = TestBed.inject(WindowRef);
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

  it('should not call UrlInterpolationService when thumbnail url is provided', () => {
    component.thumbnailUrl = '/assets/custom-thumbnail.png';

    component.ngOnInit();

    expect(urlInterpolationService.getStaticImageUrl).not.toHaveBeenCalled();
    expect(component.resolvedThumbnailUrl).toBe('/assets/custom-thumbnail.png');
  });

  it('should execute navigateTo when url is provided', () => {
    spyOn(windowRef.nativeWindow.location, 'assign');

    component.navigateTo('/explore/123');

    expect(windowRef.nativeWindow.location.assign).toHaveBeenCalledWith(
      '/explore/123'
    );
  });

  it('should execute navigateTo when url is empty', () => {
    expect(() => {
      component.navigateTo('');
    }).not.toThrowError();
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

  it('should return true when not coming_soon and totalCheckpointsCount > 0', () => {
    component.lessonProgressStatus = 'not_started';
    component.totalCheckpointsCount = 5;
    expect(component.showCheckpointBar).toBeTrue();

    component.lessonProgressStatus = 'in_progress';
    component.totalCheckpointsCount = 3;
    expect(component.showCheckpointBar).toBeTrue();

    component.lessonProgressStatus = 'completed';
    component.totalCheckpointsCount = 1;
    expect(component.showCheckpointBar).toBeTrue();
  });

  it('should return false when lesson is coming_soon', () => {
    component.lessonProgressStatus = 'coming_soon';
    component.totalCheckpointsCount = 5;
    expect(component.showCheckpointBar).toBeFalse();
  });

  it('should return false when totalCheckpointsCount is 0', () => {
    component.lessonProgressStatus = 'not_started';
    component.totalCheckpointsCount = 0;
    expect(component.showCheckpointBar).toBeFalse();
  });

  it('should expose isComingSoonLesson based on lesson progress status', () => {
    component.lessonProgressStatus = 'coming_soon';
    expect(component.isComingSoonLesson).toBeTrue();

    component.lessonProgressStatus = 'not_started';
    expect(component.isComingSoonLesson).toBeFalse();
  });

  it('should navigate to startUrl directly when no fallback is needed', () => {
    spyOn(component, 'navigateTo');
    component.startUrl = '/explore/123';
    component.selectedTextLanguageCode = null;

    component.onStartButtonClick();

    expect(component.navigateTo).toHaveBeenCalledWith('/explore/123');
  });

  it('should navigate with language query params when fallback CTA is needed', () => {
    spyOn(component, 'navigateTo');
    component.startUrl = '/explore/123';
    component.selectedTextLanguageCode = 'fr';
    component.selectedVoiceoverLanguageCode = 'fr';

    component.onStartButtonClick();

    expect(component.navigateTo).toHaveBeenCalledWith(
      'https://www.oppia.org/explore/123?initialContentLanguageCode=fr&initialVoiceoverLanguageCode=fr'
    );
  });

  it('should not navigate when startUrl is empty', () => {
    spyOn(component, 'navigateTo');
    component.startUrl = '';

    component.onStartButtonClick();

    expect(component.navigateTo).not.toHaveBeenCalled();
  });

  it('should not navigate when lesson is coming soon', () => {
    spyOn(component, 'navigateTo');
    component.startUrl = '/explore/123';
    component.lessonProgressStatus = 'coming_soon';

    component.onStartButtonClick();

    expect(component.navigateTo).not.toHaveBeenCalled();
  });

  it('should update selectedTextLanguageCode', () => {
    component.onSelectedTextLanguageCodeChange('fr');

    expect(component.selectedTextLanguageCode).toBe('fr');
  });

  it('should auto-select compatible voiceover language code', () => {
    component.availableVoiceoverLanguageCodes = ['fr', 'es', 'de'];
    component.selectedVoiceoverLanguageCode = null;

    component.onSelectedTextLanguageCodeChange('fr');

    expect(component.selectedVoiceoverLanguageCode).toBe('fr');
  });

  it('should not change existing voiceover selection', () => {
    component.selectedVoiceoverLanguageCode = 'de';
    component.availableVoiceoverLanguageCodes = ['fr', 'es', 'de'];

    component.onSelectedTextLanguageCodeChange('fr');

    expect(component.selectedVoiceoverLanguageCode).toBe('de');
  });

  it('should find compatible voiceover when exact match is not available', () => {
    component.availableVoiceoverLanguageCodes = ['es', 'de'];
    component.selectedVoiceoverLanguageCode = null;
    languageUtilService.getLanguageCodesRelatedToAudioLanguageCode
      .withArgs('es')
      .and.returnValue(['pt']);
    languageUtilService.getLanguageCodesRelatedToAudioLanguageCode
      .withArgs('de')
      .and.returnValue([]);

    component.onSelectedTextLanguageCodeChange('pt');

    expect(component.selectedVoiceoverLanguageCode).toBe('es');
  });

  it('should not crash when languageUtilService throws', () => {
    component.availableVoiceoverLanguageCodes = ['es', 'de'];
    component.selectedVoiceoverLanguageCode = null;
    languageUtilService.getLanguageCodesRelatedToAudioLanguageCode
      .withArgs('es')
      .and.throwError('error');

    expect(() => {
      component.onSelectedTextLanguageCodeChange('fr');
    }).not.toThrowError();
  });

  it('should save fallback selection to session service', () => {
    topicSessionFallbackLanguageService.saveFallbackSelection.and.stub();

    component.onSelectedTextLanguageCodeChange('fr');

    expect(
      topicSessionFallbackLanguageService.saveFallbackSelection
    ).toHaveBeenCalledWith('fr', null);
  });

  it('should update selectedVoiceoverLanguageCode and save to session', () => {
    component.selectedVoiceoverLanguageCode = null;
    component.selectedTextLanguageCode = 'fr';

    component.onSelectedVoiceoverLanguageCodeChange('fr-CA');

    expect(component.selectedVoiceoverLanguageCode).toBe('fr-CA');
    expect(
      topicSessionFallbackLanguageService.saveFallbackSelection
    ).toHaveBeenCalledWith('fr', 'fr-CA');
  });

  it('should return true when any available language is not English', () => {
    component.availableTextLanguageCodes = ['en', 'fr'];

    expect(component.shouldShowInfoIcon).toBeTrue();
  });

  it('should return false when only English is available', () => {
    component.availableTextLanguageCodes = ['en'];

    expect(component.shouldShowInfoIcon).toBeFalse();
  });

  it('should return false when no languages are available', () => {
    component.availableTextLanguageCodes = [];

    expect(component.shouldShowInfoIcon).toBeFalse();
  });

  it('should return true when a text language is selected', () => {
    component.selectedTextLanguageCode = 'fr';

    expect(component.shouldShowFallbackCta()).toBeTrue();
  });

  it('should return false when no text language is selected', () => {
    component.selectedTextLanguageCode = null;

    expect(component.shouldShowFallbackCta()).toBeFalse();
  });

  it('should return false when availableTextLanguageCodes is empty', () => {
    component.availableTextLanguageCodes = [];

    expect(component.isLessonUnavailableInPreferredLanguage()).toBeFalse();
  });

  it('should return true when preferred language is not in available', () => {
    component.availableTextLanguageCodes = ['en', 'fr'];
    i18nLanguageCodeService.getCurrentI18nLanguageCode.and.returnValues(
      'hi',
      'hi'
    );

    expect(component.isLessonUnavailableInPreferredLanguage()).toBeTrue();
  });

  it('should return false when preferred language is available', () => {
    component.availableTextLanguageCodes = ['en', 'hi'];
    i18nLanguageCodeService.getCurrentI18nLanguageCode.and.returnValues(
      'hi',
      'hi'
    );

    expect(component.isLessonUnavailableInPreferredLanguage()).toBeFalse();
  });

  it('should return fallback info when lesson is unavailable in preferred language', () => {
    component.availableTextLanguageCodes = ['en', 'fr'];
    component.selectedTextLanguageCode = 'fr';
    i18nLanguageCodeService.getCurrentI18nLanguageCode.and.returnValue('hi');
    languageUtilService.getContentLanguageDescription
      .withArgs('fr')
      .and.returnValue('French');

    expect(component.getFallbackInfoTooltipText()).toBe(
      'This story is still in French, but you can still play it!'
    );
  });

  it('should return info about playback language when preferred language is available', () => {
    component.availableTextLanguageCodes = ['en', 'fr'];
    component.selectedTextLanguageCode = 'fr';
    i18nLanguageCodeService.getCurrentI18nLanguageCode.and.returnValue('en');
    languageUtilService.getContentLanguageDescription
      .withArgs('fr')
      .and.returnValue('French');

    expect(component.getFallbackInfoTooltipText()).toBe(
      'The story will be played in French.'
    );
  });

  it('should use AudioLanguageDescription fallback when content description is missing', () => {
    component.selectedTextLanguageCode = 'fr';
    i18nLanguageCodeService.getCurrentI18nLanguageCode.and.returnValue('en');
    languageUtilService.getContentLanguageDescription
      .withArgs('fr')
      .and.returnValue(null);
    languageUtilService.getAudioLanguageDescription
      .withArgs('fr')
      .and.returnValue('French (Audio)');

    expect(component.getFallbackInfoTooltipText()).toBe(
      'The story will be played in French (Audio).'
    );
  });

  it('should set language codes to null when no text languages available', () => {
    component.availableTextLanguageCodes = [];

    component.ngOnInit();

    expect(component.selectedTextLanguageCode).toBeNull();
    expect(component.selectedVoiceoverLanguageCode).toBeNull();
  });

  it('should use preferred language when available', () => {
    component.availableTextLanguageCodes = ['en', 'fr', 'es'];
    i18nLanguageCodeService.getCurrentI18nLanguageCode.and.returnValue('fr');

    component.ngOnInit();

    expect(component.selectedTextLanguageCode).toBe('fr');
  });

  it('should use session fallback when preferred language is unavailable', () => {
    component.availableTextLanguageCodes = ['en', 'fr', 'es'];
    i18nLanguageCodeService.getCurrentI18nLanguageCode.and.returnValue('hi');
    topicSessionFallbackLanguageService.getFallbackSelection.and.returnValue({
      textLanguageCode: 'fr',
      voiceoverLanguageCode: null,
    });

    component.ngOnInit();

    expect(component.selectedTextLanguageCode).toBe('fr');
  });

  it('should use English as fallback when session is not available', () => {
    component.availableTextLanguageCodes = ['en', 'fr', 'es'];
    i18nLanguageCodeService.getCurrentI18nLanguageCode.and.returnValue('hi');
    topicSessionFallbackLanguageService.getFallbackSelection.and.returnValue(
      null
    );

    component.ngOnInit();

    expect(component.selectedTextLanguageCode).toBe('en');
  });

  it('should use first available language when English is not available and no session', () => {
    component.availableTextLanguageCodes = ['fr', 'es', 'de'];
    i18nLanguageCodeService.getCurrentI18nLanguageCode.and.returnValue('hi');
    topicSessionFallbackLanguageService.getFallbackSelection.and.returnValue(
      null
    );

    component.ngOnInit();

    expect(component.selectedTextLanguageCode).toBe('fr');
  });

  it('should re-initialize on ngOnChanges when language codes change', () => {
    component.availableTextLanguageCodes = ['en'];

    component.ngOnInit();

    expect(component.selectedTextLanguageCode).toBe('en');

    component.availableTextLanguageCodes = ['fr', 'en'];

    i18nLanguageCodeService.getCurrentI18nLanguageCode.and.returnValue('fr');

    component.ngOnChanges({
      availableTextLanguageCodes: new SimpleChange(['en'], ['fr', 'en'], false),
    });

    expect(component.selectedTextLanguageCode).toBe('fr');
  });

  it('should re-initialize on ngOnChanges when only voiceover language codes change', () => {
    component.availableTextLanguageCodes = ['en'];
    component.availableVoiceoverLanguageCodes = [];

    component.ngOnInit();

    expect(component.selectedTextLanguageCode).toBe('en');

    component.availableVoiceoverLanguageCodes = ['fr', 'es'];

    component.ngOnChanges({
      availableVoiceoverLanguageCodes: new SimpleChange(
        [],
        ['fr', 'es'],
        false
      ),
    });

    expect(component.selectedTextLanguageCode).toBe('en');
  });

  it('should return true when root codes match', () => {
    expect(
      componentRef.isVoiceoverCompatibleWithTextLanguage('fr', 'fr')
    ).toBeTrue();
    expect(
      componentRef.isVoiceoverCompatibleWithTextLanguage('fr-CA', 'fr')
    ).toBeTrue();
  });

  it('should check for related language codes when root codes do not match', () => {
    component.availableVoiceoverLanguageCodes = ['es', 'de'];
    languageUtilService.getLanguageCodesRelatedToAudioLanguageCode
      .withArgs('es')
      .and.returnValue(['pt']);

    expect(
      componentRef.isVoiceoverCompatibleWithTextLanguage('es', 'pt')
    ).toBeTrue();
  });

  it('should return false when voiceover is not compatible', () => {
    languageUtilService.getLanguageCodesRelatedToAudioLanguageCode
      .withArgs('es')
      .and.returnValue([]);

    expect(
      componentRef.isVoiceoverCompatibleWithTextLanguage('es', 'de')
    ).toBeFalse();
  });

  it('should return null when no voiceover languages are available', () => {
    component.availableVoiceoverLanguageCodes = [];

    expect(componentRef.getInitialVoiceoverLanguageCode(null, 'en')).toBeNull();
  });

  it('should use session fallback voiceover when available', () => {
    component.availableVoiceoverLanguageCodes = ['fr', 'es'];

    expect(componentRef.getInitialVoiceoverLanguageCode('fr', null)).toBe('fr');
  });

  it('should use compatible voiceover matching text language', () => {
    component.availableVoiceoverLanguageCodes = ['fr', 'es'];

    expect(componentRef.getInitialVoiceoverLanguageCode(null, 'fr')).toBe('fr');
  });

  it('should fall back to English voiceover', () => {
    component.availableVoiceoverLanguageCodes = ['en', 'es'];

    expect(componentRef.getInitialVoiceoverLanguageCode(null, 'fr')).toBe('en');
  });

  it('should fall back to first available voiceover', () => {
    component.availableVoiceoverLanguageCodes = ['fr'];

    expect(componentRef.getInitialVoiceoverLanguageCode(null, 'de')).toBe('fr');
  });

  it('should return English when available', () => {
    component.availableTextLanguageCodes = ['fr', 'en'];

    expect(componentRef.getFallbackTextLanguageCode()).toBe('en');
  });

  it('should return first available language when English not available', () => {
    component.availableTextLanguageCodes = ['fr', 'es'];

    expect(componentRef.getFallbackTextLanguageCode()).toBe('fr');
  });

  it('should not save when selected text language is null', () => {
    component.selectedTextLanguageCode = null;

    componentRef.saveSessionFallbackLanguageSelection();

    expect(
      topicSessionFallbackLanguageService.saveFallbackSelection
    ).not.toHaveBeenCalled();
  });

  it('should save when text language is selected', () => {
    component.selectedTextLanguageCode = 'fr';
    component.selectedVoiceoverLanguageCode = 'fr-CA';

    componentRef.saveSessionFallbackLanguageSelection();

    expect(
      topicSessionFallbackLanguageService.saveFallbackSelection
    ).toHaveBeenCalledWith('fr', 'fr-CA');
  });

  it('should save with null voiceover when voiceover is null', () => {
    component.selectedTextLanguageCode = 'fr';
    component.selectedVoiceoverLanguageCode = null;

    componentRef.saveSessionFallbackLanguageSelection();

    expect(
      topicSessionFallbackLanguageService.saveFallbackSelection
    ).toHaveBeenCalledWith('fr', null);
  });

  it('should return content language description', () => {
    languageUtilService.getContentLanguageDescription
      .withArgs('fr')
      .and.returnValue('French');

    expect(componentRef.getLanguageDescription('fr')).toBe('French');
  });

  it('should return audio language description as fallback', () => {
    languageUtilService.getContentLanguageDescription
      .withArgs('fr')
      .and.returnValue(null);
    languageUtilService.getAudioLanguageDescription
      .withArgs('fr')
      .and.returnValue('French (Audio)');

    expect(componentRef.getLanguageDescription('fr')).toBe('French (Audio)');
  });

  it('should return the language code as last resort', () => {
    languageUtilService.getContentLanguageDescription
      .withArgs('fr')
      .and.returnValue(null);
    languageUtilService.getAudioLanguageDescription
      .withArgs('fr')
      .and.returnValue(null);

    expect(componentRef.getLanguageDescription('fr')).toBe('fr');
  });

  it('should create URL with content language code param', () => {
    component.startUrl = '/explore/123';

    const result = componentRef.getLessonStartUrlWithLanguageSelection(
      'fr',
      null
    );

    expect(result).toBe(
      'https://www.oppia.org/explore/123?initialContentLanguageCode=fr'
    );
  });

  it('should create URL with both language code params', () => {
    component.startUrl = '/explore/123';

    const result = componentRef.getLessonStartUrlWithLanguageSelection(
      'fr',
      'fr-CA'
    );

    expect(result).toBe(
      'https://www.oppia.org/explore/123?initialContentLanguageCode=fr&initialVoiceoverLanguageCode=fr-CA'
    );
  });

  it('should toggle isExpanded from false to true', () => {
    component.isExpanded = false;

    component.toggleExpanded();

    expect(component.isExpanded).toBeTrue();
  });

  it('should toggle isExpanded from true to false', () => {
    component.isExpanded = true;

    component.toggleExpanded();

    expect(component.isExpanded).toBeFalse();
  });

  it('should not toggle when isComingSoonSectionCard is true', () => {
    component.isExpanded = false;
    component.isComingSoonSectionCard = true;

    component.toggleExpanded();

    expect(component.isExpanded).toBeFalse();
  });

  it('should navigate to practiceUrl when provided', () => {
    spyOn(component, 'navigateTo');
    component.practiceUrl = '/practice/123';
    component.startUrl = '/explore/123';

    component.onPracticeButtonClick();

    expect(component.navigateTo).toHaveBeenCalledWith('/practice/123');
  });

  it('should fallback to startUrl when practiceUrl is empty', () => {
    spyOn(component, 'navigateTo');
    component.practiceUrl = '';
    component.startUrl = '/explore/123';

    component.onPracticeButtonClick();

    expect(component.navigateTo).toHaveBeenCalledWith('/explore/123');
  });

  it('should not navigate when lesson is coming soon', () => {
    spyOn(component, 'navigateTo');
    component.lessonProgressStatus = 'coming_soon';
    component.practiceUrl = '/practice/123';
    component.startUrl = '/explore/123';

    component.onPracticeButtonClick();

    expect(component.navigateTo).not.toHaveBeenCalled();
  });

  it('should navigate to studyUrl when provided', () => {
    spyOn(component, 'navigateTo');
    component.studyUrl = '/study/123';
    component.startUrl = '/explore/123';

    component.onStudyButtonClick();

    expect(component.navigateTo).toHaveBeenCalledWith('/study/123');
  });

  it('should fallback to startUrl when studyUrl is empty', () => {
    spyOn(component, 'navigateTo');
    component.studyUrl = '';
    component.startUrl = '/explore/123';

    component.onStudyButtonClick();

    expect(component.navigateTo).toHaveBeenCalledWith('/explore/123');
  });

  it('should not navigate when lesson is coming soon', () => {
    spyOn(component, 'navigateTo');
    component.lessonProgressStatus = 'coming_soon';
    component.studyUrl = '/study/123';
    component.startUrl = '/explore/123';

    component.onStudyButtonClick();

    expect(component.navigateTo).not.toHaveBeenCalled();
  });

  it('should auto-expand when navigatedLessonNumber matches lessonNumber', () => {
    component.lessonNumber = 3;
    component.navigatedLessonNumber = 3;
    component.isExpanded = false;

    component.ngOnChanges({
      navigatedLessonNumber: new SimpleChange(null, 3, false),
    });

    expect(component.isExpanded).toBeTrue();
  });

  it('should not expand when navigatedLessonNumber does not match', () => {
    component.lessonNumber = 3;
    component.navigatedLessonNumber = 5;
    component.isExpanded = false;

    component.ngOnChanges({
      navigatedLessonNumber: new SimpleChange(null, 5, false),
    });

    expect(component.isExpanded).toBeFalse();
  });

  it('should not expand navigated lesson when isComingSoonSectionCard is true', () => {
    component.lessonNumber = 3;
    component.navigatedLessonNumber = 3;
    component.isExpanded = false;
    component.isComingSoonSectionCard = true;

    component.ngOnChanges({
      navigatedLessonNumber: new SimpleChange(null, 3, false),
    });

    expect(component.isExpanded).toBeFalse();
  });

  it('should use DEFAULT_LANGUAGE_CODE when selectedTextLanguageCode is null', () => {
    component.selectedTextLanguageCode = null;
    component.availableTextLanguageCodes = ['en', 'fr'];
    i18nLanguageCodeService.getCurrentI18nLanguageCode.and.returnValue('fr');
    languageUtilService.getContentLanguageDescription
      .withArgs('en')
      .and.returnValue('English');

    expect(component.getFallbackInfoTooltipText()).toBe(
      'The story will be played in English.'
    );
  });

  it('should return raw language code when both content and audio descriptions are missing', () => {
    component.selectedTextLanguageCode = 'zh';
    component.availableTextLanguageCodes = ['en', 'zh'];
    i18nLanguageCodeService.getCurrentI18nLanguageCode.and.returnValue('en');
    languageUtilService.getContentLanguageDescription
      .withArgs('zh')
      .and.returnValue(null);
    languageUtilService.getAudioLanguageDescription
      .withArgs('zh')
      .and.returnValue(null);

    expect(component.getFallbackInfoTooltipText()).toBe(
      'The story will be played in zh.'
    );
  });

  it('should use compatible voiceover when session fallback is not in available list', () => {
    component.availableVoiceoverLanguageCodes = ['fr-CA', 'es'];
    languageUtilService.getLanguageCodesRelatedToAudioLanguageCode
      .withArgs('fr-CA')
      .and.returnValue(['fr']);

    expect(componentRef.getInitialVoiceoverLanguageCode('de', 'fr')).toBe(
      'fr-CA'
    );
  });

  it('should fall back to English when no compatible voiceover found', () => {
    component.availableVoiceoverLanguageCodes = ['en', 'es'];
    languageUtilService.getLanguageCodesRelatedToAudioLanguageCode.and.returnValue(
      []
    );

    expect(componentRef.getInitialVoiceoverLanguageCode('de', 'fr')).toBe('en');
  });

  it('should use session fallback when it is in the available list', () => {
    component.availableVoiceoverLanguageCodes = ['fr-CA', 'es'];

    expect(componentRef.getInitialVoiceoverLanguageCode('fr-CA', 'en')).toBe(
      'fr-CA'
    );
  });

  it('should fall back to first available when session fallback is not available and no compatible found', () => {
    component.availableVoiceoverLanguageCodes = ['es', 'de'];

    expect(componentRef.getInitialVoiceoverLanguageCode('fr-CA', 'en')).toBe(
      'es'
    );
  });

  it('should handle regional voiceover codes that match text root codes', () => {
    expect(
      componentRef.isVoiceoverCompatibleWithTextLanguage('en-US', 'en')
    ).toBeTrue();
  });

  it('should handle regional text codes that match voiceover root codes', () => {
    expect(
      componentRef.isVoiceoverCompatibleWithTextLanguage('es', 'es-MX')
    ).toBeTrue();
  });

  it('should expand first lesson by default', () => {
    component.lessonNumber = 1;

    component.ngOnInit();

    expect(component.isExpanded).toBeTrue();
  });

  it('should not expand non-first lessons by default', () => {
    component.lessonNumber = 2;

    component.ngOnInit();

    expect(component.isExpanded).toBeFalse();
  });

  it('should not expand first lesson when isComingSoonSectionCard is true', () => {
    component.lessonNumber = 1;
    component.isComingSoonSectionCard = true;

    component.ngOnInit();

    expect(component.isExpanded).toBeFalse();
  });

  it('should expand navigated non-first lesson', () => {
    component.lessonNumber = 3;
    component.navigatedLessonNumber = 3;

    component.ngOnInit();

    expect(component.isExpanded).toBeTrue();
  });

  it('should return raw code when all description services return empty string', () => {
    languageUtilService.getContentLanguageDescription
      .withArgs('xx')
      .and.returnValue('');
    languageUtilService.getAudioLanguageDescription
      .withArgs('xx')
      .and.returnValue('');

    expect(componentRef.getLanguageDescription('xx')).toBe('xx');
  });
});
