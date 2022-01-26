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
import { UrlService } from 'services/contextual/url.service';

describe('Content translation language service', () => {
  let ctls: ContentTranslationLanguageService;
  let ctms: ContentTranslationManagerService;
  let us: UrlService;
  let availableLanguageCodes: string[];

  beforeEach(() => {
    ctls = TestBed.inject(ContentTranslationLanguageService);
    ctms = TestBed.inject(ContentTranslationManagerService);
    us = TestBed.inject(UrlService);
    availableLanguageCodes = ['fr', 'zh'];
  });

  it('should correctly set the language to a valid URL parameter', () => {
    spyOn(us, 'getUrlParams').and.returnValue({
      initialContentLanguageCode: 'fr'
    });

    ctls.init(availableLanguageCodes, [], 'en');
    expect(ctls.getCurrentContentLanguageCode()).toBe('fr');
  });

  it('should correctly set the language to the first available preferred ' +
    'exploration language if there is no valid URL parameter', () => {
    spyOn(us, 'getUrlParams').and.returnValue({});

    ctls.init(availableLanguageCodes, ['fr'], 'en');
    expect(ctls.getCurrentContentLanguageCode()).toBe('fr');

    ctls.init(availableLanguageCodes, ['zh'], 'en');
    expect(ctls.getCurrentContentLanguageCode()).toBe('zh');
  });

  it('should correctly set the language to the exploration language code ' +
     'if there is no valid URL parameter and there are no matches with the ' +
     'preferred exploration languages', () => {
    spyOn(us, 'getUrlParams').and.returnValue({
      initialContentLanguageCode: 'invalidLanguageCode'
    });

    ctls.init(availableLanguageCodes, [], 'fr');
    expect(ctls.getCurrentContentLanguageCode()).toBe('fr');

    ctls.init(availableLanguageCodes, ['zz'], 'zh');
    expect(ctls.getCurrentContentLanguageCode()).toBe('zh');
  });

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
      {value: 'en', displayed: 'English'}
    ]);
  });

  it('should correctly set the current language code and call the content ' +
     'translation manager service', () => {
    const displayTranslationsSpy = spyOn(ctms, 'displayTranslations');
    ctls.init(availableLanguageCodes, [], 'en');
    ctls.setCurrentContentLanguageCode('fr');
    expect(ctls.getCurrentContentLanguageCode()).toBe('fr');
    expect(displayTranslationsSpy).toHaveBeenCalledWith('fr');
  });

  it('should get the decimal separator of the current language', ()=>{
    ctls.setCurrentContentLanguageCode('en');
    expect(ctls.isContentLanguageRTL()).toEqual(false);
    ctls.setCurrentContentLanguageCode('ar');
    expect(ctls.isContentLanguageRTL()).toEqual(true);
  });

  it('should get the decimal separator of the current language', ()=>{
    ctls.setCurrentContentLanguageCode('en');
    expect(ctls.currentDecimalSeparator()).toEqual('.');
    ctls.setCurrentContentLanguageCode('es');
    expect(ctls.currentDecimalSeparator()).toEqual(',');
    ctls.setCurrentContentLanguageCode('ar');
    expect(ctls.currentDecimalSeparator()).toEqual('٫');
  });

  it('should return regex for numeric validation', ()=>{
    const dot = new RegExp('[^e0-9\.\-]', 'g');
    const comma = new RegExp('[^e0-9\,\-]', 'g');
    const arabic = new RegExp('[^e0-9\٫\-]', 'g');

    ctls.setCurrentContentLanguageCode('en');
    expect(ctls.getInputValidationRegex()).toEqual(dot);
    ctls.setCurrentContentLanguageCode('es');
    expect(ctls.getInputValidationRegex()).toEqual(comma);
    ctls.setCurrentContentLanguageCode('ar');
    expect(ctls.getInputValidationRegex()).toEqual(arabic);
  });

  it(`should convert a number string to the English decimal number`, ()=>{
    let number1 = '-1.22';
    let number2 = '1,5';
    let number3 = '1٫31e1';
    let number4 = 'abc';
    let number5 ='e';
    spyOn(ctls, 'currentDecimalSeparator').and.returnValues('.', ',', '٫', '.', ',');

    expect(ctls.convertToEnglishDecimal(number1)).toEqual(-1.22);
    expect(ctls.convertToEnglishDecimal(number2)).toEqual(1.5);
    expect(ctls.convertToEnglishDecimal(number3)).toEqual(13.1);
    expect(ctls.convertToEnglishDecimal(number4)).toEqual(null);
    expect(ctls.convertToEnglishDecimal(number5)).toEqual(null);
  });

  it('should convert a number to the local format', ()=>{
    let number = -198.234;

    ctls.setCurrentContentLanguageCode('en');
    expect(ctls.convertToLocalizedNumber(number)).toEqual('-198.234');
    ctls.setCurrentContentLanguageCode('es');
    expect(ctls.convertToLocalizedNumber(number)).toEqual('-198,234');
    ctls.setCurrentContentLanguageCode('ar');
    expect(ctls.convertToLocalizedNumber(number)).toEqual('-198٫234');
  });

});
