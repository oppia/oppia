// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview A service that maintains a record of which language
 * in the translation tab is currently active.
 */

import { EventEmitter, Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import { LanguageUtilService } from 'domain/utilities/language-util.service';
import { LoggerService } from 'services/contextual/logger.service';


@Injectable({
  providedIn: 'root'
})
export class TranslationLanguageService {
  // This property is initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  private activeLanguageCode!: string;
  private allAudioLanguageCodes: string[] = (
    this.languageUtilService.getAllVoiceoverLanguageCodes());

  private _activeLanguageChangedEventEmitter = new EventEmitter<void>();

  constructor(
    private languageUtilService: LanguageUtilService,
    private loggerService: LoggerService) {}

  getActiveLanguageCode(): string {
    return this.activeLanguageCode;
  }

  getActiveLanguageDirection(): string {
    return this.languageUtilService.getLanguageDirection(
      this.getActiveLanguageCode());
  }

  // This function throws an error if 'newActiveLanguageCode' is invalid.
  setActiveLanguageCode(newActiveLanguageCode: string): void {
    if (newActiveLanguageCode &&
        this.allAudioLanguageCodes.indexOf(newActiveLanguageCode) < 0) {
      this.loggerService.error(
        'Invalid active language code: ' + newActiveLanguageCode);
      return;
    }
    this.activeLanguageCode = newActiveLanguageCode;
    this._activeLanguageChangedEventEmitter.emit();
  }

  // Function returns null when active language code is not set.
  getActiveLanguageDescription(): string | null {
    if (!this.activeLanguageCode) {
      return null;
    }
    return this.languageUtilService.getAudioLanguageDescription(
      this.activeLanguageCode);
  }

  get onActiveLanguageChanged(): EventEmitter<void> {
    return this._activeLanguageChangedEventEmitter;
  }
}

angular.module('oppia').service(
  'TranslationLanguageService',
  downgradeInjectable(TranslationLanguageService));
