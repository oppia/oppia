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

import { TestBed } from '@angular/core/testing';
import { ExplorationDataService } from 'pages/exploration-editor-page/services/exploration-data.service';
import { ExplorationStatesService } from 'pages/exploration-editor-page/services/exploration-states.service';
import { TranslationLanguageService } from 'pages/exploration-editor-page/translation-tab/services/translation-language.service';
import { TranslationStatusService } from 'pages/exploration-editor-page/translation-tab/services/translation-status.service';
import { TranslationTabActiveModeService } from 'pages/exploration-editor-page/translation-tab/services/translation-tab-active-mode.service';
import { StateWrittenTranslationsService } from 'components/state-editor/state-editor-properties-services/state-written-translations.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { StateRecordedVoiceoversService } from 'components/state-editor/state-editor-properties-services/state-recorded-voiceovers.service';


class MockNgbModal {
  open() {
    return {
      result: Promise.resolve()
    };
  }
}

describe('Translation status service', () => {
  let tss: TranslationStatusService;
  let ess: ExplorationStatesService;
  let srvs: StateRecordedVoiceoversService;
  let swts: StateWrittenTranslationsService;
  let ttams: TranslationTabActiveModeService;
  let tls: TranslationLanguageService;
  let ALL_ASSETS_AVAILABLE_COLOR = '#16A765';
  let FEW_ASSETS_AVAILABLE_COLOR = '#E9B330';
  let NO_ASSETS_AVAILABLE_COLOR = '#D14836';
  let statesWithAudioDict = null;


  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        TranslationStatusService,
        TranslationLanguageService,
        StateRecordedVoiceoversService,
        StateWrittenTranslationsService,
        TranslationTabActiveModeService,
        ExplorationStatesService,
        {
          provide: NgbModal,
          useClass: MockNgbModal
        },
        {
          provide: ExplorationDataService,
          useValue: {
            explorationId: 0,
            autosaveChangeListAsync() {
              return;
            }
          }
        }
      ]
    });

    tss = TestBed.inject(
      TranslationStatusService);
    ess = TestBed.inject(ExplorationStatesService);
    ttams = TestBed.inject(TranslationTabActiveModeService);
    tls = TestBed.inject(TranslationLanguageService);
    srvs = TestBed.inject(StateRecordedVoiceoversService);
    swts = TestBed.inject(StateWrittenTranslationsService);
  });

  beforeEach(() => {
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
                data_format: 'html',
                translation: '<p>This is feedback 1.</p>',
                needs_update: false
              }
            },
            feedback_1: {
              hi: {
                data_format: 'html',
                translation: '<p>This is first card.</p>',
                needs_update: false
              }
            },
            rule_input_4: {}
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
                file_size_bytes: 43467,
                duration_secs: 4.3
              }
            },
            feedback_1: {},
            rule_input_4: {}
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
              dest_if_really_stuck: null,
              dest: 'Second'
            },
            rule_specs: [{
              rule_type: 'Equals',
              inputs: {x: 0}
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
              dest_if_really_stuck: null,
              dest: 'First'
            },
            rule_specs: [{
              rule_type: 'Equals',
              inputs: {x: 1}
            }],
            training_data: []
          }],
          solution: null,
          hints: [],
          id: 'MultipleChoiceInput',
          customization_args: {
            choices: {
              value: ['<p>1</p>', '<p>2</p>']
            },
            showChoicesInShuffledOrder: {value: false}
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
            dest_if_really_stuck: null,
            dest: 'First'
          },
          confirmed_unclassified_answers: []
        },
        linked_skill_id: null,
        solicit_answer_details: false,
        classifier_model_id: null,
        param_changes: [],
        next_content_id_index: 0,
        card_is_checkpoint: false,
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
              dest_if_really_stuck: null,
              dest: 'Third'
            },
            rule_specs: [{
              rule_type: 'Equals',
              inputs: {x: 0}
            }],
            training_data: []
          }],
          solution: null,
          hints: [],
          id: 'MultipleChoiceInput',
          customization_args: {
            choices: {
              value: ['<p>1</p>'],
            },
            showChoicesInShuffledOrder: {value: false}
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
            dest_if_really_stuck: null,
            dest: 'Second'
          },
          confirmed_unclassified_answers: []
        },
        linked_skill_id: null,
        solicit_answer_details: false,
        classifier_model_id: null,
        param_changes: [],
        next_content_id_index: 0,
        card_is_checkpoint: false,
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
                file_size_bytes: 38870,
                duration_secs: 38.8
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
        linked_skill_id: null,
        solicit_answer_details: false,
        classifier_model_id: null,
        param_changes: [],
        next_content_id_index: 0,
        card_is_checkpoint: false,
      }
    };
    ess.init(statesWithAudioDict);
    ttams.activateVoiceoverMode();
    tls.setActiveLanguageCode('en');
    tss.refresh();
  });

  it('should initialize service properly', () => {
    tss.ngOnInit();

    expect(tss.explorationVoiceoverContentNotAvailableCount).toEqual(0);
    expect(tss.explorationTranslationContentNotAvailableCount).toEqual(0);
    expect(tss.explorationTranslationContentRequiredCount).toEqual(0);
    expect(tss.explorationVoiceoverContentRequiredCount).toEqual(0);
  });

  it('should return a correct list of state names for which audio needs ' +
      'update', () => {
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
    tss.getAllStateStatusColors();

    statesNeedingAudioUpdate = tss.getAllStatesNeedUpdatewarning();
    // To check that "First" state contains audio that needs update.
    expect(Object.keys(statesNeedingAudioUpdate).length).toBe(1);
    expect(Object.keys(statesNeedingAudioUpdate)[0]).toBe('First');
  });

  it('should return a correct list of state names for which translation ' +
      'needs update', () => {
    ttams.activateTranslationMode();
    tls.setActiveLanguageCode('hi');
    var statesNeedingTranslationUpdate = tss.getAllStatesNeedUpdatewarning();
    expect(Object.keys(statesNeedingTranslationUpdate).length).toBe(0);

    swts.init('First', ess.getWrittenTranslationsMemento('First'));
    swts.displayed.toggleNeedsUpdateAttribute('feedback_1', 'hi');
    swts.displayed.toggleNeedsUpdateAttribute('feedback_2', 'hi');
    ess.markWrittenTranslationsAsNeedingUpdate('feedback_1', 'First');
    ess.markWrittenTranslationsAsNeedingUpdate('feedback_2', 'First');
    tss.refresh();

    statesNeedingTranslationUpdate = tss.getAllStatesNeedUpdatewarning();
    expect(Object.keys(statesNeedingTranslationUpdate).length).toBe(1);
    expect(Object.keys(statesNeedingTranslationUpdate)[0]).toBe('First');
  });

  it('should return a correct count of audio and translations required in ' +
      'an exploration', () => {
    ttams.activateVoiceoverMode();
    var explorationAudioRequiredCount = (
      tss.getExplorationContentRequiredCount());
    expect(explorationAudioRequiredCount).toBe(8);

    ttams.activateTranslationMode();
    tls.setActiveLanguageCode('hi');
    var explorationTranslationsRequiredCount = (
      tss.getExplorationContentRequiredCount());
    expect(explorationTranslationsRequiredCount).toBe(9);

    // To test changes after adding a new state.
    ess.addState('Fourth', () => {});
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
    expect(explorationTranslationsRequiredCount).toBe(10);
  });

  it('should return a correct count of audio not available in an exploration',
    () => {
      ttams.activateVoiceoverMode();
      var explorationAudioNotAvailableCount = tss
        .getExplorationContentNotAvailableCount();
      expect(explorationAudioNotAvailableCount).toBe(6);

      ess.addState('Fourth', () => {});
      ess.saveInteractionId('Third', 'MultipleChoiceInput');
      ess.saveInteractionId('Fourth', 'EndExploration');
      tss.refresh();

      explorationAudioNotAvailableCount = (
        tss.getExplorationContentNotAvailableCount());
      expect(explorationAudioNotAvailableCount).toBe(7);
    });

  it('should return a correct count of translations not available in an ' +
      'exploration', () => {
    ttams.activateTranslationMode();
    tls.setActiveLanguageCode('hi');
    var explorationTranslationNotAvailableCount = (
      tss.getExplorationContentNotAvailableCount());
    expect(explorationTranslationNotAvailableCount).toBe(6);

    ess.addState('Fourth', () => {});
    ess.saveInteractionId('Third', 'MultipleChoiceInput');
    ess.saveInteractionId('Fourth', 'EndExploration');
    tss.refresh();

    explorationTranslationNotAvailableCount = (
      tss.getExplorationContentNotAvailableCount());
    expect(explorationTranslationNotAvailableCount).toBe(8);
  });

  it('should return correct status color for audio availability in the ' +
      'active state components', () => {
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
    srvs.displayed.addVoiceover('content', 'en', 'file.mp3', 1000, 1000);
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
      'the active state components', () => {
    ttams.activateTranslationMode();
    tls.setActiveLanguageCode('hi');

    swts.init('First', ess.getWrittenTranslationsMemento('First'));
    var activeStateComponentStatus = (
      tss.getActiveStateComponentStatusColor('content'));
    expect(activeStateComponentStatus).toBe(NO_ASSETS_AVAILABLE_COLOR);
    activeStateComponentStatus = (
      tss.getActiveStateComponentStatusColor('feedback'));
    expect(activeStateComponentStatus).toBe(FEW_ASSETS_AVAILABLE_COLOR);

    swts.displayed.addWrittenTranslation('content', 'hi', 'html', 'Content');

    activeStateComponentStatus = (
      tss.getActiveStateComponentStatusColor('content'));
    expect(activeStateComponentStatus).toBe(ALL_ASSETS_AVAILABLE_COLOR);
    activeStateComponentStatus = (
      tss.getActiveStateComponentStatusColor('feedback'));
    expect(activeStateComponentStatus).toBe(FEW_ASSETS_AVAILABLE_COLOR);
  });

  it('should correctly return whether active state component audio needs ' +
      'update', () => {
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
      'needs update', () => {
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
      'of active state', () => {
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
    value.addVoiceover('content', 'en', 'file.mp3', 1000, 1000);
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
      'contentId of active state', () => {
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

    swts.displayed.addWrittenTranslation(
      'content', 'hi', 'html', '<p>Content</p>');

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
      'state contentId', () => {
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
      'state contentId', () => {
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
