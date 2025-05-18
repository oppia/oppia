// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to manage what audio translations are currently
 * being played or paused.
 */

import {EventEmitter, Injectable} from '@angular/core';

import {Voiceover} from 'domain/exploration/voiceover.model';
import {
  LanguageAccentMasterList,
  LanguageCodesMapping,
} from 'domain/voiceover/voiceover-backend-api.service';
import {LanguageAccentDescriptionToCode} from 'pages/voiceover-admin-page/voiceover-admin-page.component';
import {EntityVoiceoversService} from 'services/entity-voiceovers.services';

@Injectable({
  providedIn: 'root',
})
export class VoiceoverPlayerService {
  public activeContentId!: string;
  public activeContentHtml!: string;
  public activeComponentName!: string;
  public activeVoiceover!: Voiceover | undefined;
  public languageAccentMasterList!: LanguageAccentMasterList;
  public languageCodesMapping!: LanguageCodesMapping;
  public languageAccentDescriptions: string[] = [];
  public languageAccentDescriptionsToCodes: LanguageAccentDescriptionToCode =
    {};
  private _translationLanguageChangedEventEmitter = new EventEmitter<void>();
  private _activeVoiceoverChangedEventEmitter = new EventEmitter<void>();
  constructor(private entityVoiceoversService: EntityVoiceoversService) {}

  setActiveVoiceover(contentId: string): void {
    this.activeContentId = contentId;

    try {
      let activeEntityVoiceover =
        this.entityVoiceoversService.getActiveEntityVoiceovers();
      let voiceoverTypeToVoiceovers =
        activeEntityVoiceover.voiceoversMapping[contentId];
      this.activeVoiceover = voiceoverTypeToVoiceovers.manual;
    } catch (e: unknown) {
      this.activeVoiceover = undefined;
    }

    this._activeVoiceoverChangedEventEmitter.emit();
  }

  setActiveComponentName(componentName: string): void {
    this.activeComponentName = componentName;
  }

  getActiveComponentName(): string {
    return this.activeComponentName;
  }

  getActiveVoiceover(): Voiceover | undefined {
    return this.activeVoiceover;
  }

  setLanguageAccentCodesDescriptions(
    languageCode: string,
    languageAccentCodes: string[]
  ): void {
    let retrievedLanguageAccentCodes =
      this.languageAccentMasterList[languageCode];
    let languageAccentDescriptions = [];
    this.languageAccentDescriptions = [];
    this.languageAccentDescriptionsToCodes = {};

    for (let languageAccentCode in retrievedLanguageAccentCodes) {
      if (languageAccentCodes.indexOf(languageAccentCode) !== -1) {
        let description = retrievedLanguageAccentCodes[languageAccentCode];

        languageAccentDescriptions.push(description);
        this.languageAccentDescriptionsToCodes[description] =
          languageAccentCode;
      }
    }

    this.languageAccentDescriptions = languageAccentDescriptions;
    this._translationLanguageChangedEventEmitter.emit();
  }

  get onTranslationLanguageChanged(): EventEmitter<void> {
    return this._translationLanguageChangedEventEmitter;
  }

  get onActiveVoiceoverChanged(): EventEmitter<void> {
    return this._activeVoiceoverChangedEventEmitter;
  }

  getLanguageAccentDescriptions(): string[] {
    return this.languageAccentDescriptions;
  }
}
