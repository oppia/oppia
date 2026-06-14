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
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';

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
    const ngbModalSpy = jasmine.createSpyObj('NgbModal', ['open']);
    const topicSessionFallbackLanguageServiceSpy = jasmine.createSpyObj(
      'TopicSessionFallbackLanguageService',
      ['getFallbackSelection', 'saveFallbackSelection']
    );

    TestBed.configureTestingModule({
      declarations: [TopicLessonCardComponent, MockTranslatePipe],
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
          provide: NgbModal,
          useValue: ngbModalSpy,
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

  it('should generate fallback thumbnail url through UrlInterpolationService', () => {
    urlInterpolationService.getStaticImageUrl.and.returnValue(
      '/assets/generated-fallback.webp'
    );

    component.thumbnailUrl = '';

    component.ngOnInit();

    expect(urlInterpolationService.getStaticImageUrl).toHaveBeenCalledTimes(1);
    expect(component.resolvedThumbnailUrl).toBe(
      '/assets/generated-fallback.webp'
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

  it('should determine unavailability based on preferred language', () => {
    component.availableTextLanguageCodes = ['en', 'fr'];

    expect(component.isLessonUnavailableInPreferredLanguage()).toBeTrue();
  });

  it('should include initial content language code in lesson url', () => {
    component.startUrl = '/explore/exp_id?topic_url_fragment=fractions';
    component.availableTextLanguageCodes = ['en'];
    component.ngOnInit();
    component.selectedTextLanguageCode = 'en';

    spyOn(windowRef.nativeWindow.location, 'assign');
    component.onStartButtonClick();

    expect(windowRef.nativeWindow.location.assign).toHaveBeenCalled();
    expect(
      (windowRef.nativeWindow.location.assign as jasmine.Spy).calls.mostRecent()
        .args[0]
    ).toContain('initialContentLanguageCode=en');
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
});
