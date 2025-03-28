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

import {TestBed} from '@angular/core/testing';
import {ExplorationDataService} from 'pages/exploration-editor-page/services/exploration-data.service';
import {ExplorationStatesService} from 'pages/exploration-editor-page/services/exploration-states.service';
import {TranslationLanguageService} from 'pages/exploration-editor-page/translation-tab/services/translation-language.service';
import {TranslationStatusService} from 'pages/exploration-editor-page/translation-tab/services/translation-status.service';
import {TranslationTabActiveModeService} from 'pages/exploration-editor-page/translation-tab/services/translation-tab-active-mode.service';
import {StateWrittenTranslationsService} from 'components/state-editor/state-editor-properties-services/state-written-translations.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {StateRecordedVoiceoversService} from 'components/state-editor/state-editor-properties-services/state-recorded-voiceovers.service';
import {GenerateContentIdService} from 'services/generate-content-id.service';
import {EntityTranslationsService} from 'services/entity-translations.services';
import {EntityTranslation} from 'domain/translation/EntityTranslationObjectFactory';
import {PlatformFeatureService} from 'services/platform-feature.service';
import {FeatureStatusChecker} from 'domain/feature-flag/feature-status-summary.model';
import {EntityVoiceoversService} from 'services/entity-voiceovers.services';
import {EntityVoiceovers} from 'domain/voiceover/entity-voiceovers.model';
import {Voiceover} from 'domain/exploration/voiceover.model';

class MockNgbModal {
  open() {
    return {
      result: Promise.resolve(),
    };
  }
}

class MockPlatformFeatureService {
  get status(): object {
    return {
      AddVoiceoverWithAccent: {
        isEnabled: false,
      },
    };
  }
}

describe('Translation status service', () => {
  let tss: TranslationStatusService;
  let entityTranslationsService: EntityTranslationsService;
  let generateContentIdService: GenerateContentIdService;
  let ess: ExplorationStatesService;
  let srvs: StateRecordedVoiceoversService;
  let ttams: TranslationTabActiveModeService;
  let tls: TranslationLanguageService;
  let platformFeatureService: PlatformFeatureService;
  let entityVoiceoversService: EntityVoiceoversService;

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
        GenerateContentIdService,
        {
          provide: NgbModal,
          useClass: MockNgbModal,
        },
        {
          provide: ExplorationDataService,
          useValue: {
            explorationId: 0,
            autosaveChangeListAsync() {
              return;
            },
          },
        },
        {
          provide: PlatformFeatureService,
          useClass: MockPlatformFeatureService,
        },
      ],
    });

    tss = TestBed.inject(TranslationStatusService);
    ess = TestBed.inject(ExplorationStatesService);
    ttams = TestBed.inject(TranslationTabActiveModeService);
    tls = TestBed.inject(TranslationLanguageService);
    srvs = TestBed.inject(StateRecordedVoiceoversService);
    entityTranslationsService = TestBed.inject(EntityTranslationsService);
    generateContentIdService = TestBed.inject(GenerateContentIdService);
    platformFeatureService = TestBed.inject(PlatformFeatureService);
    entityVoiceoversService = TestBed.inject(EntityVoiceoversService);
    let currentIndex = 9;
    generateContentIdService.init(
      () => currentIndex++,
      () => {}
    );
  });

  beforeEach(() => {
    statesWithAudioDict = {
      First: {
        content: {
          html: '<p>This is first card.</p>',
          content_id: 'content_0',
        },
        recorded_voiceovers: {
          voiceovers_mapping: {
            content_0: {},
            default_outcome_1: {},
            feedback_3: {
              en: {
                needs_update: false,
                filename: 'filename1.mp3',
                file_size_bytes: 43467,
                duration_secs: 4.3,
              },
            },
            feedback_2: {},
          },
        },
        interaction: {
          answer_groups: [
            {
              tagged_skill_misconception_id: null,
              outcome: {
                refresher_exploration_id: null,
                param_changes: [],
                labelled_as_correct: false,
                feedback: {
                  html: '<p>This is feedback1</p>',
                  content_id: 'feedback_2',
                },
                missing_prerequisite_skill_id: null,
                dest_if_really_stuck: null,
                dest: 'Second',
              },
              rule_specs: [
                {
                  rule_type: 'Equals',
                  inputs: {x: 0},
                },
              ],
              training_data: [],
            },
            {
              tagged_skill_misconception_id: null,
              outcome: {
                refresher_exploration_id: null,
                param_changes: [],
                labelled_as_correct: false,
                feedback: {
                  html: '<p>This is feedback2</p>',
                  content_id: 'feedback_3',
                },
                missing_prerequisite_skill_id: null,
                dest_if_really_stuck: null,
                dest: 'First',
              },
              rule_specs: [
                {
                  rule_type: 'Equals',
                  inputs: {x: 1},
                },
              ],
              training_data: [],
            },
          ],
          solution: null,
          hints: [],
          id: 'MultipleChoiceInput',
          customization_args: {
            choices: {
              value: ['<p>1</p>', '<p>2</p>'],
            },
            showChoicesInShuffledOrder: {value: false},
          },
          default_outcome: {
            refresher_exploration_id: null,
            param_changes: [],
            labelled_as_correct: false,
            feedback: {
              html: '',
              content_id: 'default_outcome_1',
            },
            missing_prerequisite_skill_id: null,
            dest_if_really_stuck: null,
            dest: 'First',
          },
          confirmed_unclassified_answers: [],
        },
        linked_skill_id: null,
        solicit_answer_details: false,
        classifier_model_id: null,
        param_changes: [],
        card_is_checkpoint: false,
      },
      Second: {
        content: {
          html: '<p>This is second card</p>',
          content_id: 'content_5',
        },
        recorded_voiceovers: {
          voiceovers_mapping: {
            content_5: {},
            default_outcome_6: {},
            feedback_7: {},
          },
        },
        interaction: {
          answer_groups: [
            {
              tagged_skill_misconception_id: null,
              outcome: {
                refresher_exploration_id: null,
                param_changes: [],
                labelled_as_correct: false,
                feedback: {
                  html: '',
                  content_id: 'feedback_7',
                },
                missing_prerequisite_skill_id: null,
                dest_if_really_stuck: null,
                dest: 'Third',
              },
              rule_specs: [
                {
                  rule_type: 'Equals',
                  inputs: {x: 0},
                },
              ],
              training_data: [],
            },
          ],
          solution: null,
          hints: [],
          id: 'MultipleChoiceInput',
          customization_args: {
            choices: {
              value: ['<p>1</p>'],
            },
            showChoicesInShuffledOrder: {value: false},
          },
          default_outcome: {
            refresher_exploration_id: null,
            param_changes: [],
            labelled_as_correct: false,
            feedback: {
              html: '',
              content_id: 'default_outcome_6',
            },
            missing_prerequisite_skill_id: null,
            dest_if_really_stuck: null,
            dest: 'Second',
          },
          confirmed_unclassified_answers: [],
        },
        linked_skill_id: null,
        solicit_answer_details: false,
        classifier_model_id: null,
        param_changes: [],
        card_is_checkpoint: false,
      },
      Third: {
        content: {
          html: 'Congratulations, you have finished!',
          content_id: 'content_8',
        },
        recorded_voiceovers: {
          voiceovers_mapping: {
            content_8: {
              en: {
                needs_update: false,
                filename: 'content-en-s86jb5zajs.mp3',
                file_size_bytes: 38870,
                duration_secs: 38.8,
              },
            },
          },
        },
        interaction: {
          answer_groups: [],
          solution: null,
          hints: [],
          id: 'EndExploration',
          customization_args: {
            recommendedExplorationIds: {
              value: [],
            },
          },
          default_outcome: null,
          confirmed_unclassified_answers: [],
        },
        linked_skill_id: null,
        solicit_answer_details: false,
        classifier_model_id: null,
        param_changes: [],
        card_is_checkpoint: false,
      },
    };
    ess.init(statesWithAudioDict, false);
    ttams.activateVoiceoverMode();
    tls.setActiveLanguageCode('en');
    entityTranslationsService.languageCodeToLatestEntityTranslations.hi =
      EntityTranslation.createFromBackendDict({
        entity_id: 'exp_id',
        entity_type: 'exploration',
        entity_version: 5,
        language_code: 'hi',
        translations: {
          feedback_3: {
            content_format: 'html',
            content_value: '<p>This is feedback 1.</p>',
            needs_update: false,
          },
        },
      });
    tss.refresh();
  });

  it('should initialize service properly', () => {
    tss.ngOnInit();

    expect(tss.explorationVoiceoverContentNotAvailableCount).toEqual(0);
    expect(tss.explorationTranslationContentNotAvailableCount).toEqual(0);
    expect(tss.explorationTranslationContentRequiredCount).toEqual(0);
    expect(tss.explorationVoiceoverContentRequiredCount).toEqual(0);
  });

  it(
    'should return a correct list of state names for which audio needs ' +
      'update',
    () => {
      ttams.activateVoiceoverMode();
      var statesNeedingAudioUpdate = tss.getAllStatesNeedUpdatewarning();
      // To check that initially no state contains audio that needs update.
      expect(Object.keys(statesNeedingAudioUpdate).length).toBe(0);
      srvs.init('First', ess.getRecordedVoiceoversMemento('First'));
      var value = srvs.displayed;
      value.toggleNeedsUpdateAttribute('feedback_3', 'en');
      srvs.saveDisplayedValue();
      ess.saveRecordedVoiceovers('First', value);
      tss.refresh();
      tss.getAllStateStatusColors();

      statesNeedingAudioUpdate = tss.getAllStatesNeedUpdatewarning();
      // To check that "First" state contains audio that needs update.
      expect(Object.keys(statesNeedingAudioUpdate).length).toBe(1);
      expect(Object.keys(statesNeedingAudioUpdate)[0]).toBe('First');
    }
  );

  it(
    'should return a correct list of state names for which translation ' +
      'needs update',
    () => {
      ttams.activateTranslationMode();
      tls.setActiveLanguageCode('hi');
      var statesNeedingTranslationUpdate = tss.getAllStatesNeedUpdatewarning();
      expect(Object.keys(statesNeedingTranslationUpdate).length).toBe(0);

      entityTranslationsService.languageCodeToLatestEntityTranslations.hi =
        EntityTranslation.createFromBackendDict({
          entity_id: 'exp_id',
          entity_type: 'exploration',
          entity_version: 5,
          language_code: 'hi',
          translations: {
            feedback_3: {
              content_format: 'html',
              content_value: '<p>This is feedback 1.</p>',
              needs_update: true,
            },
            feedback_2: {
              content_format: 'html',
              content_value: '<p>This is first card.</p>',
              needs_update: true,
            },
          },
        });

      tss.refresh();
      statesNeedingTranslationUpdate = tss.getAllStatesNeedUpdatewarning();
      expect(Object.keys(statesNeedingTranslationUpdate).length).toBe(1);
      expect(Object.keys(statesNeedingTranslationUpdate)[0]).toBe('First');
    }
  );

  it(
    'should return a correct count of audio and translations required in ' +
      'an exploration',
    () => {
      ttams.activateVoiceoverMode();
      var explorationAudioRequiredCount =
        tss.getExplorationContentRequiredCount();
      expect(explorationAudioRequiredCount).toBe(8);

      ttams.activateTranslationMode();
      tls.setActiveLanguageCode('hi');
      var explorationTranslationsRequiredCount =
        tss.getExplorationContentRequiredCount();
      expect(explorationTranslationsRequiredCount).toBe(8);

      // To test changes after adding a new state.
      ess.addState('Fourth', () => {});
      ess.saveInteractionId('Third', 'MultipleChoiceInput');
      ess.saveInteractionId('Fourth', 'EndExploration');

      tss.refresh();
      ttams.activateVoiceoverMode();
      tls.setActiveLanguageCode('en');
      var explorationAudioRequiredCount =
        tss.getExplorationContentRequiredCount();
      expect(explorationAudioRequiredCount).toBe(9);

      ttams.activateTranslationMode();
      tls.setActiveLanguageCode('hi');

      var explorationTranslationsRequiredCount =
        tss.getExplorationContentRequiredCount();
      expect(explorationTranslationsRequiredCount).toBe(9);
    }
  );

  it('should return a correct count of missing audio with accent in an exploration', () => {
    spyOnProperty(platformFeatureService, 'status', 'get').and.returnValue({
      AddVoiceoverWithAccent: {
        isEnabled: true,
      },
    } as FeatureStatusChecker);

    let manualVoiceover1 = new Voiceover('a.mp3', 1000, false, 10.0);
    let manualVoiceover2 = new Voiceover('b.mp3', 1000, false, 10.0);

    let entityVoiceovers = new EntityVoiceovers(
      'exp_id',
      'exploration',
      5,
      'en-US',
      {
        content_0: {
          manual: manualVoiceover1,
        },
        content_8: {
          manual: manualVoiceover2,
        },
      }
    );

    entityVoiceoversService.init('exp_id', 'exploration', 5);
    entityVoiceoversService.setLanguageCode('en');
    entityVoiceoversService.addEntityVoiceovers('en-US', entityVoiceovers);

    ttams.activateVoiceoverMode();

    expect(tss.getExplorationContentRequiredCount()).toBe(8);

    entityVoiceoversService.setActiveLanguageAccentCode('en-US');
    tss.refresh();
    expect(tss.getExplorationContentNotAvailableCount()).toEqual(6);

    let color = tss.getActiveStateContentIdStatusColor('content_0');
    expect(tss.ALL_ASSETS_AVAILABLE_COLOR).toEqual(color);

    color = tss.getActiveStateContentIdStatusColor('content_1');
    expect(tss.NO_ASSETS_AVAILABLE_COLOR).toEqual(color);

    entityVoiceoversService.setActiveLanguageAccentCode('en-IN');
    tss.refresh();
    expect(tss.getExplorationContentNotAvailableCount()).toEqual(8);
  });

  it('should return a correct count of audio not available in an exploration', () => {
    ttams.activateVoiceoverMode();
    var explorationAudioNotAvailableCount =
      tss.getExplorationContentNotAvailableCount();
    expect(explorationAudioNotAvailableCount).toBe(6);

    ess.addState('Fourth', () => {});
    ess.saveInteractionId('Third', 'MultipleChoiceInput');
    ess.saveInteractionId('Fourth', 'EndExploration');
    tss.refresh();

    explorationAudioNotAvailableCount =
      tss.getExplorationContentNotAvailableCount();
    expect(explorationAudioNotAvailableCount).toBe(7);
  });

  it(
    'should return a correct count of translations not available in an ' +
      'exploration',
    () => {
      ttams.activateTranslationMode();
      tls.setActiveLanguageCode('hi');
      var explorationTranslationNotAvailableCount =
        tss.getExplorationContentNotAvailableCount();
      expect(explorationTranslationNotAvailableCount).toBe(6);

      ess.addState('Fourth', () => {});
      ess.saveInteractionId('Third', 'MultipleChoiceInput');
      ess.saveInteractionId('Fourth', 'EndExploration');

      ttams.activateTranslationMode();
      tss.refresh();
      explorationTranslationNotAvailableCount =
        tss.getExplorationContentNotAvailableCount();
      expect(explorationTranslationNotAvailableCount).toBe(8);
    }
  );

  it(
    'should return correct status color for audio availability in the ' +
      'active state components',
    () => {
      ttams.activateVoiceoverMode();
      srvs.init('First', ess.getRecordedVoiceoversMemento('First'));
      var activeStateComponentStatus =
        tss.getActiveStateComponentStatusColor('content');
      expect(activeStateComponentStatus).toBe(NO_ASSETS_AVAILABLE_COLOR);
      activeStateComponentStatus =
        tss.getActiveStateComponentStatusColor('feedback');
      expect(activeStateComponentStatus).toBe(FEW_ASSETS_AVAILABLE_COLOR);
      // To test changes after adding an audio translation to "content"
      // in the first state.
      srvs.displayed.addVoiceover('content_0', 'en', 'file.mp3', 1000, 1000);
      srvs.saveDisplayedValue();
      var value = srvs.displayed;
      ess.saveRecordedVoiceovers('First', value);
      activeStateComponentStatus =
        tss.getActiveStateComponentStatusColor('content');
      expect(activeStateComponentStatus).toBe(ALL_ASSETS_AVAILABLE_COLOR);
      srvs.init('Second', ess.getRecordedVoiceoversMemento('Second'));
      activeStateComponentStatus =
        tss.getActiveStateComponentStatusColor('content');
      expect(activeStateComponentStatus).toBe(NO_ASSETS_AVAILABLE_COLOR);
      activeStateComponentStatus =
        tss.getActiveStateComponentStatusColor('feedback');
      expect(activeStateComponentStatus).toBe(NO_ASSETS_AVAILABLE_COLOR);
      srvs.init('Third', ess.getRecordedVoiceoversMemento('Third'));
      activeStateComponentStatus =
        tss.getActiveStateComponentStatusColor('content');
      expect(activeStateComponentStatus).toBe(ALL_ASSETS_AVAILABLE_COLOR);
    }
  );

  it(
    'should return correct status color for translations availability in ' +
      'the active state components',
    () => {
      ttams.activateTranslationMode();
      tls.setActiveLanguageCode('hi');
      srvs.init('First', ess.getRecordedVoiceoversMemento('First'));
      tss.refresh();

      var activeStateComponentStatus =
        tss.getActiveStateComponentStatusColor('content');
      expect(activeStateComponentStatus).toBe(NO_ASSETS_AVAILABLE_COLOR);
      activeStateComponentStatus =
        tss.getActiveStateComponentStatusColor('feedback');
      expect(activeStateComponentStatus).toBe(FEW_ASSETS_AVAILABLE_COLOR);

      tss.entityTranslation = EntityTranslation.createFromBackendDict({
        entity_id: 'exp_id',
        entity_type: 'exploration',
        entity_version: 5,
        language_code: 'hi',
        translations: {
          content_0: {
            content_format: 'html',
            content_value: '<p>This is content.</p>',
            needs_update: false,
          },
          feedback_2: {
            content_format: 'html',
            content_value: '<p>This is first card.</p>',
            needs_update: false,
          },
        },
      });

      activeStateComponentStatus =
        tss.getActiveStateComponentStatusColor('content');
      expect(activeStateComponentStatus).toBe(ALL_ASSETS_AVAILABLE_COLOR);
      activeStateComponentStatus =
        tss.getActiveStateComponentStatusColor('feedback');
      expect(activeStateComponentStatus).toBe(FEW_ASSETS_AVAILABLE_COLOR);
    }
  );

  it(
    'should correctly return whether active state component audio needs ' +
      'update',
    () => {
      ttams.activateVoiceoverMode();
      srvs.init('First', ess.getRecordedVoiceoversMemento('First'));
      var activeStateComponentNeedsUpdateStatus =
        tss.getActiveStateComponentNeedsUpdateStatus('feedback');
      // To check that initially the state component "feedback" does not
      // contain audio that needs update.
      expect(activeStateComponentNeedsUpdateStatus).toBe(false);
      var value = srvs.displayed;
      // To test changes after changing "needs update" status of an audio.
      value.toggleNeedsUpdateAttribute('feedback_3', 'en');
      srvs.saveDisplayedValue();
      ess.saveRecordedVoiceovers('First', value);
      activeStateComponentNeedsUpdateStatus =
        tss.getActiveStateComponentNeedsUpdateStatus('feedback');
      // To check that the state component "feedback" contains audio that
      // needs update.
      expect(activeStateComponentNeedsUpdateStatus).toBe(true);
    }
  );

  it(
    'should correctly return whether active state component translation ' +
      'needs update',
    () => {
      ttams.activateTranslationMode();
      tls.setActiveLanguageCode('hi');
      srvs.init('First', ess.getRecordedVoiceoversMemento('First'));

      var activeStateComponentNeedsUpdateStatus =
        tss.getActiveStateComponentNeedsUpdateStatus('feedback');
      expect(activeStateComponentNeedsUpdateStatus).toBe(false);

      tss.refresh();
      tss.entityTranslation.markTranslationAsNeedingUpdate('feedback_3');
      activeStateComponentNeedsUpdateStatus =
        tss.getActiveStateComponentNeedsUpdateStatus('feedback');
      expect(activeStateComponentNeedsUpdateStatus).toBe(true);
    }
  );

  it(
    'should return correct audio availability status color of a contentId ' +
      'of active state',
    () => {
      ttams.activateVoiceoverMode();
      srvs.init('First', ess.getRecordedVoiceoversMemento('First'));
      var activeStateContentIdStatusColor =
        tss.getActiveStateContentIdStatusColor('content_0');
      expect(activeStateContentIdStatusColor).toBe(NO_ASSETS_AVAILABLE_COLOR);
      activeStateContentIdStatusColor =
        tss.getActiveStateContentIdStatusColor('feedback_2');
      expect(activeStateContentIdStatusColor).toBe(NO_ASSETS_AVAILABLE_COLOR);
      activeStateContentIdStatusColor =
        tss.getActiveStateContentIdStatusColor('feedback_3');
      expect(activeStateContentIdStatusColor).toBe(ALL_ASSETS_AVAILABLE_COLOR);
      var value = srvs.displayed;
      // To test changes after adding an audio translation to "content"
      // in the first state.
      value.addVoiceover('content_0', 'en', 'file.mp3', 1000, 1000);
      srvs.saveDisplayedValue();
      ess.saveRecordedVoiceovers('First', value);
      activeStateContentIdStatusColor =
        tss.getActiveStateContentIdStatusColor('content_0');
      expect(activeStateContentIdStatusColor).toBe(ALL_ASSETS_AVAILABLE_COLOR);
      srvs.init('Second', ess.getRecordedVoiceoversMemento('Second'));
      activeStateContentIdStatusColor =
        tss.getActiveStateContentIdStatusColor('content_5');
      expect(activeStateContentIdStatusColor).toBe(NO_ASSETS_AVAILABLE_COLOR);
      activeStateContentIdStatusColor =
        tss.getActiveStateContentIdStatusColor('feedback_7');
      expect(activeStateContentIdStatusColor).toBe(NO_ASSETS_AVAILABLE_COLOR);
      srvs.init('Third', ess.getRecordedVoiceoversMemento('Third'));
      activeStateContentIdStatusColor =
        tss.getActiveStateContentIdStatusColor('content_8');
      expect(activeStateContentIdStatusColor).toBe(ALL_ASSETS_AVAILABLE_COLOR);
    }
  );

  it(
    'should return correct translation availability status color of a ' +
      'contentId of active state',
    () => {
      ttams.activateTranslationMode();
      tls.setActiveLanguageCode('hi');
      tss.refresh();

      var activeStateContentIdStatusColor =
        tss.getActiveStateContentIdStatusColor('content_0');
      expect(activeStateContentIdStatusColor).toBe(NO_ASSETS_AVAILABLE_COLOR);
      activeStateContentIdStatusColor =
        tss.getActiveStateContentIdStatusColor('feedback_2');
      expect(activeStateContentIdStatusColor).toBe(NO_ASSETS_AVAILABLE_COLOR);
      activeStateContentIdStatusColor =
        tss.getActiveStateContentIdStatusColor('feedback_3');
      expect(activeStateContentIdStatusColor).toBe(ALL_ASSETS_AVAILABLE_COLOR);
    }
  );

  it(
    'should return correct needs update status of voice-over of active ' +
      'state contentId',
    () => {
      ttams.activateVoiceoverMode();
      srvs.init('First', ess.getRecordedVoiceoversMemento('First'));
      var activeStateContentIdNeedsUpdateStatus =
        tss.getActiveStateContentIdNeedsUpdateStatus('feedback_3');
      // To check that initially the state content id "feedback" does not
      // contain audio that needs update.
      expect(activeStateContentIdNeedsUpdateStatus).toBe(false);

      var value = srvs.displayed;
      value.toggleNeedsUpdateAttribute('feedback_3', 'en');
      srvs.saveDisplayedValue();
      activeStateContentIdNeedsUpdateStatus =
        tss.getActiveStateContentIdNeedsUpdateStatus('feedback_3');
      // To check that the state content id "feedback" contains audio that
      // needs update.
      expect(activeStateContentIdNeedsUpdateStatus).toBe(true);
    }
  );

  it(
    'should return correct needs update status of translation of active ' +
      'state contentId',
    () => {
      ttams.activateTranslationMode();
      tls.setActiveLanguageCode('hi');
      var activeStateContentIdNeedsUpdateStatus =
        tss.getActiveStateContentIdNeedsUpdateStatus('feedback_3');
      expect(activeStateContentIdNeedsUpdateStatus).toBe(false);

      tss.refresh();

      tss.entityTranslation.markTranslationAsNeedingUpdate('feedback_3');
      activeStateContentIdNeedsUpdateStatus =
        tss.getActiveStateContentIdNeedsUpdateStatus('feedback_3');
      expect(activeStateContentIdNeedsUpdateStatus).toBe(true);
    }
  );
});
