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
 * @fileoverview Unit tests for Translate service.
 */

import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { HttpTestingController, HttpClientTestingModule } from
  '@angular/common/http/testing';
import { TranslateService } from './translate.service';

describe('Translate service', () => {
  let httpTestingController: HttpTestingController;
  let translate: TranslateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    httpTestingController = TestBed.get(HttpTestingController);
    translate = TestBed.get(TranslateService);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should fetch translations', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const failHandler = jasmine.createSpy('fail');
    const translations = {I18n_t_1: 'Hello'};

    translate.fetchTranslations('en').then(successHandler, failHandler);
    const req = httpTestingController.expectOne('/assets/i18n/en.json');
    req.flush(translations);

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(translations);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should set the new translation', fakeAsync(() => {
    let languageCode = '';
    let translations = {};
    const enTranslations = {I18n_t_1: 'Hello'};
    const subscription = translate.onLangChange.subscribe(
      res => {
        languageCode = res.newLanguageCode;
        translations = translate.translations[res.newLanguageCode];
      }
    );
    const esTranslations = {
      I18n_t_1: 'Hola',
    };

    translate.use('en');
    const req = httpTestingController.expectOne('/assets/i18n/en.json');
    req.flush(enTranslations);

    flushMicrotasks();

    expect(languageCode).toBe('en');
    expect(translations).toBe(enTranslations);

    translate.use('es');
    const req2 = httpTestingController.expectOne('/assets/i18n/es.json');
    req2.flush(esTranslations);

    flushMicrotasks();

    expect(languageCode).toBe('es');
    expect(translations).toBe(esTranslations);

    translate.use('en');
    expect(languageCode).toBe('en');
    expect(translations).toBe(enTranslations);

    subscription.unsubscribe();
  }));

  it('should get translations', fakeAsync(() => {
    const enTranslations = {
      I18n_t_1: 'Hello',
      I18n_t_2: 'Hello <[val]>'
    };

    const esTranslations = {
      I18n_t_1: 'Hola',
    };

    translate.use('en');

    const req = httpTestingController.expectOne('/assets/i18n/en.json');
    req.flush(enTranslations);

    flushMicrotasks();

    expect(translate.getInterpolatedString(
      'I18n_t_2', {val: 'World'})).toBe('Hello World');

    translate.use('es');

    const req2 = httpTestingController.expectOne('/assets/i18n/es.json');
    req2.flush(esTranslations);

    flushMicrotasks();

    expect(translate.getInterpolatedString(
      'I18n_t_1')).toBe('Hola');
    expect(translate.getInterpolatedString(
      'I18n_t_2', {val: 'World'})).toBe('Hello World');
    expect(translate.getInterpolatedString(
      'I18n_t_2', {val2: 'World'})).toBe('Hello <[val]>');
    expect(translate.getInterpolatedString(
      'I18n_t_3', {val: 'World'})).toBe('I18n_t_3');
  }));

  it('should throw an error if key is not defined', fakeAsync(() => {
    expect(function() {
      translate.getInterpolatedString('');
    }).toThrowError('Parameter "key" required');
  }));
});
