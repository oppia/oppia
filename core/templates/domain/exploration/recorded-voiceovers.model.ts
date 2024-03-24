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
 * @fileoverview Model for creating new frontend instances of
 * RecordedVoiceovers domain objects.
 */

export interface RecordedVoiceOverBackendDict {
  voiceovers_mapping: {
    [propName: string]: {
      [propName: string]: VoiceoverBackendDict;
    };
  };
}

export interface VoiceoverMapping {
  [propName: string]: BindableVoiceovers;
}

export interface BindableVoiceovers {
  [propName: string]: Voiceover;
}

import {
  VoiceoverBackendDict,
  Voiceover,
} from 'domain/exploration/voiceover.model';
export class RecordedVoiceovers {
  voiceoversMapping: VoiceoverMapping;
  constructor(voiceoversMapping: VoiceoverMapping) {
    this.voiceoversMapping = voiceoversMapping;
  }

  getAllContentIds(): string[] {
    return Object.keys(this.voiceoversMapping);
  }

  getBindableVoiceovers(contentId: string): BindableVoiceovers {
    return this.voiceoversMapping[contentId];
  }

  getVoiceover(contentId: string, langCode: string): Voiceover {
    return this.voiceoversMapping[contentId][langCode];
  }

  markAllVoiceoversAsNeedingUpdate(contentId: string): void {
    let languageCodeToVoiceover = this.voiceoversMapping[contentId];
    for (let languageCode in languageCodeToVoiceover) {
      languageCodeToVoiceover[languageCode].markAsNeedingUpdate();
    }
  }

  getLanguageCodes(contentId: string): string[] {
    return Object.keys(this.voiceoversMapping[contentId]);
  }

  hasVoiceovers(contentId: string): boolean {
    return this.getLanguageCodes(contentId).length > 0;
  }

  hasUnflaggedVoiceovers(contentId: string): boolean {
    let languageCodeToVoiceover = this.voiceoversMapping[contentId];
    for (let languageCode in languageCodeToVoiceover) {
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
    contentId: string,
    languageCode: string,
    filename: string,
    fileSizeBytes: number,
    durationSecs: number
  ): void {
    let languageCodeToVoiceover = this.voiceoversMapping[contentId];
    if (languageCodeToVoiceover.hasOwnProperty(languageCode)) {
      throw new Error('Trying to add duplicate language code.');
    }
    languageCodeToVoiceover[languageCode] = Voiceover.createNew(
      filename,
      fileSizeBytes,
      durationSecs
    );
  }

  deleteVoiceover(contentId: string, languageCode: string): void {
    let languageCodeToVoiceover = this.voiceoversMapping[contentId];
    if (!languageCodeToVoiceover.hasOwnProperty(languageCode)) {
      throw new Error(
        'Trying to remove non-existing translation for language code ' +
          languageCode
      );
    }
    delete languageCodeToVoiceover[languageCode];
  }

  toggleNeedsUpdateAttribute(contentId: string, languageCode: string): void {
    let languageCodeToVoiceover = this.voiceoversMapping[contentId];
    languageCodeToVoiceover[languageCode].toggleNeedsUpdateAttribute();
  }

  toBackendDict(): RecordedVoiceOverBackendDict {
    let voiceoversMappingDict: Record<
      string,
      Record<string, VoiceoverBackendDict>
    > = {};
    for (let contentId in this.voiceoversMapping) {
      let languageCodeToVoiceover = this.voiceoversMapping[contentId];
      let languageCodeToVoiceoverDict: Record<string, VoiceoverBackendDict> =
        {};
      Object.keys(languageCodeToVoiceover).forEach(lang => {
        languageCodeToVoiceoverDict[lang] =
          languageCodeToVoiceover[lang].toBackendDict();
      });
      voiceoversMappingDict[contentId] = languageCodeToVoiceoverDict;
    }
    return {
      voiceovers_mapping: voiceoversMappingDict,
    };
  }

  static createFromBackendDict(
    recordedVoiceoversDict: RecordedVoiceOverBackendDict
  ): RecordedVoiceovers {
    let voiceoversMapping: VoiceoverMapping = {};
    let voiceoversMappingDict = recordedVoiceoversDict.voiceovers_mapping;
    Object.keys(voiceoversMappingDict).forEach(contentId => {
      let languageCodeToVoiceoverDict = voiceoversMappingDict[contentId];
      let languageCodeToVoiceover: Record<string, Voiceover> = {};
      Object.keys(languageCodeToVoiceoverDict).forEach(langCode => {
        languageCodeToVoiceover[langCode] = Voiceover.createFromBackendDict(
          languageCodeToVoiceoverDict[langCode]
        );
      });
      voiceoversMapping[contentId] = languageCodeToVoiceover;
    });

    return new RecordedVoiceovers(voiceoversMapping);
  }

  static createEmpty(): RecordedVoiceovers {
    return new RecordedVoiceovers({});
  }
}
