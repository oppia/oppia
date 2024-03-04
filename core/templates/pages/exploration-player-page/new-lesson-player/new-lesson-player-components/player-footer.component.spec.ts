// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for new player footer component.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { MockTranslateService } from 'components/forms/schema-based-editors/integration-tests/schema-based-editors.integration.spec';
import { StateCard } from 'domain/state_card/state-card.model';
import { UrlService } from 'services/contextual/url.service';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { ExplorationPlayerConstants } from '../../exploration-player-page.constants';
import { ExplorationEngineService } from '../../services/exploration-engine.service';
import { ExplorationPlayerStateService } from '../../services/exploration-player-state.service';
import { HelpCardEventResponse, PlayerPositionService } from '../../services/player-position.service';
import { PlayerTranscriptService } from '../../services/player-transcript.service';
import { PlayerFooterComponent } from './player-footer.component';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { SchemaFormSubmittedService } from 'services/schema-form-submitted.service';
import { ContentTranslationManagerService } from '../../services/content-translation-manager.service';
import { Interaction } from 'domain/exploration/InteractionObjectFactory';
import { RecordedVoiceovers } from 'domain/exploration/recorded-voiceovers.model';
import { AudioTranslationLanguageService } from '../../services/audio-translation-language.service';
import { LearnerViewInfoBackendApiService } from '../../services/learner-view-info-backend-api.service';
import { LoggerService } from 'services/contextual/logger.service';
import { UserService } from 'services/user.service';
import { FetchExplorationBackendResponse, ReadOnlyExplorationBackendApiService } from 'domain/exploration/read-only-exploration-backend-api.service';
import { LocalStorageService } from 'services/local-storage.service';
import { ContextService } from 'services/context.service';
import { WindowRef } from 'services/contextual/window-ref.service';

const sampleExpInfo = {
  category: 'dummy_category',
  community_owned: false,
  activity_type: 'dummy_type',
  last_updated_msec: 5000,
  ratings: {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0
  },
  id: 'dummy_id',
  created_on_msec: 2000,
  human_readable_contributors_summary: {},
  language_code: 'en',
  num_views: 500,
  objective: 'dummy_objective',
  status: 'private',
  tags: ['tag1', 'tag2'],
  thumbnail_bg_color: 'bg_color_test',
  thumbnail_icon_url: 'icon_url',
  title: 'expTitle'
};

class MockWindowRef {
  nativeWindow = {
    location: {
      pathname: '/learn/math',
      href: '',
      reload: () => {},
      toString: () => {
        return 'http://localhost:8181/?lang=es';
      }
    },
    localStorage: {
      last_uploaded_audio_lang: 'en',
      removeItem: (name: string) => {}
    },
    gtag: () => {},
    history: {
      pushState(data: object, title: string, url?: string | null) {}
    },
    document: {
      body: {
        style: {
          overflowY: 'auto',
        }
      }
    }
  };
}

describe('New player footer component', () => {
  let fixture: ComponentFixture<PlayerFooterComponent>;
  let componentInstance: PlayerFooterComponent;

  let urlService: UrlService;
  let mockWindowRef: MockWindowRef;
  let playerPositionService: PlayerPositionService;
  let explorationPlayerStateService: ExplorationPlayerStateService;
  let focusManagerService: FocusManagerService;
  let playerTranscriptService: PlayerTranscriptService;
  let windowDimensionsService: WindowDimensionsService;
  let i18nLanguageCodeService: I18nLanguageCodeService;
  let schemaFormSubmittedService: SchemaFormSubmittedService;
  let contentTranslationManagerService: ContentTranslationManagerService;
  let learnerViewInfoBackendApiService: LearnerViewInfoBackendApiService;
  let loggerService: LoggerService;
  let userService: UserService;
  let readOnlyExplorationBackendApiService:
    ReadOnlyExplorationBackendApiService;
  let localStorageService: LocalStorageService;
  let contextService: ContextService;

  let mockDisplayedCard = new StateCard(
    '', '', '', {} as Interaction, [],
    {} as RecordedVoiceovers, '', {} as AudioTranslationLanguageService);
  let mockDisplayedCard2 = new StateCard(
    'state', 'name', 'html', {} as Interaction, [],
    {} as RecordedVoiceovers, '', {} as AudioTranslationLanguageService);

  beforeEach(waitForAsync(() => {
    mockWindowRef = new MockWindowRef();
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      declarations: [
        PlayerFooterComponent,
        MockTranslatePipe
      ],
      providers: [
        ExplorationEngineService,
        ExplorationPlayerStateService,
        FocusManagerService,
        PlayerPositionService,
        PlayerTranscriptService,
        UrlService,
        WindowDimensionsService,
        SchemaFormSubmittedService,
        LearnerViewInfoBackendApiService,
        LoggerService,
        {
          provide: TranslateService,
          useClass: MockTranslateService
        },
        {
          provide: WindowRef,
          useValue: mockWindowRef
        },
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PlayerFooterComponent);
    componentInstance = fixture.componentInstance;
    urlService = TestBed.inject(UrlService);
    learnerViewInfoBackendApiService = TestBed.inject(
      LearnerViewInfoBackendApiService);
    loggerService = TestBed.inject(LoggerService);
    userService = TestBed.inject(UserService);
    contextService = TestBed.inject(ContextService);
    readOnlyExplorationBackendApiService = TestBed.inject(
      ReadOnlyExplorationBackendApiService);
    playerPositionService = TestBed.inject(PlayerPositionService);
    explorationPlayerStateService = TestBed.inject(
      ExplorationPlayerStateService);
    focusManagerService = TestBed.inject(FocusManagerService);
    playerTranscriptService = TestBed.inject(PlayerTranscriptService);
    windowDimensionsService = TestBed.inject(WindowDimensionsService);
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
    schemaFormSubmittedService = TestBed.inject(SchemaFormSubmittedService);
    contentTranslationManagerService = TestBed.inject(
      ContentTranslationManagerService);
    localStorageService = TestBed.inject(LocalStorageService);
    componentInstance.expInfo = sampleExpInfo;

    spyOn(i18nLanguageCodeService, 'isCurrentLanguageRTL').and.returnValue(
      true);
  });

  afterEach(() => {
    componentInstance.ngOnDestroy();
  });

  it('should initialize', fakeAsync(() => {
    let mockOnHelpCardAvailableEventEmitter = (
      new EventEmitter<HelpCardEventResponse>());
    let mockSchemaFormSubmittedEventEmitter = new EventEmitter<void>();

    spyOn(contextService, 'getExplorationId').and.returnValue('dummy_id');
    spyOn(componentInstance.submit, 'emit');
    spyOnProperty(playerPositionService, 'onHelpCardAvailable')
      .and.returnValue(mockOnHelpCardAvailableEventEmitter);
    spyOn(playerPositionService, 'getDisplayedCardIndex').and.returnValue(0);
    spyOnProperty(schemaFormSubmittedService, 'onSubmittedSchemaBasedForm')
      .and.returnValue(mockSchemaFormSubmittedEventEmitter);

    componentInstance.ngOnInit();
    mockOnHelpCardAvailableEventEmitter.emit({
      hasContinueButton: true
    } as HelpCardEventResponse);
    mockSchemaFormSubmittedEventEmitter.emit();
    tick();

    expect(componentInstance.explorationId).toEqual('dummy_id');
    expect(componentInstance.helpCardHasContinueButton).toBeTrue();
    expect(componentInstance.submit.emit).toHaveBeenCalled();
  }));

  it('should update displayed card info', fakeAsync(() => {
    let transcriptLength = 10;
    let displayedCardIndex = 0;

    spyOn(playerTranscriptService, 'getNumCards').and.returnValue(
      transcriptLength);
    spyOn(playerPositionService, 'getDisplayedCardIndex').and.returnValue(
      displayedCardIndex);
    spyOn(playerTranscriptService, 'isLastCard').and.returnValue(true);
    spyOn(explorationPlayerStateService, 'isInQuestionMode')
      .and.returnValue(true);
    spyOn(focusManagerService, 'setFocusWithoutScroll');

    componentInstance.displayedCard = mockDisplayedCard;
    spyOn(mockDisplayedCard, 'getInteractionId').and.returnValue('Continue');

    componentInstance.updateDisplayedCardInfo();
    tick();

    expect(playerTranscriptService.getNumCards).toHaveBeenCalled();
    expect(playerPositionService.getDisplayedCardIndex).toHaveBeenCalled();
    expect(playerTranscriptService.isLastCard).toHaveBeenCalled();
    expect(componentInstance.helpCardHasContinueButton).toBeFalse();
    expect(componentInstance.interactionIsInline).toEqual(
      mockDisplayedCard.isInteractionInline());
    expect(componentInstance.interactionCustomizationArgs).toEqual(
      mockDisplayedCard.getInteractionCustomizationArgs());
  }));

  it('should respond to state card content updates', fakeAsync(() => {
    let mockOnStateCardContentUpdate = new EventEmitter<void>();
    spyOn(componentInstance, 'updateDisplayedCardInfo');
    spyOnProperty(contentTranslationManagerService, 'onStateCardContentUpdate')
      .and.returnValue(mockOnStateCardContentUpdate);
    spyOn(contextService, 'getExplorationId').and.returnValue('dummy_id');

    componentInstance.ngOnInit();
    tick();
    expect(componentInstance.updateDisplayedCardInfo).not.toHaveBeenCalled();

    mockOnStateCardContentUpdate.emit();
    tick();

    expect(componentInstance.updateDisplayedCardInfo).toHaveBeenCalled();
  }));

  it('should state if window can show two cards', () => {
    spyOn(windowDimensionsService, 'getWidth').and.returnValue(
      ExplorationPlayerConstants.TWO_CARD_THRESHOLD_PX + 1);
    expect(componentInstance.canWindowShowTwoCards()).toBeTrue();
  });

  it('should state if generic submit button should be shown', () => {
    spyOn(componentInstance, 'doesInteractionHaveNavSubmitButton')
      .and.returnValues(false, true);
    spyOn(componentInstance, 'canWindowShowTwoCards').and.returnValue(false);

    expect(componentInstance.shouldGenericSubmitButtonBeShown()).toBeFalse();
    expect(componentInstance.shouldGenericSubmitButtonBeShown()).toBeTrue();
  });

  it('should state if continue button should be shown', () => {
    componentInstance.conceptCardIsBeingShown = true;
    expect(componentInstance.shouldContinueButtonBeShown()).toBeTrue();

    componentInstance.conceptCardIsBeingShown = false;
    componentInstance.interactionIsInline = false;
    expect(componentInstance.shouldContinueButtonBeShown()).toBeFalse();
  });

  it('should handle new continue button click correctly', () => {
    componentInstance.hasNext = true;
    componentInstance.displayedCardIndex = 0;
    componentInstance.navigationThroughCardHistoryIsEnabled = true;
    spyOn(componentInstance, 'validateIndexAndChangeCard');
    spyOn(componentInstance.clickContinueButton, 'emit');
    spyOn(componentInstance.clickContinueToReviseButton, 'emit');

    componentInstance.handleNewContinueButtonClick();
    expect(componentInstance.validateIndexAndChangeCard).
      toHaveBeenCalledWith(componentInstance.displayedCardIndex + 1);

    componentInstance.hasNext = false;
    spyOn(componentInstance, 'shouldContinueButtonBeShown')
      .and.returnValues(true, false);
    componentInstance.handleNewContinueButtonClick();
    expect(componentInstance.clickContinueButton.emit).toHaveBeenCalled();

    componentInstance.showContinueToReviseButton = true;
    componentInstance.handleNewContinueButtonClick();
    expect(componentInstance.clickContinueToReviseButton.emit)
      .toHaveBeenCalled();
  });

  it('should change card', () => {
    componentInstance.transcriptLength = 5;
    spyOn(componentInstance.changeCard, 'emit');
    componentInstance.validateIndexAndChangeCard(0);
    expect(componentInstance.changeCard.emit).toHaveBeenCalled();

    expect(() => {
      componentInstance.validateIndexAndChangeCard(-1);
    }).toThrowError('Target card index out of bounds.');
  });

  it('should state if interaction has a submit nav button', () => {
    componentInstance.interactionId = 'ImageClickInput';
    expect(componentInstance.doesInteractionHaveNavSubmitButton()).toBeFalse();

    componentInstance.interactionId = 'not_valid';
    expect(() => {
      componentInstance.doesInteractionHaveNavSubmitButton();
    }).toThrowError();
  });

  it('should update displayed card info when view updates', () => {
    spyOn(componentInstance, 'updateDisplayedCardInfo');
    componentInstance.lastDisplayedCard = mockDisplayedCard2;
    componentInstance.displayedCard = mockDisplayedCard;
    componentInstance.ngOnChanges();

    expect(componentInstance.lastDisplayedCard).toEqual(mockDisplayedCard);
    expect(componentInstance.updateDisplayedCardInfo).toHaveBeenCalled();
  });

  it('should get completed progress-bar width', () => {
    componentInstance.checkpointCount = 3;
    componentInstance.completedCheckpointsCount = 0;
    expect(componentInstance.getCompletedProgressBarWidth()).toEqual(0);

    componentInstance.completedCheckpointsCount = 1;
    expect(componentInstance.getCompletedProgressBarWidth()).toEqual(25);

    componentInstance.completedCheckpointsCount = 2;
    expect(componentInstance.getCompletedProgressBarWidth()).toEqual(75);
  });

  it('should round progress percentage to the nearest whole number', () => {
    componentInstance.completedCheckpointsCount = 2;
    componentInstance.checkpointCount = 7;
    expect(componentInstance.getProgressPercentage()).toEqual('28');
  });

  it('should fetch number of checkpoints correctly', fakeAsync(() => {
    let sampleDataResults: FetchExplorationBackendResponse = {
      exploration_id: 'expId',
      displayable_language_codes: [],
      is_logged_in: true,
      session_id: 'KERH',
      exploration: {
        init_state_name: 'Introduction',
        next_content_id_index: 5,
        param_changes: [],
        param_specs: null,
        title: 'Exploration',
        language_code: 'en',
        objective: 'To learn',
        states: {
          Introduction: {
            param_changes: [],
            classifier_model_id: null,
            recorded_voiceovers: null,
            solicit_answer_details: true,
            card_is_checkpoint: true,
            linked_skill_id: null,
            content: {
              html: '',
              content_id: 'content'
            },
            interaction: {
              customization_args: {},
              answer_groups: [],
              solution: null,
              hints: [],
              default_outcome: {
                param_changes: [],
                dest_if_really_stuck: null,
                dest: 'Introduction',
                feedback: {
                  html: '',
                  content_id: 'content'
                },
                labelled_as_correct: true,
                refresher_exploration_id: 'exp',
                missing_prerequisite_skill_id: null
              },
              confirmed_unclassified_answers: [],
              id: null
            }
          }
        }
      },
      exploration_metadata: {
        title: 'Exploration',
        category: 'Algebra',
        objective: 'To learn',
        language_code: 'en',
        tags: [],
        blurb: '',
        author_notes: '',
        states_schema_version: 50,
        init_state_name: 'Introduction',
        param_specs: {},
        param_changes: [],
        auto_tts_enabled: false,
        edits_allowed: true
      },
      version: 1,
      can_edit: true,
      preferred_audio_language_code: 'en',
      preferred_language_codes: [],
      auto_tts_enabled: true,
      record_playthrough_probability: 1,
      draft_change_list_id: 0,
      has_viewed_lesson_info_modal_once: false,
      furthest_reached_checkpoint_exp_version: 1,
      furthest_reached_checkpoint_state_name: 'State B',
      most_recently_reached_checkpoint_state_name: 'State A',
      most_recently_reached_checkpoint_exp_version: 1
    };

    componentInstance.explorationId = 'expId';

    spyOn(readOnlyExplorationBackendApiService, 'fetchExplorationAsync')
      .and.returnValue(Promise.resolve(sampleDataResults));
    expect(componentInstance.checkpointCount).toEqual(0);

    componentInstance.getCheckpointCount();
    tick();

    expect(componentInstance.expStates).
      toEqual(sampleDataResults.exploration.states);
    expect(componentInstance.checkpointCount).toEqual(1);
  }));

  it('should generate checkpoint status array upon initialization', () => {
    spyOn(componentInstance, 'getMostRecentlyReachedCheckpointIndex')
      .and.returnValues(2, 1);

    componentInstance.checkpointCount = 3;
    componentInstance.updateLessonProgressBar();
    expect(componentInstance.checkpointStatusArray).toEqual(
      ['completed', 'in-progress', 'incomplete']);

    componentInstance.checkpointCount = 1;
    componentInstance.updateLessonProgressBar();
    expect(componentInstance.checkpointStatusArray).toEqual(
      ['in-progress']);

    componentInstance.checkpointCount = 3;
    componentInstance.completedCheckpointsCount = 3;
    componentInstance.expEnded = true;
    componentInstance.updateLessonProgressBar();
    expect(componentInstance.checkpointStatusArray).toEqual(
      ['completed', 'completed', 'completed']);
  });

  it('should return correct checkpoint progress percentage', () => {
    componentInstance.completedCheckpointsCount = 0;
    componentInstance.checkpointCount = 5;
    expect(componentInstance.getProgressPercentage()).toEqual('0');

    componentInstance.completedCheckpointsCount = 5;
    componentInstance.checkpointCount = 5;
    expect(componentInstance.getProgressPercentage()).toEqual('100');

    componentInstance.completedCheckpointsCount = 1;
    componentInstance.checkpointCount = 4;
    expect(componentInstance.getProgressPercentage()).toEqual('25');
  });

  it('should check if progress reminder modal can be shown and show it', () => {
    const recentlyReachedCheckpointSpy =
      spyOn(componentInstance, 'getMostRecentlyReachedCheckpointIndex')
        .and.returnValue(1);
    spyOn(componentInstance, 'openProgressReminderModal');
    componentInstance.showProgressReminderModal();
    expect(componentInstance.openProgressReminderModal).not.toHaveBeenCalled();

    recentlyReachedCheckpointSpy.and.returnValue(3);
    componentInstance.expInfo = sampleExpInfo;
    componentInstance.showProgressReminderModal();
    expect(componentInstance.openProgressReminderModal).toHaveBeenCalled();
  });

  it('should handle error if backend call to learnerViewInfoBackendApiService' +
  ' fails while opening progress reminder modal', fakeAsync(() => {
    componentInstance.explorationId = 'expId';
    componentInstance.expInfo = null;
    spyOn(learnerViewInfoBackendApiService, 'fetchLearnerInfoAsync')
      .and.returnValue(Promise.reject());
    spyOn(componentInstance, 'getMostRecentlyReachedCheckpointIndex')
      .and.returnValue(3);
    spyOn(loggerService, 'error');

    componentInstance.showProgressReminderModal();
    tick();

    expect(loggerService.error).toHaveBeenCalled();
  }));

  it('should throw error if unique url id is null', fakeAsync(() => {
    spyOn(userService, 'getLoginUrlAsync').and.returnValue(
      Promise.resolve('https://oppia.org/login'));
    componentInstance.loggedOutProgressUniqueUrlId = null;
    expect(() => {
      componentInstance.onLoginButtonClicked();
      tick();
    }).toThrowError();
  }));

  it('should correctly set logged-out progress learner URL ' +
    'when unique progress URL ID exists', fakeAsync (() => {
    spyOn(explorationPlayerStateService, 'isInStoryChapterMode')
      .and.returnValue(true);
    spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue('');
    spyOn(urlService, 'getClassroomUrlFragmentFromLearnerUrl')
      .and.returnValue('');
    spyOn(urlService, 'getOrigin').and.returnValue('https://oppia.org');
    spyOn(urlService, 'getStoryUrlFragmentFromLearnerUrl').and.returnValue('');
    spyOn(explorationPlayerStateService, 'getUniqueProgressUrlId')
      .and.returnValue('abcdef');
    spyOn(contextService, 'getExplorationId').and.returnValue('dummy_id');

    componentInstance.ngOnInit();

    expect(componentInstance.loggedOutProgressUniqueUrl).toEqual(
      'https://oppia.org/progress/abcdef');
  }));

  it('should save logged-out learner progress correctly', fakeAsync(() => {
    spyOn(explorationPlayerStateService, 'setUniqueProgressUrlId')
      .and.returnValue(Promise.resolve());
    spyOn(explorationPlayerStateService, 'getUniqueProgressUrlId')
      .and.returnValue('abcdef');
    spyOn(urlService, 'getOrigin').and.returnValue('https://oppia.org');

    componentInstance.saveLoggedOutProgress();
    tick(100);

    expect(componentInstance.loggedOutProgressUniqueUrl).toEqual(
      'https://oppia.org/progress/abcdef');
    expect(componentInstance.loggedOutProgressUniqueUrlId).toEqual('abcdef');
  }));

  it('should store unique progress URL ID when login button is clicked',
    fakeAsync(() => {
      spyOn(userService, 'getLoginUrlAsync').and.returnValue(
        Promise.resolve('https://oppia.org/login'));
      spyOn(localStorageService, 'updateUniqueProgressIdOfLoggedOutLearner');
      componentInstance.loggedOutProgressUniqueUrlId = 'abcdef';
      expect(mockWindowRef.nativeWindow.location.href).toEqual('');

      componentInstance.onLoginButtonClicked();
      tick(100);

      expect(localStorageService.updateUniqueProgressIdOfLoggedOutLearner)
        .toHaveBeenCalledWith('abcdef');
      expect(mockWindowRef.nativeWindow.location.href).toEqual(
        'https://oppia.org/login');
    })
  );

  it('should correctly close save progress menu', () => {
    componentInstance.saveProgressMenuIsShown = true;

    componentInstance.closeSaveProgressMenu();

    expect(componentInstance.saveProgressMenuIsShown).toBeFalse();
  });
});
