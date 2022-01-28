// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for NumberConversionService.
 */

import { NumberConversionService } from './number-conversion.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { ContentTranslationLanguageService } from 'pages/exploration-player-page/services/content-translation-language.service';
import { ExplorationLanguageCodeService } from 'pages/exploration-editor-page/services/exploration-language-code.service';
import { ContextService } from './context.service';
import { TestBed } from '@angular/core/testing';

describe('NumberConversionService', () => {
  let numberConversionService: NumberConversionService;
  let i18nLanguageCodeService: I18nLanguageCodeService;
  let ctls: ContentTranslationLanguageService;
  let elcs: ExplorationLanguageCodeService;
  let contextService: ContextService;

  beforeEach(() => {
    numberConversionService = TestBed.inject(NumberConversionService);
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
    ctls = TestBed.inject(ContentTranslationLanguageService);
    elcs = TestBed.inject(ExplorationLanguageCodeService);
    contextService = TestBed.inject(ContextService);
  });

  it('should get the decimal separator depending on the page context', ()=>{
    spyOn(contextService, 'getPageContext').and
      .returnValues('question-player', 'learner', 'editor');
    i18nLanguageCodeService.setI18nLanguageCode('en');
    expect(numberConversionService.currentDecimalSeparator()).toEqual('.');

    ctls.setCurrentContentLanguageCode('fr');
    expect(numberConversionService.currentDecimalSeparator()).toEqual(',');

    spyOn(elcs, 'getCurrentLanguageCode').and.returnValue('ar');
    expect(numberConversionService.currentDecimalSeparator()).toEqual('٫');
  });

  it('should return regex for numeric validation', ()=>{
    const dot = new RegExp('[^e0-9\.\-]', 'g');
    const comma = new RegExp('[^e0-9\,\-]', 'g');
    const arabic = new RegExp('[^e0-9\٫\-]', 'g');

    spyOn(numberConversionService, 'currentDecimalSeparator')
      .and.returnValues('.', ',', '٫');

    expect(numberConversionService.getInputValidationRegex()).toEqual(dot);
    expect(numberConversionService.getInputValidationRegex()).toEqual(comma);
    expect(numberConversionService.getInputValidationRegex()).toEqual(arabic);
  });

  it('should convert a number string to the English decimal number', ()=>{
    let number1 = '-1.22';
    let number2 = '1,5';
    let number3 = '1٫31e1';
    let number4 = 'abc';
    let number5 = 'e';
    let number6 = '';
    spyOn(numberConversionService, 'currentDecimalSeparator')
      .and.returnValues('.', ',', '٫', '.', ',', '.');

    expect(numberConversionService.convertToEnglishDecimal(number1))
      .toEqual(-1.22);
    expect(numberConversionService.convertToEnglishDecimal(number2))
      .toEqual(1.5);
    expect(numberConversionService.convertToEnglishDecimal(number3))
      .toEqual(13.1);
    expect(numberConversionService.convertToEnglishDecimal(number4))
      .toEqual(null);
    expect(numberConversionService.convertToEnglishDecimal(number5))
      .toEqual(null);
    expect(numberConversionService.convertToEnglishDecimal(number6))
      .toEqual(null);
  });

  it('should convert a number to the local format', ()=>{
    let number = -198.234;

    spyOn(numberConversionService, 'currentDecimalSeparator')
      .and.returnValues('.', ',', '٫');

    expect(numberConversionService.convertToLocalizedNumber(number))
      .toEqual('-198.234');
    expect(numberConversionService.convertToLocalizedNumber(number))
      .toEqual('-198,234');
    expect(numberConversionService.convertToLocalizedNumber(number))
      .toEqual('-198٫234');
  });
});
