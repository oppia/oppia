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
 * @fileoverview Model class for creating and mutating instances of voice artist
 * language mapping informaiton.
 */

import {VoiceArtistIdToLanguageMapping} from 'domain/voiceover/voiceover-backend-api.service';

export class VoiceArtistLanguageMapping {
  _voiceArtistId: string;
  _languageCode: string;
  _languageAccentCode: string;

  getVoiceArtistID(): string {
    return this._voiceArtistId;
  }

  getLanguageCode(): string {
    return this._languageCode;
  }

  getLanguageAccentCode(): string {
    return this._languageAccentCode;
  }

  constructor(
    voiceArtistID: string,
    languageCode: string,
    languageAccentCode: string
  ) {
    this._voiceArtistId = voiceArtistID;
    this._languageCode = languageCode;
    this._languageAccentCode = languageAccentCode;
  }

  static createVoiceArtistLanguageMapping(
    voiceArtistID: string,
    languageCode: string,
    languageAccentCode: string
  ): VoiceArtistLanguageMapping {
    return new VoiceArtistLanguageMapping(
      voiceArtistID,
      languageCode,
      languageAccentCode
    );
  }

  static sortBasedOnLanguageCode(
    metaDataMapping1: VoiceArtistLanguageMapping,
    metadataMapping2: VoiceArtistLanguageMapping
  ): number {
    if (metaDataMapping1._languageCode < metadataMapping2._languageCode) {
      return -1;
    }
    if (metaDataMapping1._languageCode > metadataMapping2._languageCode) {
      return 1;
    }
    return 0;
  }

  static createVoiceArtistLanguageMappingList(
    voiceArtistIdToLanguageMapping: VoiceArtistIdToLanguageMapping
  ): VoiceArtistLanguageMapping[] {
    let voiceArtistLanguageMappingList: VoiceArtistLanguageMapping[] = [];

    for (let voiceArtistId in voiceArtistIdToLanguageMapping) {
      for (let languageCode in voiceArtistIdToLanguageMapping[voiceArtistId]) {
        let languageAccentCode =
          voiceArtistIdToLanguageMapping[voiceArtistId][languageCode];

        voiceArtistLanguageMappingList.push(
          this.createVoiceArtistLanguageMapping(
            voiceArtistId,
            languageCode,
            languageAccentCode
          )
        );
      }
    }
    return voiceArtistLanguageMappingList.sort(this.sortBasedOnLanguageCode);
  }
}
