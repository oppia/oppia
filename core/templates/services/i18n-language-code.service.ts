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
 * @fileoverview Service for informing of the i18n language code changes.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable, EventEmitter } from '@angular/core';
import { AppConstants } from 'app.constants';

@Injectable({
  providedIn: 'root'
})
export class I18nLanguageCodeService {
  // TODO(#9154): Remove static when migration is complete.
  /**
   * The static keyword is used here because this service is used in both
   * angular and angularjs. Since we are using upgradedServices.ts, where a new
   * instance is created for angularjs and angular will creates a new instance
   * for the angular part, we end up having two instances of the service.
   * In order to keep the variables same, static is used until migration is
   * complete.
   */
  static languageCodeChangeEventEmitter = new EventEmitter<string> ();
  static languageCode: string = AppConstants.DEFAULT_LANGUAGE_CODE;
  static rtlLanguageCodes: readonly string[] = AppConstants.RTL_LANGUAGE_CODES;

  // TODO(#9154): Remove this method when translation service is extended.
  /**
   * It stores all classroom metadata translation keys, like topic/story
   * title, description keys which currently cannot be translated from the
   * translations dashboard.
   */ 
  static hackyTranslationKeys: readonly string[] =
    AppConstants.HACKY_TRANSLATIONS_KEYS;

  private _preferredLanguageCodesLoadedEventEmitter =
    new EventEmitter<string[]>();

  constructor() {}

  getCurrentI18nLanguageCode(): string {
    // TODO(#9154): Change I18nLanguageCodeService to "this".
    return I18nLanguageCodeService.languageCode;
  }

  isCurrentLanguageRTL(): boolean {
    return (
      I18nLanguageCodeService.rtlLanguageCodes.indexOf(
        this.getCurrentI18nLanguageCode()) !== -1);
  }

  // TODO(#14645):Remove this method when translation service is extended.
  isCurrentLanguageEnglish(): boolean {
    return (this.getCurrentI18nLanguageCode() === 'en');
  }

  // TODO(#14645):Remove this method when translation service is extended.
  /**
   * Takes classroom name as input, generates the translation key for that,
   * checks if the key has translation and the current language is not english
   * and returns the classroom name or the translation key based on it.
   * @param classroomName : string - Name of the classroom.
   * @returns : string - Name of the classroom if translation key does not exist
   * in constants file or if the current language is english else the translation
   * key for the classroom.
   */
  getClassroomTranslationKey(classroomName: string): string {
    let translationKey = `I18N_CLASSROOM_${classroomName.toUpperCase()}_TITLE`;
    if (this.hasTranslation(translationKey)) {
      if(!this.isCurrentLanguageEnglish()) return translationKey;
    }
    return classroomName;
  }

  // TODO(#14645):Remove this method when translation service is extended.
  /**
   * Takes topic id and name as input, generates the translation key for that,
   * checks if the key has translation and the current language is not english
   * and returns the topic name or the translation key based on it.
   * @param topicId : string - Unique id of the topic, used to generate
   * translation key.
   * @param topicName : string - Name of the topic.
   * @returns : string - Name of the topic if translation key does not exist
   * in constants file or if the current language is english else the translation
   * key for the topic.
   */
  getTopicTitleTranslationKey(topicId: string, topicName: string): string {
    let translationKey = `I18N_TOPIC_${topicId}_TITLE`;
    if (this.hasTranslation(translationKey)) {
      if(!this.isCurrentLanguageEnglish()) return translationKey;
    }
    return topicName;
  }

  // TODO(#14645):Remove this method when translation service is extended.
  /**
   * Checks if the translation key is present in the constants file which
   * indicates it has atleast the translation key added in en.json.
   * @param translationKey : string - Translation key that needs to be
   * checked whether is has translation in language json files.
   * @returns : boolean - True if translation key is present in language json
   * files else False.
   */
  hasTranslation(translationKey: string): boolean {
    return (
      // TODO(#9154): Change I18nLanguageCodeService to "this".
      I18nLanguageCodeService.hackyTranslationKeys.indexOf(
        translationKey) !== -1);
  }

  get onI18nLanguageCodeChange(): EventEmitter<string> {
    // TODO(#9154): Change I18nLanguageCodeService to "this".
    return I18nLanguageCodeService.languageCodeChangeEventEmitter;
  }

  setI18nLanguageCode(code: string): void {
    // TODO(#9154): Change I18nLanguageCodeService to "this".
    I18nLanguageCodeService.languageCode = code;
    I18nLanguageCodeService.languageCodeChangeEventEmitter.emit(code);
  }

  get onPreferredLanguageCodesLoaded(): EventEmitter<string[]> {
    return this._preferredLanguageCodesLoadedEventEmitter;
  }
}

angular.module('oppia').factory(
  'I18nLanguageCodeService',
  downgradeInjectable(I18nLanguageCodeService));
