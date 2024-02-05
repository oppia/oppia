// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the checkpoint celebration modal component.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, waitForAsync, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { EventEmitter } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MockTranslateService } from 'components/forms/schema-based-editors/integration-tests/schema-based-editors.integration.spec';
import { CheckpointCelebrationModalComponent } from './checkpoint-celebration-modal.component';
import { CheckpointCelebrationUtilityService } from 'pages/exploration-player-page/services/checkpoint-celebration-utility.service';
import { ReadOnlyExplorationBackendApiService } from 'domain/exploration/read-only-exploration-backend-api.service';
import { ContextService } from 'services/context.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { PlayerPositionService } from 'pages/exploration-player-page/services/player-position.service';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { StateCard } from 'domain/state_card/state-card.model';
import { RecordedVoiceovers } from 'domain/exploration/recorded-voiceovers.model';
import { InteractionObjectFactory } from 'domain/exploration/InteractionObjectFactory';
import { AudioTranslationLanguageService } from 'pages/exploration-player-page/services/audio-translation-language.service';
import { StateObjectsBackendDict } from 'domain/exploration/StatesObjectFactory';
import { PlatformFeatureService } from 'services/platform-feature.service';
import { ExplorationPlayerStateService } from 'pages/exploration-player-page/services/exploration-player-state.service';
import { FeatureStatusChecker } from 'domain/feature-flag/feature-status-summary.model';

class MockCheckpointCelebrationUtilityService {
  isOnCheckpointedState = false;
  openLessonInformationModalEmitter = new EventEmitter<void>();

  getStateListForCheckpointMessages(
      statesbackendDict: StateObjectsBackendDict, initStateName: string
  ): string[] {
    return [];
  }

  getCheckpointMessage(
      completedCheckpointCount: number, totalCheckpointCount: number
  ): string {
    return '';
  }

  getCheckpointTitle(): string {
    return '';
  }

  setIsOnCheckpointedState(isOnCheckpointedState: boolean) {
    this.isOnCheckpointedState = isOnCheckpointedState;
  }

  getIsOnCheckpointedState(): boolean {
    return this.isOnCheckpointedState;
  }

  openLessonInformationModal() {
    this.openLessonInformationModalEmitter.emit();
  }
}

class MockPlatformFeatureService {
  get status(): object {
    return {
      CheckpointCelebration: {
        isEnabled: true
      }
    };
  }
}

const dummyExplorationBackendDict = {
  init_state_name: 'Introduction',
  param_changes: [],
  param_specs: {},
  states: {
    Introduction: {
      classifier_model_id: null,
      content: {
        content_id: 'content',
        html: ''
      },
      recorded_voiceovers: {
        voiceovers_mapping: {
          content: {},
          default_outcome: {}
        }
      },
      interaction: {
        answer_groups: [],
        confirmed_unclassified_answers: [],
        customization_args: {
          buttonText: {
            value: 'Continue'
          }
        },
        default_outcome: {
          dest: 'End State',
          dest_if_really_stuck: null,
          feedback: {
            content_id: 'default_outcome',
            html: ''
          },
          param_changes: [],
          labelled_as_correct: true,
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null
        },
        hints: [],
        solution: null,
        id: 'Continue'
      },
      linked_skill_id: null,
      param_changes: [],
      solicit_answer_details: false,
      card_is_checkpoint: true
    },
    'End State': {
      classifier_model_id: null,
      content: {
        content_id: 'content',
        html: ''
      },
      recorded_voiceovers: {
        voiceovers_mapping: {
          content: {},
          default_outcome: {}
        }
      },
      interaction: {
        answer_groups: [],
        confirmed_unclassified_answers: [],
        customization_args: {
          recommendedExplorationIds: {
            value: []
          }
        },
        default_outcome: null,
        hints: [],
        solution: null,
        id: 'EndExploration'
      },
      linked_skill_id: null,
      param_changes: [],
      solicit_answer_details: false,
      card_is_checkpoint: false
    }
  },
  title: 'Dummy Title',
  language_code: 'en',
  objective: 'Dummy Objective',
  next_content_id_index: 4
};

const dummyExplorationMetadata = {
  title: 'Dummy Title',
  category: 'Dummy Category',
  objective: 'Dummy Objective',
  language_code: 'en',
  tags: [],
  blurb: 'Dummy Blurb',
  author_notes: 'Dummy Author Notes',
  states_schema_version: 50,
  init_state_name: 'Introduction',
  param_specs: {},
  param_changes: [],
  auto_tts_enabled: false,
  edits_allowed: true,
};

const dummyExplorationBackendResponse = {
  can_edit: true,
  exploration: dummyExplorationBackendDict,
  exploration_metadata: dummyExplorationMetadata,
  exploration_id: '0',
  is_logged_in: true,
  session_id: 'dummy_session_id',
  version: 1,
  preferred_audio_language_code: 'en',
  preferred_language_codes: ['en'],
  auto_tts_enabled: false,
  record_playthrough_probability: 1.0,
  draft_change_list_id: 1,
  has_viewed_lesson_info_modal_once: false,
  furthest_reached_checkpoint_exp_version: 0,
  furthest_reached_checkpoint_state_name: '',
  most_recently_reached_checkpoint_state_name: 'Introduction',
  most_recently_reached_checkpoint_exp_version: 0,
  displayable_language_codes: []
};

describe('Checkpoint celebration modal component', function() {
  let component: CheckpointCelebrationModalComponent;
  let fixture: ComponentFixture<CheckpointCelebrationModalComponent>;
  let checkpointCelebrationUtilityService:
    CheckpointCelebrationUtilityService;
  let readOnlyExplorationBackendApiService:
    ReadOnlyExplorationBackendApiService;
  let contextService: ContextService;
  let i18nLanguageCodeService: I18nLanguageCodeService;
  let playerPositionService: PlayerPositionService;
  let windowDimensionsService: WindowDimensionsService;
  let urlInterpolationService: UrlInterpolationService;
  let interactionObjectFactory: InteractionObjectFactory;
  let audioTranslationLanguageService: AudioTranslationLanguageService;
  let platformFeatureService: PlatformFeatureService;
  let explorationPlayerStateService: ExplorationPlayerStateService;
  let dummyStateCard: StateCard;
  let mockResizeEmitter: EventEmitter<void>;


  beforeEach(waitForAsync(() => {
    mockResizeEmitter = new EventEmitter();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [CheckpointCelebrationModalComponent],
      providers: [
        ReadOnlyExplorationBackendApiService,
        ContextService,
        I18nLanguageCodeService,
        PlayerPositionService,
        UrlInterpolationService,
        InteractionObjectFactory,
        AudioTranslationLanguageService,
        ExplorationPlayerStateService,
        {
          provide: PlatformFeatureService,
          useClass: MockPlatformFeatureService
        },
        {
          provide: WindowDimensionsService,
          useValue: {
            getWidth: () => 1369,
            getResizeEvent: () => mockResizeEmitter,
          }
        },
        {
          provide: CheckpointCelebrationUtilityService,
          useClass: MockCheckpointCelebrationUtilityService
        },
        {
          provide: TranslateService,
          useClass: MockTranslateService
        }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    checkpointCelebrationUtilityService = TestBed.inject(
      CheckpointCelebrationUtilityService);
    readOnlyExplorationBackendApiService = TestBed.inject(
      ReadOnlyExplorationBackendApiService);
    contextService = TestBed.inject(ContextService);
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
    playerPositionService = TestBed.inject(PlayerPositionService);
    windowDimensionsService = TestBed.inject(WindowDimensionsService);
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    interactionObjectFactory = TestBed.inject(InteractionObjectFactory);
    audioTranslationLanguageService = TestBed.inject(
      AudioTranslationLanguageService);
    platformFeatureService = TestBed.inject(PlatformFeatureService);
    explorationPlayerStateService = TestBed.inject(
      ExplorationPlayerStateService);
    fixture = TestBed.createComponent(CheckpointCelebrationModalComponent);
    component = fixture.componentInstance;

    dummyStateCard = StateCard.createNewCard(
      'State 2', '<p>Content</p>', '<interaction></interaction>',
      interactionObjectFactory.createFromBackendDict({
        id: 'TextInput',
        answer_groups: [
          {
            outcome: {
              dest: 'State',
              dest_if_really_stuck: null,
              feedback: {
                html: '',
                content_id: 'This is a new feedback text',
              },
              refresher_exploration_id: 'test',
              missing_prerequisite_skill_id: 'test_skill_id',
              labelled_as_correct: true,
              param_changes: [],
            },
            rule_specs: [],
            training_data: [],
            tagged_skill_misconception_id: '',
          },
        ],
        default_outcome: {
          dest: 'Hola',
          dest_if_really_stuck: null,
          feedback: {
            content_id: '',
            html: '',
          },
          labelled_as_correct: true,
          param_changes: [],
          refresher_exploration_id: 'test',
          missing_prerequisite_skill_id: 'test_skill_id',
        },
        confirmed_unclassified_answers: [],
        customization_args: {
          rows: {
            value: true,
          },
          placeholder: {
            value: 1,
          },
          catchMisspellings: {
            value: false
          }
        },
        hints: [],
        solution: {
          answer_is_exclusive: true,
          correct_answer: 'test_answer',
          explanation: {
            content_id: '2',
            html: 'test_explanation1',
          },
        }
      }),
      RecordedVoiceovers.createEmpty(),
      'content', audioTranslationLanguageService);
  });

  it('should initialize the component', fakeAsync(() => {
    spyOn(contextService, 'getExplorationId').and.returnValue('expId');
    spyOn(urlInterpolationService, 'getStaticImageUrl').and.returnValue(
      'dummyStaticImageUrl');
    spyOn(readOnlyExplorationBackendApiService, 'fetchExplorationAsync')
      .and.returnValue(Promise.resolve(dummyExplorationBackendResponse));
    spyOn(
      checkpointCelebrationUtilityService, 'getStateListForCheckpointMessages')
      .and.returnValue(['Introduction', 'End State']);
    spyOn(component, 'subscribeToCardChangeEmitter');
    spyOn(component, 'subscribeToWindowResizeEmitter');
    spyOn(component, 'setFadeInDelaysForCheckpointNodes');
    spyOn(windowDimensionsService, 'getWidth').and.callThrough();

    expect(component.shouldDisplayFullScaleMessage).toBe(true);

    component.ngOnInit();
    tick();

    expect(component.explorationId).toEqual('expId');
    expect(component.oppiaAvatarImageUrl).toEqual('dummyStaticImageUrl');
    expect(readOnlyExplorationBackendApiService.fetchExplorationAsync)
      .toHaveBeenCalledWith('expId', null);
    expect(component.hasViewedLessonInfoOnce).toEqual(false);
    expect(component.mostRecentlyReachedCheckpointStateName).toEqual(
      'Introduction');
    expect(component.orderedCheckpointList).toEqual(
      ['Introduction', 'End State']);
    expect(
      checkpointCelebrationUtilityService.getStateListForCheckpointMessages)
      .toHaveBeenCalled();
    expect(component.totalNumberOfCheckpoints).toEqual(2);
    expect(component.checkpointStatusArray.length).toEqual(2);
    expect(component.setFadeInDelaysForCheckpointNodes).toHaveBeenCalled();
    expect(component.currentStateName).toEqual('Introduction');
    expect(component.subscribeToCardChangeEmitter).toHaveBeenCalled();
    expect(windowDimensionsService.getWidth).toHaveBeenCalled();
    expect(component.shouldDisplayFullScaleMessage).toEqual(false);
    expect(component.subscribeToWindowResizeEmitter).toHaveBeenCalled();
  }));

  it('should unsubscribe upon component destruction', () => {
    spyOn(component.directiveSubscriptions, 'unsubscribe');

    component.ngOnDestroy();

    expect(component.directiveSubscriptions.unsubscribe).toHaveBeenCalled();
  });

  it('should execute callback when newCard emitter emits', fakeAsync(() => {
    spyOn(playerPositionService.onNewCardOpened, 'subscribe').and.callThrough();
    spyOn(checkpointCelebrationUtilityService, 'setIsOnCheckpointedState');
    spyOn(component, 'dismissMessage');
    spyOn(component, 'dismissMiniMessage');
    spyOn(component, 'checkIfCheckpointMessageIsToBeTriggered');
    component.miniMessageTooltipIsShown = true;
    component.messageModalIsShown = false;
    component.subscribeToCardChangeEmitter();

    playerPositionService.onNewCardOpened.emit(dummyStateCard);
    tick();

    expect(checkpointCelebrationUtilityService.setIsOnCheckpointedState)
      .toHaveBeenCalledWith(false);
    expect(component.dismissMiniMessage).toHaveBeenCalled();
    tick(2300);
    expect(component.checkIfCheckpointMessageIsToBeTriggered)
      .toHaveBeenCalled();

    component.miniMessageTooltipIsShown = false;
    component.messageModalIsShown = true;

    playerPositionService.onNewCardOpened.emit(dummyStateCard);
    tick();

    expect(component.dismissMessage).toHaveBeenCalled();
    tick(2300);
    expect(component.checkIfCheckpointMessageIsToBeTriggered)
      .toHaveBeenCalledTimes(2);

    component.miniMessageTooltipIsShown = false;
    component.messageModalIsShown = false;

    playerPositionService.onNewCardOpened.emit(dummyStateCard);
    tick();

    expect(component.checkIfCheckpointMessageIsToBeTriggered)
      .toHaveBeenCalledTimes(3);
  }));

  it('should execute callback when window resize emitter emits',
    () => {
      expect(component.shouldDisplayFullScaleMessage).toEqual(true);

      component.subscribeToWindowResizeEmitter();
      mockResizeEmitter.emit();

      expect(component.shouldDisplayFullScaleMessage).toEqual(false);
    });

  it('should check if checkpoint message is to be triggered', () => {
    component.orderedCheckpointList = [
      'Introduction',
      'MostRecentlyReachedCheckpointStateName',
      'NewStateName',
      'EndState'
    ];
    spyOn(checkpointCelebrationUtilityService, 'getCheckpointMessage')
      .and.returnValue('test_checkpoint_message');
    spyOn(checkpointCelebrationUtilityService, 'getCheckpointTitle')
      .and.returnValue('test_checkpoint_title');
    spyOn(component, 'generateCheckpointStatusArray');
    spyOn(checkpointCelebrationUtilityService, 'setIsOnCheckpointedState');
    spyOn(component, 'triggerStandardMessage');
    spyOn(component, 'triggerMiniMessage');
    spyOn(explorationPlayerStateService, 'isInStoryChapterMode')
      .and.returnValue(true);
    component.currentStateName = 'Introduction';
    component.mostRecentlyReachedCheckpointStateName = (
      'MostRecentlyReachedCheckpointStateName');

    component.checkIfCheckpointMessageIsToBeTriggered('Introduction');
    component.checkIfCheckpointMessageIsToBeTriggered(
      'MostRecentlyReachedCheckpointStateName');

    expect(checkpointCelebrationUtilityService.getCheckpointMessage)
      .not.toHaveBeenCalled();

    component.checkIfCheckpointMessageIsToBeTriggered('NonCheckpointStateName');

    expect(checkpointCelebrationUtilityService.getCheckpointMessage)
      .not.toHaveBeenCalled();

    component.currentStateName = 'Introduction';
    component.hasViewedLessonInfoOnce = false;

    component.checkIfCheckpointMessageIsToBeTriggered('NewStateName');

    expect(checkpointCelebrationUtilityService.getCheckpointMessage)
      .not.toHaveBeenCalled();
    expect(component.hasViewedLessonInfoOnce).toEqual(true);

    component.currentStateName = 'Introduction';
    component.hasViewedLessonInfoOnce = true;
    component.shouldDisplayFullScaleMessage = true;

    component.checkIfCheckpointMessageIsToBeTriggered('NewStateName');

    expect(checkpointCelebrationUtilityService.getCheckpointMessage)
      .toHaveBeenCalled();
    expect(component.translatedCurrentCheckpointMessage).toEqual(
      'test_checkpoint_message');
    expect(component.translatedCurrentCheckpointMessageTitle).toEqual(
      'test_checkpoint_title');
    expect(component.generateCheckpointStatusArray).toHaveBeenCalled();
    expect(component.triggerStandardMessage).toHaveBeenCalled();

    component.currentStateName = 'Introduction';
    component.hasViewedLessonInfoOnce = true;
    component.shouldDisplayFullScaleMessage = false;
    component.translatedCurrentCheckpointMessage = null;
    component.translatedCurrentCheckpointMessageTitle = null;

    component.checkIfCheckpointMessageIsToBeTriggered('NewStateName');

    expect(checkpointCelebrationUtilityService.getCheckpointMessage)
      .toHaveBeenCalledTimes(2);
    expect(component.translatedCurrentCheckpointMessage).toEqual(
      'test_checkpoint_message');
    expect(component.translatedCurrentCheckpointMessageTitle).toEqual(
      'test_checkpoint_title');
    expect(component.generateCheckpointStatusArray).toHaveBeenCalledTimes(2);
    expect(component.triggerMiniMessage).toHaveBeenCalled();
  });

  it('should not trigger checkpoint message if feature is disabled', () => {
    component.orderedCheckpointList = [
      'Introduction',
      'MostRecentlyReachedCheckpointStateName',
      'NewStateName',
      'EndState'
    ];
    component.currentStateName = 'Introduction';
    component.mostRecentlyReachedCheckpointStateName = (
      'MostRecentlyReachedCheckpointStateName');
    spyOn(explorationPlayerStateService, 'isInStoryChapterMode')
      .and.returnValue(true);
    spyOn(checkpointCelebrationUtilityService, 'getCheckpointMessage');
    spyOnProperty(platformFeatureService, 'status', 'get').and.returnValue(
      {
        CheckpointCelebration: {
          isEnabled: false
        }
      } as FeatureStatusChecker
    );

    component.checkIfCheckpointMessageIsToBeTriggered('NewStateName');

    expect(checkpointCelebrationUtilityService.getCheckpointMessage)
      .not.toHaveBeenCalled();
  });

  it('should not trigger checkpoint message if not in story mode', () => {
    component.orderedCheckpointList = [
      'Introduction',
      'MostRecentlyReachedCheckpointStateName',
      'NewStateName',
      'EndState'
    ];
    component.currentStateName = 'Introduction';
    component.mostRecentlyReachedCheckpointStateName = (
      'MostRecentlyReachedCheckpointStateName');
    spyOn(explorationPlayerStateService, 'isInStoryChapterMode')
      .and.returnValue(false);
    spyOn(checkpointCelebrationUtilityService, 'getCheckpointMessage');

    component.checkIfCheckpointMessageIsToBeTriggered('NewStateName');

    expect(checkpointCelebrationUtilityService.getCheckpointMessage)
      .not.toHaveBeenCalled();
  });

  it('should generate checkpoint status array', () => {
    component.checkpointNodesAreVisible = false;
    component.checkpointStatusArray = new Array(8);
    component.currentCheckpointPosition = 4;
    component.totalNumberOfCheckpoints = 8;

    component.generateCheckpointStatusArray();

    expect(component.checkpointStatusArray).toEqual([
      'completed', 'completed', 'completed', 'completed',
      'in-progress', 'incomplete', 'incomplete', 'incomplete'
    ]);
    expect(component.checkpointNodesAreVisible).toEqual(true);
  });

  it('should get completed progress bar width', () => {
    component.messageModalIsShown = false;

    expect(component.getCompletedProgressBarWidth()).toEqual(0);

    component.currentCheckpointPosition = 0;
    component.totalNumberOfCheckpoints = 5;
    component.messageModalIsShown = true;

    expect(component.getCompletedProgressBarWidth()).toEqual(0);

    component.currentCheckpointPosition = 2;

    expect(component.getCompletedProgressBarWidth()).toEqual(37.5);
  });

  it('should set fade-in delays for checkpoint nodes', () => {
    component.totalNumberOfCheckpoints = 5;
    component.checkpointNodeFadeInDelays = new Array(5);

    component.setFadeInDelaysForCheckpointNodes();

    const expectedDelays = [2.2, 2.5, 2.8, 3.1, 3.4];

    component.checkpointNodeFadeInDelays.forEach((delay, index) => {
      expect(delay).withContext(`fade-in delay for checkpoint ${index}`)
        .toBeCloseTo(expectedDelays[index]);
    });
  });

  it('should trigger standard message', fakeAsync(() => {
    component.messageModalIsShown = false;
    component.checkpointNodesAreVisible = true;
    spyOn(component, 'resetTimer');

    component.triggerStandardMessage();

    expect(component.messageModalIsShown).toEqual(true);
    expect(component.resetTimer).toHaveBeenCalled();

    tick(15100);

    expect(component.messageModalIsShown).toEqual(false);
    expect(component.checkpointNodesAreVisible).toEqual(false);
  }));

  it('should trigger mini message', fakeAsync(() => {
    component.miniMessageTooltipIsShown = false;

    component.triggerMiniMessage();

    expect(component.miniMessageTooltipIsShown).toEqual(true);

    tick(6500);

    expect(component.miniMessageTooltipIsShown).toEqual(false);
  }));

  it('should dismiss message', fakeAsync(() => {
    let mockSetTimeout = setTimeout(() => {});
    component.autoMessageDismissalTimeout = mockSetTimeout;
    component.messageModalIsShown = true;
    component.messageModalIsDismissed = false;
    component.checkpointNodesAreVisible = true;

    component.dismissMessage();

    expect(component.messageModalIsShown).toEqual(false);
    expect(component.messageModalIsDismissed).toEqual(true);
    expect(component.checkpointNodesAreVisible).toEqual(false);

    tick(2500);

    expect(component.messageModalIsDismissed).toEqual(false);
  }));

  it('should dismiss mini message', fakeAsync(() => {
    component.miniMessageTooltipIsShown = true;
    component.miniMessageTooltipIsDismissed = false;

    component.dismissMiniMessage();

    expect(component.miniMessageTooltipIsShown).toEqual(false);
    expect(component.miniMessageTooltipIsDismissed).toEqual(true);

    tick(2500);

    expect(component.miniMessageTooltipIsDismissed).toEqual(false);
  }));

  it('should reset timer', () => {
    component.checkpointTimerTemplateRef = {
      nativeElement: {
        // This throws "Type
        // '{ strokeDasharray: string; strokeDashoffset: string; }' is missing
        // the following properties from type 'CSSStyleDeclaration':
        // accentColor, alignContent, alignItems, alignSelf, and 457 more.".
        // We need to suppress this error because only these values are
        // needed for testing and providing a value for every single property is
        // unnecessary.
        // @ts-expect-error
        style: {
          strokeDashoffset: '',
          transitionDuration: '',
        }
      }
    };
    const rtlSpy = spyOn(i18nLanguageCodeService, 'isLanguageRTL')
      .and.returnValue(false);
    component.shouldDisplayFullScaleMessage = false;

    component.resetTimer();

    expect(component.checkpointTimer).toBeNull();

    component.shouldDisplayFullScaleMessage = true;

    component.resetTimer();

    expect(rtlSpy).toHaveBeenCalled();
    expect(component.checkpointTimer).toEqual({
      style: {
        strokeDashoffset: '10',
        transitionDuration: '12.14s',
      }
    });

    rtlSpy.and.returnValue(true);

    component.resetTimer();

    expect(rtlSpy).toHaveBeenCalledTimes(2);
    expect(component.checkpointTimer).toEqual({
      style: {
        strokeDashoffset: '-10',
        transitionDuration: '12.14s',
      }
    });
  });

  it('should open lesson info modal', () => {
    spyOn(checkpointCelebrationUtilityService, 'openLessonInformationModal');

    component.openLessonInfoModal();

    expect(checkpointCelebrationUtilityService.openLessonInformationModal)
      .toHaveBeenCalled();
  });

  it('should not open lesson info modal if feature is disabled', () => {
    spyOn(checkpointCelebrationUtilityService, 'openLessonInformationModal');
    spyOnProperty(platformFeatureService, 'status', 'get').and.returnValue(
      {
        CheckpointCelebration: {
          isEnabled: false
        }
      } as FeatureStatusChecker
    );

    component.openLessonInfoModal();

    expect(checkpointCelebrationUtilityService.openLessonInformationModal)
      .not.toHaveBeenCalled();
  });

  it('should determine if current language is RTL', () => {
    const isLanguageRTLSpy = spyOn(
      i18nLanguageCodeService, 'isCurrentLanguageRTL').and.returnValue(true);

    expect(component.isLanguageRTL()).toBe(true);

    isLanguageRTLSpy.and.returnValue(false);

    expect(component.isLanguageRTL()).toBe(false);
  });
});
