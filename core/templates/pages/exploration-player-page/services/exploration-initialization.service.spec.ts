// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for ExplorationInitializationService.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {TestBed, fakeAsync, tick, waitForAsync} from '@angular/core/testing';
import {ExplorationInitializationService} from './exploration-initialization.service';
import {PageContextService} from '../../../services/page-context.service';
import {EditableExplorationBackendApiService} from '../../../domain/exploration/editable-exploration-backend-api.service';
import {ExplorationFeaturesBackendApiService} from '../../../services/exploration-features-backend-api.service';
import {ExplorationFeaturesService} from '../../../services/exploration-features.service';
import {ExplorationEngineService} from './exploration-engine.service';
import {NumberAttemptsService} from './number-attempts.service';
import {PlayerTranscriptService} from './player-transcript.service';
import {UrlService} from '../../../services/contextual/url.service';
import {ExplorationModeService} from './exploration-mode.service';
import {StatsReportingService} from './stats-reporting.service';
import {PlaythroughService} from '../../../services/playthrough.service';
import {
  QuestionObjectFactory,
  QuestionBackendDict,
} from '../../../domain/question/QuestionObjectFactory';
import {ReadOnlyExplorationBackendApiService} from '../../../domain/exploration/read-only-exploration-backend-api.service';
import {PretestQuestionBackendApiService} from '../../../domain/question/pretest-question-backend-api.service';
import {CurrentEngineService} from './current-engine.service';
import {QuestionPlayerEngineService} from './question-player-engine.service';

class MockQuestion {
  constructor(private backendDict: QuestionBackendDict) {}
  getId() {
    return this.backendDict.id;
  }
}

describe('ExplorationInitializationService', () => {
  let service: ExplorationInitializationService;
  let pageContextService: jasmine.SpyObj<PageContextService>;
  let editableBackendApi: jasmine.SpyObj<EditableExplorationBackendApiService>;
  let featuresBackendApi: jasmine.SpyObj<ExplorationFeaturesBackendApiService>;
  let explorationFeaturesService: jasmine.SpyObj<ExplorationFeaturesService>;
  let explorationEngineService: jasmine.SpyObj<ExplorationEngineService>;
  let numberAttemptsService: jasmine.SpyObj<NumberAttemptsService>;
  let transcriptService: jasmine.SpyObj<PlayerTranscriptService>;
  let readOnlyExplorationBackendApiService: jasmine.SpyObj<ReadOnlyExplorationBackendApiService>;
  let pretestQuestionBackendApiService: jasmine.SpyObj<PretestQuestionBackendApiService>;
  let statsReportingService: StatsReportingService;
  let playthroughService: PlaythroughService;
  let urlService: UrlService;
  let explorationModeService: ExplorationModeService;
  let questionPlayerEngineService: jasmine.SpyObj<QuestionPlayerEngineService>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ExplorationInitializationService,
        UrlService,
        ExplorationModeService,
        StatsReportingService,
        PlaythroughService,
        QuestionPlayerEngineService,
        ReadOnlyExplorationBackendApiService,
        PretestQuestionBackendApiService,
        CurrentEngineService,
        {
          provide: QuestionObjectFactory,
          useValue: {
            createFromBackendDict: (dict: QuestionBackendDict) =>
              new MockQuestion(dict),
          },
        },
        {
          provide: PageContextService,
          useValue: jasmine.createSpyObj('PageContextService', [
            'isInExplorationEditorPage',
            'getExplorationId',
            'getExplorationVersion',
            'isInQuestionPlayerMode',
            'getPageContext',
            'setQuestionPlayerIsOpen',
          ]),
        },
        {
          provide: EditableExplorationBackendApiService,
          useValue: jasmine.createSpyObj(
            'EditableExplorationBackendApiService',
            ['fetchApplyDraftExplorationAsync']
          ),
        },
        {
          provide: ExplorationFeaturesBackendApiService,
          useValue: jasmine.createSpyObj(
            'ExplorationFeaturesBackendApiService',
            ['fetchExplorationFeaturesAsync']
          ),
        },
        {
          provide: ExplorationFeaturesService,
          useValue: jasmine.createSpyObj('ExplorationFeaturesService', [
            'init',
          ]),
        },
        {
          provide: ExplorationEngineService,
          useValue: jasmine.createSpyObj('ExplorationEngineService', ['init']),
        },
        {
          provide: NumberAttemptsService,
          useValue: jasmine.createSpyObj('NumberAttemptsService', ['reset']),
        },
        {
          provide: PlayerTranscriptService,
          useValue: jasmine.createSpyObj('PlayerTranscriptService', ['init']),
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    service = TestBed.inject(ExplorationInitializationService);
    statsReportingService = TestBed.inject(StatsReportingService);
    questionPlayerEngineService = TestBed.inject(
      QuestionPlayerEngineService
    ) as jasmine.SpyObj<QuestionPlayerEngineService>;
    explorationModeService = TestBed.inject(ExplorationModeService);
    playthroughService = TestBed.inject(PlaythroughService);
    urlService = TestBed.inject(UrlService);
    pageContextService = TestBed.inject(
      PageContextService
    ) as jasmine.SpyObj<PageContextService>;
    editableBackendApi = TestBed.inject(
      EditableExplorationBackendApiService
    ) as jasmine.SpyObj<EditableExplorationBackendApiService>;
    featuresBackendApi = TestBed.inject(
      ExplorationFeaturesBackendApiService
    ) as jasmine.SpyObj<ExplorationFeaturesBackendApiService>;
    explorationFeaturesService = TestBed.inject(
      ExplorationFeaturesService
    ) as jasmine.SpyObj<ExplorationFeaturesService>;
    explorationEngineService = TestBed.inject(
      ExplorationEngineService
    ) as jasmine.SpyObj<ExplorationEngineService>;
    numberAttemptsService = TestBed.inject(
      NumberAttemptsService
    ) as jasmine.SpyObj<NumberAttemptsService>;
    transcriptService = TestBed.inject(
      PlayerTranscriptService
    ) as jasmine.SpyObj<PlayerTranscriptService>;
    readOnlyExplorationBackendApiService = TestBed.inject(
      ReadOnlyExplorationBackendApiService
    ) as jasmine.SpyObj<ReadOnlyExplorationBackendApiService>;
    pretestQuestionBackendApiService = TestBed.inject(
      PretestQuestionBackendApiService
    ) as jasmine.SpyObj<PretestQuestionBackendApiService>;
  });

  it('should initialize preview player when on exploration editor page', fakeAsync(() => {
    pageContextService.isInExplorationEditorPage.and.returnValue(true);
    pageContextService.getExplorationId.and.returnValue('exp123');

    editableBackendApi.fetchApplyDraftExplorationAsync.and.returnValue(
      Promise.resolve({param_changes: [], states: {}})
    );
    featuresBackendApi.fetchExplorationFeaturesAsync.and.returnValue(
      Promise.resolve({})
    );

    const callback = jasmine.createSpy('callback');
    service.initializePlayer(callback);

    expect(transcriptService.init).toHaveBeenCalled();

    tick();

    expect(explorationFeaturesService.init).toHaveBeenCalledWith(
      {param_changes: [], states: {}},
      {}
    );
    expect(explorationEngineService.init).toHaveBeenCalledWith(
      {param_changes: [], states: {}},
      null,
      null,
      null,
      [],
      [],
      callback
    );
    expect(numberAttemptsService.reset).toHaveBeenCalled();
  }));

  it('should initialize player in story mode when story_url_fragment and node_id are in URL', fakeAsync(() => {
    pageContextService.isInExplorationEditorPage.and.returnValue(false);
    pageContextService.getExplorationId.and.returnValue('exp123');
    pageContextService.getExplorationVersion.and.returnValue(null);

    const mockExplorationData = {
      exploration: {
        title: 'Story Mode Exploration',
        init_state_name: 'Intro',
        param_changes: [],
        param_specs: {},
        states: {},
        language_code: 'en',
        next_content_id_index: 0,
      },
      version: 1,
      session_id: 'session_story',
      auto_tts_enabled: true,
      preferred_audio_language_code: null,
      preferred_language_codes: [],
      displayable_language_codes: [],
      draft_change_list_id: 1,
      record_playthrough_probability: 1.0,
      exploration_metadata: {},
    };

    spyOn(
      readOnlyExplorationBackendApiService,
      'loadLatestExplorationAsync'
    ).and.returnValue(Promise.resolve(mockExplorationData));
    spyOn(
      pretestQuestionBackendApiService,
      'fetchPretestQuestionsAsync'
    ).and.returnValue(Promise.resolve([]));
    featuresBackendApi.fetchExplorationFeaturesAsync.and.returnValue(
      Promise.resolve({})
    );

    spyOn(urlService, 'getUrlParams').and.returnValue({
      story_url_fragment: 'math',
      node_id: 'node_1',
    });

    spyOn(statsReportingService, 'initSession');
    spyOn(playthroughService, 'initSession');
    spyOn(explorationModeService, 'setStoryChapterMode');

    const callback = jasmine.createSpy('callback');
    service.initializePlayer(callback);

    tick();

    expect(explorationModeService.setStoryChapterMode).toHaveBeenCalled();
    expect(explorationEngineService.init).toHaveBeenCalledWith(
      jasmine.anything(),
      1,
      null,
      true,
      [],
      [],
      callback
    );
  }));

  it('should initialize player in pretest mode when pretest questions are available', fakeAsync(() => {
    pageContextService.isInExplorationEditorPage.and.returnValue(false);
    pageContextService.getExplorationId.and.returnValue('exp123');
    pageContextService.getExplorationVersion.and.returnValue(null);

    spyOn(urlService, 'getStoryUrlFragmentFromLearnerUrl').and.returnValue(
      'math'
    );
    spyOn(urlService, 'getUrlParams').and.returnValue({});

    const mockExplorationData = {
      exploration: {
        title: 'Pretest Exploration',
        init_state_name: 'Intro',
        param_changes: [],
        param_specs: {},
        states: {},
        language_code: 'en',
        next_content_id_index: 0,
      },
      version: 1,
      session_id: 'session_pretest',
      auto_tts_enabled: true,
      preferred_audio_language_code: null,
      preferred_language_codes: [],
      displayable_language_codes: [],
      draft_change_list_id: 1,
      record_playthrough_probability: 1.0,
      exploration_metadata: {},
    };

    const sampleQuestionsBackendDict: QuestionBackendDict[] = [
      {
        id: 'question_1',
        question_state_data: {
          classifier_model_id: null,
          content: {content_id: 'content_1', html: '<p>What is 2 + 2?</p>'},
          interaction: {
            answer_groups: [],
            confirmed_unclassified_answers: [],
            customization_args: {},
            default_outcome: null,
            hints: [],
            id: 'NumericInput',
            solution: null,
          },
          param_changes: [],
          recorded_voiceovers: {voiceovers_mapping: {}},
          solicit_answer_details: false,
          written_translations: {translations_mapping: {}},
        },
        question_state_data_schema_version: 50,
        language_code: 'en',
        version: 1,
        linked_skill_ids: ['math_basic'],
        inapplicable_skill_misconception_ids: [],
        next_content_id_index: 1,
      },
    ];

    spyOn(
      readOnlyExplorationBackendApiService,
      'loadLatestExplorationAsync'
    ).and.returnValue(Promise.resolve(mockExplorationData));

    spyOn(
      pretestQuestionBackendApiService,
      'fetchPretestQuestionsAsync'
    ).and.returnValue(Promise.resolve(sampleQuestionsBackendDict));

    featuresBackendApi.fetchExplorationFeaturesAsync.and.returnValue(
      Promise.resolve({})
    );

    spyOn(statsReportingService, 'initSession');
    spyOn(playthroughService, 'initSession');
    spyOn(explorationModeService, 'setPretestMode');
    spyOn(questionPlayerEngineService, 'initializePretestServices');

    const callback = jasmine.createSpy('callback');
    service.initializePlayer(callback);

    tick();

    expect(explorationModeService.setPretestMode).toHaveBeenCalled();
    expect(
      questionPlayerEngineService.initializePretestServices
    ).toHaveBeenCalledWith(jasmine.any(Array), callback);
  }));

  it('should initialize player when not on exploration editor page', fakeAsync(() => {
    pageContextService.isInExplorationEditorPage.and.returnValue(false);
    pageContextService.getExplorationId.and.returnValue('exp123');
    pageContextService.getExplorationVersion.and.returnValue(null);

    spyOn(urlService, 'getCollectionIdFromExplorationUrl').and.returnValue(
      'col_123'
    );

    const mockExplorationData = {
      exploration: {
        title: 'Test Exploration',
        init_state_name: 'Intro',
        param_changes: [],
        param_specs: {},
        states: {},
        language_code: 'en',
        next_content_id_index: 0,
      },
      version: 1,
      session_id: 'session_123',
      auto_tts_enabled: true,
      preferred_audio_language_code: null,
      preferred_language_codes: [],
      displayable_language_codes: [],
      draft_change_list_id: 1,
      record_playthrough_probability: 1.0,
      exploration_metadata: {},
    };

    spyOn(
      readOnlyExplorationBackendApiService,
      'loadLatestExplorationAsync'
    ).and.returnValue(Promise.resolve(mockExplorationData));
    spyOn(
      pretestQuestionBackendApiService,
      'fetchPretestQuestionsAsync'
    ).and.returnValue(Promise.resolve([]));
    featuresBackendApi.fetchExplorationFeaturesAsync.and.returnValue(
      Promise.resolve({})
    );

    spyOn(statsReportingService, 'initSession');
    spyOn(playthroughService, 'initSession');

    const callback = jasmine.createSpy('callback');
    service.initializePlayer(callback);

    expect(transcriptService.init).toHaveBeenCalled();

    tick();

    expect(explorationFeaturesService.init).toHaveBeenCalledWith(
      mockExplorationData.exploration,
      {}
    );

    expect(statsReportingService.initSession).toHaveBeenCalledWith(
      'exp123',
      'Test Exploration',
      1,
      'session_123',
      'col_123'
    );

    expect(explorationEngineService.init).toHaveBeenCalledWith(
      jasmine.objectContaining({
        title: 'Test Exploration',
        states: {},
      }),
      1,
      null,
      true,
      [],
      [],
      callback
    );
  }));
});
