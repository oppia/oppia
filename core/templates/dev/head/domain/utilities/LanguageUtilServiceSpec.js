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
 * @fileoverview Unit tests for LanguageUtilService
 */

describe('Language util service', function() {
  var lus = null;

  beforeEach(function() {
    module('oppia', function($provide) {
      var mockSupportedAudioLanguages = [{
        id: 'en',
        description: 'English',
        related_languages: ['en']
      }, {
        id: 'hi-en',
        description: 'Hinglish',
        related_languages: ['hi', 'en']
      }, {
        id: 'es',
        description: 'Spanish',
        related_languages: ['es']
      }];
      $provide.constant('SUPPORTED_AUDIO_LANGUAGES',
        mockSupportedAudioLanguages);
    });
  });

  beforeEach(inject(function($injector) {
    lus = $injector.get('LanguageUtilService');
  }));

  it('should get the correct language count', function() {
    expect(lus.getAudioLanguagesCount()).toEqual(3);
  });

  it('should get the correct description given an audio language code',
    function() {
      expect(lus.getAudioLanguageDescription('en')).toEqual('English');
      expect(lus.getAudioLanguageDescription('hi-en')).toEqual('Hinglish');
      expect(lus.getAudioLanguageDescription('es')).toEqual('Spanish');
    }
  );

  it('should correctly compute the complement languages', function() {
    expect(lus.getComplementAudioLanguageCodes([]))
      .toEqual(['en', 'hi-en', 'es']);
    expect(lus.getComplementAudioLanguageCodes(['en']))
      .toEqual(['hi-en', 'es']);
    expect(lus.getComplementAudioLanguageCodes(['hi-en']))
      .toEqual(['en', 'es']);
    expect(lus.getComplementAudioLanguageCodes(['hi-en', 'en']))
      .toEqual(['es']);
    expect(lus.getComplementAudioLanguageCodes(['abcdefg'])).toEqual([
      'en', 'hi-en', 'es']);
  });
});
