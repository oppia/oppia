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
import {
  ParamChangeBackendDict,
  ParamChange,
} from 'domain/exploration/param-change.model';
import {
  FetchExplorationBackendResponse,
  ReadOnlyExplorationBackendApiService,
} from 'domain/exploration/read-only-exploration-backend-api.service';
import {StateCard} from 'domain/state_card/state-card.model';
import {ExpressionInterpolationService} from 'expressions/expression-interpolation.service';
import {TextInputRulesService} from 'interactions/TextInput/directives/text-input-rules.service';
import {AlertsService} from 'services/alerts.service';
import {PageContextService} from 'services/page-context.service';
import {UrlService} from 'services/contextual/url.service';
import {AnswerClassificationService} from './answer-classification.service';
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
  let answerClassificationResult: AnswerClassificationService;
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
  let textInputService: TextInputRulesService;
  let translateService: TranslateService;
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
      is_version_of_draft_valid: null,
      language_code: 'en',
      init_state_name: 'Start',
      next_content_id_index: 5,
      draft_changes: null,
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

    answerClassificationResult = {
      outcome: {
        dest: 'Mid',
        destIfReallyStuck: 'Mid',
        feedback: {
          content_id: 'feedback_1',
          html: 'Answer is correct!',
        },
        labelledAsCorrect: true,
        paramChanges: [],
        refresherExplorationId: null,
        missingPrerequisiteSkillId: null,
      },
      answerGroupIndex: 1,
      ruleIndex: 0,
      classificationCategorization: 'default_outcome',
    };
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
    textInputService = TestBed.inject(TextInputRulesService);
    translateService = TestBed.inject(TranslateService);
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
      (html, envs) => html
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
  });

  describe('on submitting answer ', () => {
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
          null,
          null,
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

      spyOn(pageContextService, 'isInExplorationEditorPage').and.returnValue(
        false
      );
      spyOn(playerTranscriptService, 'getLastStateName').and.returnValue(
        'Start'
      );
      spyOn(playerTranscriptService, 'getLastCard').and.returnValue(
        StateCard.createNewCard(
          'Start',
          'Content',
          '',
          null,
          null,
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

      const mockInteraction = {
        id: null, // Triggers the branch.
        customizationArgs: {},
      };

      spyOn(pageContextService, 'isInExplorationEditorPage').and.returnValue(
        false
      );
      spyOn(playerTranscriptService, 'getLastStateName').and.returnValue(
        'Start'
      );
      spyOn(playerTranscriptService, 'getLastCard').and.returnValue(
        StateCard.createNewCard(
          'Start',
          'Content',
          '',
          mockInteraction,
          null,
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

      spyOn(pageContextService, 'isInExplorationEditorPage').and.returnValue(
        false
      );
      spyOn(playerTranscriptService, 'getLastStateName').and.returnValue(
        'Start'
      );
      spyOn(playerTranscriptService, 'getLastCard').and.returnValue(
        StateCard.createNewCard(
          'Start',
          'Content',
          '',
          null,
          null,
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

    it('should show warning if content id is null', fakeAsync(() => {
      const submitAnswerSuccessCb = jasmine.createSpy('submitSuccess');

      answerClassificationResult.answerGroupIndex = 0;
      answerClassificationResult.outcome.feedback.content_id = null; // Triggers the branch.

      spyOn(pageContextService, 'isInExplorationEditorPage').and.returnValue(
        false
      );
      spyOn(playerTranscriptService, 'getLastStateName').and.returnValue(
        'Start'
      );
      spyOn(playerTranscriptService, 'getLastCard').and.returnValue(
        StateCard.createNewCard(
          'Start',
          'Content',
          '',
          {id: 'TextInput', customizationArgs: {}},
          null,
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

      spyOn(alertsService, 'addWarning');

      const result = explorationEngineService.submitAnswer(
        'answer',
        textInputService,
        submitAnswerSuccessCb
      );

      expect(alertsService.addWarning).toHaveBeenCalledWith(
        'Content id cannot be null.'
      );
      expect(result).toBe(false);
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
          null,
          null,
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

      spyOn(pageContextService, 'isInExplorationEditorPage').and.returnValue(
        false
      );
      spyOn(playerTranscriptService, 'getLastStateName').and.returnValue(
        'Start'
      );
      spyOn(playerTranscriptService, 'getLastCard').and.returnValue(
        StateCard.createNewCard(
          'Start',
          'Content',
          '',
          {id: 'TextInput', customizationArgs: {}},
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

    it(
      'should show warning message if the feedback ' + 'content is empty',
      () => {
        let initSuccessCb = jasmine.createSpy('success');
        let submitAnswerSuccessCb = jasmine.createSpy('success');
        let answer = 'answer';
        answerClassificationResult.outcome.feedback.html = null; // Triggers the branch.

        let lastCard = StateCard.createNewCard(
          'Card 1',
          'Content html',
          'Interaction text',
          null,
          null,
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
          'Feedback content should not be empty.'
        );
      }
    );

    it('should show warning message if the parameters ' + 'are empty', () => {
      let initSuccessCb = jasmine.createSpy('success');
      let submitAnswerSuccessCb = jasmine.createSpy('success');
      let answer = 'answer';

      let lastCard = StateCard.createNewCard(
        'Card 1',
        'Content html',
        'Interaction text',
        null,
        null,
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
        null,
        null,
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
        null,
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
      spyOn(translateService, 'instant').and.callFake(key => {
        if (
          (key as string).startsWith('I18N_ANSWER_MISSPELLED_RESPONSE_TEXT')
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
        null,
        null,
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

      expect(explorationEngineService.currentStateName).toBe(undefined);

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
      explorationEngineService,
      '_getInteractionHtmlByStateName'
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
