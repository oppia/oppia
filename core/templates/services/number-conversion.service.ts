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
    // Match anything that isn't a number,
    // minus sign, exponent (e) sign or a decimal separator.
    let regexString = '[^e0-9\\' + decimalSeparator + '\\-]';

    let regex = new RegExp(regexString, 'g');
    return regex;
  }

  convertToEnglishDecimal(number: string): (null | number) {
    const decimalSeparator = this.currentDecimalSeparator();

    let numString = number.replace(`${decimalSeparator}`, '.');
    let engNum = parseFloat(numString);

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

    convertedNumber = stringNumber.replace('.', decimalSeparator);

    return convertedNumber;
  }
}

angular.module('oppia').factory(
  'NumberConversionService',
  downgradeInjectable(NumberConversionService));
