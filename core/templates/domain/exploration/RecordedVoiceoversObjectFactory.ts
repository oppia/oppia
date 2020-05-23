// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Factory for creating new frontend instances of
 * RecordedVoiceovers domain objects.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { IVoiceoverBackendDict, VoiceoverObjectFactory, Voiceover } from
  'domain/exploration/VoiceoverObjectFactory';

export interface VoiceoverMapping {
  [contentId: string]: {
    [langCode: string]: Voiceover;
  }
}

export interface IVoiceoverBackendDictMapping {
  [contentId: string]: {
    [langCode: string]: IVoiceoverBackendDict;
  }
}

export interface IRecordedVoiceoversBackendDict {
  /* eslint-disable camelcase */
  voiceovers_mapping: IVoiceoverBackendDictMapping;
  /* eslint-enable camelcase */
}

export class RecordedVoiceovers {
  constructor(
      private voiceoverObjectFactory: VoiceoverObjectFactory,
      public voiceoversMapping: VoiceoverMapping) {}

  getAllContentId(): string[] {
    return Object.keys(this.voiceoversMapping);
  }

  getBindableVoiceovers(contentId: string): {[langCode: string]: Voiceover} {
    return this.voiceoversMapping[contentId];
  }

  getVoiceover(contentId: string, langCode: string): Voiceover {
    return this.voiceoversMapping[contentId][langCode];
  }

  markAllVoiceoversAsNeedingUpdate(contentId: string): void {
    Object.values(this.voiceoversMapping[contentId])
      .forEach(voiceover => voiceover.markAsNeedingUpdate());
  }

  getVoiceoverLanguageCodes(contentId: string): string[] {
    return Object.keys(this.voiceoversMapping[contentId]);
  }

  hasVoiceovers(contentId: string): boolean {
    return (
      this.voiceoversMapping[contentId] &&
      this.getVoiceoverLanguageCodes(contentId).length > 0);
  }

  hasUnflaggedVoiceovers(contentId: string): boolean {
    return Object.values(this.voiceoversMapping[contentId])
      .some(voiceover => !voiceover.needsUpdate);
  }

  addContentId(contentId: string): void {
    if (this.voiceoversMapping.hasOwnProperty(contentId)) {
      throw new Error('Trying to add duplicate content id.');
    }
    this.voiceoversMapping[contentId] = {};
  }

  deleteContentId(contentId: string): void {
    if (!this.voiceoversMapping.hasOwnProperty(contentId)) {
      throw new Error('Unable to find the given content id.');
    }
    delete this.voiceoversMapping[contentId];
  }

  addVoiceover(
      contentId: string, langCode: string, filename: string,
      fileSizeBytes: number, durationSecs: number): void {
    const voiceoversByLangCode = this.voiceoversMapping[contentId];
    if (voiceoversByLangCode.hasOwnProperty(langCode)) {
      throw new Error('Trying to add duplicate language code.');
    }
    voiceoversByLangCode[langCode] = this.voiceoverObjectFactory.createNew(
      filename, fileSizeBytes, durationSecs);
  }

  deleteVoiceover(contentId: string, langCode: string): void {
    const voiceoversByLangCode = this.voiceoversMapping[contentId];
    if (!voiceoversByLangCode.hasOwnProperty(langCode)) {
      throw new Error(
        'Trying to remove non-existing translation for language code ' +
        langCode);
    }
    delete voiceoversByLangCode[langCode];
  }

  toggleNeedsUpdateAttribute(contentId: string, langCode: string): void {
    const voiceoversByLangCode = this.voiceoversMapping[contentId];
    voiceoversByLangCode[langCode].toggleNeedsUpdateAttribute();
  }

  toBackendDict(): IRecordedVoiceoversBackendDict {
    const voiceoversMappingDict = {};
    for (const contentId in this.voiceoversMapping) {
      const voiceoversByLangCode = this.voiceoversMapping[contentId];
      const voiceoversByLangCodeDict = {};
      Object.keys(voiceoversByLangCode).forEach(function(lang) {
        voiceoversByLangCodeDict[lang] = (
          voiceoversByLangCode[lang].toBackendDict());
      });
      voiceoversMappingDict[contentId] = voiceoversByLangCodeDict;
    }
    return { voiceovers_mapping: voiceoversMappingDict };
  }
}

@Injectable({
  providedIn: 'root'
})
export class RecordedVoiceoversObjectFactory {
  constructor(private voiceoverObjectFactory: VoiceoverObjectFactory) {}

  createFromBackendDict(
      recordedVoiceoversDict:
        IRecordedVoiceoversBackendDict): RecordedVoiceovers {
    const voiceoversMapping: VoiceoverMapping = {};
    const voiceoversMappingEntries = (
      Object.entries(recordedVoiceoversDict.voiceovers_mapping));

    for (const [contentId, voiceoversByLangCode] of voiceoversMappingEntries) {
      const voiceoversByLangCodeEntries = Object.entries(voiceoversByLangCode);

      voiceoversMapping[contentId] = {};
      for (const [langCode, voiceoverDict] of voiceoversByLangCodeEntries) {
        voiceoversMapping[contentId][langCode] = (
          this.voiceoverObjectFactory.createFromBackendDict(voiceoverDict));
      }
    }

    return new RecordedVoiceovers(
      this.voiceoverObjectFactory, voiceoversMapping);
  }

  createEmpty(): RecordedVoiceovers {
    return new RecordedVoiceovers(this.voiceoverObjectFactory, {});
  }
}

angular.module('oppia').factory(
  'RecordedVoiceoversObjectFactory',
  downgradeInjectable(RecordedVoiceoversObjectFactory));
