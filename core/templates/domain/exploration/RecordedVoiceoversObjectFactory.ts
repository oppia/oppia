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
      public voiceoversMapping: VoiceoverMapping,
      private voiceoverObjectFactory: VoiceoverObjectFactory) {}

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
    const langCodeToVoiceover = this.voiceoversMapping[contentId];
    for (const langCode in langCodeToVoiceover) {
      langCodeToVoiceover[langCode].markAsNeedingUpdate();
    }
  }

  getVoiceoverLanguageCodes(contentId: string): string[] {
    return Object.keys(this.voiceoversMapping[contentId]);
  }

  hasVoiceovers(contentId: string): boolean {
    return this.getVoiceoverLanguageCodes(contentId).length > 0;
  }

  hasUnflaggedVoiceovers(contentId: string): boolean {
    const langCodeToVoiceover = this.voiceoversMapping[contentId];
    for (const langCode in langCodeToVoiceover) {
      if (!langCodeToVoiceover[langCode].needsUpdate) {
        return true;
      }
    }
    return false;
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
    const langCodeToVoiceover = this.voiceoversMapping[contentId];
    if (langCodeToVoiceover.hasOwnProperty(langCode)) {
      throw new Error('Trying to add duplicate language code.');
    }
    langCodeToVoiceover[langCode] =
      this.voiceoverObjectFactory.createNew(filename,
        fileSizeBytes, durationSecs);
  }

  deleteVoiceover(contentId: string, langCode: string): void {
    const langCodeToVoiceover = this.voiceoversMapping[contentId];
    if (!langCodeToVoiceover.hasOwnProperty(langCode)) {
      throw new Error(
        'Trying to remove non-existing translation for language code ' +
        langCode);
    }
    delete langCodeToVoiceover[langCode];
  }

  toggleNeedsUpdateAttribute(contentId: string, langCode: string): void {
    const langCodeToVoiceover = this.voiceoversMapping[contentId];
    langCodeToVoiceover[langCode].toggleNeedsUpdateAttribute();
  }

  toBackendDict(): IRecordedVoiceoversBackendDict {
    const voiceoversMappingDict = {};
    for (const contentId in this.voiceoversMapping) {
      const langCodeToVoiceover = this.voiceoversMapping[contentId];
      const langCodeToVoiceoverDict = {};
      Object.keys(langCodeToVoiceover).forEach(function(lang) {
        langCodeToVoiceoverDict[lang] = (
          langCodeToVoiceover[lang].toBackendDict());
      });
      voiceoversMappingDict[contentId] = langCodeToVoiceoverDict;
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

    for (const [contentId, langCodeToVoiceover] of voiceoversMappingEntries) {
      const langCodeToVoiceoverEntries = Object.entries(langCodeToVoiceover);

      voiceoversMapping[contentId] = {};
      for (const [langCode, voiceoverDict] of langCodeToVoiceoverEntries) {
        voiceoversMapping[contentId][langCode] = (
          this.voiceoverObjectFactory.createFromBackendDict(voiceoverDict));
      }
    }

    return new RecordedVoiceovers(
      voiceoversMapping, this.voiceoverObjectFactory);
  }

  createEmpty(): RecordedVoiceovers {
    return new RecordedVoiceovers({}, this.voiceoverObjectFactory);
  }
}

angular.module('oppia').factory(
  'RecordedVoiceoversObjectFactory',
  downgradeInjectable(RecordedVoiceoversObjectFactory));
