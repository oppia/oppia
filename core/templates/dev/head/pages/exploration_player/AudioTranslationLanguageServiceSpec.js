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

describe('Audio translation language service', function() {
  beforeEach(module('oppia'));

  var atls;
  beforeEach(inject(function($injector) {
    atls = $injector.get('AudioTranslationLanguageService');
  }));

  it('should properly initialize the current audio language when ' +
     'a preferred language is set', function() {
    var allAudioLanguageCodesInExploration = ['hi-en', 'en'];
    var preferredLanguageCode = 'hi-en';
    var explorationLanguageCode = 'hi';
    atls.init(allAudioLanguageCodesInExploration, preferredLanguageCode,
      explorationLanguageCode);
    expect(atls.getCurrentAudioLanguageCode()).toEqual('hi-en');
    atls.clearCurrentAudioLanguageCode();

    allAudioLanguageCodesInExploration = ['hi-en', 'en'];
    preferredLanguageCode = 'en';
    explorationLanguageCode = 'hi';
    atls.init(allAudioLanguageCodesInExploration, preferredLanguageCode,
      explorationLanguageCode);
    expect(atls.getCurrentAudioLanguageCode()).toEqual('en');
    atls.clearCurrentAudioLanguageCode();

    allAudioLanguageCodesInExploration = ['hi-en'];
    preferredLanguageCode = 'en';
    explorationLanguageCode = 'hi';
    atls.init(['hi-en'], preferredLanguageCode,
      explorationLanguageCode);
    expect(atls.getCurrentAudioLanguageCode()).toEqual('hi-en');
  });

  it('should initialize the current audio language when ' +
     'no preferred language is set and the exploration contains ' +
     'an audio language that is related to the exploration language',
  function() {
    var allAudioLanguageCodesInExploration = ['hi-en', 'en'];
    var preferredLanguageCode = null;
    var explorationLanguageCode = 'hi';
    atls.init(allAudioLanguageCodesInExploration, preferredLanguageCode,
      explorationLanguageCode);
    expect(atls.getCurrentAudioLanguageCode()).toEqual('hi-en');
  });

  it('should initialize the current audio language to the most ' +
     'relevant language when multiple audio languages are related ' +
     'to the exploration language',
  function() {
    var allAudioLanguageCodesInExploration = ['hi-en', 'en'];
    var preferredLanguageCode = null;
    var explorationLanguageCode = 'en';
    atls.init(allAudioLanguageCodesInExploration, preferredLanguageCode,
      explorationLanguageCode);
    expect(atls.getCurrentAudioLanguageCode()).toEqual('en');
  });
});
