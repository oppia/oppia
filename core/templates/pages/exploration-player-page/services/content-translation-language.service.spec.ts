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

import { TestBed } from '@angular/core/testing';

import { ContentTranslationLanguageService } from
  'pages/exploration-player-page/services/content-translation-language.service';
import { ContentTranslationManagerService } from
  'pages/exploration-player-page/services/content-translation-manager.service';

describe('Content translation language service', () => {
  let ctls: ContentTranslationLanguageService;
  let ctms: ContentTranslationManagerService;
  let availableLanguageCodes: string[];

  beforeEach(() => {
    ctls = TestBed.get(ContentTranslationLanguageService);
    ctms = TestBed.get(ContentTranslationManagerService);
    availableLanguageCodes = ['fr', 'zh'];
  });

  it('should correctly set the language to the first available preferred ' +
    'exploration language', () => {
    ctls.init(availableLanguageCodes, ['fr'], null, 'en');
    expect(ctls.getCurrentContentLanguageCode()).toBe('fr');

    ctls.init(availableLanguageCodes, ['zh'], null, 'en');
    expect(ctls.getCurrentContentLanguageCode()).toBe('zh');
  });

  it('should correctly set the language to the preferred site language code ' +
     'if there are no matches with the preferred exploration languages', () => {
    ctls.init(availableLanguageCodes, [], 'fr', 'en');
    expect(ctls.getCurrentContentLanguageCode()).toBe('fr');

    ctls.init(availableLanguageCodes, ['zz'], 'zh', 'en');
    expect(ctls.getCurrentContentLanguageCode()).toBe('zh');
  });

  it('should correctly set the language to the exploration language code ' +
     'if there are no matches with the preferred exploration languages or ' +
     'the preferred site language code', () => {
    ctls.init(availableLanguageCodes, [], 'zz', 'fr');
    expect(ctls.getCurrentContentLanguageCode()).toBe('fr');

    ctls.init(availableLanguageCodes, ['zz'], 'ab', 'zh');
    expect(ctls.getCurrentContentLanguageCode()).toBe('zh');
  });

  it('should correctly initialize the dropdown options', () => {
    ctls.init(availableLanguageCodes, [], null, 'en');
    expect(ctls.getLanguageOptionsForDropdown()).toEqual([
      {value: 'fr', displayed: 'français (French)'},
      {value: 'zh', displayed: '中文 (Chinese)'},
      {value: 'en', displayed: 'English'}
    ]);
  });

  it('should correctly set the current language code and call the content ' +
     'translation manager service', () => {
    const displayTranslationsSpy = spyOn(ctms, 'displayTranslations');
    ctls.init(availableLanguageCodes, [], null, 'en');
    ctls.setCurrentContentLanguageCode('fr');
    expect(ctls.getCurrentContentLanguageCode()).toBe('fr');
    expect(displayTranslationsSpy).toHaveBeenCalledWith('fr');
  });
});
