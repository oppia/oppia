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
 * @fileoverview Service to manage the current language being
 * used for content translations.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { ExplorationLanguageInfo } from
  'pages/exploration-player-page/services/audio-translation-language.service';
import { LanguageUtilService } from 'domain/utilities/language-util.service';
import { UrlService } from 'services/contextual/url.service';

import { INITIAL_CONTENT_LANGUAGE_CODE_URL_PARAM } from 'pages/exploration-player-page/switch-content-language-refresh-required-modal.component';

@Injectable({
  providedIn: 'root'
})
export class ContentTranslationLanguageService {
  constructor(
    private languageUtilService: LanguageUtilService,
    private urlService: UrlService
  ) {}

  // The 'currentContentLanguageCode' is initialized using private methods.
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  private currentContentLanguageCode!: string;
  private languageOptions: ExplorationLanguageInfo[] = [];

  _init(
      allContentLanguageCodesInExploration: string[],
      preferredContentLanguageCodes: string[],
      explorationLanguageCode: string
  ): void {
    this.currentContentLanguageCode = '';
    this.languageOptions = [];
    // Set the content language that is chosen initially.
    // Use the following priority (highest to lowest):
    // 1. The URL parameter "initialContentLanguageCode".
    // 2. Preferred content languages.
    // 3. Otherwise, the exploration language code.

    const urlParams = this.urlService.getUrlParams();
    if (
      urlParams.hasOwnProperty(INITIAL_CONTENT_LANGUAGE_CODE_URL_PARAM) &&
      allContentLanguageCodesInExploration.includes(
        urlParams[INITIAL_CONTENT_LANGUAGE_CODE_URL_PARAM])
    ) {
      this.setCurrentContentLanguageCode(urlParams[
        INITIAL_CONTENT_LANGUAGE_CODE_URL_PARAM]);
    }

    if (
      !this.currentContentLanguageCode &&
      preferredContentLanguageCodes !== null
    ) {
      for (const languageCode of preferredContentLanguageCodes) {
        if (allContentLanguageCodesInExploration.includes(languageCode)) {
          this.setCurrentContentLanguageCode(languageCode);
          break;
        }
      }
    }

    if (
      !this.currentContentLanguageCode &&
      explorationLanguageCode !== null
    ) {
      this.currentContentLanguageCode = explorationLanguageCode;
    }

    allContentLanguageCodesInExploration.push(explorationLanguageCode);
    allContentLanguageCodesInExploration.forEach(
      (languageCode: string) => {
        // TODO(#12341): Change getContentanguageDescription to instead refer to
        // the list of languages that we support written translations for. (Note
        // that this is not the same as "getContentLanguageDescription", because
        // the latter refers to the language that the exploration is written
        // in.)
        let languageDescription = (
          this.languageUtilService.getContentLanguageDescription(
            languageCode
          )
        );
        if (!languageDescription) {
          throw new Error('The exploration language code is invalid');
        }
        this.languageOptions.push({
          value: languageCode,
          displayed: languageDescription
        });
      });
  }

  init(
      allContentLanguageCodesInExploration: string[],
      preferredContentLanguageCodes: string[],
      explorationLanguageCode: string): void {
    this._init(
      allContentLanguageCodesInExploration, preferredContentLanguageCodes,
      explorationLanguageCode);
  }

  /**
   * @return {string} The current audio language code (eg. en).
   */
  getCurrentContentLanguageCode(): string {
    return this.currentContentLanguageCode;
  }

  /**
   * @return {Array<ExplorationLanguageInfo>}
   * An array of ExplorationLanguageInfo objects which consist of audio
   * language codes as well as their displayed language description for
   * the exploration.
   */
  getLanguageOptionsForDropdown(): ExplorationLanguageInfo[] {
    return this.languageOptions;
  }

  /**
   * @param {string} set a new language code.
   */
  setCurrentContentLanguageCode(newLanguageCode: string): void {
    if (this.currentContentLanguageCode !== newLanguageCode) {
      this.currentContentLanguageCode = newLanguageCode;
    }
  }
}

angular.module('oppia').factory(
  'ContentTranslationLanguageService',
  downgradeInjectable(ContentTranslationLanguageService));
