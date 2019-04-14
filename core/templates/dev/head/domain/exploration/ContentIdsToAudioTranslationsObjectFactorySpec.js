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
 * @fileoverview Unit tests for ContentIdsToAudioTranslations object factory.
 */

describe('ContentIdsToAudioTranslations object factory', function() {
  beforeEach(module('oppia', function($provide) {
    $provide.value('LanguageUtilService', {
      getAudioLanguagesCount: function() {
        return 2;
      }
    });
  }));

  describe('ContentIdsToAudioTranslationsObjectFactory', function() {
    var citatof = null;
    var atof = null;
    var citat = null;
    var citatDict = {
      content: {
        en: {
          filename: 'filename1.mp3',
          file_size_bytes: 100000,
          needs_update: false
        },
        hi: {
          filename: 'filename2.mp3',
          file_size_bytes: 11000,
          needs_update: false
        }
      },
      default_outcome: {
        en: {
          filename: 'filename3.mp3',
          file_size_bytes: 3000,
          needs_update: false
        },
        hi: {
          filename: 'filename4.mp3',
          file_size_bytes: 5000,
          needs_update: false
        }
      },
      feedback_1: {
        en: {
          filename: 'filename5.mp3',
          file_size_bytes: 2000,
          needs_update: false
        },
        hi: {
          filename: 'filename6.mp3',
          file_size_bytes: 9000,
          needs_update: false
        }
      },
      feedback_2: {
        en: {
          filename: 'filename7.mp3',
          file_size_bytes: 1000,
          needs_update: false
        },
        hi: {
          filename: 'filename8.mp3',
          file_size_bytes: 600,
          needs_update: false
        }
      },
      hint_1: {
        en: {
          filename: 'filename9.mp3',
          file_size_bytes: 104000,
          needs_update: false
        },
        hi: {
          filename: 'filename10.mp3',
          file_size_bytes: 1000,
          needs_update: true
        }
      },
      hint_2: {},
      solution: {
        en: {
          filename: 'filename13.mp3',
          file_size_bytes: 15080,
          needs_update: false
        },
        hi: {
          filename: 'filename14.mp3',
          file_size_bytes: 10500,
          needs_update: false
        }
      }
    };

    beforeEach(inject(function($injector) {
      citatof = $injector.get('ContentIdsToAudioTranslationsObjectFactory');
      atof = $injector.get('AudioTranslationObjectFactory');
      citat = citatof.createFromBackendDict(citatDict);
    }));

    it('should get all content id', function() {
      var contentIdList = [
        'content', 'default_outcome', 'feedback_1', 'feedback_2', 'hint_1',
        'hint_2', 'solution'];
      expect(citat.getAllContentId()).toEqual(contentIdList);
    });

    it('should correctly get all bindable audio translations', function() {
      expect(citat.getBindableAudioTranslations('content')).toEqual({
        en: atof.createFromBackendDict({
          filename: 'filename1.mp3',
          file_size_bytes: 100000,
          needs_update: false
        }),
        hi: atof.createFromBackendDict({
          filename: 'filename2.mp3',
          file_size_bytes: 11000,
          needs_update: false
        })
      });
    });

    it('should get correct audio translation', function() {
      expect(citat.getAudioTranslation('hint_1', 'en')).toEqual(
        atof.createFromBackendDict({
          filename: 'filename9.mp3',
          file_size_bytes: 104000,
          needs_update: false
        }));
    });

    it('should make all audio needs update for a give content id', function() {
      citat.markAllAudioAsNeedingUpdate('content');
      expect(citat.getBindableAudioTranslations('content')).toEqual({
        en: atof.createFromBackendDict({
          filename: 'filename1.mp3',
          file_size_bytes: 100000,
          needs_update: true
        }),
        hi: atof.createFromBackendDict({
          filename: 'filename2.mp3',
          file_size_bytes: 11000,
          needs_update: true
        })
      });
    });

    it('should get all language code for a given content id', function() {
      var LanguageCodeList = ['en', 'hi'];
      expect(citat.getAudioLanguageCodes('hint_1')).toEqual(LanguageCodeList);
    });

    it('should correctly check content id has audio translations', function() {
      expect(citat.hasAudioTranslations('content')).toBe(true);
      expect(citat.hasAudioTranslations('hint_2')).toBe(false);
    });

    it('should correctly check content id has unflagged audio translations',
      function() {
        expect(citat.hasUnflaggedAudioTranslations('content')).toBe(true);
        citat.markAllAudioAsNeedingUpdate('solution');
        expect(citat.hasUnflaggedAudioTranslations('solution')).toBe(false);
      });

    it('should add a given content id', function() {
      citat.addContentId('feedback_3');
      expect(citat.getBindableAudioTranslations('feedback_3')).toEqual({});
      expect(function() {
        citat.addContentId('content');
      }).toThrowError('Trying to add duplicate content id.');
    });

    it('should delete a given content id', function() {
      citat.deleteContentId('feedback_1');
      var contentIdList = [
        'content', 'default_outcome', 'feedback_2', 'hint_1', 'hint_2',
        'solution'];
      expect(citat.getAllContentId()).toEqual(contentIdList);
      expect(function() {
        citat.deleteContentId('feedback_3');
      }).toThrowError('Unable to find the given content id.');
    });

    it('should check whether the text is fully translated', inject(function() {
      expect(citat.isFullyTranslated('content')).toBe(true);
      citat.deleteAudioTranslation('content', 'hi');
      expect(citat.isFullyTranslated('content')).toBe(false);
      citat.deleteAudioTranslation('content', 'en');
      expect(citat.isFullyTranslated('content')).toBe(false);
      expect(function() {
        citat.deleteAudioTranslation('content', 'hi-en');
      }).toThrowError(
        'Trying to remove non-existing translation for ' +
        'language code hi-en');
    }));

    it('should add audio translation in a given content id', function() {
      citat.addAudioTranslation('hint_2', 'en', 'filename11.mp3', 1000);
      expect(citat.getBindableAudioTranslations('hint_2')).toEqual({
        en: atof.createFromBackendDict({
          filename: 'filename11.mp3',
          file_size_bytes: 1000,
          needs_update: false
        })
      });
      expect(function() {
        citat.addAudioTranslation('content', 'en', 'filename.mp3', 1000);
      }).toThrowError('Trying to add duplicate language code.');
    });

    it('should delete audio translation in a given content id', function() {
      citat.deleteAudioTranslation('content', 'hi');
      expect(citat.getBindableAudioTranslations('content')).toEqual({
        en: atof.createFromBackendDict({
          filename: 'filename1.mp3',
          file_size_bytes: 100000,
          needs_update: false
        })
      });
    });

    it(
      'should toggle needs update attribute in a given content id', function() {
        citat.toggleNeedsUpdateAttribute('content', 'hi');
        expect(citat.getAudioTranslation('content', 'hi')).toEqual(
          atof.createFromBackendDict({
            filename: 'filename2.mp3',
            file_size_bytes: 11000,
            needs_update: true
          }));
      });

    it('should correctly convert to backend dict', function() {
      expect(citat.toBackendDict()).toEqual(citatDict);
    });
  });
});
