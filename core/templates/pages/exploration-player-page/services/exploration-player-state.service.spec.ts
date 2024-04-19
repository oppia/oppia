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
 * @fileoverview Unit tests for ExplorationPlayerStateService.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {fakeAsync, TestBed, tick, waitForAsync} from '@angular/core/testing';
import {TranslateService} from '@ngx-translate/core';
import {MockTranslateService} from 'components/forms/schema-based-editors/integration-tests/schema-based-editors.integration.spec';
import {EditableExplorationBackendApiService} from 'domain/exploration/editable-exploration-backend-api.service';
import {ExplorationBackendDict} from 'domain/exploration/ExplorationObjectFactory';
import {
  FetchExplorationBackendResponse,
  ReadOnlyExplorationBackendApiService,
} from 'domain/exploration/read-only-exploration-backend-api.service';
import {PretestQuestionBackendApiService} from 'domain/question/pretest-question-backend-api.service';
import {QuestionBackendApiService} from 'domain/question/question-backend-api.service';
import {
  Question,
  QuestionBackendDict,
  QuestionObjectFactory,
} from 'domain/question/QuestionObjectFactory';
import {DiagnosticTestTopicTrackerModel} from 'pages/diagnostic-test-player-page/diagnostic-test-topic-tracker.model';
import {ContextService} from 'services/context.service';
import {UrlService} from 'services/contextual/url.service';
import {
  ExplorationFeatures,
  ExplorationFeaturesBackendApiService,
} from 'services/exploration-features-backend-api.service';
import {ExplorationFeaturesService} from 'services/exploration-features.service';
import {PlaythroughService} from 'services/playthrough.service';
import {ExplorationPlayerConstants} from '../exploration-player-page.constants';
import {DiagnosticTestPlayerEngineService} from './diagnostic-test-player-engine.service';
import {ExplorationEngineService} from './exploration-engine.service';
import {ExplorationPlayerStateService} from './exploration-player-state.service';
import {NumberAttemptsService} from './number-attempts.service';
import {PlayerTranscriptService} from './player-transcript.service';
import {QuestionPlayerEngineService} from './question-player-engine.service';
import {StatsReportingService} from './stats-reporting.service';

describe('Exploration Player State Service', () => {
  let explorationPlayerStateService: ExplorationPlayerStateService;
  let playerTranscriptService: PlayerTranscriptService;
  let statsReportingService: StatsReportingService;
  let playthroughService: PlaythroughService;
  let explorationEngineService: ExplorationEngineService;
  let questionPlayerEngineService: QuestionPlayerEngineService;
  let editableExplorationBackendApiService: EditableExplorationBackendApiService;
  let explorationFeaturesBackendApiService: ExplorationFeaturesBackendApiService;
  let explorationFeaturesService: ExplorationFeaturesService;
  let numberAttemptsService: NumberAttemptsService;
  let questionBackendApiService: QuestionBackendApiService;
  let pretestQuestionBackendApiService: PretestQuestionBackendApiService;
  let questionObjectFactory: QuestionObjectFactory;
  let urlService: UrlService;
  let questionObject: Question;
  let diagnosticTestPlayerEngineService: DiagnosticTestPlayerEngineService;

  let returnDict = {
    can_edit: true,
    draft_change_list_id: 0,
    exploration: {
      init_state_name: 'state_name',
      param_changes: [],
      param_specs: {},
      states: {},
      title: '',
      language_code: '',
      objective: '',
      next_content_id_index: 0,
    },
    exploration_metadata: {
      title: '',
      category: '',
      objective: '',
      language_code: 'en',
      tags: [],
      blurb: '',
      author_notes: '',
      states_schema_version: 50,
      init_state_name: 'state_name',
      param_specs: {},
      param_changes: [],
      auto_tts_enabled: false,
      edits_allowed: true,
    },
    exploration_id: 'test_id',
    is_logged_in: true,
    session_id: 'test_session',
    version: 1,
    preferred_audio_language_code: 'en',
    preferred_language_codes: [],
    auto_tts_enabled: false,
    displayable_language_codes: [],
    record_playthrough_probability: 1,
    has_viewed_lesson_info_modal_once: false,
    furthest_reached_checkpoint_exp_version: 1,
    furthest_reached_checkpoint_state_name: 'State B',
    most_recently_reached_checkpoint_state_name: 'State A',
    most_recently_reached_checkpoint_exp_version: 1,
  };

  let questionBackendDict: QuestionBackendDict = {
    id: '',
    question_state_data: {
      classifier_model_id: null,
      param_changes: [],
      solicit_answer_details: false,
      content: {
        content_id: '1',
        html: 'Question 1',
      },
      interaction: {
        answer_groups: [
          {
            outcome: {
              dest: 'State 1',
              dest_if_really_stuck: null,
              feedback: {
                content_id: 'feedback_1',
                html: '<p>Try Again.</p>',
              },
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null,
              labelled_as_correct: true,
            },
            rule_specs: [
              {
                rule_type: 'Equals',
                inputs: {x: 0},
              },
            ],
            training_data: [],
            tagged_skill_misconception_id: null,
          },
          {
            outcome: {
              dest: 'State 2',
              dest_if_really_stuck: null,
              feedback: {
                content_id: 'feedback_2',
                html: '<p>Try Again.</p>',
              },
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null,
              labelled_as_correct: true,
            },
            rule_specs: [
              {
                rule_type: 'Equals',
                inputs: {x: 0},
              },
            ],
            training_data: [],
            tagged_skill_misconception_id: 'misconceptionId',
          },
        ],
        default_outcome: {
          dest: 'dest',
          dest_if_really_stuck: null,
          labelled_as_correct: true,
          missing_prerequisite_skill_id: null,
          refresher_exploration_id: null,
          param_changes: [],
          feedback: {
            content_id: 'feedback_id',
            html: '<p>Dummy Feedback</p>',
          },
        },
        id: 'TextInput',
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
        confirmed_unclassified_answers: [],
        hints: [
          {
            hint_content: {
              content_id: 'hint_1',
              html: '<p>This is a hint.</p>',
            },
          },
        ],
        solution: {
          correct_answer: 'Solution',
          explanation: {
            content_id: 'solution',
            html: '<p>This is a solution.</p>',
          },
          answer_is_exclusive: false,
        },
      },
      linked_skill_id: null,
      card_is_checkpoint: true,
      recorded_voiceovers: {
        voiceovers_mapping: {
          1: {},
          ca_placeholder_0: {},
          feedback_id: {},
          solution: {},
          hint_1: {},
        },
      },
    },
    question_state_data_schema_version: 2,
    language_code: '',
    next_content_id_index: 4,
    version: 1,
    linked_skill_ids: [],
    inapplicable_skill_misconception_ids: [],
  };

  class MockContextService {
    isInExplorationEditorPage(): boolean {
      return false;
    }

    isInQuestionPlayerMode(): boolean {
      return false;
    }

    getExplorationId(): string {
      return '123';
    }
  }

  class MockReadOnlyExplorationBackendApiService {
    async loadLatestExplorationAsync(
      explorationId: string
    ): Promise<FetchExplorationBackendResponse> {
      return Promise.resolve(returnDict);
    }

    async loadExplorationAsync(
      explorationId: string,
      version: number
    ): Promise<FetchExplorationBackendResponse> {
      return Promise.resolve(returnDict);
    }
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ExplorationPlayerStateService,
        PlayerTranscriptService,
        StatsReportingService,
        {
          provide: ContextService,
          useClass: MockContextService,
        },
        UrlService,
        {
          provide: ReadOnlyExplorationBackendApiService,
          useClass: MockReadOnlyExplorationBackendApiService,
        },
        {
          provide: TranslateService,
          useClass: MockTranslateService,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    explorationPlayerStateService = TestBed.inject(
      ExplorationPlayerStateService
    );
    playerTranscriptService = TestBed.inject(PlayerTranscriptService);
    playerTranscriptService =
      playerTranscriptService as jasmine.SpyObj<PlayerTranscriptService>;
    statsReportingService = TestBed.inject(StatsReportingService);
    statsReportingService =
      statsReportingService as jasmine.SpyObj<StatsReportingService>;
    playthroughService = TestBed.inject(PlaythroughService);
    playthroughService =
      playthroughService as jasmine.SpyObj<PlaythroughService>;
    explorationEngineService = TestBed.inject(ExplorationEngineService);
    explorationEngineService =
      explorationEngineService as jasmine.SpyObj<ExplorationEngineService>;
    questionPlayerEngineService = TestBed.inject(QuestionPlayerEngineService);
    questionPlayerEngineService =
      questionPlayerEngineService as jasmine.SpyObj<QuestionPlayerEngineService>;
    editableExplorationBackendApiService = TestBed.inject(
      EditableExplorationBackendApiService
    );
    editableExplorationBackendApiService =
      editableExplorationBackendApiService as jasmine.SpyObj<EditableExplorationBackendApiService>;
    explorationFeaturesBackendApiService = TestBed.inject(
      ExplorationFeaturesBackendApiService
    );
    explorationFeaturesBackendApiService =
      explorationFeaturesBackendApiService as jasmine.SpyObj<ExplorationFeaturesBackendApiService>;
    explorationFeaturesService = TestBed.inject(ExplorationFeaturesService);
    explorationFeaturesService =
      explorationFeaturesService as jasmine.SpyObj<ExplorationFeaturesService>;
    numberAttemptsService = TestBed.inject(NumberAttemptsService);
    numberAttemptsService =
      numberAttemptsService as jasmine.SpyObj<NumberAttemptsService>;
    questionBackendApiService = TestBed.inject(QuestionBackendApiService);
    questionBackendApiService =
      questionBackendApiService as jasmine.SpyObj<QuestionBackendApiService>;
    pretestQuestionBackendApiService = TestBed.inject(
      PretestQuestionBackendApiService
    );
    pretestQuestionBackendApiService =
      pretestQuestionBackendApiService as jasmine.SpyObj<PretestQuestionBackendApiService>;
    questionObjectFactory = TestBed.inject(QuestionObjectFactory);
    questionObject =
      questionObjectFactory.createFromBackendDict(questionBackendDict);
    urlService = TestBed.inject(UrlService);
    diagnosticTestPlayerEngineService = TestBed.inject(
      DiagnosticTestPlayerEngineService
    );
  });

  it('should properly initialize player', () => {
    spyOn(playerTranscriptService, 'init');
    spyOn(explorationPlayerStateService, 'initExplorationPreviewPlayer');
    let callback = () => {};

    explorationPlayerStateService.editorPreviewMode = true;
    explorationPlayerStateService.initializePlayer(callback);
    expect(playerTranscriptService.init).toHaveBeenCalled();
    expect(
      explorationPlayerStateService.initExplorationPreviewPlayer
    ).toHaveBeenCalledWith(callback);
    explorationPlayerStateService.editorPreviewMode = false;
    explorationPlayerStateService.initializePlayer(callback);
    expect(playerTranscriptService.init).toHaveBeenCalled();
    expect(
      explorationPlayerStateService.initExplorationPreviewPlayer
    ).toHaveBeenCalledWith(callback);
  });

  it('should initialize exploration services', () => {
    spyOn(statsReportingService, 'initSession');
    spyOn(playthroughService, 'initSession');
    spyOn(explorationEngineService, 'init');

    explorationPlayerStateService.initializeExplorationServices(
      returnDict,
      false,
      () => {}
    );

    expect(statsReportingService.initSession).toHaveBeenCalled();
    expect(playthroughService.initSession).toHaveBeenCalled();
    expect(explorationEngineService.init).toHaveBeenCalled();
  });

  it('should initialize pretest services', () => {
    spyOn(questionPlayerEngineService, 'init');
    let pretestQuestionObjects: Question[] = [];
    let callback = () => {};

    explorationPlayerStateService.initializePretestServices(
      pretestQuestionObjects,
      callback
    );
    expect(questionPlayerEngineService.init).toHaveBeenCalled();
  });

  it('should initialize question player services', () => {
    spyOn(questionPlayerEngineService, 'init');
    let questions = [questionBackendDict];
    let questionObjects = [questionObject];
    let successCallback = () => {};
    let errorCallback = () => {};

    explorationPlayerStateService.initializeQuestionPlayerServices(
      questions,
      successCallback,
      errorCallback
    );

    expect(questionPlayerEngineService.init).toHaveBeenCalledWith(
      questionObjects,
      successCallback,
      errorCallback
    );
  });

  it('should be able to skip the current question', () => {
    spyOn(diagnosticTestPlayerEngineService, 'skipCurrentQuestion');
    let successCallback = () => {};

    explorationPlayerStateService.skipCurrentQuestion(successCallback);

    expect(
      diagnosticTestPlayerEngineService.skipCurrentQuestion
    ).toHaveBeenCalledOnceWith(successCallback);
  });

  it('should set exploration mode', () => {
    explorationPlayerStateService.setExplorationMode();
    expect(explorationPlayerStateService.explorationMode).toEqual(
      ExplorationPlayerConstants.EXPLORATION_MODE.EXPLORATION
    );
    expect(explorationPlayerStateService.currentEngineService).toEqual(
      explorationEngineService
    );
  });

  it('should set pretest mode', () => {
    explorationPlayerStateService.setPretestMode();
    expect(explorationPlayerStateService.explorationMode).toEqual(
      ExplorationPlayerConstants.EXPLORATION_MODE.PRETEST
    );
    expect(explorationPlayerStateService.currentEngineService).toEqual(
      questionPlayerEngineService
    );
  });

  it('should set question player mode', () => {
    explorationPlayerStateService.setQuestionPlayerMode();
    expect(explorationPlayerStateService.explorationMode).toEqual(
      ExplorationPlayerConstants.EXPLORATION_MODE.QUESTION_PLAYER
    );
    expect(explorationPlayerStateService.currentEngineService).toEqual(
      questionPlayerEngineService
    );
  });

  it('should set story chapter mode', () => {
    explorationPlayerStateService.setStoryChapterMode();
    expect(explorationPlayerStateService.explorationMode).toEqual(
      ExplorationPlayerConstants.EXPLORATION_MODE.STORY_CHAPTER
    );
    expect(explorationPlayerStateService.currentEngineService).toEqual(
      explorationEngineService
    );
  });

  it('should init exploration preview player', fakeAsync(() => {
    spyOn(explorationPlayerStateService, 'setExplorationMode');
    spyOn(
      editableExplorationBackendApiService,
      'fetchApplyDraftExplorationAsync'
    ).and.returnValue(
      Promise.resolve({
        auto_tts_enabled: false,
        draft_changes: [],
        is_version_of_draft_valid: true,
        init_state_name: '',
        param_changes: [],
        param_specs: {},
        states: {},
        title: '',
        draft_change_list_id: 0,
        language_code: '',
        next_content_id_index: 0,
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
      } as ExplorationBackendDict)
    );
    spyOn(
      explorationFeaturesBackendApiService,
      'fetchExplorationFeaturesAsync'
    ).and.returnValue(
      Promise.resolve({
        explorationIsCurated: true,
        alwaysAskLearnersForAnswerDetails: false,
      })
    );
    spyOn(explorationFeaturesService, 'init');
    spyOn(explorationEngineService, 'init');
    spyOn(numberAttemptsService, 'reset');

    explorationPlayerStateService.initExplorationPreviewPlayer(() => {});
    tick();

    expect(explorationFeaturesService.init).toHaveBeenCalled();
    expect(explorationEngineService.init).toHaveBeenCalled();
    expect(numberAttemptsService.reset).toHaveBeenCalled();
  }));

  it('should init question player', fakeAsync(() => {
    spyOn(explorationPlayerStateService, 'setQuestionPlayerMode');
    spyOn(questionBackendApiService, 'fetchQuestionsAsync').and.returnValue(
      Promise.resolve([questionBackendDict])
    );
    spyOn(explorationPlayerStateService.onTotalQuestionsReceived, 'emit');
    spyOn(explorationPlayerStateService, 'initializeQuestionPlayerServices');

    let successCallback = () => {};
    let errorCallback = () => {};
    explorationPlayerStateService.initQuestionPlayer(
      {
        skillList: [],
        questionCount: 1,
        questionsSortedByDifficulty: true,
      },
      successCallback,
      errorCallback
    );
    tick();

    expect(
      explorationPlayerStateService.onTotalQuestionsReceived.emit
    ).toHaveBeenCalled();
    expect(
      explorationPlayerStateService.initializeQuestionPlayerServices
    ).toHaveBeenCalled();
  }));

  it('should init exploration player', fakeAsync(() => {
    let explorationFeatures: ExplorationFeatures = {
      explorationIsCurated: true,
      alwaysAskLearnersForAnswerDetails: false,
    };
    spyOn(
      explorationFeaturesBackendApiService,
      'fetchExplorationFeaturesAsync'
    ).and.returnValue(Promise.resolve(explorationFeatures));
    spyOn(
      pretestQuestionBackendApiService,
      'fetchPretestQuestionsAsync'
    ).and.returnValue(Promise.resolve([questionObject]));
    spyOn(explorationFeaturesService, 'init');
    spyOn(explorationPlayerStateService, 'initializePretestServices');
    spyOn(explorationPlayerStateService, 'setPretestMode');
    spyOn(explorationPlayerStateService, 'initializeExplorationServices');

    let successCallback = () => {};
    explorationPlayerStateService.initExplorationPlayer(successCallback);
    tick();
    expect(explorationFeaturesService.init).toHaveBeenCalled();
    expect(explorationPlayerStateService.setPretestMode).toHaveBeenCalled();
    expect(
      explorationPlayerStateService.initializeExplorationServices
    ).toHaveBeenCalled();
    expect(
      explorationPlayerStateService.initializePretestServices
    ).toHaveBeenCalled();
  }));

  it('should init exploration player without pretests', fakeAsync(() => {
    let explorationFeatures: ExplorationFeatures = {
      explorationIsCurated: true,
      alwaysAskLearnersForAnswerDetails: false,
    };
    spyOn(
      explorationFeaturesBackendApiService,
      'fetchExplorationFeaturesAsync'
    ).and.returnValue(Promise.resolve(explorationFeatures));
    spyOn(
      pretestQuestionBackendApiService,
      'fetchPretestQuestionsAsync'
    ).and.returnValue(Promise.resolve([]));
    spyOn(explorationFeaturesService, 'init');
    spyOn(explorationPlayerStateService, 'setExplorationMode');
    spyOn(explorationPlayerStateService, 'initializeExplorationServices');

    let successCallback = () => {};
    explorationPlayerStateService.initExplorationPlayer(successCallback);
    tick();
    expect(explorationPlayerStateService.setExplorationMode).toHaveBeenCalled();
    expect(
      explorationPlayerStateService.initializeExplorationServices
    ).toHaveBeenCalled();
  }));

  it('should init exploration player with story chapter mode', fakeAsync(() => {
    let explorationFeatures: ExplorationFeatures = {
      explorationIsCurated: true,
      alwaysAskLearnersForAnswerDetails: false,
    };
    spyOn(urlService, 'getUrlParams').and.returnValue({
      story_url_fragment: 'fragment',
      node_id: 'id',
    });
    spyOn(
      explorationFeaturesBackendApiService,
      'fetchExplorationFeaturesAsync'
    ).and.returnValue(Promise.resolve(explorationFeatures));
    spyOn(
      pretestQuestionBackendApiService,
      'fetchPretestQuestionsAsync'
    ).and.returnValue(Promise.resolve([]));
    spyOn(explorationFeaturesService, 'init');
    spyOn(explorationPlayerStateService, 'setStoryChapterMode');
    spyOn(explorationPlayerStateService, 'initializeExplorationServices');

    let successCallback = () => {};
    explorationPlayerStateService.initExplorationPlayer(successCallback);
    tick();
    expect(
      explorationPlayerStateService.setStoryChapterMode
    ).toHaveBeenCalled();
    expect(
      explorationPlayerStateService.initializeExplorationServices
    ).toHaveBeenCalled();
  }));

  it('should intialize question player', () => {
    spyOn(playerTranscriptService, 'init');
    spyOn(explorationPlayerStateService, 'initQuestionPlayer');
    let successCallback = () => {};
    let errorCallback = () => {};
    explorationPlayerStateService.initializeQuestionPlayer(
      {
        skillList: [],
        questionCount: 1,
        questionsSortedByDifficulty: true,
      },
      successCallback,
      errorCallback
    );
  });

  it('should intialize diagnostic test player', () => {
    spyOn(diagnosticTestPlayerEngineService, 'init');
    let successCallback = () => {};
    let topicIdToPrerequisiteTopicIds = {
      topicId1: [],
      topicId2: ['topicId1'],
      topicId3: ['topicId2'],
    };

    let diagnosticTestTopicTrackerModel = new DiagnosticTestTopicTrackerModel(
      topicIdToPrerequisiteTopicIds
    );

    explorationPlayerStateService.initializeDiagnosticPlayer(
      diagnosticTestTopicTrackerModel,
      successCallback
    );

    expect(diagnosticTestPlayerEngineService.init).toHaveBeenCalled();
  });

  it('should get current engine service', () => {
    explorationPlayerStateService.setExplorationMode();
    expect(explorationPlayerStateService.getCurrentEngineService()).toEqual(
      explorationPlayerStateService.currentEngineService
    );
  });

  it('should tell if is in pretest mode', () => {
    explorationPlayerStateService.setPretestMode();
    expect(explorationPlayerStateService.isInPretestMode()).toBeTrue();
  });

  it('should tell if is in question mode', () => {
    explorationPlayerStateService.setQuestionPlayerMode();
    expect(explorationPlayerStateService.isInQuestionMode()).toBeTrue();
  });

  it('should tell if is in diagnostic test player mode', () => {
    explorationPlayerStateService.setDiagnosticTestPlayerMode();
    expect(
      explorationPlayerStateService.isInDiagnosticTestPlayerMode()
    ).toBeTrue();
  });

  it('should tell if the mode can only present isolated questions or not', fakeAsync(() => {
    explorationPlayerStateService.setDiagnosticTestPlayerMode();
    expect(
      explorationPlayerStateService.isPresentingIsolatedQuestions()
    ).toBeTrue();

    explorationPlayerStateService.setExplorationMode();
    expect(
      explorationPlayerStateService.isPresentingIsolatedQuestions()
    ).toBeFalse();

    explorationPlayerStateService.explorationMode = 'invalidMode';
    expect(() => {
      explorationPlayerStateService.isPresentingIsolatedQuestions();
      tick(10);
    }).toThrowError('Invalid mode received: invalidMode.');
  }));

  it('should tell if is in question player mode', () => {
    explorationPlayerStateService.setQuestionPlayerMode();
    expect(explorationPlayerStateService.isInQuestionPlayerMode()).toBeTrue();
  });

  it('should tell if in story chapter mode', () => {
    explorationPlayerStateService.setStoryChapterMode();
    expect(explorationPlayerStateService.isInStoryChapterMode()).toBeTrue();
  });

  it('should move to exploration', () => {
    spyOn(explorationEngineService, 'moveToExploration');
    spyOn(explorationPlayerStateService, 'setStoryChapterMode');
    spyOn(urlService, 'getUrlParams').and.returnValue({
      story_url_fragment: 'fragment',
      node_id: 'id',
    });
    let callback = () => {};
    explorationPlayerStateService.moveToExploration(callback);

    expect(
      explorationPlayerStateService.setStoryChapterMode
    ).toHaveBeenCalled();
    expect(explorationEngineService.moveToExploration).toHaveBeenCalled();
  });

  it('should move to exploration with chapter mode', () => {
    spyOn(explorationEngineService, 'moveToExploration');
    let callback = () => {};
    explorationPlayerStateService.moveToExploration(callback);
    expect(explorationEngineService.moveToExploration).toHaveBeenCalled();
  });

  it('should get language code', () => {
    let languageCode: string = 'test_lang_code';
    spyOn(explorationEngineService, 'getLanguageCode').and.returnValue(
      languageCode
    );
    explorationPlayerStateService.setExplorationMode();
    expect(explorationPlayerStateService.getLanguageCode()).toEqual(
      languageCode
    );
  });

  it('should record new card added', () => {
    explorationPlayerStateService.setExplorationMode();
    spyOn(explorationEngineService, 'recordNewCardAdded');
    explorationPlayerStateService.recordNewCardAdded();
    expect(explorationEngineService.recordNewCardAdded).toHaveBeenCalled();
  });

  it('should test getters', () => {
    expect(
      explorationPlayerStateService.onTotalQuestionsReceived
    ).toBeDefined();
    expect(explorationPlayerStateService.onPlayerStateChange).toBeDefined();
    expect(
      explorationPlayerStateService.onOppiaFeedbackAvailable
    ).toBeDefined();
  });

  it(
    'should set exploration version from url if the url' +
      'has exploration context when initialized',
    () => {
      // Here exploration context consists of 'explore', 'create',
      // 'skill_editor' and 'embed'.
      spyOn(urlService, 'getPathname').and.returnValue('/create/in/path/name');
      spyOn(urlService, 'getExplorationVersionFromUrl').and.returnValue(2);

      explorationPlayerStateService.version = null;

      explorationPlayerStateService.init();
      expect(explorationPlayerStateService.version).toBe(2);
    }
  );

  it(
    'should set exploration version to default value if the url' +
      'does not have exploration context when initialized',
    () => {
      // Here default value is 1.
      spyOn(urlService, 'getPathname').and.returnValue(
        '/create_is_not/in/path/name'
      );

      explorationPlayerStateService.version = null;

      explorationPlayerStateService.init();
      expect(explorationPlayerStateService.version).toBe(1);
    }
  );

  it('should tell if logged out learner progress is tracked', () => {
    expect(
      explorationPlayerStateService.isLoggedOutLearnerProgressTracked()
    ).toBeFalse();
    explorationPlayerStateService.trackLoggedOutLearnerProgress();
    expect(
      explorationPlayerStateService.isLoggedOutLearnerProgressTracked()
    ).toBeTrue();
  });

  it('should set unique progress URL id correctly', fakeAsync(() => {
    spyOn(
      editableExplorationBackendApiService,
      'recordProgressAndFetchUniqueProgressIdOfLoggedOutLearner'
    ).and.returnValue(
      Promise.resolve({
        unique_progress_url_id: '123456',
      })
    );
    expect(explorationPlayerStateService.getUniqueProgressUrlId()).toBeNull();
    explorationPlayerStateService.setLastCompletedCheckpoint('abc');
    explorationPlayerStateService.setUniqueProgressUrlId();
    tick(100);
    expect(explorationPlayerStateService.getUniqueProgressUrlId()).toEqual(
      '123456'
    );
  }));
});
