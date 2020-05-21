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

import { VoiceoverObjectFactory, IVoiceoverDict, Voiceover } from
  'domain/exploration/VoiceoverObjectFactory';

export interface IRecordedVoiceoversBackendDict {
  'voiceovers_mapping': {
    [contentId: string]: {
      [langCode: string]: IVoiceoverDict
    }
  }
}

export interface IVoice {
  filename: string;
  fileSizeBytes: number;
  needsUpdate: boolean;
}

export interface IVoiceoverMapping {
  [contentId: string]: {
    [langCode: string]: Voiceover
  }
}

export class RecordedVoiceovers {
  constructor(
      public voiceoversMapping: IVoiceoverMapping,
      private voiceoverObjectFactory: VoiceoverObjectFactory) {}

  getAllContentId(): string[] {
    return Object.keys(this.voiceoversMapping);
  }

  getBindableVoiceovers(contentId: string): {[langCode: string]: IVoice} {
    return this.voiceoversMapping[contentId];
  }

  getVoiceover(contentId: string, langCode: string): IVoice {
    return this.voiceoversMapping[contentId][langCode];
  }

  markAllVoiceoversAsNeedingUpdate(contentId: string): void {
    const languageCodeToVoiceover = this.voiceoversMapping[contentId];
    for (const languageCode in languageCodeToVoiceover) {
      languageCodeToVoiceover[languageCode].markAsNeedingUpdate();
    }
  }

  getVoiceoverLanguageCodes(contentId: string): string[] {
    return Object.keys(this.voiceoversMapping[contentId]);
  }

  hasVoiceovers(contentId: string): boolean {
    return this.getVoiceoverLanguageCodes(contentId).length > 0;
  }

  hasUnflaggedVoiceovers(contentId: string): boolean {
    const languageCodeToVoiceover = this.voiceoversMapping[contentId];
    for (const languageCode in languageCodeToVoiceover) {
      if (!languageCodeToVoiceover[languageCode].needsUpdate) {
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
      contentId: string, languageCode: string, filename: string,
      fileSizeBytes: number, durationSecs: number): void {
    const languageCodeToVoiceover = this.voiceoversMapping[contentId];
    if (languageCodeToVoiceover.hasOwnProperty(languageCode)) {
      throw new Error('Trying to add duplicate language code.');
    }
    languageCodeToVoiceover[languageCode] =
      this.voiceoverObjectFactory.createNew(filename,
        fileSizeBytes, durationSecs);
  }

  deleteVoiceover(contentId: string, languageCode: string): void {
    const languageCodeToVoiceover = this.voiceoversMapping[contentId];
    if (!languageCodeToVoiceover.hasOwnProperty(languageCode)) {
      throw new Error(
        'Trying to remove non-existing translation for language code ' +
        languageCode);
    }
    delete languageCodeToVoiceover[languageCode];
  }

  toggleNeedsUpdateAttribute(contentId: string, languageCode: string): void {
    const languageCodeToVoiceover = this.voiceoversMapping[contentId];
    languageCodeToVoiceover[languageCode].toggleNeedsUpdateAttribute();
  }

  toBackendDict(): IRecordedVoiceoversBackendDict {
    const voiceoversMappingDict = {};
    for (const contentId in this.voiceoversMapping) {
      const languageCodeToVoiceover = this.voiceoversMapping[contentId];
      const languageCodeToVoiceoverDict = {};
      Object.keys(languageCodeToVoiceover).forEach(function(lang) {
        languageCodeToVoiceoverDict[lang] = (
          languageCodeToVoiceover[lang].toBackendDict());
      });
      voiceoversMappingDict[contentId] = languageCodeToVoiceoverDict;
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
    const voiceoversMapping = {};
    const voiceoversMappingEntries = (
      Object.entries(recordedVoiceoversDict.voiceovers_mapping));

    for (const [contentId, langCodeToVoiceover] of voiceoversMappingEntries) {
      const languageCodeToVoiceover = {};
      const langCodeToVoiceoverEntries = Object.entries(langCodeToVoiceover);

      for (const [langCode, voiceoverDict] of langCodeToVoiceoverEntries) {
        languageCodeToVoiceover[langCode] = (
          this.voiceoverObjectFactory.createFromBackendDict(voiceoverDict));
      }
      voiceoversMapping[contentId] = languageCodeToVoiceover;
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
