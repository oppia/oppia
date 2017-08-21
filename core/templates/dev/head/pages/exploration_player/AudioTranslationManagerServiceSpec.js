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
 * @fileoverview Unit tests for the audio translation manager service.
 */

describe('Audio translation manager service', function() {
  beforeEach(module('oppia'));
  
  var atms;
  beforeEach(inject(function($injector) {
    atms = $injector.get('AudioTranslationManagerService');
  }));

  it('should properly initialize the current audio language when ' +
     'a preferred language is set', function() {
    var allAudioLanguageCodesInExploration = ['hi-en', 'en'];
    var preferredLanguageCode = 'hi-en';
    var explorationLanguageCode = 'hi';
    atms.init(allAudioLanguageCodesInExploration, preferredLanguageCode,
      explorationLanguageCode);
    expect(atms.getCurrentAudioLanguageCode()).toEqual('hi-en');
    atms.clearCurrentAudioLanguageCode();

    allAudioLanguageCodesInExploration = ['hi-en', 'en'];
    preferredLanguageCode = 'en';
    explorationLanguageCode = 'hi';
    atms.init(allAudioLanguageCodesInExploration, preferredLanguageCode,
      explorationLanguageCode);
    expect(atms.getCurrentAudioLanguageCode()).toEqual('en');
    atms.clearCurrentAudioLanguageCode();

    allAudioLanguageCodesInExploration = ['hi-en'];
    preferredLanguageCode = 'en';
    explorationLanguageCode = 'hi';
    atms.init(['hi-en'], preferredLanguageCode,
      explorationLanguageCode);
    expect(atms.getCurrentAudioLanguageCode()).toEqual('hi-en');
  });

  it('should initialize the current audio language when ' +
     'no preferred language is set and the exploration contains ' +
     'an audio language that is related to the exploration language',
    function() {
      var allAudioLanguageCodesInExploration = ['hi-en', 'en'];
      var preferredLanguageCode = null;
      var explorationLanguageCode = 'hi';
      atms.init(allAudioLanguageCodesInExploration, preferredLanguageCode,
        explorationLanguageCode);
      expect(atms.getCurrentAudioLanguageCode()).toEqual('hi-en');
    }
  );

  it('should initialize the current audio language to the most ' +
     'relevant language when multiple audio languages are related ' +
     'to the exploration language',
    function() {
      var allAudioLanguageCodesInExploration = ['hi-en', 'en'];
      var preferredLanguageCode = null;
      var explorationLanguageCode = 'en';
      atms.init(allAudioLanguageCodesInExploration, preferredLanguageCode,
        explorationLanguageCode);
      expect(atms.getCurrentAudioLanguageCode()).toEqual('en'); 
    }
  );
});
