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
  let allAudioLanguageCodesInExploration: string[];

  beforeEach(() => {
    atls = TestBed.get(AudioTranslationLanguageService);

    spyOn(window.speechSynthesis, 'getVoices').and.returnValue([{
      'default': false,
      lang: 'en-US',
      localService: false,
      name: 'US English',
      voiceURI: 'US English'
    }]);
  });

  it('should properly initialize the current audio language when ' +
     'a preferred language is set', () => {
    allAudioLanguageCodesInExploration = ['hi-en', 'en'];
    let preferredLanguageCode = 'hi-en';
    let explorationLanguageCode = 'hi';
    const automaticTextToSpeechEnabled = false;

    atls.init(
      allAudioLanguageCodesInExploration, preferredLanguageCode,
      explorationLanguageCode, automaticTextToSpeechEnabled);
    expect(atls.isAutomaticTextToSpeechEnabled()).toBe(
      automaticTextToSpeechEnabled);
    expect(atls.getCurrentAudioLanguageCode()).toEqual('hi-en');
    expect(atls.getAllAudioLanguageCodesInExploration()).toBe(
      allAudioLanguageCodesInExploration);
    atls.clearCurrentAudioLanguageCode();

    allAudioLanguageCodesInExploration = ['hi-en', 'en'];
    preferredLanguageCode = 'en';
    explorationLanguageCode = 'hi';

    atls.init(
      allAudioLanguageCodesInExploration, preferredLanguageCode,
      explorationLanguageCode, automaticTextToSpeechEnabled);
    expect(atls.getCurrentAudioLanguageCode()).toEqual('en');
    atls.clearCurrentAudioLanguageCode();

    allAudioLanguageCodesInExploration = ['hi-en'];
    preferredLanguageCode = 'en';
    explorationLanguageCode = 'hi';

    atls.init(
      allAudioLanguageCodesInExploration, preferredLanguageCode,
      explorationLanguageCode, false);
    expect(atls.getCurrentAudioLanguageCode()).toEqual('hi-en');
    expect(atls.getAllAudioLanguageCodesInExploration()).toBe(
      allAudioLanguageCodesInExploration);
  });

  it('should initialize the current audio language when ' +
     'no preferred language is set and the exploration contains an audio ' +
     'language that is related to the exploration language', () => {
    allAudioLanguageCodesInExploration = ['hi-en', 'en'];
    const preferredLanguageCode = null;
    const explorationLanguageCode = 'hi';
    atls.init(
      allAudioLanguageCodesInExploration, preferredLanguageCode,
      explorationLanguageCode, false);
    expect(atls.getCurrentAudioLanguageCode()).toEqual('hi-en');
    expect(atls.getAllAudioLanguageCodesInExploration()).toBe(
      allAudioLanguageCodesInExploration);
  });

  it('should initialize the current audio language when ' +
    'no preferred language is set and the exploration contains an audio ' +
    'language that is no related to the exploration language', () => {
    allAudioLanguageCodesInExploration = ['hi', 'en'];
    const preferredLanguageCode = null;
    const explorationLanguageCode = 'hi-en';
    atls.init(
      allAudioLanguageCodesInExploration, preferredLanguageCode,
      explorationLanguageCode, false);
    expect(atls.getCurrentAudioLanguageCode()).toEqual('hi');
    expect(atls.getAllAudioLanguageCodesInExploration()).toBe(
      allAudioLanguageCodesInExploration);
  });

  it('should initialize the current audio language to the most ' +
     'relevant language when multiple audio languages are related ' +
     'to the exploration language', () => {
    allAudioLanguageCodesInExploration = ['hi-en', 'en'];
    const preferredLanguageCode = null;
    const explorationLanguageCode = 'en';
    const languageOptions = [{
      value: 'hi-en',
      displayed: 'Hinglish'
    }, {
      value: 'en',
      displayed: 'English'
    }];
    atls.init(
      allAudioLanguageCodesInExploration, preferredLanguageCode,
      explorationLanguageCode, false);
    expect(atls.getCurrentAudioLanguageCode()).toEqual('en');
    expect(atls.getAllAudioLanguageCodesInExploration()).toBe(
      allAudioLanguageCodesInExploration);
    expect(atls.getLanguageOptionsForDropdown()).toEqual(languageOptions);
  });

  it('should not have any audio language option when no audio is available ' +
     'and automatic Text-to-speech is disabled in an exploration', () => {
    allAudioLanguageCodesInExploration = [];
    const explorationLanguageCode = 'en';
    const automaticTextToSpeechEnabled = false;

    // When preferredLanguageCode is set.
    let preferredLanguageCode: string | null = 'hi';
    atls.init(
      allAudioLanguageCodesInExploration, preferredLanguageCode,
      explorationLanguageCode, automaticTextToSpeechEnabled);
    expect(atls.getCurrentAudioLanguageCode()).toEqual(null);
    expect(atls.getLanguageOptionsForDropdown()).toEqual([]);
    atls.clearCurrentAudioLanguageCode();

    // When preferredLanguageCode is not set.
    preferredLanguageCode = null;
    atls.init(
      allAudioLanguageCodesInExploration, preferredLanguageCode,
      explorationLanguageCode, automaticTextToSpeechEnabled);
    expect(atls.getCurrentAudioLanguageCode()).toEqual(null);
    expect(atls.getLanguageOptionsForDropdown()).toEqual([]);
  });

  it('should initialize the current audio language when audio is available ' +
    'and automatic Text-to-speech is enabled in an exploration', () => {
    allAudioLanguageCodesInExploration = [];
    const explorationLanguageCode = 'en';
    const preferredLanguageCode = null;
    const automaticTextToSpeechEnabled = true;
    const languageOptions = [{
      value: 'en-auto',
      displayed: 'English (auto)',
    }];
    atls.init(
      allAudioLanguageCodesInExploration, preferredLanguageCode,
      explorationLanguageCode, automaticTextToSpeechEnabled);
    expect(atls.isAutogeneratedAudioAllowed()).toBe(true);
    expect(atls.isAutogeneratedLanguageCodeSelected()).toBe(true);
    expect(atls.getSpeechSynthesisLanguageCode()).toBe('en-US');
    expect(atls.getCurrentAudioLanguageCode()).toEqual('en-auto');
    expect(atls.getLanguageOptionsForDropdown()).toEqual(languageOptions);
  });

  it('should correctly identify if autogenerated language code ' +
    'is selected', () => {
    allAudioLanguageCodesInExploration = [];
    const explorationLanguageCode = 'en';
    const preferredLanguageCode = null;
    const automaticTextToSpeechEnabled = true;
    atls.init(
      allAudioLanguageCodesInExploration, preferredLanguageCode,
      explorationLanguageCode, automaticTextToSpeechEnabled);
    expect(atls.isAutogeneratedAudioAllowed()).toBe(true);
    expect(atls.isAutogeneratedLanguageCodeSelected()).toBe(true);
    atls.clearCurrentAudioLanguageCode();
    expect(atls.isAutogeneratedLanguageCodeSelected()).toBe(false);
  });

  it('should get correct speech synthesis language code',
    () => {
      expect(atls.getSpeechSynthesisLanguageCode()).toBe(null);
      allAudioLanguageCodesInExploration = [];
      let explorationLanguageCode = 'en';
      const preferredLanguageCode = null;
      const automaticTextToSpeechEnabled = true;
      atls.init(
        allAudioLanguageCodesInExploration, preferredLanguageCode,
        explorationLanguageCode, automaticTextToSpeechEnabled);
      expect(atls.getSpeechSynthesisLanguageCode()).toBe('en-US');
    });

  it('should initialize the current audio language when exploration has ' +
    'audio language codes and audio is available and automatic ' +
    'Text-to-speech is enabled in it', () => {
    allAudioLanguageCodesInExploration = ['hi-en', 'en'];
    const explorationLanguageCode = 'en';
    const preferredLanguageCode = null;
    const languageOptions = [{
      value: 'hi-en',
      displayed: 'Hinglish'
    }, {
      value: 'en',
      displayed: 'English'
    }, {
      value: 'en-auto',
      displayed: 'English (auto)',
    }];
    atls.init(
      allAudioLanguageCodesInExploration, preferredLanguageCode,
      explorationLanguageCode, true);
    expect(atls.getCurrentAudioLanguageCode()).toEqual('en');
    expect(atls.getLanguageOptionsForDropdown()).toEqual(languageOptions);
  });

  it('should get speech synthesis language code when userAgent is mobile',
    () => {
      spyOnProperty(navigator, 'userAgent').and.returnValue('iPhone');
      allAudioLanguageCodesInExploration = [];
      const explorationLanguageCode = 'en';
      const preferredLanguageCode = null;
      const automaticTextToSpeechEnabled = true;
      atls.init(
        allAudioLanguageCodesInExploration, preferredLanguageCode,
        explorationLanguageCode, automaticTextToSpeechEnabled);
      expect(atls.isAutogeneratedAudioAllowed()).toBe(true);
      expect(atls.isAutogeneratedLanguageCodeSelected()).toBe(true);
      expect(atls.getSpeechSynthesisLanguageCode()).toBe('en_US');
      expect(atls.getCurrentAudioLanguageCode()).toEqual('en-auto');
      expect(atls.getLanguageOptionsForDropdown()).toEqual([{
        value: 'en-auto',
        displayed: 'English (auto)',
      }]);
    });

  it('should change current audio language after initialization', () => {
    allAudioLanguageCodesInExploration = ['hi-en', 'en'];
    const preferredLanguageCode = 'hi-en';
    const explorationLanguageCode = 'hi';
    const automaticTextToSpeechEnabled = false;
    atls.init(
      allAudioLanguageCodesInExploration, preferredLanguageCode,
      explorationLanguageCode, automaticTextToSpeechEnabled);
    expect(atls.getCurrentAudioLanguageCode()).toEqual('hi-en');
    expect(atls.getAllAudioLanguageCodesInExploration()).toBe(
      allAudioLanguageCodesInExploration);
    atls.setCurrentAudioLanguageCode('en');
    expect(atls.getCurrentAudioLanguageCode()).toEqual('en');
    expect(atls.getAllAudioLanguageCodesInExploration()).toBe(
      allAudioLanguageCodesInExploration);
  });

  it('should get the current language description correctly', () => {
    allAudioLanguageCodesInExploration = ['hi-en', 'en'];
    const preferredLanguageCode = 'hi-en';
    const explorationLanguageCode = 'hi';
    atls.init(
      allAudioLanguageCodesInExploration, preferredLanguageCode,
      explorationLanguageCode, false);
    expect(atls.getCurrentAudioLanguageCode()).toEqual('hi-en');
    expect(atls.getCurrentAudioLanguageDescription()).toBe('Hinglish');
    atls.clearCurrentAudioLanguageCode();
    expect(atls.getCurrentAudioLanguageDescription()).toBe(null);
  });
});
