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
import { Observable, isObservable, forkJoin, of } from 'rxjs';
import { map } from 'rxjs/operators';
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
  translations: any;
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
  async use(lang: string) {
    // Check if it has already been fetched before
    if (Object.keys(this.translations).includes(lang)) {
      this.currentLang = lang;
      this._onLangChange.emit(
        {lang: lang, translations: this.translations[lang]});
      return of(this.translations[lang]);
    }
    // Otherwise fetch the translations
    this.translations[lang] = await this.fetchTranslations(lang);
    this.currentLang = lang;
    this._onLangChange.emit(
      {lang: lang, translations: this.translations[lang]});
  }


  interpolate(expr: string | Function, params?: any): string {
    let result: string;

    if (typeof expr === 'string') {
      result = this.interpolateString(expr, params);
    } else if (typeof expr === 'function') {
      result = this.interpolateFunction(expr, params);
    } else {
      result = expr as string;
    }

    return result;
  }

  getValue(target: any, key: string): any {
    let keys = typeof key === 'string' ? key.split('.') : [key];
    key = '';
    do {
      key += keys.shift();
      if (this.utils.isDefined(target) && this.utils.isDefined(target[key]) &&
        (typeof target[key] === 'object' || !keys.length)) {
        target = target[key];
        key = '';
      } else if (!keys.length) {
        target = undefined;
      } else {
        key += '.';
      }
    } while (keys.length);

    return target;
  }

  private interpolateFunction(fn: Function, params?: any) {
    return fn(params);
  }

  private interpolateString(expr: string, params?: any) {
    if (!params) {
      return expr;
    }

    return expr.replace(this.templateMatcher,
      (substring: string, b: string) => {
        let r = this.getValue(params, b);
        return this.utils.isDefined(r) ? r : substring;
      });
  }

  getParsedResult(
      translations: any, key: any, interpolateParams?: Object) {
    let res: string | Observable<string>;

    if (key instanceof Array) {
      let result = {},
        observables: boolean = false;
      for (let k of key) {
        result[k] = this.getParsedResult(translations, k, interpolateParams);
        if (isObservable(result[k])) {
          observables = true;
        }
      }
      if (observables) {
        const sources = key.map(
          k => isObservable(result[k]) ? result[k] : of(result[k] as string));
        return forkJoin(sources).pipe(
          map((arr: Array<string>) => {
            let obj = {};
            arr.forEach((value: string, index: number) => {
              obj[key[index]] = value;
            });
            return obj;
          })
        );
      }
      return result;
    }

    if (translations) {
      res = this.interpolate(
        this.getValue(translations, key), interpolateParams);
    }

    if (typeof res === 'undefined' && this.defaultLang !== null &&
      this.defaultLang !== this.currentLang) {
      res = this.interpolate(this.getValue(
        this.translations[this.defaultLang], key), interpolateParams);
    }

    if (typeof res === 'undefined') {
      let params: MissingTranslationHandlerParams = {
        key,
        translateService: this
      };
      if (typeof interpolateParams !== 'undefined') {
        params.interpolateParams = interpolateParams;
      }
      res = params.key;
    }

    return typeof res !== 'undefined' ? res : key;
  }

  get(
      key: string | Array<string>,
      interpolateParams?: Object): Observable<string | any> {
    if (!this.utils.isDefined(key) || !key.length) {
      // eslint-disable-next-line quotes
      throw new Error(`Parameter "key" required`);
    }
    // check if we are loading a new translation to use {
    let res = this.getParsedResult(
      this.translations[this.currentLang], key, interpolateParams);
    return isObservable(res) ? res : of(res);
  }
}
