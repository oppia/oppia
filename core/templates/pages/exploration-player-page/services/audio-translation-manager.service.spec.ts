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

import { TestBed } from '@angular/core/testing';

import { AudioTranslationManagerService, AudioTranslations } from
  'pages/exploration-player-page/services/audio-translation-manager.service';
import { VoiceoverObjectFactory } from
  'domain/exploration/VoiceoverObjectFactory';

describe('Audio translation manager service', () => {
  let atms: AudioTranslationManagerService, vof: VoiceoverObjectFactory;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AudioTranslationManagerService, VoiceoverObjectFactory]
    });

    atms = TestBed.get(AudioTranslationManagerService);
    vof = TestBed.get(VoiceoverObjectFactory);
  });

  var testAudioTranslations: AudioTranslations;
  var testAudioTranslations2: AudioTranslations;
  beforeEach(() => {
    testAudioTranslations = {
      en: vof.createFromBackendDict({
        filename: 'audio-en.mp3',
        file_size_bytes: 0.5,
        needs_update: false,
        duration_secs: 0.5
      }),
      es: vof.createFromBackendDict({
        filename: 'audio-es.mp3',
        file_size_bytes: 0.5,
        needs_update: false,
        duration_secs: 0.5
      })
    };

    testAudioTranslations2 = {
      zh: vof.createFromBackendDict({
        filename: 'audio-zh.mp3',
        file_size_bytes: 0.5,
        needs_update: false,
        duration_secs: 0.5
      }),
      'hi-en': vof.createFromBackendDict({
        filename: 'audio-hi-en.mp3',
        file_size_bytes: 0.5,
        needs_update: false,
        duration_secs: 0.5
      })
    };
  });

  it('should properly set primary and secondary audio translations',
    () => {
      atms.setContentAudioTranslations(testAudioTranslations, '', '');
      expect(atms.getCurrentAudioTranslations()).toEqual({
        en: vof.createFromBackendDict({
          filename: 'audio-en.mp3',
          file_size_bytes: 0.5,
          needs_update: false,
          duration_secs: 0.5
        }),
        es: vof.createFromBackendDict({
          filename: 'audio-es.mp3',
          file_size_bytes: 0.5,
          needs_update: false,
          duration_secs: 0.5
        })
      });
      atms.setSecondaryAudioTranslations(testAudioTranslations2, '', '');
      expect(atms.getCurrentAudioTranslations()).toEqual({
        zh: vof.createFromBackendDict({
          filename: 'audio-zh.mp3',
          file_size_bytes: 0.5,
          needs_update: false,
          duration_secs: 0.5
        }),
        'hi-en': vof.createFromBackendDict({
          filename: 'audio-hi-en.mp3',
          file_size_bytes: 0.5,
          needs_update: false,
          duration_secs: 0.5
        })
      });
      atms.clearSecondaryAudioTranslations();
      expect(atms.getCurrentAudioTranslations()).toEqual({
        en: vof.createFromBackendDict({
          filename: 'audio-en.mp3',
          file_size_bytes: 0.5,
          needs_update: false,
          duration_secs: 0.5
        }),
        es: vof.createFromBackendDict({
          filename: 'audio-es.mp3',
          file_size_bytes: 0.5,
          needs_update: false,
          duration_secs: 0.5
        })
      });
    });
});
