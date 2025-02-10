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

import {ContentTranslationLanguageService} from 'pages/exploration-player-page/services/content-translation-language.service';
import {UrlService} from 'services/contextual/url.service';

describe('Content translation language service', () => {
  let ctls: ContentTranslationLanguageService;
  let us: UrlService;
  let availableLanguageCodes: string[];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    ctls = TestBed.inject(ContentTranslationLanguageService);
    us = TestBed.inject(UrlService);
    availableLanguageCodes = ['fr', 'zh'];
  });

  it('should correctly set the language to a valid URL parameter', () => {
    spyOn(us, 'getUrlParams').and.returnValue({
      initialContentLanguageCode: 'fr',
    });

    ctls.init(availableLanguageCodes, [], 'en');
    expect(ctls.getCurrentContentLanguageCode()).toBe('fr');
  });

  it(
    'should correctly set the language to the first available preferred ' +
      'exploration language if there is no valid URL parameter',
    () => {
      spyOn(us, 'getUrlParams').and.returnValue({});

      ctls.init(availableLanguageCodes, ['fr'], 'en');
      expect(ctls.getCurrentContentLanguageCode()).toBe('fr');

      ctls.init(availableLanguageCodes, ['zh'], 'en');
      expect(ctls.getCurrentContentLanguageCode()).toBe('zh');
    }
  );

  it(
    'should correctly set the language to the exploration language code ' +
      'if there is no valid URL parameter and there are no matches with the ' +
      'preferred exploration languages',
    () => {
      spyOn(us, 'getUrlParams').and.returnValue({
        initialContentLanguageCode: 'invalidLanguageCode',
      });

      ctls.init(availableLanguageCodes, [], 'fr');
      expect(ctls.getCurrentContentLanguageCode()).toBe('fr');

      ctls.init(availableLanguageCodes, ['zz'], 'zh');
      expect(ctls.getCurrentContentLanguageCode()).toBe('zh');
    }
  );

  it('should throw error if the exploration language code is invalid', () => {
    expect(() => {
      ctls.init(availableLanguageCodes, ['zz'], 'iv');
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

  it('should correctly set the current language code', () => {
    ctls.init(availableLanguageCodes, [], 'en');
    ctls.setCurrentContentLanguageCode('fr');
    expect(ctls.getCurrentContentLanguageCode()).toBe('fr');
  });
});
