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

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import { VoiceoverObjectFactory } from
  'domain/exploration/VoiceoverObjectFactory.ts';

export class RecordedVoiceovers {
  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'voiceoversMapping' is a dict with underscore_cased
  // keys which give tslint errors against underscore_casing in favor of
  // camelCasing.
  voiceoversMapping: any;
  _voiceoverObjectFactory: VoiceoverObjectFactory;
  constructor(
      voiceoversMapping: any, voiceoverObjectFactory: VoiceoverObjectFactory) {
    this.voiceoversMapping = voiceoversMapping;
    this._voiceoverObjectFactory = voiceoverObjectFactory;
  }

  getAllContentId(): string[] {
    return Object.keys(this.voiceoversMapping);
  }

  // TODO(#7165): Replace 'any' with the exact type. This has been kept as
  // 'any' because the return type is a dict with varying keys and the correct
  // type needs to be found.
  getBindableVoiceovers(contentId: string): any {
    return this.voiceoversMapping[contentId];
  }

  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because the return type is a dict with underscore_cased
  // keys which give tslint errors against underscore_casing in favor of
  // camelCasing.
  getVoiceover(contentId: string, langCode: string): any {
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
      throw Error('Trying to add duplicate content id.');
    }
    this.voiceoversMapping[contentId] = {};
  }

  deleteContentId(contentId: string): void {
    if (!this.voiceoversMapping.hasOwnProperty(contentId)) {
      throw Error('Unable to find the given content id.');
    }
    delete this.voiceoversMapping[contentId];
  }

  addVoiceover(
      contentId: string, languageCode: string, filename: string,
      fileSizeBytes: number): void {
    var languageCodeToVoiceover = this.voiceoversMapping[contentId];
    if (languageCodeToVoiceover.hasOwnProperty(languageCode)) {
      throw Error('Trying to add duplicate language code.');
    }
    languageCodeToVoiceover[languageCode] =
      this._voiceoverObjectFactory.createNew(filename, fileSizeBytes);
  }

  deleteVoiceover(contentId: string, languageCode: string): void {
    var languageCodeToVoiceover = this.voiceoversMapping[contentId];
    if (!languageCodeToVoiceover.hasOwnProperty(languageCode)) {
      throw Error(
        'Trying to remove non-existing translation for language code ' +
        languageCode);
    }
    delete languageCodeToVoiceover[languageCode];
  }

  toggleNeedsUpdateAttribute(contentId: string, languageCode: string): void {
    var languageCodeToVoiceover = this.voiceoversMapping[contentId];
    languageCodeToVoiceover[languageCode].toggleNeedsUpdateAttribute();
  }

  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because the return type is a dict with underscore_cased
  // keys which give tslint errors against underscore_casing in favor of
  // camelCasing.
  toBackendDict(): any {
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

  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'recordedVoiceoversDict' is a dict with underscore_cased
  // keys which give tslint errors against underscore_casing in favor of
  // camelCasing.
  createFromBackendDict(recordedVoiceoversDict: any): RecordedVoiceovers {
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
