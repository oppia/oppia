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

import {Injectable} from '@angular/core';
import {AppConstants} from 'app.constants';
import {I18nLanguageCodeService} from './i18n-language-code.service';

@Injectable({
  providedIn: 'root',
})
export class NumberConversionService {
  constructor(private i18nLanguageCodeService: I18nLanguageCodeService) {}

  currentDecimalSeparator(): string {
    const currentLanguage =
      this.i18nLanguageCodeService.getCurrentI18nLanguageCode();
    const supportedLanguages = AppConstants.SUPPORTED_SITE_LANGUAGES;
    let decimalSeparator: string = '.';

    for (let i of supportedLanguages) {
      if (i.id === currentLanguage) {
        decimalSeparator = i.decimal_separator;
        break;
      }
    }
    return decimalSeparator;
  }

  convertToEnglishDecimal(number: string): null | number {
    const supportedLanguages = AppConstants.SUPPORTED_SITE_LANGUAGES;

    // Get all unique decimal separators from supported languages
    const allDecimalSeparators: string[] = [];
    for (let language of supportedLanguages) {
      if (language.decimal_separator && allDecimalSeparators.indexOf(language.decimal_separator) === -1) {
        allDecimalSeparators.push(language.decimal_separator);
      }
    }

    let numString = number;

    // Replace all known non-English decimal separators with '.'
    for (let separator of allDecimalSeparators) {
      if (separator !== '.') {
        // Use regex with global flag to replace all occurrences
        numString = numString.replace(
          new RegExp(separator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
          '.'
        );
      }
    }

    let engNum = parseFloat(numString);

    // If the input cannot be parsed, output null.
    if (isNaN(engNum)) {
      return null;
    }
    return engNum;
  }

  convertToLocalizedNumber(number: number | string): string {
    let decimalSeparator = this.currentDecimalSeparator();
    let stringNumber = number.toString();
    let convertedNumber: string = stringNumber;

    convertedNumber = stringNumber.replace('.', decimalSeparator);

    return convertedNumber;
  }
}
