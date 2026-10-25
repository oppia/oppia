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
 * @fileoverview Behavior tests for the conversation skin component.
 */

import {StateCard} from 'domain/state_card/state-card.model';
import {EventEmitter, NO_ERRORS_SCHEMA} from '@angular/core';
import {WindowRef} from 'services/contextual/window-ref.service';
import {AlertsService} from 'services/alerts.service';
import {PageContextService} from 'services/page-context.service';
import {
  CurrentInteractionService,
  OnSubmitFn,
} from '../../services/current-interaction.service';
import {ExplorationRecommendationsService} from '../../services/exploration-recommendations.service';
import {HintsAndSolutionManagerService} from '../../services/hints-and-solution-manager.service';
import {
  I18nLanguageCodeService,
  TranslationKeyType,
} from 'services/i18n-language-code.service';
import {ImagePreloaderService} from '../../services/image-preloader.service';
import {LearnerAnswerInfoService} from '../../services/learner-answer-info.service';
import {LearnerParamsService} from '../../services/learner-params.service';
import {LoaderService} from 'services/loader.service';
import {PlayerPositionService} from '../../services/player-position.service';
import {PlayerTranscriptService} from '../../services/player-transcript.service';
import {QuestionPlayerEngineService} from '../../services/question-player-engine.service';
import {ReadOnlyCollectionBackendApiService} from 'domain/collection/read-only-collection-backend-api.service';
import {StatsReportingService} from '../../services/stats-reporting.service';
import {UrlService} from 'services/contextual/url.service';
import {UserService} from 'services/user.service';
import {LocalStorageService} from 'services/local-storage.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {ExplorationInitializationService} from '../../services/exploration-initialization.service';
import {ExplorationPlayerConstants} from '../exploration-player-page.constants';
import {CollectionPlayerBackendApiService} from 'pages/collection-player-page/services/collection-player-backend-api.service';
import {EditableExplorationBackendApiService} from 'domain/exploration/editable-exploration-backend-api.service';
import {
  FetchExplorationBackendResponse,
  ReadOnlyExplorationBackendApiService,
} from 'domain/exploration/read-only-exploration-backend-api.service';
import {ConversationFlowService} from '../../services/conversation-flow.service';
import {CheckpointProgressService} from '../../services/checkpoint-progress.service';
import {ConceptCardManagerService} from '../../services/concept-card-manager.service';
import {DiagnosticTestPlayerEngineService} from 'pages/exploration-player-page/services/diagnostic-test-player-engine.service';
import {ExplorationModeService} from 'pages/exploration-player-page/services/exploration-mode.service';
import {ChapterProgressService} from 'pages/exploration-player-page/services/chapter-progress.service';
import {CurrentEngineService} from 'pages/exploration-player-page/services/current-engine.service';
import {CardAnimationService} from 'pages/exploration-player-page/services/card-animation.service';
import {PreventPageUnloadEventService} from 'services/prevent-page-unload-event.service';
import {LearnerExplorationSummary} from 'domain/summary/learner-exploration-summary.model';
import {CollectionSummaryBackendDict} from 'domain/collection/collection-summary.model';
import {QuestionPlayerConfig} from './ratings-and-recommendations.component';
import {DiagnosticTestTopicTrackerModel} from 'pages/diagnostic-test-player-page/diagnostic-test-topic-tracker.model';

import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  flushMicrotasks,
  waitForAsync,
} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {ConversationSkinComponent} from './conversation-skin.component';
import {Interaction} from 'domain/exploration/interaction.model';
import {Solution} from 'domain/exploration/solution.model';
import {Question} from 'domain/question/question.model';
import {UserInfo} from 'domain/user/user-info.model';
import {Collection} from 'domain/collection/collection.model';
import {ExplorationEngineService} from '../../services/exploration-engine.service';
import {InteractionSpecsKey} from 'pages/interaction-specs.constants';
import {MockTranslatePipe} from 'tests/unit-test-utils';

describe('Conversation skin component', () => {
  let fixture: ComponentFixture<ConversationSkinComponent>;
  let component: ConversationSkinComponent;
  let displayedCard: StateCard;
  let explorationResponse: FetchExplorationBackendResponse;
  let collectionSummary: CollectionSummaryBackendDict;
  let alertsService: jasmine.SpyObj<AlertsService>;
  let collectionPlayerBackendApiService: jasmine.SpyObj<CollectionPlayerBackendApiService>;
  let pageContextService: jasmine.SpyObj<PageContextService>;
  let currentInteractionService: jasmine.SpyObj<CurrentInteractionService>;
  let explorationRecommendationsService: jasmine.SpyObj<ExplorationRecommendationsService>;
  let explorationModeService: jasmine.SpyObj<ExplorationModeService>;
  let cardAnimationService: jasmine.SpyObj<CardAnimationService>;
  let explorationInitializationService: jasmine.SpyObj<ExplorationInitializationService>;
  let hintsAndSolutionManagerService: jasmine.SpyObj<HintsAndSolutionManagerService>;
  let conceptCardManagerService: jasmine.SpyObj<ConceptCardManagerService>;
  let i18nLanguageCodeService: jasmine.SpyObj<I18nLanguageCodeService>;
  let imagePreloaderService: jasmine.SpyObj<ImagePreloaderService>;
  let learnerAnswerInfoService: jasmine.SpyObj<LearnerAnswerInfoService>;
  let learnerParamsService: jasmine.SpyObj<LearnerParamsService>;
  let loaderService: jasmine.SpyObj<LoaderService>;
  let localStorageService: jasmine.SpyObj<LocalStorageService>;
  let playerPositionService: jasmine.SpyObj<PlayerPositionService>;
  let playerTranscriptService: jasmine.SpyObj<PlayerTranscriptService>;
  let questionPlayerEngineService: jasmine.SpyObj<QuestionPlayerEngineService>;
  let readOnlyCollectionBackendApiService: jasmine.SpyObj<ReadOnlyCollectionBackendApiService>;
  let statsReportingService: jasmine.SpyObj<StatsReportingService>;
  let urlInterpolationService: jasmine.SpyObj<UrlInterpolationService>;
  let urlService: jasmine.SpyObj<UrlService>;
  let userService: jasmine.SpyObj<UserService>;
  let currentEngineService: jasmine.SpyObj<CurrentEngineService>;
  let diagnosticTestPlayerEngineService: jasmine.SpyObj<DiagnosticTestPlayerEngineService>;
  let windowDimensionsService: jasmine.SpyObj<WindowDimensionsService>;
  let editableExplorationBackendApiService: jasmine.SpyObj<EditableExplorationBackendApiService>;
  let readOnlyExplorationBackendApiService: jasmine.SpyObj<ReadOnlyExplorationBackendApiService>;
  let checkpointProgressService: jasmine.SpyObj<CheckpointProgressService>;
  let conversationFlowService: jasmine.SpyObj<ConversationFlowService>;
  let chapterProgressService: jasmine.SpyObj<ChapterProgressService>;
  let preventPageUnloadEventService: jasmine.SpyObj<PreventPageUnloadEventService>;

  const createCard = (
    name: string = 'Start',
    interactionId: InteractionSpecsKey | null = 'TextInput',
    solution: Solution | null = null
  ): StateCard => {
    return new StateCard(
      name,
      '<p>Question</p>',
      '',
      new Interaction([], [], {}, null, [], interactionId, solution),
      [],
      'content_0'
    );
  };

  const createRecommendation = (): LearnerExplorationSummary => {
    return new LearnerExplorationSummary(
      'Algebra',
      false,
      'next-exp',
      'en',
      0,
      'Learn',
      'public',
      [],
      '#ffffff',
      '',
      'Next lesson',
      'exploration',
      0,
      0,
      {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
      {}
    );
  };

  const initializeComponent = (): void => {
    component.ngOnInit();
    flushMicrotasks();
  };

  beforeEach(waitForAsync(() => {
    alertsService = jasmine.createSpyObj<AlertsService>('AlertsService', [
      'addWarning',
    ]);
    collectionPlayerBackendApiService =
      jasmine.createSpyObj<CollectionPlayerBackendApiService>(
        'CollectionPlayerBackendApiService',
        ['fetchCollectionSummariesAsync']
      );
    pageContextService = jasmine.createSpyObj<PageContextService>(
      'PageContextService',
      [
        'getExplorationId',
        'isInDiagnosticTestPlayerPage',
        'isInExplorationEditorPage',
      ]
    );
    currentInteractionService = jasmine.createSpyObj<CurrentInteractionService>(
      'CurrentInteractionService',
      ['isSubmitButtonDisabled', 'setOnSubmitFn', 'submitAnswer']
    );
    explorationRecommendationsService =
      jasmine.createSpyObj<ExplorationRecommendationsService>(
        'ExplorationRecommendationsService',
        ['getExplorationLink']
      );
    explorationModeService = jasmine.createSpyObj<ExplorationModeService>(
      'ExplorationModeService',
      [
        'isInDiagnosticTestPlayerMode',
        'isInQuestionMode',
        'isInQuestionPlayerMode',
        'isInStoryChapterMode',
        'setDiagnosticTestPlayerMode',
        'setQuestionPlayerMode',
      ]
    );
    cardAnimationService = jasmine.createSpyObj<CardAnimationService>(
      'CardAnimationService',
      [
        'adjustPageHeightOnresize',
        'getIsAnimatingToOneCard',
        'getIsAnimatingToTwoCards',
      ]
    );
    explorationInitializationService =
      jasmine.createSpyObj<ExplorationInitializationService>(
        'ExplorationInitializationService',
        ['initializePlayer']
      );
    hintsAndSolutionManagerService =
      jasmine.createSpyObj<HintsAndSolutionManagerService>(
        'HintsAndSolutionManagerService',
        [],
        {
          onHintConsumed: new EventEmitter<void>(),
          onSolutionViewedEventEmitter: new EventEmitter<void>(),
          onLearnerReallyStuck: new EventEmitter<string>(),
          onHintsExhausted: new EventEmitter<string>(),
        }
      );
    conceptCardManagerService = jasmine.createSpyObj<ConceptCardManagerService>(
      'ConceptCardManagerService',
      [],
      {
        onLearnerGetsReallyStuck: new EventEmitter<string>(),
      }
    );
    i18nLanguageCodeService = jasmine.createSpyObj<I18nLanguageCodeService>(
      'I18nLanguageCodeService',
      ['getExplorationTranslationKey', 'isHackyTranslationDisplayed']
    );
    imagePreloaderService = jasmine.createSpyObj<ImagePreloaderService>(
      'ImagePreloaderService',
      ['onStateChange']
    );
    learnerAnswerInfoService = jasmine.createSpyObj<LearnerAnswerInfoService>(
      'LearnerAnswerInfoService',
      ['getCanAskLearnerForAnswerInfo']
    );
    learnerParamsService = jasmine.createSpyObj<LearnerParamsService>(
      'LearnerParamsService',
      ['getAllParams']
    );
    loaderService = jasmine.createSpyObj<LoaderService>('LoaderService', [
      'hideLoadingScreen',
      'showLoadingScreen',
    ]);
    localStorageService = jasmine.createSpyObj<LocalStorageService>(
      'LocalStorageService',
      [
        'getUniqueProgressIdOfLoggedOutLearner',
        'removeUniqueProgressIdOfLoggedOutLearner',
      ]
    );
    playerPositionService = jasmine.createSpyObj<PlayerPositionService>(
      'PlayerPositionService',
      [
        'getDisplayedCardIndex',
        'hasLearnerJustSubmittedAnAnswer',
        'init',
        'isCurrentCardAtEndOfTranscript',
      ],
      {
        onNewCardOpened: new EventEmitter<StateCard>(),
      }
    );
    playerTranscriptService = jasmine.createSpyObj<PlayerTranscriptService>(
      'PlayerTranscriptService',
      [
        'getLastStateName',
        'getNumCards',
        'getPrevSessionStatesProgress',
        'isLastCard',
        'resetNumberOfIncorrectSubmissions',
      ]
    );
    questionPlayerEngineService =
      jasmine.createSpyObj<QuestionPlayerEngineService>(
        'QuestionPlayerEngineService',
        [
          'getCurrentQuestion',
          'initQuestionPlayer',
          'recordHintUsed',
          'recordSolutionViewed',
        ]
      );
    readOnlyCollectionBackendApiService =
      jasmine.createSpyObj<ReadOnlyCollectionBackendApiService>(
        'ReadOnlyCollectionBackendApiService',
        ['loadCollectionAsync']
      );
    statsReportingService = jasmine.createSpyObj<StatsReportingService>(
      'StatsReportingService',
      [
        'recordExplorationActuallyStarted',
        'recordExplorationCompleted',
        'recordMaybeLeaveEvent',
      ]
    );
    urlInterpolationService = jasmine.createSpyObj<UrlInterpolationService>(
      'UrlInterpolationService',
      ['getStaticCopyrightedImageUrl', 'getStaticImageUrl']
    );
    urlService = jasmine.createSpyObj<UrlService>('UrlService', [
      'getCollectionIdFromExplorationUrl',
      'getPidFromUrl',
      'isIframed',
    ]);
    userService = jasmine.createSpyObj<UserService>('UserService', [
      'getUserInfoAsync',
    ]);
    currentEngineService = jasmine.createSpyObj<CurrentEngineService>(
      'CurrentEngineService',
      ['getCurrentEngineService']
    );
    diagnosticTestPlayerEngineService =
      jasmine.createSpyObj<DiagnosticTestPlayerEngineService>(
        'DiagnosticTestPlayerEngineService',
        ['init', 'skipCurrentQuestion']
      );
    windowDimensionsService = jasmine.createSpyObj<WindowDimensionsService>(
      'WindowDimensionsService',
      ['getWidth']
    );
    editableExplorationBackendApiService =
      jasmine.createSpyObj<EditableExplorationBackendApiService>(
        'EditableExplorationBackendApiService',
        [
          'changeLoggedOutProgressToLoggedInProgressAsync',
          'recordMostRecentlyReachedCheckpointAsync',
        ]
      );
    readOnlyExplorationBackendApiService =
      jasmine.createSpyObj<ReadOnlyExplorationBackendApiService>(
        'ReadOnlyExplorationBackendApiService',
        ['loadLatestExplorationAsync']
      );
    checkpointProgressService = jasmine.createSpyObj<CheckpointProgressService>(
      'CheckpointProgressService',
      ['setMostRecentlyReachedCheckpoint', 'setVisitedCheckpointStateNames']
    );
    conversationFlowService = jasmine.createSpyObj<ConversationFlowService>(
      'ConversationFlowService',
      [
        'getAnswerIsBeingProcessed',
        'getAnswerIsCorrect',
        'getDisplayedCard',
        'getExplorationActuallyStarted',
        'getHasFullyLoaded',
        'getHasInteractedAtLeastOnce',
        'getNextCardIfStuck',
        'getNextStateCard',
        'getRecommendedExplorationSummaries',
        'getRedirectToRefresherExplorationConfirmed',
        'getShowProgressClearanceMessage',
        'isLearnAgainButton',
        'isSupplementalCardNonempty',
        'setExplorationActuallyStarted',
        'setHasFullyLoaded',
        'setIsLoggedIn',
        'setNextCardIfStuck',
        'setNextStateCard',
        'setOriginalStuckStateName',
        'setRecommendedExplorationSummaries',
        'setSolutionForState',
        'showPendingCard',
        'triggerIfLearnerStuckAction',
        'navigateToDisplayedCard',
        'initializeDirectiveComponents',
        'submitAnswer',
      ],
      {
        onPlayerStateChange: new EventEmitter<string>(),
        onShowProgressModal: new EventEmitter<boolean>(),
      }
    );
    chapterProgressService = jasmine.createSpyObj<ChapterProgressService>(
      'ChapterProgressService',
      ['getCompletedChaptersCount', 'updateCompletedChaptersCount']
    );
    preventPageUnloadEventService =
      jasmine.createSpyObj<PreventPageUnloadEventService>(
        'PreventPageUnloadEventService',
        ['addListener', 'removeListener']
      );

    displayedCard = createCard();
    explorationResponse = {
      exploration_id: 'exp-id',
      is_logged_in: true,
      session_id: 'session',
      displayable_language_codes: [],
      exploration: {
        init_state_name: 'Start',
        param_changes: [],
        param_specs: {},
        title: 'Exploration',
        language_code: 'en',
        objective: 'Learn',
        states: {},
        next_content_id_index: 1,
      },
      exploration_metadata: {
        title: 'Exploration',
        category: 'Algebra',
        objective: 'Learn',
        language_code: 'en',
        tags: [],
        blurb: '',
        author_notes: '',
        states_schema_version: 50,
        init_state_name: 'Start',
        param_specs: {},
        param_changes: [],
        auto_tts_enabled: false,
        edits_allowed: true,
      },
      version: 2,
      can_edit: true,
      preferred_audio_language_code: 'en',
      preferred_language_codes: [],
      auto_tts_enabled: false,
      record_playthrough_probability: 1,
      draft_change_list_id: 0,
      has_viewed_lesson_info_modal_once: false,
      furthest_reached_checkpoint_exp_version: 2,
      furthest_reached_checkpoint_state_name: 'Mid',
      most_recently_reached_checkpoint_state_name: 'Mid',
      most_recently_reached_checkpoint_exp_version: 2,
    };
    collectionSummary = {
      category: 'Algebra',
      community_owned: false,
      last_updated_msec: 0,
      id: 'collection-id',
      created_on: 0,
      language_code: 'en',
      objective: 'Learn',
      status: 'public',
      thumbnail_bg_color: '#ffffff',
      thumbnail_icon_url: '',
      title: 'Collection',
    };
    pageContextService.isInExplorationEditorPage.and.returnValue(false);
    pageContextService.isInDiagnosticTestPlayerPage.and.returnValue(false);
    explorationModeService.isInQuestionPlayerMode.and.returnValue(false);
    explorationModeService.isInDiagnosticTestPlayerMode.and.returnValue(false);
    explorationModeService.isInQuestionMode.and.returnValue(false);
    explorationModeService.isInStoryChapterMode.and.returnValue(false);
    pageContextService.getExplorationId.and.returnValue('exp-id');
    urlService.getCollectionIdFromExplorationUrl.and.returnValue(null);
    urlService.getPidFromUrl.and.returnValue(null);
    urlService.isIframed.and.returnValue(false);
    localStorageService.getUniqueProgressIdOfLoggedOutLearner.and.returnValue(
      null
    );
    userService.getUserInfoAsync.and.resolveTo(
      new UserInfo([], false, false, false, false, false, '', '', '', true)
    );
    readOnlyExplorationBackendApiService.loadLatestExplorationAsync.and.resolveTo(
      explorationResponse
    );
    editableExplorationBackendApiService.changeLoggedOutProgressToLoggedInProgressAsync.and.returnValue(
      Promise.resolve()
    );
    collectionPlayerBackendApiService.fetchCollectionSummariesAsync.and.resolveTo(
      {
        is_admin: false,
        is_topic_manager: false,
        summaries: [collectionSummary],
        user_email: '',
        username: '',
      }
    );
    conversationFlowService.getDisplayedCard.and.returnValue(displayedCard);
    conversationFlowService.getNextStateCard.and.returnValue(displayedCard);
    conversationFlowService.getNextCardIfStuck.and.returnValue(null);
    conversationFlowService.getRecommendedExplorationSummaries.and.returnValue(
      []
    );
    conversationFlowService.getHasFullyLoaded.and.returnValue(false);
    playerTranscriptService.getPrevSessionStatesProgress.and.returnValue([]);
    playerTranscriptService.isLastCard.and.returnValue(true);
    playerTranscriptService.getNumCards.and.returnValue(3);
    playerTranscriptService.getLastStateName.and.returnValue('Start');
    currentInteractionService.isSubmitButtonDisabled.and.returnValue(true);
    windowDimensionsService.getWidth.and.returnValue(1200);
    learnerParamsService.getAllParams.and.returnValue({score: '1'});
    urlInterpolationService.getStaticCopyrightedImageUrl.and.returnValue(
      'avatar.svg'
    );
    const engine = jasmine.createSpyObj<ExplorationEngineService>(
      'ExplorationEngineService',
      ['getLanguageCode']
    );
    engine.getLanguageCode.and.returnValue('en');
    currentEngineService.getCurrentEngineService.and.returnValue(engine);

    TestBed.configureTestingModule({
      declarations: [ConversationSkinComponent, MockTranslatePipe],
      providers: [
        {provide: WindowRef, useValue: {}},
        {provide: AlertsService, useValue: alertsService},
        {
          provide: CollectionPlayerBackendApiService,
          useValue: collectionPlayerBackendApiService,
        },
        {provide: PageContextService, useValue: pageContextService},
        {
          provide: CurrentInteractionService,
          useValue: currentInteractionService,
        },
        {
          provide: ExplorationRecommendationsService,
          useValue: explorationRecommendationsService,
        },
        {provide: ExplorationModeService, useValue: explorationModeService},
        {provide: CardAnimationService, useValue: cardAnimationService},
        {
          provide: ExplorationInitializationService,
          useValue: explorationInitializationService,
        },
        {
          provide: HintsAndSolutionManagerService,
          useValue: hintsAndSolutionManagerService,
        },
        {
          provide: ConceptCardManagerService,
          useValue: conceptCardManagerService,
        },
        {provide: I18nLanguageCodeService, useValue: i18nLanguageCodeService},
        {provide: ImagePreloaderService, useValue: imagePreloaderService},
        {provide: LearnerAnswerInfoService, useValue: learnerAnswerInfoService},
        {provide: LearnerParamsService, useValue: learnerParamsService},
        {provide: LoaderService, useValue: loaderService},
        {provide: LocalStorageService, useValue: localStorageService},
        {provide: PlayerPositionService, useValue: playerPositionService},
        {provide: PlayerTranscriptService, useValue: playerTranscriptService},
        {
          provide: QuestionPlayerEngineService,
          useValue: questionPlayerEngineService,
        },
        {
          provide: ReadOnlyCollectionBackendApiService,
          useValue: readOnlyCollectionBackendApiService,
        },
        {provide: StatsReportingService, useValue: statsReportingService},
        {provide: UrlInterpolationService, useValue: urlInterpolationService},
        {provide: UrlService, useValue: urlService},
        {provide: UserService, useValue: userService},
        {provide: CurrentEngineService, useValue: currentEngineService},
        {
          provide: DiagnosticTestPlayerEngineService,
          useValue: diagnosticTestPlayerEngineService,
        },
        {provide: WindowDimensionsService, useValue: windowDimensionsService},
        {
          provide: EditableExplorationBackendApiService,
          useValue: editableExplorationBackendApiService,
        },
        {
          provide: ReadOnlyExplorationBackendApiService,
          useValue: readOnlyExplorationBackendApiService,
        },
        {
          provide: CheckpointProgressService,
          useValue: checkpointProgressService,
        },
        {provide: ConversationFlowService, useValue: conversationFlowService},
        {provide: ChapterProgressService, useValue: chapterProgressService},
        {
          provide: PreventPageUnloadEventService,
          useValue: preventPageUnloadEventService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(ConversationSkinComponent);
    component = fixture.componentInstance;
  }));

  afterEach(() => {
    fixture.destroy();
  });

  describe('initialization', () => {
    it('should expose the exploration context and show the loading screen', fakeAsync(() => {
      urlService.getPidFromUrl.and.returnValue('progress-id');
      initializeComponent();

      expect(component.explorationId).toBe('exp-id');
      expect(component.pidInUrl).toBe('progress-id');
      expect(component.isIframed).toBe(false);
      expect(component.editorPreviewMode).toBe(false);
      expect(component.OPPIA_AVATAR_IMAGE_URL).toBe('avatar.svg');
      expect(
        urlInterpolationService.getStaticCopyrightedImageUrl
      ).toHaveBeenCalledWith('/avatar/oppia_avatar_100px.svg');
      expect(loaderService.showLoadingScreen).toHaveBeenCalledWith('Loading');
      expect(
        cardAnimationService.adjustPageHeightOnresize
      ).toHaveBeenCalledTimes(1);
    }));

    it('should share the signed-in status and update completed chapters', fakeAsync(() => {
      initializeComponent();

      expect(component.isLoggedIn).toBe(true);
      expect(conversationFlowService.setIsLoggedIn).toHaveBeenCalledWith(true);
      expect(
        chapterProgressService.updateCompletedChaptersCount
      ).toHaveBeenCalledTimes(1);
    }));

    it('should keep a guest signed out without updating completed chapters', fakeAsync(() => {
      userService.getUserInfoAsync.and.resolveTo(
        new UserInfo([], false, false, false, false, false, '', '', '', false)
      );
      initializeComponent();

      expect(component.isLoggedIn).toBe(false);
      expect(conversationFlowService.setIsLoggedIn).toHaveBeenCalledWith(false);
      expect(
        chapterProgressService.updateCompletedChaptersCount
      ).not.toHaveBeenCalled();
    }));

    it('should expose editor preview mode', fakeAsync(() => {
      pageContextService.isInExplorationEditorPage.and.returnValue(true);
      initializeComponent();

      expect(component.editorPreviewMode).toBe(true);
    }));

    it('should hide the correctness footer in diagnostic tests', fakeAsync(() => {
      pageContextService.isInDiagnosticTestPlayerPage.and.returnValue(true);
      initializeComponent();

      expect(component.correctnessFooterIsShown).toBe(false);
    }));

    it('should retain the correctness footer in explorations', fakeAsync(() => {
      initializeComponent();

      expect(component.correctnessFooterIsShown).toBe(true);
    }));

    it('should load the collection title and first summary', fakeAsync(() => {
      const collection = Collection.createEmptyCollection();
      collection.setTitle('Algebra collection');
      urlService.getCollectionIdFromExplorationUrl.and.returnValue(
        'collection-id'
      );
      readOnlyCollectionBackendApiService.loadCollectionAsync.and.resolveTo(
        collection
      );
      initializeComponent();

      expect(
        readOnlyCollectionBackendApiService.loadCollectionAsync
      ).toHaveBeenCalledWith('collection-id');
      expect(
        collectionPlayerBackendApiService.fetchCollectionSummariesAsync
      ).toHaveBeenCalledWith('collection-id');
      expect(component.collectionTitle).toBe('Algebra collection');
      expect(component.collectionSummary).toEqual(collectionSummary);
    }));

    it('should keep the summary empty when the collection has no summaries', fakeAsync(() => {
      urlService.getCollectionIdFromExplorationUrl.and.returnValue(
        'collection-id'
      );
      readOnlyCollectionBackendApiService.loadCollectionAsync.and.resolveTo(
        Collection.createEmptyCollection()
      );
      collectionPlayerBackendApiService.fetchCollectionSummariesAsync.and.resolveTo(
        {
          is_admin: false,
          is_topic_manager: false,
          summaries: [],
          user_email: '',
          username: '',
        }
      );
      initializeComponent();

      expect(component.collectionSummary).toBeNull();
    }));

    it('should warn when collection summaries cannot be loaded', fakeAsync(() => {
      urlService.getCollectionIdFromExplorationUrl.and.returnValue(
        'collection-id'
      );
      readOnlyCollectionBackendApiService.loadCollectionAsync.and.resolveTo(
        Collection.createEmptyCollection()
      );
      collectionPlayerBackendApiService.fetchCollectionSummariesAsync.and.rejectWith(
        new Error('Unavailable')
      );
      initializeComponent();

      expect(alertsService.addWarning).toHaveBeenCalledWith(
        'There was an error while fetching the collection summary.'
      );
      expect(component.collectionSummary).toBeNull();
    }));

    it('should not request collection data for a standalone exploration', fakeAsync(() => {
      initializeComponent();

      expect(component.collectionTitle).toBeNull();
      expect(component.collectionSummary).toBeNull();
      expect(
        readOnlyCollectionBackendApiService.loadCollectionAsync
      ).not.toHaveBeenCalled();
      expect(
        collectionPlayerBackendApiService.fetchCollectionSummariesAsync
      ).not.toHaveBeenCalled();
    }));
  });

  describe('guest progress migration', () => {
    it('should remove guest progress only after migration finishes', fakeAsync(() => {
      let completeMigration!: () => void;
      localStorageService.getUniqueProgressIdOfLoggedOutLearner.and.returnValue(
        'guest-progress'
      );
      editableExplorationBackendApiService.changeLoggedOutProgressToLoggedInProgressAsync.and.returnValue(
        new Promise<void>(resolve => {
          completeMigration = resolve;
        })
      );
      component.ngOnInit();
      flushMicrotasks();

      expect(
        editableExplorationBackendApiService.changeLoggedOutProgressToLoggedInProgressAsync
      ).toHaveBeenCalledWith('exp-id', 'guest-progress');
      expect(
        localStorageService.removeUniqueProgressIdOfLoggedOutLearner
      ).not.toHaveBeenCalled();
      expect(
        explorationInitializationService.initializePlayer
      ).not.toHaveBeenCalled();

      completeMigration();
      flushMicrotasks();

      expect(
        localStorageService.removeUniqueProgressIdOfLoggedOutLearner
      ).toHaveBeenCalledTimes(1);
      expect(
        explorationInitializationService.initializePlayer
      ).toHaveBeenCalledTimes(1);
    }));

    it('should not migrate progress when no guest identifier exists', fakeAsync(() => {
      initializeComponent();

      expect(
        editableExplorationBackendApiService.changeLoggedOutProgressToLoggedInProgressAsync
      ).not.toHaveBeenCalled();
      expect(
        localStorageService.removeUniqueProgressIdOfLoggedOutLearner
      ).not.toHaveBeenCalled();
    }));

    it('should preserve guest progress while the learner remains signed out', fakeAsync(() => {
      localStorageService.getUniqueProgressIdOfLoggedOutLearner.and.returnValue(
        'guest-progress'
      );
      userService.getUserInfoAsync.and.resolveTo(
        new UserInfo([], false, false, false, false, false, '', '', '', false)
      );
      initializeComponent();

      expect(
        editableExplorationBackendApiService.changeLoggedOutProgressToLoggedInProgressAsync
      ).not.toHaveBeenCalled();
      expect(
        localStorageService.removeUniqueProgressIdOfLoggedOutLearner
      ).not.toHaveBeenCalled();
    }));
  });

  describe('checkpoint progress', () => {
    it('should restore the existing checkpoint and pass the progress identifier', fakeAsync(() => {
      urlService.getPidFromUrl.and.returnValue('progress-id');
      initializeComponent();

      expect(
        readOnlyExplorationBackendApiService.loadLatestExplorationAsync
      ).toHaveBeenCalledWith('exp-id', 'progress-id');
      expect(
        checkpointProgressService.setMostRecentlyReachedCheckpoint
      ).toHaveBeenCalledWith('Mid');
      expect(
        checkpointProgressService.setVisitedCheckpointStateNames
      ).toHaveBeenCalledWith('Start');
      expect(
        editableExplorationBackendApiService.recordMostRecentlyReachedCheckpointAsync
      ).not.toHaveBeenCalled();
    }));

    it('should save the first checkpoint for a new signed-in learner', fakeAsync(() => {
      explorationResponse.most_recently_reached_checkpoint_state_name = '';
      initializeComponent();

      expect(
        editableExplorationBackendApiService.recordMostRecentlyReachedCheckpointAsync
      ).toHaveBeenCalledWith('exp-id', 2, 'Start', true);
      expect(
        checkpointProgressService.setMostRecentlyReachedCheckpoint
      ).toHaveBeenCalledWith('Start');
      expect(
        checkpointProgressService.setVisitedCheckpointStateNames
      ).toHaveBeenCalledWith('Start');
    }));

    it('should initialize a guest checkpoint without recording signed-in progress', fakeAsync(() => {
      explorationResponse.most_recently_reached_checkpoint_state_name = '';
      userService.getUserInfoAsync.and.resolveTo(
        new UserInfo([], false, false, false, false, false, '', '', '', false)
      );
      initializeComponent();

      expect(
        checkpointProgressService.setMostRecentlyReachedCheckpoint
      ).toHaveBeenCalledWith('Start');
      expect(
        editableExplorationBackendApiService.recordMostRecentlyReachedCheckpointAsync
      ).not.toHaveBeenCalled();
    }));

    it('should not load checkpoint progress in an iframe', fakeAsync(() => {
      urlService.isIframed.and.returnValue(true);
      initializeComponent();

      expect(component.isIframed).toBe(true);
      expect(
        readOnlyExplorationBackendApiService.loadLatestExplorationAsync
      ).not.toHaveBeenCalled();
      expect(
        checkpointProgressService.setMostRecentlyReachedCheckpoint
      ).not.toHaveBeenCalled();
    }));

    it('should not load checkpoint progress in editor preview', fakeAsync(() => {
      pageContextService.isInExplorationEditorPage.and.returnValue(true);
      initializeComponent();

      expect(
        readOnlyExplorationBackendApiService.loadLatestExplorationAsync
      ).not.toHaveBeenCalled();
    }));

    it('should not load checkpoint progress in question player mode', fakeAsync(() => {
      explorationModeService.isInQuestionPlayerMode.and.returnValue(true);
      initializeComponent();

      expect(
        readOnlyExplorationBackendApiService.loadLatestExplorationAsync
      ).not.toHaveBeenCalled();
    }));

    it('should not load checkpoint progress in diagnostic test mode', fakeAsync(() => {
      explorationModeService.isInDiagnosticTestPlayerMode.and.returnValue(true);
      initializeComponent();

      expect(
        readOnlyExplorationBackendApiService.loadLatestExplorationAsync
      ).not.toHaveBeenCalled();
    }));
  });

  describe('player initialization', () => {
    it('should initialize the exploration and connect its first card', () => {
      component.initializePage();
      const initializeCard =
        explorationInitializationService.initializePlayer.calls.mostRecent()
          .args[0];
      initializeCard(displayedCard, 'content-focus');

      expect(
        conversationFlowService.setRecommendedExplorationSummaries
      ).toHaveBeenCalledWith([]);
      expect(
        conversationFlowService.initializeDirectiveComponents
      ).toHaveBeenCalledWith(displayedCard, 'content-focus');
      expect(
        questionPlayerEngineService.initQuestionPlayer
      ).not.toHaveBeenCalled();
      expect(diagnosticTestPlayerEngineService.init).not.toHaveBeenCalled();
    });

    it('should connect position changes to the displayed card', () => {
      component.initializePage();
      const navigate = playerPositionService.init.calls.mostRecent().args[0];
      navigate();

      expect(
        conversationFlowService.navigateToDisplayedCard
      ).toHaveBeenCalledTimes(1);
    });

    it('should initialize questions with the supplied configuration', () => {
      const config: QuestionPlayerConfig = {
        resultActionButtons: [],
        skillList: ['skill-id'],
        skillDescriptions: ['Algebra'],
        questionCount: 3,
        questionsSortedByDifficulty: false,
      };
      component.questionPlayerConfig = config;
      component.initializePage();
      const [receivedConfig, initializeCard, noQuestions] =
        questionPlayerEngineService.initQuestionPlayer.calls.mostRecent().args;
      initializeCard(displayedCard, 'question-focus');

      expect(receivedConfig).toEqual(config);
      expect(
        explorationModeService.setQuestionPlayerMode
      ).toHaveBeenCalledTimes(1);
      expect(
        conversationFlowService.initializeDirectiveComponents
      ).toHaveBeenCalledWith(displayedCard, 'question-focus');
      expect(noQuestions).toBe(component.showQuestionAreNotAvailable);
      expect(
        explorationInitializationService.initializePlayer
      ).not.toHaveBeenCalled();
      expect(diagnosticTestPlayerEngineService.init).not.toHaveBeenCalled();
    });

    it('should initialize diagnostic tests with the supplied topic tracker', () => {
      const tracker = new DiagnosticTestTopicTrackerModel({topic: []});
      component.diagnosticTestTopicTrackerModel = tracker;
      component.initializePage();
      const [receivedTracker, initializeCard] =
        diagnosticTestPlayerEngineService.init.calls.mostRecent().args;
      initializeCard(displayedCard, 'diagnostic-focus');

      expect(receivedTracker).toBe(tracker);
      expect(
        explorationModeService.setDiagnosticTestPlayerMode
      ).toHaveBeenCalledTimes(1);
      expect(
        conversationFlowService.initializeDirectiveComponents
      ).toHaveBeenCalledWith(displayedCard, 'diagnostic-focus');
      expect(
        questionPlayerEngineService.initQuestionPlayer
      ).not.toHaveBeenCalled();
      expect(
        explorationInitializationService.initializePlayer
      ).not.toHaveBeenCalled();
    });

    it('should stop loading when no questions are available', () => {
      component.showQuestionAreNotAvailable();

      expect(loaderService.hideLoadingScreen).toHaveBeenCalledTimes(1);
    });
  });

  describe('question player events', () => {
    it('should record hint consumption for the current question', fakeAsync(() => {
      const question = Question.createDefaultQuestion(['skill-id']);
      explorationModeService.isInQuestionPlayerMode.and.returnValue(true);
      questionPlayerEngineService.getCurrentQuestion.and.returnValue(question);
      initializeComponent();
      hintsAndSolutionManagerService.onHintConsumed.emit();

      expect(
        questionPlayerEngineService.recordHintUsed
      ).toHaveBeenCalledOnceWith(question);
      expect(
        questionPlayerEngineService.recordSolutionViewed
      ).not.toHaveBeenCalled();
    }));

    it('should record solution viewing for the current question', fakeAsync(() => {
      const question = Question.createDefaultQuestion(['skill-id']);
      explorationModeService.isInQuestionPlayerMode.and.returnValue(true);
      questionPlayerEngineService.getCurrentQuestion.and.returnValue(question);
      initializeComponent();
      hintsAndSolutionManagerService.onSolutionViewedEventEmitter.emit();

      expect(
        questionPlayerEngineService.recordSolutionViewed
      ).toHaveBeenCalledOnceWith(question);
      expect(questionPlayerEngineService.recordHintUsed).not.toHaveBeenCalled();
    }));

    it('should not record question events while playing an exploration', fakeAsync(() => {
      initializeComponent();
      hintsAndSolutionManagerService.onHintConsumed.emit();
      hintsAndSolutionManagerService.onSolutionViewedEventEmitter.emit();

      expect(questionPlayerEngineService.recordHintUsed).not.toHaveBeenCalled();
      expect(
        questionPlayerEngineService.recordSolutionViewed
      ).not.toHaveBeenCalled();
    }));
  });

  describe('card and learner stuck events', () => {
    it('should mark the player fully loaded when progress is shown', fakeAsync(() => {
      initializeComponent();
      conversationFlowService.onShowProgressModal.emit(true);

      expect(
        conversationFlowService.setHasFullyLoaded
      ).toHaveBeenCalledOnceWith(true);
    }));

    it('should reset the interaction and stuck state when a card opens', fakeAsync(() => {
      const solution = Solution.createNew(
        true,
        'answer',
        'Explanation',
        'solution_0'
      );
      const nextCard = createCard('Next', 'TextInput', solution);
      initializeComponent();
      component.continueToReviseStateButtonIsVisible = true;
      component.showInteraction = false;
      playerPositionService.onNewCardOpened.emit(nextCard);

      expect(conversationFlowService.setSolutionForState).toHaveBeenCalledWith(
        solution
      );
      expect(
        playerTranscriptService.resetNumberOfIncorrectSubmissions
      ).toHaveBeenCalledTimes(1);
      expect(conversationFlowService.setNextCardIfStuck).toHaveBeenCalledWith(
        null
      );
      expect(component.continueToReviseStateButtonIsVisible).toBe(false);
      expect(component.showInteraction).toBe(true);
      expect(
        conversationFlowService.triggerIfLearnerStuckAction
      ).toHaveBeenCalledWith(true, jasmine.any(Function));

      const showRevision =
        conversationFlowService.triggerIfLearnerStuckAction.calls.mostRecent()
          .args[1];
      showRevision();
      expect(component.continueToReviseStateButtonIsVisible).toBe(true);
    }));

    it('should request an immediate stuck check when the learner is really stuck', fakeAsync(() => {
      initializeComponent();
      hintsAndSolutionManagerService.onLearnerReallyStuck.emit();

      expect(
        conversationFlowService.triggerIfLearnerStuckAction
      ).toHaveBeenCalledWith(false, jasmine.any(Function));
      expect(component.continueToReviseStateButtonIsVisible).toBe(false);
      conversationFlowService.triggerIfLearnerStuckAction.calls
        .mostRecent()
        .args[1]();
      expect(component.continueToReviseStateButtonIsVisible).toBe(true);
    }));

    it('should request a delayed stuck check when hints are exhausted', fakeAsync(() => {
      initializeComponent();
      hintsAndSolutionManagerService.onHintsExhausted.emit();

      expect(
        conversationFlowService.triggerIfLearnerStuckAction
      ).toHaveBeenCalledWith(true, jasmine.any(Function));
      expect(component.continueToReviseStateButtonIsVisible).toBe(false);
      conversationFlowService.triggerIfLearnerStuckAction.calls
        .mostRecent()
        .args[1]();
      expect(component.continueToReviseStateButtonIsVisible).toBe(true);
    }));

    it('should expose a learner stuck in a concept card and request revision', fakeAsync(() => {
      initializeComponent();
      conceptCardManagerService.onLearnerGetsReallyStuck.emit();

      expect(component.isLearnerReallyStuck).toBe(true);
      expect(
        conversationFlowService.triggerIfLearnerStuckAction
      ).toHaveBeenCalledWith(false, jasmine.any(Function));
      conversationFlowService.triggerIfLearnerStuckAction.calls
        .mostRecent()
        .args[1]();
      expect(component.continueToReviseStateButtonIsVisible).toBe(true);
    }));

    it('should save the original state and redirect to an available revision card', () => {
      const revisionCard = createCard('Revision');
      conversationFlowService.getNextCardIfStuck.and.returnValue(revisionCard);
      component.triggerRedirectionToStuckState();

      expect(
        conversationFlowService.setOriginalStuckStateName
      ).toHaveBeenCalledWith('Start');
      expect(conversationFlowService.setNextStateCard).toHaveBeenCalledWith(
        revisionCard
      );
      expect(component.showInteraction).toBe(false);
      expect(conversationFlowService.showPendingCard).toHaveBeenCalledTimes(1);
    });

    it('should retain the pending card when no revision card exists', () => {
      component.triggerRedirectionToStuckState();

      expect(
        conversationFlowService.setOriginalStuckStateName
      ).toHaveBeenCalledWith('Start');
      expect(conversationFlowService.setNextStateCard).not.toHaveBeenCalled();
      expect(component.showInteraction).toBe(false);
      expect(conversationFlowService.showPendingCard).toHaveBeenCalledTimes(1);
    });
  });

  describe('state transitions', () => {
    it('should ignore an empty state change', fakeAsync(() => {
      initializeComponent();
      conversationFlowService.onPlayerStateChange.emit('');

      expect(imagePreloaderService.onStateChange).not.toHaveBeenCalled();
      expect(
        statsReportingService.recordExplorationCompleted
      ).not.toHaveBeenCalled();
      expect(conversationFlowService.getNextStateCard).not.toHaveBeenCalled();
    }));

    it('should preload an ordinary state without recording completion', fakeAsync(() => {
      initializeComponent();
      conversationFlowService.onPlayerStateChange.emit('Next');

      expect(imagePreloaderService.onStateChange).toHaveBeenCalledWith('Next');
      expect(
        statsReportingService.recordExplorationCompleted
      ).not.toHaveBeenCalled();
      expect(
        statsReportingService.recordExplorationActuallyStarted
      ).not.toHaveBeenCalled();
    }));

    it('should not preload images or report completion in editor preview', fakeAsync(() => {
      pageContextService.isInExplorationEditorPage.and.returnValue(true);
      conversationFlowService.getNextStateCard.and.returnValue(
        createCard('End', 'EndExploration')
      );
      initializeComponent();
      conversationFlowService.onPlayerStateChange.emit('End');

      expect(imagePreloaderService.onStateChange).not.toHaveBeenCalled();
      expect(
        statsReportingService.recordExplorationCompleted
      ).not.toHaveBeenCalled();
    }));

    it('should record terminal state completion with the current progress and language', fakeAsync(() => {
      conversationFlowService.getNextStateCard.and.returnValue(
        createCard('End', 'EndExploration')
      );
      conversationFlowService.getExplorationActuallyStarted.and.returnValue(
        true
      );
      chapterProgressService.getCompletedChaptersCount.and.returnValue(2);
      initializeComponent();
      conversationFlowService.onPlayerStateChange.emit('End');

      expect(
        statsReportingService.recordExplorationCompleted
      ).toHaveBeenCalledWith('End', {score: '1'}, '3', '3', 'en');
      expect(
        statsReportingService.recordExplorationActuallyStarted
      ).not.toHaveBeenCalled();
      expect(
        conversationFlowService.setExplorationActuallyStarted
      ).not.toHaveBeenCalled();
    }));

    it('should record actual start for an exploration beginning on a terminal state', fakeAsync(() => {
      conversationFlowService.getNextStateCard.and.returnValue(
        createCard('End', 'EndExploration')
      );
      conversationFlowService.getExplorationActuallyStarted.and.returnValue(
        false
      );
      chapterProgressService.getCompletedChaptersCount.and.returnValue(0);
      initializeComponent();
      conversationFlowService.onPlayerStateChange.emit('End');

      expect(
        statsReportingService.recordExplorationCompleted
      ).toHaveBeenCalledWith('End', {score: '1'}, '0', '3', 'en');
      expect(
        statsReportingService.recordExplorationActuallyStarted
      ).toHaveBeenCalledWith('End');
      expect(
        conversationFlowService.setExplorationActuallyStarted
      ).toHaveBeenCalledWith(true);
    }));
  });

  describe('answer submission', () => {
    it('should mark the displayed interaction submitted and submit its answer', () => {
      component.submitAnswerFromProgressNav();

      expect(displayedCard.getInteraction().submitClicked).toBe(true);
      expect(currentInteractionService.submitAnswer).toHaveBeenCalledTimes(1);
    });

    it('should forward answers and rules from the registered submit callback', fakeAsync(() => {
      initializeComponent();
      const onSubmit: OnSubmitFn =
        currentInteractionService.setOnSubmitFn.calls.mostRecent().args[0];
      const rules: Parameters<ConversationFlowService['submitAnswer']>[1] = {};
      onSubmit('learner answer', rules);

      expect(conversationFlowService.submitAnswer).toHaveBeenCalledWith(
        'learner answer',
        rules
      );
    }));

    it('should display the next diagnostic card after skipping a question', () => {
      const nextCard = createCard('Next question');
      component.skipCurrentQuestion();
      expect(conversationFlowService.showPendingCard).not.toHaveBeenCalled();

      diagnosticTestPlayerEngineService.skipCurrentQuestion.calls
        .mostRecent()
        .args[0](nextCard);

      expect(conversationFlowService.setNextStateCard).toHaveBeenCalledWith(
        nextCard
      );
      expect(conversationFlowService.showPendingCard).toHaveBeenCalledTimes(1);
    });

    it('should enable submission while viewing a previous card', () => {
      playerPositionService.getDisplayedCardIndex.and.returnValue(1);
      playerTranscriptService.isLastCard.and.returnValue(false);

      expect(component.isSubmitButtonDisabled()).toBe(false);
      expect(playerTranscriptService.isLastCard).toHaveBeenCalledWith(1);
      expect(
        currentInteractionService.isSubmitButtonDisabled
      ).not.toHaveBeenCalled();
    });

    [true, false].forEach(disabled => {
      it(
        'should expose the current interaction submit disabled state as ' +
          disabled,
        () => {
          currentInteractionService.isSubmitButtonDisabled.and.returnValue(
            disabled
          );

          expect(component.isSubmitButtonDisabled()).toBe(disabled);
        }
      );
    });

    it('should update the cached submit state when validity changes', () => {
      currentInteractionService.isSubmitButtonDisabled.and.returnValue(false);
      component.ngAfterViewChecked();

      expect(component.submitButtonIsDisabled).toBe(false);

      currentInteractionService.isSubmitButtonDisabled.and.returnValue(true);
      component.ngAfterViewChecked();

      expect(component.submitButtonIsDisabled).toBe(true);
    });

    it('should retain the cached submit state when validity is unchanged', () => {
      component.ngAfterViewChecked();

      expect(component.submitButtonIsDisabled).toBe(true);
    });
  });

  describe('page unload', () => {
    let canPreventUnload: () => boolean;

    beforeEach(fakeAsync(() => {
      conversationFlowService.getHasInteractedAtLeastOnce.and.returnValue(true);
      explorationModeService.isInQuestionMode.and.returnValue(false);
      conversationFlowService.getRedirectToRefresherExplorationConfirmed.and.returnValue(
        false
      );
      initializeComponent();
      const callback =
        preventPageUnloadEventService.addListener.calls.mostRecent().args[0];
      if (!callback) {
        throw new Error('Expected a page unload validation callback.');
      }
      canPreventUnload = callback;
    }));

    it('should warn and report departure after interaction with an unfinished exploration', () => {
      expect(canPreventUnload()).toBe(true);
      expect(statsReportingService.recordMaybeLeaveEvent).toHaveBeenCalledWith(
        'Start',
        {score: '1'}
      );
    });

    it('should allow a confirmed redirect without reporting departure', () => {
      conversationFlowService.getRedirectToRefresherExplorationConfirmed.and.returnValue(
        true
      );

      expect(canPreventUnload()).toBe(false);
      expect(
        statsReportingService.recordMaybeLeaveEvent
      ).not.toHaveBeenCalled();
    });

    it('should allow departure before the learner interacts', () => {
      conversationFlowService.getHasInteractedAtLeastOnce.and.returnValue(
        false
      );

      expect(canPreventUnload()).toBe(false);
      expect(
        statsReportingService.recordMaybeLeaveEvent
      ).not.toHaveBeenCalled();
    });

    it('should allow departure from editor preview', () => {
      component.editorPreviewMode = true;

      expect(canPreventUnload()).toBe(false);
      expect(
        statsReportingService.recordMaybeLeaveEvent
      ).not.toHaveBeenCalled();
    });

    it('should allow departure from a terminal card', () => {
      conversationFlowService.getDisplayedCard.and.returnValue(
        createCard('End', 'EndExploration')
      );

      expect(canPreventUnload()).toBe(false);
      expect(
        statsReportingService.recordMaybeLeaveEvent
      ).not.toHaveBeenCalled();
    });

    it('should allow departure from question mode', () => {
      explorationModeService.isInQuestionMode.and.returnValue(true);

      expect(canPreventUnload()).toBe(false);
      expect(
        statsReportingService.recordMaybeLeaveEvent
      ).not.toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should stop responding to player events after destruction', fakeAsync(() => {
      explorationModeService.isInQuestionPlayerMode.and.returnValue(true);
      initializeComponent();
      fixture.destroy();
      hintsAndSolutionManagerService.onHintConsumed.emit();
      hintsAndSolutionManagerService.onSolutionViewedEventEmitter.emit();
      hintsAndSolutionManagerService.onLearnerReallyStuck.emit();
      hintsAndSolutionManagerService.onHintsExhausted.emit();
      conceptCardManagerService.onLearnerGetsReallyStuck.emit();
      playerPositionService.onNewCardOpened.emit(displayedCard);
      conversationFlowService.onPlayerStateChange.emit('End');
      conversationFlowService.onShowProgressModal.emit(true);

      expect(component.directiveSubscriptions.closed).toBe(true);
      expect(
        preventPageUnloadEventService.removeListener
      ).toHaveBeenCalledTimes(1);
      expect(questionPlayerEngineService.recordHintUsed).not.toHaveBeenCalled();
      expect(
        questionPlayerEngineService.recordSolutionViewed
      ).not.toHaveBeenCalled();
      expect(
        conversationFlowService.triggerIfLearnerStuckAction
      ).not.toHaveBeenCalled();
      expect(
        conversationFlowService.setSolutionForState
      ).not.toHaveBeenCalled();
      expect(conversationFlowService.setHasFullyLoaded).not.toHaveBeenCalled();
      expect(imagePreloaderService.onStateChange).not.toHaveBeenCalled();
      expect(component.isLearnerReallyStuck).toBe(false);
    }));
  });

  describe('card navigation', () => {
    it('should identify a terminal card', () => {
      conversationFlowService.getDisplayedCard.and.returnValue(
        createCard('End', 'EndExploration')
      );

      expect(component.isOnTerminalCard()).toBe(true);
    });

    it('should identify a nonterminal card', () => {
      expect(component.isOnTerminalCard()).toBe(false);
    });

    it('should tolerate an unavailable displayed card', () => {
      conversationFlowService.getDisplayedCard.and.stub();

      expect(component.isOnTerminalCard()).toBeUndefined();
      expect(component.isCurrentSupplementalCardNonempty()).toBeUndefined();
      expect(
        conversationFlowService.isSupplementalCardNonempty
      ).not.toHaveBeenCalled();
    });

    it('should check supplemental content for the displayed card', () => {
      conversationFlowService.isSupplementalCardNonempty.and.returnValue(true);

      expect(component.isCurrentSupplementalCardNonempty()).toBe(true);
      expect(
        conversationFlowService.isSupplementalCardNonempty
      ).toHaveBeenCalledWith(displayedCard);
    });

    it('should hide supplemental navigation when no interaction is configured', () => {
      conversationFlowService.getDisplayedCard.and.returnValue(
        createCard('Start', null)
      );

      expect(component.isSupplementalNavShown()).toBe(false);
    });

    it('should hide supplemental navigation for a concept card outside question mode', () => {
      // Concept cards can have a null state name at runtime.
      Object.defineProperty(displayedCard, '_stateName', {value: null});
      explorationModeService.isInQuestionMode.and.returnValue(false);

      expect(component.isSupplementalNavShown()).toBe(false);
    });

    it('should allow supplemental navigation for a question without a state name', () => {
      Object.defineProperty(displayedCard, '_stateName', {value: null});
      explorationModeService.isInQuestionMode.and.returnValue(true);
      playerPositionService.isCurrentCardAtEndOfTranscript.and.returnValue(
        true
      );

      expect(component.isSupplementalNavShown()).toBe(true);
    });

    it('should hide supplemental navigation for an unrecognized interaction', () => {
      Object.defineProperty(displayedCard.getInteraction(), 'id', {
        value: 'UnknownInteraction',
      });

      expect(component.isSupplementalNavShown()).toBe(false);
    });

    it('should hide supplemental navigation when the interaction supplies its own submit control', () => {
      conversationFlowService.getDisplayedCard.and.returnValue(
        createCard('Start', 'Continue')
      );
      playerPositionService.isCurrentCardAtEndOfTranscript.and.returnValue(
        true
      );

      expect(component.isSupplementalNavShown()).toBe(false);
    });

    it('should hide supplemental navigation while viewing an earlier card', () => {
      playerPositionService.isCurrentCardAtEndOfTranscript.and.returnValue(
        false
      );

      expect(component.isSupplementalNavShown()).toBe(false);
    });

    it('should show supplemental navigation at the last card for an interaction requiring submission', () => {
      playerPositionService.isCurrentCardAtEndOfTranscript.and.returnValue(
        true
      );

      expect(component.isSupplementalNavShown()).toBe(true);
    });

    it('should recognize a state completed during the previous session', () => {
      playerTranscriptService.getPrevSessionStatesProgress.and.returnValue([
        'Start',
      ]);

      expect(component.isDisplayedCardCompletedInPrevSession()).toBe(true);
    });

    it('should recognize a state not completed during the previous session', () => {
      playerTranscriptService.getPrevSessionStatesProgress.and.returnValue([
        'Another state',
      ]);

      expect(component.isDisplayedCardCompletedInPrevSession()).toBe(false);
    });

    it('should tolerate an unavailable interaction when checking prior progress', () => {
      Object.defineProperty(displayedCard, '_interaction', {value: null});

      expect(component.isDisplayedCardCompletedInPrevSession()).toBeNull();
    });
  });

  describe('correctness feedback', () => {
    beforeEach(() => {
      conversationFlowService.getAnswerIsCorrect.and.returnValue(true);
      playerPositionService.hasLearnerJustSubmittedAnAnswer.and.returnValue(
        true
      );
    });

    it('should enable feedback after a correct answer is submitted', () => {
      expect(component.isCorrectnessFooterEnabled()).toBe(true);
    });

    it('should hide feedback when the footer is disabled for this mode', () => {
      component.correctnessFooterIsShown = false;

      expect(component.isCorrectnessFooterEnabled()).toBe(false);
    });

    it('should hide feedback for an incorrect answer', () => {
      conversationFlowService.getAnswerIsCorrect.and.returnValue(false);

      expect(component.isCorrectnessFooterEnabled()).toBe(false);
    });

    it('should hide feedback before an answer has just been submitted', () => {
      playerPositionService.hasLearnerJustSubmittedAnAnswer.and.returnValue(
        false
      );

      expect(component.isCorrectnessFooterEnabled()).toBe(false);
    });
  });

  describe('recommendations and translations', () => {
    it('should derive the next exploration link from the recommended summaries', () => {
      const summaries = [
        new LearnerExplorationSummary(
          'Algebra',
          false,
          'next-exp',
          'en',
          0,
          'Learn',
          'public',
          [],
          '#ffffff',
          '',
          'Next lesson',
          'exploration',
          0,
          0,
          {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
          {}
        ),
      ];
      conversationFlowService.getRecommendedExplorationSummaries.and.returnValue(
        summaries
      );
      explorationRecommendationsService.getExplorationLink.and.returnValue(
        '/explore/next-exp'
      );

      expect(component.getExplorationLink()).toBe('/explore/next-exp');
      expect(
        explorationRecommendationsService.getExplorationLink
      ).toHaveBeenCalledWith(summaries);
      expect(component.getRecommendationExplorationSummaries()).toEqual(
        summaries
      );
    });

    it('should request the title translation key for the specified exploration', () => {
      i18nLanguageCodeService.getExplorationTranslationKey.and.returnValue(
        'TITLE_KEY'
      );

      expect(component.getRecommendedExpTitleTranslationKey('next-exp')).toBe(
        'TITLE_KEY'
      );
      expect(
        i18nLanguageCodeService.getExplorationTranslationKey
      ).toHaveBeenCalledWith('next-exp', TranslationKeyType.TITLE);
    });

    [true, false].forEach(translated => {
      it(
        'should expose recommendation translation availability as ' +
          translated,
        () => {
          i18nLanguageCodeService.getExplorationTranslationKey.and.returnValue(
            'TITLE_KEY'
          );
          i18nLanguageCodeService.isHackyTranslationDisplayed.and.returnValue(
            translated
          );

          expect(
            component.isHackyExpTitleTranslationDisplayed('next-exp')
          ).toBe(translated);
          expect(
            i18nLanguageCodeService.isHackyTranslationDisplayed
          ).toHaveBeenCalledWith('TITLE_KEY');
        }
      );
    });

    it('should resolve the requested static image path', () => {
      urlInterpolationService.getStaticImageUrl.and.returnValue(
        'resolved/image.svg'
      );

      expect(component.getStaticImageUrl('image.svg')).toBe(
        'resolved/image.svg'
      );
      expect(urlInterpolationService.getStaticImageUrl).toHaveBeenCalledWith(
        'image.svg'
      );
    });
  });

  describe('responsive layout', () => {
    it('should allow two cards above the width threshold', () => {
      windowDimensionsService.getWidth.and.returnValue(
        ExplorationPlayerConstants.TWO_CARD_THRESHOLD_PX + 1
      );

      expect(component.canWindowShowTwoCards()).toBe(true);
    });

    it('should use one card at the exact width threshold', () => {
      windowDimensionsService.getWidth.and.returnValue(
        ExplorationPlayerConstants.TWO_CARD_THRESHOLD_PX
      );

      expect(component.canWindowShowTwoCards()).toBe(false);
    });

    it('should use one card below the width threshold', () => {
      windowDimensionsService.getWidth.and.returnValue(
        ExplorationPlayerConstants.TWO_CARD_THRESHOLD_PX - 1
      );

      expect(component.canWindowShowTwoCards()).toBe(false);
    });
  });

  describe('player status bindings', () => {
    [true, false].forEach(value => {
      it('should expose answer processing as ' + value, () => {
        conversationFlowService.getAnswerIsBeingProcessed.and.returnValue(
          value
        );

        expect(component.getAnswerIsBeingProcessed()).toBe(value);
      });
    });
    [true, false].forEach(value => {
      it('should expose answer detail availability as ' + value, () => {
        learnerAnswerInfoService.getCanAskLearnerForAnswerInfo.and.returnValue(
          value
        );

        expect(component.getCanAskLearnerForAnswerInfo()).toBe(value);
      });
    });
    [true, false].forEach(value => {
      it('should expose two-card animation as ' + value, () => {
        cardAnimationService.getIsAnimatingToTwoCards.and.returnValue(value);

        expect(component.getIsAnimatingToTwoCards()).toBe(value);
      });
    });
    [true, false].forEach(value => {
      it('should expose one-card animation as ' + value, () => {
        cardAnimationService.getIsAnimatingToOneCard.and.returnValue(value);

        expect(component.getIsAnimatingToOneCard()).toBe(value);
      });
    });
    [true, false].forEach(value => {
      it('should expose transcript position as ' + value, () => {
        playerPositionService.isCurrentCardAtEndOfTranscript.and.returnValue(
          value
        );

        expect(component.isCurrentCardAtEndOfTranscript()).toBe(value);
      });
    });
    [true, false].forEach(value => {
      it('should expose learn again availability as ' + value, () => {
        conversationFlowService.isLearnAgainButton.and.returnValue(value);

        expect(component.isLearnAgainButton()).toBe(value);
      });
    });
    [true, false].forEach(value => {
      it('should expose progress clearance as ' + value, () => {
        conversationFlowService.getShowProgressClearanceMessage.and.returnValue(
          value
        );

        expect(component.isProgressClearanceMessageShown()).toBe(value);
      });
    });
    [true, false].forEach(value => {
      it('should expose player loading as ' + value, () => {
        conversationFlowService.getHasFullyLoaded.and.returnValue(value);

        expect(component.getHasFullyLoaded()).toBe(value);
      });
    });
    [true, false].forEach(value => {
      it('should expose story chapter mode as ' + value, () => {
        explorationModeService.isInStoryChapterMode.and.returnValue(value);

        expect(component.getIsInStoryMode()).toBe(value);
      });
    });

    it('should expose the currently displayed card', () => {
      expect(component.getDisplayedCard()).toBe(displayedCard);
    });
  });

  describe('rendered player', () => {
    beforeEach(() => {
      conversationFlowService.getHasFullyLoaded.and.returnValue(true);
    });

    it('should hide the lesson until the player has fully loaded', () => {
      conversationFlowService.getHasFullyLoaded.and.returnValue(false);
      fixture.detectChanges();

      expect(
        fixture.debugElement.query(
          By.css('.e2e-test-conversation-skin-cards-container')
        )
      ).toBeNull();
    });

    it('should render the tutor card after loading', () => {
      fixture.detectChanges();

      expect(
        fixture.debugElement.query(By.css('oppia-tutor-card'))
      ).not.toBeNull();
      expect(
        fixture.debugElement.query(
          By.css('.e2e-test-conversation-skin-cards-container')
        )
      ).not.toBeNull();
    });

    it('should display the answer info card instead of progress navigation when details are requested', () => {
      learnerAnswerInfoService.getCanAskLearnerForAnswerInfo.and.returnValue(
        true
      );
      fixture.detectChanges();

      expect(
        fixture.debugElement.query(By.css('oppia-learner-answer-info-card'))
      ).not.toBeNull();
      expect(
        fixture.debugElement.query(By.css('oppia-progress-nav'))
      ).toBeNull();
    });

    it('should submit an answer when progress navigation emits submit', () => {
      fixture.detectChanges();
      fixture.debugElement
        .query(By.css('oppia-progress-nav'))
        .triggerEventHandler('submit', null);

      expect(displayedCard.getInteraction().submitClicked).toBe(true);
      expect(currentInteractionService.submitAnswer).toHaveBeenCalledTimes(1);
    });

    it('should handle the progress navigation skip event', () => {
      fixture.detectChanges();
      fixture.debugElement
        .query(By.css('oppia-progress-nav'))
        .triggerEventHandler('skipQuestion', null);

      expect(
        diagnosticTestPlayerEngineService.skipCurrentQuestion
      ).toHaveBeenCalledTimes(1);
    });

    it('should handle the progress navigation revision event', () => {
      fixture.detectChanges();
      fixture.debugElement
        .query(By.css('oppia-progress-nav'))
        .triggerEventHandler('clickContinueToReviseButton', null);

      expect(
        conversationFlowService.setOriginalStuckStateName
      ).toHaveBeenCalledWith('Start');
      expect(component.showInteraction).toBe(false);
      expect(conversationFlowService.showPendingCard).toHaveBeenCalledTimes(1);
    });

    it('should render a disabled supplemental submit button until the answer becomes valid', () => {
      conversationFlowService.isSupplementalCardNonempty.and.returnValue(true);
      playerPositionService.isCurrentCardAtEndOfTranscript.and.returnValue(
        true
      );
      fixture.detectChanges();
      const button: HTMLButtonElement = fixture.debugElement.query(
        By.css('.e2e-test-submit-answer-button')
      ).nativeElement;

      expect(button.disabled).toBe(true);

      currentInteractionService.isSubmitButtonDisabled.and.returnValue(false);
      fixture.detectChanges();

      expect(button.disabled).toBe(false);
      button.click();
      expect(currentInteractionService.submitAnswer).toHaveBeenCalledTimes(1);
    });

    it('should place supplemental content below the tutor on a narrow screen', () => {
      conversationFlowService.isSupplementalCardNonempty.and.returnValue(true);
      windowDimensionsService.getWidth.and.returnValue(500);
      fixture.detectChanges();

      expect(
        fixture.debugElement.query(
          By.css(
            '.conversation-skin-tutor-card-container oppia-supplemental-card'
          )
        )
      ).not.toBeNull();
      expect(
        fixture.debugElement.query(
          By.css('.conversation-skin-supplemental-card-container')
        )
      ).toBeNull();
    });

    it('should render correctness feedback only for a newly submitted correct answer', () => {
      fixture.detectChanges();
      expect(
        fixture.debugElement.query(By.css('oppia-correctness-footer'))
      ).toBeNull();

      conversationFlowService.getAnswerIsCorrect.and.returnValue(true);
      playerPositionService.hasLearnerJustSubmittedAnAnswer.and.returnValue(
        true
      );
      fixture.detectChanges();

      expect(
        fixture.debugElement.query(By.css('oppia-correctness-footer'))
      ).not.toBeNull();
    });

    it('should render the restart progress message when requested', () => {
      conversationFlowService.getShowProgressClearanceMessage.and.returnValue(
        true
      );
      fixture.detectChanges();

      expect(
        fixture.debugElement.query(
          By.css('.e2e-test-lesson-completion-message')
        )
      ).not.toBeNull();
    });

    it('should render the next story lesson with its destination and title', () => {
      conversationFlowService.getDisplayedCard.and.returnValue(
        createCard('End', 'EndExploration')
      );
      conversationFlowService.getRecommendedExplorationSummaries.and.returnValue(
        [
          new LearnerExplorationSummary(
            'Algebra',
            false,
            'next-exp',
            'en',
            0,
            'Learn',
            'public',
            [],
            '#ffffff',
            '',
            'Next lesson',
            'exploration',
            0,
            0,
            {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
            {}
          ),
        ]
      );
      explorationModeService.isInStoryChapterMode.and.returnValue(true);
      explorationRecommendationsService.getExplorationLink.and.returnValue(
        '/explore/next-exp'
      );
      fixture.detectChanges();
      const nextLesson = fixture.debugElement.query(
        By.css('.conversation-skin-next-lesson-wrapper')
      );
      const link: HTMLAnchorElement = nextLesson.query(
        By.css('a')
      ).nativeElement;

      expect(nextLesson.nativeElement.textContent).toContain('Next lesson');
      expect(link.getAttribute('href')).toBe('/explore/next-exp');
      expect(link.target).toBe('_self');
    });
    describe('next lesson', () => {
      beforeEach(() => {
        conversationFlowService.getDisplayedCard.and.returnValue(
          createCard('End', 'EndExploration')
        );
        conversationFlowService.getRecommendedExplorationSummaries.and.returnValue(
          [createRecommendation()]
        );
        explorationRecommendationsService.getExplorationLink.and.returnValue(
          '/explore/next-exp'
        );
      });

      it('should hide the next lesson before reaching the terminal card', () => {
        conversationFlowService.getDisplayedCard.and.returnValue(displayedCard);
        explorationModeService.isInStoryChapterMode.and.returnValue(true);
        fixture.detectChanges();

        expect(
          fixture.debugElement.query(
            By.css('.conversation-skin-next-lesson-wrapper')
          )
        ).toBeNull();
      });

      it('should hide the next lesson when no recommendations exist', () => {
        conversationFlowService.getRecommendedExplorationSummaries.and.returnValue(
          []
        );
        explorationModeService.isInStoryChapterMode.and.returnValue(true);
        fixture.detectChanges();

        expect(
          fixture.debugElement.query(
            By.css('.conversation-skin-next-lesson-wrapper')
          )
        ).toBeNull();
      });

      it('should render a collection recommendation at the end of the transcript', fakeAsync(() => {
        playerPositionService.isCurrentCardAtEndOfTranscript.and.returnValue(
          true
        );
        fixture.detectChanges();
        flushMicrotasks();
        component.collectionSummary = collectionSummary;
        fixture.detectChanges();

        expect(
          fixture.debugElement.query(
            By.css('.conversation-skin-next-lesson-wrapper')
          )
        ).not.toBeNull();
      }));

      it('should hide a collection recommendation while reviewing an earlier card', fakeAsync(() => {
        playerPositionService.isCurrentCardAtEndOfTranscript.and.returnValue(
          false
        );
        fixture.detectChanges();
        flushMicrotasks();
        component.collectionSummary = collectionSummary;
        fixture.detectChanges();

        expect(
          fixture.debugElement.query(
            By.css('.conversation-skin-next-lesson-wrapper')
          )
        ).toBeNull();
      }));

      it('should display the translated title when a translation is available', () => {
        explorationModeService.isInStoryChapterMode.and.returnValue(true);
        i18nLanguageCodeService.getExplorationTranslationKey.and.returnValue(
          'TRANSLATED_TITLE'
        );
        i18nLanguageCodeService.isHackyTranslationDisplayed.and.returnValue(
          true
        );
        fixture.detectChanges();
        const wrapper = fixture.debugElement.query(
          By.css('.conversation-skin-next-lesson-wrapper')
        );

        expect(wrapper.nativeElement.textContent).toContain('TRANSLATED_TITLE');
        expect(wrapper.nativeElement.textContent).not.toContain('Next lesson');
      });

      it('should open the next lesson in a new tab when embedded', () => {
        urlService.isIframed.and.returnValue(true);
        explorationModeService.isInStoryChapterMode.and.returnValue(true);
        fixture.detectChanges();
        const link: HTMLAnchorElement = fixture.debugElement.query(
          By.css('.conversation-skin-next-lesson-wrapper a')
        ).nativeElement;

        expect(link.target).toBe('_blank');
        expect(link.getAttribute('href')).toBe('/explore/next-exp');
      });
    });
  });
});
