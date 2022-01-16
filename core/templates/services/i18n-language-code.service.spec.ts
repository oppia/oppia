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
 * @fileoverview Unit tests for I18nLanguageCodeService.
 */

import { EventEmitter } from '@angular/core';

import { I18nLanguageCodeService, TranslationKeyType } from 'services/i18n-language-code.service';
import { Subscription } from 'rxjs';

describe('I18nLanguageCodeService', () => {
  const i18nLanguageCodeService = new I18nLanguageCodeService();
  let languageCode: string = '';
  let testSubscriptions: Subscription;
  beforeEach(() => {
    testSubscriptions = new Subscription();
    testSubscriptions.add(
      i18nLanguageCodeService.onI18nLanguageCodeChange
        .subscribe((code: string) => languageCode = code));
  });

  afterEach(() => {
    testSubscriptions.unsubscribe();
  });

  it('should set the language code', () => {
    i18nLanguageCodeService.setI18nLanguageCode('pt-br');
    expect(languageCode).toBe('pt-br');
  });

  it('should get the latest language code', () => {
    i18nLanguageCodeService.setI18nLanguageCode('es');
    const latestCode = i18nLanguageCodeService.getCurrentI18nLanguageCode();
    expect(latestCode).toBe('es');
  });

  it('should get whether the current language is RTL correctly', () => {
    i18nLanguageCodeService.setI18nLanguageCode('es');
    expect(i18nLanguageCodeService.isCurrentLanguageRTL()).toBe(false);
    i18nLanguageCodeService.setI18nLanguageCode('en');
    expect(i18nLanguageCodeService.isCurrentLanguageRTL()).toBe(false);
    i18nLanguageCodeService.setI18nLanguageCode('ar');
    expect(i18nLanguageCodeService.isCurrentLanguageRTL()).toBe(true);
  });

  it('should get whether the current language is english correctly', () => {
    i18nLanguageCodeService.setI18nLanguageCode('es');
    expect(i18nLanguageCodeService.isCurrentLanguageEnglish()).toBe(false);
    i18nLanguageCodeService.setI18nLanguageCode('en');
    expect(i18nLanguageCodeService.isCurrentLanguageEnglish()).toBe(true);
    i18nLanguageCodeService.setI18nLanguageCode('ar');
    expect(i18nLanguageCodeService.isCurrentLanguageEnglish()).toBe(false);
  });

  it('should check whether translation key is valid correctly', () => {
    spyOn(i18nLanguageCodeService, 'isTranslationKeyValid')
      .and.returnValues(true, false);
    expect(i18nLanguageCodeService.isTranslationKeyValid(
      'I18N_CLASSROOM_MATH_TITLE')).toBe(true);
    expect(i18nLanguageCodeService.isTranslationKeyValid(
      'I18N_TOPIC_12345axa_TITLE')).toBe(false);
  });

  it('should get classroom translation key correctly', () => {
    spyOn(i18nLanguageCodeService, 'getClassroomTranslationKey')
      .and.returnValues(
        'I18N_CLASSROOM_MATH_TITLE', 'I18N_CLASSROOM_SCIENCE_TITLE'
      );

    expect(i18nLanguageCodeService.getClassroomTranslationKey(
      'Math')).toBe('I18N_CLASSROOM_MATH_TITLE');
    expect(i18nLanguageCodeService.getClassroomTranslationKey(
      'Science')).toBe('I18N_CLASSROOM_SCIENCE_TITLE');
  });

  it('should get topic translation key correctly', () => {
    spyOn(i18nLanguageCodeService, 'getTopicTranslationKey')
      .and.returnValues(
        'I18N_TOPIC_abc1234_TITLE', 'I18N_TOPIC_abc1234_DESCRIPTION'
      );

    expect(i18nLanguageCodeService.getTopicTranslationKey(
      'abc1234', TranslationKeyType.Title)).toBe(
      'I18N_TOPIC_abc1234_TITLE');
    expect(i18nLanguageCodeService.getTopicTranslationKey(
      'abc1234', TranslationKeyType.Description)).toBe(
      'I18N_TOPIC_abc1234_DESCRIPTION');
  });

  it('should check if translation key is to be displayed correctly', () => {
    spyOn(i18nLanguageCodeService, 'isTranslationKeyValid')
      .and.returnValues(false, true, false, true);

    i18nLanguageCodeService.setI18nLanguageCode('en');
    expect(i18nLanguageCodeService.isTranslationKeyToBeDisplayed(
      'abcd1234')).toBe(false);
    expect(i18nLanguageCodeService.isTranslationKeyToBeDisplayed(
      'abcd1234')).toBe(false);

    i18nLanguageCodeService.setI18nLanguageCode('es');
    expect(i18nLanguageCodeService.isTranslationKeyToBeDisplayed(
      'abcd1234')).toBe(false);
    expect(i18nLanguageCodeService.isTranslationKeyToBeDisplayed(
      'abcd1234')).toBe(true);
  });

  it('should get event emitter for loading of preferred language codes', () => {
    let mockPreferredLanguageCodesLoadedEventEmitter = new EventEmitter();
    expect(i18nLanguageCodeService.onPreferredLanguageCodesLoaded).toEqual(
      mockPreferredLanguageCodesLoadedEventEmitter);
  });
});
