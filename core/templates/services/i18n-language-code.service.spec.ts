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
  let translationKey: string = '';
  let hackyTranslationIsAvailable: boolean;
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
    expect(i18nLanguageCodeService.getCurrentLanguageDirection()).toBe('ltr');
    expect(i18nLanguageCodeService.isCurrentLanguageRTL()).toBe(false);
    i18nLanguageCodeService.setI18nLanguageCode('en');
    expect(i18nLanguageCodeService.isCurrentLanguageRTL()).toBe(false);
    i18nLanguageCodeService.setI18nLanguageCode('ar');
    expect(i18nLanguageCodeService.getCurrentLanguageDirection()).toBe('rtl');
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

  it('should check whether hacky translation is available correctly', () => {
    // I18N_CLASSROOM_MATH_TITLE is present in constants file and hence
    // it is valid.
    hackyTranslationIsAvailable = i18nLanguageCodeService
      .isHackyTranslationAvailable('I18N_CLASSROOM_MATH_TITLE');
    expect(hackyTranslationIsAvailable).toBe(true);

    // I18N_TOPIC_12345axa_TITLE is not present in constants file and hence
    // it is invalid.
    hackyTranslationIsAvailable = i18nLanguageCodeService
      .isHackyTranslationAvailable('I18N_TOPIC_12345axa_TITLE');
    expect(hackyTranslationIsAvailable).toBe(false);
  });

  it('should get classroom translation key correctly', () => {
    translationKey = i18nLanguageCodeService.getClassroomTranslationKey(
      'Math');
    expect(translationKey).toBe('I18N_CLASSROOM_MATH_TITLE');

    translationKey = i18nLanguageCodeService.getClassroomTranslationKey(
      'Science');
    expect(translationKey).toBe('I18N_CLASSROOM_SCIENCE_TITLE');
  });

  it('should get topic and subtopic translation key correctly', () => {
    translationKey = i18nLanguageCodeService.getTopicTranslationKey(
      'abc1234', TranslationKeyType.TITLE);
    expect(translationKey).toBe('I18N_TOPIC_abc1234_TITLE');

    translationKey = i18nLanguageCodeService.getSubtopicTranslationKey(
      'abc1234', 'test-subtopic', TranslationKeyType.TITLE);
    expect(translationKey).toBe('I18N_SUBTOPIC_abc1234_test-subtopic_TITLE');

    translationKey = i18nLanguageCodeService.getTopicTranslationKey(
      'abc1234', TranslationKeyType.DESCRIPTION);
    expect(translationKey).toBe('I18N_TOPIC_abc1234_DESCRIPTION');

    translationKey = i18nLanguageCodeService.getSubtopicTranslationKey(
      'abc1234', 'test-subtopic', TranslationKeyType.DESCRIPTION);
    expect(translationKey).toBe(
      'I18N_SUBTOPIC_abc1234_test-subtopic_DESCRIPTION');
  });

  it('should get story translation keys correctly', () => {
    translationKey = i18nLanguageCodeService.getStoryTranslationKey(
      'abc1234', TranslationKeyType.TITLE);
    expect(translationKey).toBe('I18N_STORY_abc1234_TITLE');

    translationKey = i18nLanguageCodeService.getStoryTranslationKey(
      'abc1234', TranslationKeyType.DESCRIPTION);
    expect(translationKey).toBe('I18N_STORY_abc1234_DESCRIPTION');
  });

  it('should get exploration translation key correctly', () => {
    translationKey = i18nLanguageCodeService.getExplorationTranslationKey(
      'abc1234', TranslationKeyType.TITLE);
    expect(translationKey).toBe('I18N_EXPLORATION_abc1234_TITLE');

    translationKey = i18nLanguageCodeService.getExplorationTranslationKey(
      'abc1234', TranslationKeyType.DESCRIPTION);
    expect(translationKey).toBe('I18N_EXPLORATION_abc1234_DESCRIPTION');
  });

  it('should get event emitter for loading of preferred language codes', () => {
    let mockPreferredLanguageCodesLoadedEventEmitter = new EventEmitter();
    expect(i18nLanguageCodeService.onPreferredLanguageCodesLoaded).toEqual(
      mockPreferredLanguageCodesLoadedEventEmitter);
  });
});
