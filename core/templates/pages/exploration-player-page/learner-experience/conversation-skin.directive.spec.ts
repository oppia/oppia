// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for Conversation skin directive.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { LearnerAnswerInfoService } from '../services/learner-answer-info.service';
import { UrlService } from 'services/contextual/url.service';
import { EventEmitter } from '@angular/core';
import { CurrentInteractionService } from '../services/current-interaction.service';
import { UserService } from 'services/user.service';
import { UserInfo } from 'domain/user/user-info.model';
import { ReadOnlyCollectionBackendApiService } from 'domain/collection/read-only-collection-backend-api.service';
import { Collection } from 'domain/collection/collection.model';
import { ExplorationPlayerStateService } from '../services/exploration-player-state.service';
import { LearnerViewRatingService } from '../services/learner-view-rating.service';
import { HintsAndSolutionManagerService } from '../services/hints-and-solution-manager.service';
import { ContextService } from 'services/context.service';
import { ImagePreloaderService } from '../services/image-preloader.service';
import { RecordedVoiceovers } from 'domain/exploration/recorded-voiceovers.model';
import { WrittenTranslationObjectFactory } from 'domain/exploration/WrittenTranslationObjectFactory';
import { StateCard } from 'domain/state_card/state-card.model';
import { StatsReportingService } from '../services/stats-reporting.service';
import { AlertsService } from 'services/alerts.service';
import { ContentTranslationManagerService } from '../services/content-translation-manager.service';
import { PlayerTranscriptService } from '../services/player-transcript.service';
import { PlayerPositionService } from '../services/player-position.service';
import { ContentTranslationLanguageService } from '../services/content-translation-language.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { InteractionObjectFactory } from 'domain/exploration/InteractionObjectFactory';
import { PlayerCorrectnessFeedbackEnabledService } from '../services/player-correctness-feedback-enabled.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { StoryNode } from 'domain/story/story-node.model';
// ^^^ This block is to be removed.

fdescribe('Conversation skin directive', function() {
  let $scope = null;
  let ctrl = null;
  let $rootScope = null;
  let $timeout = null;
  let $window = null;
  let $http = null;
  let $httpBackend = null;
  let directive = null;
  let UndoRedoService = null;
  let $uibModal = null;
  let SkillEditorRoutingService = null;
  let SkillEditorStateService = null;
  let learnerAnswerInfoService: LearnerAnswerInfoService = null;
  let focusManagerService: FocusManagerService = null;

  let urlService: UrlService = null;
  let currentInteractionService: CurrentInteractionService = null;
  let userService: UserService = null;
  let readOnlyCollectionBackendApiService:
    ReadOnlyCollectionBackendApiService = null;
  let explorationPlayerStateService: ExplorationPlayerStateService = null;
  let learnerViewRatingService: LearnerViewRatingService = null;
  let hintsAndSolutionManagerService: HintsAndSolutionManagerService = null;
  let contextService: ContextService = null;
  let imagePreloaderService: ImagePreloaderService = null;
  let QuestionPlayerStateService = null;
  let writtenTranslationsObjectFactory = null;
  let audioTranslationLanguageService = null;
  let statsReportingService: StatsReportingService = null;
  let alertsService: AlertsService = null;
  let contentTranslationManagerService: ContentTranslationManagerService = null;
  let playerTranscriptService: PlayerTranscriptService = null;
  let playerPositionService: PlayerPositionService = null;
  let contentTranslationLanguageService:
    ContentTranslationLanguageService = null;
  let siteAnalyticsService: SiteAnalyticsService = null;
  let interactionObjectFactory: InteractionObjectFactory = null;
  let playerCorrectnessFeedbackEnabledService:
    PlayerCorrectnessFeedbackEnabledService = null;
  let urlInterpolationService: UrlInterpolationService = null;

  let onAnswerChangedEventEmitter = new EventEmitter();
  let onHintConsumedEventEmitter = new EventEmitter();
  let onSolutionViewedEventEmitter = new EventEmitter();
  let onPlayerStateChangeEventEmitter = new EventEmitter();
  let onRatingUpdatedEventEmitter = new EventEmitter();
  let onStateCardContentUpdateEventEmitter = new EventEmitter();
  let alertSuccessSpy = null;
  let alertWarningSpy = null;
  let sampleCollection = null;
  let sampleCollectionBackendObject = null;
  let collectionNodeBackendObject = null;
  let sampleCard: StateCard = null;
  let interactionDict = null;
  let mockWindow = {
    location: {
      replace: jasmine.createSpy('replace'),
      reload:() => {}
    },
    addEventListener:() => {},
  };

  let userInfoForCollectionCreator = null;

  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        LearnerAnswerInfoService
      ]
    });
    focusManagerService = TestBed.inject(FocusManagerService);
  });

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('$window', mockWindow);
  }));

  beforeEach(angular.mock.inject(function($injector) {
    $rootScope = $injector.get('$rootScope');
    $timeout = $injector.get('$timeout');
    $scope = $rootScope.$new();
    $window = $injector.get('$window');
    $http = $injector.get('$http');
    $httpBackend = $injector.get('$httpBackend');
    $uibModal = $injector.get('$uibModal');
    UndoRedoService = $injector.get('UndoRedoService');
    directive = $injector.get('conversationSkinDirective')[0];
    SkillEditorStateService = $injector.get('SkillEditorStateService');
    SkillEditorRoutingService = $injector.get('SkillEditorRoutingService');
    focusManagerService = $injector.get('FocusManagerService');
    learnerAnswerInfoService = TestBed.inject(LearnerAnswerInfoService);

    urlService = $injector.get('UrlService');
    userService = $injector.get('UserService');
    readOnlyCollectionBackendApiService = $injector.get(
      'ReadOnlyCollectionBackendApiService');
    currentInteractionService = $injector.get('CurrentInteractionService');
    explorationPlayerStateService = $injector.get(
      'ExplorationPlayerStateService');
    learnerViewRatingService = $injector.get('LearnerViewRatingService');
    hintsAndSolutionManagerService = $injector.get(
      'HintsAndSolutionManagerService');
    QuestionPlayerStateService = $injector.get('QuestionPlayerStateService');
    contextService = $injector.get('ContextService');
    imagePreloaderService = $injector.get('ImagePreloaderService');
    writtenTranslationsObjectFactory = $injector.get(
      'WrittenTranslationsObjectFactory');
    audioTranslationLanguageService = $injector.get('AudioTranslationLanguageService');
    statsReportingService = $injector.get('StatsReportingService');
    alertsService = $injector.get('AlertsService');
    contentTranslationManagerService = $injector.get(
      'ContentTranslationManagerService');
    playerTranscriptService = $injector.get('PlayerTranscriptService');
    playerPositionService = $injector.get('PlayerPositionService');
    contentTranslationLanguageService = $injector.get(
      'ContentTranslationLanguageService');
    siteAnalyticsService = $injector.get('SiteAnalyticsService');
    interactionObjectFactory = $injector.get('InteractionObjectFactory');
    playerCorrectnessFeedbackEnabledService = $injector.get(
      'PlayerCorrectnessFeedbackEnabledService');
    urlInterpolationService = $injector.get('UrlInterpolationService');
    focusManagerService = $injector.get('FocusManagerService');
    focusManagerService = $injector.get('FocusManagerService');

    userInfoForCollectionCreator = {
      _role: 'USER_ROLE',
      _isModerator: true,
      _isAdmin: false,
      _isTopicManager: false,
      _isSuperAdmin: false,
      _canCreateCollections: true,
      _preferredSiteLanguageCode: 'en',
      _username: 'username1',
      _email: 'tester@example.org',
      _isLoggedIn: true,
      isModerator: () => true,
      isAdmin: () => false,
      isSuperAdmin: () => false,
      isTopicManager: () => false,
      isTranslationAdmin: () => false,
      isQuestionAdmin: () => false,
      canCreateCollections: () => true,
      getPreferredSiteLanguageCode: () =>'en',
      getUsername: () => 'username1',
      getEmail: () => 'tester@example.org',
      isLoggedIn: () => true
    };

    collectionNodeBackendObject = {
      exploration_id: 'exp_id',
      exploration_summary: {
        last_updated_msec: 1591296737470.528,
        community_owned: false,
        objective: 'Test Objective',
        id: '44LKoKLlIbGe',
        num_views: 0,
        thumbnail_icon_url: '/subjects/Algebra.svg',
        human_readable_contributors_summary: {},
        language_code: 'en',
        thumbnail_bg_color: '#cd672b',
        created_on_msec: 1591296635736.666,
        ratings: {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0
        },
        status: 'public',
        tags: [],
        activity_type: 'exploration',
        category: 'Algebra',
        title: 'Test Title'
      }
    };

    sampleCollectionBackendObject = {
      id: 'collectionId',
      title: 'title',
      objective: 'objective',
      category: 'category',
      version: 1,
      nodes: [
        collectionNodeBackendObject
      ],
      language_code: null,
      schema_version: null,
      tags: null,
      playthrough_dict: {
        next_exploration_id: 'expId',
        completed_exploration_ids: ['expId2']
      }
    };

    interactionDict = {
      id: 'Continue',
      default_outcome: {
        feedback: {
          content_id: 'default_outcome',
          html: ''
        },
        dest: 'State 3',
        param_changes: [],
        labelled_as_correct: false,
        refresher_exploration_id: null,
        missing_prerequisite_skill_id: null,
      },
      confirmed_unclassified_answers: [],
      customization_args: {
        buttonText: {
          value: 'Continue'
        }
      },
      solution: null,
      answer_groups: [],
      hints: []
    };

    sampleCard = StateCard.createNewCard(
      'State 1', '<p>Content</p>', '<interaction></interaction>',
      interactionObjectFactory.createFromBackendDict(interactionDict), RecordedVoiceovers.createEmpty(),
      writtenTranslationsObjectFactory.createEmpty(),
      'content', audioTranslationLanguageService);

    sampleCollection = Collection.create(
      sampleCollectionBackendObject);

    spyOn(urlService, 'getCollectionIdFromExplorationUrl')
      .and.returnValue('collectionId');
    spyOn(userService, 'getUserInfoAsync')
      .and.returnValue(Promise.resolve(userInfoForCollectionCreator));
    spyOn(readOnlyCollectionBackendApiService, 'loadCollectionAsync')
      .and.resolveTo(sampleCollection);
    spyOn(explorationPlayerStateService, 'isInQuestionPlayerMode')
      .and.returnValue(true);
    spyOn($window, 'addEventListener').and.callFake((evt, cb) => {
      cb();
    });
    spyOn(learnerViewRatingService, 'init').and.callFake((cb) => {
      cb('userRating');
    });
    alertSuccessSpy = spyOn(
      alertsService, 'addSuccessMessage').and.returnValue(null);
    alertWarningSpy = spyOn(
      alertsService, 'addWarning').and.returnValue(null);

    ctrl = $injector.instantiate(directive.controller, {
      $scope: $scope,
      $rootScope: $scope,
      $window: $window,
      LearnerAnswerInfoService: learnerAnswerInfoService,
      WHITELISTED_COLLECTION_IDS_FOR_SAVING_GUEST_PROGRESS: [],
      CONTENT_FOCUS_LABEL_PREFIX: 'contentLabel'
    });
    $scope.getQuestionPlayerConfig = function() {
      return;
    };
  }));

  afterEach(() => {
    ctrl.$onDestroy();
  });

  describe('on initalization', function() {
    it('should set properties successfully', function() {
      spyOnProperty(currentInteractionService, 'onAnswerChanged$')
        .and.returnValue(onAnswerChangedEventEmitter);
  
      ctrl.$onInit();
      onAnswerChangedEventEmitter.emit();
  
      expect($scope.userRating).toBe('userRating');
    });

    it('should show user that hint has been used ' +
      'when hint has already been used', function() {
      spyOnProperty(hintsAndSolutionManagerService, 'onHintConsumed')
        .and.returnValue(onHintConsumedEventEmitter);
      let hintConsumedSpy = spyOn(
        QuestionPlayerStateService, 'hintUsed').and.returnValue(null);
  
      ctrl.$onInit();
      onHintConsumedEventEmitter.emit();
  
      expect(hintConsumedSpy).toHaveBeenCalled();
    });

    it('should show user that solution has been shown ' +
      'when user has already requested for solution', function() {
      spyOnProperty(hintsAndSolutionManagerService,
        'onSolutionViewedEventEmitter')
        .and.returnValue(onSolutionViewedEventEmitter);
      let hintConsumedSpy = spyOn(
        QuestionPlayerStateService, 'solutionViewed').and.returnValue(null);
  
      ctrl.$onInit();
      onSolutionViewedEventEmitter.emit();
  
      expect(hintConsumedSpy).toHaveBeenCalled();
    });

    it('should call success alert message when ' +
      'rating is updated successfully', function() {
      spyOnProperty(learnerViewRatingService,
        'onRatingUpdated').and.returnValue(onRatingUpdatedEventEmitter);
      spyOnProperty(contentTranslationManagerService,
        'onStateCardContentUpdate')
        .and.returnValue(onStateCardContentUpdateEventEmitter);

      ctrl.$onInit();
      onRatingUpdatedEventEmitter.emit();
      onStateCardContentUpdateEventEmitter.emit();

      expect(alertSuccessSpy).toHaveBeenCalledWith('Rating saved!', 1000);
    });

    it('should send request to backend to fetch collection summary ' +
      'given collection id', fakeAsync(function() {
      $httpBackend.expect(
        'GET', '/collectionsummarieshandler/data' +
        '?stringified_collection_ids=' +
        encodeURI(JSON.stringify(['collectionId']))).respond({
          summaries: ['collectionSummary']
        });

      expect($scope.collectionSummary).toBe(undefined);

      ctrl.$onInit();
      $scope.$apply();
      $httpBackend.flush();
      tick();

      expect($scope.collectionSummary).toBe('collectionSummary');
    }));

    it('should fail to fetch collection summary from backend' +
      'incase of backend error', fakeAsync(function() {
      $httpBackend.expect(
        'GET', '/collectionsummarieshandler/data' +
        '?stringified_collection_ids=' +
        encodeURI(JSON.stringify(['collectionId']))).respond(500);

      ctrl.$onInit();
      $scope.$apply();
      $httpBackend.flush();
      tick();

      expect(alertWarningSpy).toHaveBeenCalledWith(
        'There was an error while fetching the collection summary.');
    }));
  });

  describe('on exploration player state change', function() {
    it('should not preload image when ' +
      'given state name is not valid', function() {
      spyOnProperty(explorationPlayerStateService, 'onPlayerStateChange')
        .and.returnValue(onPlayerStateChangeEventEmitter);
      spyOn(contextService, 'isInExplorationEditorPage').and.returnValue(false);
      let imagePreloaderSpy = spyOn(imagePreloaderService, 'onStateChange')
        .and.returnValue(null);
      ctrl.$onInit();
      $scope.nextCard = sampleCard;
      onPlayerStateChangeEventEmitter.emit(null);
  
      expect(imagePreloaderSpy).not.toHaveBeenCalled();
    });

    it('should preload image when ' +
      'given state name is valid', function() {
      spyOnProperty(explorationPlayerStateService, 'onPlayerStateChange')
        .and.returnValue(onPlayerStateChangeEventEmitter);
      spyOn(contextService, 'isInExplorationEditorPage').and.returnValue(false);
      spyOn(statsReportingService, 'recordExplorationCompleted')
        .and.returnValue(null);
      let imagePreloaderSpy = spyOn(imagePreloaderService, 'onStateChange')
        .and.returnValue(null);

      ctrl.$onInit();
      $scope.nextCard = sampleCard;
      onPlayerStateChangeEventEmitter.emit('State 1');

      expect(imagePreloaderSpy).toHaveBeenCalled();
    });
  });

  it('should open sign in page if user is not signed in' +
    'when clicking on sign in button', fakeAsync(function() {
    let loginSpy = spyOn(
      userService, 'getLoginUrlAsync').and.resolveTo('loginUrl');

    $scope.signIn();
    tick();

    expect(loginSpy).toHaveBeenCalled();
  }));

  it('should be able to submit answer from progress navbar ' +
    'when calling \'submitAnswerFromProgressNav\'', fakeAsync(function() {
    let submtAnswerSpy = spyOn(
      currentInteractionService, 'submitAnswer').and.returnValue(null);

    $scope.submitAnswerFromProgressNav();
    tick();

    expect(submtAnswerSpy).toHaveBeenCalled();
  }));

  it('should check whether submit button is disabled ' +
    'when calling \'isSubmitButtonDisabled\'', function() {
    spyOn(currentInteractionService, 'isSubmitButtonDisabled')
      .and.returnValue(true);
    spyOn(playerTranscriptService, 'isLastCard')
      .and.returnValue(true);

    let result = $scope.isSubmitButtonDisabled();

    expect(result).toBe(true);
  });

  it('should enable submit button when ' +
    'current index is not last index', function() {
    spyOn(playerTranscriptService, 'isLastCard')
      .and.returnValue(false);

    let result = $scope.isSubmitButtonDisabled();

    expect(result).toBe(false);
  });

  describe('on showing upcoming card ', function() {
    it('should return back to exploration if concept card is ' +
      'being shown and current card is last card', function() {
      sampleCard = StateCard.createNewCard(
        null, '<p>Content</p>', '<interaction></interaction>',
        null, RecordedVoiceovers.createEmpty(),
        writtenTranslationsObjectFactory.createEmpty(),
        'content', audioTranslationLanguageService);

      spyOn(playerPositionService, 'getDisplayedCardIndex')
        .and.returnValue(1);
      spyOn(explorationPlayerStateService, 'isInQuestionMode')
        .and.returnValue(false);
      spyOn(explorationPlayerStateService, 'recordNewCardAdded')
        .and.returnValue(null);
      spyOn(playerTranscriptService, 'isLastCard').and.returnValue(true);
      let returnToExplorationspy = spyOn(
        $scope, 'returnToExplorationAfterConceptCard')
        .and.returnValue(null);

      $scope.displayedCard = sampleCard;
      $scope.showUpcomingCard();

      expect(returnToExplorationspy).toHaveBeenCalled();
    });

    it('should notify \'QuestionPlayerStateService\' ' +
      'if question player session has completed', function() {
      spyOn(playerPositionService, 'getDisplayedCardIndex')
        .and.returnValue(1);
      spyOn(explorationPlayerStateService, 'isInQuestionMode')
        .and.returnValue(false);
      spyOn(explorationPlayerStateService, 'recordNewCardAdded')
        .and.returnValue(null);
      spyOn(QuestionPlayerStateService, 'getQuestionPlayerStateData')
        .and.returnValue('questionData');
      let questionSessionCompletedSpy = spyOn(
        QuestionPlayerStateService.onQuestionSessionCompleted,
        'emit').and.returnValue(null);

      $scope.questionSessionCompleted = true;
      $scope.displayedCard = sampleCard;
      $scope.showUpcomingCard();

      expect(questionSessionCompletedSpy).toHaveBeenCalled();
    });

    it('should navigate to the given exploration', function() {
      spyOn(playerPositionService, 'getDisplayedCardIndex')
        .and.returnValue(1);
      spyOn(explorationPlayerStateService, 'isInQuestionMode')
        .and.returnValue(false);
      spyOn(explorationPlayerStateService, 'recordNewCardAdded')
        .and.returnValue(null);
      spyOn(QuestionPlayerStateService, 'getQuestionPlayerStateData')
        .and.returnValue('questionData');
      let moveToExplorationSpy = spyOn(
        explorationPlayerStateService,'moveToExploration')
        .and.returnValue(null);

      $scope.moveToExploration= true;
      $scope.displayedCard = sampleCard;
      $scope.showUpcomingCard();

      expect(moveToExplorationSpy).toHaveBeenCalled();
    });

    it('should set \'pendingCardWasSeenBefore\' to false ' +
      'if submitted answer is correct', function() {
      spyOn($scope, 'showPendingCard').and.returnValue(null);
      expect($scope.pendingCardWasSeenBefore).toBe(undefined);

      $scope.answerIsCorrect = true;
      $scope.displayedCard = sampleCard;
      $scope.showUpcomingCard();

      expect($scope.pendingCardWasSeenBefore).toBe(false);
    });

    it('should record if new card was added', function() {
      spyOn($scope, 'showPendingCard').and.returnValue(null);
      spyOn(explorationPlayerStateService, 'getLanguageCode')
        .and.returnValue('en');
      spyOn(contentTranslationLanguageService, 'getCurrentContentLanguageCode')
        .and.returnValue('en');
      spyOn(playerPositionService, 'setDisplayedCardIndex').and.returnValue(null);
      spyOn(playerPositionService, 'changeCurrentQuestion').and.returnValue(null);
      let recordNewCardSpy = spyOn(
        explorationPlayerStateService,'recordNewCardAdded')
        .and.returnValue(null);

      $scope.displayedCard = sampleCard;
      $scope.nextCard = sampleCard;
      $scope.conceptCard = {
        getExplanation: () => 'explanation'
      };
      $scope.displayedCard.markAsCompleted();
      $scope.showUpcomingCard();

      expect(recordNewCardSpy).toHaveBeenCalled();
    });
  });

  describe('on verifying if learn again button is active ', function() {
    it('should return false if concept card is being shown', function() {
      spyOn(explorationPlayerStateService, 'isInQuestionMode')
      .and.returnValue(false);
      sampleCard = StateCard.createNewCard(
        null, '<p>Content</p>', '<interaction></interaction>',
        null, RecordedVoiceovers.createEmpty(),
        writtenTranslationsObjectFactory.createEmpty(),
        'content', audioTranslationLanguageService);
      $scope.displayedCard = sampleCard;

      let result = $scope.isLearnAgainButton();

      expect(result).toBe(false);
    });

    it('should return false if interaction is linear', function() {
      $scope.displayedCard = sampleCard;

      let result = $scope.isLearnAgainButton();

      expect(result).toBe(false);
    });

    it('should return true if pending card was seen ' +
      'before and answer is incorrect', function() {
      let interactionDict = {
        id: 'TextInput',
        answer_groups: [
          {
            outcome: {
              dest: 'State',
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
        },
        hints: [],
        solution: {
          answer_is_exclusive: true,
          correct_answer: 'test_answer',
          explanation: {
            content_id: '2',
            html: 'test_explanation1',
          },
        },
      };
      sampleCard = StateCard.createNewCard(
        'stateName', '<p>Content</p>', '<interaction></interaction>',
        interactionObjectFactory.createFromBackendDict(interactionDict), RecordedVoiceovers.createEmpty(),
        writtenTranslationsObjectFactory.createEmpty(),
        'content', audioTranslationLanguageService);
      spyOn(playerCorrectnessFeedbackEnabledService, 'isEnabled')
        .and.returnValue(true);
      $scope.displayedCard = sampleCard;
      $scope.pendingCardWasSeenBefore = true;
      $scope.answerIsCorrect = false;

      let result = $scope.isLearnAgainButton();

      expect(result).toBe(true);
    });
  });

  describe('on getting exploration link ', function() {
    it('should return' +
      '', function() {
      spyOn(urlService, 'getUrlParams').and.returnValue({
        collection_id: 'collectionId'
      });
      let storyNode = {
        id: 'nodeId',
        parentExplorationIds: [],
        nextNodeId: 'nextNodeId'
      };
      $scope.recommendedExplorationSummaries = [storyNode];

      let result = $scope.getExplorationLink();

      expect(result).toBe('/explore/nodeId?collection_id=collectionId');
    });
  });

  it('should register an iframe event when' +
    'calling \'onNavigateFromIframe\' ', function() {
    let iframeEventSpy = spyOn(
      siteAnalyticsService, 'registerVisitOppiaFromIframeEvent')
      .and.returnValue(null);

    $scope.onNavigateFromIframe();

    expect(iframeEventSpy).toHaveBeenCalled();
  });

  it('should get static image url when' +
    'calling \'getStaticImageUrl\' ', function() {
    spyOn(urlInterpolationService, 'getStaticImageUrl')
      .and.returnValue('url');

    let result = $scope.getStaticImageUrl();

    expect(result).toBe('url');
  });

  it('should get content focus label when' +
    'calling \'getContentFocusLabel\' ', function() {
    let result = $scope.getContentFocusLabel('2');

    expect(result).toBe('contentLabel2');
  });
});