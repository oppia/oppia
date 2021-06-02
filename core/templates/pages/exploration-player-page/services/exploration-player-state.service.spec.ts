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

import { fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { EditableExplorationBackendApiService }
  from 'domain/exploration/editable-exploration-backend-api.service';
import { FetchExplorationBackendResponse, ReadOnlyExplorationBackendApiService }
  from 'domain/exploration/read-only-exploration-backend-api.service';
import { PretestQuestionBackendApiService }
  from 'domain/question/pretest-question-backend-api.service';
import { QuestionBackendApiService } from 'domain/question/question-backend-api.service';
import { QuestionBackendDict } from 'domain/question/QuestionObjectFactory';
import { ContextService } from 'services/context.service';
import { UrlService } from 'services/contextual/url.service';
import { ExplorationFeatures, ExplorationFeaturesBackendApiService }
  from 'services/exploration-features-backend-api.service';
import { ExplorationFeaturesService } from 'services/exploration-features.service';
import { PlaythroughService } from 'services/playthrough.service';
import { ExplorationPlayerConstants } from '../exploration-player-page.constants';
import { ExplorationEngineService } from './exploration-engine.service';
import { ExplorationPlayerStateService } from './exploration-player-state.service';
import { NumberAttemptsService } from './number-attempts.service';
import { PlayerCorrectnessFeedbackEnabledService }
  from './player-correctness-feedback-enabled.service';
import { PlayerTranscriptService } from './player-transcript.service';
import { QuestionPlayerEngineService } from './question-player-engine.service';
import { StatsReportingService } from './stats-reporting.service';

describe('Exploration Player State Service', () => {
  let explorationPlayerStateService: ExplorationPlayerStateService;
  let playerTranscriptService: PlayerTranscriptService;
  let statsReportingService: StatsReportingService;
  let playthroughService: PlaythroughService;
  let playerCorrectnessFeedbackEnabledService:
    PlayerCorrectnessFeedbackEnabledService;
  let explorationEngineService: ExplorationEngineService;
  let questionPlayerEngineService: QuestionPlayerEngineService;
  let editableExplorationBackendApiService:
    EditableExplorationBackendApiService;
  let explorationFeaturesBackendApiService:
  ExplorationFeaturesBackendApiService;
  let explorationFeaturesService: ExplorationFeaturesService;
  let numberAttemptsService: NumberAttemptsService;
  let questionBackendApiService: QuestionBackendApiService;
  let pretestQuestionBackendApiService:
    PretestQuestionBackendApiService;
  let urlService: UrlService;

  let returnDict = {
    can_edit: true,
    exploration: {
      init_state_name: 'state_name',
      param_changes: [],
      param_specs: {},
      states: {},
      title: '',
      language_code: '',
      objective: '',
      correctness_feedback_enabled: false
    },
    exploration_id: 'test_id',
    is_logged_in: true,
    session_id: 'test_session',
    version: 1,
    preferred_audio_language_code: 'en',
    preferred_language_codes: [],
    auto_tts_enabled: false,
    correctness_feedback_enabled: true,
    record_playthrough_probability: 1
  };

  let questionBackendDict: QuestionBackendDict = {
    id: '',
    question_state_data: null,
    question_state_data_schema_version: 2,
    language_code: '',
    version: 1,
    linked_skill_ids: [],
    inapplicable_skill_misconception_ids: []
  };

  class MockUrlService {
    getCollectionIdFromExplorationUrl(): string {
      return '';
    }

    getExplorationVersionFromUrl(): string {
      return null;
    }

    getStoryUrlFragmentFromLearnerUrl(): string {
      return '1';
    }

    getUrlParams(): object {
      return {};
    }

    getPathname(): string {
      return '/no_skill_editor/in/path/name';
    }
  }

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
    async loadLatestExplorationAsync(explorationId: string):
    Promise<FetchExplorationBackendResponse> {
      return Promise.resolve(returnDict);
    }

    async loadExplorationAsync(explorationId: string, version: number):
    Promise<FetchExplorationBackendResponse> {
      return Promise.resolve(returnDict);
    }
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [
        ExplorationPlayerStateService,
        PlayerTranscriptService,
        StatsReportingService,
        {
          provide: ContextService,
          useClass: MockContextService
        },
        {
          provide: UrlService,
          useClass: MockUrlService
        },
        {
          provide: ReadOnlyExplorationBackendApiService,
          useClass: MockReadOnlyExplorationBackendApiService
        }
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    explorationPlayerStateService = TestBed
      .inject(ExplorationPlayerStateService);
    playerTranscriptService = TestBed.inject(PlayerTranscriptService);
    playerTranscriptService = (playerTranscriptService as unknown) as
      jasmine.SpyObj<PlayerTranscriptService>;
    statsReportingService = TestBed.inject(StatsReportingService);
    statsReportingService = (statsReportingService as unknown) as
      jasmine.SpyObj<StatsReportingService>;
    playthroughService = TestBed.inject(PlaythroughService);
    playthroughService = (playthroughService as unknown) as
      jasmine.SpyObj<PlaythroughService>;
    playerCorrectnessFeedbackEnabledService = TestBed.inject(
      PlayerCorrectnessFeedbackEnabledService);
    playerCorrectnessFeedbackEnabledService = (
      playerCorrectnessFeedbackEnabledService as unknown) as
      jasmine.SpyObj<PlayerCorrectnessFeedbackEnabledService>;
    explorationEngineService = TestBed.inject(ExplorationEngineService);
    explorationEngineService = (explorationEngineService as unknown) as
      jasmine.SpyObj<ExplorationEngineService>;
    questionPlayerEngineService = TestBed.inject(QuestionPlayerEngineService);
    questionPlayerEngineService = (questionPlayerEngineService as unknown) as
      jasmine.SpyObj<QuestionPlayerEngineService>;
    editableExplorationBackendApiService = TestBed.inject(
      EditableExplorationBackendApiService);
    editableExplorationBackendApiService = (
      editableExplorationBackendApiService as unknown) as
      jasmine.SpyObj<EditableExplorationBackendApiService>;
    explorationFeaturesBackendApiService = TestBed.inject(
      ExplorationFeaturesBackendApiService);
    explorationFeaturesBackendApiService = (
      explorationFeaturesBackendApiService as unknown) as
      jasmine.SpyObj<ExplorationFeaturesBackendApiService>;
    explorationFeaturesService = TestBed.inject(ExplorationFeaturesService);
    explorationFeaturesService = (
      explorationFeaturesService as unknown) as
      jasmine.SpyObj<ExplorationFeaturesService>;
    numberAttemptsService = TestBed.inject(NumberAttemptsService);
    numberAttemptsService = (
      numberAttemptsService as unknown) as
      jasmine.SpyObj<NumberAttemptsService>;
    questionBackendApiService = TestBed.inject(QuestionBackendApiService);
    questionBackendApiService = (
      questionBackendApiService as unknown) as
      jasmine.SpyObj<QuestionBackendApiService>;
    pretestQuestionBackendApiService = TestBed.inject(
      PretestQuestionBackendApiService);
    pretestQuestionBackendApiService = (
      pretestQuestionBackendApiService as unknown) as
      jasmine.SpyObj<PretestQuestionBackendApiService>;
    urlService = (TestBed.inject(UrlService) as unknown) as
      jasmine.SpyObj<UrlService>;
  });

  it('should properly initialize player', () => {
    spyOn(playerTranscriptService, 'init');
    spyOn(explorationPlayerStateService, 'initExplorationPreviewPlayer');
    let callback = () => {};

    explorationPlayerStateService.editorPreviewMode = true;
    explorationPlayerStateService.initializePlayer(callback);
    expect(playerTranscriptService.init).toHaveBeenCalled();
    expect(explorationPlayerStateService.initExplorationPreviewPlayer)
      .toHaveBeenCalledWith(callback);
    explorationPlayerStateService.editorPreviewMode = false;
    explorationPlayerStateService.initializePlayer(callback);
    expect(playerTranscriptService.init).toHaveBeenCalled();
    expect(explorationPlayerStateService.initExplorationPreviewPlayer)
      .toHaveBeenCalledWith(callback);
  });

  it('should initialize exploration services', () => {
    spyOn(statsReportingService, 'initSession');
    spyOn(playthroughService, 'initSession');
    spyOn(playerCorrectnessFeedbackEnabledService, 'init');
    spyOn(explorationEngineService, 'init');

    explorationPlayerStateService.initializeExplorationServices(
      returnDict, false, () => {});

    expect(statsReportingService.initSession).toHaveBeenCalled();
    expect(playthroughService.initSession).toHaveBeenCalled();
    expect(playerCorrectnessFeedbackEnabledService.init).toHaveBeenCalled();
    expect(explorationEngineService.init).toHaveBeenCalled();
  });

  it('should initialize pretest services', () => {
    spyOn(playerCorrectnessFeedbackEnabledService, 'init');
    spyOn(questionPlayerEngineService, 'init');
    let pretestQuestionDicts = [];
    let callback = () => {};

    explorationPlayerStateService.initializePretestServices(
      pretestQuestionDicts, callback);
    expect(playerCorrectnessFeedbackEnabledService.init)
      .toHaveBeenCalledWith(true);
    expect(questionPlayerEngineService.init).toHaveBeenCalled();
  });

  it('should initialize question player services', () => {
    spyOn(playerCorrectnessFeedbackEnabledService, 'init');
    spyOn(questionPlayerEngineService, 'init');
    let questions = [];
    let successCallback = () => {};
    let errorCallback = () => {};

    explorationPlayerStateService.initializeQuestionPlayerServices(
      questions, successCallback, errorCallback);

    expect(playerCorrectnessFeedbackEnabledService.init)
      .toHaveBeenCalledWith(true);
    expect(questionPlayerEngineService.init).toHaveBeenCalledWith(
      questions, successCallback, errorCallback);
  });

  it('should set exploration mode', () => {
    explorationPlayerStateService.setExplorationMode();
    expect(explorationPlayerStateService.explorationMode).toEqual(
      ExplorationPlayerConstants
        .EXPLORATION_MODE.EXPLORATION);
    expect(explorationPlayerStateService.currentEngineService)
      .toEqual(explorationEngineService);
  });

  it('should set pretest mode', () => {
    explorationPlayerStateService.setPretestMode();
    expect(explorationPlayerStateService.explorationMode).toEqual(
      ExplorationPlayerConstants
        .EXPLORATION_MODE.PRETEST);
    expect(explorationPlayerStateService.currentEngineService)
      .toEqual(questionPlayerEngineService);
  });

  it('should set question player mode', () => {
    explorationPlayerStateService.setQuestionPlayerMode();
    expect(explorationPlayerStateService.explorationMode).toEqual(
      ExplorationPlayerConstants
        .EXPLORATION_MODE.QUESTION_PLAYER);
    expect(explorationPlayerStateService.currentEngineService)
      .toEqual(questionPlayerEngineService);
  });

  it('should set story chapter mode', () => {
    explorationPlayerStateService.setStoryChapterMode();
    expect(explorationPlayerStateService.explorationMode).toEqual(
      ExplorationPlayerConstants
        .EXPLORATION_MODE.STORY_CHAPTER);
    expect(explorationPlayerStateService.currentEngineService)
      .toEqual(explorationEngineService);
  });

  it('should init exploration preview player', fakeAsync(() => {
    spyOn(explorationPlayerStateService, 'setExplorationMode');
    spyOn(
      editableExplorationBackendApiService, 'fetchApplyDraftExplorationAsync')
      .and.returnValue(Promise.resolve({
        correctness_feedback_enabled: false,
        draft_changes: [],
        is_version_of_draft_valid: true,
        init_state_name: '',
        param_changes: [],
        param_specs: null,
        states: null,
        title: '',
        language_code: ''
      }));
    spyOn(explorationFeaturesBackendApiService, 'fetchExplorationFeaturesAsync')
      .and.returnValue(Promise.resolve({
        isExplorationWhitelisted: true,
        alwaysAskLearnersForAnswerDetails: false
      }));
    spyOn(explorationFeaturesService, 'init');
    spyOn(explorationEngineService, 'init');
    spyOn(playerCorrectnessFeedbackEnabledService, 'init');
    spyOn(numberAttemptsService, 'reset');

    explorationPlayerStateService.initExplorationPreviewPlayer(() => {});
    tick();

    expect(explorationFeaturesService.init).toHaveBeenCalled();
    expect(explorationEngineService.init).toHaveBeenCalled();
    expect(playerCorrectnessFeedbackEnabledService.init).toHaveBeenCalled();
    expect(numberAttemptsService.reset).toHaveBeenCalled();
  }));

  it('should init question player', fakeAsync(() => {
    spyOn(explorationPlayerStateService, 'setQuestionPlayerMode');
    spyOn(questionBackendApiService, 'fetchQuestionsAsync')
      .and.returnValue(Promise.resolve([questionBackendDict]));
    spyOn(explorationPlayerStateService.onTotalQuestionsReceived, 'emit');
    spyOn(explorationPlayerStateService, 'initializeQuestionPlayerServices');

    let successCallback = () => {};
    let errorCallback = () => {};
    explorationPlayerStateService.initQuestionPlayer({
      skillList: [],
      questionCount: 1,
      questionsSortedByDifficulty: true
    }, successCallback, errorCallback);
    tick();

    expect(
      explorationPlayerStateService
        .onTotalQuestionsReceived.emit)
      .toHaveBeenCalled();
    expect(explorationPlayerStateService.initializeQuestionPlayerServices)
      .toHaveBeenCalled();
  }));

  it('should init exploration player', fakeAsync(() => {
    let explorationFeatures: ExplorationFeatures = {
      isExplorationWhitelisted: true,
      alwaysAskLearnersForAnswerDetails: false
    };
    spyOn(explorationFeaturesBackendApiService, 'fetchExplorationFeaturesAsync')
      .and.returnValue(Promise.resolve(explorationFeatures));
    spyOn(pretestQuestionBackendApiService, 'fetchPretestQuestionsAsync')
      .and.returnValue(Promise.resolve([questionBackendDict]));
    spyOn(explorationFeaturesService, 'init');
    spyOn(explorationPlayerStateService, 'initializePretestServices');
    spyOn(explorationPlayerStateService, 'setPretestMode');
    spyOn(explorationPlayerStateService, 'initializeExplorationServices');

    let successCallback = () => {};
    explorationPlayerStateService.initExplorationPlayer(successCallback);
    tick();
    expect(explorationFeaturesService.init).toHaveBeenCalled();
    expect(explorationPlayerStateService.setPretestMode).toHaveBeenCalled();
    expect(explorationPlayerStateService.initializeExplorationServices)
      .toHaveBeenCalled();
    expect(explorationPlayerStateService.initializePretestServices)
      .toHaveBeenCalled();
  }));

  it('should init exploration player without pretests', fakeAsync(() => {
    let explorationFeatures: ExplorationFeatures = {
      isExplorationWhitelisted: true,
      alwaysAskLearnersForAnswerDetails: false
    };
    spyOn(explorationFeaturesBackendApiService, 'fetchExplorationFeaturesAsync')
      .and.returnValue(Promise.resolve(explorationFeatures));
    spyOn(pretestQuestionBackendApiService, 'fetchPretestQuestionsAsync')
      .and.returnValue(Promise.resolve([]));
    spyOn(explorationFeaturesService, 'init');
    spyOn(explorationPlayerStateService, 'setExplorationMode');
    spyOn(explorationPlayerStateService, 'initializeExplorationServices');

    let successCallback = () => {};
    explorationPlayerStateService.initExplorationPlayer(successCallback);
    tick();
    expect(explorationPlayerStateService.setExplorationMode).toHaveBeenCalled();
    expect(explorationPlayerStateService.initializeExplorationServices)
      .toHaveBeenCalled();
  }));

  it('should init exploration player with story chapter mode', fakeAsync(() => {
    let explorationFeatures: ExplorationFeatures = {
      isExplorationWhitelisted: true,
      alwaysAskLearnersForAnswerDetails: false
    };
    spyOn(urlService, 'getUrlParams').and.returnValue({
      story_url_fragment: 'fragment',
      node_id: 'id'
    });
    spyOn(
      explorationFeaturesBackendApiService, 'fetchExplorationFeaturesAsync')
      .and.returnValue(Promise.resolve(explorationFeatures));
    spyOn(pretestQuestionBackendApiService, 'fetchPretestQuestionsAsync')
      .and.returnValue(Promise.resolve([]));
    spyOn(explorationFeaturesService, 'init');
    spyOn(explorationPlayerStateService, 'setStoryChapterMode');
    spyOn(explorationPlayerStateService, 'initializeExplorationServices');

    let successCallback = () => {};
    explorationPlayerStateService.initExplorationPlayer(successCallback);
    tick();
    expect(explorationPlayerStateService.setStoryChapterMode)
      .toHaveBeenCalled();
    expect(explorationPlayerStateService.initializeExplorationServices)
      .toHaveBeenCalled();
  }));

  it('should intialize question player', () => {
    spyOn(playerTranscriptService, 'init');
    spyOn(explorationPlayerStateService, 'initQuestionPlayer');
    let successCallback = () => {};
    let errorCallback = () => {};
    explorationPlayerStateService.initializeQuestionPlayer({
      skillList: [],
      questionCount: 1,
      questionsSortedByDifficulty: true
    }, successCallback, errorCallback);
  });

  it('should get current engine service', () => {
    explorationPlayerStateService.setExplorationMode();
    expect(explorationPlayerStateService.getCurrentEngineService())
      .toEqual(explorationPlayerStateService.currentEngineService);
  });

  it('should tell if is in pretest mode', () => {
    explorationPlayerStateService.setPretestMode();
    expect(explorationPlayerStateService.isInPretestMode()).toBeTrue();
  });

  it('should tell if is in question mode', () => {
    explorationPlayerStateService.setQuestionPlayerMode();
    expect(explorationPlayerStateService.isInQuestionMode()).toBeTrue();
  });

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
      node_id: 'id'
    });
    let callback = () => {};
    explorationPlayerStateService.moveToExploration(callback);

    expect(explorationPlayerStateService.setStoryChapterMode)
      .toHaveBeenCalled();
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
    spyOn(explorationEngineService, 'getLanguageCode')
      .and.returnValue(languageCode);
    explorationPlayerStateService.setExplorationMode();
    expect(explorationPlayerStateService.getLanguageCode())
      .toEqual(languageCode);
  });

  it('should record new card added', () => {
    explorationPlayerStateService.setExplorationMode();
    spyOn(explorationEngineService, 'recordNewCardAdded');
    explorationPlayerStateService.recordNewCardAdded();
    expect(explorationEngineService.recordNewCardAdded).toHaveBeenCalled();
  });

  it('should test getters', () => {
    expect(explorationPlayerStateService.onTotalQuestionsReceived)
      .toBeDefined();
    expect(explorationPlayerStateService.onPlayerStateChange).toBeDefined();
    expect(explorationPlayerStateService.onOppiaFeedbackAvailable)
      .toBeDefined();
  });
});
