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

/**
 * Used to define if the translation key is type title or desciption.
 */
export enum TranslationKeyType {
  TITLE = 'TITLE',
  DESCRIPTION = 'DESCRIPTION',
}

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

  // TODO(#9154): Remove this variable when translation service is extended.
  /**
   * It stores all classroom metadata translation keys, like topic/story
   * title, description keys which currently cannot be translated from the
   * translations dashboard.
   */
  private _HACKY_TRANSLATION_KEYS: readonly string[] =
    AppConstants.HACKY_TRANSLATION_KEYS;

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

  currentDecimalSeparator(): string {
    const currentLanguage = this.getCurrentI18nLanguageCode();
    const supportedLanguages = AppConstants.SUPPORTED_SITE_LANGUAGES;
    let decimalSeparator: string;
    for (let i of supportedLanguages) {
      if (i.id === currentLanguage) {
        decimalSeparator = i.decimal_separator;
        break;
      }
    }
    return decimalSeparator;
  }

  getInputValidationRegex(): RegExp {
    const decimalSeparator: string = this.currentDecimalSeparator();
    const dot = new RegExp('[^e0-9\.\-]', 'g');
    const comma = new RegExp('[^e0-9\,\-]', 'g');
    const arabic = new RegExp('[^e0-9\٫\-]', 'g');

    if (decimalSeparator === ',') {
      return comma; // Input with a comma as decimal separator.
    } else if (decimalSeparator === '٫') {
      return arabic; // Input with the Arabic seperator.
    } else {
      return dot; // Input with a period as decimal separator.
    }
  }

  convertToEnglishDecimal(number: string): number {
    const decimalSeparator = this.currentDecimalSeparator();

    // Check if number is in proper format.
    // eslint-disable-next-line max-len
    let validRegex = new RegExp('-{0,1}[0-9]?([\.|\,|\٫]?[0-9]+)?(e[0-9]+)?', 'g');

    let engNum: number;

    // Get the valid part of input.
    let numberMatch = number.match(validRegex);

    // If a valid match cannot be found, return null.
    if (numberMatch === null) {
      return null;
    }

    number = numberMatch[0];

    let numString = number.replace(`${decimalSeparator}`, '.');
    engNum = parseFloat(numString);

    // If the input cannot be parsed, output null.
    if (isNaN(engNum)) {
      engNum = null;
    }
    return engNum;
  }

  convertToLocalizedNumber(number: number|string): string {
    let decimalSeparator = this.currentDecimalSeparator();
    let stringNumber = number.toString();
    let convertedNumber: string = stringNumber;

    if (decimalSeparator === ',') {
      convertedNumber = stringNumber.replace('.', ',');
    } else if (decimalSeparator === '٫') {
      convertedNumber = stringNumber.replace('.', '٫');
    }

    return convertedNumber;
  }
  // TODO(#14645): Remove this method when translation service is extended.
  isCurrentLanguageEnglish(): boolean {
    return this.getCurrentI18nLanguageCode() === 'en';
  }

  // TODO(#14645): Remove this method when translation service is extended.
  /**
   * Takes classroom name as input, generates and returns the translation
   * key based on that.
   * @param {string} classroomName - Name of the classroom.
   * @returns {string} - translation key for classroom name.
   */
  getClassroomTranslationKey(classroomName: string): string {
    return `I18N_CLASSROOM_${classroomName.toUpperCase()}_TITLE`;
  }

  // TODO(#14645): Remove this method when translation service is extended.
  /**
   * Takes topic id and entity translationKey type as input, generates and
   * returns the translation key based on that.
   * @param {string} topicId - Unique id of the topic, used to generate
   * translation key.
   * @param {TranslationKeyType} keyType - either Title or Description.
   * @returns {string} - translation key for the topic name/description.
   */
  getTopicTranslationKey(
      topicId: string, keyType: TranslationKeyType): string {
    return `I18N_TOPIC_${topicId}_${keyType}`;
  }

  // TODO(#14645): Remove this method when translation service is extended.
  /**
   * Takes topic id, subtopic url fragment and entity translationKey type as
   * input, generates and returns the translation key based on that.
   * @param {string} topicId - Unique id of the topic, used to generate
   * translation key.
   * @param {string} subtopicUrlFragment - Unique url fragment subtopic, with
   * respect to the topic.
   * @param {TranslationKeyType} keyType - either Title or Description.
   * @returns {string} - translation key for the subtopic name/description.
   */
  getSubtopicTranslationKey(
      topicId: string, subtopicUrlFragment: string,
      keyType: TranslationKeyType): string {
    return `I18N_SUBTOPIC_${topicId}_${subtopicUrlFragment}_${keyType}`;
  }

  // TODO(#14645): Remove this method when translation service is extended.
  /**
   * Takes story id and entity translationKey type as input, generates and
   * returns the translation key based on that.
   * @param {string} storyId - Unique id of the story, used to generate
   * translation key.
   * @param {TranslationKeyType} keyType - either Title or Description.
   * @returns {string} - translation key for the story name/description.
   */
  getStoryTranslationKey(
      storyId: string, keyType: TranslationKeyType): string {
    return `I18N_STORY_${storyId}_${keyType}`;
  }

  // TODO(#14645): Remove this method when translation service is extended.
  /**
   * Takes exploration id and entity translationKey type as input, generates
   * and returns the translation key based on that.
   * @param {string} explorationId - Unique id of the exploration, used to
   * generate translation key.
   * @param {TranslationKeyType} keyType - either Title or Description.
   * @returns {string} - translation key for the exploration name/description.
   */
  getExplorationTranslationKey(
      explorationId: string, keyType: TranslationKeyType): string {
    return `I18N_EXPLORATION_${explorationId}_${keyType}`;
  }

  // TODO(#14645): Remove this method when translation service is extended.
  /**
   * Checks if the translation key is valid by checking if it is present
   * in the constants file which indicates that the translation key is
   * present in the language JSON file.
   * @param {string} translationKey - The translation key whose existence in
   * the language JSON file needs to be checked.
   * @returns {boolean} - Whether the given translation key is present
   * in the language JSON files.
   */
  isHackyTranslationAvailable(translationKey: string): boolean {
    return (
      this._HACKY_TRANSLATION_KEYS.indexOf(translationKey) !== -1);
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
