// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Translate service for i18n translations
 */

import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UtilsService } from './utils.service';

export interface MissingTranslationHandlerParams {
   // the key that's missing in translation files
  key: string;

  // an instance of the service that was unable to translate the key.
  translateService: TranslateService;

   // Interpolation params that were passed along for translating the given key.
  interpolateParams?: Object;
}

export interface LangChangeEvent {
  lang: string;
}

@Injectable({
  providedIn: 'root'
})
export class TranslateService {
  currentLang = 'en';
  defaultLang = 'en';
  prefix = '/assets/i18n/';
  suffix = '.json';
  translations: Array<Object> = [];
  templateMatcher: RegExp = /\<\[\s?([^{}\s]*)\s?\]\>/g;

  private _onLangChange = new EventEmitter<LangChangeEvent>();
  get onLangChange(): EventEmitter<LangChangeEvent> {
    return this._onLangChange;
  }

  constructor(private http: HttpClient, private utils: UtilsService) {}

  // This function fecthes translation.
  fetchTranslations(lang:string) {
    return this.http.get(`${this.prefix}${lang}${this.suffix}`).toPromise();
  }

  // This function sets the new translations
  use(lang: string) {
    // Check if it has already been fetched before
    this.currentLang = lang;
    if (Object.keys(this.translations).includes(lang)) {
      this._onLangChange.emit(
        {lang: lang });
      return;
    }
    // Otherwise fetch the translations
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


  interpolate(expr: string | Function, params?: Object): string {
    let interpolatedString: string;

    if (typeof expr === 'string') {
      interpolatedString = this.interpolateString(expr, params);
    } else if (typeof expr === 'function') {
      interpolatedString = this.interpolateFunction(expr, params);
    } else {
      interpolatedString = expr as string;
    }

    return interpolatedString;
  }

  getValue(target: Object, key: string): string | undefined {
    let keys = typeof key === 'string' ? key.split('.') : [key];
    key = '';
    let tar: string | undefined;
    do {
      key += keys.shift();
      if (this.utils.isDefined(target) && this.utils.isDefined(target[key]) &&
        (typeof target[key] === 'object' || !keys.length)) {
        tar = target[key];
        target = target[key];
        key = '';
      } else if (!keys.length) {
        target = undefined;
        tar = undefined;
      } else {
        key += '.';
      }
    } while (keys.length);
    return tar;
  }

  private interpolateFunction(fn: Function, params?: Object | undefined) {
    return fn(params);
  }

  private interpolateString(expr: string, params?: Object | undefined) {
    if (!params) {
      return expr;
    }

    return expr.replace(this.templateMatcher,
      (substring: string, b: string) => {
        let r = this.getValue(params, b);
        return this.utils.isDefined(r) ? r : substring;
      });
  }

  getInterpolatedString(
      key: string,
      interpolateParams?: Object): string {
    if (!this.utils.isDefined(key) || !key.length) {
      throw new Error('Parameter "key" required');
    }
    // check if we are loading a new translation to use {
    let interpolatedString: string;
    let translations = this.translations[this.currentLang];

    if (translations) {
      interpolatedString = this.interpolate(
        this.getValue(translations, key), interpolateParams);
    }

    // If the translation for the current lang doesn't exist use default lang
    if (typeof interpolatedString === 'undefined' &&
        this.defaultLang !== null && this.defaultLang !== this.currentLang) {
      interpolatedString = this.interpolate(this.getValue(
        this.translations[this.defaultLang], key), interpolateParams);
    }

    return typeof interpolatedString !== 'undefined' ? interpolatedString : key;
  }
}
