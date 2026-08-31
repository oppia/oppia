// Copyright 2021 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS-IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit tests for the exploration engine service.
 */

// @ts-nocheck

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {fakeAsync, TestBed, tick} from '@angular/core/testing';
import {TranslateService} from '@ngx-translate/core';
import {MockTranslateService} from 'components/forms/schema-based-editors/integration-tests/schema-based-editors.integration.spec';
import {AnswerClassificationResult} from 'domain/classifier/answer-classification-result.model';
import {Interaction} from 'domain/exploration/interaction.model';
import {
  Exploration,
  ExplorationBackendDict,
} from '../../../domain/exploration/exploration.model';
import {Outcome} from '../../../domain/exploration/outcome.model';
import {SubtitledUnicode} from 'domain/exploration/subtitled-unicode.model';
import {SubtitledHtml} from 'domain/exploration/subtitled-html.model';
import {
  ParamChangeBackendDict,
  ParamChange,
} from 'domain/exploration/param-change.model';
import {
  FetchExplorationBackendResponse,
  ReadOnlyExplorationBackendApiService,
} from 'domain/exploration/read-only-exploration-backend-api.service';
import {StateCard} from 'domain/state_card/state-card.model';
import {State} from 'domain/state/state.model';
import {ExpressionInterpolationService} from 'expressions/expression-interpolation.service';
import {AlertsService} from 'services/alerts.service';
import {PageContextService} from 'services/page-context.service';
import {UrlService} from 'services/contextual/url.service';
import {
  AnswerClassificationService,
  InteractionRulesService,
} from './answer-classification.service';
import {AudioPreloaderService} from './audio-preloader.service';
import {ContentTranslationLanguageService} from './content-translation-language.service';
import {ExplorationEngineService} from './exploration-engine.service';
import {ImagePreloaderService} from './image-preloader.service';
import {LearnerParamsService} from './learner-params.service';
import {PlayerTranscriptService} from './player-transcript.service';
import {StatsReportingService} from './stats-reporting.service';
import {PlatformFeatureService} from 'services/platform-feature.service';
import {ContentTranslationManagerService} from './content-translation-manager.service';
import {ComputeGraphService} from 'services/compute-graph.service';
import {StateGraphLayoutService} from 'components/graph-services/graph-layout.service';
import {ExplorationHtmlFormatterService} from 'services/exploration-html-formatter.service';
import cloneDeep from 'lodash/cloneDeep';

class MockPlatformFeatureService {
  status = {
    NewLessonPlayer: {
      isEnabled: false,
    },
  };
}

describe('Exploration engine service ', () => {
  let alertsService: AlertsService;
  let answerClassificationService: AnswerClassificationService;
  let answerClassificationResult: AnswerClassificationResult;
  let audioPreloaderService: AudioPreloaderService;
  let contentTranslationManagerService: ContentTranslationManagerService;
  let pageContextService: PageContextService;
  let contentTranslationLanguageService: ContentTranslationLanguageService;
  let expressionInterpolationService: ExpressionInterpolationService;
  let explorationEngineService: ExplorationEngineService;
  let imagePreloaderService: ImagePreloaderService;
  let learnerParamsService: LearnerParamsService;
  let mockPlatformFeatureService = new MockPlatformFeatureService();
  let playerTranscriptService: PlayerTranscriptService;
  let readOnlyExplorationBackendApiService: ReadOnlyExplorationBackendApiService;
  let computeGraphService: ComputeGraphService;
  let stateGraphLayoutService: StateGraphLayoutService;
  let statsReportingService: StatsReportingService;
  let urlService: UrlService;
  let textInputService: jasmine.SpyObj<InteractionRulesService>;
  let translateService: TranslateService;
  let explorationHtmlFormatterService: ExplorationHtmlFormatterService;
  let explorationDict: ExplorationBackendDict;
  let paramChangeDict: ParamChangeBackendDict;
  let explorationBackendResponse: FetchExplorationBackendResponse;

  beforeEach(() => {
    explorationDict = {
      states: {
        Start: {
          classifier_model_id: null,
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
                  dest_if_really_stuck: 'Mid',
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
              dest_if_really_stuck: 'Mid',
              dest: 'Start',
            },
          },
          param_changes: [],
          card_is_checkpoint: true,
          linked_skill_id: null,
          inapplicable_skill_misconception_ids: [],
          content: {
            content_id: 'content',
            html: '<p>First Question</p>',
          },
        },
        End: {
          classifier_model_id: null,
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
          inapplicable_skill_misconception_ids: [],
          content: {
            content_id: 'content',
            html: 'Congratulations, you have finished!',
          },
        },
        Mid: {
          classifier_model_id: null,
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
                  dest_if_really_stuck: 'Mid',
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
              dest_if_really_stuck: 'Mid',
              dest: 'Mid',
            },
          },
          param_changes: [],
          card_is_checkpoint: false,
          linked_skill_id: null,
          inapplicable_skill_misconception_ids: [],
          content: {
            content_id: 'content',
            html: '<p>Second Question</p>',
          },
        },
      },
      auto_tts_enabled: true,
      version: 2,
      param_specs: {
        x: {
          obj_type: 'UnicodeString',
        },
        y: {
          obj_type: 'UnicodeString',
        },
      },
      param_changes: [],
      title: 'My Exploration Title',
      draft_change_list_id: 9,
      is_version_of_draft_valid: false,
      language_code: 'en',
      init_state_name: 'Start',
      next_content_id_index: 5,
      draft_changes: [],
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
    };

    paramChangeDict = {
      customization_args: {
        parse_with_jinja: false,
        value: 'val',
        list_of_values: ['val1, val2'],
      },
      generator_id: 'Copier',
      name: 'answer',
    };

    explorationBackendResponse = {
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
        next_content_id_index: 1,
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

    answerClassificationResult = new AnswerClassificationResult(
      new Outcome(
        'Mid',
        'Mid',
        new SubtitledHtml('Answer is correct!', 'feedback_1'),
        true,
        [],
        null,
        null
      ),
      1,
      0,
      'default_outcome'
    );
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: TranslateService,
          useClass: MockTranslateService,
        },
        {
          provide: PlatformFeatureService,
          useValue: mockPlatformFeatureService,
        },
      ],
    });

    alertsService = TestBed.inject(AlertsService);
    contentTranslationManagerService = TestBed.inject(
      ContentTranslationManagerService
    );
    answerClassificationService = TestBed.inject(AnswerClassificationService);
    audioPreloaderService = TestBed.inject(AudioPreloaderService);
    pageContextService = TestBed.inject(PageContextService);
    computeGraphService = TestBed.inject(ComputeGraphService);
    stateGraphLayoutService = TestBed.inject(StateGraphLayoutService);
    contentTranslationLanguageService = TestBed.inject(
      ContentTranslationLanguageService
    );
    expressionInterpolationService = TestBed.inject(
      ExpressionInterpolationService
    );
    imagePreloaderService = TestBed.inject(ImagePreloaderService);
    learnerParamsService = TestBed.inject(LearnerParamsService);
    playerTranscriptService = TestBed.inject(PlayerTranscriptService);
    readOnlyExplorationBackendApiService = TestBed.inject(
      ReadOnlyExplorationBackendApiService
    );
    statsReportingService = TestBed.inject(StatsReportingService);
    urlService = TestBed.inject(UrlService);
    explorationEngineService = TestBed.inject(ExplorationEngineService);
    textInputService = jasmine.createSpyObj('InteractionRulesService', ['']);
    translateService = TestBed.inject(TranslateService);
    explorationHtmlFormatterService = TestBed.inject(
      ExplorationHtmlFormatterService
    );
  });

  beforeEach(() => {
    spyOn(pageContextService, 'getExplorationId').and.returnValue(
      'explorationId'
    );
    spyOn(urlService, 'getExplorationVersionFromUrl').and.returnValue(2);
    spyOn(contentTranslationLanguageService, 'init').and.returnValue(null);
    spyOn(imagePreloaderService, 'init').and.returnValue(null);
    spyOn(imagePreloaderService, 'kickOffImagePreloader').and.returnValue(null);
    spyOn(audioPreloaderService, 'init').and.returnValue(null);
    spyOn(audioPreloaderService, 'kickOffAudioPreloader').and.returnValue(null);
    spyOn(statsReportingService, 'recordExplorationStarted').and.returnValue(
      null
    );
    spyOn(statsReportingService, 'recordAnswerSubmitted').and.returnValue(null);
    spyOn(statsReportingService, 'recordAnswerSubmitAction').and.returnValue(
      null
    );
    spyOn(expressionInterpolationService, 'processHtml').and.callFake(
      (html: string, envs: Record<string, string>[]) => html
    );
    spyOn(
      readOnlyExplorationBackendApiService,
      'loadExplorationAsync'
    ).and.returnValue(Promise.resolve(explorationBackendResponse));
  });

  it(
    'should load exploration when initialized in ' + 'exploration player page',
    () => {
      let initSuccessCb = jasmine.createSpy('success');

      spyOn(urlService, 'getPathname').and.returnValue('/lesson/123');
      mockPlatformFeatureService.status.NewLessonPlayer.isEnabled = true;
      // Setting exploration player page.
      spyOn(pageContextService, 'isInExplorationEditorPage').and.returnValue(
        false
      );
      spyOn(
        contentTranslationLanguageService,
        'getCurrentContentLanguageCode'
      ).and.returnValue('en');
      spyOn(
        contentTranslationManagerService,
        'displayTranslations'
      ).and.returnValue(null);

      explorationEngineService.init(
        explorationDict,
        1,
        null,
        true,
        ['en'],
        [],
        initSuccessCb
      );

      expect(initSuccessCb).toHaveBeenCalled();
    }
  );

  it('should check new lesson player feature flag is enabled', () => {
    mockPlatformFeatureService.status.NewLessonPlayer.isEnabled = true;
    expect(explorationEngineService.isNewLessonPlayerEnabled()).toBe(true);
  });

  it(
    'should throw error when initialized in exploration' +
      ' player page and version is not set',
    () => {
      const initSuccessCb = jasmine.createSpy('success');

      spyOn(pageContextService, 'isInExplorationEditorPage').and.returnValue(
        false
      );

      expect(() => {
        explorationEngineService.init(
          explorationDict,
          null,
          null,
          true,
          ['en'],
          [],
          initSuccessCb
        );
      }).toThrowError('Exploration version is not set.');
    }
  );

  it(
    'should load exploration when initialized in ' + 'exploration editor page',
    () => {
      let initSuccessCb = jasmine.createSpy('success');
      let paramChanges = ParamChange.createFromBackendDict(paramChangeDict);
      // Setting exploration editor page.
      spyOn(pageContextService, 'isInExplorationEditorPage').and.returnValue(
        true
      );
      spyOn(urlService, 'getPathname').and.returnValue('/create/in/path/name');
      spyOn(pageContextService, 'isInQuestionPlayerMode').and.returnValue(
        false
      );

      // Since the constructor will be automatically called in unit tests, it
      // is hard to test or spy on the constructor. So, we have created a
      // function to manually trigger and tests different edge cases.
      explorationEngineService.setExplorationProperties();

      explorationEngineService.initSettingsFromEditor('Start', [paramChanges]);
      explorationEngineService.init(
        explorationDict,
        1,
        null,
        true,
        ['en'],
        [],
        initSuccessCb
      );

      expect(initSuccessCb).toHaveBeenCalled();
    }
  );

  it('should throw error if contentId is null in initial state when calling init', () => {
    let initSuccessCb = jasmine.createSpy('success');
    spyOn(urlService, 'getPathname').and.returnValue('/lesson/123');
    mockPlatformFeatureService.status.NewLessonPlayer.isEnabled = true;
    spyOn(pageContextService, 'isInExplorationEditorPage').and.returnValue(
      false
    );

    const clonedExplorationDict = cloneDeep(explorationDict);
    clonedExplorationDict.states.Start.content.content_id = null;

    expect(() => {
      explorationEngineService.init(
        clonedExplorationDict,
        1,
        null,
        true,
        ['en'],
        [],
        initSuccessCb
      );
    }).toThrowError('Content id cannot be null.');
    expect(initSuccessCb).not.toHaveBeenCalled();
  });

  it("should throw an error if initial state name is null when calling 'init'", () => {
    const mockExploration = {
      getInitialState: () => ({name: null}),
    };

    spyOn(Exploration, 'createFromBackendDict').and.returnValue(
      mockExploration
    );

    expect(() => {
      explorationEngineService.init(
        explorationDict,
        1,
        null,
        true,
        ['en'],
        [],
        () => {}
      );
    }).toThrowError('Initial state name cannot be null.');
  });

  it("should return the exploration object when calling 'getExploration'", () => {
    let initSuccessCb = jasmine.createSpy('success');
    spyOn(pageContextService, 'isInExplorationEditorPage').and.returnValue(
      false
    );

    explorationEngineService.init(
      explorationDict,
      1,
      null,
      true,
      ['en'],
      [],
      initSuccessCb
    );

    const exploration = explorationEngineService.getExploration();
    expect(exploration).toBeDefined();
    expect(exploration.getInitialState().name).toBe('Start');
  });

  it("should return initial state name when calling 'getInitialStateName'", () => {
    let initSuccessCb = jasmine.createSpy('success');
    spyOn(pageContextService, 'isInExplorationEditorPage').and.returnValue(
      false
    );

    explorationEngineService.init(
      explorationDict,
      1,
      null,
      true,
      ['en'],
      [],
      initSuccessCb
    );
    expect(explorationEngineService.getInitialStateName()).toBe('Start');
  });

  describe('extractDepthGraph and getMaxStateDepth', () => {
    let mockGraphData;
    let mockComputedNodes;

    beforeEach(() => {
      mockGraphData = {
        nodes: [{id: 'Start'}, {id: 'Mid'}, {id: 'End'}],
        links: [
          {source: 'Start', target: 'Mid'},
          {source: 'Mid', target: 'End'},
        ],
        initStateId: 'Start',
        finalStateIds: ['End'],
      };
      mockComputedNodes = [
        {id: 'Start', depth: 0},
        {id: 'Mid', depth: 1},
        {id: 'End', depth: 2},
      ];
      spyOn(explorationEngineService, 'getInitialStateName').and.returnValue(
        'Start'
      );
      spyOn(explorationEngineService, 'getExploration').and.returnValue({
        states: explorationDict.states,
      });
      spyOn(computeGraphService, 'compute').and.returnValue(mockGraphData);
      spyOn(stateGraphLayoutService, 'computeLayout').and.returnValue(
        mockComputedNodes
      );
    });

    it('should extract correct depth graph', () => {
      const depthGraph = explorationEngineService.extractDepthGraph();
      expect(depthGraph).toEqual({
        Start: 0,
        Mid: 1,
        End: 2,
      });
    });

    it('should return correct max state depth', () => {
      const maxDepth = explorationEngineService.getMaxStateDepth();
      expect(maxDepth).toBe(2);
    });

    it('should return 0 if depth graph is empty', () => {
      spyOn(explorationEngineService, 'extractDepthGraph').and.returnValue({});
      const maxDepth = explorationEngineService.getMaxStateDepth();
      expect(maxDepth).toBe(0);
    });

    it('should handle non-consecutive depths', () => {
      spyOn(explorationEngineService, 'extractDepthGraph').and.returnValue({
        Start: 0,
        Mid: 3,
        End: 2,
      });
      const maxDepth = explorationEngineService.getMaxStateDepth();
      expect(maxDepth).toBe(3);
    });

    it('should throw error if interaction for initial state is not defined', () => {
      spyOn(pageContextService, 'isInExplorationEditorPage').and.returnValue(
        false
      );
      explorationEngineService.init(
        explorationDict,
        1,
        null,
        true,
        ['en'],
        [],
        () => {}
      );
      spyOn(
        explorationEngineService.exploration,
        'getInteraction'
      ).and.returnValue(null);
      expect(() => {
        explorationEngineService.loadInitialState(() => {});
      }).toThrowError('Interaction for the initial state is not defined.');
    });
  });

  describe('on submitting answer ', () => {
    beforeEach(() => {
      spyOn(pageContextService, 'isInExplorationEditorPage').and.returnValue(
        false
      );
      spyOn(playerTranscriptService, 'getLastStateName').and.returnValue(
        'Start'
      );
    });

    it(
      'should call success callback if the submitted ' + 'answer is correct',
      () => {
        let initSuccessCb = jasmine.createSpy('success');
        let submitAnswerSuccessCb = jasmine.createSpy('success');
        let answer = 'answer';

        let lastCard = StateCard.createNewCard(
          'Card 1',
          'Content html',
          'Interaction text',
          jasmine.createSpyObj('Interaction', ['']),
          'content_id'
        );

        spyOn(playerTranscriptService, 'getLastCard').and.returnValue(lastCard);
        spyOn(
          answerClassificationService,
          'getMatchingClassificationResult'
        ).and.returnValue(answerClassificationResult);

        explorationEngineService.init(
          explorationDict,
          1,
          null,
          true,
          ['en'],
          [],
          initSuccessCb
        );

        const isAnswerCorrect = explorationEngineService.submitAnswer(
          answer,
          textInputService,
          submitAnswerSuccessCb
        );

        expect(submitAnswerSuccessCb).toHaveBeenCalled();
        expect(isAnswerCorrect).toBe(true);
      }
    );

    it('should show warning if no rule matches the submitted answer', () => {
      const initSuccessCb = jasmine.createSpy('success');
      const submitAnswerSuccessCb = jasmine.createSpy('success');

      answerClassificationResult.ruleIndex = null;
      answerClassificationResult.answerGroupIndex = 0;

      spyOn(playerTranscriptService, 'getLastCard').and.returnValue(
        StateCard.createNewCard(
          'Start',
          'Content',
          '',
          jasmine.createSpyObj('Interaction', ['']),
          'feedback_1'
        )
      );
      spyOn(
        answerClassificationService,
        'getMatchingClassificationResult'
      ).and.returnValue(answerClassificationResult);
      const alertSpy = spyOn(alertsService, 'addWarning');

      explorationEngineService.init(
        explorationDict,
        1,
        null,
        true,
        ['en'],
        [],
        initSuccessCb
      );

      const result = explorationEngineService.submitAnswer(
        'answer',
        textInputService,
        submitAnswerSuccessCb
      );

      expect(alertSpy).toHaveBeenCalledWith(
        'No rule matched for the submitted answer.'
      );
      expect(result).toBe(false);
    });

    it('should show warning if interaction id is null', fakeAsync(() => {
      const submitAnswerSuccessCb = jasmine.createSpy('success');

      const mockInteraction = jasmine.createSpyObj('Interaction', [''], {
        id: null,
        customizationArgs: {},
      });

      spyOn(playerTranscriptService, 'getLastCard').and.returnValue(
        StateCard.createNewCard(
          'Start',
          'Content',
          '',
          mockInteraction,
          'feedback_1'
        )
      );

      answerClassificationResult.ruleIndex = 0;
      spyOn(
        answerClassificationService,
        'getMatchingClassificationResult'
      ).and.returnValue(answerClassificationResult);

      explorationEngineService.init(
        explorationDict,
        1,
        null,
        true,
        ['en'],
        [],
        submitAnswerSuccessCb
      );
      tick();

      spyOn(explorationEngineService.exploration, 'getState').and.returnValue({
        interaction: {
          id: null,
        },
        content: {
          content_id: '123',
          html: '<p>Missing contentId</p>',
        },
      });

      spyOn(alertsService, 'addWarning');

      const result = explorationEngineService.submitAnswer(
        'answer',
        textInputService,
        submitAnswerSuccessCb
      );

      expect(alertsService.addWarning).toHaveBeenCalledWith(
        'Interaction id cannot be null.'
      );
      expect(result).toBe(false);
    }));

    it('should show warning if interaction for next state is not defined', fakeAsync(() => {
      answerClassificationResult.answerGroupIndex = 0;
      const successCallback = jasmine.createSpy('successCallback');

      spyOn(playerTranscriptService, 'getLastCard').and.returnValue(
        StateCard.createNewCard(
          'Start',
          'Content',
          '',
          jasmine.createSpyObj('Interaction', ['']),
          'feedback_1'
        )
      );

      spyOn(
        answerClassificationService,
        'getMatchingClassificationResult'
      ).and.returnValue(answerClassificationResult);

      spyOn(alertsService, 'addWarning');

      explorationEngineService.init(
        explorationDict,
        1,
        null,
        true,
        ['en'],
        [],
        successCallback
      );
      tick();

      spyOn(
        explorationEngineService.exploration,
        'getInteraction'
      ).and.returnValue(null);
      const result = explorationEngineService.submitAnswer(
        'answer',
        textInputService,
        successCallback
      );

      expect(alertsService.addWarning).toHaveBeenCalledWith(
        'Interaction for the next state is not defined.'
      );
      expect(result).toBe(false);
    }));

    it('should throw error if content id is null', fakeAsync(() => {
      const submitAnswerSuccessCb = jasmine.createSpy('submitSuccess');

      answerClassificationResult.answerGroupIndex = 0;
      // Triggers the content-id null branch by mocking the contentId getter.
      spyOnProperty(
        answerClassificationResult.outcome.feedback,
        'contentId',
        'get'
      ).and.returnValue(null);

      spyOn(playerTranscriptService, 'getLastCard').and.returnValue(
        StateCard.createNewCard(
          'Start',
          'Content',
          '',
          jasmine.createSpyObj('Interaction', [''], {
            id: 'TextInput',
            customizationArgs: {},
          }),
          'feedback_1'
        )
      );
      spyOn(
        answerClassificationService,
        'getMatchingClassificationResult'
      ).and.returnValue(answerClassificationResult);

      explorationEngineService.init(
        explorationDict,
        1,
        null,
        true,
        ['en'],
        [],
        submitAnswerSuccessCb
      );
      tick();

      spyOn(explorationEngineService.exploration, 'getState').and.returnValue({
        content: {contentId: null, html: '<p>Missing contentId</p>'},
        interaction: {id: 'TextInput', customizationArgs: {}},
        paramChanges: [],
      });

      spyOn(
        explorationEngineService.exploration,
        'getInteraction'
      ).and.returnValue({
        id: 'TextInput',
        customizationArgs: {},
      });

      expect(() => {
        explorationEngineService.submitAnswer(
          'answer',
          textInputService,
          submitAnswerSuccessCb
        );
      }).toThrowError('Content id cannot be null.');
    }));

    it(
      'should not submit answer again if the answer ' +
        'is already being processed',
      () => {
        let initSuccessCb = jasmine.createSpy('success');
        let submitAnswerSuccessCb = jasmine.createSpy('success');
        let answer = 'answer';
        let lastCard = StateCard.createNewCard(
          'Card 1',
          'Content html',
          'Interaction text',
          jasmine.createSpyObj('Interaction', ['']),
          'content_id'
        );

        spyOn(playerTranscriptService, 'getLastCard').and.returnValue(lastCard);
        spyOn(
          answerClassificationService,
          'getMatchingClassificationResult'
        ).and.returnValue(answerClassificationResult);

        explorationEngineService.init(
          explorationDict,
          1,
          null,
          true,
          ['en'],
          [],
          initSuccessCb
        );

        // Setting answer is being processed to true.
        explorationEngineService.answerIsBeingProcessed = true;
        explorationEngineService.submitAnswer(
          answer,
          textInputService,
          submitAnswerSuccessCb
        );

        expect(submitAnswerSuccessCb).not.toHaveBeenCalled();
      }
    );

    it('should show warning if interaction for the next state if stuck is not defined', fakeAsync(() => {
      const submitAnswerSuccessCb = jasmine.createSpy('submitSuccess');

      answerClassificationResult.outcome.destIfReallyStuck = 'StuckState';
      answerClassificationResult.answerGroupIndex = 0;

      spyOn(playerTranscriptService, 'getLastCard').and.returnValue(
        StateCard.createNewCard(
          'Start',
          'Content',
          '',
          jasmine.createSpyObj('Interaction', [''], {
            id: 'TextInput',
            customizationArgs: {},
          }),
          'feedback_1'
        )
      );
      spyOn(
        answerClassificationService,
        'getMatchingClassificationResult'
      ).and.returnValue(answerClassificationResult);

      explorationEngineService.init(
        explorationDict,
        1,
        null,
        true,
        ['en'],
        [],
        submitAnswerSuccessCb
      );
      tick();

      spyOn(explorationEngineService.exploration, 'getState').and.callFake(
        (stateName: string) => {
          if (stateName === 'StuckState') {
            return {
              content: {contentId: 'feedback_1', html: 'Stuck content'},
              interaction: {id: 'TextInput', customizationArgs: {}},
              paramChanges: [],
            };
          }
          return {
            content: {content_id: 'feedback_1', html: 'Start content'},
            interaction: {id: 'TextInput', customizationArgs: {}},
            paramChanges: [],
          };
        }
      );

      spyOn(
        explorationEngineService.exploration,
        'getInteraction'
      ).and.callFake((stateName: string) => {
        if (stateName === 'StuckState') {
          return null;
        }
        return {id: 'TextInput', customizationArgs: {}};
      });

      spyOn(alertsService, 'addWarning');

      explorationEngineService.submitAnswer(
        'test answer',
        textInputService,
        submitAnswerSuccessCb
      );

      expect(alertsService.addWarning).toHaveBeenCalledWith(
        'Interaction for the next state if stuck is not defined.'
      );
    }));

    it('should return null if content id for next state if stuck is null', fakeAsync(() => {
      const submitAnswerSuccessCb = jasmine.createSpy('submitSuccess');

      answerClassificationResult.outcome.destIfReallyStuck = 'StuckState';
      answerClassificationResult.answerGroupIndex = 0;

      spyOn(playerTranscriptService, 'getLastCard').and.returnValue(
        StateCard.createNewCard(
          'Start',
          'Content',
          '',
          jasmine.createSpyObj('Interaction', [''], {
            id: 'TextInput',
            customizationArgs: {},
          }),
          'feedback_1'
        )
      );
      spyOn(
        answerClassificationService,
        'getMatchingClassificationResult'
      ).and.returnValue(answerClassificationResult);

      explorationEngineService.init(
        explorationDict,
        1,
        null,
        true,
        ['en'],
        [],
        submitAnswerSuccessCb
      );
      tick();

      spyOn(explorationEngineService.exploration, 'getState').and.callFake(
        (stateName: string) => {
          if (stateName === 'StuckState') {
            const state = State.createDefaultState(
              'StuckState',
              'content_id',
              'default_outcome'
            );
            state.content.contentId = null;
            state.content.html = 'Stuck content';
            state.interaction.id = 'TextInput';
            state.interaction.customizationArgs = {};
            return state;
          }
          const state = State.createDefaultState(
            'Start',
            'feedback_1',
            'default_outcome'
          );
          state.content.html = 'Start content';
          state.interaction.id = 'TextInput';
          state.interaction.customizationArgs = {};
          return state;
        }
      );

      explorationEngineService.submitAnswer(
        'test answer',
        textInputService,
        submitAnswerSuccessCb
      );

      expect(submitAnswerSuccessCb).toHaveBeenCalled();
      expect(submitAnswerSuccessCb.calls.mostRecent().args[10]).toBeNull();
    }));

    it('should show warning message if the parameters ' + 'are empty', () => {
      let initSuccessCb = jasmine.createSpy('success');
      let submitAnswerSuccessCb = jasmine.createSpy('success');
      let answer = 'answer';

      let lastCard = StateCard.createNewCard(
        'Card 1',
        'Content html',
        'Interaction text',
        jasmine.createSpyObj('Interaction', ['']),
        'content_id'
      );

      spyOn(playerTranscriptService, 'getLastCard').and.returnValue(lastCard);
      spyOn(
        answerClassificationService,
        'getMatchingClassificationResult'
      ).and.returnValue(answerClassificationResult);
      let alertsServiceSpy = spyOn(
        alertsService,
        'addWarning'
      ).and.callThrough();
      spyOn(learnerParamsService, 'getAllParams').and.returnValue({});
      spyOn(explorationEngineService, 'makeParams').and.returnValue(null);

      explorationEngineService.init(
        explorationDict,
        1,
        null,
        true,
        ['en'],
        [],
        initSuccessCb
      );

      explorationEngineService.submitAnswer(
        answer,
        textInputService,
        submitAnswerSuccessCb
      );

      expect(alertsServiceSpy).toHaveBeenCalledWith(
        'Parameters should not be empty.'
      );
    });

    it('should show warning message if the question ' + 'name is empty', () => {
      let initSuccessCb = jasmine.createSpy('success');
      let submitAnswerSuccessCb = jasmine.createSpy('success');
      let answer = 'answer';

      let lastCard = StateCard.createNewCard(
        'Card 1',
        'Content html',
        'Interaction text',
        jasmine.createSpyObj('Interaction', ['']),
        'content_id'
      );

      spyOn(playerTranscriptService, 'getLastCard').and.returnValue(lastCard);
      spyOn(
        answerClassificationService,
        'getMatchingClassificationResult'
      ).and.returnValue(answerClassificationResult);
      spyOn(explorationEngineService, 'makeQuestion').and.returnValue(null);
      let alertsServiceSpy = spyOn(
        alertsService,
        'addWarning'
      ).and.callThrough();

      explorationEngineService.init(
        explorationDict,
        1,
        null,
        true,
        ['en'],
        [],
        initSuccessCb
      );

      explorationEngineService.submitAnswer(
        answer,
        textInputService,
        submitAnswerSuccessCb
      );

      expect(alertsServiceSpy).toHaveBeenCalledWith(
        'Question content should not be empty.'
      );
    });

    it('should return a different feedback for misspellings', () => {
      const initSuccessCb = jasmine.createSpy('success');
      const submitAnswerSuccessCb = jasmine.createSpy('success');
      const answer = 'answr';
      const defaultOutcomeDict = {
        dest: 'Mid',
        dest_if_really_stuck: null,
        feedback: {
          content_id: 'feedback_1',
          html: 'default feedback',
        },
        labelled_as_correct: false,
        param_changes: [],
        refresher_exploration_id: null,
        missing_prerequisite_skill_id: null,
      };
      let answerClassificationResult = new AnswerClassificationResult(
        Outcome.createFromBackendDict(defaultOutcomeDict),
        1,
        0,
        'default_outcome'
      );

      const lastCardInteraction = Interaction.createFromBackendDict({
        id: 'TextInput',
        answer_groups: [
          {
            outcome: {
              missing_prerequisite_skill_id: null,
              refresher_exploration_id: null,
              labelled_as_correct: true,
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
                rule_type: 'Equals',
              },
            ],
            tagged_skill_misconception_id: null,
          },
        ],
        default_outcome: defaultOutcomeDict,
        confirmed_unclassified_answers: [],
        customization_args: {
          rows: {
            value: true,
          },
          placeholder: {
            value: 1,
          },
          catch_misspellings: {
            value: true,
          },
        },
        hints: [],
        solution: null,
      });
      const lastCard = StateCard.createNewCard(
        'Card 1',
        'Content html',
        'Interaction text',
        lastCardInteraction,
        'content_id'
      );

      spyOn(lastCard, 'getInteractionCustomizationArgs').and.returnValue({
        rows: {
          value: 1,
        },
        placeholder: {
          value: new SubtitledUnicode('', 'ca_placeholder_0'),
        },
        catchMisspellings: {
          value: true,
        },
      });
      spyOn(playerTranscriptService, 'getLastCard').and.returnValue(lastCard);
      spyOn(
        answerClassificationService,
        'getMatchingClassificationResult'
      ).and.returnValue(answerClassificationResult);
      spyOn(translateService, 'instant').and.callFake((key: string) => {
        if (
          typeof key === 'string' &&
          key.startsWith('I18N_ANSWER_MISSPELLED_RESPONSE_TEXT')
        ) {
          return 'misspelled feedback';
        }
      });

      explorationEngineService.init(
        explorationDict,
        1,
        null,
        true,
        ['en'],
        [],
        initSuccessCb
      );

      explorationEngineService.submitAnswer(
        answer,
        textInputService,
        submitAnswerSuccessCb
      );

      expect(submitAnswerSuccessCb).toHaveBeenCalled();
      const feedbackArgPosition = 2;
      expect(submitAnswerSuccessCb.calls.argsFor(0)[feedbackArgPosition]).toBe(
        'misspelled feedback'
      );

      // Make outcome non-default, so that misspelling is not checked anymore.
      answerClassificationResult.outcome.dest = 'End';
      answerClassificationService.getMatchingClassificationResult = jasmine
        .createSpy()
        .and.returnValue(answerClassificationResult);

      explorationEngineService.submitAnswer(
        answer,
        textInputService,
        submitAnswerSuccessCb
      );
      expect(submitAnswerSuccessCb).toHaveBeenCalledTimes(2);
      expect(submitAnswerSuccessCb.calls.argsFor(1)[feedbackArgPosition]).toBe(
        'default feedback'
      );

      // Restore default outcome to check misspelling branch, but make `isAnswerOnlyMisspelled` return false.
      answerClassificationResult.outcome.dest = 'Mid';
      spyOn(
        answerClassificationService,
        'isAnswerOnlyMisspelled'
      ).and.returnValue(false);

      explorationEngineService.submitAnswer(
        answer,
        textInputService,
        submitAnswerSuccessCb
      );
      expect(submitAnswerSuccessCb).toHaveBeenCalledTimes(3);
      expect(submitAnswerSuccessCb.calls.argsFor(2)[feedbackArgPosition]).toBe(
        'default feedback'
      );
    });

    it('should handle submitAnswer where old state is same as new state and not inline', () => {
      const submitAnswerSuccessCb = jasmine.createSpy('success');
      answerClassificationResult.outcome.dest = 'Start';

      spyOn(playerTranscriptService, 'getLastCard').and.returnValue(
        StateCard.createNewCard(
          'Start',
          '',
          '',
          new Interaction(
            [],
            [],
            Object.create(null),
            null,
            [],
            'TextInput',
            null
          ),
          'content_id'
        )
      );
      spyOn(
        answerClassificationService,
        'getMatchingClassificationResult'
      ).and.returnValue(answerClassificationResult);
      explorationEngineService.init(
        explorationDict,
        1,
        null,
        true,
        ['en'],
        [],
        submitAnswerSuccessCb
      );
      spyOn(
        explorationEngineService.exploration,
        'isInteractionInline'
      ).and.returnValue(false);

      explorationEngineService.submitAnswer(
        'test answer',
        textInputService,
        submitAnswerSuccessCb
      );

      expect(submitAnswerSuccessCb).toHaveBeenCalled();
      // The refreshInteraction flag is index 1.
      expect(submitAnswerSuccessCb.calls.mostRecent().args[1]).toBe(false);
    });

    it('should handle submitAnswer when in exploration editor page', () => {
      const submitAnswerSuccessCb = jasmine.createSpy('success');
      (
        pageContextService.isInExplorationEditorPage as jasmine.Spy
      ).and.returnValue(true);
      spyOn(playerTranscriptService, 'getLastCard').and.returnValue(
        StateCard.createNewCard(
          'Start',
          '',
          '',
          new Interaction(
            [],
            [],
            Object.create(null),
            null,
            [],
            'TextInput',
            null
          ),
          'content_id'
        )
      );
      spyOn(
        answerClassificationService,
        'getMatchingClassificationResult'
      ).and.returnValue(answerClassificationResult);
      explorationEngineService.initSettingsFromEditor('Start', []);
      explorationEngineService.init(
        explorationDict,
        1,
        null,
        true,
        ['en'],
        [],
        submitAnswerSuccessCb
      );

      explorationEngineService.submitAnswer(
        'test answer',
        textInputService,
        submitAnswerSuccessCb
      );

      expect(submitAnswerSuccessCb).toHaveBeenCalled();
    });
  });

  it('should warn and return if interaction customization args are null when calling loadInitialState', () => {
    spyOn(alertsService, 'addWarning');
    spyOn(learnerParamsService, 'getAllParams').and.returnValue({});
    spyOn(explorationEngineService, 'makeParams').and.returnValue({});
    spyOn(learnerParamsService, 'init');

    spyOn(pageContextService, 'isInExplorationEditorPage').and.returnValue(
      false
    );

    explorationEngineService.init(
      explorationDict,
      1,
      null,
      true,
      ['en'],
      [],
      () => {}
    );
    spyOn(
      explorationEngineService.exploration,
      'getInteractionCustomizationArgs'
    ).and.returnValue(null);

    explorationEngineService.loadInitialState(() => {
      // This callback should not be invoked because customization args are null.
      fail('successCallback should not be called');
    });

    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'Interaction customization args cannot be null.'
    );
  });

  it(
    'should return exploration version ' +
      "when calling 'getExplorationVersion'",
    () => {
      let initSuccessCb = jasmine.createSpy('success');

      spyOn(pageContextService, 'isInExplorationEditorPage').and.returnValue(
        false
      );

      // Here 1 is default value, this is being initialized in the constructor.
      expect(pageContextService.getExplorationVersion()).toBe(1);

      explorationEngineService.init(
        explorationDict,
        2,
        null,
        true,
        ['en'],
        [],
        initSuccessCb
      );

      const explorationVersion = pageContextService.getExplorationVersion();
      expect(explorationVersion).toBe(2);
    }
  );

  it(
    "should return author recommended exploration id's " +
      "when calling 'getAuthorRecommendedExpIdsByStateName'",
    () => {
      let initSuccessCb = jasmine.createSpy('success');

      spyOn(pageContextService, 'isInExplorationEditorPage').and.returnValue(
        false
      );

      expect(() => {
        explorationEngineService.getAuthorRecommendedExpIdsByStateName('Start');
      }).toThrowError(
        'Cannot read properties of undefined ' +
          "(reading 'getAuthorRecommendedExpIds')"
      );

      explorationEngineService.init(
        explorationDict,
        1,
        null,
        true,
        ['en'],
        [],
        initSuccessCb
      );

      expect(() => {
        explorationEngineService.getAuthorRecommendedExpIdsByStateName('Start');
      }).toThrowError(
        'Tried to get recommendations for a non-terminal state: Start'
      );

      // Please note that in order to get author recommended exploration id's
      // current should be the last state.
      const recommendedId =
        explorationEngineService.getAuthorRecommendedExpIdsByStateName('End');
      expect(recommendedId).toContain('recommnendedExplorationId');
    }
  );

  it(
    'should update current state when an answer is submitted ' +
      'and a new card is recorded',
    () => {
      let initSuccessCb = jasmine.createSpy('success');
      let submitAnswerSuccessCb = jasmine.createSpy('success');
      let answer = 'answer';

      let lastCard = StateCard.createNewCard(
        'Card 1',
        'Content html',
        'Interaction text',
        jasmine.createSpyObj('Interaction', ['']),
        'content_id'
      );

      spyOn(pageContextService, 'isInExplorationEditorPage').and.returnValue(
        false
      );
      spyOn(playerTranscriptService, 'getLastStateName').and.returnValue(
        'Start'
      );
      spyOn(playerTranscriptService, 'getLastCard').and.returnValue(lastCard);
      spyOn(
        answerClassificationService,
        'getMatchingClassificationResult'
      ).and.returnValue(answerClassificationResult);

      expect(explorationEngineService.currentStateName).toBeUndefined();

      explorationEngineService.init(
        explorationDict,
        1,
        null,
        true,
        ['en'],
        [],
        initSuccessCb
      );

      explorationEngineService.submitAnswer(
        answer,
        textInputService,
        submitAnswerSuccessCb
      );
      expect(explorationEngineService.currentStateName).toBe('Start');
      explorationEngineService.recordNewCardAdded();
      expect(explorationEngineService.currentStateName).toBe('Mid');
    }
  );

  it("should return current state when calling 'getState'", () => {
    let initSuccessCb = jasmine.createSpy('success');
    spyOn(pageContextService, 'isInExplorationEditorPage').and.returnValue(
      false
    );
    let lastStateNameSpy = spyOn(playerTranscriptService, 'getLastStateName');

    expect(() => {
      explorationEngineService.getState();
    }).toThrowError("Cannot read properties of undefined (reading 'getState')");

    explorationEngineService.init(
      explorationDict,
      1,
      null,
      true,
      ['en'],
      [],
      initSuccessCb
    );

    // Check for first state.
    lastStateNameSpy.and.returnValue('Start');
    let currentState = explorationEngineService.getState();

    expect(currentState.name).toBe('Start');

    // Check for second state.
    lastStateNameSpy.and.returnValue('Mid');
    explorationEngineService.recordNewCardAdded();
    currentState = explorationEngineService.getState();

    expect(currentState.name).toBe('Mid');

    // Check for last state.
    lastStateNameSpy.and.returnValue('End');
    explorationEngineService.recordNewCardAdded();
    currentState = explorationEngineService.getState();

    expect(currentState.name).toBe('End');
  });

  it("should return language code when calling 'getLanguageCode'", () => {
    let initSuccessCb = jasmine.createSpy('success');
    spyOn(pageContextService, 'isInExplorationEditorPage').and.returnValue(
      false
    );

    expect(() => {
      explorationEngineService.getLanguageCode();
    }).toThrowError(
      "Cannot read properties of undefined (reading 'getLanguageCode')"
    );

    // First exploration has language code 'en'.
    explorationEngineService.init(
      explorationDict,
      1,
      null,
      true,
      ['en'],
      [],
      initSuccessCb
    );
    expect(explorationEngineService.getLanguageCode()).toBe('en');

    // Setting next exploration language code to 'bn'.
    explorationDict.language_code = 'bn';
    explorationEngineService.init(
      explorationDict,
      1,
      null,
      true,
      ['en'],
      [],
      initSuccessCb
    );
    expect(explorationEngineService.getLanguageCode()).toBe('bn');
  });

  it(
    'should throw error if we populate exploration data ' +
      'in exploration player page',
    () => {
      // Please note that 'initSettingsFromEditor' function is strictly
      // used for the exploration editor page before initialization.
      // This method should not be called from the exploration player page.
      let paramChanges = ParamChange.createFromBackendDict(paramChangeDict);

      // Checking if we are currently in exploration editor preview mode.
      expect(pageContextService.isInExplorationEditorPage()).toBe(false);
      expect(() => {
        explorationEngineService.initSettingsFromEditor('Start', [
          paramChanges,
        ]);
      }).toThrowError('Cannot populate exploration in learner mode.');
    }
  );

  it("should return state when calling 'getStateFromStateName'", () => {
    let initSuccessCb = jasmine.createSpy('success');
    spyOn(pageContextService, 'isInExplorationEditorPage').and.returnValue(
      false
    );

    expect(() => {
      explorationEngineService.getStateFromStateName('Start');
    }).toThrowError("Cannot read properties of undefined (reading 'getState')");

    explorationEngineService.init(
      explorationDict,
      1,
      null,
      true,
      ['en'],
      [],
      initSuccessCb
    );

    // Check for first state.
    let state = explorationEngineService.getStateFromStateName('Start');

    expect(state.name).toBe('Start');

    // Check for second state.
    state = explorationEngineService.getStateFromStateName('Mid');

    expect(state.name).toBe('Mid');
  });

  it("should return state card when calling 'getStateCardByName'", () => {
    let initSuccessCb = jasmine.createSpy('success');
    spyOn(pageContextService, 'isInExplorationEditorPage').and.returnValue(
      false
    );

    expect(() => {
      explorationEngineService.getStateCardByName('Start');
    }).toThrowError(
      "Cannot read properties of undefined (reading 'getInteraction')"
    );

    explorationEngineService.init(
      explorationDict,
      1,
      null,
      true,
      ['en'],
      [],
      initSuccessCb
    );

    // Check for first state.
    let stateCard = explorationEngineService.getStateCardByName('Start');

    expect(stateCard.getStateName()).toBe('Start');

    // Check for second state.
    stateCard = explorationEngineService.getStateCardByName('Mid');

    expect(stateCard.getStateName()).toBe('Mid');
  });

  it("should throw an error if interaction is not defined when calling 'getStateCardByName'", () => {
    explorationEngineService.init(
      explorationDict,
      1,
      null,
      true,
      ['en'],
      [],
      () => {}
    );

    spyOn(
      explorationEngineService.exploration,
      'getInteraction'
    ).and.returnValue(null);

    expect(() => {
      explorationEngineService.getStateCardByName('Start');
    }).toThrowError('Interaction for the state is not defined.');
  });

  it("should throw an error if contentId is null when calling 'getStateCardByName'", () => {
    const mockState = {
      content: {
        html: '<p>Sample content</p>',
        contentId: null,
      },
    };

    explorationEngineService.init(
      explorationDict,
      1,
      null,
      true,
      ['en'],
      [],
      () => {}
    );
    spyOn(explorationEngineService.exploration, 'getState').and.returnValue(
      mockState
    );
    spyOn(
      explorationEngineService.exploration,
      'getInteraction'
    ).and.returnValue({
      id: 'TextInput',
    });
    spyOn(
      explorationEngineService.exploration,
      'getInteractionId'
    ).and.returnValue('TextInput');
    spyOn(
      explorationEngineService.exploration,
      'getInteractionCustomizationArgs'
    ).and.returnValue({});
    spyOn(
      explorationHtmlFormatterService,
      'getInteractionHtml'
    ).and.returnValue('<div>interaction</div>');
    spyOn(explorationEngineService, 'getRandomSuffix').and.returnValue('');

    expect(() => {
      explorationEngineService.getStateCardByName('SomeState');
    }).toThrowError('Content id cannot be null.');
  });

  it("should throw an error if interactionId is not defined when calling 'getStateCardByName'", () => {
    explorationEngineService.init(
      explorationDict,
      1,
      null,
      true,
      ['en'],
      [],
      () => {}
    );

    spyOn(
      explorationEngineService.exploration,
      'getInteractionId'
    ).and.returnValue(null);

    expect(() => {
      explorationEngineService.getStateCardByName('Start');
    }).toThrowError('Interaction id cannot be null.');
  });

  it("should throw an error if interactionCustomizationArgs is not defined when calling 'getStateCardByName'", () => {
    explorationEngineService.init(
      explorationDict,
      1,
      null,
      true,
      ['en'],
      [],
      () => {}
    );

    spyOn(
      explorationEngineService.exploration,
      'getInteractionCustomizationArgs'
    ).and.returnValue(null);

    expect(() => {
      explorationEngineService.getStateCardByName('Start');
    }).toThrowError('Interaction customization args cannot be null.');
  });

  it(
    'should return shortest path to state when calling ' +
      "'getShortestPathToState'",
    () => {
      let initSuccessCb = jasmine.createSpy('success');
      spyOn(pageContextService, 'isInExplorationEditorPage').and.returnValue(
        false
      );

      explorationEngineService.init(
        explorationDict,
        1,
        null,
        true,
        ['en'],
        [],
        initSuccessCb
      );

      // Check for first state.
      let shortestPathToState = explorationEngineService.getShortestPathToState(
        explorationDict.states,
        'Mid'
      );

      expect(shortestPathToState).toEqual(['Start', 'Mid']);
    }
  );

  it('should return an empty array if the destination state is unreachable in getShortestPathToState', () => {
    let initSuccessCb = jasmine.createSpy('success');
    spyOn(pageContextService, 'isInExplorationEditorPage').and.returnValue(
      false
    );

    explorationEngineService.init(
      explorationDict,
      1,
      null,
      true,
      ['en'],
      [],
      initSuccessCb
    );

    let shortestPathToState = explorationEngineService.getShortestPathToState(
      explorationDict.states,
      'NonExistentState'
    );

    expect(shortestPathToState).toEqual([]);
  });

  it('should handle interaction with null id in getStateCardByName and getShortestPathToState', () => {
    explorationEngineService.init(
      explorationDict,
      1,
      null,
      true,
      ['en'],
      [],
      () => {}
    );

    spyOn(explorationEngineService.exploration, 'getState').and.returnValue(
      State.createDefaultState('Start', 'content_id', 'default_outcome')
    );
    spyOn(
      explorationEngineService.exploration,
      'getInteraction'
    ).and.returnValue(
      new Interaction([], [], Object.create(null), null, [], null, null)
    );

    const stateCard = explorationEngineService.getStateCardByName('Start');
    expect(stateCard).toBeDefined();

    const shortestPath = explorationEngineService.getShortestPathToState(
      {
        Start: State.createDefaultState(
          'Start',
          'content_id',
          'default_outcome'
        ).toBackendDict(),
      },
      'Start'
    );
    expect(shortestPath).toEqual(['Start']);
  });

  it('should cover setExplorationProperties false branches', () => {
    const getPathnameSpy = spyOn(urlService, 'getPathname').and.returnValue(
      '/explore/1'
    );
    const isInQuestionPlayerModeSpy = spyOn(
      pageContextService,
      'isInQuestionPlayerMode'
    ).and.returnValue(true);
    explorationEngineService.setExplorationProperties();
    expect(pageContextService.isInQuestionPlayerMode).toHaveBeenCalled();

    isInQuestionPlayerModeSpy.and.returnValue(false);
    getPathnameSpy.and.returnValue('/skill_editor/1');
    explorationEngineService.setExplorationProperties();
    expect(urlService.getPathname).toHaveBeenCalled();
  });

  it('should skip learnerParamsService.init when newParams is null in loadInitialState', () => {
    spyOn(pageContextService, 'isInExplorationEditorPage').and.returnValue(
      false
    );
    explorationEngineService.init(
      explorationDict,
      1,
      null,
      true,
      ['en'],
      [],
      () => {}
    );

    spyOn(learnerParamsService, 'getAllParams').and.returnValue({});
    // MakeParams returns the same object (truthy), but we need to cover the
    // false branch of `if (newParams)`, which means returning undefined/null.
    // We spy after init so that the initial load still succeeds.
    const learnerParamsSpy = spyOn(learnerParamsService, 'init');
    spyOn(explorationEngineService, 'makeParams').and.returnValue(
      JSON.parse('null')
    );

    explorationEngineService.loadInitialState(() => {});

    // When makeParams returns falsy, init should NOT be called a second time.
    expect(learnerParamsSpy).not.toHaveBeenCalled();
  });

  it('should skip interaction html when interactionId is null in loadInitialState', () => {
    const successCb = jasmine.createSpy('success');
    spyOn(pageContextService, 'isInExplorationEditorPage').and.returnValue(
      false
    );
    explorationEngineService.init(
      explorationDict,
      1,
      null,
      true,
      ['en'],
      [],
      () => {}
    );

    // Override the interaction to have no id.
    spyOn(
      explorationEngineService.exploration,
      'getInteraction'
    ).and.returnValue(
      new Interaction([], [], Object.create(null), null, [], null, null)
    );
    spyOn(learnerParamsService, 'getAllParams').and.returnValue({});
    spyOn(explorationEngineService, 'makeParams').and.returnValue({});
    spyOn(
      explorationEngineService.exploration,
      'getInteractionCustomizationArgs'
    ).and.returnValue({});

    const htmlFormatterSpy = spyOn(
      explorationHtmlFormatterService,
      'getInteractionHtml'
    );

    explorationEngineService.loadInitialState(successCb);

    // HTML formatter should NOT be called when interactionId is null.
    expect(htmlFormatterSpy).not.toHaveBeenCalled();
  });

  it('should return empty array when getAuthorRecommendedExpIds returns null', () => {
    spyOn(pageContextService, 'isInExplorationEditorPage').and.returnValue(
      false
    );
    explorationEngineService.init(
      explorationDict,
      1,
      null,
      true,
      ['en'],
      [],
      () => {}
    );

    spyOn(
      explorationEngineService.exploration,
      'getAuthorRecommendedExpIds'
    ).and.returnValue(null);

    const result =
      explorationEngineService.getAuthorRecommendedExpIdsByStateName('End');
    expect(result).toEqual([]);
  });

  it('should skip makeParams when newState is falsy in submitAnswer ternary (line 809)', fakeAsync(() => {
    // Return null only for the first lookup of the destination state so the
    // ternary takes the falsy branch, then return a valid state for later calls.
    const submitCb = jasmine.createSpy('success');
    answerClassificationResult.outcome.dest = 'Mid';

    spyOn(pageContextService, 'isInExplorationEditorPage').and.returnValue(
      false
    );
    spyOn(playerTranscriptService, 'getLastStateName').and.returnValue('Start');
    spyOn(playerTranscriptService, 'getLastCard').and.returnValue(
      StateCard.createNewCard(
        'Start',
        'Content',
        '',
        jasmine.createSpyObj('Interaction', [''], {
          id: 'TextInput',
          customizationArgs: {},
        }),
        'feedback_1'
      )
    );
    spyOn(
      answerClassificationService,
      'getMatchingClassificationResult'
    ).and.returnValue(answerClassificationResult);

    explorationEngineService.init(
      explorationDict,
      1,
      null,
      true,
      ['en'],
      [],
      submitCb
    );
    tick();

    let midLookupCount = 0;
    spyOn(explorationEngineService.exploration, 'getState').and.callFake(
      (stateName: string) => {
        if (stateName === 'Mid' && midLookupCount++ === 0) {
          return null;
        }
        return State.createDefaultState(
          stateName,
          'content_id',
          'default_outcome'
        );
      }
    );
    spyOn(explorationEngineService, 'makeQuestion').and.returnValue('Question');
    const makeParamsSpy = spyOn(
      explorationEngineService,
      'makeParams'
    ).and.callThrough();

    explorationEngineService.submitAnswer('answer', textInputService, submitCb);

    expect(makeParamsSpy).not.toHaveBeenCalled();
  }));

  it('should skip interaction html when interaction.id is null in submitAnswer (line 852 false branch)', fakeAsync(() => {
    const submitCb = jasmine.createSpy('success');

    spyOn(pageContextService, 'isInExplorationEditorPage').and.returnValue(
      false
    );
    spyOn(playerTranscriptService, 'getLastStateName').and.returnValue('Start');
    spyOn(playerTranscriptService, 'getLastCard').and.returnValue(
      StateCard.createNewCard(
        'Start',
        'Content',
        '',
        jasmine.createSpyObj('Interaction', [''], {
          id: 'TextInput',
          customizationArgs: {},
        }),
        'feedback_1'
      )
    );
    spyOn(
      answerClassificationService,
      'getMatchingClassificationResult'
    ).and.returnValue(answerClassificationResult);

    explorationEngineService.init(
      explorationDict,
      1,
      null,
      true,
      ['en'],
      [],
      submitCb
    );
    tick();

    // Return an interaction with no id to hit the false branch.
    spyOn(
      explorationEngineService.exploration,
      'getInteraction'
    ).and.returnValue(
      new Interaction([], [], Object.create(null), null, [], null, null)
    );
    spyOn(explorationEngineService.exploration, 'getState').and.returnValue(
      State.createDefaultState('Start', 'content_id', 'default_outcome')
    );

    const htmlFormatterSpy = spyOn(
      explorationHtmlFormatterService,
      'getInteractionHtml'
    );

    explorationEngineService.submitAnswer('answer', textInputService, submitCb);

    expect(htmlFormatterSpy).not.toHaveBeenCalled();
  }));

  it('should warn about empty params when newParams is null in submitAnswer (line 811)', fakeAsync(() => {
    // We achieve this by making makeParams throw, then testing the null guard
    // directly. In the source, the null guard at line 811 covers `=== null`.
    // We trigger it by mocking getState to return a real object (so newState
    // is truthy, line 808 calls makeParams), and returning null from makeParams.
    const submitCb = jasmine.createSpy('success');

    spyOn(pageContextService, 'isInExplorationEditorPage').and.returnValue(
      false
    );
    spyOn(playerTranscriptService, 'getLastStateName').and.returnValue('Start');
    spyOn(playerTranscriptService, 'getLastCard').and.returnValue(
      StateCard.createNewCard(
        'Start',
        'Content',
        '',
        jasmine.createSpyObj('Interaction', [''], {
          id: 'TextInput',
          customizationArgs: {},
        }),
        'feedback_1'
      )
    );
    spyOn(
      answerClassificationService,
      'getMatchingClassificationResult'
    ).and.returnValue(answerClassificationResult);
    spyOn(alertsService, 'addWarning');

    explorationEngineService.init(
      explorationDict,
      1,
      null,
      true,
      ['en'],
      [],
      submitCb
    );
    tick();

    // Spy after init so the init itself still works.
    // Override makeParams to return null so line 811 triggers.
    explorationEngineService.makeParams = jasmine
      .createSpy()
      .and.returnValue(null);

    const result = explorationEngineService.submitAnswer(
      'answer',
      textInputService,
      submitCb
    );

    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'Parameters should not be empty.'
    );
    expect(result).toBe(false);
  }));

  it('should skip makeParams when newStateIfStuck is falsy in _getNextCardIfReallyStuck (line 934)', fakeAsync(() => {
    // Return null only for the first stuck-state lookup so the ternary takes
    // the falsy branch, then return a valid state for later content access.
    const submitCb = jasmine.createSpy('success');
    answerClassificationResult.outcome.destIfReallyStuck = 'StuckState';
    answerClassificationResult.answerGroupIndex = 0;

    spyOn(pageContextService, 'isInExplorationEditorPage').and.returnValue(
      false
    );
    spyOn(playerTranscriptService, 'getLastStateName').and.returnValue('Start');
    spyOn(playerTranscriptService, 'getLastCard').and.returnValue(
      StateCard.createNewCard(
        'Start',
        '',
        '',
        jasmine.createSpyObj('Interaction', [''], {
          id: 'TextInput',
          customizationArgs: {},
        }),
        'content_id'
      )
    );
    spyOn(
      answerClassificationService,
      'getMatchingClassificationResult'
    ).and.returnValue(answerClassificationResult);

    explorationEngineService.init(
      explorationDict,
      1,
      null,
      true,
      ['en'],
      [],
      submitCb
    );
    tick();

    const validCustomizationArgs = {
      rows: {value: 1},
      placeholder: {value: {unicode_str: '', content_id: 'ca_0'}},
      catchMisspellings: {value: false},
    };

    let stuckStateLookupCount = 0;
    spyOn(explorationEngineService.exploration, 'getState').and.callFake(
      (stateName: string) => {
        if (stateName === 'StuckState') {
          if (stuckStateLookupCount++ === 0) {
            return null;
          }
          const state = State.createDefaultState(
            'StuckState',
            'stuck_content_id',
            'default_outcome'
          );
          state.content.html = 'Stuck';
          state.interaction.id = 'TextInput';
          state.interaction.customizationArgs = validCustomizationArgs;
          return state;
        }
        const state = State.createDefaultState(
          'Start',
          'content_id',
          'default_outcome'
        );
        state.content.html = '';
        state.interaction.id = 'TextInput';
        state.interaction.customizationArgs = validCustomizationArgs;
        return state;
      }
    );
    spyOn(explorationEngineService, 'makeQuestion').and.callFake(
      (newState: State | null) => {
        if (newState === null) {
          return 'Stuck';
        }
        return newState.content.html;
      }
    );
    const makeParamsSpy = spyOn(
      explorationEngineService,
      'makeParams'
    ).and.callThrough();
    spyOn(explorationEngineService.exploration, 'getInteraction').and.callFake(
      (stateName: string) => {
        return new Interaction(
          [],
          [],
          Object.assign(Object.create(null), validCustomizationArgs),
          null,
          [],
          'TextInput',
          null
        );
      }
    );
    spyOn(
      explorationHtmlFormatterService,
      'getInteractionHtml'
    ).and.returnValue('<div>html</div>');

    const makeParamsCallCountBeforeSubmit = makeParamsSpy.calls.count();
    explorationEngineService.submitAnswer(
      'test answer',
      textInputService,
      submitCb
    );

    // The callback fires and the stuck card arg (index 10) is a StateCard.
    expect(submitCb).toHaveBeenCalled();
    const callArgs = submitCb.calls.mostRecent().args;
    expect(callArgs[10]).not.toBeNull();
    expect(makeParamsSpy.calls.count() - makeParamsCallCountBeforeSubmit).toBe(
      1
    );
  }));

  it('should skip stuck-state html generation when interaction.id is null (line 959)', fakeAsync(() => {
    // The _getInteractionHtmlByStateName private method should NOT be called
    // for the stuck state; instead we verify the stuck card is returned without
    // html generation for the stuck state.
    const submitCb = jasmine.createSpy('success');
    answerClassificationResult.outcome.destIfReallyStuck = 'StuckState';
    answerClassificationResult.answerGroupIndex = 0;

    spyOn(pageContextService, 'isInExplorationEditorPage').and.returnValue(
      false
    );
    spyOn(playerTranscriptService, 'getLastStateName').and.returnValue('Start');
    spyOn(playerTranscriptService, 'getLastCard').and.returnValue(
      StateCard.createNewCard(
        'Start',
        '',
        '',
        jasmine.createSpyObj('Interaction', [''], {
          id: 'TextInput',
          customizationArgs: {},
        }),
        'content_id'
      )
    );
    spyOn(
      answerClassificationService,
      'getMatchingClassificationResult'
    ).and.returnValue(answerClassificationResult);

    explorationEngineService.init(
      explorationDict,
      1,
      null,
      true,
      ['en'],
      [],
      submitCb
    );
    tick();

    spyOn(explorationEngineService.exploration, 'getState').and.callFake(
      (stateName: string) => {
        if (stateName === 'StuckState') {
          const state = State.createDefaultState(
            'StuckState',
            'stuck_content_id',
            'default_outcome'
          );
          state.content.html = 'Stuck';
          state.interaction.id = null;
          return state;
        }
        const state = State.createDefaultState(
          'Start',
          'content_id',
          'default_outcome'
        );
        state.content.html = '';
        state.interaction.id = 'TextInput';
        return state;
      }
    );
    spyOn(explorationEngineService.exploration, 'getInteraction').and.callFake(
      (stateName: string) => {
        return stateName === 'StuckState'
          ? new Interaction([], [], Object.create(null), null, [], null, null)
          : new Interaction(
              [],
              [],
              Object.create(null),
              null,
              [],
              'TextInput',
              null
            );
      }
    );

    // Spy on the private method to confirm it was not called for the stuck state.
    const htmlByStateNameSpy = spyOn(
      explorationHtmlFormatterService,
      'getInteractionHtml'
    ).and.returnValue('<div>main-html</div>');

    explorationEngineService.submitAnswer(
      'test answer',
      textInputService,
      submitCb
    );

    // The private helper should only have been called once (for the main state).
    // It should NOT have been called a second time for the stuck state.
    expect(htmlByStateNameSpy.calls.count()).toBe(1);
  }));

  it('should return null from _getNextCardIfReallyStuck when contentId is null (line 972)', fakeAsync(() => {
    const submitCb = jasmine.createSpy('success');
    answerClassificationResult.outcome.destIfReallyStuck = 'StuckState';
    answerClassificationResult.answerGroupIndex = 0;

    spyOn(pageContextService, 'isInExplorationEditorPage').and.returnValue(
      false
    );
    spyOn(playerTranscriptService, 'getLastStateName').and.returnValue('Start');
    spyOn(playerTranscriptService, 'getLastCard').and.returnValue(
      StateCard.createNewCard(
        'Start',
        '',
        '',
        jasmine.createSpyObj('Interaction', [''], {
          id: 'TextInput',
          customizationArgs: {},
        }),
        'content_id'
      )
    );
    spyOn(
      answerClassificationService,
      'getMatchingClassificationResult'
    ).and.returnValue(answerClassificationResult);

    explorationEngineService.init(
      explorationDict,
      1,
      null,
      true,
      ['en'],
      [],
      submitCb
    );
    tick();

    const validCustomizationArgs = {
      rows: {value: 1},
      placeholder: {value: {unicode_str: '', content_id: 'ca_0'}},
      catchMisspellings: {value: false},
    };

    spyOn(explorationEngineService.exploration, 'getState').and.callFake(
      (stateName: string) => {
        if (stateName === 'StuckState') {
          const state = State.createDefaultState(
            'StuckState',
            'dummy_content_id',
            'default_outcome'
          );
          state.content.contentId = null;
          state.content.html = 'Stuck';
          state.interaction.id = 'TextInput';
          state.interaction.customizationArgs = validCustomizationArgs;
          return state;
        }
        const state = State.createDefaultState(
          'Start',
          'content_id',
          'default_outcome'
        );
        state.content.html = '';
        state.interaction.id = 'TextInput';
        state.interaction.customizationArgs = validCustomizationArgs;
        return state;
      }
    );
    spyOn(explorationEngineService.exploration, 'getInteraction').and.callFake(
      (stateName: string) => {
        return new Interaction(
          [],
          [],
          Object.assign(Object.create(null), validCustomizationArgs),
          null,
          [],
          'TextInput',
          null
        );
      }
    );
    // Spy on private method so html generation doesn't fail on real services.
    spyOn(
      explorationHtmlFormatterService,
      'getInteractionHtml'
    ).and.returnValue('<div>html</div>');

    explorationEngineService.submitAnswer(
      'test answer',
      textInputService,
      submitCb
    );

    // The main submitAnswer callback still fires even when stuck card is null.
    expect(submitCb).toHaveBeenCalled();
    // Arg at index 10 is nextCardIfReallyStuck; it should be null because
    // the stuck state's contentId is null (line 972 returns null).
    const callArgs = submitCb.calls.mostRecent().args;
    expect(callArgs[10]).toBeNull();
  }));

  it('should return feedback html when interaction is not TextInput (_getFeedback line 205 branch)', () => {
    const submitCb = jasmine.createSpy('success');

    spyOn(pageContextService, 'isInExplorationEditorPage').and.returnValue(
      false
    );
    spyOn(playerTranscriptService, 'getLastStateName').and.returnValue('Mid');
    // Use a non-TextInput interaction to make shouldCheckForMisspelling false.
    spyOn(playerTranscriptService, 'getLastCard').and.returnValue(
      StateCard.createNewCard(
        'Mid',
        '',
        '',
        jasmine.createSpyObj('Interaction', [''], {
          id: 'Continue',
          customizationArgs: {},
        }),
        'content_id'
      )
    );
    spyOn(
      answerClassificationService,
      'getMatchingClassificationResult'
    ).and.returnValue(answerClassificationResult);

    explorationEngineService.init(
      explorationDict,
      1,
      null,
      true,
      ['en'],
      [],
      submitCb
    );

    explorationEngineService.submitAnswer('answer', textInputService, submitCb);

    expect(submitCb).toHaveBeenCalled();
  });

  describe('on validating parameters ', () => {
    it('should create new parameters successfully', () => {
      paramChangeDict.customization_args.parse_with_jinja = true;
      paramChangeDict.generator_id = 'not_copier';

      let oldParams = {
        guess: '-1',
        answer: 'val',
      };

      let expectedParams = {
        guess: '-1',
        answer: 'val1, val2',
      };

      let paramChanges = ParamChange.createFromBackendDict(paramChangeDict);
      const newParams = explorationEngineService.makeParams(
        oldParams,
        [paramChanges],
        []
      );
      expect(newParams).toEqual(expectedParams);
    });

    it('should fallback to empty string or array if customization args are not provided', () => {
      let oldParams = {};

      let paramChange1 = ParamChange.createFromBackendDict({
        name: 'param1',
        generator_id: 'Copier',
        customization_args: {
          parse_with_jinja: false,
        },
      });
      let paramChange2 = ParamChange.createFromBackendDict({
        name: 'param2',
        generator_id: 'Copier',
        customization_args: {
          parse_with_jinja: true,
        },
      });
      let paramChange3 = ParamChange.createFromBackendDict({
        name: 'param3',
        generator_id: 'RandomSelector',
        customization_args: {},
      });

      const newParams = explorationEngineService.makeParams(
        oldParams,
        [paramChange1, paramChange2, paramChange3],
        []
      );

      expect(newParams.param1).toEqual('');
      expect(newParams.param2).toEqual('');
      expect(newParams.param3).toBeUndefined();
    });

    it(
      'should not create new parameters if paramater ' + 'values are empty',
      () => {
        paramChangeDict.customization_args.parse_with_jinja = true;
        let oldParams = {};

        let paramChanges = ParamChange.createFromBackendDict(paramChangeDict);
        spyOn(expressionInterpolationService, 'processUnicode').and.returnValue(
          null
        );

        expect(() => {
          explorationEngineService.makeParams(oldParams, [paramChanges], []);
        }).toThrowError('Parameter evaluation failed.');
      }
    );

    it('should return old parameters', () => {
      paramChangeDict.customization_args.parse_with_jinja = true;
      let oldParams = {
        guess: '-1',
        answer: 'val',
      };

      let paramChanges = ParamChange.createFromBackendDict(paramChangeDict);
      const newParams = explorationEngineService.makeParams(
        oldParams,
        [paramChanges],
        []
      );

      expect(newParams).toEqual(oldParams);
    });
  });
});
