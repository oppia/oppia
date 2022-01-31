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
 * @fileoverview Service for providing conversion services to the numeric input.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';
import { AppConstants } from 'app.constants';
import { I18nLanguageCodeService } from './i18n-language-code.service';
import { ContentTranslationLanguageService } from 'pages/exploration-player-page/services/content-translation-language.service';
import { ContextService } from './context.service';

@Injectable({
  providedIn: 'root'
})
export class NumberConversionService {
  constructor(
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private contentTranslationService: ContentTranslationLanguageService,
    private contextService: ContextService
  ) {}

  currentDecimalSeparator(): string {
    let pageContext = this.contextService.getPageContext();

    // Exploration Player.
    if (pageContext === 'learner') {
      const currentLanguage = this.contentTranslationService
        .getCurrentContentLanguageCode();
      const supportedLanguages = AppConstants.SUPPORTED_SITE_LANGUAGES;
      let decimalSeparator: string = '.';
      for (let i of supportedLanguages) {
        if (i.id === currentLanguage) {
          decimalSeparator = i.decimal_separator;
          break;
        }
      }
      return decimalSeparator;
    } else if (pageContext === 'editor') {// Exploration Editor.
      // Preview tab.
      let currentLanguage = this.contentTranslationService
        .getCurrentContentLanguageCode();

      // Editor tab.
      // The defualt format (English) is used for the editor tab.
      if (currentLanguage === undefined) {
        return '.'; // Period is the decimal separator for English.
      }

      const supportedLanguages = AppConstants.SUPPORTED_SITE_LANGUAGES;
      let decimalSeparator: string = '.';
      for (let i of supportedLanguages) {
        if (i.id === currentLanguage) {
          decimalSeparator = i.decimal_separator;
          break;
        }
      }
      return decimalSeparator;
    } else if (pageContext === 'question_player') {
      // Question Player.
      const currentLanguage = this.i18nLanguageCodeService
        .getCurrentI18nLanguageCode();
      const supportedLanguages = AppConstants.SUPPORTED_SITE_LANGUAGES;
      let decimalSeparator: string = '.';
      for (let i of supportedLanguages) {
        if (i.id === currentLanguage) {
          decimalSeparator = i.decimal_separator;
          break;
        }
      }
      return decimalSeparator;
    } else {
      // In all other cases return the default (English) decimal separator.
      return '.';
    }
  }

  getInputValidationRegex(): RegExp {
    const decimalSeparator: string = this.currentDecimalSeparator();
    const dot = new RegExp('[^e0-9\.\-]', 'g');
    const comma = new RegExp('[^e0-9\,\-]', 'g');
    const arabic = new RegExp('[^e0-9\٫\-]', 'g');

    if (decimalSeparator === ',') {
      return comma; // Input with a comma as decimal separator.
    } else if (decimalSeparator === '٫') {
      return arabic; // Input with the Arabic seperator.
    } else {
      return dot; // Input with a period as decimal separator.
    }
  }

  convertToEnglishDecimal(number: string): (null | number) {
    const decimalSeparator = this.currentDecimalSeparator();

    // Check if number is in proper format.
    // eslint-disable-next-line max-len
    let validRegex = new RegExp('-{0,1}[0-9]?([\.|\,|\٫]?[0-9]+)?(e[0-9]+)?', 'g');

    let engNum: number;

    // Get the valid part of input.
    let validMatch = number.match(validRegex);

    // Valid match cannot be null as empty string is never passed.
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    let numMatch = validMatch![0];

    let numString = numMatch.replace(`${decimalSeparator}`, '.');
    engNum = parseFloat(numString);

    // If the input cannot be parsed, output null.
    if (isNaN(engNum)) {
      return null;
    }
    return engNum;
  }

  convertToLocalizedNumber(number: number|string): string {
    let decimalSeparator = this.currentDecimalSeparator();
    let stringNumber = number.toString();
    let convertedNumber: string = stringNumber;

    if (decimalSeparator === ',') {
      convertedNumber = stringNumber.replace('.', ',');
    } else if (decimalSeparator === '٫') {
      convertedNumber = stringNumber.replace('.', '٫');
    }

    return convertedNumber;
  }
}

angular.module('oppia').factory(
  'NumberConversionService',
  downgradeInjectable(NumberConversionService));
