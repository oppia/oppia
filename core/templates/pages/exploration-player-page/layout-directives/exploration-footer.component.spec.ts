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
 * @fileoverview Unit tests for showing author/share footer
 * in exploration player.
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {
  async,
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import {ExplorationFooterComponent} from './exploration-footer.component';
import {NgbModal, NgbModalRef, NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {TranslateService} from '@ngx-translate/core';
import {MockTranslateService} from 'components/forms/schema-based-editors/integration-tests/schema-based-editors.integration.spec';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {LimitToPipe} from 'filters/limit-to.pipe';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ContextService} from 'services/context.service';
import {UrlService} from 'services/contextual/url.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {
  ExplorationSummaryBackendApiService,
  ExplorationSummaryDict,
} from 'domain/summary/exploration-summary-backend-api.service';
import {EventEmitter} from '@angular/core';
import {QuestionPlayerStateService} from 'components/question-directives/question-player/services/question-player-state.service';
import {LearnerExplorationSummaryBackendDict} from 'domain/summary/learner-exploration-summary.model';
import {LearnerViewInfoBackendApiService} from '../services/learner-view-info-backend-api.service';
import {LoggerService} from 'services/contextual/logger.service';
import {
  FetchExplorationBackendResponse,
  ReadOnlyExplorationBackendApiService,
} from 'domain/exploration/read-only-exploration-backend-api.service';
import {ExplorationEngineService} from '../services/exploration-engine.service';
import {StateObjectFactory} from 'domain/state/StateObjectFactory';
import {EditableExplorationBackendApiService} from 'domain/exploration/editable-exploration-backend-api.service';
import {PlayerPositionService} from '../services/player-position.service';
import {PlayerTranscriptService} from '../services/player-transcript.service';
import {StateCard} from 'domain/state_card/state-card.model';
import {RecordedVoiceovers} from 'domain/exploration/recorded-voiceovers.model';
import {AudioTranslationLanguageService} from '../services/audio-translation-language.service';
import {UserInfo} from 'domain/user/user-info.model';
import {UserService} from 'services/user.service';
import {
  Interaction,
  InteractionObjectFactory,
} from 'domain/exploration/InteractionObjectFactory';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {CheckpointCelebrationUtilityService} from 'pages/exploration-player-page/services/checkpoint-celebration-utility.service';
import {ConceptCardManagerService} from '../services/concept-card-manager.service';

class MockCheckpointCelebrationUtilityService {
  private _openLessonInformationModalEmitter = new EventEmitter<void>();

  getOpenLessonInformationModalEmitter(): EventEmitter<void> {
    return this._openLessonInformationModalEmitter;
  }

  openLessonInformationModal(): void {
    this._openLessonInformationModalEmitter.emit();
  }
}

class MockWindowRef {
  nativeWindow = {
    location: {
      pathname: '/learn/math',
      href: '',
      reload: () => {},
      toString: () => {
        return 'http://localhost:8181/?lang=es';
      },
    },
    localStorage: {
      last_uploaded_audio_lang: 'en',
      removeItem: (name: string) => {},
    },
    gtag: () => {},
    history: {
      pushState(data: object, title: string, url?: string | null) {},
    },
    document: {
      body: {
        style: {
          overflowY: 'auto',
        },
      },
    },
  };
}

class MockNgbModalRef {
  componentInstance = {
    skillId: null,
    explorationId: null,
  };
}

describe('ExplorationFooterComponent', () => {
  let component: ExplorationFooterComponent;
  let fixture: ComponentFixture<ExplorationFooterComponent>;
  let contextService: ContextService;
  let urlService: UrlService;
  let learnerViewInfoBackendApiService: LearnerViewInfoBackendApiService;
  let loggerService: LoggerService;
  let readOnlyExplorationBackendApiService: ReadOnlyExplorationBackendApiService;
  let windowDimensionsService: WindowDimensionsService;
  let questionPlayerStateService: QuestionPlayerStateService;
  let mockResizeEventEmitter = new EventEmitter();
  let explorationSummaryBackendApiService: ExplorationSummaryBackendApiService;
  let stateObjectFactory: StateObjectFactory;
  let explorationEngineService: ExplorationEngineService;
  let editableExplorationBackendApiService: EditableExplorationBackendApiService;
  let playerPositionService: PlayerPositionService;
  let playerTranscriptService: PlayerTranscriptService;
  let audioTranslationLanguageService: AudioTranslationLanguageService;
  let userService: UserService;
  let urlInterpolationService: UrlInterpolationService;
  let checkpointCelebrationUtilityService: CheckpointCelebrationUtilityService;
  let ngbModal: NgbModal;
  let conceptCardManagerService: ConceptCardManagerService;
  let interactionObjectFactory: InteractionObjectFactory;

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
      5: 0,
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
    title: 'expTitle',
  };

  let mockResultsLoadedEventEmitter = new EventEmitter<boolean>();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, NgbModule],
      declarations: [
        ExplorationFooterComponent,
        MockTranslatePipe,
        LimitToPipe,
      ],
      providers: [
        QuestionPlayerStateService,
        LearnerViewInfoBackendApiService,
        LoggerService,
        UrlInterpolationService,
        {
          provide: CheckpointCelebrationUtilityService,
          useClass: MockCheckpointCelebrationUtilityService,
        },
        {
          provide: WindowRef,
          useClass: MockWindowRef,
        },
        {
          provide: TranslateService,
          useClass: MockTranslateService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    contextService = TestBed.inject(ContextService);
    urlService = TestBed.inject(UrlService);
    windowDimensionsService = TestBed.inject(WindowDimensionsService);
    learnerViewInfoBackendApiService = TestBed.inject(
      LearnerViewInfoBackendApiService
    );
    loggerService = TestBed.inject(LoggerService);
    readOnlyExplorationBackendApiService = TestBed.inject(
      ReadOnlyExplorationBackendApiService
    );
    explorationSummaryBackendApiService = TestBed.inject(
      ExplorationSummaryBackendApiService
    );
    editableExplorationBackendApiService = TestBed.inject(
      EditableExplorationBackendApiService
    );
    questionPlayerStateService = TestBed.inject(QuestionPlayerStateService);
    explorationEngineService = TestBed.inject(ExplorationEngineService);
    stateObjectFactory = TestBed.inject(StateObjectFactory);
    playerPositionService = TestBed.inject(PlayerPositionService);
    playerTranscriptService = TestBed.inject(PlayerTranscriptService);
    audioTranslationLanguageService = TestBed.inject(
      AudioTranslationLanguageService
    );
    userService = TestBed.inject(UserService);
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    checkpointCelebrationUtilityService = TestBed.inject(
      CheckpointCelebrationUtilityService
    );
    conceptCardManagerService = TestBed.inject(ConceptCardManagerService);
    fixture = TestBed.createComponent(ExplorationFooterComponent);
    ngbModal = TestBed.inject(NgbModal);
    interactionObjectFactory = TestBed.inject(InteractionObjectFactory);
    component = fixture.componentInstance;
    fixture.detectChanges();

    spyOn(playerPositionService, 'onNewCardOpened').and.returnValue(
      new EventEmitter<StateCard>()
    );
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it(
    'should initialise component when user opens exploration ' + 'player',
    fakeAsync(() => {
      spyOn(contextService, 'getExplorationId').and.returnValue('exp1');
      spyOn(playerPositionService.onNewCardOpened, 'subscribe');
      spyOn(urlService, 'isIframed').and.returnValue(true);
      spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(false);
      spyOn(windowDimensionsService, 'getResizeEvent').and.returnValue(
        mockResizeEventEmitter
      );
      spyOn(playerPositionService.onLoadedMostRecentCheckpoint, 'subscribe');
      spyOn(conceptCardManagerService, 'reset');
      spyOn(
        checkpointCelebrationUtilityService.getOpenLessonInformationModalEmitter(),
        'subscribe'
      );
      spyOn(component, 'getCheckpointCount').and.returnValue(Promise.resolve());
      spyOn(component, 'showProgressReminderModal');
      spyOn(contextService, 'isInQuestionPlayerMode').and.returnValue(false);
      spyOn(contextService, 'getQuestionPlayerIsManuallySet').and.returnValue(
        true
      );
      spyOn(
        explorationSummaryBackendApiService,
        'loadPublicAndPrivateExplorationSummariesAsync'
      ).and.resolveTo({
        summaries: [
          {
            category: 'Coding',
            community_owned: true,
            thumbnail_bg_color: '#a33f40',
            title: 'Project Euler Problem 1',
            num_views: 263,
            tags: [],
            human_readable_contributors_summary: {
              contributor_1: {
                num_commits: 1,
              },
              contributor_2: {
                num_commits: 3,
              },
              contributor_3: {
                num_commits: 2,
              },
            },
            status: 'public',
            language_code: 'en',
            objective: 'Solve problem 1 on the Project Euler site',
            thumbnail_icon_url: '/subjects/Lightbulb.svg',
            id: 'exp1',
          } as ExplorationSummaryDict,
        ],
      });
      spyOn(userService, 'getUserInfoAsync').and.returnValue(
        Promise.resolve(
          new UserInfo([], false, false, false, false, false, '', '', '', true)
        )
      );

      // A StateCard which supports hints.
      let newCard = StateCard.createNewCard(
        'State 2',
        '<p>Content</p>',
        '<interaction></interaction>',
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
        }),
        RecordedVoiceovers.createEmpty(),
        'content',
        audioTranslationLanguageService
      );

      component.ngOnInit();
      playerPositionService.onNewCardOpened.emit(newCard);
      tick();

      expect(component.explorationId).toBe('exp1');
      expect(component.iframed).toBeTrue();
      expect(
        explorationSummaryBackendApiService.loadPublicAndPrivateExplorationSummariesAsync
      ).toHaveBeenCalledWith(['exp1']);
      expect(component.contributorNames).toEqual([
        'contributor_2',
        'contributor_3',
        'contributor_1',
      ]);
      expect(
        playerPositionService.onLoadedMostRecentCheckpoint.subscribe
      ).toHaveBeenCalled();
      expect(
        playerPositionService.onNewCardOpened.subscribe
      ).toHaveBeenCalled();
      expect(conceptCardManagerService.reset).toHaveBeenCalled();

      component.checkpointCount = 5;

      playerPositionService.onLoadedMostRecentCheckpoint.emit();

      expect(component.getCheckpointCount).toHaveBeenCalledTimes(1);
      expect(component.showProgressReminderModal).toHaveBeenCalled();

      component.checkpointCount = 0;

      playerPositionService.onLoadedMostRecentCheckpoint.emit();

      expect(component.getCheckpointCount).toHaveBeenCalledTimes(2);
    })
  );

  it('should check if progress reminder modal can be shown and show it', () => {
    const recentlyReachedCheckpointSpy = spyOn(
      component,
      'getMostRecentlyReachedCheckpointIndex'
    ).and.returnValue(1);
    spyOn(component, 'openProgressReminderModal');

    component.showProgressReminderModal();

    expect(component.openProgressReminderModal).not.toHaveBeenCalled();

    recentlyReachedCheckpointSpy.and.returnValue(3);
    component.expInfo = sampleExpInfo;

    component.showProgressReminderModal();

    expect(component.openProgressReminderModal).toHaveBeenCalled();
  });

  it('should fetch exploration info first if not present', fakeAsync(() => {
    spyOn(component, 'getMostRecentlyReachedCheckpointIndex').and.returnValue(
      3
    );
    spyOn(component, 'openProgressReminderModal');
    spyOn(
      learnerViewInfoBackendApiService,
      'fetchLearnerInfoAsync'
    ).and.returnValue(
      Promise.resolve({
        summaries: [
          {
            category: 'dummy_category',
            community_owned: false,
            activity_type: 'dummy_type',
            last_updated_msec: 5000,
            ratings: {
              1: 0,
              2: 0,
              3: 0,
              4: 0,
              5: 0,
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
            title: 'expTitle',
          },
        ],
      })
    );

    component.showProgressReminderModal();

    expect(
      learnerViewInfoBackendApiService.fetchLearnerInfoAsync
    ).toHaveBeenCalled();
  }));

  it('should open progress reminder modal', fakeAsync(() => {
    const ngbModal = TestBed.inject(NgbModal);

    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: {
        checkpointCount: 0,
        completedCheckpointsCount: 0,
        explorationTitle: '',
      },
      result: Promise.resolve(),
    } as NgbModalRef);
    spyOn(
      editableExplorationBackendApiService,
      'resetExplorationProgressAsync'
    ).and.returnValue(Promise.resolve());

    const stateCard = new StateCard(
      'End',
      '<p>Testing</p>',
      null,
      new Interaction([], [], null, null, [], 'EndExploration', null),
      [],
      null,
      'content',
      null
    );

    const endState = {
      classifier_model_id: null,
      recorded_voiceovers: {
        voiceovers_mapping: {
          content: {},
        },
      },
      solicit_answer_details: false,
      interaction: {
        solution: null,
        confirmed_unclassified_answers: [],
        id: 'EndExploration',
        hints: [],
        customization_args: {
          recommendedExplorationIds: {
            value: ['recommendedExplorationId'],
          },
        },
        answer_groups: [],
        default_outcome: null,
      },
      param_changes: [],
      card_is_checkpoint: false,
      linked_skill_id: null,
      content: {
        content_id: 'content',
        html: 'Congratulations, you have finished!',
      },
    };

    component.expInfo = sampleExpInfo;
    component.checkpointCount = 2;
    spyOn(playerPositionService, 'getDisplayedCardIndex').and.returnValue(2);
    spyOn(explorationEngineService, 'getStateCardByName').and.returnValue(
      stateCard
    );
    spyOn(explorationEngineService, 'getState').and.returnValue(
      stateObjectFactory.createFromBackendDict('End', endState)
    );

    component.openProgressReminderModal();
    tick();
    fixture.detectChanges();

    expect(ngbModal.open).toHaveBeenCalled();
    expect(
      editableExplorationBackendApiService.resetExplorationProgressAsync
    ).toHaveBeenCalled();
  }));

  it(
    "should show 'Need help? Take a look at the concept" +
      " card for refreshing your concepts.' tooltip",
    () => {
      spyOn(
        conceptCardManagerService,
        'isConceptCardTooltipOpen'
      ).and.returnValues(true, false);

      expect(component.isTooltipVisible()).toBe(true);
      expect(component.isTooltipVisible()).toBe(false);
    }
  );

  it('should resume exploration if progress reminder modal is canceled', fakeAsync(() => {
    const ngbModal = TestBed.inject(NgbModal);

    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: {
        checkpointCount: 0,
        completedCheckpointsCount: 0,
        explorationTitle: '',
      },
      result: Promise.reject(),
    } as NgbModalRef);
    spyOn(
      editableExplorationBackendApiService,
      'resetExplorationProgressAsync'
    );

    const stateCard = new StateCard(
      'End',
      '<p>Testing</p>',
      null,
      new Interaction([], [], null, null, [], 'EndExploration', null),
      [],
      null,
      'content',
      null
    );

    const endState = {
      classifier_model_id: null,
      recorded_voiceovers: {
        voiceovers_mapping: {
          content: {},
        },
      },
      solicit_answer_details: false,
      interaction: {
        solution: null,
        confirmed_unclassified_answers: [],
        id: 'EndExploration',
        hints: [],
        customization_args: {
          recommendedExplorationIds: {
            value: ['recommendedExplorationId'],
          },
        },
        answer_groups: [],
        default_outcome: null,
      },
      param_changes: [],
      card_is_checkpoint: false,
      linked_skill_id: null,
      content: {
        content_id: 'content',
        html: 'Congratulations, you have finished!',
      },
    };

    component.expInfo = sampleExpInfo;
    component.checkpointCount = 2;
    spyOn(playerPositionService, 'getDisplayedCardIndex').and.returnValue(2);
    spyOn(explorationEngineService, 'getStateCardByName').and.returnValue(
      stateCard
    );
    spyOn(explorationEngineService, 'getState').and.returnValue(
      stateObjectFactory.createFromBackendDict('End', endState)
    );

    component.openProgressReminderModal();
    tick();
    fixture.detectChanges();

    expect(ngbModal.open).toHaveBeenCalled();
    expect(
      editableExplorationBackendApiService.resetExplorationProgressAsync
    ).not.toHaveBeenCalled();
  }));

  it(
    'should handle error if backend call to learnerViewInfoBackendApiService' +
      ' fails while opening progress reminder modal',
    fakeAsync(() => {
      component.explorationId = 'expId';
      component.expInfo = null;
      spyOn(
        learnerViewInfoBackendApiService,
        'fetchLearnerInfoAsync'
      ).and.returnValue(Promise.reject());
      spyOn(component, 'getMostRecentlyReachedCheckpointIndex').and.returnValue(
        3
      );
      spyOn(loggerService, 'error');

      component.showProgressReminderModal();
      tick();

      expect(loggerService.error).toHaveBeenCalled();
    })
  );

  it(
    'should not show hints after user finishes practice session' +
      ' and results are loaded.',
    () => {
      spyOn(contextService, 'getExplorationId').and.returnValue('exp1');
      spyOn(contextService, 'isInQuestionPlayerMode').and.returnValue(true);
      expect(component.hintsAndSolutionsAreSupported).toBeTrue();

      spyOnProperty(
        questionPlayerStateService,
        'resultsPageIsLoadedEventEmitter'
      ).and.returnValue(mockResultsLoadedEventEmitter);

      component.ngOnInit();
      mockResultsLoadedEventEmitter.emit(true);

      expect(component.hintsAndSolutionsAreSupported).toBeFalse();
    }
  );

  it('should open the lesson information card', fakeAsync(() => {
    let ngbModal = TestBed.inject(NgbModal);

    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: {
        numberofCheckpoints: 0,
        completedWidth: 0,
        contributorNames: [],
        expInfo: null,
      },
      result: {
        then: (successCallback: () => void, errorCallback: () => void) => {
          successCallback();
          errorCallback();
        },
      },
    } as NgbModalRef);

    let sampleExpResponse: FetchExplorationBackendResponse = {
      exploration_id: '0',
      displayable_language_codes: [],
      is_logged_in: true,
      session_id: 'KERH',
      draft_change_list_id: 0,
      exploration: {
        init_state_name: 'Introduction',
        param_changes: [],
        param_specs: null,
        title: 'Exploration',
        next_content_id_index: 5,
        language_code: 'en',
        objective: 'To learn',
        states: {
          Start: {
            classifier_model_id: null,
            recorded_voiceovers: {
              voiceovers_mapping: {
                ca_placeholder_0: {},
                feedback_1: {},
                rule_input_2: {},
                content: {},
                default_outcome: {},
              },
            },
            solicit_answer_details: false,
            interaction: {
              solution: null,
              confirmed_unclassified_answers: [],
              id: 'TextInput',
              hints: [],
              customization_args: {
                rows: {
                  value: 1,
                },
                placeholder: {
                  value: {
                    unicode_str: '',
                    content_id: 'ca_placeholder_0',
                  },
                },
                catchMisspellings: {
                  value: false,
                },
              },
              answer_groups: [
                {
                  outcome: {
                    missing_prerequisite_skill_id: null,
                    refresher_exploration_id: null,
                    labelled_as_correct: false,
                    feedback: {
                      content_id: 'feedback_1',
                      html: '<p>Good Job</p>',
                    },
                    param_changes: [],
                    dest_if_really_stuck: null,
                    dest: 'Mid',
                  },
                  training_data: [],
                  rule_specs: [
                    {
                      inputs: {
                        x: {
                          normalizedStrSet: ['answer'],
                          contentId: 'rule_input_2',
                        },
                      },
                      rule_type: 'FuzzyEquals',
                    },
                  ],
                  tagged_skill_misconception_id: null,
                },
              ],
              default_outcome: {
                missing_prerequisite_skill_id: null,
                refresher_exploration_id: null,
                labelled_as_correct: false,
                feedback: {
                  content_id: 'default_outcome',
                  html: '<p>Try again.</p>',
                },
                param_changes: [],
                dest_if_really_stuck: null,
                dest: 'Start',
              },
            },
            param_changes: [],
            card_is_checkpoint: true,
            linked_skill_id: null,
            content: {
              content_id: 'content',
              html: '<p>First Question</p>',
            },
          },
          End: {
            classifier_model_id: null,
            recorded_voiceovers: {
              voiceovers_mapping: {
                content: {},
              },
            },
            solicit_answer_details: false,
            interaction: {
              solution: null,
              confirmed_unclassified_answers: [],
              id: 'EndExploration',
              hints: [],
              customization_args: {
                recommendedExplorationIds: {
                  value: ['recommnendedExplorationId'],
                },
              },
              answer_groups: [],
              default_outcome: null,
            },
            param_changes: [],
            card_is_checkpoint: false,
            linked_skill_id: null,
            content: {
              content_id: 'content',
              html: 'Congratulations, you have finished!',
            },
          },
          Mid: {
            classifier_model_id: null,
            recorded_voiceovers: {
              voiceovers_mapping: {
                ca_placeholder_0: {},
                feedback_1: {},
                rule_input_2: {},
                content: {},
                default_outcome: {},
              },
            },
            solicit_answer_details: false,
            interaction: {
              solution: null,
              confirmed_unclassified_answers: [],
              id: 'TextInput',
              hints: [],
              customization_args: {
                rows: {
                  value: 1,
                },
                placeholder: {
                  value: {
                    unicode_str: '',
                    content_id: 'ca_placeholder_0',
                  },
                },
                catchMisspellings: {
                  value: false,
                },
              },
              answer_groups: [
                {
                  outcome: {
                    missing_prerequisite_skill_id: null,
                    refresher_exploration_id: null,
                    labelled_as_correct: false,
                    feedback: {
                      content_id: 'feedback_1',
                      html: ' <p>Good Job</p>',
                    },
                    param_changes: [],
                    dest_if_really_stuck: null,
                    dest: 'End',
                  },
                  training_data: [],
                  rule_specs: [
                    {
                      inputs: {
                        x: {
                          normalizedStrSet: ['answer'],
                          contentId: 'rule_input_2',
                        },
                      },
                      rule_type: 'FuzzyEquals',
                    },
                  ],
                  tagged_skill_misconception_id: null,
                },
              ],
              default_outcome: {
                missing_prerequisite_skill_id: null,
                refresher_exploration_id: null,
                labelled_as_correct: false,
                feedback: {
                  content_id: 'default_outcome',
                  html: '<p>try again.</p>',
                },
                param_changes: [],
                dest_if_really_stuck: null,
                dest: 'Mid',
              },
            },
            param_changes: [],
            card_is_checkpoint: true,
            linked_skill_id: null,
            content: {
              content_id: 'content',
              html: '<p>Second Question</p>',
            },
          },
        },
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
        edits_allowed: true,
      },
      version: 1,
      can_edit: true,
      preferred_audio_language_code: 'en',
      preferred_language_codes: [],
      auto_tts_enabled: true,
      record_playthrough_probability: 1,
      has_viewed_lesson_info_modal_once: false,
      furthest_reached_checkpoint_exp_version: 1,
      furthest_reached_checkpoint_state_name: 'Mid',
      most_recently_reached_checkpoint_state_name: 'Mid',
      most_recently_reached_checkpoint_exp_version: 1,
    };

    spyOn(
      readOnlyExplorationBackendApiService,
      'loadLatestExplorationAsync'
    ).and.returnValue(Promise.resolve(sampleExpResponse));

    component.checkpointCount = 2;

    spyOn(component, 'getMostRecentlyReachedCheckpointIndex').and.returnValue(
      2
    );
    spyOn(explorationEngineService, 'getState').and.returnValue(
      stateObjectFactory.createFromBackendDict(
        'End',
        sampleExpResponse.exploration.states.End
      )
    );

    let stateCard = new StateCard(
      'End',
      '<p>Testing</p>',
      null,
      new Interaction([], [], null, null, [], 'EndExploration', null),
      [],
      null,
      'content',
      null
    );

    spyOn(explorationEngineService, 'getStateCardByName').and.returnValue(
      stateCard
    );
    spyOn(playerPositionService, 'getDisplayedCardIndex').and.returnValue(2);
    component.openInformationCardModal();
    tick();
    fixture.detectChanges();

    expect(ngbModal.open).toHaveBeenCalled();
    expect(component.lastCheckpointWasCompleted).toEqual(true);
    expect(component.completedCheckpointsCount).toEqual(2);
  }));

  it('should open concept card when user clicks on the icon', () => {
    const modalSpy = spyOn(ngbModal, 'open').and.callFake((dlg, opt) => {
      return {
        componentInstance: MockNgbModalRef,
        result: Promise.resolve(),
      } as NgbModalRef;
    });
    component.openConceptCardModal();
    expect(modalSpy).toHaveBeenCalled();
  });

  it('should trigger function to open concept card modal', fakeAsync(() => {
    spyOn(component, 'openConceptCardModal');

    const endState = {
      classifier_model_id: null,
      recorded_voiceovers: {
        voiceovers_mapping: {
          content: {},
        },
      },
      solicit_answer_details: false,
      written_translations: {
        translations_mapping: {
          content: {},
        },
      },
      interaction: {
        solution: null,
        confirmed_unclassified_answers: [],
        id: 'EndExploration',
        hints: [],
        customization_args: {
          recommendedExplorationIds: {
            value: ['recommendedExplorationId'],
          },
        },
        answer_groups: [],
        default_outcome: null,
      },
      param_changes: [],
      next_content_id_index: 0,
      card_is_checkpoint: false,
      linked_skill_id: 'Id',
      content: {
        content_id: 'content',
        html: 'Congratulations, you have finished!',
      },
    };
    spyOn(explorationEngineService, 'getState').and.returnValue(
      stateObjectFactory.createFromBackendDict('End', endState)
    );

    component.showConceptCard();

    expect(component.linkedSkillId).toEqual('Id');
    expect(component.openConceptCardModal).toHaveBeenCalled();
  }));

  it('should display lesson information card', fakeAsync(() => {
    component.explorationId = 'exp1';
    component.expInfo = {} as LearnerExplorationSummaryBackendDict;

    spyOn(component, 'openInformationCardModal');
    component.showInformationCard();
    spyOn(
      learnerViewInfoBackendApiService,
      'fetchLearnerInfoAsync'
    ).and.returnValue(
      Promise.resolve({
        summaries: [],
      })
    );

    expect(component.openInformationCardModal).toHaveBeenCalled();
    component.expInfo = null;

    component.showInformationCard();
    tick();

    expect(
      learnerViewInfoBackendApiService.fetchLearnerInfoAsync
    ).toHaveBeenCalled();
  }));

  it('should get footer image url', () => {
    spyOn(urlInterpolationService, 'getStaticImageUrl').and.returnValue(
      'dummy_image_url'
    );

    expect(component.getStaticImageUrl('general/apple.svg')).toEqual(
      'dummy_image_url'
    );
    expect(urlInterpolationService.getStaticImageUrl).toHaveBeenCalledWith(
      'general/apple.svg'
    );
  });

  it('should get checkpoint index from state name', fakeAsync(() => {
    spyOn(contextService, 'getExplorationId').and.returnValue('exp1');
    spyOn(playerTranscriptService, 'getNumCards').and.returnValue(1);
    const card = StateCard.createNewCard(
      'State A',
      '<p>Content</p>',
      '<interaction></interaction>',
      null,
      RecordedVoiceovers.createEmpty(),
      'content',
      audioTranslationLanguageService
    );
    spyOn(playerTranscriptService, 'getCard').and.returnValue(card);
    spyOn(explorationEngineService, 'getStateFromStateName').and.returnValue(
      stateObjectFactory.createFromBackendDict('State A', {
        classifier_model_id: null,
        content: {
          html: '',
          content_id: 'content',
        },
        interaction: {
          id: 'FractionInput',
          customization_args: {
            requireSimplestForm: {value: false},
            allowImproperFraction: {value: true},
            allowNonzeroIntegerPart: {value: true},
            customPlaceholder: {
              value: {
                content_id: '',
                unicode_str: '',
              },
            },
          },
          answer_groups: [],
          default_outcome: {
            dest: 'Introduction',
            dest_if_really_stuck: null,
            feedback: {
              content_id: 'default_outcome',
              html: '',
            },
            labelled_as_correct: false,
            param_changes: [],
            refresher_exploration_id: null,
            missing_prerequisite_skill_id: null,
          },
          confirmed_unclassified_answers: [],
          hints: [],
          solution: null,
        },
        linked_skill_id: null,
        param_changes: [],
        recorded_voiceovers: {
          voiceovers_mapping: {
            content: {},
            default_outcome: {},
          },
        },
        solicit_answer_details: false,
        card_is_checkpoint: true,
      })
    );

    let checkpointIndex = component.getMostRecentlyReachedCheckpointIndex();
    tick();
    fixture.detectChanges();
    expect(checkpointIndex).toEqual(1);
  }));

  it(
    'should handle error if backend call' +
      'to learnerViewInfoBackendApiService fails',
    fakeAsync(() => {
      let explorationId = 'expId';
      component.explorationId = explorationId;
      component.expInfo = null;

      spyOn(
        learnerViewInfoBackendApiService,
        'fetchLearnerInfoAsync'
      ).and.returnValue(Promise.reject());
      spyOn(loggerService, 'error');

      component.showInformationCard();
      tick();

      expect(loggerService.error).toHaveBeenCalled();
    })
  );

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
              content_id: 'content',
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
                  content_id: 'content',
                },
                labelled_as_correct: true,
                refresher_exploration_id: 'exp',
                missing_prerequisite_skill_id: null,
              },
              confirmed_unclassified_answers: [],
              id: null,
            },
          },
        },
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
        edits_allowed: true,
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
      most_recently_reached_checkpoint_exp_version: 1,
    };

    component.explorationId = 'expId';

    spyOn(
      readOnlyExplorationBackendApiService,
      'fetchExplorationAsync'
    ).and.returnValue(Promise.resolve(sampleDataResults));
    expect(component.checkpointCount).toEqual(0);

    component.getCheckpointCount();
    tick();

    expect(component.expStates).toEqual(sampleDataResults.exploration.states);
    expect(component.checkpointCount).toEqual(1);
  }));

  it('should check if user has viewed lesson info once', fakeAsync(() => {
    let sampleDataResults: FetchExplorationBackendResponse = {
      exploration_id: 'expId',
      displayable_language_codes: [],
      is_logged_in: true,
      session_id: 'KERH',
      exploration: {
        init_state_name: 'Introduction',
        param_changes: [],
        param_specs: null,
        title: 'Exploration',
        next_content_id_index: 5,
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
              content_id: 'content',
            },
            interaction: {
              customization_args: {},
              answer_groups: [],
              solution: null,
              hints: [],
              default_outcome: {
                param_changes: [],
                dest: 'Introduction',
                dest_if_really_stuck: null,
                feedback: {
                  html: '',
                  content_id: 'content',
                },
                labelled_as_correct: true,
                refresher_exploration_id: 'exp',
                missing_prerequisite_skill_id: null,
              },
              confirmed_unclassified_answers: [],
              id: null,
            },
          },
        },
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
        edits_allowed: true,
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
      most_recently_reached_checkpoint_exp_version: 1,
    };

    spyOn(
      readOnlyExplorationBackendApiService,
      'fetchExplorationAsync'
    ).and.returnValue(Promise.resolve(sampleDataResults));

    component.explorationId = 'expId';

    component.setLearnerHasViewedLessonInfoTooltip();
    tick();

    expect(component.hasLearnerHasViewedLessonInfoTooltip()).toBeFalse();
  }));

  it('should correctly mark lesson info tooltip as viewed', () => {
    spyOn(
      editableExplorationBackendApiService,
      'recordLearnerHasViewedLessonInfoModalOnce'
    ).and.returnValue(Promise.resolve());
    expect(component.hasLearnerHasViewedLessonInfoTooltip()).toBeFalse();
    component.userIsLoggedIn = true;
    component.learnerHasViewedLessonInfo();
    expect(component.hasLearnerHasViewedLessonInfoTooltip()).toBeTrue();
    expect(
      editableExplorationBackendApiService.recordLearnerHasViewedLessonInfoModalOnce
    ).toHaveBeenCalled();
  });

  it(
    'should show hints when initialized in question player when user is' +
      ' going through the practice session and should add subscription.',
    () => {
      spyOn(contextService, 'getExplorationId').and.returnValue('expId');
      spyOn(contextService, 'isInQuestionPlayerMode').and.returnValue(true);
      spyOn(
        questionPlayerStateService.resultsPageIsLoadedEventEmitter,
        'subscribe'
      );

      component.ngOnInit();

      expect(component.hintsAndSolutionsAreSupported).toBeTrue();
      expect(
        questionPlayerStateService.resultsPageIsLoadedEventEmitter.subscribe
      ).toHaveBeenCalled();
    }
  );

  it('should check if window is narrow when user resizes window', () => {
    spyOn(contextService, 'getExplorationId').and.returnValue('exp1');
    spyOn(urlService, 'isIframed').and.returnValue(true);
    spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(false);
    spyOn(windowDimensionsService, 'getResizeEvent').and.returnValue(
      mockResizeEventEmitter
    );
    spyOn(contextService, 'isInQuestionPlayerMode').and.returnValue(false);
    spyOn(contextService, 'getQuestionPlayerIsManuallySet').and.returnValue(
      false
    );

    component.ngOnInit();
    mockResizeEventEmitter.emit();
  });

  it('should open lesson info modal if emitter emits', () => {
    spyOn(contextService, 'getExplorationId').and.returnValue('expId');
    spyOn(contextService, 'isInQuestionPlayerMode').and.returnValue(true);
    spyOn(
      checkpointCelebrationUtilityService.getOpenLessonInformationModalEmitter(),
      'subscribe'
    ).and.callThrough();
    spyOn(component, 'showInformationCard');

    component.ngOnInit();
    checkpointCelebrationUtilityService.openLessonInformationModal();

    expect(
      checkpointCelebrationUtilityService.getOpenLessonInformationModalEmitter()
        .subscribe
    ).toHaveBeenCalled();
    expect(component.showInformationCard).toHaveBeenCalled();
  });

  it(
    'should not display author names when exploration is in question' +
      ' player mode',
    () => {
      spyOn(contextService, 'getExplorationId').and.returnValue('exp1');
      spyOn(urlService, 'isIframed').and.returnValue(true);
      spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(false);
      spyOn(windowDimensionsService, 'getResizeEvent').and.returnValue(
        mockResizeEventEmitter
      );
      spyOn(contextService, 'isInQuestionPlayerMode').and.returnValue(true);
      spyOn(contextService, 'getQuestionPlayerIsManuallySet').and.returnValue(
        false
      );
      spyOn(
        explorationSummaryBackendApiService,
        'loadPublicAndPrivateExplorationSummariesAsync'
      );

      component.ngOnInit();

      expect(
        explorationSummaryBackendApiService.loadPublicAndPrivateExplorationSummariesAsync
      ).not.toHaveBeenCalled();
    }
  );
});
