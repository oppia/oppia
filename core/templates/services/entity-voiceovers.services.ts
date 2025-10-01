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
 * @fileoverview Service to fetch EntityVoiceovers for the given entity in a
 * given langauge code.
 */

import {EventEmitter, Injectable} from '@angular/core';
import {Voiceover} from 'domain/exploration/voiceover.model';
import {EntityVoiceovers} from 'domain/voiceover/entity-voiceovers.model';
import {VoiceoverBackendApiService} from 'domain/voiceover/voiceover-backend-api.service';

export interface LanguageAccentCodeToEntityVoiceovers {
  [languageAccentCode: string]: EntityVoiceovers;
}

@Injectable({
  providedIn: 'root',
})
export class EntityVoiceoversService {
  public entityId!: string;
  public entityType!: string;
  public entityVersion!: number;
  public languageCode!: string;
  public activeLanguageAccentCode!: string;
  public languageAccentCodeToEntityVoiceovers: LanguageAccentCodeToEntityVoiceovers =
    {};
  public entityVoiceoversLoaded: boolean = false;
  private _voiceoversLoadedEventEmitter = new EventEmitter<void>();
  public languageAccentCodeChangeEventEmitter = new EventEmitter<void>();

  constructor(private voiceoverBackendApiService: VoiceoverBackendApiService) {}

  init(
    entityId: string,
    entityType: string,
    entityVersion: number,
    languageCode: string
  ): void {
    this.entityId = entityId;
    this.entityType = entityType;
    this.entityVersion = entityVersion;
    this.languageCode = languageCode;
  }

  setLanguageCode(languageCode: string): void {
    this.languageCode = languageCode;
  }

  getLanguageCode(): string {
    return this.languageCode;
  }

  setActiveLanguageAccentCode(languageAccentCode: string): void {
    this.activeLanguageAccentCode = languageAccentCode;
  }

  getActiveLanguageAccentCode(): string {
    return this.activeLanguageAccentCode;
  }

  createLanguageAccentCodeToEntityVoiceovers(
    entityVoiceoversList: EntityVoiceovers[]
  ): void {
    for (let entityVoiceovers of entityVoiceoversList) {
      this.languageAccentCodeToEntityVoiceovers[
        entityVoiceovers.languageAccentCode
      ] = entityVoiceovers;
    }
  }

  async fetchEntityVoiceovers(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.entityVoiceoversLoaded = false;
      this.voiceoverBackendApiService
        .fetchEntityVoiceoversByLanguageCodeAsync(
          this.entityType,
          this.entityId,
          this.entityVersion,
          this.languageCode
        )
        .then(entityVoiceoversList => {
          this.languageAccentCodeToEntityVoiceovers = {};
          this.createLanguageAccentCodeToEntityVoiceovers(entityVoiceoversList);
          this.entityVoiceoversLoaded = true;
          this.activeLanguageAccentCode = this.getLanguageAccentCodes()[0];
          this._voiceoversLoadedEventEmitter.emit();
          resolve();
        });
    });
  }

  isEntityVoiceoversLoaded(): boolean {
    return this.entityVoiceoversLoaded;
  }

  getEntityVoiceoversByLanguageAccentCode(
    languageAccentCode: string
  ): EntityVoiceovers | undefined {
    return this.languageAccentCodeToEntityVoiceovers[languageAccentCode];
  }

  getActiveEntityVoiceovers(): EntityVoiceovers {
    if (this.activeLanguageAccentCode === undefined) {
      this.activeLanguageAccentCode = this.getLanguageAccentCodes()[0];
    }
    return this.languageAccentCodeToEntityVoiceovers[
      this.activeLanguageAccentCode
    ];
  }

  addEntityVoiceovers(
    languageAccentCode: string,
    newlyAddedEntityVoiceovers: EntityVoiceovers
  ): void {
    this.languageAccentCodeToEntityVoiceovers[languageAccentCode] =
      newlyAddedEntityVoiceovers;
  }

  removeEntityVoiceovers(languageAccentCode: string): void {
    delete this.languageAccentCodeToEntityVoiceovers[languageAccentCode];
  }

  getLanguageAccentCodes(): string[] {
    let languageAccentCodes = [];
    for (let languageAccentCode in this.languageAccentCodeToEntityVoiceovers) {
      languageAccentCodes.push(languageAccentCode);
    }
    return languageAccentCodes;
  }

  getAllContentIdsToVoiceovers(): {
    [contentId: string]: Voiceover[];
  } {
    let contentIdToVoiceovers: {[contentId: string]: Voiceover[]} = {};
    let allEntityVoiceovers = Object.values(
      this.languageAccentCodeToEntityVoiceovers
    );
    for (let entityVoiceovers of allEntityVoiceovers) {
      for (let contentId in entityVoiceovers.voiceoversMapping) {
        let voiceovers = [];
        let manualVoiceover = entityVoiceovers.getManualVoiceover(
          contentId
        ) as Voiceover;
        let automaticVoiceover = entityVoiceovers.getAutomaticVoiceover(
          contentId
        ) as Voiceover;

        if (manualVoiceover) {
          voiceovers.push(manualVoiceover);
        }

        if (automaticVoiceover) {
          voiceovers.push(automaticVoiceover);
        }

        if (Object.keys(contentIdToVoiceovers).indexOf(contentId) !== -1) {
          contentIdToVoiceovers[contentId] =
            contentIdToVoiceovers[contentId].concat(voiceovers);
        } else {
          contentIdToVoiceovers[contentId] = voiceovers;
        }
      }
    }

    return contentIdToVoiceovers;
  }

  getAllVoiceovers(): Voiceover[] {
    let allVoiceovers: Voiceover[] = [];
    let allContentIdsToVoiceovers = this.getAllContentIdsToVoiceovers();
    for (let contentId in allContentIdsToVoiceovers) {
      allVoiceovers = allVoiceovers.concat(
        allContentIdsToVoiceovers[contentId]
      );
    }
    return allVoiceovers;
  }

  markManualVoiceoverAsNeedingUpdate(contentId: string): void {
    let allEntityVoiceovers = Object.values(
      this.languageAccentCodeToEntityVoiceovers
    );
    for (let entityVoiceovers of allEntityVoiceovers) {
      if (entityVoiceovers.getManualVoiceover(contentId)) {
        entityVoiceovers.getManualVoiceover(contentId)?.markAsNeedingUpdate();
      }
    }
  }

  removeAllVoiceoversForContent(contentId: string): void {
    let allEntityVoiceovers = Object.values(
      this.languageAccentCodeToEntityVoiceovers
    );
    for (let entityVoiceovers of allEntityVoiceovers) {
      if (entityVoiceovers.getManualVoiceover(contentId)) {
        entityVoiceovers.removeVoiceover(contentId);
      }
    }
  }

  toggleManualVoiceoverByLanguageAccent(
    languageAccentCode: string,
    contentId: string
  ): void {
    let entityVoiceovers =
      this.languageAccentCodeToEntityVoiceovers[languageAccentCode];
    entityVoiceovers.toggleManualVoiceoverNeedsUpdate(contentId);

    this.languageAccentCodeToEntityVoiceovers[languageAccentCode] =
      entityVoiceovers;
  }

  get onVoiceoverLoad(): EventEmitter<void> {
    return this._voiceoversLoadedEventEmitter;
  }

  get onLanguageAccentCodeChange(): EventEmitter<void> {
    return this.languageAccentCodeChangeEventEmitter;
  }
}
