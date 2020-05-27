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

export interface IRecordedVoiceOverBackendDict {
  'voiceovers_mapping': {
    [propName: string]: {
      [propName: string]: IVoiceoverDict
    }
  }
}

export interface IVoiceoverMapping {
  [propName: string]: {
    [propName: string]: Voiceover
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

  getBindableVoiceovers(contentId: string): {[propName: string]: Voiceover} {
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

  hasVoiceover(contentId: string, langCode: string): boolean {
    return (
      this.voiceoversMapping.hasOwnProperty(contentId) &&
      this.voiceoversMapping[contentId].hasOwnProperty(langCode));
  }

  getVoiceover(contentId: string, langCode: string): Voiceover {
    return this.voiceoversMapping[contentId][langCode];
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
    if (this.hasVoiceover(contentId, langCode)) {
      throw new Error('Trying to add duplicate language code.');
    }
    this.voiceoversMapping[contentId][langCode] = (
      this.voiceoverObjectFactory.createNew(
        filename, fileSizeBytes, durationSecs));
  }

  deleteVoiceover(contentId: string, langCode: string): void {
    if (!this.hasVoiceover(contentId, langCode)) {
      throw new Error(
        'Trying to remove non-existing translation for language code ' +
        langCode);
    }
    delete this.voiceoversMapping[contentId][langCode];
  }

  toggleNeedsUpdateAttribute(contentId: string, langCode: string): void {
    this.getVoiceover(contentId, langCode).toggleNeedsUpdateAttribute();
  }

  toBackendDict(): IRecordedVoiceoversBackendDict {
    const voiceoverBackendDictsMapping = {};
    for (const contentId in this.voiceoversMapping) {
      voiceoverBackendDictsMapping[contentId] = {};
      for (const langCode in this.voiceoversMapping[contentId]) {
        voiceoverBackendDictsMapping[contentId][langCode] = (
          this.voiceoversMapping[contentId][langCode].toBackendDict());
      }
    }
    return { voiceovers_mapping: voiceoverBackendDictsMapping };
  }
}

@Injectable({
  providedIn: 'root'
})
export class RecordedVoiceoversObjectFactory {
  constructor(private voiceoverObjectFactory: VoiceoverObjectFactory) {}

  createFromBackendDict(
      backendDict: IRecordedVoiceoversBackendDict): RecordedVoiceovers {
    const voiceoverMapping: VoiceoverMapping = {};
    for (const contentId in backendDict.voiceovers_mapping) {
      voiceoverMapping[contentId] = {};
      for (const langCode in backendDict.voiceovers_mapping[contentId]) {
        voiceoverMapping[contentId][langCode] = (
          this.voiceoverObjectFactory.createFromBackendDict(
            backendDict.voiceovers_mapping[contentId][langCode]));
      }
    }
    return new RecordedVoiceovers(
      this.voiceoverObjectFactory, voiceoverMapping);
  }

  createEmpty(): RecordedVoiceovers {
    return new RecordedVoiceovers(this.voiceoverObjectFactory, {});
  }
}

angular.module('oppia').factory(
  'RecordedVoiceoversObjectFactory',
  downgradeInjectable(RecordedVoiceoversObjectFactory));
