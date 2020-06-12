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
// limitations under the License

/**
 * @fileoverview Translate service for i18n translations
 */

import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UtilsService } from './utils.service';

/**
 * Commonly used terms in this file.
 *   key - Key for i18n translation
 *   translatedValue - I18n translation corresponding to the key in json file
 *   interpolateParams or params - Key-value pairs for interpolation
 *   interpolatedValue - The final translation that is returned.
 *
 * Example: <h1 [innerHTM]="'I18N_ABOUT_PAGE_HEADING' | translate:{x: 'Oppia'}">
 *   'I18N_ABOUT_PAGE_HEADING' is referred here as key or key.
 *
 *   "translate" is the pipe.
 *
 *   The object following the pipe, i.e. {x: 'Oppia'}, is called params or
 *   interpolationParams.
 *
 *   Each i18n translation JSON file contains translations as:
 *   {key: translatedValue, key2: translatedValue2}.
 *
 *   Let us say that translatedValue is "Hola <[x]>". Here the value of x comes
 *   from the params passed. So, after interpolation it will become
 *   "Hola Oppia".
 *
 * Note: Intentionally left out the L of innerHTM"L" (only in this file) to
 * avoid the linting error.
 */

export interface LangChangeEvent {
  newLanguageCode: string;
}

@Injectable({
  providedIn: 'root'
})
export class TranslateService {
  currentLang = 'en';
  fallbackLang = 'en';
  prefix = '/assets/i18n/';
  suffix = '.json';
  translations: Array<Object> = [];
  templateMatcher: RegExp = /\<\[\s?([^{}\s]*)\s?\]\>/g;

  private onLangChangeEventEmitter = new EventEmitter<LangChangeEvent>();
  get onLangChange(): EventEmitter<LangChangeEvent> {
    return this.onLangChangeEventEmitter;
  }

  constructor(private http: HttpClient, private utilsService: UtilsService) {}

  /**
   * Function to fetch JSON file containing translations.
   * @param {string} languageCode - Code of the language
   * @returns {Promise<Object>} - A promise that resolves to the translations
   */
  fetchTranslations(languageCode:string): Promise<Object> {
    return this.http.get(
      `${this.prefix}${languageCode}${this.suffix}`).toPromise();
  }

  /**
   * This function sets the new translations
   * @param {string} languageCode - language code of the translation to be used
   */
  use(newLanguageCode: string): void {
    // Check if the translations for the "lang" have been fetched before.
    this.currentLang = newLanguageCode;
    if (Object.keys(this.translations).includes(newLanguageCode)) {
      this.onLangChangeEventEmitter.emit(
        {newLanguageCode: newLanguageCode });
      return;
    }
    // Otherwise fetch the translations.
    this.translations[newLanguageCode] = this.fetchTranslations(
      newLanguageCode).then(
      translations => {
        this.translations[newLanguageCode] = translations;
        if (this.currentLang === newLanguageCode) {
          this.onLangChangeEventEmitter.emit(
            {newLanguageCode: newLanguageCode});
        }
      }
    );
  }

  /**
   * Functions that interpolates the translatedValue
   * @param {string} translatedValue - The value corresponding to the key
   * @param {Object} params - key-value pairs for interpolation
   * @returns {string} interpolated translatedValue
   */
  interpolateTranslatedValue(
      translatedValue: string,
      interpolateParams?: Object | undefined): string {
    if (!interpolateParams) {
      return translatedValue;
    }
    return translatedValue.replace(this.templateMatcher,
      (substring: string, interpolateParamsKey: string) => {
        let interpolateParamsValue = interpolateParams[interpolateParamsKey];
        if (this.utilsService.isDefined(interpolateParamsValue)) {
          return interpolateParamsValue;
        }
        return substring;
      });
  }

  /**
   * Gets the translatedValue corresponding to the key and returns the
   * interpolated string of the translatedValue using the interpolateParams.
   * @param {string} key - key for i18n translation
   * @param {Object} interpolateParams - key-value pairs for interpolation
   * @returns {string} - interpolated string of the translatedValue
   * corresponding to the key.
   */
  getInterpolatedString(
      key: string,
      interpolateParams?: Object): string {
    if (!this.utilsService.isDefined(key) || !key.length) {
      throw new Error('Parameter "key" required');
    }
    let translations = this.translations[this.currentLang];

    if (translations && translations[key]) {
      return this.interpolateTranslatedValue(
        translations[key], interpolateParams);
    }

    // If the translation for the current lang doesn't exist use fallback lang.
    translations = this.translations[this.fallbackLang];
    if (this.fallbackLang !== null && this.fallbackLang !== this.currentLang &&
        (translations && translations[key])) {
      return this.interpolateTranslatedValue(
        translations[key], interpolateParams);
    }

    // If the translation for the fallback lang doesn't exist, return the key.
    return key;
  }
}
