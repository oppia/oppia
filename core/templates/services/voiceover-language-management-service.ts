// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for managing voiceover languages supported or
 * potentially supported by Oppia for both manual and automatic voiceovers.
 */

import {Injectable} from '@angular/core';
import {downgradeInjectable} from '@angular/upgrade/static';
import {LanguageAccentMasterList} from 'domain/voiceover/voiceover-backend-api.service';

export interface LanguageCodesMapping {
  [languageCode: string]: {
    [languageAccentCode: string]: boolean;
  };
}

@Injectable({
  providedIn: 'root',
})
export class VoiceoverLanguageManagementService {
  public languageAccentMasterList!: LanguageAccentMasterList;
  public autoGeneratableLanguageAccentCodes!: string[];
  public languageCodesMapping!: LanguageCodesMapping;
  public cloudSupportedLanguageAccentCodes: string[] = [];

  init(
    languageAccentMasterList: LanguageAccentMasterList,
    autoGeneratableLanguageAccentCodes: string[],
    languageCodesMapping: LanguageCodesMapping
  ): void {
    this.languageAccentMasterList = languageAccentMasterList;
    this.autoGeneratableLanguageAccentCodes =
      autoGeneratableLanguageAccentCodes;
    this.languageCodesMapping = languageCodesMapping;
  }

  getAutogeneratableLanguageAccents(languageCode: string): string[] {
    let supportedLanguageAccents = Object.keys(
      this.languageCodesMapping[languageCode]
    ).filter(accent => this.languageCodesMapping[languageCode][accent]);
    return supportedLanguageAccents;
  }

  canVoiceoverForLanguage(languageCode: string): boolean {
    return this.languageCodesMapping?.hasOwnProperty(languageCode);
  }

  setCloudSupportedLanguageAccents(languageCode: string): void {
    let supportedLanguageAccents = Object.keys(
      this.languageCodesMapping[languageCode]
    ).filter(accent => this.languageCodesMapping[languageCode][accent]);
    this.cloudSupportedLanguageAccentCodes = supportedLanguageAccents;
  }

  isAutogenerationSupportedGivenLanguageAccent(
    languageAccentCode: string
  ): boolean {
    return this.cloudSupportedLanguageAccentCodes.includes(languageAccentCode);
  }
}

angular
  .module('oppia')
  .factory(
    'VoiceoverLanguageManagementService',
    downgradeInjectable(VoiceoverLanguageManagementService)
  );
