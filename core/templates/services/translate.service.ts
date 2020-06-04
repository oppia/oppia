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
 * Note: Intentionally left out the L of innerHTM"L" (only in this file) to
 * avoid the linting error.
 * Example: <h1 [innerHTM]="'I18N_ABOUT_PAGE_HEADING' | translate:{x: 'Oppia'}">
 * 'I18N_ABOUT_PAGE_HEADING' is referred here as key or key.
 * "translate" is the pipe.
 * The object following the pipe, i.e. {x: 'Oppia'}, is called params or
 * interpolationParams.
 * Each i18n translation JSON file contains translations as
 * {key: translatedValue, key2: translatedValue2}. Let us say that
 * translatedValue is "Hola <[x]>". Here the value of x comes from the params
 * passed. So, after interpolation it will become "Hola Oppia".
 */

export interface LangChangeEvent {
  lang: string;
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

  private _onLangChange = new EventEmitter<LangChangeEvent>();
  get onLangChange(): EventEmitter<LangChangeEvent> {
    return this._onLangChange;
  }

  constructor(private http: HttpClient, private utils: UtilsService) {}

  /**
   * Function to fetch JSON file containing translations.
   * @param {string} lang - Code of the language
   * @returns {Promise<Object>} - A promise that resolves to the translations
   */
  fetchTranslations(lang:string): Promise<Object> {
    return this.http.get(`${this.prefix}${lang}${this.suffix}`).toPromise();
  }

  /**
   * This function sets the new translations
   * @param {string} lang - language code of the translation to be used
   */
  use(lang: string): void {
    // Check if the translations for the "lang" have been fetched before.
    this.currentLang = lang;
    if (Object.keys(this.translations).includes(lang)) {
      this._onLangChange.emit(
        {lang: lang });
      return;
    }
    // Otherwise fetch the translations.
    this.translations[lang] = this.fetchTranslations(lang).then(
      translations => {
        this.translations[lang] = translations;
        if (this.currentLang === lang) {
          this._onLangChange.emit(
            {lang: lang});
        }
      }
    );
  }

  /**
   * Functions that interpolates the translatedValue
   * @param {string} translatedValue - The value corresponding to the key
   * @param {Object} params - interpolations parameters
   * @returns {string} interpolated translatedValue
   */
  interpolateTranslatedValue(
      translatedValue: string,
      params?: Object | undefined): string {
    if (!params) {
      return translatedValue;
    }
    return translatedValue.replace(this.templateMatcher,
      (substring: string, b: string) => {
        let r = params[b];
        return this.utils.isDefined(r) ? r : substring;
      });
  }

  /**
   * Gets the translatedValue corresponding to the key and returns the
   * interpolated string of the translatedValue using the interpolateParams.
   * @param {string} key - key for i18n translation
   * @param {Object} interpolateParams - params for interpolation
   * @returns {string} - interpolated string of the translatedValue
   * corresponding to the key.
   */
  getInterpolatedString(
      key: string,
      interpolateParams?: Object): string {
    if (!this.utils.isDefined(key) || !key.length) {
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
