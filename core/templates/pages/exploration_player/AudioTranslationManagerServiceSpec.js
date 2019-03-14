// Copyright 2018 The Oppia Authors. All Rights Reserved.
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

  var atms, atof;
  var testAudioTranslations;
  var testAudioTranslations2;
  beforeEach(inject(function($injector) {
    atms = $injector.get('AudioTranslationManagerService');
    atof = $injector.get('AudioTranslationObjectFactory');

    testAudioTranslations = {
      en: atof.createFromBackendDict({
        filename: 'audio-en.mp3',
        file_size_bytes: 0.5,
        needs_update: false
      }),
      es: atof.createFromBackendDict({
        filename: 'audio-es.mp3',
        file_size_bytes: 0.5,
        needs_update: false
      })
    };

    testAudioTranslations2 = {
      zh: atof.createFromBackendDict({
        filename: 'audio-zh.mp3',
        file_size_bytes: 0.5,
        needs_update: false
      }),
      'hi-en': atof.createFromBackendDict({
        filename: 'audio-hi-en.mp3',
        file_size_bytes: 0.5,
        needs_update: false
      })
    };
  }));

  it('should properly set primary and secondary audio translations',
    function() {
      atms.setContentAudioTranslations(testAudioTranslations);
      expect(atms.getCurrentAudioTranslations()).toEqual({
        en: atof.createFromBackendDict({
          filename: 'audio-en.mp3',
          file_size_bytes: 0.5,
          needs_update: false
        }),
        es: atof.createFromBackendDict({
          filename: 'audio-es.mp3',
          file_size_bytes: 0.5,
          needs_update: false
        })
      });
      atms.setSecondaryAudioTranslations(testAudioTranslations2);
      expect(atms.getCurrentAudioTranslations()).toEqual({
        zh: atof.createFromBackendDict({
          filename: 'audio-zh.mp3',
          file_size_bytes: 0.5,
          needs_update: false
        }),
        'hi-en': atof.createFromBackendDict({
          filename: 'audio-hi-en.mp3',
          file_size_bytes: 0.5,
          needs_update: false
        })
      });
      atms.clearSecondaryAudioTranslations();
      expect(atms.getCurrentAudioTranslations()).toEqual({
        en: atof.createFromBackendDict({
          filename: 'audio-en.mp3',
          file_size_bytes: 0.5,
          needs_update: false
        }),
        es: atof.createFromBackendDict({
          filename: 'audio-es.mp3',
          file_size_bytes: 0.5,
          needs_update: false
        })
      });
    });
});
