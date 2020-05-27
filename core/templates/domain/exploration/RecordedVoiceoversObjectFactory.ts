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

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { VoiceoverObjectFactory, IVoiceoverDict, Voiceover } from
  'domain/exploration/VoiceoverObjectFactory';
export class RecordedVoiceovers {
  voiceoversMapping: IVoiceoverMapping;
  _voiceoverObjectFactory: VoiceoverObjectFactory;
  constructor(
      voiceoversMapping: IVoiceoverMapping,
      voiceoverObjectFactory: VoiceoverObjectFactory) {
    this.voiceoversMapping = voiceoversMapping;
    this._voiceoverObjectFactory = voiceoverObjectFactory;
  }

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
    var languageCodeToVoiceover = this.voiceoversMapping[contentId];
    for (var languageCode in languageCodeToVoiceover) {
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
    var languageCodeToVoiceover = this.voiceoversMapping[contentId];
    for (var languageCode in languageCodeToVoiceover) {
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
    var languageCodeToVoiceover = this.voiceoversMapping[contentId];
    if (languageCodeToVoiceover.hasOwnProperty(languageCode)) {
      throw new Error('Trying to add duplicate language code.');
    }
    languageCodeToVoiceover[languageCode] =
      this._voiceoverObjectFactory.createNew(filename,
        fileSizeBytes, durationSecs);
  }

  deleteVoiceover(contentId: string, languageCode: string): void {
    var languageCodeToVoiceover = this.voiceoversMapping[contentId];
    if (!languageCodeToVoiceover.hasOwnProperty(languageCode)) {
      throw new Error(
        'Trying to remove non-existing translation for language code ' +
        languageCode);
    }
    delete languageCodeToVoiceover[languageCode];
  }

  toggleNeedsUpdateAttribute(contentId: string, languageCode: string): void {
    var languageCodeToVoiceover = this.voiceoversMapping[contentId];
    languageCodeToVoiceover[languageCode].toggleNeedsUpdateAttribute();
  }


  toBackendDict(): IRecordedVoiceOverBackendDict {
    var voiceoversMappingDict = {};
    for (var contentId in this.voiceoversMapping) {
      var languageCodeToVoiceover = this.voiceoversMapping[contentId];
      var languageCodeToVoiceoverDict = {};
      Object.keys(languageCodeToVoiceover).forEach(function(lang) {
        languageCodeToVoiceoverDict[lang] = (
          languageCodeToVoiceover[lang].toBackendDict());
      });
      voiceoversMappingDict[contentId] = languageCodeToVoiceoverDict;
    }
    return {
      voiceovers_mapping: voiceoversMappingDict
    };
  }
}

@Injectable({
  providedIn: 'root'
})
export class RecordedVoiceoversObjectFactory {
  constructor(private voiceoverObjectFactory: VoiceoverObjectFactory) {}

  createFromBackendDict(
      recordedVoiceoversDict: IRecordedVoiceOverBackendDict):
        RecordedVoiceovers {
    var voiceoversMapping = {};
    var voiceoversMappingDict = recordedVoiceoversDict.voiceovers_mapping;
    Object.keys(voiceoversMappingDict).forEach((contentId) => {
      var languageCodeToVoiceoverDict = voiceoversMappingDict[contentId];
      var languageCodeToVoiceover = {};
      Object.keys(languageCodeToVoiceoverDict).forEach((langCode) => {
        languageCodeToVoiceover[langCode] = (
          this.voiceoverObjectFactory.createFromBackendDict(
            languageCodeToVoiceoverDict[langCode]));
      });
      voiceoversMapping[contentId] = languageCodeToVoiceover;
    });

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
