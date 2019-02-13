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
        return 'en';
      },
      availableTranslationLanguageCodes: ['en']
    });
    $provide.value('ExplorationStatesService', {
      isInitialized: function() {
        return true;
      },
      getStateNames: function() {
        return ['First', 'Second', 'Third'];
      },
      getContentIdsToAudioTranslationsMemento: function(stateName) {
        if (stateName === 'First') {
          var audio = ContentIdsToAudioTranslationsObjectFactory.
            createFromBackendDict({
              content: {},
              default_outcome: {},
              feedback_1: {}
            });
            audio.addAudioTranslation('content', 'en', 'test_audio_1_en.mp3',
              96426);
            audio.toggleNeedsUpdateAttribute('content', 'en');
            return audio;
        } else if (stateName === 'Second') {
          var audio = ContentIdsToAudioTranslationsObjectFactory.
            createFromBackendDict({
              content: {},
              default_outcome: {},
              feedback_1: {}
            });
          return audio;
        } else if (stateName === 'Third') {
          var audio = ContentIdsToAudioTranslationsObjectFactory.
            createFromBackendDict({
              content: {}
            });
            audio.addAudioTranslation('content', 'en', 'test_audio_2_en.mp3',
              90000);
            return audio;
        }
      },
      getInteractionIdMemento: function(stateName) {
        if (stateName === 'First' || stateName === 'Second') {
          return 'MultipleChoiceInput';
        } else if (stateName === 'Third') {
          return 'EndExploration';
        }
      }
    });
    $provide.constant('INTERACTION_SPECS', {
      MultipleChoiceInput: {
        is_linear: false,
        is_terminal: false
      },
      EndExploration: {
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

    it('should get state names that need audio update correctly', function() {
      // To call _computeAllStatesStatus() function of TranslationStatusService.
      tss.getAllStateStatusColors();

      var statesNeedingAudioUpdate = tss.getAllStatesNeedUpdatewarning();
      expect(statesNeedingAudioUpdate['First'].
        indexOf('Audio needs update!')).toBe(0);
      expect(statesNeedingAudioUpdate['Second']).toBe(undefined);
      expect(statesNeedingAudioUpdate['Third']).toBe(undefined);
    });

    it('should get count of required audio translations correctly',
      function() {
      // To call _computeAllStatesStatus() function of TranslationStatusService.
      tss.getAllStateStatusColors();

      var explorationAudioRequiredCount = tss.
      getExplorationAudioRequiredCount();
      expect(explorationAudioRequiredCount).toBe(7);
    });

    it('should get count of audio translations not available correctly',
      function() {
      // To call _computeAllStatesStatus() function of TranslationStatusService.
      tss.getAllStateStatusColors();

      var explorationAudioNotAvailableCount = tss.
      getExplorationAudioNotAvailableCount();
      expect(explorationAudioNotAvailableCount).toBe(5);
    });

    it('should get all state status colors correctly', function() {
      var stateWiseStatusColor = tss.getAllStateStatusColors();
      expect(stateWiseStatusColor['First']).toBe('#E9B330');
      expect(stateWiseStatusColor['Second']).toBe('#D14836');
      expect(stateWiseStatusColor['Third']).toBe('#16A765');
    });
  });
});
