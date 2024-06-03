// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit test for the Translation language service.
 */

import {TranslationLanguageService} from 'pages/exploration-editor-page/translation-tab/services/translation-language.service';
import {LanguageUtilService} from 'domain/utilities/language-util.service';
import {TestBed} from '@angular/core/testing';
import {LocalStorageService} from 'services/local-storage.service';

describe('Translation language service', () => {
  let translationLanguageService: TranslationLanguageService;
  let languageUtilService: LanguageUtilService;
  let localStorageService: LocalStorageService;

  beforeEach(() => {
    translationLanguageService = TestBed.get(TranslationLanguageService);
    languageUtilService = TestBed.get(LanguageUtilService);
    localStorageService = TestBed.get(LocalStorageService);
    spyOn(languageUtilService, 'getAllVoiceoverLanguageCodes').and.returnValue([
      'en',
      'hi',
    ]);
    spyOn(languageUtilService, 'getAudioLanguageDescription').and.callFake(
      (activeLanguageCode: string) => {
        let descriptions: Record<string, string> = {
          en: 'English',
        };
        return descriptions[activeLanguageCode];
      }
    );
    spyOn(localStorageService, 'setLastSelectedLanguageAccentCode');
  });

  describe('Translation language service', () => {
    it('should correctly set and get state names', () => {
      translationLanguageService.setActiveLanguageCode('en');
      expect(translationLanguageService.getActiveLanguageCode()).toBe('en');
    });

    it('should not allow invalid state names to be set', () => {
      translationLanguageService.setActiveLanguageCode('eng');
      expect(
        translationLanguageService?.getActiveLanguageCode()
      ).toBeUndefined();

      translationLanguageService.setActiveLanguageCode('Invalid language code');
      expect(
        translationLanguageService.getActiveLanguageCode()
      ).toBeUndefined();
    });

    it('should show the language direction', () => {
      translationLanguageService.setActiveLanguageCode('ar');
      expect(translationLanguageService.getActiveLanguageDirection()).toBe(
        'rtl'
      );
      translationLanguageService.setActiveLanguageCode('en');
      expect(translationLanguageService.getActiveLanguageDirection()).toBe(
        'ltr'
      );
    });

    it('should show the language description', () => {
      translationLanguageService.setActiveLanguageCode('en');
      expect(translationLanguageService.getActiveLanguageDescription()).toBe(
        'English'
      );
    });

    it('should not show the language description of invalid state name', () => {
      translationLanguageService.setActiveLanguageCode('eng');
      expect(
        translationLanguageService.getActiveLanguageDescription()
      ).toBeNull();
    });

    it('should be able to get and set language accent code', () => {
      spyOn(
        translationLanguageService.onActiveLanguageAccentChanged,
        'subscribe'
      );
      let languageAccentCode =
        translationLanguageService.getActiveLanguageAccentCode();

      expect(languageAccentCode).toBeUndefined();

      translationLanguageService.setActiveLanguageAccentCode('en-US');
      languageAccentCode =
        translationLanguageService.getActiveLanguageAccentCode();

      expect(languageAccentCode).toEqual('en-US');
    });
  });
});
