// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests that the voiceover language management service is working
 * as expected.
 */

import {TestBed} from '@angular/core/testing';
import {VoiceoverLanguageManagementService} from './voiceover-language-management-service';

describe('Voiceover language management service', () => {
  let voiceoverLanguageManagementService: VoiceoverLanguageManagementService;
  let languageAccentMasterList;
  let languageCodesMapping;
  let autoGeneratableLanguageAccentCodes;

  beforeEach(() => {
    voiceoverLanguageManagementService = TestBed.inject(
      VoiceoverLanguageManagementService
    );
    languageAccentMasterList = {
      en: {
        'en-US': 'English (United States)',
        'en-GB': 'English (United Kingdom)',
      },
      hi: {
        'hi-IN': 'Hindi (India)',
      },
    };

    languageCodesMapping = {
      en: {
        'en-US': true,
        'en-GB': false,
      },
      hi: {
        'hi-IN': true,
      },
    };

    autoGeneratableLanguageAccentCodes = ['en-US', 'hi-IN'];
  });

  it('should be able to initialize correctly', () => {
    voiceoverLanguageManagementService.init(
      languageAccentMasterList,
      autoGeneratableLanguageAccentCodes,
      languageCodesMapping
    );

    expect(voiceoverLanguageManagementService.languageAccentMasterList).toEqual(
      languageAccentMasterList
    );
    expect(
      voiceoverLanguageManagementService.autoGeneratableLanguageAccentCodes
    ).toEqual(autoGeneratableLanguageAccentCodes);
    expect(voiceoverLanguageManagementService.languageCodesMapping).toEqual(
      languageCodesMapping
    );
  });

  it('should be able to correct get autogeneratable language accents', () => {
    voiceoverLanguageManagementService.init(
      languageAccentMasterList,
      autoGeneratableLanguageAccentCodes,
      languageCodesMapping
    );

    expect(
      voiceoverLanguageManagementService.getAutogeneratableLanguageAccents('en')
    ).toEqual(['en-US']);
    expect(
      voiceoverLanguageManagementService.getAutogeneratableLanguageAccents('hi')
    ).toEqual(['hi-IN']);
  });

  it('should be able to get whether voiceover is supported for a language', () => {
    voiceoverLanguageManagementService.init(
      languageAccentMasterList,
      autoGeneratableLanguageAccentCodes,
      languageCodesMapping
    );

    expect(
      voiceoverLanguageManagementService.canVoiceoverForLanguage('en')
    ).toBeTrue();
    expect(
      voiceoverLanguageManagementService.canVoiceoverForLanguage('hi')
    ).toBeTrue();
    expect(
      voiceoverLanguageManagementService.canVoiceoverForLanguage('es')
    ).toBeFalse();
  });

  it('should be able to set cloud supported language accents', () => {
    voiceoverLanguageManagementService.init(
      languageAccentMasterList,
      autoGeneratableLanguageAccentCodes,
      languageCodesMapping
    );
    expect(
      voiceoverLanguageManagementService.cloudSupportedLanguageAccentCodes
    ).toEqual([]);
    voiceoverLanguageManagementService.setCloudSupportedLanguageAccents('en');
    expect(
      voiceoverLanguageManagementService.cloudSupportedLanguageAccentCodes
    ).toEqual(['en-US']);
  });

  it('should be able to check if autogeneration is supported for a language accent', () => {
    voiceoverLanguageManagementService.init(
      languageAccentMasterList,
      autoGeneratableLanguageAccentCodes,
      languageCodesMapping
    );
    voiceoverLanguageManagementService.setCloudSupportedLanguageAccents('en');
    expect(
      voiceoverLanguageManagementService.isAutogenerationSupportedGivenLanguageAccent(
        'en-US'
      )
    ).toBeTrue();
    expect(
      voiceoverLanguageManagementService.isAutogenerationSupportedGivenLanguageAccent(
        'en-GB'
      )
    ).toBeFalse();
  });
});
