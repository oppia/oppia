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
      }
    });

    $provide.constant('INTERACTION_SPECS', {
      MultipleChoiceInput: {
        is_linear: false,
        is_terminal: false
      },
      EndExploration: {
        is_linear: true,
        is_terminal: true
      }
    });
  }));

  describe('Translation status service', function() {
    var ess = null;
    var scitats = null;
    var tss = null;
    var ALL_AUDIO_AVAILABLE_COLOR = '#16A765';
    var FEW_AUDIO_AVAILABLE_COLOR = '#E9B330';
    var NO_AUDIO_AVAILABLE_COLOR = '#D14836';
    var STATES = ['First', 'Second', 'Third'];
    var statesWithAudioDict = null;
    var mockExplorationData;

    beforeEach(function() {
      mockExplorationData = {
        explorationId: 0,
        autosaveChangeList: function() {},
        discardDraft: function() {}
      };
      module(function($provide) {
        $provide.value('ExplorationDataService', [mockExplorationData][0]);
      });
      spyOn(mockExplorationData, 'autosaveChangeList');
    });

    beforeEach(inject(function($injector) {
      tss = $injector.get('TranslationStatusService');
      ess = $injector.get('ExplorationStatesService');
      scitats = $injector.get(
        'StateContentIdsToAudioTranslationsService');

      statesWithAudioDict = {
        First: {
          content: {
            html: '<p>This is first card.</p>',
            content_id: 'content'
          },
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {},
              feedback_2: {},
              feedback_1: {}
            }
          },
          content_ids_to_audio_translations: {
            content: {},
            default_outcome: {},
            feedback_2: {
              en: {
                needs_update: false,
                filename: 'filename1.mp3',
                file_size_bytes: 43467
              }
            },
            feedback_1: {}
          },
          interaction: {
            answer_groups: [{
              tagged_misconception_id: null,
              outcome: {
                refresher_exploration_id: null,
                param_changes: [],
                labelled_as_correct: false,
                feedback: {
                  html: '<p>This is feedback1</p>',
                  content_id: 'feedback_1'
                },
                missing_prerequisite_skill_id: null,
                dest: 'Second'
              },
              rule_specs: [{
                inputs: {
                  x: 0
                },
                rule_type: 'Equals'
              }],
              training_data: []
            },
            {
              tagged_misconception_id: null,
              outcome: {
                refresher_exploration_id: null,
                param_changes: [],
                labelled_as_correct: false,
                feedback: {
                  html: '<p>This is feedback2</p>',
                  content_id: 'feedback_2'
                },
                missing_prerequisite_skill_id: null,
                dest: 'First'
              },
              rule_specs: [{
                inputs: {
                  x: 1
                },
                rule_type: 'Equals'
              }],
              training_data: []
            }],
            solution: null,
            hints: [],
            id: 'MultipleChoiceInput',
            customization_args: {
              choices: {
                value: ['<p>1</p>', '<p>2</p>']
              }
            },
            default_outcome: {
              refresher_exploration_id: null,
              param_changes: [],
              labelled_as_correct: false,
              feedback: {
                html: '',
                content_id: 'default_outcome'
              },
              missing_prerequisite_skill_id: null,
              dest: 'First'
            },
            confirmed_unclassified_answers: []
          },
          classifier_model_id: null,
          param_changes: []
        },
        Second: {
          content: {
            html: '<p>This is second card</p>',
            content_id: 'content'
          },
          written_translations: {
            translations_mapping: {
              content: {},
              default_outcome: {},
              feedback_1: {}
            }
          },
          content_ids_to_audio_translations: {
            content: {},
            default_outcome: {},
            feedback_1: {}
          },
          interaction: {
            answer_groups: [{
              tagged_misconception_id: null,
              outcome: {
                refresher_exploration_id: null,
                param_changes: [],
                labelled_as_correct: false,
                feedback: {
                  html: '',
                  content_id: 'feedback_1'
                },
                missing_prerequisite_skill_id: null,
                dest: 'Third'
              },
              rule_specs: [{
                inputs: {
                  x: 0
                },
                rule_type: 'Equals'
              }],
              training_data: []
            }],
            solution: null,
            hints: [],
            id: 'MultipleChoiceInput',
            customization_args: {
              choices: {
                value: ['<p>1</p>']
              }
            },
            default_outcome: {
              refresher_exploration_id: null,
              param_changes: [],
              labelled_as_correct: false,
              feedback: {
                html: '',
                content_id: 'default_outcome'
              },
              missing_prerequisite_skill_id: null,
              dest: 'Second'
            },
            confirmed_unclassified_answers: []
          },
          classifier_model_id: null,
          param_changes: []
        },
        Third: {
          content: {
            html: 'Congratulations, you have finished!',
            content_id: 'content'
          },
          written_translations: {
            translations_mapping: {
              content: {}
            }
          },
          content_ids_to_audio_translations: {
            content: {
              en: {
                needs_update: false,
                filename: 'content-en-s86jb5zajs.mp3',
                file_size_bytes: 38870
              }
            }
          },
          interaction: {
            answer_groups: [],
            solution: null,
            hints: [],
            id: 'EndExploration',
            customization_args: {
              recommendedExplorationIds: {
                value: []
              }
            },
            default_outcome: null,
            confirmed_unclassified_answers: []
          },
          classifier_model_id: null,
          param_changes: []
        }
      };
      ess.init(statesWithAudioDict);

      // To call the function _computeAllStatesStatus() of
      // TranslationStatusService, so that the status of all states is
      // computed for the other dependent functions to work.
      tss.getAllStateStatusColors();
    }));

    it('should return a correct list of state names for which ' +
      'audio needs update', function() {
      var statesNeedingAudioUpdate = tss.getAllStatesNeedUpdatewarning();
      // To check that initially no state contains audio that needs update.
      expect(Object.keys(statesNeedingAudioUpdate).length).toBe(0);
      scitats.init(STATES[0], ess.getContentIdsToAudioTranslationsMemento(
        STATES[0]));
      var value = scitats.displayed;
      value.toggleNeedsUpdateAttribute('feedback_2', 'en');
      scitats.saveDisplayedValue();
      ess.saveContentIdsToAudioTranslations(STATES[0], value);

      // To call the function _computeAllStatesStatus() of
      // TranslationStatusService, so that the status of all states is
      // computed for the dependent function "getAllStatesNeedUpdatewarning"
      // to work.
      tss.getAllStateStatusColors();
      statesNeedingAudioUpdate = tss.getAllStatesNeedUpdatewarning();
      // To check that "First" state contains audio that needs update.
      expect(Object.keys(statesNeedingAudioUpdate).length).toBe(1);
      expect(Object.keys(statesNeedingAudioUpdate)[0]).toBe(STATES[0]);
      expect(statesNeedingAudioUpdate.First.indexOf(
        'Audio needs update!')).toBe(0);
    });

    it('should return a correct count of audio translations required ' +
      'in an exploration', function() {
      var explorationAudioRequiredCount = (
        tss.getExplorationAudioRequiredCount());
      expect(explorationAudioRequiredCount).toBe(8);
      // To test changes after adding a new state.
      ess.addState('Fourth');
      ess.saveInteractionId(STATES[2], 'MultipleChoiceInput');
      ess.saveInteractionId('Fourth', 'EndExploration');
      // To call the function _computeAllStatesStatus() of
      // TranslationStatusService, so that the status of all states is
      // re-computed for the dependent function
      // "getExplorationAudioRequiredCount" to work.
      tss.getAllStateStatusColors();
      explorationAudioRequiredCount = (
        tss.getExplorationAudioRequiredCount());
      expect(explorationAudioRequiredCount).toBe(9);
    });

    it('should return a correct count of audio translations not available ' +
      'in an exploration', function() {
      var explorationAudioNotAvailableCount = tss
        .getExplorationAudioNotAvailableCount();
      expect(explorationAudioNotAvailableCount).toBe(6);
      ess.addState('Fourth');
      ess.saveInteractionId(STATES[2], 'MultipleChoiceInput');
      ess.saveInteractionId('Fourth', 'EndExploration');
      // To call the function _computeAllStatesStatus() of
      // TranslationStatusService, so that the status of all states is
      // re-computed for the dependent function
      // "getExplorationAudioNotAvailableCount" to work.
      tss.getAllStateStatusColors();
      explorationAudioNotAvailableCount = (
        tss.getExplorationAudioNotAvailableCount());
      expect(explorationAudioNotAvailableCount).toBe(7);
    });

    it('should correctly return an object contaning status colors of all ' +
      'states in the exploration', function() {
      var stateWiseStatusColor = tss.getAllStateStatusColors();
      expect(stateWiseStatusColor[STATES[0]]).toBe(
        FEW_AUDIO_AVAILABLE_COLOR);
      expect(stateWiseStatusColor[STATES[1]]).toBe(
        NO_AUDIO_AVAILABLE_COLOR);
      expect(stateWiseStatusColor[STATES[2]]).toBe(
        ALL_AUDIO_AVAILABLE_COLOR);
      scitats.init(STATES[1], ess.getContentIdsToAudioTranslationsMemento(
        STATES[1]));
      var value = scitats.displayed;
      value.addAudioTranslation('content', 'en', 'file.mp3', 1000);
      scitats.saveDisplayedValue();
      ess.saveContentIdsToAudioTranslations(STATES[1], value);
      stateWiseStatusColor = tss.getAllStateStatusColors();
      expect(stateWiseStatusColor[STATES[1]]).toBe(
        FEW_AUDIO_AVAILABLE_COLOR);
    });

    it('should return correct status color for active state', function() {
      scitats.init(STATES[0], ess.getContentIdsToAudioTranslationsMemento(
        STATES[0]));
      var activeStateComponentStatus = tss
        .getActiveStateComponentStatusColor('content');
      expect(activeStateComponentStatus).toBe(NO_AUDIO_AVAILABLE_COLOR);
      activeStateComponentStatus = tss
        .getActiveStateComponentStatusColor('feedback');
      expect(activeStateComponentStatus).toBe(FEW_AUDIO_AVAILABLE_COLOR);
      // To test changes after adding an audio translation to "content"
      // in the first state.
      scitats.displayed.addAudioTranslation('content', 'en', 'file.mp3', 1000);
      scitats.saveDisplayedValue();
      var value = scitats.displayed;
      ess.saveContentIdsToAudioTranslations(STATES[0], value);
      activeStateComponentStatus = tss
        .getActiveStateComponentStatusColor('content');
      expect(activeStateComponentStatus).toBe(ALL_AUDIO_AVAILABLE_COLOR);
      scitats.init(STATES[1], ess.getContentIdsToAudioTranslationsMemento(
        STATES[1]));
      activeStateComponentStatus = tss
        .getActiveStateComponentStatusColor('content');
      expect(activeStateComponentStatus).toBe(NO_AUDIO_AVAILABLE_COLOR);
      activeStateComponentStatus = tss
        .getActiveStateComponentStatusColor('feedback');
      expect(activeStateComponentStatus).toBe(NO_AUDIO_AVAILABLE_COLOR);
      scitats.init(STATES[2], ess.getContentIdsToAudioTranslationsMemento(
        STATES[2]));
      activeStateComponentStatus = tss
        .getActiveStateComponentStatusColor('content');
      expect(activeStateComponentStatus).toBe(ALL_AUDIO_AVAILABLE_COLOR);
    });

    it('should correctly return whether audio translation(s) of ' +
      'active state component needs update', function() {
      var activeStateComponentNeedsUpdateStatus = tss
        .getActiveStateComponentNeedsUpdateStatus('feedback');
      // To check that initially the state component "feedback" does not
      // contain audio that needs update.
      expect(activeStateComponentNeedsUpdateStatus).toBe(false);
      scitats.init(STATES[0], ess.getContentIdsToAudioTranslationsMemento(
        STATES[0]));
      var value = scitats.displayed;
      // To test changes after changing "needs update" status of an audio.
      value.toggleNeedsUpdateAttribute('feedback_2', 'en');
      scitats.saveDisplayedValue();
      ess.saveContentIdsToAudioTranslations(STATES[0], value);
      activeStateComponentNeedsUpdateStatus = tss
        .getActiveStateComponentNeedsUpdateStatus('feedback');
      // To check that the state component "feedback" contains audio that
      // needs update.
      expect(activeStateComponentNeedsUpdateStatus).toBe(true);
    });

    it('should return correct status color of a contentId of active state',
      function() {
        scitats.init(STATES[0], ess.getContentIdsToAudioTranslationsMemento(
          STATES[0]));
        var activeStateContentIdStatusColor = tss
          .getActiveStateContentIdStatusColor('content');
        expect(activeStateContentIdStatusColor).toBe(NO_AUDIO_AVAILABLE_COLOR);
        activeStateContentIdStatusColor = tss
          .getActiveStateContentIdStatusColor('feedback_1');
        expect(activeStateContentIdStatusColor).toBe(NO_AUDIO_AVAILABLE_COLOR);
        activeStateContentIdStatusColor = tss
          .getActiveStateContentIdStatusColor('feedback_2');
        expect(activeStateContentIdStatusColor).toBe(ALL_AUDIO_AVAILABLE_COLOR);
        var value = scitats.displayed;
        // To test changes after adding an audio translation to "content"
        // in the first state.
        value.addAudioTranslation('content', 'en', 'file.mp3', 1000);
        scitats.saveDisplayedValue();
        ess.saveContentIdsToAudioTranslations(STATES[0], value);
        activeStateContentIdStatusColor = tss
          .getActiveStateContentIdStatusColor('content');
        expect(activeStateContentIdStatusColor).toBe(ALL_AUDIO_AVAILABLE_COLOR);
        scitats.init(STATES[1], ess.getContentIdsToAudioTranslationsMemento(
          STATES[1]));
        activeStateContentIdStatusColor = tss
          .getActiveStateContentIdStatusColor('content');
        expect(activeStateContentIdStatusColor).toBe(NO_AUDIO_AVAILABLE_COLOR);
        activeStateContentIdStatusColor = tss
          .getActiveStateContentIdStatusColor('feedback_1');
        expect(activeStateContentIdStatusColor).toBe(NO_AUDIO_AVAILABLE_COLOR);
        scitats.init(STATES[2], ess.getContentIdsToAudioTranslationsMemento(
          STATES[2]));
        activeStateContentIdStatusColor = tss
          .getActiveStateContentIdStatusColor('content');
        expect(activeStateContentIdStatusColor).toBe(ALL_AUDIO_AVAILABLE_COLOR);
      });

    it('should return whether audio translation(s) of active ' +
      'state contentId needs update status', function() {
      scitats.init(STATES[0], ess.getContentIdsToAudioTranslationsMemento(
        STATES[0]));
      var activeStateContentIdNeedsUpdateStatus = tss
        .getActiveStateContentIdNeedsUpdateStatus('feedback_2');
      // To check that initially the state content id "feedback" does not
      // contain audio that needs update.
      expect(activeStateContentIdNeedsUpdateStatus).toBe(false);
      var value = scitats.displayed;
      value.toggleNeedsUpdateAttribute('feedback_2', 'en');
      scitats.saveDisplayedValue();
      ess.saveContentIdsToAudioTranslations(STATES[0], value);
      activeStateContentIdNeedsUpdateStatus = tss
        .getActiveStateContentIdNeedsUpdateStatus('feedback_2');
      // To check that the state content id "feedback" contains audio that
      // needs update.
      expect(activeStateContentIdNeedsUpdateStatus).toBe(true);
    });
  });
});
