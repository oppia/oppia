// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the audio translation language service.
 */

import { TestBed } from '@angular/core/testing';

import { AudioTranslationLanguageService } from
  'pages/exploration-player-page/services/audio-translation-language.service';

describe('Audio translation language service', () => {
  let atls: AudioTranslationLanguageService;
  beforeEach(() => {
    atls = TestBed.get(AudioTranslationLanguageService);
  });

  it('should properly initialize the current audio language when ' +
     'a preferred language is set', () => {
    let allAudioLanguageCodesInExploration = ['hi-en', 'en'];
    let preferredLanguageCode = 'hi-en';
    let explorationLanguageCode = 'hi';
    atls.init(allAudioLanguageCodesInExploration, preferredLanguageCode,
      explorationLanguageCode, false);
    expect(atls.getCurrentAudioLanguageCode()).toEqual('hi-en');
    atls.clearCurrentAudioLanguageCode();

    allAudioLanguageCodesInExploration = ['hi-en', 'en'];
    preferredLanguageCode = 'en';
    explorationLanguageCode = 'hi';
    atls.init(allAudioLanguageCodesInExploration, preferredLanguageCode,
      explorationLanguageCode, false);
    expect(atls.getCurrentAudioLanguageCode()).toEqual('en');
    atls.clearCurrentAudioLanguageCode();

    allAudioLanguageCodesInExploration = ['hi-en'];
    preferredLanguageCode = 'en';
    explorationLanguageCode = 'hi';
    atls.init(allAudioLanguageCodesInExploration, preferredLanguageCode,
      explorationLanguageCode, false);
    expect(atls.getCurrentAudioLanguageCode()).toEqual('hi-en');
  });

  it('should initialize the current audio language when ' +
     'no preferred language is set and the exploration contains an audio ' +
     'language that is related to the exploration language', () => {
    let allAudioLanguageCodesInExploration = ['hi-en', 'en'];
    let preferredLanguageCode = null;
    let explorationLanguageCode = 'hi';
    atls.init(allAudioLanguageCodesInExploration, preferredLanguageCode,
      explorationLanguageCode, false);
    expect(atls.getCurrentAudioLanguageCode()).toEqual('hi-en');
  });

  it('should initialize the current audio language to the most ' +
     'relevant language when multiple audio languages are related ' +
     'to the exploration language', () => {
    let allAudioLanguageCodesInExploration = ['hi-en', 'en'];
    let preferredLanguageCode = null;
    let explorationLanguageCode = 'en';
    atls.init(allAudioLanguageCodesInExploration, preferredLanguageCode,
      explorationLanguageCode, false);
    expect(atls.getCurrentAudioLanguageCode()).toEqual('en');
  });

  it('should not have any audio language option when no audio is available ' +
     'and automatic Text-to-speech is disabled in an exploration', () => {
    let allAudioLanguageCodesInExploration = [];
    let explorationLanguageCode = 'en';
    let automaticTextToSpeechEnabled = false;

    // When preferredLanguageCode is set.
    let preferredLanguageCode = 'hi';
    atls.init(allAudioLanguageCodesInExploration, preferredLanguageCode,
      explorationLanguageCode, automaticTextToSpeechEnabled);
    expect(atls.getLanguageOptionsForDropdown()).toEqual([]);

    // When preferredLanguageCode is not set.
    preferredLanguageCode = null;
    atls.init(allAudioLanguageCodesInExploration, preferredLanguageCode,
      explorationLanguageCode, automaticTextToSpeechEnabled);
    expect(atls.getLanguageOptionsForDropdown()).toEqual([]);
  });
});
