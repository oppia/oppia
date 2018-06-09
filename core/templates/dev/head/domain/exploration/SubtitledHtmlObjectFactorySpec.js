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
 * @fileoverview Unit tests for the SubtitledHtml object factory.
 */

describe('SubtitledHtml object factory', function() {
  beforeEach(module('oppia', function($provide) {
    $provide.value('LanguageUtilService', {
      getAudioLanguagesCount: function() {
        return 2;
      }
    });
  }));

  describe('SubtitledHtmlObjectFactory', function() {
    var scope, shof, lus, subtitledHtml;

    beforeEach(inject(function($injector, $rootScope) {
      scope = $rootScope.$new();
      shof = $injector.get('SubtitledHtmlObjectFactory');

      subtitledHtml = shof.createFromBackendDict({
        html: '<p>some html</p>',
        audio_translations: {
          en: {
            filename: 'a.mp3',
            file_size_bytes: 20,
            needs_update: false
          },
          hi: {
            filename: 'b.mp3',
            file_size_bytes: 30,
            needs_update: false
          }
        }
      });
    }));

    it('should get and set HTML correctly', inject(function() {
      expect(subtitledHtml.getHtml()).toEqual('<p>some html</p>');
      subtitledHtml.setHtml('new html');
      expect(subtitledHtml.getHtml()).toEqual('new html');
    }));

    it('should correctly check existence of HTML', inject(function() {
      expect(subtitledHtml.hasNoHtml()).toBe(false);
      subtitledHtml.setHtml('');
      expect(subtitledHtml.hasNoHtml()).toBe(true);
    }));

    it('should mark all audio as needing update', inject(function() {
      expect(subtitledHtml.getAudioTranslation('en').needsUpdate).toBe(false);
      expect(subtitledHtml.getAudioTranslation('hi').needsUpdate).toBe(false);
      subtitledHtml.markAllAudioAsNeedingUpdate();
      expect(subtitledHtml.getAudioTranslation('en').needsUpdate).toBe(true);
      expect(subtitledHtml.getAudioTranslation('hi').needsUpdate).toBe(true);
    }));

    it('should get all audio language codes', inject(function() {
      expect(subtitledHtml.getAudioLanguageCodes()).toEqual(['en', 'hi']);
    }));

    it('should check existence of audio translations', inject(function() {
      expect(subtitledHtml.hasAudioTranslations()).toBe(true);
      subtitledHtml.deleteAudioTranslation('en');
      expect(subtitledHtml.hasAudioTranslations()).toBe(true);
      subtitledHtml.deleteAudioTranslation('hi');
      expect(subtitledHtml.hasAudioTranslations()).toBe(false);
    }));

    it('should check existence of unflagged audio translations',
      inject(function() {
        expect(subtitledHtml.hasUnflaggedAudioTranslations()).toBe(true);
        subtitledHtml.getAudioTranslation('en').needsUpdate = true;
        expect(subtitledHtml.hasUnflaggedAudioTranslations()).toBe(true);
        subtitledHtml.getAudioTranslation('hi').needsUpdate = true;
        expect(subtitledHtml.hasUnflaggedAudioTranslations()).toBe(false);

        subtitledHtml.deleteAudioTranslation('en');
        subtitledHtml.deleteAudioTranslation('hi');
        expect(subtitledHtml.hasUnflaggedAudioTranslations()).toBe(false);
      }));

    it('should check whether the text is fully translated', inject(function() {
      expect(subtitledHtml.isFullyTranslated()).toBe(true);
      subtitledHtml.deleteAudioTranslation('en');
      expect(subtitledHtml.isFullyTranslated()).toBe(false);
      subtitledHtml.deleteAudioTranslation('hi');
      expect(subtitledHtml.isFullyTranslated()).toBe(false);
    }));

    it('should add an audio translation', inject(function() {
      expect(function() {
        subtitledHtml.addAudioTranslation('en', 'c.mp3', 300);
      }).toThrowError('Trying to add duplicate language code.');
      subtitledHtml.deleteAudioTranslation('en');
      expect(subtitledHtml.getAudioLanguageCodes()).toEqual(['hi']);
      subtitledHtml.addAudioTranslation('en', 'c.mp3', 300);
      expect(subtitledHtml.getAudioLanguageCodes()).toEqual(['hi', 'en']);
    }));

    it('should delete an audio translation', inject(function() {
      expect(subtitledHtml.hasAudioTranslations()).toBe(true);
      subtitledHtml.deleteAudioTranslation('en');
      subtitledHtml.deleteAudioTranslation('hi');
      expect(subtitledHtml.hasAudioTranslations()).toBe(false);
      expect(function() {
        subtitledHtml.deleteAudioTranslation('en');
      }).toThrowError(
        'Trying to remove non-existing translation for language code en');
    }));

    it('should toggle needs-update attribute', inject(function() {
      expect(subtitledHtml.getAudioTranslation('en').needsUpdate).toBe(false);
      subtitledHtml.toggleNeedsUpdateAttribute('en');
      expect(subtitledHtml.getAudioTranslation('en').needsUpdate).toBe(true);
    }));

    it('should correctly check emptiness', inject(function() {
      expect(subtitledHtml.isEmpty()).toBe(false);

      // If there are translations but no content, it is not empty.
      subtitledHtml.setHtml('');
      expect(subtitledHtml.isEmpty()).toBe(false);

      // If there is content but no translations, it is not empty.
      subtitledHtml.setHtml('hello');
      subtitledHtml.deleteAudioTranslation('en');
      subtitledHtml.deleteAudioTranslation('hi');
      expect(subtitledHtml.isEmpty()).toBe(false);

      // If both content and translations are empty, the whole thing is empty.
      subtitledHtml.setHtml('');
      expect(subtitledHtml.isEmpty()).toBe(true);
    }));

    it('should convert to backend dict correctly', inject(function() {
      expect(subtitledHtml.toBackendDict()).toEqual({
        html: '<p>some html</p>',
        audio_translations: {
          en: {
            filename: 'a.mp3',
            file_size_bytes: 20,
            needs_update: false
          },
          hi: {
            filename: 'b.mp3',
            file_size_bytes: 30,
            needs_update: false
          }
        }
      });
    }));

    it('should create default object', inject(function() {
      var defaultSubtitledHtml = shof.createDefault('test html');
      expect(defaultSubtitledHtml.getHtml()).toEqual('test html');
      expect(defaultSubtitledHtml.getBindableAudioTranslations()).toEqual({});
    }));

    describe('.createSampleBackendDict', function() {
      it('is accepted by .createFromBackendDict', function() {
        var sampleBackendDict = shof.createSampleBackendDict();

        var that = this;
        expect(function() {
          shof.createFromBackendDict(sampleBackendDict);
        }).not.toThrow();
      });
    })
  });
});
