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
 * @fileoverview Tests for Voice Artist Language Mapping model.
 */

import {VoiceArtistLanguageMapping} from './voice-artist-language-mapping.model';

describe('voice artist language mapping model', () => {
  it('should get language accent mapping field values', () => {
    let voiceArtistLanguageMapping =
      VoiceArtistLanguageMapping.createVoiceArtistLanguageMapping(
        'voiceArtistId',
        'languageCode',
        'languageAccentCode'
      );
    expect(voiceArtistLanguageMapping.getVoiceArtistID()).toEqual(
      'voiceArtistId'
    );
    expect(voiceArtistLanguageMapping.getLanguageCode()).toEqual(
      'languageCode'
    );
    expect(voiceArtistLanguageMapping.getLanguageAccentCode()).toEqual(
      'languageAccentCode'
    );
  });

  it('should get language accent language mapping list', () => {
    let voiceArtistIdToLanguageMapping = {
      voiceArtist1: {
        en: 'en-US',
      },
      voiceArtist2: {
        hi: 'hi-IN',
      },
      voiceArtist3: {
        en: 'en-IN',
      },
      voiceArtist4: {
        ar: 'Arabic (Egypt)',
      },
    };

    let voiceArtistLanguageMappingList =
      VoiceArtistLanguageMapping.createVoiceArtistLanguageMappingList(
        voiceArtistIdToLanguageMapping
      );

    expect(voiceArtistLanguageMappingList.length).toEqual(4);
  });
});
