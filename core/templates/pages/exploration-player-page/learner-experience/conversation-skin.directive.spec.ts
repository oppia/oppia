// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
// ^^^ This block is to be removed.
import { discardPeriodicTasks, fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { LearnerAnswerInfoService } from '../services/learner-answer-info.service';
import { UrlService } from 'services/contextual/url.service';
import { EventEmitter } from '@angular/core';
import { CurrentInteractionService } from '../services/current-interaction.service';
import { UserService } from 'services/user.service';
import { ReadOnlyCollectionBackendApiService } from 'domain/collection/read-only-collection-backend-api.service';
import { Collection } from 'domain/collection/collection.model';
import { ExplorationPlayerStateService } from '../services/exploration-player-state.service';
import { LearnerViewRatingService } from '../services/learner-view-rating.service';
import { HintsAndSolutionManagerService } from '../services/hints-and-solution-manager.service';
import { ContextService } from 'services/context.service';
import { ImagePreloaderService } from '../services/image-preloader.service';
import { BindableVoiceovers, RecordedVoiceovers } from 'domain/exploration/recorded-voiceovers.model';
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
import { MessengerService } from 'services/messenger.service';
import { ExplorationEngineService } from '../services/exploration-engine.service';
import { State, StateObjectFactory } from 'domain/state/StateObjectFactory';
import { Voiceover } from 'domain/exploration/voiceover.model';
import { ConceptCardBackendDict, ConceptCardObjectFactory } from 'domain/skill/ConceptCardObjectFactory';
import { ConceptCardBackendApiService } from 'domain/skill/concept-card-backend-api.service';
import { FatigueDetectionService } from '../services/fatigue-detection.service';
import { RefresherExplorationConfirmationModalService } from '../services/refresher-exploration-confirmation-modal.service';
import { StoryPlaythrough } from 'domain/story_viewer/story-playthrough.model';
import { StoryChapterCompletionResponse, StoryViewerBackendApiService } from 'domain/story_viewer/story-viewer-backend-api.service';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { ExplorationRecommendationsService } from '../services/exploration-recommendations.service';
import { GuestCollectionProgressService } from 'domain/collection/guest-collection-progress.service';

describe('Conversation skin directive', function() {
  let $scope = null;
  let ctrl = null;
  let $rootScope = null;
  let $timeout = null;
  let $compile = null;
  let $window = null;
  let $httpBackend = null;
  let directive = null;
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
  let explorationEngineService: ExplorationEngineService = null;
  let urlInterpolationService: UrlInterpolationService = null;
  let messengerService: MessengerService = null;
  let stateObjectFactory: StateObjectFactory = null;
  let conceptCardObjectFactory: ConceptCardObjectFactory = null;
  let conceptCardBackendApiService: ConceptCardBackendApiService = null;
  let fatigueDetectionService: FatigueDetectionService = null;
  let refresherExplorationConfirmationModalService:
    RefresherExplorationConfirmationModalService = null;
  let storyViewerBackendApiService: StoryViewerBackendApiService = null;
  let windowDimensionsService: WindowDimensionsService = null;
  let i18nLanguageCodeService: I18nLanguageCodeService = null;
  let explorationRecommendationsService:
    ExplorationRecommendationsService = null;
  let guestCollectionProgressService: GuestCollectionProgressService = null;

  let onAnswerChangedEventEmitter = new EventEmitter();
  let onHintConsumedEventEmitter = new EventEmitter();
  let onSolutionViewedEventEmitter = new EventEmitter();
  let onPlayerStateChangeEventEmitter = new EventEmitter();
  let alertWarningSpy = null;
  let questionPlayerSpy = null;
  let sampleCollection = null;
  let sampleCollectionBackendObject = null;
  let collectionNodeBackendObject = null;
  let sampleCard: StateCard = null;
  let interactionDict1 = null;
  let interactionDict2 = null;
  let interactionDict3 = null;
  let stateDict = null;
  let sampleState: State = null;
  let sampleConceptCard = null;
  let conceptCardDict: ConceptCardBackendDict = null;
  let audioTranslations: BindableVoiceovers = null;
  let storyPlaythroughBackendObject = null;
  let samplePlaythroughObject: StoryPlaythrough = null;
  let firstSampleReadOnlyStoryNodeBackendDict = null;
  let secondSampleReadOnlyStoryNodeBackendDict = null;
  let mockWindow = {
    location: {
      replace: jasmine.createSpy('replace'),
      reload: function() {}
    },
    addEventListener: () => {},
    scrollTo: function() {},
    event: {
      returnValue: ''
    }
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
    $compile = $injector.get('$compile');
    $httpBackend = $injector.get('$httpBackend');
    directive = $injector.get('conversationSkinDirective')[0];
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
    guestCollectionProgressService = $injector.get(
      'GuestCollectionProgressService');
    writtenTranslationsObjectFactory = $injector.get(
      'WrittenTranslationsObjectFactory');
    audioTranslationLanguageService = $injector.get(
      'AudioTranslationLanguageService');
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
    messengerService = $injector.get('MessengerService');
    explorationEngineService = $injector.get('ExplorationEngineService');
    stateObjectFactory = $injector.get('StateObjectFactory');
    conceptCardObjectFactory = $injector.get('ConceptCardObjectFactory');
    conceptCardBackendApiService = $injector.get(
      'ConceptCardBackendApiService');
    fatigueDetectionService = $injector.get('FatigueDetectionService');
    refresherExplorationConfirmationModalService = $injector.get(
      'RefresherExplorationConfirmationModalService');
    storyViewerBackendApiService = $injector.get(
      'StoryViewerBackendApiService');
    windowDimensionsService = $injector.get('WindowDimensionsService');
    i18nLanguageCodeService = $injector.get('I18nLanguageCodeService');
    explorationRecommendationsService = $injector.get(
      'ExplorationRecommendationsService');

    conceptCardDict = {
      explanation: {
        html: 'test explanation 1',
        content_id: 'explanation_1'
      },
      worked_examples: [
        {
          question: {
            html: 'worked example question 1',
            content_id: 'worked_example_q_1'
          },
          explanation: {
            html: 'worked example explanation 1',
            content_id: 'worked_example_e_1'
          }
        },
        {
          question: {
            html: 'worked example question 1',
            content_id: 'worked_example_q_1'
          },
          explanation: {
            html: 'worked example explanation 1',
            content_id: 'worked_example_e_1'
          }
        }
      ],
      recorded_voiceovers: {
        voiceovers_mapping: {
          explanation: {},
          worked_example_q_1: {},
          worked_example_e_1: {},
          worked_example_q_2: {},
          worked_example_e_2: {}
        }
      }
    };

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

    stateDict = {
      content: {
        content_id: 'content',
        html: 'content'
      },
      recorded_voiceovers: {
        voiceovers_mapping: {
          content: {},
          default_outcome: {},
          feedback_1: {},
          feedback_2: {}
        }
      },
      interaction: {
        id: 'TextInput',
        customization_args: {
          placeholder: {
            value: {
              content_id: 'ca_placeholder_0',
              unicode_str: ''
            }
          },
          rows: { value: 1 }
        },
        answer_groups: [{
          outcome: {
            dest: 'outcome 1',
            feedback: {
              content_id: 'feedback_1',
              html: ''
            },
            labelled_as_correct: false,
            param_changes: [],
            refresher_exploration_id: null,
            missing_prerequisite_skill_id: null
          },
          rule_specs: [{
            rule_type: 'Equals',
            inputs: {
              x: {
                contentId: 'rule_input_0',
                normalizedStrSet: ['10']
              }
            }
          }],
        }, {
          outcome: {
            dest: 'outcome 2',
            feedback: {
              content_id: 'feedback_2',
              html: ''
            },
            labelled_as_correct: false,
            param_changes: [],
            refresher_exploration_id: null,
            missing_prerequisite_skill_id: null
          },
          rule_input_translations: {},
          rule_specs: [{
            rule_type: 'Equals',
            inputs: {
              x: {
                contentId: 'rule_input_1',
                normalizedStrSet: ['5']
              }
            }
          }, {
            rule_type: 'Equals',
            inputs: {
              x: {
                contentId: 'rule_input_2',
                normalizedStrSet: ['7']
              }
            }
          }],
        }],
        default_outcome: {
          dest: 'default',
          feedback: {
            content_id: 'default_outcome',
            html: ''
          },
          labelled_as_correct: false,
          param_changes: [],
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null
        },
        hints: []
      },
      param_changes: [],
      solicit_answer_details: false,
      written_translations: {
        translations_mapping: {
          content: {},
          default_outcome: {},
          feedback_1: {},
          feedback_2: {}
        }
      }
    };

    interactionDict1 = {
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

    interactionDict2 = {
      solution: null,
      confirmed_unclassified_answers: [],
      customization_args: {
        allowMultipleItemsInSamePosition: {
          value: false
        },
        choices: {
          value: [
            {
              content_id: 'ca_choices_0',
              html: '<p>test</p>'
            },
            {
              content_id: 'ca_choices_1',
              html: '<p>test3</p>'
            }
          ]
        }
      },
      id: 'DragAndDropSortInput',
      answer_groups: [],
      hints: [],
      default_outcome: {
        refresher_exploration_id: null,
        labelled_as_correct: false,
        dest: 'Introduction',
        param_changes: [],
        feedback: {
          content_id: 'default_outcome',
          html: '<p>try again</p>'
        },
        missing_prerequisite_skill_id: null
      }
    };

    interactionDict3 = {
      id: 'EndExploration',
      answer_groups: [],
      default_outcome: {
        dest: 'default',
        feedback: {
          content_id: 'default_outcome',
          html: ''
        },
        labelled_as_correct: false,
        param_changes: [],
        refresher_exploration_id: null
      },
      hints: []
    };

    firstSampleReadOnlyStoryNodeBackendDict = {
      id: 'node_1',
      description: 'description',
      title: 'Title 1',
      prerequisite_skill_ids: [],
      acquired_skill_ids: [],
      destination_node_ids: ['node_2'],
      outline: 'Outline',
      exploration_id: 'exp_id',
      outline_is_finalized: false,
      exp_summary_dict: {
        title: 'Title',
        status: 'private',
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
        tags: [],
        activity_type: 'exploration',
        category: 'Algebra'
      },
      completed: true,
      thumbnail_bg_color: '#bb8b2f',
      thumbnail_filename: 'filename'
    };
    secondSampleReadOnlyStoryNodeBackendDict = {
      id: 'node_2',
      description: 'description',
      title: 'Title 2',
      prerequisite_skill_ids: [],
      acquired_skill_ids: [],
      destination_node_ids: ['node_3'],
      outline: 'Outline',
      exploration_id: 'exp_id',
      outline_is_finalized: false,
      exp_summary_dict: {
        title: 'Title',
        status: 'private',
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
        tags: [],
        activity_type: 'exploration',
        category: 'Algebra'
      },
      completed: false,
      thumbnail_bg_color: '#bb8b2f',
      thumbnail_filename: 'filename',
    };

    storyPlaythroughBackendObject = {
      story_id: 'qwerty',
      story_nodes: [
        firstSampleReadOnlyStoryNodeBackendDict,
        secondSampleReadOnlyStoryNodeBackendDict],
      story_title: 'Story',
      story_description: 'Description',
      topic_name: 'Topic 1',
      meta_tag_content: 'Story meta tag content'
    };

    samplePlaythroughObject = StoryPlaythrough.createFromBackendDict(
      storyPlaythroughBackendObject);

    audioTranslations = {
      en: Voiceover.createFromBackendDict({
        filename: 'filename1.mp3',
        file_size_bytes: 100000,
        needs_update: false,
        duration_secs: 10.0
      }),
      hi: Voiceover.createFromBackendDict({
        filename: 'filename2.mp3',
        file_size_bytes: 11000,
        needs_update: false,
        duration_secs: 0.11
      })
    };

    sampleConceptCard = conceptCardObjectFactory.createFromBackendDict(
      conceptCardDict);

    sampleCard = StateCard.createNewCard(
      'State 1', '<p>Content</p>', '<interaction></interaction>',
      interactionObjectFactory.createFromBackendDict(interactionDict2),
      RecordedVoiceovers.createEmpty(),
      writtenTranslationsObjectFactory.createEmpty(),
      'content', audioTranslationLanguageService);

    sampleState = stateObjectFactory.createFromBackendDict(
      'stateName', stateDict);

    sampleCollection = Collection.create(
      sampleCollectionBackendObject);

    // The conversation-skin file uses jqueryUI to animate some of the html
    // elements. When testing the ".animate" function from jqueryUI generates
    // "TypeError: S.easing[this.easing] is not a function" error.
    // Therefore the call is stubbed there since changes made by
    // animations to the html elements are not tested here.
    spyOn($.fn, 'animate').and.stub();
    spyOn(userService, 'getUserInfoAsync')
      .and.returnValue(Promise.resolve(userInfoForCollectionCreator));
    spyOn(readOnlyCollectionBackendApiService, 'loadCollectionAsync')
      .and.resolveTo(sampleCollection);
    questionPlayerSpy = spyOn(
      explorationPlayerStateService, 'isInQuestionPlayerMode')
      .and.returnValue(true);
    spyOn(learnerViewRatingService, 'init').and.callFake((cb) => {
      cb('userRating');
    });
    alertWarningSpy = spyOn(
      alertsService, 'addWarning').and.returnValue(null);

    ctrl = $injector.instantiate(directive.controller, {
      $scope: $scope,
      $rootScope: $scope,
      LearnerAnswerInfoService: learnerAnswerInfoService,
      WHITELISTED_COLLECTION_IDS_FOR_SAVING_GUEST_PROGRESS:
        ['whitelistedCollection'],
      CONTENT_FOCUS_LABEL_PREFIX: 'contentLabel',
      ENABLE_NEW_STRUCTURE_VIEWER_UPDATES: true,
      TWO_CARD_THRESHOLD_PX: 960
    });
    $scope.getQuestionPlayerConfig = function() {
      return;
    };
  }));

  afterEach(() => {
    ctrl.$onDestroy();
  });

  describe('on initalization', function() {
    it('should show user that hint has been used ' +
      'if it has already been used', function() {
      spyOnProperty(hintsAndSolutionManagerService, 'onHintConsumed')
        .and.returnValue(onHintConsumedEventEmitter);
      let hintConsumedSpy = spyOn(
        QuestionPlayerStateService, 'hintUsed').and.returnValue(null);
      $scope.collectionId = 'collectionId';

      ctrl.$onInit();
      onHintConsumedEventEmitter.emit();

      expect(hintConsumedSpy).toHaveBeenCalled();
    });

    it('should show user that solution has been shown ' +
      'when user has already requested for solution', function() {
      spyOnProperty(
        hintsAndSolutionManagerService, 'onSolutionViewedEventEmitter')
        .and.returnValue(onSolutionViewedEventEmitter);
      let hintConsumedSpy = spyOn(
        QuestionPlayerStateService, 'solutionViewed').and.returnValue(null);

      ctrl.$onInit();
      onSolutionViewedEventEmitter.emit();

      expect(hintConsumedSpy).toHaveBeenCalled();
    });

    it('should set collection title to null if' +
      'collection id is invalid', function() {
      spyOn(urlService, 'getCollectionIdFromExplorationUrl')
        .and.returnValue(null);
      expect($scope.collectionTitle).toBe(undefined);

      ctrl.$onInit();

      expect($scope.collectionTitle).toBe(null);
    });

    it('should send request to backend to fetch collection summary ' +
      'given collection id', fakeAsync(function() {
      spyOn(urlService, 'getCollectionIdFromExplorationUrl')
        .and.returnValue('collectionId');
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
      spyOn(urlService, 'getCollectionIdFromExplorationUrl')
        .and.returnValue('collectionId');
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

    it('should call record \'maybeLeave\' event ' +
      'when answer is not being processed and ' +
      'window has been resized', function() {
      spyOnProperty(currentInteractionService, 'onAnswerChanged$')
        .and.returnValue(onAnswerChangedEventEmitter);
      spyOn($window, 'addEventListener').and.callFake((evt, cb) => {
        $scope.displayedCard = sampleCard;
        cb();
      });

      sampleCard = StateCard.createNewCard(
        'State 1', '<p>Content</p>', '<interaction></interaction>',
        interactionObjectFactory.createFromBackendDict(interactionDict2),
        RecordedVoiceovers.createEmpty(),
        writtenTranslationsObjectFactory.createEmpty(),
        'content', audioTranslationLanguageService);
      spyOn(explorationEngineService, 'getState').and.returnValue(sampleState);
      spyOn(playerTranscriptService, 'isLastCard')
        .and.returnValue(true);
      spyOn(playerTranscriptService, 'addNewInput').and.returnValue(null);
      spyOn(playerTranscriptService, 'addNewResponse')
        .and.returnValue(null);
      spyOn(playerPositionService, 'recordAnswerSubmission')
        .and.returnValue(null);
      spyOn(explorationPlayerStateService, 'getCurrentEngineService')
        .and.returnValue(explorationEngineService);
      spyOn(explorationEngineService, 'submitAnswer').and.callFake(
        (answer, service, successCallback) => {
          successCallback(
            sampleCard, true, 'feedbackHtml', audioTranslations, null,
            'skillId', false, 'taggedSkillId', true, false, true, 'focusLabel');
          return true;
        });
      spyOn(playerPositionService, 'getCurrentStateName')
        .and.returnValue('currentState');
      spyOn(statsReportingService, 'recordStateTransition')
        .and.returnValue(null);
      spyOn(statsReportingService, 'recordExplorationActuallyStarted')
        .and.returnValue(null);
      spyOn(statsReportingService, 'recordStateCompleted')
        .and.returnValue(null);
      spyOn(playerTranscriptService, 'getLastStateName')
        .and.returnValue('lastState');
      let recordMaybeLeaveEvent = spyOn(
        statsReportingService, 'recordMaybeLeaveEvent')
        .and.returnValue(null);

      $scope.answerIsBeingProcessed = false;
      $scope.displayedCard = sampleCard;
      $scope.submitAnswer();
      $timeout.flush();
      ctrl.$onInit();
      $window.onresize();

      expect(recordMaybeLeaveEvent).toHaveBeenCalled();
    });

    it('should show upcoming card if feedback html ' +
      'is not specified and \'remainOnSameCard\' is set false', function() {
      spyOnProperty(currentInteractionService, 'onAnswerChanged$')
        .and.returnValue(onAnswerChangedEventEmitter);
      spyOn($window, 'addEventListener').and.callFake((evt, cb) => {
        $scope.displayedCard = sampleCard;
        cb();
      });

      sampleCard = StateCard.createNewCard(
        'State 1', '<p>Content</p>', '<interaction></interaction>',
        interactionObjectFactory.createFromBackendDict(interactionDict2),
        RecordedVoiceovers.createEmpty(),
        writtenTranslationsObjectFactory.createEmpty(),
        'content', audioTranslationLanguageService);
      spyOn(explorationEngineService, 'getState').and.returnValue(sampleState);
      spyOn(playerTranscriptService, 'isLastCard')
        .and.returnValue(true);
      spyOn(playerTranscriptService, 'addNewInput').and.returnValue(null);
      spyOn(playerTranscriptService, 'addNewResponse')
        .and.returnValue(null);
      spyOn(playerPositionService, 'recordAnswerSubmission')
        .and.returnValue(null);
      spyOn(explorationPlayerStateService, 'getCurrentEngineService')
        .and.returnValue(explorationEngineService);
      spyOn(explorationEngineService, 'submitAnswer').and.callFake(
        (answer, service, successCallback) => {
          successCallback(
            sampleCard, true, null, audioTranslations, null,
            'skillId', false, 'taggedSkillId', true, false, true, 'focusLabel');
          return true;
        });
      spyOn(playerPositionService, 'getCurrentStateName')
        .and.returnValue('currentState');
      spyOn(statsReportingService, 'recordStateTransition')
        .and.returnValue(null);
      spyOn(statsReportingService, 'recordExplorationActuallyStarted')
        .and.returnValue(null);
      spyOn(statsReportingService, 'recordStateCompleted')
        .and.returnValue(null);
      spyOn(playerTranscriptService, 'getLastStateName')
        .and.returnValue('lastState');
      spyOn(
        statsReportingService, 'recordMaybeLeaveEvent')
        .and.returnValue(null);
      let upcomingCardSpy = spyOn($scope, 'showUpcomingCard')
        .and.returnValue(null);

      $scope.answerIsBeingProcessed = false;
      $scope.displayedCard = sampleCard;
      $scope.submitAnswer();
      $timeout.flush();
      ctrl.$onInit();
      $window.onresize();

      expect(upcomingCardSpy).toHaveBeenCalled();
    });

    it('should not record event when user redirects ' +
      'to refresher exploration', function() {
      spyOnProperty(currentInteractionService, 'onAnswerChanged$')
        .and.returnValue(onAnswerChangedEventEmitter);
      spyOn($window, 'addEventListener').and.callFake((evt, cb) => {
        $scope.displayedCard = sampleCard;
        cb();
      });

      sampleCard = StateCard.createNewCard(
        'State 1', '<p>Content</p>', '<interaction></interaction>',
        interactionObjectFactory.createFromBackendDict(interactionDict2),
        RecordedVoiceovers.createEmpty(),
        writtenTranslationsObjectFactory.createEmpty(),
        'content', audioTranslationLanguageService);
      spyOn(explorationEngineService, 'getState').and.returnValue(sampleState);
      spyOn(playerTranscriptService, 'isLastCard')
        .and.returnValue(true);
      spyOn(playerTranscriptService, 'addNewInput').and.returnValue(null);
      spyOn(playerTranscriptService, 'addNewResponse')
        .and.returnValue(null);
      spyOn(playerPositionService, 'recordAnswerSubmission')
        .and.returnValue(null);
      spyOn(explorationPlayerStateService, 'getCurrentEngineService')
        .and.returnValue(explorationEngineService);
      spyOn(explorationEngineService, 'submitAnswer').and.callFake(
        (answer, service, successCallback) => {
          successCallback(
            sampleCard, true, 'feedbackHtml', audioTranslations, null,
            'skillId', false, 'taggedSkillId', true, false, true, 'focusLabel');
          return true;
        });
      spyOn(playerPositionService, 'getCurrentStateName')
        .and.returnValue('currentState');
      spyOn(statsReportingService, 'recordStateTransition')
        .and.returnValue(null);
      spyOn(statsReportingService, 'recordExplorationActuallyStarted')
        .and.returnValue(null);
      spyOn(statsReportingService, 'recordStateCompleted')
        .and.returnValue(null);
      spyOn(playerTranscriptService, 'getLastStateName')
        .and.returnValue('lastState');
      let recordMaybeLeaveEvent = spyOn(
        statsReportingService, 'recordMaybeLeaveEvent')
        .and.returnValue(null);

      $scope.answerIsBeingProcessed = false;
      $scope.displayedCard = sampleCard;
      $scope.submitAnswer();
      $timeout.flush();
      $scope.redirectToRefresherExplorationConfirmed = true;
      ctrl.$onInit();

      expect(recordMaybeLeaveEvent).not.toHaveBeenCalled();
    });
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

    it('should record guest user\'s collection progress', function() {
      sampleCard = StateCard.createNewCard(
        'State 1', '<p>Content</p>', '<interaction></interaction>',
        interactionObjectFactory.createFromBackendDict(interactionDict3),
        RecordedVoiceovers.createEmpty(),
        writtenTranslationsObjectFactory.createEmpty(),
        'content', audioTranslationLanguageService);
      spyOnProperty(explorationPlayerStateService, 'onPlayerStateChange')
        .and.returnValue(onPlayerStateChangeEventEmitter);
      spyOn(contextService, 'isInExplorationEditorPage').and.returnValue(false);
      spyOn(statsReportingService, 'recordExplorationCompleted')
        .and.returnValue(null);
      spyOn(imagePreloaderService, 'onStateChange')
        .and.returnValue(null);
      let guestUserSpy = spyOn(
        guestCollectionProgressService,
        'recordExplorationCompletedInCollection')
        .and.returnValue(null);

      ctrl.$onInit();
      $scope.nextCard = sampleCard;
      $scope.collectionId = 'whitelistedCollection';
      onPlayerStateChangeEventEmitter.emit('State 1');

      expect(guestUserSpy).toHaveBeenCalled();
    });
  });

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
        explorationPlayerStateService, 'moveToExploration')
        .and.returnValue(null);

      $scope.moveToExploration = true;
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
      spyOn(playerTranscriptService, 'getLastCard')
        .and.returnValue(sampleCard);
      spyOn($scope, 'showPendingCard').and.returnValue(null);
      spyOn(explorationPlayerStateService, 'getLanguageCode')
        .and.returnValue('en');
      spyOn(contentTranslationLanguageService, 'getCurrentContentLanguageCode')
        .and.returnValue('en');
      spyOn(playerPositionService, 'setDisplayedCardIndex')
        .and.returnValue(null);
      spyOn(playerPositionService, 'changeCurrentQuestion')
        .and.returnValue(null);
      let recordNewCardSpy = spyOn(
        explorationPlayerStateService, 'recordNewCardAdded')
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

  describe('on verifying if the learn again button is active ', function() {
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
      sampleCard = StateCard.createNewCard(
        'State 1', '<p>Content</p>', '<interaction></interaction>',
        interactionObjectFactory.createFromBackendDict(interactionDict1),
        RecordedVoiceovers.createEmpty(),
        writtenTranslationsObjectFactory.createEmpty(),
        'content', audioTranslationLanguageService);
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
        interactionObjectFactory.createFromBackendDict(interactionDict),
        RecordedVoiceovers.createEmpty(),
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

  describe('on fetching exploration link ', function() {
    it('should return corresponding link if url ' +
      'parameters consist of collection id', function() {
      spyOn(urlService, 'getUrlParams').and.returnValue({
        collection_id: 'collectionId'
      });
      let storyNode = {
        id: 'nodeId',
        parentExplorationIds: ['id1', 'id2'],
        nextNodeId: 'nextNodeId'
      };
      $scope.recommendedExplorationSummaries = [
        storyNode];

      let result = $scope.getExplorationLink();

      expect(result).toBe(
        '/explore/nodeId?collection_id=collectionId&parent=id1');
    });

    it('should return corresponding link if url ' +
      'parameters consist of \'story_url_fragment\'', function() {
      $scope.storyNodeIdToAdd = true;
      spyOn(urlService, 'getUrlParams').and.returnValue({
        story_url_fragment: '/story/abcd',
        node_id: 'nodeId',
        topic_url_fragment: '/topic/abcd',
        classroom_url_fragment: '/learn/classroom1'
      });

      let storyNode = {
        id: 'nodeId',
        parentExplorationIds: [],
        nextNodeId: 'nextNodeId'
      };
      $scope.recommendedExplorationSummaries = [storyNode];

      let result = $scope.getExplorationLink();

      expect(result).toBe(
        '/explore/nodeId?topic_url_fragment=%2Ftopic' +
        '%2Fabcd&classroom_url_fragment=%2Flearn%2Fclassroom1&story' +
        '_url_fragment=%2Fstory%2Fabcd&node_id=true');
    });

    it('should return \'#\' if recommended exploration id ' +
      'is invalid', function() {
      // Setting id to null.
      let storyNode = {
        id: null,
        parentExplorationIds: ['id1', 'id2'],
        nextNodeId: 'nextNodeId'
      };
      $scope.recommendedExplorationSummaries = [
        storyNode];

      let result = $scope.getExplorationLink();

      expect(result).toBe('#');
    });

    it('should return corresponding link if url ' +
      'parameters does not consist of collection id', function() {
      $scope.storyNodeIdToAdd = true;
      spyOn(urlService, 'getUrlParams').and.returnValue({});
      spyOn(urlService, 'getPathname').and.returnValue('/story/hfdjkahfauda');
      spyOn(urlService, 'getStoryUrlFragmentFromLearnerUrl')
        .and.returnValue('/story/');
      spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl')
        .and.returnValue('/topic/');
      spyOn(urlService, 'getClassroomUrlFragmentFromLearnerUrl')
        .and.returnValue('/classroom/');
      let storyNode = {
        id: 'nodeId',
        parentExplorationIds: [],
        nextNodeId: 'nextNodeId'
      };
      $scope.recommendedExplorationSummaries = [storyNode];

      let result = $scope.getExplorationLink();

      expect(result).toBe(
        '/explore/nodeId?topic_url_fragment=%2Ftopic%2' +
        'F&classroom_url_fragment=%2Fclassroom%2F&story_url_fragment' +
        '=%2Fstory%2F&node_id=true');
    });
  });

  it('should register an iframe event when' +
    'calling \'onNavigateFromIframe\'', function() {
    let iframeEventSpy = spyOn(
      siteAnalyticsService, 'registerVisitOppiaFromIframeEvent')
      .and.returnValue(null);

    $scope.onNavigateFromIframe();

    expect(iframeEventSpy).toHaveBeenCalled();
  });

  it('should get static image url when' +
    'calling \'getStaticImageUrl\'', function() {
    spyOn(urlInterpolationService, 'getStaticImageUrl')
      .and.returnValue('url');

    let result = $scope.getStaticImageUrl();

    expect(result).toBe('url');
  });

  it('should get content focus label when' +
    'calling \'getContentFocusLabel\'', function() {
    let result = $scope.getContentFocusLabel('2');

    expect(result).toBe('contentLabel2');
  });

  it('should check whether a learner can ask for answer info', function() {
    spyOn(learnerAnswerInfoService, 'getCanAskLearnerForAnswerInfo')
      .and.returnValue(true);

    let result = $scope.getCanAskLearnerForAnswerInfo();

    expect(result).toBe(true);
  });

  it('should check whether correctness footer is enabled', function() {
    $scope.answerIsCorrect = false;

    let result = $scope.isCorrectnessFooterEnabled();

    expect(result).toBe(false);
  });

  it('should send message if height is adjusted when ' +
    'calling \'adjustPageHeight\'', function() {
    spyOnProperty(document.body, 'scrollHeight').and.returnValue(45);
    let sendMessageSpy = spyOn(
      messengerService, 'sendMessage').and.returnValue(null);
    $scope.lastRequestedHeight = 100;
    let callback = jasmine.createSpy('callback');

    $scope.adjustPageHeight(true, callback);
    $timeout.flush();

    expect(sendMessageSpy).toHaveBeenCalled();
  });

  it('should check whether the card is terminal ' +
    'when calling \'isOnTerminalCard\'', function() {
    $scope.displayedCard = sampleCard;

    let result = $scope.isOnTerminalCard();

    expect(result).toBe(false);
  });

  it('should check whether the supplemental card is non empty ' +
    'when calling \'isCurrentSupplementalCardNonempty\'', function() {
    $scope.displayedCard = sampleCard;

    let result = $scope.isCurrentSupplementalCardNonempty();

    expect(result).toBe(true);
  });

  it('should check whether the supplemental navbar is being shown ' +
    'when calling \'isSupplementalNavShown\'', function() {
    $scope.displayedCard = sampleCard;

    let result = $scope.isSupplementalNavShown();

    expect(result).toBe(false);
  });

  it('should return false when calling \'isSupplementalNavShown\' ' +
    'if current state has invalid name', function() {
    // Setting state name to null.
    sampleCard = StateCard.createNewCard(
      null, '<p>Content</p>', '<interaction></interaction>',
      null, RecordedVoiceovers.createEmpty(),
      writtenTranslationsObjectFactory.createEmpty(),
      'content', audioTranslationLanguageService);
    spyOn(explorationPlayerStateService, 'isInQuestionMode')
      .and.returnValue(false);
    $scope.displayedCard = sampleCard;

    let result = $scope.isSupplementalNavShown();

    expect(result).toBe(false);
  });

  it('should navigate to display card ' +
    'when answer is submitted and new card is initialized' +
    '', fakeAsync(function() {
    sampleCard = StateCard.createNewCard(
      'State 1', '<p>Content</p>', '<interaction></interaction>',
      interactionObjectFactory.createFromBackendDict(interactionDict3),
      RecordedVoiceovers.createEmpty(),
      writtenTranslationsObjectFactory.createEmpty(),
      'content', audioTranslationLanguageService);
    spyOn(playerPositionService, 'init').and.callFake(cb => {
      cb();
    });
    spyOn(playerTranscriptService, 'getCard')
      .and.returnValue(sampleCard);
    spyOn(explorationPlayerStateService, 'getLanguageCode')
      .and.returnValue('en');
    spyOn(explorationPlayerStateService, 'recordNewCardAdded')
      .and.returnValue(null);
    spyOn(contentTranslationLanguageService, 'getCurrentContentLanguageCode')
      .and.returnValue('en');
    spyOn(playerPositionService, 'setDisplayedCardIndex')
      .and.returnValue(null);
    spyOn(playerPositionService, 'changeCurrentQuestion')
      .and.returnValue(null);
    spyOn(urlService, 'getQueryFieldValuesAsList')
      .and.returnValue(['id1', 'id2']);
    spyOn(explorationPlayerStateService, 'isInStoryChapterMode')
      .and.returnValue(true);
    spyOn(
      storyViewerBackendApiService, 'fetchStoryDataAsync').and.returnValue(
      Promise.resolve(samplePlaythroughObject));
    spyOn(playerTranscriptService, 'getNumCards')
      .and.returnValue(2);
    spyOn(urlInterpolationService, 'interpolateUrl').and.returnValue('url');
    spyOn(contentTranslationManagerService, 'displayTranslations')
      .and.returnValue(null);
    spyOn(windowDimensionsService, 'getWidth').and.returnValue(1200);
    spyOn(i18nLanguageCodeService, 'setI18nLanguageCode')
      .and.returnValue(null);
    spyOn(imagePreloaderService, 'onStateChange')
      .and.returnValue(null);
    spyOn(statsReportingService, 'recordExplorationCompleted')
      .and.returnValue(null);
    spyOn(urlService, 'getUrlParams').and.returnValue({
      node_id: 'node_1'
    });

    $scope.getQuestionPlayerConfig = function() {
      return {
        resultActionButtons: [{
          type: 'REVIEW_LOWEST_SCORED_SKILL',
          i18nId: 'I18N_QUESTION_PLAYER_REVIEW_LOWEST_SCORED_SKILL'
        }, {
          type: 'RETRY_SESSION',
          i18nId: 'I18N_QUESTION_PLAYER_RETRY_TEST',
          url: '/learn/classroom_1/topic_1/review-test/story_1'
        }, {
          type: 'DASHBOARD',
          i18nId: 'I18N_QUESTION_PLAYER_RETURN_TO_STORY',
          url: '/learn/classroom_1/topic_1/story/story_1'
        }],
        skillList: ['0', '1'],
        skillDescriptions: ['skill_1', 'skill_2'],
        questionCount: 6,
        questionPlayerMode: {
          modeType: 'PASS_FAIL',
          passCutoff: 0.75
        },
        questionsSortedByDifficulty: true
      };
    };
    let initSpy = spyOn(
      explorationPlayerStateService, 'initializeQuestionPlayer')
      .and.callFake((config, cb1, cb2) => {
        cb1(sampleCard, 'focusLabel');
        cb2();
      });

    ctrl.$onInit();
    $scope.answerIsBeingProcessed = false;
    $scope.displayedCard = sampleCard;
    $scope.submitAnswer();
    $scope.isIframed = true;
    $scope.initializePage();

    $timeout.flush();
    tick();

    expect(initSpy).toHaveBeenCalled();
  }));

  it('should focus on the given focus label if user is on ' +
    'desktop', fakeAsync(function() {
    let element = angular.element(
      '<html><body><div class="conversation-skin-main-tutor-card"' +
      'style="height: 2000px"></div></body></html>');
    angular.element(document.body).append(element);
    $compile(element)($scope);
    $rootScope.$digest();
    spyOn(explorationEngineService, 'getState').and.returnValue(sampleState);
    spyOn(playerTranscriptService, 'isLastCard')
      .and.returnValue(true);
    spyOn(playerTranscriptService, 'addNewInput').and.returnValue(null);
    spyOn(playerTranscriptService, 'updateLatestInteractionHtml')
      .and.returnValue(null);
    spyOn(playerTranscriptService, 'addNewResponse')
      .and.returnValue(null);
    spyOn(playerPositionService, 'recordAnswerSubmission')
      .and.returnValue(null);
    spyOn(explorationPlayerStateService, 'getCurrentEngineService')
      .and.returnValue(explorationEngineService);
    spyOn(explorationEngineService, 'submitAnswer').and.callFake(
      (answer, service, successCallback) => {
        successCallback(
          sampleCard, true, 'feedbackHtml', audioTranslations, 'refresherId',
          'skillId', true, 'taggedSkillId', true, true, false, 'focusLabel');
        return true;
      });
    spyOn(playerPositionService, 'getCurrentStateName')
      .and.returnValue('currentState');
    spyOn(statsReportingService, 'recordStateTransition').and.returnValue(null);
    spyOn(statsReportingService, 'recordStateCompleted').and.returnValue(null);
    spyOn(statsReportingService, 'recordExplorationActuallyStarted')
      .and.returnValue(null);
    spyOn(hintsAndSolutionManagerService, 'recordWrongAnswer')
      .and.returnValue(null);
    spyOn(conceptCardBackendApiService, 'loadConceptCardsAsync')
      .and.resolveTo(sampleConceptCard);
    spyOn(playerPositionService, 'init')
      .and.callFake(cb => {
        cb();
      });
    let focusSpy = spyOn(focusManagerService, 'setFocusIfOnDesktop')
      .and.returnValue(null);

    $scope.answerIsBeingProcessed = false;
    $scope.displayedCard = sampleCard;

    $scope.submitAnswer();
    $timeout.flush();
    tick();
    $timeout.flush();
    $scope.initializePage();
    discardPeriodicTasks();
    flush();

    expect(focusSpy).toHaveBeenCalled();
  }));

  it('should check if the user is in question player ' +
    'mode', fakeAsync(function() {
    spyOn(explorationEngineService, 'getState').and.returnValue(sampleState);
    spyOn(playerTranscriptService, 'isLastCard')
      .and.returnValue(true);
    spyOn(playerTranscriptService, 'addNewInput').and.returnValue(null);
    spyOn(playerTranscriptService, 'updateLatestInteractionHtml')
      .and.returnValue(null);
    spyOn(playerTranscriptService, 'addNewResponse')
      .and.returnValue(null);
    spyOn(playerPositionService, 'recordAnswerSubmission')
      .and.returnValue(null);
    spyOn(explorationPlayerStateService, 'getCurrentEngineService')
      .and.returnValue(explorationEngineService);
    spyOn(explorationEngineService, 'submitAnswer').and.callFake(
      (answer, service, successCallback) => {
        successCallback(
          sampleCard, true, 'feedbackHtml', audioTranslations, null,
          'skillId', false, 'taggedSkillId', true, true, true, 'focusLabel');
        return true;
      });
    spyOn(playerPositionService, 'getCurrentStateName')
      .and.returnValue('currentState');
    spyOn(statsReportingService, 'recordStateTransition').and.returnValue(null);
    spyOn(statsReportingService, 'recordStateCompleted').and.returnValue(null);
    spyOn(statsReportingService, 'recordExplorationActuallyStarted')
      .and.returnValue(null);
    spyOn(conceptCardBackendApiService, 'loadConceptCardsAsync')
      .and.resolveTo(sampleConceptCard);
    spyOn(playerTranscriptService, 'hasEncounteredStateBefore')
      .and.returnValue(true);
    spyOn(playerPositionService, 'init')
      .and.callFake(cb => {
        cb();
      });
    spyOn(QuestionPlayerStateService, 'answerSubmitted')
      .and.returnValue(true);

    $scope.answerIsBeingProcessed = false;
    $scope.displayedCard = sampleCard;

    $scope.submitAnswer();
    $timeout.flush();
    tick();

    expect(questionPlayerSpy).toHaveBeenCalled();
  }));

  it('should check whether the user is in editor mode', fakeAsync(function() {
    spyOn(explorationEngineService, 'getState').and.returnValue(sampleState);
    spyOn(playerTranscriptService, 'isLastCard')
      .and.returnValue(true);
    spyOn(playerTranscriptService, 'addNewInput').and.returnValue(null);
    spyOn(playerTranscriptService, 'updateLatestInteractionHtml')
      .and.returnValue(null);
    spyOn(playerTranscriptService, 'addNewResponse')
      .and.returnValue(null);
    spyOn(playerPositionService, 'recordAnswerSubmission')
      .and.returnValue(null);
    spyOn(explorationPlayerStateService, 'getCurrentEngineService')
      .and.returnValue(explorationEngineService);
    spyOn(explorationEngineService, 'submitAnswer').and.callFake(
      (answer, service, successCallback) => {
        successCallback(
          sampleCard, true, 'feedbackHtml', audioTranslations, null,
          'skillId', false, 'taggedSkillId', true, true, false, 'focusLabel');
        return true;
      });
    spyOn(playerPositionService, 'getCurrentStateName')
      .and.returnValue('currentState');
    spyOn(statsReportingService, 'recordStateTransition').and.returnValue(null);
    spyOn(statsReportingService, 'recordStateCompleted').and.returnValue(null);
    spyOn(statsReportingService, 'recordExplorationActuallyStarted')
      .and.returnValue(null);
    spyOn(conceptCardBackendApiService, 'loadConceptCardsAsync')
      .and.resolveTo(sampleConceptCard);
    spyOn(playerTranscriptService, 'hasEncounteredStateBefore')
      .and.returnValue(true);
    spyOn(playerPositionService, 'init')
      .and.callFake(cb => {
        cb();
      });
    spyOn(QuestionPlayerStateService, 'answerSubmitted')
      .and.returnValue(true);
    spyOn(explorationPlayerStateService, 'isInQuestionMode')
      .and.returnValue(true);
    $scope.answerIsBeingProcessed = false;
    $scope.displayedCard = sampleCard;

    $scope.submitAnswer();
    $timeout.flush();
    tick();

    expect(questionPlayerSpy).not.toHaveBeenCalled();
  }));

  it('should add new repsonse if feedback content is ' +
    'provided', fakeAsync(function() {
    spyOn(explorationEngineService, 'getState').and.returnValue(sampleState);
    spyOn(playerTranscriptService, 'isLastCard')
      .and.returnValue(true);
    spyOn(playerTranscriptService, 'addNewInput').and.returnValue(null);
    spyOn(playerTranscriptService, 'updateLatestInteractionHtml')
      .and.returnValue(null);
    let feedbackSpy = spyOn(playerTranscriptService, 'addNewResponse')
      .and.returnValue(null);
    spyOn(playerPositionService, 'recordAnswerSubmission')
      .and.returnValue(null);
    spyOn(explorationPlayerStateService, 'getCurrentEngineService')
      .and.returnValue(explorationEngineService);
    spyOn(explorationEngineService, 'submitAnswer').and.callFake(
      (answer, service, successCallback) => {
        successCallback(
          sampleCard, true, 'feedbackHtml', audioTranslations, null,
          'skillId', false, 'taggedSkillId', true, true, false, 'focusLabel');
        return true;
      });
    spyOn(playerPositionService, 'getCurrentStateName')
      .and.returnValue('currentState');
    spyOn(statsReportingService, 'recordStateTransition').and.returnValue(null);
    spyOn(statsReportingService, 'recordStateCompleted').and.returnValue(null);
    spyOn(statsReportingService, 'recordExplorationActuallyStarted')
      .and.returnValue(null);
    spyOn(conceptCardBackendApiService, 'loadConceptCardsAsync')
      .and.resolveTo(sampleConceptCard);
    spyOn(playerTranscriptService, 'hasEncounteredStateBefore')
      .and.returnValue(true);
    spyOn(playerPositionService, 'init')
      .and.callFake(cb => {
        cb();
      });

    $scope.answerIsBeingProcessed = false;
    $scope.displayedCard = sampleCard;

    $scope.submitAnswer();
    $timeout.flush();
    tick();

    expect(feedbackSpy).toHaveBeenCalledWith('feedbackHtml');
  }));

  it('should add an empty response if feedback content ' +
    'is not provided', fakeAsync(function() {
    spyOn(explorationEngineService, 'getState').and.returnValue(sampleState);
    spyOn(playerTranscriptService, 'isLastCard')
      .and.returnValue(true);
    spyOn(playerTranscriptService, 'addNewInput').and.returnValue(null);
    spyOn(playerTranscriptService, 'updateLatestInteractionHtml')
      .and.returnValue(null);
    let feedbackSpy = spyOn(playerTranscriptService, 'addNewResponse')
      .and.returnValue(null);
    spyOn(playerPositionService, 'recordAnswerSubmission')
      .and.returnValue(null);
    spyOn(explorationPlayerStateService, 'getCurrentEngineService')
      .and.returnValue(explorationEngineService);
    spyOn(explorationEngineService, 'submitAnswer').and.callFake(
      (answer, service, successCallback) => {
        successCallback(
          sampleCard, true, null, audioTranslations, null,
          'skillId', false, 'taggedSkillId', true, true, false, 'focusLabel');
        return true;
      });
    spyOn(playerPositionService, 'getCurrentStateName')
      .and.returnValue('currentState');
    spyOn(statsReportingService, 'recordStateTransition').and.returnValue(null);
    spyOn(statsReportingService, 'recordStateCompleted').and.returnValue(null);
    spyOn(statsReportingService, 'recordExplorationActuallyStarted')
      .and.returnValue(null);
    spyOn(conceptCardBackendApiService, 'loadConceptCardsAsync')
      .and.resolveTo(sampleConceptCard);
    spyOn(playerPositionService, 'init')
      .and.callFake(cb => {
        cb();
      });

    $scope.answerIsBeingProcessed = false;
    $scope.displayedCard = sampleCard;

    $scope.submitAnswer();
    $timeout.flush();
    tick();

    expect(feedbackSpy).toHaveBeenCalledWith(null);
  }));

  it('should set I18n language code if given language code is' +
    'valid', fakeAsync(function() {
    sampleCard = StateCard.createNewCard(
      'State 1', '<p>Content</p>', '<interaction></interaction>',
      interactionObjectFactory.createFromBackendDict(interactionDict3),
      RecordedVoiceovers.createEmpty(),
      writtenTranslationsObjectFactory.createEmpty(),
      'content', audioTranslationLanguageService);
    spyOn(playerPositionService, 'init').and.callFake(cb => {
      cb();
    });
    spyOn(playerTranscriptService, 'getCard')
      .and.returnValue(sampleCard);
    spyOn(explorationPlayerStateService, 'getLanguageCode')
      .and.returnValue('invalid');
    spyOn(explorationPlayerStateService, 'recordNewCardAdded')
      .and.returnValue(null);
    spyOn(contentTranslationLanguageService, 'getCurrentContentLanguageCode')
      .and.returnValue('en');
    spyOn(playerPositionService, 'setDisplayedCardIndex')
      .and.returnValue(null);
    spyOn(playerPositionService, 'changeCurrentQuestion')
      .and.returnValue(null);
    spyOn(urlService, 'getQueryFieldValuesAsList')
      .and.returnValue(['id1', 'id2']);
    spyOn(explorationPlayerStateService, 'isInStoryChapterMode')
      .and.returnValue(true);
    spyOn(
      storyViewerBackendApiService, 'fetchStoryDataAsync').and.returnValue(
      Promise.resolve(samplePlaythroughObject));
    spyOn(playerTranscriptService, 'getNumCards')
      .and.returnValue(2);
    spyOn(urlInterpolationService, 'interpolateUrl').and.returnValue('url');
    spyOn(contentTranslationManagerService, 'displayTranslations')
      .and.returnValue(null);
    spyOn(windowDimensionsService, 'getWidth').and.returnValue(1200);
    let languageCodsSpy = spyOn(
      i18nLanguageCodeService, 'setI18nLanguageCode')
      .and.returnValue(null);
    spyOn(imagePreloaderService, 'onStateChange')
      .and.returnValue(null);
    spyOn(statsReportingService, 'recordExplorationCompleted')
      .and.returnValue(null);

    $scope.getQuestionPlayerConfig = function() {
      return {
        resultActionButtons: [{
          type: 'REVIEW_LOWEST_SCORED_SKILL',
          i18nId: 'I18N_QUESTION_PLAYER_REVIEW_LOWEST_SCORED_SKILL'
        }, {
          type: 'RETRY_SESSION',
          i18nId: 'I18N_QUESTION_PLAYER_RETRY_TEST',
          url: '/learn/classroom_1/topic_1/review-test/story_1'
        }, {
          type: 'DASHBOARD',
          i18nId: 'I18N_QUESTION_PLAYER_RETURN_TO_STORY',
          url: '/learn/classroom_1/topic_1/story/story_1'
        }],
        skillList: ['0', '1'],
        skillDescriptions: ['skill_1', 'skill_2'],
        questionCount: 6,
        questionPlayerMode: {
          modeType: 'PASS_FAIL',
          passCutoff: 0.75
        },
        questionsSortedByDifficulty: true
      };
    };
    spyOn(explorationPlayerStateService, 'initializeQuestionPlayer')
      .and.callFake((config, cb1, cb2) => {
        cb1(sampleCard, 'focusLabel');
        cb2();
      });

    ctrl.$onInit();
    $scope.isIframed = true;
    $scope.initializePage();

    $timeout.flush();
    tick();

    expect(languageCodsSpy).toHaveBeenCalled();
  }));

  it('should return to exploratin after completion of concept card ' +
    'when calling \'returnToExplorationAfterConceptCard\'', function() {
    spyOn(playerTranscriptService, 'addPreviousCard')
      .and.returnValue(null);
    spyOn(playerTranscriptService, 'getNumCards')
      .and.returnValue(2);
    let displayCardSpy = spyOn(playerPositionService, 'setDisplayedCardIndex')
      .and.returnValue(null);

    $scope.returnToExplorationAfterConceptCard();

    expect(displayCardSpy).toHaveBeenCalled();
  });

  describe('on submitting answer ', function() {
    it('should submit answer successfully' +
      '', function() {
      spyOn(explorationEngineService, 'getState').and.returnValue(sampleState);
      spyOn(playerTranscriptService, 'isLastCard')
        .and.returnValue(true);
      spyOn(playerTranscriptService, 'addNewInput').and.returnValue(null);
      spyOn(playerTranscriptService, 'addNewResponse')
        .and.returnValue(null);
      spyOn(playerPositionService, 'recordAnswerSubmission')
        .and.returnValue(null);
      spyOn(explorationPlayerStateService, 'getCurrentEngineService')
        .and.returnValue(explorationEngineService);
      let submitAnswerSpy = spyOn(
        explorationEngineService, 'submitAnswer').and.callFake(
        (answer, service, successCallback) => {
          successCallback(
            sampleCard, true, 'feedbackHtml', audioTranslations, null,
            'skillId', false, 'taggedSkillId', true, false, true, 'focusLabel');
          return true;
        });
      spyOn(playerPositionService, 'getCurrentStateName')
        .and.returnValue('currentState');
      spyOn(statsReportingService, 'recordStateTransition')
        .and.returnValue(null);
      spyOn(statsReportingService, 'recordStateCompleted')
        .and.returnValue(null);
      spyOn(statsReportingService, 'recordExplorationActuallyStarted')
        .and.returnValue(null);
      $scope.answerIsBeingProcessed = false;
      $scope.displayedCard = sampleCard;

      $scope.submitAnswer();
      $timeout.flush();

      expect(submitAnswerSpy).toHaveBeenCalled();
    });

    it('should not submit answer again if answer is ' +
      'still being processed in the queue', function() {
      $scope.answerIsBeingProcessed = true;
      spyOn(playerTranscriptService, 'isLastCard')
        .and.returnValue(false);
      let submitAnswerSpy = spyOn(explorationEngineService, 'submitAnswer');
      $scope.displayedCard = sampleCard;
      $scope.displayedCard.markAsCompleted();

      $scope.submitAnswer();
      $timeout.flush();

      expect(submitAnswerSpy).not.toHaveBeenCalled();
    });

    it('should display break messag if answer is ' +
      'still being processed in the queue', function() {
      spyOn(fatigueDetectionService, 'isSubmittingTooFast')
        .and.returnValue(true);
      spyOn(fatigueDetectionService, 'recordSubmissionTimestamp')
        .and.returnValue(null);
      spyOn(playerTranscriptService, 'isLastCard')
        .and.returnValue(true);
      let displayBreakMessageSpy = spyOn(
        fatigueDetectionService, 'displayTakeBreakMessage')
        .and.returnValue(null);

      $scope.answerIsBeingProcessed = false;
      $scope.isInPreviewMode = false;
      $scope.displayedCard = sampleCard;

      $scope.submitAnswer();
      $timeout.flush();

      expect(displayBreakMessageSpy).toHaveBeenCalled();
    });

    it('should check whether the helper card is available', function() {
      spyOn(explorationEngineService, 'getState').and.returnValue(sampleState);
      spyOn(playerTranscriptService, 'isLastCard')
        .and.returnValue(true);
      spyOn(playerTranscriptService, 'addNewInput').and.returnValue(null);
      spyOn(playerTranscriptService, 'addNewResponse')
        .and.returnValue(null);
      spyOn(playerPositionService, 'recordAnswerSubmission')
        .and.returnValue(null);
      spyOn(explorationPlayerStateService, 'getCurrentEngineService')
        .and.returnValue(explorationEngineService);
      spyOn(explorationEngineService, 'submitAnswer').and.callFake(
        (answer, service, successCallback) => {
          successCallback(
            sampleCard, true, 'feedbackHtml', audioTranslations, null,
            'skillId', false, 'taggedSkillId', true, false, true, 'focusLabel');
          return true;
        });
      spyOn(playerPositionService, 'getCurrentStateName')
        .and.returnValue('currentState');
      spyOn(statsReportingService, 'recordStateTransition')
        .and.returnValue(null);
      spyOn(statsReportingService, 'recordStateCompleted')
        .and.returnValue(null);
      spyOn(statsReportingService, 'recordExplorationActuallyStarted')
        .and.returnValue(null);
      spyOn(learnerAnswerInfoService, 'getCanAskLearnerForAnswerInfo')
        .and.returnValue(true);
      let helperCardSpy = spyOn(
        playerPositionService.onHelpCardAvailable, 'emit').and.callThrough();
      $scope.answerIsBeingProcessed = false;
      $scope.displayedCard = sampleCard;

      $scope.submitAnswer();
      $timeout.flush();

      expect(helperCardSpy).toHaveBeenCalled();
    });

    it('should mark exploration as completed if the ' +
      'current card is last card', function() {
      sampleCard = StateCard.createNewCard(
        'State 1', '<p>Content</p>', '<interaction></interaction>',
        interactionObjectFactory.createFromBackendDict(interactionDict3),
        RecordedVoiceovers.createEmpty(),
        writtenTranslationsObjectFactory.createEmpty(),
        'content', audioTranslationLanguageService);
      spyOn(explorationEngineService, 'getState').and.returnValue(sampleState);
      spyOn(playerTranscriptService, 'isLastCard')
        .and.returnValue(true);
      spyOn(playerTranscriptService, 'addNewInput').and.returnValue(null);
      spyOn(playerTranscriptService, 'addNewResponse')
        .and.returnValue(null);
      spyOn(playerPositionService, 'recordAnswerSubmission')
        .and.returnValue(null);
      spyOn(explorationPlayerStateService, 'getCurrentEngineService')
        .and.returnValue(explorationEngineService);
      spyOn(explorationEngineService, 'submitAnswer').and.callFake(
        (answer, service, successCallback) => {
          successCallback(
            sampleCard, true, 'feedbackHtml', audioTranslations, null,
            'skillId', false, 'taggedSkillId', true, false, true, 'focusLabel');
          return true;
        });
      spyOn(playerPositionService, 'getCurrentStateName')
        .and.returnValue('currentState');
      spyOn(statsReportingService, 'recordStateTransition')
        .and.returnValue(null);
      spyOn(statsReportingService, 'recordExplorationActuallyStarted')
        .and.returnValue(null);
      let explorationCompletedSpy = spyOn(
        statsReportingService, 'recordStateCompleted')
        .and.returnValue(null);
      $scope.answerIsBeingProcessed = false;
      $scope.displayedCard = sampleCard;

      $scope.submitAnswer();
      $timeout.flush();

      expect(explorationCompletedSpy).toHaveBeenCalled();
    });

    it('should stay on same card if anwer is incorrect', fakeAsync(function() {
      spyOn(explorationEngineService, 'getState').and.returnValue(sampleState);
      spyOn(playerTranscriptService, 'isLastCard')
        .and.returnValue(true);
      spyOn(playerTranscriptService, 'addNewInput').and.returnValue(null);
      spyOn(playerTranscriptService, 'updateLatestInteractionHtml')
        .and.returnValue(null);
      spyOn(playerTranscriptService, 'addNewResponse')
        .and.returnValue(null);
      spyOn(playerPositionService, 'recordAnswerSubmission')
        .and.returnValue(null);
      spyOn(explorationPlayerStateService, 'getCurrentEngineService')
        .and.returnValue(explorationEngineService);
      spyOn(explorationEngineService, 'submitAnswer').and.callFake(
        (answer, service, successCallback) => {
          successCallback(
            sampleCard, true, 'feedbackHtml', audioTranslations, 'refresherId',
            'skillId', true, 'taggedSkillId', true, true, false, 'focusLabel');
          return true;
        });
      spyOn(playerPositionService, 'getCurrentStateName')
        .and.returnValue('currentState');
      spyOn(statsReportingService, 'recordStateTransition')
        .and.returnValue(null);
      spyOn(statsReportingService, 'recordStateCompleted')
        .and.returnValue(null);
      spyOn(statsReportingService, 'recordExplorationActuallyStarted')
        .and.returnValue(null);
      let wrongAnswerSpy = spyOn(
        hintsAndSolutionManagerService, 'recordWrongAnswer')
        .and.returnValue(null);
      spyOn(conceptCardBackendApiService, 'loadConceptCardsAsync')
        .and.resolveTo(sampleConceptCard);

      $scope.answerIsBeingProcessed = false;
      $scope.displayedCard = sampleCard;

      $scope.submitAnswer();
      $timeout.flush();
      tick();
      $timeout.flush();
      flush();
      discardPeriodicTasks();

      expect(wrongAnswerSpy).toHaveBeenCalled();
    }));

    it('should open a modal to confirm redirection ' +
      'to refresher exploration', fakeAsync(function() {
      let requestUrl = '/explorationsummarieshandler/data?' +
      'stringified_exp_ids=' + encodeURI(JSON.stringify(['refresherId']));
      spyOn(explorationEngineService, 'getState').and.returnValue(sampleState);
      spyOn(playerTranscriptService, 'isLastCard')
        .and.returnValue(true);
      spyOn(playerTranscriptService, 'addNewInput').and.returnValue(null);
      spyOn(playerTranscriptService, 'updateLatestInteractionHtml')
        .and.returnValue(null);
      spyOn(playerTranscriptService, 'addNewResponse')
        .and.returnValue(null);
      spyOn(playerPositionService, 'recordAnswerSubmission')
        .and.returnValue(null);
      spyOn(explorationPlayerStateService, 'getCurrentEngineService')
        .and.returnValue(explorationEngineService);
      spyOn(explorationEngineService, 'submitAnswer').and.callFake(
        (answer, service, successCallback) => {
          successCallback(
            sampleCard, true, 'feedbackHtml', audioTranslations, 'refresherId',
            'skillId', true, 'taggedSkillId', true, true, false, 'focusLabel');
          return true;
        });
      spyOn(playerPositionService, 'getCurrentStateName')
        .and.returnValue('currentState');
      spyOn(statsReportingService, 'recordStateTransition')
        .and.returnValue(null);
      spyOn(statsReportingService, 'recordStateCompleted')
        .and.returnValue(null);
      spyOn(statsReportingService, 'recordExplorationActuallyStarted')
        .and.returnValue(null);
      spyOn(conceptCardBackendApiService, 'loadConceptCardsAsync')
        .and.resolveTo(sampleConceptCard);
      let redirectionSpy = spyOn(
        refresherExplorationConfirmationModalService,
        'displayRedirectConfirmationModal').and.callFake((expId, cb) => {
        cb();
      });

      $httpBackend.expect(
        'GET', requestUrl).respond({
        summaries: ['explorationSummary']
      });
      $scope.answerIsBeingProcessed = false;
      $scope.displayedCard = sampleCard;

      $scope.submitAnswer();
      $timeout.flush();
      $scope.$apply();
      $httpBackend.flush();
      tick();

      expect(redirectionSpy).toHaveBeenCalled();
    }));
  });

  describe('on showing a pending card ', function() {
    it('should check whether the user is in story chapter ' +
      'mode', fakeAsync(function() {
      sampleCard = StateCard.createNewCard(
        'State 1', '<p>Content</p>', '<interaction></interaction>',
        interactionObjectFactory.createFromBackendDict(interactionDict3),
        RecordedVoiceovers.createEmpty(),
        writtenTranslationsObjectFactory.createEmpty(),
        'content', audioTranslationLanguageService);
      $scope.nextCard = sampleCard;
      $scope.displayedCard = sampleCard;
      $scope.isLoggedIn = true;
      spyOn(explorationPlayerStateService, 'getLanguageCode')
        .and.returnValue('af');
      spyOn(explorationPlayerStateService, 'recordNewCardAdded')
        .and.returnValue(null);
      spyOn(contentTranslationLanguageService, 'getCurrentContentLanguageCode')
        .and.returnValue('en');
      spyOn(playerPositionService, 'setDisplayedCardIndex')
        .and.returnValue(null);
      spyOn(playerPositionService, 'changeCurrentQuestion')
        .and.returnValue(null);
      spyOn(urlService, 'getQueryFieldValuesAsList')
        .and.returnValue(['id1', 'id2']);
      let storyChapterSpy = spyOn(
        explorationPlayerStateService, 'isInStoryChapterMode')
        .and.returnValue(true);
      spyOn(
        storyViewerBackendApiService, 'fetchStoryDataAsync').and.returnValue(
        Promise.resolve(samplePlaythroughObject));
      spyOn(playerTranscriptService, 'getNumCards')
        .and.returnValue(2);
      spyOn(urlInterpolationService, 'interpolateUrl').and.returnValue('url');
      spyOn(contentTranslationManagerService, 'displayTranslations')
        .and.returnValue(null);
      spyOn(windowDimensionsService, 'getWidth').and.returnValue(1200);
      spyOn(storyViewerBackendApiService, 'recordChapterCompletionAsync')
        .and.resolveTo({
          readyForReviewTest: true
        } as StoryChapterCompletionResponse);

      $scope.showPendingCard();
      $timeout.flush();
      tick();

      expect(storyChapterSpy).toHaveBeenCalled();
    }));

    it('should set display card index when current card is ' +
      'supplemental and next card is non empty', fakeAsync(function() {
      let samplePreviousCard = StateCard.createNewCard(
        'State 1', '<p>Content</p>', '<interaction></interaction>',
        interactionObjectFactory.createFromBackendDict(interactionDict3),
        RecordedVoiceovers.createEmpty(),
        writtenTranslationsObjectFactory.createEmpty(),
        'content', audioTranslationLanguageService);
      spyOn(playerTranscriptService, 'getLastCard')
        .and.returnValue(samplePreviousCard);
      sampleCard = StateCard.createNewCard(
        'State 1', '<p>Content</p>', '<interaction></interaction>',
        interactionObjectFactory.createFromBackendDict(interactionDict2),
        RecordedVoiceovers.createEmpty(),
        writtenTranslationsObjectFactory.createEmpty(),
        'content', audioTranslationLanguageService);
      $scope.nextCard = sampleCard;
      $scope.displayedCard = samplePreviousCard;
      spyOn(explorationPlayerStateService, 'getLanguageCode')
        .and.returnValue('af');
      spyOn(explorationPlayerStateService, 'recordNewCardAdded')
        .and.returnValue(null);
      spyOn(contentTranslationLanguageService, 'getCurrentContentLanguageCode')
        .and.returnValue('en');
      let displayCardIndexSpy = spyOn(
        playerPositionService, 'setDisplayedCardIndex')
        .and.returnValue(null);
      spyOn(playerPositionService, 'changeCurrentQuestion')
        .and.returnValue(null);
      spyOn(urlService, 'getQueryFieldValuesAsList')
        .and.returnValue(['id1', 'id2']);
      spyOn(explorationPlayerStateService, 'isInStoryChapterMode')
        .and.returnValue(true);
      spyOn(
        storyViewerBackendApiService, 'fetchStoryDataAsync').and.returnValue(
        Promise.resolve(samplePlaythroughObject));
      spyOn(playerTranscriptService, 'getNumCards')
        .and.returnValue(2);
      spyOn(urlInterpolationService, 'interpolateUrl').and.returnValue('url');
      spyOn(contentTranslationManagerService, 'displayTranslations')
        .and.returnValue(null);
      spyOn(windowDimensionsService, 'getWidth').and.returnValue(1200);

      $scope.showPendingCard();
      $timeout.flush();
      tick();

      expect(displayCardIndexSpy).toHaveBeenCalled();
    }));

    it('should set display card index when ' +
      'current card is not inline and previous ' +
      'card is non empty', fakeAsync(function() {
      sampleCard = StateCard.createNewCard(
        'State 1', '<p>Content</p>', '<interaction></interaction>',
        interactionObjectFactory.createFromBackendDict(interactionDict2),
        RecordedVoiceovers.createEmpty(),
        writtenTranslationsObjectFactory.createEmpty(),
        'content', audioTranslationLanguageService);

      let sampleNextCard = StateCard.createNewCard(
        'State 1', '<p>Content</p>', '<interaction></interaction>',
        interactionObjectFactory.createFromBackendDict(interactionDict3),
        RecordedVoiceovers.createEmpty(),
        writtenTranslationsObjectFactory.createEmpty(),
        'content', audioTranslationLanguageService);
      spyOn(playerTranscriptService, 'getLastCard')
        .and.returnValue(sampleCard);

      $scope.nextCard = sampleNextCard;
      $scope.displayedCard = sampleCard;
      spyOn(explorationPlayerStateService, 'getLanguageCode')
        .and.returnValue('af');
      spyOn(explorationPlayerStateService, 'recordNewCardAdded')
        .and.returnValue(null);
      spyOn(contentTranslationLanguageService, 'getCurrentContentLanguageCode')
        .and.returnValue('en');
      let displayCardIndexSpy = spyOn(
        playerPositionService, 'setDisplayedCardIndex')
        .and.returnValue(null);
      spyOn(playerPositionService, 'changeCurrentQuestion')
        .and.returnValue(null);
      spyOn(urlService, 'getQueryFieldValuesAsList')
        .and.returnValue(['id1', 'id2']);
      spyOn(explorationPlayerStateService, 'isInStoryChapterMode')
        .and.returnValue(true);
      spyOn(
        storyViewerBackendApiService, 'fetchStoryDataAsync').and.returnValue(
        Promise.resolve(samplePlaythroughObject));
      spyOn(playerTranscriptService, 'getNumCards')
        .and.returnValue(2);
      spyOn(urlInterpolationService, 'interpolateUrl').and.returnValue('url');
      spyOn(contentTranslationManagerService, 'displayTranslations')
        .and.returnValue(null);
      spyOn(windowDimensionsService, 'getWidth').and.returnValue(1200);

      $scope.showPendingCard();
      $timeout.flush();
      tick();
      $timeout.flush();

      expect(displayCardIndexSpy).toHaveBeenCalled();
    }));

    it('should set display card index when ' +
      'current card is inline and previous ' +
      'card is non empty', fakeAsync(function() {
      sampleCard = StateCard.createNewCard(
        'State 1', '<p>Content</p>', '<interaction></interaction>',
        interactionObjectFactory.createFromBackendDict(interactionDict2),
        RecordedVoiceovers.createEmpty(),
        writtenTranslationsObjectFactory.createEmpty(),
        'content', audioTranslationLanguageService);

      let sampleNextCard = StateCard.createNewCard(
        'State 1', '<p>Content</p>', '<interaction></interaction>',
        interactionObjectFactory.createFromBackendDict(interactionDict3),
        RecordedVoiceovers.createEmpty(),
        writtenTranslationsObjectFactory.createEmpty(),
        'content', audioTranslationLanguageService);
      spyOn(playerTranscriptService, 'getLastCard')
        .and.returnValue(sampleCard);

      $scope.nextCard = sampleNextCard;
      spyOn(explorationPlayerStateService, 'getLanguageCode')
        .and.returnValue('af');
      spyOn(explorationPlayerStateService, 'recordNewCardAdded')
        .and.returnValue(null);
      spyOn(contentTranslationLanguageService, 'getCurrentContentLanguageCode')
        .and.returnValue('en');
      let displayCardIndexSpy = spyOn(
        playerPositionService, 'setDisplayedCardIndex')
        .and.returnValue(null);
      spyOn(playerPositionService, 'changeCurrentQuestion')
        .and.returnValue(null);
      spyOn(urlService, 'getQueryFieldValuesAsList')
        .and.returnValue(['id1', 'id2']);
      spyOn(explorationPlayerStateService, 'isInStoryChapterMode')
        .and.returnValue(true);
      spyOn(
        storyViewerBackendApiService, 'fetchStoryDataAsync').and.returnValue(
        Promise.resolve(samplePlaythroughObject));
      spyOn(playerTranscriptService, 'getNumCards')
        .and.returnValue(2);
      spyOn(urlInterpolationService, 'interpolateUrl').and.returnValue('url');
      spyOn(contentTranslationManagerService, 'displayTranslations')
        .and.returnValue(null);
      spyOn(windowDimensionsService, 'getWidth').and.returnValue(1200);

      $scope.showPendingCard();
      $timeout.flush();
      tick();
      $timeout.flush();

      expect(displayCardIndexSpy).toHaveBeenCalled();
    }));

    it('should throw error if current exploration has ' +
      'no parent exploration', fakeAsync(function() {
      sampleCard = StateCard.createNewCard(
        'State 1', '<p>Content</p>', '<interaction></interaction>',
        interactionObjectFactory.createFromBackendDict(interactionDict3),
        RecordedVoiceovers.createEmpty(),
        writtenTranslationsObjectFactory.createEmpty(),
        'content', audioTranslationLanguageService);
      $scope.nextCard = sampleCard;
      $scope.displayedCard = sampleCard;
      $scope.isLoggedIn = true;
      spyOn(explorationPlayerStateService, 'getLanguageCode')
        .and.returnValue('af');
      spyOn(explorationPlayerStateService, 'recordNewCardAdded')
        .and.returnValue(null);
      spyOn(contentTranslationLanguageService, 'getCurrentContentLanguageCode')
        .and.returnValue('en');
      spyOn(playerPositionService, 'setDisplayedCardIndex')
        .and.returnValue(null);
      spyOn(playerPositionService, 'changeCurrentQuestion')
        .and.returnValue(null);
      spyOn(urlService, 'getQueryFieldValuesAsList')
        .and.returnValue([]);
      spyOn(explorationEngineService, 'getAuthorRecommendedExpIds')
        .and.returnValue(null);
      spyOn(explorationPlayerStateService, 'isInStoryChapterMode')
        .and.returnValue(true);
      spyOn(
        storyViewerBackendApiService, 'fetchStoryDataAsync').and.returnValue(
        Promise.resolve(samplePlaythroughObject));
      spyOn(playerTranscriptService, 'getNumCards')
        .and.returnValue(2);
      spyOn(urlInterpolationService, 'interpolateUrl').and.returnValue('url');
      spyOn(contentTranslationManagerService, 'displayTranslations')
        .and.returnValue(null);
      spyOn(windowDimensionsService, 'getWidth').and.returnValue(1200);
      spyOn(storyViewerBackendApiService, 'recordChapterCompletionAsync')
        .and.resolveTo({
          readyForReviewTest: true
        } as StoryChapterCompletionResponse);

      $scope.showPendingCard();
      $timeout.flush();
      tick();

      expect(() => {
        $scope.recommendedExplorationSummaries[0].parentExplorationIds;
      }).toThrowError(
        'Cannot read properties of undefined (reading \'parentExplorationIds\')'
      );
    }));

    it('should fetch recommeded summary dicts ' +
      'when user is logged in and not in story mode', fakeAsync(function() {
      sampleCard = StateCard.createNewCard(
        'State 1', '<p>Content</p>', '<interaction></interaction>',
        interactionObjectFactory.createFromBackendDict(interactionDict3),
        RecordedVoiceovers.createEmpty(),
        writtenTranslationsObjectFactory.createEmpty(),
        'content', audioTranslationLanguageService);
      $scope.nextCard = sampleCard;
      $scope.displayedCard = sampleCard;
      $scope.isLoggedIn = true;
      spyOn(explorationPlayerStateService, 'getLanguageCode')
        .and.returnValue('af');
      spyOn(explorationPlayerStateService, 'recordNewCardAdded')
        .and.returnValue(null);
      spyOn(contentTranslationLanguageService, 'getCurrentContentLanguageCode')
        .and.returnValue('en');
      spyOn(playerPositionService, 'setDisplayedCardIndex')
        .and.returnValue(null);
      spyOn(playerPositionService, 'changeCurrentQuestion')
        .and.returnValue(null);
      spyOn(urlService, 'getQueryFieldValuesAsList')
        .and.returnValue(['id1', 'id2']);
      spyOn(explorationPlayerStateService, 'isInStoryChapterMode')
        .and.returnValue(false);
      spyOn(
        storyViewerBackendApiService, 'fetchStoryDataAsync').and.returnValue(
        Promise.resolve(samplePlaythroughObject));
      spyOn(playerTranscriptService, 'getNumCards')
        .and.returnValue(2);
      spyOn(urlInterpolationService, 'interpolateUrl').and.returnValue('url');
      spyOn(contentTranslationManagerService, 'displayTranslations')
        .and.returnValue(null);
      spyOn(windowDimensionsService, 'getWidth').and.returnValue(1200);
      let summaryDictsSpy = spyOn(
        explorationRecommendationsService, 'getRecommendedSummaryDicts')
        .and.callFake((id, dict, cb) => {
          cb([]);
        });
      spyOn(storyViewerBackendApiService, 'recordChapterCompletionAsync')
        .and.resolveTo({
          readyForReviewTest: true
        } as StoryChapterCompletionResponse);

      $scope.showPendingCard();
      $timeout.flush();
      tick();

      expect(summaryDictsSpy).toHaveBeenCalled();
    }));

    it('should set return url when user is not ' +
      'logged in', fakeAsync(function() {
      sampleCard = StateCard.createNewCard(
        'State 1', '<p>Content</p>', '<interaction></interaction>',
        interactionObjectFactory.createFromBackendDict(interactionDict3),
        RecordedVoiceovers.createEmpty(),
        writtenTranslationsObjectFactory.createEmpty(),
        'content', audioTranslationLanguageService);
      $scope.nextCard = sampleCard;
      $scope.displayedCard = sampleCard;
      spyOn(explorationPlayerStateService, 'getLanguageCode')
        .and.returnValue('af');
      spyOn(explorationPlayerStateService, 'recordNewCardAdded')
        .and.returnValue(null);
      spyOn(contentTranslationLanguageService, 'getCurrentContentLanguageCode')
        .and.returnValue('en');
      spyOn(playerPositionService, 'setDisplayedCardIndex')
        .and.returnValue(null);
      spyOn(playerPositionService, 'changeCurrentQuestion')
        .and.returnValue(null);
      spyOn(urlService, 'getQueryFieldValuesAsList')
        .and.returnValue(['id1', 'id2']);
      spyOn(explorationPlayerStateService, 'isInStoryChapterMode')
        .and.returnValue(true);
      spyOn(
        storyViewerBackendApiService, 'fetchStoryDataAsync').and.returnValue(
        Promise.resolve(samplePlaythroughObject));
      spyOn(playerTranscriptService, 'getNumCards')
        .and.returnValue(2);
      spyOn(urlInterpolationService, 'interpolateUrl').and.returnValue('url');
      spyOn(contentTranslationManagerService, 'displayTranslations')
        .and.returnValue(null);
      spyOn(windowDimensionsService, 'getWidth').and.returnValue(1200);
      let returnUrlSpy = spyOn(
        userService, 'setReturnUrl').and.returnValue(null);

      $scope.showPendingCard();
      $timeout.flush();
      tick();

      expect(returnUrlSpy).toHaveBeenCalled();
    }));
  });
});
