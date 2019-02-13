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
              feedback_1: {},
              feedback_2: {}
            });
          audio.addAudioTranslation('content', 'en', 'test_audio_1_en.mp3',
            96426);
          audio.addAudioTranslation('feedback_2', 'en', 'test_audio_2_en',
            80000);
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
          audio.addAudioTranslation('content', 'en', 'test_audio_3_en.mp3',
            90000);
          return audio;
        } else {
          var audio = ContentIdsToAudioTranslationsObjectFactory.
            createFromBackendDict({});
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
      ess = $injector.get('ExplorationStatesService');
      ContentIdsToAudioTranslationsObjectFactory = $injector.get(
        'ContentIdsToAudioTranslationsObjectFactory');
      StateContentIdsToAudioTranslationsService = $injector.get(
        'StateContentIdsToAudioTranslationsService');

      // To call _computeAllStatesStatus() function of
      // TranslationStatusService.
      tss.getAllStateStatusColors();
    }));

    it('should get state names that need audio update correctly', function() {
      var statesNeedingAudioUpdate = tss.getAllStatesNeedUpdatewarning();
      expect(statesNeedingAudioUpdate.First.
        indexOf('Audio needs update!')).toBe(0);
      expect(statesNeedingAudioUpdate.Second).toBe(undefined);
      expect(statesNeedingAudioUpdate.Third).toBe(undefined);
    });

    it('should get count of required audio translations correctly',
      function() {
        var explorationAudioRequiredCount = tss.
          getExplorationAudioRequiredCount();
        expect(explorationAudioRequiredCount).toBe(8);
      });

    it('should get count of audio translations not available correctly',
      function() {
        var explorationAudioNotAvailableCount = tss.
          getExplorationAudioNotAvailableCount();
        expect(explorationAudioNotAvailableCount).toBe(5);
      });

    it('should get all state status colors correctly', function() {
      var stateWiseStatusColor = tss.getAllStateStatusColors();
      expect(stateWiseStatusColor.First).toBe('#E9B330');
      expect(stateWiseStatusColor.Second).toBe('#D14836');
      expect(stateWiseStatusColor.Third).toBe('#16A765');
    });

    it('should get active state component status color correctly', function() {
      StateContentIdsToAudioTranslationsService.init(
        'First', ess.getContentIdsToAudioTranslationsMemento('First'));
      var activeStateComponentStatus = tss.
        getActiveStateComponentStatusColor('content');
      expect(activeStateComponentStatus).toBe('#16A765');
      activeStateComponentStatus = tss.
        getActiveStateComponentStatusColor('feedback');
      expect(activeStateComponentStatus).toBe('#E9B330');
      StateContentIdsToAudioTranslationsService.init(
        'Second', ess.getContentIdsToAudioTranslationsMemento('Second'));
      activeStateComponentStatus = tss.
        getActiveStateComponentStatusColor('content');
      expect(activeStateComponentStatus).toBe('#D14836');
      activeStateComponentStatus = tss.
        getActiveStateComponentStatusColor('feedback');
      expect(activeStateComponentStatus).toBe('#D14836');
      StateContentIdsToAudioTranslationsService.init(
        'Third', ess.getContentIdsToAudioTranslationsMemento('Third'));
      activeStateComponentStatus = tss.
        getActiveStateComponentStatusColor('content');
      expect(activeStateComponentStatus).toBe('#16A765');
    });

    it('should get active state component needs update status correctly',function() {
      StateContentIdsToAudioTranslationsService.init(
        'First', ess.getContentIdsToAudioTranslationsMemento('First'));
      var activeStateComponentNeedsUpdateStatus = tss.
        getActiveStateComponentNeedsUpdateStatus('content');
      expect(activeStateComponentNeedsUpdateStatus).toBe(true);
      activeStateComponentNeedsUpdateStatus = tss.
      getActiveStateComponentNeedsUpdateStatus('feedback');
      expect(activeStateComponentNeedsUpdateStatus).toBe(false);
    });

    it('should get active state contentId status color correctly', function() {
      StateContentIdsToAudioTranslationsService.init(
        'First', ess.getContentIdsToAudioTranslationsMemento('First'));
      var activeStateContentIdStatusColor = tss.
        getActiveStateContentIdStatusColor('content');
      expect(activeStateContentIdStatusColor).toBe('#16A765');
      StateContentIdsToAudioTranslationsService.init(
        'Second', ess.getContentIdsToAudioTranslationsMemento('Second'));
      activeStateContentIdStatusColor = tss.
        getActiveStateContentIdStatusColor('content');
      expect(activeStateContentIdStatusColor).toBe('#D14836'); 
    });

    it('should get active state contentId needs update status', function() {
      StateContentIdsToAudioTranslationsService.init(
        'First', ess.getContentIdsToAudioTranslationsMemento('First'));
      var activeStateContentIdNeedsUpdateStatus = tss.
        getActiveStateContentIdNeedsUpdateStatus('content');
      expect(activeStateContentIdNeedsUpdateStatus).toBe(true);
      StateContentIdsToAudioTranslationsService.init(
        'Third', ess.getContentIdsToAudioTranslationsMemento('Third'));
      activeStateContentIdNeedsUpdateStatus = tss.
        getActiveStateContentIdNeedsUpdateStatus('content');
      expect(activeStateContentIdNeedsUpdateStatus).toBe(false);
    });
  });
});
