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

// TODO(#7222): Remove the following block of unnnecessary imports once
// translation-status.service.ts is upgraded to Angular 8.
import { AngularNameService } from
  'pages/exploration-editor-page/services/angular-name.service';
import { AnswerClassificationResultObjectFactory } from
  'domain/classifier/AnswerClassificationResultObjectFactory';
import { AnswerGroupObjectFactory } from
  'domain/exploration/AnswerGroupObjectFactory';
import { ClassifierObjectFactory } from
  'domain/classifier/ClassifierObjectFactory';
import { ExplorationDraftObjectFactory } from
  'domain/exploration/ExplorationDraftObjectFactory';
import { FractionObjectFactory } from 'domain/objects/FractionObjectFactory';
import { HintObjectFactory } from 'domain/exploration/HintObjectFactory';
import { OutcomeObjectFactory } from
  'domain/exploration/OutcomeObjectFactory';
import { ParamChangeObjectFactory } from
  'domain/exploration/ParamChangeObjectFactory';
import { ParamChangesObjectFactory } from
  'domain/exploration/ParamChangesObjectFactory';
import { RecordedVoiceoversObjectFactory } from
  'domain/exploration/RecordedVoiceoversObjectFactory';
import { RuleObjectFactory } from 'domain/exploration/RuleObjectFactory';
/* eslint-disable max-len */
import { SolutionValidityService } from
  'pages/exploration-editor-page/editor-tab/services/solution-validity.service';
/* eslint-enable max-len */
import { StateClassifierMappingService } from
  'pages/exploration-player-page/services/state-classifier-mapping.service';
/* eslint-disable max-len */
import { StateEditorService } from
  'components/state-editor/state-editor-properties-services/state-editor.service';
/* eslint-enable max-len */
import { SubtitledHtmlObjectFactory } from
  'domain/exploration/SubtitledHtmlObjectFactory';
import { UnitsObjectFactory } from 'domain/objects/UnitsObjectFactory';
import { VoiceoverObjectFactory } from
  'domain/exploration/VoiceoverObjectFactory';
import { WrittenTranslationObjectFactory } from
  'domain/exploration/WrittenTranslationObjectFactory';
import { WrittenTranslationsObjectFactory } from
  'domain/exploration/WrittenTranslationsObjectFactory';
// ^^^ This block is to be removed.

require('pages/exploration-editor-page/services/exploration-states.service.ts');
require(
  'pages/exploration-editor-page/translation-tab/services/' +
  'translation-language.service.ts');
require(
  'pages/exploration-editor-page/translation-tab/services/' +
  'translation-status.service.ts');
require(
  'pages/exploration-editor-page/translation-tab/services/' +
  'translation-tab-active-mode.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-written-translations.service.ts');

describe('Translation status service', function() {
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('LanguageUtilService', {
      getAllVoiceoverLanguageCodes: function() {
        return ['en', 'hi'];
      }
    });
    $provide.value('AngularNameService', new AngularNameService());
    $provide.value(
      'AnswerClassificationResultObjectFactory',
      new AnswerClassificationResultObjectFactory());
    $provide.value(
      'AnswerGroupObjectFactory', new AnswerGroupObjectFactory(
        new OutcomeObjectFactory(new SubtitledHtmlObjectFactory()),
        new RuleObjectFactory()));
    $provide.value('ClassifierObjectFactory', new ClassifierObjectFactory());
    $provide.value(
      'ExplorationDraftObjectFactory', new ExplorationDraftObjectFactory());
    $provide.value('FractionObjectFactory', new FractionObjectFactory());
    $provide.value(
      'HintObjectFactory', new HintObjectFactory(
        new SubtitledHtmlObjectFactory()));
    $provide.value(
      'OutcomeObjectFactory', new OutcomeObjectFactory(
        new SubtitledHtmlObjectFactory()));
    $provide.value('ParamChangeObjectFactory', new ParamChangeObjectFactory());
    $provide.value(
      'ParamChangesObjectFactory', new ParamChangesObjectFactory(
        new ParamChangeObjectFactory()));
    $provide.value(
      'RecordedVoiceoversObjectFactory',
      new RecordedVoiceoversObjectFactory(new VoiceoverObjectFactory()));
    $provide.value('RuleObjectFactory', new RuleObjectFactory());
    $provide.value('SolutionValidityService', new SolutionValidityService());
    $provide.value(
      'StateClassifierMappingService', new StateClassifierMappingService(
        new ClassifierObjectFactory()));
    $provide.value(
      'StateEditorService', new StateEditorService(
        new SolutionValidityService()));
    $provide.value(
      'SubtitledHtmlObjectFactory', new SubtitledHtmlObjectFactory());
    $provide.value('UnitsObjectFactory', new UnitsObjectFactory());
    $provide.value('VoiceoverObjectFactory', new VoiceoverObjectFactory());
    $provide.value(
      'WrittenTranslationObjectFactory',
      new WrittenTranslationObjectFactory());
    $provide.value(
      'WrittenTranslationsObjectFactory',
      new WrittenTranslationsObjectFactory(
        new WrittenTranslationObjectFactory()));
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
    var srvs = null;
    var swts = null;
    var tss = null;
    var ttams = null;
    var tls = null;
    var ALL_ASSETS_AVAILABLE_COLOR = '#16A765';
    var FEW_ASSETS_AVAILABLE_COLOR = '#E9B330';
    var NO_ASSETS_AVAILABLE_COLOR = '#D14836';
    var statesWithAudioDict = null;
    var mockExplorationData;

    beforeEach(function() {
      mockExplorationData = {
        explorationId: 0,
        autosaveChangeList: function() {},
        discardDraft: function() {}
      };
      angular.mock.module(function($provide) {
        $provide.value('ExplorationDataService', [mockExplorationData][0]);
      });
      spyOn(mockExplorationData, 'autosaveChangeList');
    });

    beforeEach(angular.mock.inject(function($injector) {
      tss = $injector.get('TranslationStatusService');
      ess = $injector.get('ExplorationStatesService');
      ttams = $injector.get('TranslationTabActiveModeService');
      tls = $injector.get('TranslationLanguageService');
      srvs = $injector.get('StateRecordedVoiceoversService');
      swts = $injector.get('StateWrittenTranslationsService');

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
              feedback_2: {
                hi: {
                  html: '<p>This is feedback 1.</p>',
                  needs_update: false
                }
              },
              feedback_1: {
                hi: {
                  html: '<p>This is first card.</p>',
                  needs_update: false
                }
              }
            }
          },
          recorded_voiceovers: {
            voiceovers_mapping: {
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
            }
          },
          interaction: {
            answer_groups: [{
              tagged_skill_misconception_id: null,
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
              tagged_skill_misconception_id: null,
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
          solicit_answer_details: false,
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
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {},
              default_outcome: {},
              feedback_1: {}
            }
          },
          interaction: {
            answer_groups: [{
              tagged_skill_misconception_id: null,
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
          solicit_answer_details: false,
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
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {
                en: {
                  needs_update: false,
                  filename: 'content-en-s86jb5zajs.mp3',
                  file_size_bytes: 38870
                }
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
          solicit_answer_details: false,
          classifier_model_id: null,
          param_changes: []
        }
      };
      ess.init(statesWithAudioDict);
      ttams.activateVoiceoverMode();
      tls.setActiveLanguageCode('en');
      tss.refresh();
    }));

    it('should return a correct list of state names for which audio needs ' +
      'update', function() {
      ttams.activateVoiceoverMode();
      var statesNeedingAudioUpdate = tss.getAllStatesNeedUpdatewarning();
      // To check that initially no state contains audio that needs update.
      expect(Object.keys(statesNeedingAudioUpdate).length).toBe(0);
      srvs.init('First', ess.getRecordedVoiceoversMemento('First'));
      var value = srvs.displayed;
      value.toggleNeedsUpdateAttribute('feedback_2', 'en');
      srvs.saveDisplayedValue();
      ess.saveRecordedVoiceovers('First', value);
      tss.refresh();

      statesNeedingAudioUpdate = tss.getAllStatesNeedUpdatewarning();
      // To check that "First" state contains audio that needs update.
      expect(Object.keys(statesNeedingAudioUpdate).length).toBe(1);
      expect(Object.keys(statesNeedingAudioUpdate)[0]).toBe('First');
      expect(statesNeedingAudioUpdate.First.indexOf(
        'Audio needs update!')).toBe(0);
    });

    it('should return a correct list of state names for which translation ' +
      'needs update', function() {
      ttams.activateTranslationMode();
      tls.setActiveLanguageCode('hi');
      var statesNeedingTranslationUpdate = tss.getAllStatesNeedUpdatewarning();
      expect(Object.keys(statesNeedingTranslationUpdate).length).toBe(0);

      swts.init('First', ess.getWrittenTranslationsMemento('First'));
      swts.displayed.toggleNeedsUpdateAttribute('feedback_1', 'hi');
      swts.displayed.toggleNeedsUpdateAttribute('feedback_2', 'hi');
      ess.saveWrittenTranslations('First', swts.displayed);
      tss.refresh();

      statesNeedingTranslationUpdate = tss.getAllStatesNeedUpdatewarning();
      expect(Object.keys(statesNeedingTranslationUpdate).length).toBe(1);
      expect(Object.keys(statesNeedingTranslationUpdate)[0]).toBe('First');
      expect(statesNeedingTranslationUpdate.First.indexOf(
        'Translation needs update!')).toBe(0);
    });

    it('should return a correct count of audio and translations required in ' +
      'an exploration', function() {
      ttams.activateVoiceoverMode();
      var explorationAudioRequiredCount = (
        tss.getExplorationContentRequiredCount());
      expect(explorationAudioRequiredCount).toBe(8);

      ttams.activateTranslationMode();
      tls.setActiveLanguageCode('hi');
      var explorationTranslationsRequiredCount = (
        tss.getExplorationContentRequiredCount());
      expect(explorationTranslationsRequiredCount).toBe(8);

      // To test changes after adding a new state.
      ess.addState('Fourth');
      ess.saveInteractionId('Third', 'MultipleChoiceInput');
      ess.saveInteractionId('Fourth', 'EndExploration');
      tss.refresh();

      ttams.activateVoiceoverMode();
      tls.setActiveLanguageCode('en');
      var explorationAudioRequiredCount = (
        tss.getExplorationContentRequiredCount());
      expect(explorationAudioRequiredCount).toBe(9);

      ttams.activateTranslationMode();
      tls.setActiveLanguageCode('hi');
      var explorationTranslationsRequiredCount = (
        tss.getExplorationContentRequiredCount());
      expect(explorationTranslationsRequiredCount).toBe(9);
    });

    it('should return a correct count of audio not available in an exploration',
      function() {
        ttams.activateVoiceoverMode();
        var explorationAudioNotAvailableCount = tss
          .getExplorationContentNotAvailableCount();
        expect(explorationAudioNotAvailableCount).toBe(6);

        ess.addState('Fourth');
        ess.saveInteractionId('Third', 'MultipleChoiceInput');
        ess.saveInteractionId('Fourth', 'EndExploration');
        tss.refresh();

        explorationAudioNotAvailableCount = (
          tss.getExplorationContentNotAvailableCount());
        expect(explorationAudioNotAvailableCount).toBe(7);
      });

    it('should return a correct count of translations not available in an ' +
      'exploration', function() {
      ttams.activateTranslationMode();
      tls.setActiveLanguageCode('hi');
      var explorationTranslationNotAvailableCount = (
        tss.getExplorationContentNotAvailableCount());
      expect(explorationTranslationNotAvailableCount).toBe(6);

      ess.addState('Fourth');
      ess.saveInteractionId('Third', 'MultipleChoiceInput');
      ess.saveInteractionId('Fourth', 'EndExploration');
      tss.refresh();

      explorationTranslationNotAvailableCount = (
        tss.getExplorationContentNotAvailableCount());
      expect(explorationTranslationNotAvailableCount).toBe(7);
    });

    it('should correctly return an object containing status colors of audio ' +
      'for all states in the exploration', function() {
      ttams.activateVoiceoverMode();
      var stateWiseStatusColor = tss.getAllStateStatusColors();
      expect(stateWiseStatusColor.First).toBe(FEW_ASSETS_AVAILABLE_COLOR);
      expect(stateWiseStatusColor.Second).toBe(NO_ASSETS_AVAILABLE_COLOR);
      expect(stateWiseStatusColor.Third).toBe(ALL_ASSETS_AVAILABLE_COLOR);
      srvs.init('Second', ess.getRecordedVoiceoversMemento('Second'));
      var value = srvs.displayed;
      value.addVoiceover('content', 'en', 'file.mp3', 1000);
      srvs.saveDisplayedValue();
      ess.saveRecordedVoiceovers('Second', value);
      tss.refresh();
      stateWiseStatusColor = tss.getAllStateStatusColors();
      expect(stateWiseStatusColor.Second).toBe(FEW_ASSETS_AVAILABLE_COLOR);
    });

    it('should correctly return an object containing status colors of ' +
      'translations for all states in the exploration', function() {
      ttams.activateTranslationMode();
      tls.setActiveLanguageCode('hi');
      tss.refresh();
      swts.init('Second', ess.getWrittenTranslationsMemento('Second'));
      var stateWiseStatusColor = tss.getAllStateStatusColors();
      expect(stateWiseStatusColor.First).toBe(FEW_ASSETS_AVAILABLE_COLOR);
      expect(stateWiseStatusColor.Second).toBe(NO_ASSETS_AVAILABLE_COLOR);
      expect(stateWiseStatusColor.Third).toBe(NO_ASSETS_AVAILABLE_COLOR);

      swts.displayed.addWrittenTranslation('content', 'hi', 'content');
      ess.saveWrittenTranslations('Second', swts.displayed);

      tss.refresh();
      stateWiseStatusColor = tss.getAllStateStatusColors();
      expect(stateWiseStatusColor.Second).toBe(FEW_ASSETS_AVAILABLE_COLOR);
    });

    it('should return correct status color for audio availability in the ' +
      'active state components', function() {
      ttams.activateVoiceoverMode();
      srvs.init('First', ess.getRecordedVoiceoversMemento('First'));
      var activeStateComponentStatus = tss
        .getActiveStateComponentStatusColor('content');
      expect(activeStateComponentStatus).toBe(NO_ASSETS_AVAILABLE_COLOR);
      activeStateComponentStatus = tss
        .getActiveStateComponentStatusColor('feedback');
      expect(activeStateComponentStatus).toBe(FEW_ASSETS_AVAILABLE_COLOR);
      // To test changes after adding an audio translation to "content"
      // in the first state.
      srvs.displayed.addVoiceover('content', 'en', 'file.mp3', 1000);
      srvs.saveDisplayedValue();
      var value = srvs.displayed;
      ess.saveRecordedVoiceovers('First', value);
      activeStateComponentStatus = tss
        .getActiveStateComponentStatusColor('content');
      expect(activeStateComponentStatus).toBe(ALL_ASSETS_AVAILABLE_COLOR);
      srvs.init('Second', ess.getRecordedVoiceoversMemento('Second'));
      activeStateComponentStatus = tss
        .getActiveStateComponentStatusColor('content');
      expect(activeStateComponentStatus).toBe(NO_ASSETS_AVAILABLE_COLOR);
      activeStateComponentStatus = tss
        .getActiveStateComponentStatusColor('feedback');
      expect(activeStateComponentStatus).toBe(NO_ASSETS_AVAILABLE_COLOR);
      srvs.init('Third', ess.getRecordedVoiceoversMemento('Third'));
      activeStateComponentStatus = tss
        .getActiveStateComponentStatusColor('content');
      expect(activeStateComponentStatus).toBe(ALL_ASSETS_AVAILABLE_COLOR);
    });

    it('should return correct status color for translations availability in ' +
      'the active state components', function() {
      ttams.activateTranslationMode();
      tls.setActiveLanguageCode('hi');

      swts.init('First', ess.getWrittenTranslationsMemento('First'));
      var activeStateComponentStatus = (
        tss.getActiveStateComponentStatusColor('content'));
      expect(activeStateComponentStatus).toBe(NO_ASSETS_AVAILABLE_COLOR);
      activeStateComponentStatus = (
        tss.getActiveStateComponentStatusColor('feedback'));
      expect(activeStateComponentStatus).toBe(FEW_ASSETS_AVAILABLE_COLOR);

      swts.displayed.addWrittenTranslation('content', 'hi', 'Content');

      activeStateComponentStatus = (
        tss.getActiveStateComponentStatusColor('content'));
      expect(activeStateComponentStatus).toBe(ALL_ASSETS_AVAILABLE_COLOR);
      activeStateComponentStatus = (
        tss.getActiveStateComponentStatusColor('feedback'));
      expect(activeStateComponentStatus).toBe(FEW_ASSETS_AVAILABLE_COLOR);
    });

    it('should correctly return whether active state component audio needs ' +
      'update', function() {
      ttams.activateVoiceoverMode();
      srvs.init('First', ess.getRecordedVoiceoversMemento('First'));
      var activeStateComponentNeedsUpdateStatus = tss
        .getActiveStateComponentNeedsUpdateStatus('feedback');
        // To check that initially the state component "feedback" does not
        // contain audio that needs update.
      expect(activeStateComponentNeedsUpdateStatus).toBe(false);
      var value = srvs.displayed;
      // To test changes after changing "needs update" status of an audio.
      value.toggleNeedsUpdateAttribute('feedback_2', 'en');
      srvs.saveDisplayedValue();
      ess.saveRecordedVoiceovers('First', value);
      activeStateComponentNeedsUpdateStatus = tss
        .getActiveStateComponentNeedsUpdateStatus('feedback');
      // To check that the state component "feedback" contains audio that
      // needs update.
      expect(activeStateComponentNeedsUpdateStatus).toBe(true);
    });

    it('should correctly return whether active state component translation ' +
      'needs update', function() {
      ttams.activateTranslationMode();
      tls.setActiveLanguageCode('hi');

      swts.init('First', ess.getWrittenTranslationsMemento('First'));
      var activeStateComponentNeedsUpdateStatus = (
        tss.getActiveStateComponentNeedsUpdateStatus('feedback'));
      expect(activeStateComponentNeedsUpdateStatus).toBe(false);

      swts.displayed.toggleNeedsUpdateAttribute('feedback_2', 'hi');

      activeStateComponentNeedsUpdateStatus = (
        tss.getActiveStateComponentNeedsUpdateStatus('feedback'));
      expect(activeStateComponentNeedsUpdateStatus).toBe(true);
    });

    it('should return correct audio availability status color of a contentId ' +
      'of active state', function() {
      ttams.activateVoiceoverMode();
      srvs.init('First', ess.getRecordedVoiceoversMemento('First'));
      var activeStateContentIdStatusColor = tss
        .getActiveStateContentIdStatusColor('content');
      expect(activeStateContentIdStatusColor).toBe(NO_ASSETS_AVAILABLE_COLOR);
      activeStateContentIdStatusColor = tss
        .getActiveStateContentIdStatusColor('feedback_1');
      expect(activeStateContentIdStatusColor).toBe(NO_ASSETS_AVAILABLE_COLOR);
      activeStateContentIdStatusColor = tss
        .getActiveStateContentIdStatusColor('feedback_2');
      expect(activeStateContentIdStatusColor).toBe(ALL_ASSETS_AVAILABLE_COLOR);
      var value = srvs.displayed;
      // To test changes after adding an audio translation to "content"
      // in the first state.
      value.addVoiceover('content', 'en', 'file.mp3', 1000);
      srvs.saveDisplayedValue();
      ess.saveRecordedVoiceovers('First', value);
      activeStateContentIdStatusColor = tss
        .getActiveStateContentIdStatusColor('content');
      expect(activeStateContentIdStatusColor).toBe(ALL_ASSETS_AVAILABLE_COLOR);
      srvs.init('Second', ess.getRecordedVoiceoversMemento('Second'));
      activeStateContentIdStatusColor = tss
        .getActiveStateContentIdStatusColor('content');
      expect(activeStateContentIdStatusColor).toBe(NO_ASSETS_AVAILABLE_COLOR);
      activeStateContentIdStatusColor = tss
        .getActiveStateContentIdStatusColor('feedback_1');
      expect(activeStateContentIdStatusColor).toBe(NO_ASSETS_AVAILABLE_COLOR);
      srvs.init('Third', ess.getRecordedVoiceoversMemento('Third'));
      activeStateContentIdStatusColor = tss
        .getActiveStateContentIdStatusColor('content');
      expect(activeStateContentIdStatusColor).toBe(ALL_ASSETS_AVAILABLE_COLOR);
    });

    it('should return correct translation availability status color of a ' +
      'contentId of active state', function() {
      ttams.activateTranslationMode();
      tls.setActiveLanguageCode('hi');

      swts.init('First', ess.getWrittenTranslationsMemento('First'));
      var activeStateContentIdStatusColor = (
        tss.getActiveStateContentIdStatusColor('content'));
      expect(activeStateContentIdStatusColor).toBe(NO_ASSETS_AVAILABLE_COLOR);
      activeStateContentIdStatusColor = (
        tss.getActiveStateContentIdStatusColor('feedback_1'));
      expect(activeStateContentIdStatusColor).toBe(
        ALL_ASSETS_AVAILABLE_COLOR);
      activeStateContentIdStatusColor = (
        tss.getActiveStateContentIdStatusColor('feedback_2'));
      expect(activeStateContentIdStatusColor).toBe(
        ALL_ASSETS_AVAILABLE_COLOR);

      swts.displayed.addWrittenTranslation('content', 'hi', '<p>Content</p>');

      activeStateContentIdStatusColor = (
        tss.getActiveStateContentIdStatusColor('content'));
      expect(activeStateContentIdStatusColor).toBe(
        ALL_ASSETS_AVAILABLE_COLOR);
      activeStateContentIdStatusColor = (
        tss.getActiveStateContentIdStatusColor('feedback_1'));
      expect(activeStateContentIdStatusColor).toBe(
        ALL_ASSETS_AVAILABLE_COLOR);
      activeStateContentIdStatusColor = (
        tss.getActiveStateContentIdStatusColor('feedback_2'));
      expect(activeStateContentIdStatusColor).toBe(
        ALL_ASSETS_AVAILABLE_COLOR);
    });

    it('should return correct needs update status of voice-over of active ' +
      'state contentId', function() {
      ttams.activateVoiceoverMode();
      srvs.init('First', ess.getRecordedVoiceoversMemento('First'));
      var activeStateContentIdNeedsUpdateStatus = tss
        .getActiveStateContentIdNeedsUpdateStatus('feedback_2');
      // To check that initially the state content id "feedback" does not
      // contain audio that needs update.
      expect(activeStateContentIdNeedsUpdateStatus).toBe(false);

      var value = srvs.displayed;
      value.toggleNeedsUpdateAttribute('feedback_2', 'en');
      srvs.saveDisplayedValue();
      activeStateContentIdNeedsUpdateStatus = (
        tss.getActiveStateContentIdNeedsUpdateStatus('feedback_2'));
      // To check that the state content id "feedback" contains audio that
      // needs update.
      expect(activeStateContentIdNeedsUpdateStatus).toBe(true);
    });

    it('should return correct needs update status of translation of active ' +
      'state contentId', function() {
      ttams.activateTranslationMode();
      tls.setActiveLanguageCode('hi');
      swts.init('First', ess.getWrittenTranslationsMemento('First'));
      var activeStateContentIdNeedsUpdateStatus = (
        tss.getActiveStateContentIdNeedsUpdateStatus('feedback_2'));
      expect(activeStateContentIdNeedsUpdateStatus).toBe(false);

      swts.displayed.toggleNeedsUpdateAttribute('feedback_2', 'hi');

      activeStateContentIdNeedsUpdateStatus = (
        tss.getActiveStateContentIdNeedsUpdateStatus('feedback_2'));
      expect(activeStateContentIdNeedsUpdateStatus).toBe(true);
    });
  });
});
