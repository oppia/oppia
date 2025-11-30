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
 * @fileoverview Unit tests for the content translation language service.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';

import {ContentTranslationLanguageService} from './content-translation-language.service';
import {UrlService} from 'services/contextual/url.service';
import {PlatformFeatureService} from 'services/platform-feature.service';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {LanguageUtilService} from 'domain/utilities/language-util.service';

class MockPlatformFeatureService {
  status = {
    NewLessonPlayer: {
      isEnabled: false,
    },
  };
}

class MockI18nLanguageCodeService {
  getCurrentI18nLanguageCode(): string | null {
    return 'en';
  }
}

class MockLanguageUtilService {
  getContentLanguageDescription(languageCode: string): string | null {
    const descriptions: Record<string, string> = {
      fr: 'français (French)',
      zh: '中文 (Chinese)',
      en: 'English',
      hi: 'हिन्दी (Hindi)',
    };
    return descriptions[languageCode] || null;
  }
}

describe('Content translation language service', () => {
  let ctls: ContentTranslationLanguageService;
  let mockPlatformFeatureService: MockPlatformFeatureService;
  let mockI18nLanguageCodeService: MockI18nLanguageCodeService;
  let mockLanguageUtilService: MockLanguageUtilService;
  let urlService: UrlService;
  let availableLanguageCodes: string[];

  beforeEach(() => {
    mockPlatformFeatureService = new MockPlatformFeatureService();
    mockI18nLanguageCodeService = new MockI18nLanguageCodeService();
    mockLanguageUtilService = new MockLanguageUtilService();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: PlatformFeatureService,
          useValue: mockPlatformFeatureService,
        },
        {
          provide: I18nLanguageCodeService,
          useValue: mockI18nLanguageCodeService,
        },
        {
          provide: LanguageUtilService,
          useValue: mockLanguageUtilService,
        },
      ],
    });

    ctls = TestBed.inject(ContentTranslationLanguageService);
    urlService = TestBed.inject(UrlService);
    availableLanguageCodes = ['fr', 'zh'];
  });

  describe('when NewLessonPlayer is disabled', () => {
    beforeEach(() => {
      mockPlatformFeatureService.status.NewLessonPlayer.isEnabled = false;
    });

    it('should correctly set the language to a valid URL parameter', () => {
      spyOn(urlService, 'getUrlParams').and.returnValue({
        initialContentLanguageCode: 'fr',
      });

      ctls.init(availableLanguageCodes, [], 'en');
      expect(ctls.getCurrentContentLanguageCode()).toBe('fr');
    });

    it('should correctly set the language to the first available preferred exploration language if there is no valid URL parameter', () => {
      spyOn(urlService, 'getUrlParams').and.returnValue({});

      ctls.init(availableLanguageCodes, ['fr'], 'en');
      expect(ctls.getCurrentContentLanguageCode()).toBe('fr');

      ctls.init(availableLanguageCodes, ['zh'], 'en');
      expect(ctls.getCurrentContentLanguageCode()).toBe('zh');
    });

    it('should correctly set the language to the exploration language code if there is no valid URL parameter and there are no matches with the preferred exploration languages', () => {
      spyOn(urlService, 'getUrlParams').and.returnValue({
        initialContentLanguageCode: 'invalidLanguageCode',
      });

      ctls.init(availableLanguageCodes, [], 'fr');
      expect(ctls.getCurrentContentLanguageCode()).toBe('fr');

      ctls.init(availableLanguageCodes, ['zz'], 'zh');
      expect(ctls.getCurrentContentLanguageCode()).toBe('zh');
    });

    it('should set exploration language code when no URL parameter and no preferred languages', () => {
      spyOn(urlService, 'getUrlParams').and.returnValue({});

      ctls.init(availableLanguageCodes, [], 'en');
      expect(ctls.getCurrentContentLanguageCode()).toBe('en');
    });

    it('should handle null preferred content language codes', () => {
      spyOn(urlService, 'getUrlParams').and.returnValue({});

      ctls.init(availableLanguageCodes, null as unknown as string[], 'en');
      expect(ctls.getCurrentContentLanguageCode()).toBe('en');
    });
  });

  describe('when NewLessonPlayer is enabled', () => {
    beforeEach(() => {
      mockPlatformFeatureService.status.NewLessonPlayer.isEnabled = true;
    });

    it('should set current content language to preferred site language when available', () => {
      spyOn(
        mockI18nLanguageCodeService,
        'getCurrentI18nLanguageCode'
      ).and.returnValue('fr');

      ctls.init(availableLanguageCodes, [], 'en');
      expect(ctls.getCurrentContentLanguageCode()).toBe('fr');
    });

    it('should fallback to exploration language when preferred site language is null', () => {
      spyOn(
        mockI18nLanguageCodeService,
        'getCurrentI18nLanguageCode'
      ).and.returnValue(null);

      ctls.init(availableLanguageCodes, [], 'fr');
      expect(ctls.getCurrentContentLanguageCode()).toBe('fr');
    });

    it('should fallback to exploration language when preferred site language is not available in exploration', () => {
      spyOn(
        mockI18nLanguageCodeService,
        'getCurrentI18nLanguageCode'
      ).and.returnValue('hi');

      ctls.init(availableLanguageCodes, [], 'fr');
      expect(ctls.getCurrentContentLanguageCode()).toBe('fr');
    });
  });

  it('should throw error if the exploration language code is invalid', () => {
    mockPlatformFeatureService.status.NewLessonPlayer.isEnabled = false;
    spyOn(
      mockLanguageUtilService,
      'getContentLanguageDescription'
    ).and.returnValue(null);

    expect(() => {
      ctls.init(availableLanguageCodes, [], 'iv');
    }).toThrowError('The exploration language code is invalid');
  });

  it('should correctly initialize the dropdown options', () => {
    ctls.init(availableLanguageCodes, [], 'en');
    expect(ctls.getLanguageOptionsForDropdown()).toEqual([
      {value: 'fr', displayed: 'français (French)'},
      {value: 'zh', displayed: '中文 (Chinese)'},
      {value: 'en', displayed: 'English'},
    ]);
  });

  it('should correctly set the current language code when it is different', () => {
    ctls.init(availableLanguageCodes, [], 'en');

    ctls.setCurrentContentLanguageCode('fr');
    expect(ctls.getCurrentContentLanguageCode()).toBe('fr');
  });

  it('should not change language code when setting the same language code', () => {
    ctls.init(availableLanguageCodes, [], 'en');
    const initialLanguageCode = ctls.getCurrentContentLanguageCode();

    ctls.setCurrentContentLanguageCode(initialLanguageCode);
    expect(ctls.getCurrentContentLanguageCode()).toBe(initialLanguageCode);
  });

  it('should check new lesson player feature flag when enabled', () => {
    mockPlatformFeatureService.status.NewLessonPlayer.isEnabled = true;
    expect(ctls.isNewLessonPlayerEnabled()).toBe(true);
  });
});
