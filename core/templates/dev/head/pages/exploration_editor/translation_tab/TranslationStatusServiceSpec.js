// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit test for the Translation status service.
 */

describe('Translation status service', function() {
  beforeEach(module('oppia', function($provide) {
    $provide.value('TranslationLanguageService', {
      getActiveLanguageCode: function() {
        return ['en'];
      },
      availableTranslationLanguageCodes: ['en'],
      allContentId: ['content', 'default_outcome', 'feedback_1']
    });
    $provide.value('StateContentIdsToAudioTranslationsService', {
      displayed: {
        getAllContentId: function() {
          return ['content', 'default_outcome', 'feedback_1'];
        },
        getAudioTranslation: function(contentId, langCode) {
          if(contentId === 'content') {
            return {filename: 'test_audio_1_en.mp3',
            fileSizeBytes: 95426, needsUpdate: true};
          } else {
            return {};
          } 
        }
      }
    });
    $provide.value('ExplorationStatesService', {
      isInitialized: function() {
        return true;
      },
      getStateNames: function() {
        return ['First'];
      },
      getContentIdsToAudioTranslationsMemento: function(stateName) {
        if (stateName === 'First') {
          return ContentIdsToAudioTranslationsObjectFactory.
            createFromBackendDict({_contentIdsToAudioTranslations: {
              feedback_1: {},
              default_outcome: {},
              content: {en: {filename: 'test_audio_1_en.mp3',
                fileSizeBytes: 95426, needsUpdate: true}}}
            });
        }
      },
      getInteractionIdMemento: function(stateName) {
        if (stateName === 'First') {
          return 'MultipleChoiceInput';
        }
      }
    });
    $provide.constant('INTERACTION_SPECS', {
      MultipleChoiceInput: {
        is_linear: false,
        is_terminal: false
      }
    });
  }));

  describe('Translation status service', function() {
    var tss = null;
    beforeEach(inject(function($injector) {
      tss = $injector.get('TranslationStatusService');
      ContentIdsToAudioTranslationsObjectFactory = $injector.get(
        'ContentIdsToAudioTranslationsObjectFactory');
    }));

    it('should get state names that need audio update', function() {
      // To call _computeAllStatesStatus() function of TranslationStatusService.
      tss.getAllStateStatusColors();
    });
  });
});
