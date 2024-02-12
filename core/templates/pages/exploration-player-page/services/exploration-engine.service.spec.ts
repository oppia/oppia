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

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EventEmitter } from '@angular/core';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { MockTranslateService } from 'components/forms/schema-based-editors/integration-tests/schema-based-editors.integration.spec';
import { AnswerClassificationResult } from 'domain/classifier/answer-classification-result.model';
import { InteractionObjectFactory } from 'domain/exploration/InteractionObjectFactory';
import { ExplorationBackendDict, ExplorationObjectFactory } from 'domain/exploration/ExplorationObjectFactory';
import { OutcomeObjectFactory } from 'domain/exploration/OutcomeObjectFactory';
import { ParamChangeBackendDict, ParamChangeObjectFactory } from 'domain/exploration/ParamChangeObjectFactory';
import { FetchExplorationBackendResponse, ReadOnlyExplorationBackendApiService } from 'domain/exploration/read-only-exploration-backend-api.service';
import { StateCard } from 'domain/state_card/state-card.model';
import { ExpressionInterpolationService } from 'expressions/expression-interpolation.service';
import { TextInputRulesService } from 'interactions/TextInput/directives/text-input-rules.service';
import { AlertsService } from 'services/alerts.service';
import { ContextService } from 'services/context.service';
import { UrlService } from 'services/contextual/url.service';
import { ExplorationFeatures, ExplorationFeaturesBackendApiService } from 'services/exploration-features-backend-api.service';
import { AnswerClassificationService, InteractionRulesService } from './answer-classification.service';
import { AudioPreloaderService } from './audio-preloader.service';
import { ContentTranslationLanguageService } from './content-translation-language.service';
import { ExplorationEngineService } from './exploration-engine.service';
import { ImagePreloaderService } from './image-preloader.service';
import { LearnerParamsService } from './learner-params.service';
import { PlayerTranscriptService } from './player-transcript.service';
import { StatsReportingService } from './stats-reporting.service';
import { AudioTranslationLanguageService } from
  'pages/exploration-player-page/services/audio-translation-language.service';

describe('Exploration engine service ', () => {
  let alertsService: AlertsService;
  let answerClassificationService: AnswerClassificationService;
  let audioPreloaderService: AudioPreloaderService;
  let audioTranslationLanguageService: AudioTranslationLanguageService;
  let contextService: ContextService;
  let contentTranslationLanguageService: ContentTranslationLanguageService;
  let expressionInterpolationService: ExpressionInterpolationService;
  let explorationFeaturesBackendApiService:
    ExplorationFeaturesBackendApiService;
  let explorationEngineService: ExplorationEngineService;
  let explorationObjectFactory: ExplorationObjectFactory;
  let imagePreloaderService: ImagePreloaderService;
  let interactionObjectFactory: InteractionObjectFactory;
  let learnerParamsService: LearnerParamsService;
  let playerTranscriptService: PlayerTranscriptService;
  let readOnlyExplorationBackendApiService:
    ReadOnlyExplorationBackendApiService;
  let statsReportingService: StatsReportingService;
  let urlService: UrlService;
  let paramChangeObjectFactory: ParamChangeObjectFactory;
  let textInputService: InteractionRulesService;
  let translateService: TranslateService;
  let outcomeObjectFactory: OutcomeObjectFactory;
  let explorationDict: ExplorationBackendDict;
  let paramChangeDict: ParamChangeBackendDict;
  let explorationBackendResponse: FetchExplorationBackendResponse;
  let explorationFeatures: ExplorationFeatures;

  beforeEach(() => {
    explorationDict = {
      states: {
        Start: {
          classifier_model_id: null,
          recorded_voiceovers: {
            voiceovers_mapping: {
              ca_placeholder_0: {},
              feedback_1: {},
              rule_input_2: {},
              content: {},
              default_outcome: {}
            }
          },
          solicit_answer_details: false,
          interaction: {
            solution: null,
            confirmed_unclassified_answers: [],
            id: 'TextInput',
            hints: [],
            customization_args: {
              rows: {
                value: 1
              },
              placeholder: {
                value: {
                  unicode_str: '',
                  content_id: 'ca_placeholder_0'
                }
              },
              catchMisspellings: {
                value: false
              }
            },
            answer_groups: [
              {
                outcome: {
                  missing_prerequisite_skill_id: null,
                  refresher_exploration_id: null,
                  labelled_as_correct: false,
                  feedback: {
                    content_id: 'feedback_1',
                    html: '<p>Good Job</p>'
                  },
                  param_changes: [],
                  dest_if_really_stuck: 'Mid',
                  dest: 'Mid'
                },
                training_data: [],
                rule_specs: [
                  {
                    inputs: {
                      x: {
                        normalizedStrSet: [
                          'answer'
                        ],
                        contentId: 'rule_input_2'
                      }
                    },
                    rule_type: 'FuzzyEquals'
                  }
                ],
                tagged_skill_misconception_id: null
              }
            ],
            default_outcome: {
              missing_prerequisite_skill_id: null,
              refresher_exploration_id: null,
              labelled_as_correct: false,
              feedback: {
                content_id: 'default_outcome',
                html: '<p>Try again.</p>'
              },
              param_changes: [],
              dest_if_really_stuck: 'Mid',
              dest: 'Start'
            }
          },
          param_changes: [],
          card_is_checkpoint: true,
          linked_skill_id: null,
          content: {
            content_id: 'content',
            html: '<p>First Question</p>'
          }
        },
        End: {
          classifier_model_id: null,
          recorded_voiceovers: {
            voiceovers_mapping: {
              content: {}
            }
          },
          solicit_answer_details: false,
          interaction: {
            solution: null,
            confirmed_unclassified_answers: [],
            id: 'EndExploration',
            hints: [],
            customization_args: {
              recommendedExplorationIds: {
                value: ['recommnendedExplorationId']
              }
            },
            answer_groups: [],
            default_outcome: null
          },
          param_changes: [],
          card_is_checkpoint: false,
          linked_skill_id: null,
          content: {
            content_id: 'content',
            html: 'Congratulations, you have finished!'
          }
        },
        Mid: {
          classifier_model_id: null,
          recorded_voiceovers: {
            voiceovers_mapping: {
              ca_placeholder_0: {},
              feedback_1: {},
              rule_input_2: {},
              content: {},
              default_outcome: {}
            }
          },
          solicit_answer_details: false,
          interaction: {
            solution: null,
            confirmed_unclassified_answers: [],
            id: 'TextInput',
            hints: [],
            customization_args: {
              rows: {
                value: 1
              },
              placeholder: {
                value: {
                  unicode_str: '',
                  content_id: 'ca_placeholder_0'
                }
              },
              catchMisspellings: {
                value: false
              }
            },
            answer_groups: [
              {
                outcome: {
                  missing_prerequisite_skill_id: null,
                  refresher_exploration_id: null,
                  labelled_as_correct: false,
                  feedback: {
                    content_id: 'feedback_1',
                    html: ' <p>Good Job</p>'
                  },
                  param_changes: [],
                  dest_if_really_stuck: 'Mid',
                  dest: 'End'
                },
                training_data: [],
                rule_specs: [
                  {
                    inputs: {
                      x: {
                        normalizedStrSet: [
                          'answer'
                        ],
                        contentId: 'rule_input_2'
                      }
                    },
                    rule_type: 'FuzzyEquals'
                  }
                ],
                tagged_skill_misconception_id: null
              }
            ],
            default_outcome: {
              missing_prerequisite_skill_id: null,
              refresher_exploration_id: null,
              labelled_as_correct: false,
              feedback: {
                content_id: 'default_outcome',
                html: '<p>try again.</p>'
              },
              param_changes: [],
              dest_if_really_stuck: 'Mid',
              dest: 'Mid'
            }
          },
          param_changes: [],
          card_is_checkpoint: false,
          linked_skill_id: null,
          content: {
            content_id: 'content',
            html: '<p>Second Question</p>'
          }
        }
      },
      auto_tts_enabled: true,
      version: 2,
      param_specs: {
        x: {
          obj_type: 'UnicodeString'
        },
        y: {
          obj_type: 'UnicodeString'
        }
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
        edits_allowed: true
      }
    };

    paramChangeDict = {
      customization_args: {
        parse_with_jinja: false,
        value: 'val',
        list_of_values: ['val1, val2']
      },
      generator_id: 'Copier',
      name: 'answer'
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
        next_content_id_index: 1
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
        edits_allowed: true
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
      most_recently_reached_checkpoint_exp_version: 1
    };

    explorationFeatures = {
      explorationIsCurated: true,
      alwaysAskLearnersForAnswerDetails: true
    };
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
      ],
      providers: [
        {
          provide: TranslateService,
          useClass: MockTranslateService
        }
      ]
    });

    alertsService = TestBed.inject(AlertsService);
    answerClassificationService = TestBed.inject(AnswerClassificationService);
    audioPreloaderService = TestBed.inject(AudioPreloaderService);
    audioTranslationLanguageService = TestBed.inject(
      AudioTranslationLanguageService);
    contextService = TestBed.inject(ContextService);
    contentTranslationLanguageService = TestBed.inject(
      ContentTranslationLanguageService);
    expressionInterpolationService = TestBed.inject(
      ExpressionInterpolationService);
    explorationFeaturesBackendApiService = TestBed.inject(
      ExplorationFeaturesBackendApiService);
    explorationObjectFactory = TestBed.inject(ExplorationObjectFactory);
    interactionObjectFactory = TestBed.inject(InteractionObjectFactory);
    imagePreloaderService = TestBed.inject(ImagePreloaderService);
    learnerParamsService = TestBed.inject(LearnerParamsService);
    playerTranscriptService = TestBed.inject(PlayerTranscriptService);
    readOnlyExplorationBackendApiService = TestBed.inject(
      ReadOnlyExplorationBackendApiService);
    statsReportingService = TestBed.inject(StatsReportingService);
    urlService = TestBed.inject(UrlService);
    explorationEngineService = TestBed.inject(ExplorationEngineService);
    paramChangeObjectFactory = TestBed.inject(ParamChangeObjectFactory);
    textInputService = TestBed.inject(TextInputRulesService);
    translateService = TestBed.inject(TranslateService);
    outcomeObjectFactory = TestBed.inject(OutcomeObjectFactory);
  });

  beforeEach(() => {
    spyOn(contextService, 'getExplorationId').and.returnValue('explorationId');
    spyOn(urlService, 'getExplorationVersionFromUrl').and.returnValue(2);
    spyOn(contentTranslationLanguageService, 'init').and.returnValue(null);
    spyOn(imagePreloaderService, 'init').and.returnValue(null);
    spyOn(imagePreloaderService, 'kickOffImagePreloader').and.returnValue(null);
    spyOn(audioPreloaderService, 'init').and.returnValue(null);
    spyOn(audioPreloaderService, 'kickOffAudioPreloader').and.returnValue(null);
    spyOn(statsReportingService, 'recordExplorationStarted')
      .and.returnValue(null);
    spyOn(statsReportingService, 'recordAnswerSubmitted').and.returnValue(null);
    spyOn(statsReportingService, 'recordAnswerSubmitAction')
      .and.returnValue(null);
    spyOn(expressionInterpolationService, 'processHtml')
      .and.callFake((html, envs) => html);
    spyOn(readOnlyExplorationBackendApiService, 'loadExplorationAsync')
      .and.returnValue(Promise.resolve(explorationBackendResponse));
  });

  it('should load exploration when initialized in ' +
    'exploration player page', () => {
    let initSuccessCb = jasmine.createSpy('success');
    // Setting exploration player page.
    spyOn(contextService, 'isInExplorationEditorPage').and.returnValue(false);

    expect(explorationEngineService.isInPreviewMode()).toBe(false);
    expect(() => {
      explorationEngineService.getExplorationTitle();
    }).toThrowError('Cannot read properties of undefined (reading \'title\')');

    explorationEngineService.init(
      explorationDict, 1, null, true, ['en'], [], initSuccessCb);

    const explorationTitle = explorationEngineService.getExplorationTitle();
    expect(explorationTitle).toBe('My Exploration Title');
    expect(initSuccessCb).toHaveBeenCalled();
  });

  it('should load exploration when initialized in ' +
    'exploration editor page', () => {
    let initSuccessCb = jasmine.createSpy('success');
    let paramChanges = paramChangeObjectFactory.createFromBackendDict(
      paramChangeDict);
    // Setting exploration editor page.
    spyOn(contextService, 'isInExplorationEditorPage').and.returnValue(true);
    spyOn(urlService, 'getPathname')
      .and.returnValue('/create/in/path/name');
    spyOn(contextService, 'isInQuestionPlayerMode').and.returnValue(false);

    // Since the constructor will be automatically called in unit tests, it
    // is hard to test or spy on the constructor. So, we have created a
    // function to manually trigger and tests different edge cases.
    explorationEngineService.setExplorationProperties();

    expect(explorationEngineService.isInPreviewMode()).toBe(true);
    expect(() => {
      explorationEngineService.getExplorationTitle();
    }).toThrowError('Cannot read properties of undefined (reading \'title\')');

    explorationEngineService.initSettingsFromEditor('Start', [paramChanges]);
    explorationEngineService.init(
      explorationDict, 1, null, true, ['en'], [], initSuccessCb);

    const explorationTitle = explorationEngineService.getExplorationTitle();
    expect(explorationTitle).toBe('My Exploration Title');
    expect(initSuccessCb).toHaveBeenCalled();
  });

  describe('on submitting answer ', () => {
    it('should call success callback if the submitted ' +
      'answer is correct', () => {
      let initSuccessCb = jasmine.createSpy('success');
      let submitAnswerSuccessCb = jasmine.createSpy('success');
      let answer = 'answer';
      let answerClassificationResult = new AnswerClassificationResult(
        outcomeObjectFactory.createFromBackendDict({
          dest: 'Mid',
          dest_if_really_stuck: 'Mid',
          feedback: {
            content_id: 'feedback_1',
            html: 'Answer is correct!'
          },
          labelled_as_correct: true,
          param_changes: [],
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null
        }), 1, 0, 'default_outcome');

      let lastCard = StateCard.createNewCard(
        'Card 1', 'Content html', 'Interaction text', null,
        null, 'content_id', audioTranslationLanguageService);

      spyOn(contextService, 'isInExplorationEditorPage').and.returnValue(false);
      spyOn(playerTranscriptService, 'getLastStateName')
        .and.returnValue('Start');
      spyOn(playerTranscriptService, 'getLastCard').and.returnValue(lastCard);
      spyOn(answerClassificationService, 'getMatchingClassificationResult')
        .and.returnValue(answerClassificationResult);

      explorationEngineService.init(
        explorationDict, 1, null, true, ['en'], [], initSuccessCb);

      const isAnswerCorrect = explorationEngineService.submitAnswer(
        answer, textInputService, submitAnswerSuccessCb);

      expect(submitAnswerSuccessCb).toHaveBeenCalled();
      expect(explorationEngineService.isAnswerBeingProcessed()).toBe(false);
      expect(isAnswerCorrect).toBe(true);
    });

    it('should not submit answer again if the answer ' +
      'is already being processed', () => {
      let initSuccessCb = jasmine.createSpy('success');
      let submitAnswerSuccessCb = jasmine.createSpy('success');
      let answer = 'answer';
      let answerClassificationResult = new AnswerClassificationResult(
        outcomeObjectFactory.createFromBackendDict({
          dest: 'Mid',
          dest_if_really_stuck: 'Mid',
          feedback: {
            content_id: 'feedback_1',
            html: 'Answer is correct!'
          },
          labelled_as_correct: true,
          param_changes: [],
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null
        }), 1, 0, 'default_outcome');

      let lastCard = StateCard.createNewCard(
        'Card 1', 'Content html', 'Interaction text', null,
        null, 'content_id', audioTranslationLanguageService);

      spyOn(contextService, 'isInExplorationEditorPage').and.returnValue(false);
      spyOn(playerTranscriptService, 'getLastStateName')
        .and.returnValue('Start');
      spyOn(playerTranscriptService, 'getLastCard').and.returnValue(lastCard);
      spyOn(answerClassificationService, 'getMatchingClassificationResult')
        .and.returnValue(answerClassificationResult);

      explorationEngineService.init(
        explorationDict, 1, null, true, ['en'], [], initSuccessCb);

      // Setting answer is being processed to true.
      explorationEngineService.answerIsBeingProcessed = true;
      explorationEngineService.submitAnswer(
        answer, textInputService, submitAnswerSuccessCb);

      expect(submitAnswerSuccessCb).not.toHaveBeenCalled();
    });

    it('should show warning message if the feedback ' +
      'content is empty', () => {
      let initSuccessCb = jasmine.createSpy('success');
      let submitAnswerSuccessCb = jasmine.createSpy('success');
      let answer = 'answer';
      let answerClassificationResult = new AnswerClassificationResult(
        outcomeObjectFactory.createFromBackendDict({
          dest: 'Mid',
          dest_if_really_stuck: 'Mid',
          feedback: {
            content_id: 'feedback_1',
            html: null
          },
          labelled_as_correct: true,
          param_changes: [],
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null
        }), 1, 0, 'default_outcome');

      let lastCard = StateCard.createNewCard(
        'Card 1', 'Content html', 'Interaction text', null,
        null, 'content_id', audioTranslationLanguageService);

      spyOn(contextService, 'isInExplorationEditorPage').and.returnValue(false);
      spyOn(playerTranscriptService, 'getLastStateName')
        .and.returnValue('Start');
      spyOn(playerTranscriptService, 'getLastCard').and.returnValue(lastCard);
      spyOn(answerClassificationService, 'getMatchingClassificationResult')
        .and.returnValue(answerClassificationResult);
      let alertsServiceSpy = spyOn(
        alertsService, 'addWarning').and.callThrough();

      explorationEngineService.init(
        explorationDict, 1, null, true, ['en'], [], initSuccessCb);

      explorationEngineService.submitAnswer(
        answer, textInputService, submitAnswerSuccessCb);

      expect(alertsServiceSpy)
        .toHaveBeenCalledWith('Feedback content should not be empty.');
    });

    it('should show warning message if the parameters ' +
      'are empty', () => {
      let initSuccessCb = jasmine.createSpy('success');
      let submitAnswerSuccessCb = jasmine.createSpy('success');
      let answer = 'answer';
      let answerClassificationResult = new AnswerClassificationResult(
        outcomeObjectFactory.createFromBackendDict({
          dest: 'Mid',
          dest_if_really_stuck: 'Mid',
          feedback: {
            content_id: 'feedback_1',
            html: 'feedback'
          },
          labelled_as_correct: true,
          param_changes: [],
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null
        }), 1, 0, 'default_outcome');

      let lastCard = StateCard.createNewCard(
        'Card 1', 'Content html', 'Interaction text', null,
        null, 'content_id', audioTranslationLanguageService);

      spyOn(contextService, 'isInExplorationEditorPage').and.returnValue(false);
      spyOn(playerTranscriptService, 'getLastStateName')
        .and.returnValue('Start');
      spyOn(playerTranscriptService, 'getLastCard').and.returnValue(lastCard);
      spyOn(answerClassificationService, 'getMatchingClassificationResult')
        .and.returnValue(answerClassificationResult);
      let alertsServiceSpy = spyOn(
        alertsService, 'addWarning').and.callThrough();
      spyOn(learnerParamsService, 'getAllParams').and.returnValue({});
      spyOn(explorationEngineService, 'makeParams')
        .and.returnValue(null);

      explorationEngineService.init(
        explorationDict, 1, null, true, ['en'], [], initSuccessCb);

      explorationEngineService.submitAnswer(
        answer, textInputService, submitAnswerSuccessCb);

      expect(alertsServiceSpy)
        .toHaveBeenCalledWith('Parameters should not be empty.');
    });

    it('should show warning message if the question ' +
      'name is empty', () => {
      let initSuccessCb = jasmine.createSpy('success');
      let submitAnswerSuccessCb = jasmine.createSpy('success');
      let answer = 'answer';
      let answerClassificationResult = new AnswerClassificationResult(
        outcomeObjectFactory.createFromBackendDict({
          dest: 'Mid',
          dest_if_really_stuck: 'Mid',
          feedback: {
            content_id: 'feedback_1',
            html: 'feedback'
          },
          labelled_as_correct: true,
          param_changes: [],
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null
        }), 1, 0, 'default_outcome');

      let lastCard = StateCard.createNewCard(
        'Card 1', 'Content html', 'Interaction text', null,
        null, 'content_id', audioTranslationLanguageService);

      spyOn(contextService, 'isInExplorationEditorPage').and.returnValue(false);
      spyOn(playerTranscriptService, 'getLastStateName')
        .and.returnValue('Start');
      spyOn(playerTranscriptService, 'getLastCard').and.returnValue(lastCard);
      spyOn(answerClassificationService, 'getMatchingClassificationResult')
        .and.returnValue(answerClassificationResult);
      spyOn(explorationEngineService, 'makeQuestion')
        .and.returnValue(null);
      let alertsServiceSpy = spyOn(
        alertsService, 'addWarning').and.callThrough();

      explorationEngineService.init(
        explorationDict, 1, null, true, ['en'], [], initSuccessCb);

      explorationEngineService.submitAnswer(
        answer, textInputService, submitAnswerSuccessCb);

      expect(alertsServiceSpy)
        .toHaveBeenCalledWith('Question content should not be empty.');
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
          html: 'default feedback'
        },
        labelled_as_correct: false,
        param_changes: [],
        refresher_exploration_id: null,
        missing_prerequisite_skill_id: null
      };
      let answerClassificationResult = new AnswerClassificationResult(
        outcomeObjectFactory.createFromBackendDict(defaultOutcomeDict),
        1, 0, 'default_outcome');

      const lastCardInteraction =
        interactionObjectFactory.createFromBackendDict({
          id: 'TextInput',
          answer_groups: [
            {
              outcome: {
                missing_prerequisite_skill_id: null,
                refresher_exploration_id: null,
                labelled_as_correct: true,
                feedback: {
                  content_id: 'feedback_1',
                  html: '<p>Good Job</p>'
                },
                param_changes: [],
                dest_if_really_stuck: null,
                dest: 'Mid'
              },
              training_data: [],
              rule_specs: [
                {
                  inputs: {
                    x: {
                      normalizedStrSet: [
                        'answer'
                      ],
                      contentId: 'rule_input_2'
                    }
                  },
                  rule_type: 'Equals'
                }
              ],
              tagged_skill_misconception_id: null
            }
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
            }
          },
          hints: [],
          solution: null
        });
      const lastCard = StateCard.createNewCard(
        'Card 1', 'Content html', 'Interaction text', lastCardInteraction,
        null, 'content_id', audioTranslationLanguageService);

      spyOn(contextService, 'isInExplorationEditorPage').and.returnValue(false);
      spyOn(playerTranscriptService, 'getLastStateName')
        .and.returnValue('Start');
      spyOn(playerTranscriptService, 'getLastCard').and.returnValue(lastCard);
      spyOn(answerClassificationService, 'getMatchingClassificationResult')
        .and.returnValue(answerClassificationResult);
      spyOn(translateService, 'instant').and.callFake((key) => {
        if ((key as string)
          .startsWith('I18N_ANSWER_MISSPELLED_RESPONSE_TEXT')) {
          return 'misspelled feedback';
        }
      });

      explorationEngineService.init(
        explorationDict, 1, null, true, ['en'], [], initSuccessCb);

      explorationEngineService.submitAnswer(
        answer, textInputService, submitAnswerSuccessCb);

      expect(submitAnswerSuccessCb).toHaveBeenCalled();
      const feedbackArgPosition = 2;
      expect(submitAnswerSuccessCb.calls.argsFor(0)[feedbackArgPosition])
        .toBe('misspelled feedback');

      // Make outcome non-default, so that misspelling is not checked anymore.
      answerClassificationResult.outcome.dest = 'End';
      answerClassificationService.getMatchingClassificationResult =
        jasmine.createSpy().and.returnValue(answerClassificationResult);

      explorationEngineService.submitAnswer(
        answer, textInputService, submitAnswerSuccessCb);
      expect(submitAnswerSuccessCb).toHaveBeenCalledTimes(2);
      expect(submitAnswerSuccessCb.calls.argsFor(1)[feedbackArgPosition])
        .toBe('default feedback');
    });
  });

  it('should check whether we can ask learner for answer ' +
    'details', fakeAsync(() => {
    let initSuccessCb = jasmine.createSpy('success');

    spyOn(contextService, 'isInExplorationEditorPage').and.returnValue(false);
    spyOn(explorationFeaturesBackendApiService, 'fetchExplorationFeaturesAsync')
      .and.returnValue(Promise.resolve(explorationFeatures));

    // Here default value is set to false.
    expect(explorationEngineService.getAlwaysAskLearnerForAnswerDetails())
      .toBe(false);

    explorationEngineService.init(
      explorationDict, 1, null, true, ['en'], [], initSuccessCb);
    tick();

    const answerDetails = (
      explorationEngineService.getAlwaysAskLearnerForAnswerDetails());
    expect(answerDetails).toBe(true);
  }));

  it('should return default exploration id', () => {
    // Please note that default exploration id is 'test_id'.
    // This is being initialized in the constructor.

    const explorationId = explorationEngineService.getExplorationId();
    expect(explorationId).toBe('test_id');
  });

  it('should return exploration title ' +
    'when calling \'getExplorationTitle\'', () => {
    let initSuccessCb = jasmine.createSpy('success');

    spyOn(contextService, 'isInExplorationEditorPage').and.returnValue(false);

    expect(() => {
      explorationEngineService.getExplorationTitle();
    }).toThrowError('Cannot read properties of undefined (reading \'title\')');

    explorationEngineService.init(
      explorationDict, 1, null, true, ['en'], [], initSuccessCb);

    const explorationTitle = explorationEngineService.getExplorationTitle();
    expect(explorationTitle).toBe('My Exploration Title');
  });

  it('should return exploration version ' +
    'when calling \'getExplorationVersion\'', () => {
    let initSuccessCb = jasmine.createSpy('success');

    spyOn(contextService, 'isInExplorationEditorPage').and.returnValue(false);

    // Here 1 is default value, this is being initialized in the constructor.
    expect(explorationEngineService.getExplorationVersion()).toBe(1);

    explorationEngineService.init(
      explorationDict, 2, null, true, ['en'], [], initSuccessCb);

    const explorationVersion = explorationEngineService.getExplorationVersion();
    expect(explorationVersion).toBe(2);
  });

  it('should return author recommended exploration id\'s ' +
    'when calling \'getAuthorRecommendedExpIdsByStateName\'', () => {
    let initSuccessCb = jasmine.createSpy('success');

    spyOn(contextService, 'isInExplorationEditorPage').and.returnValue(false);

    expect(() => {
      explorationEngineService.getAuthorRecommendedExpIdsByStateName('Start');
    }).toThrowError(
      'Cannot read properties of undefined ' +
      '(reading \'getAuthorRecommendedExpIds\')');

    explorationEngineService.init(
      explorationDict, 1, null, true, ['en'], [], initSuccessCb);

    expect(() => {
      explorationEngineService.getAuthorRecommendedExpIdsByStateName('Start');
    }).toThrowError(
      'Tried to get recommendations for a non-terminal state: Start');

    // Please note that in order to get author recommended exploration id's
    // current should be the last state.
    const recommendedId = explorationEngineService
      .getAuthorRecommendedExpIdsByStateName('End');
    expect(recommendedId).toContain('recommnendedExplorationId');
  });

  it('should update current state when an answer is submitted ' +
    'and a new card is recorded', () => {
    let initSuccessCb = jasmine.createSpy('success');
    let submitAnswerSuccessCb = jasmine.createSpy('success');
    let answer = 'answer';
    let answerClassificationResult = new AnswerClassificationResult(
      outcomeObjectFactory.createFromBackendDict({
        dest: 'Mid',
        dest_if_really_stuck: 'Mid',
        feedback: {
          content_id: 'feedback_1',
          html: 'Answer is correct!'
        },
        labelled_as_correct: true,
        param_changes: [],
        refresher_exploration_id: null,
        missing_prerequisite_skill_id: null
      }), 1, 0, 'default_outcome');

    let lastCard = StateCard.createNewCard(
      'Card 1', 'Content html', 'Interaction text', null,
      null, 'content_id', audioTranslationLanguageService);

    spyOn(contextService, 'isInExplorationEditorPage').and.returnValue(false);
    spyOn(playerTranscriptService, 'getLastStateName')
      .and.returnValue('Start');
    spyOn(playerTranscriptService, 'getLastCard').and.returnValue(lastCard);
    spyOn(answerClassificationService, 'getMatchingClassificationResult')
      .and.returnValue(answerClassificationResult);

    expect(explorationEngineService.currentStateName).toBe(undefined);

    explorationEngineService.init(
      explorationDict, 1, null, true, ['en'], [], initSuccessCb);

    explorationEngineService.submitAnswer(
      answer, textInputService, submitAnswerSuccessCb);
    expect(explorationEngineService.currentStateName).toBe('Start');
    explorationEngineService.recordNewCardAdded();
    expect(explorationEngineService.currentStateName).toBe('Mid');
  });

  it('should load initial state when moved to new exploration', () => {
    let moveToExplorationCb = jasmine.createSpy('success');
    spyOn(contextService, 'isInExplorationEditorPage').and.returnValue(false);

    explorationEngineService.exploration = explorationObjectFactory
      .createFromBackendDict(explorationDict);

    let currentStateName = explorationEngineService.currentStateName;
    expect(currentStateName).toBe(undefined);

    // Please note that we are not calling init funtion here.
    explorationEngineService.moveToExploration(moveToExplorationCb);

    currentStateName = explorationEngineService.currentStateName;
    let initalState = explorationEngineService.exploration.initStateName;
    expect(currentStateName).toBe(initalState);
  });

  it('should return true if current state is initial state ' +
    'when calling \'isCurrentStateInitial\'', () => {
    let initSuccessCb = jasmine.createSpy('success');

    spyOn(contextService, 'isInExplorationEditorPage').and.returnValue(false);

    expect(() => {
      explorationEngineService.isCurrentStateInitial();
    }).toThrowError(
      'Cannot read properties of undefined (reading \'initStateName\')');

    explorationEngineService.init(
      explorationDict, 1, null, true, ['en'], [], initSuccessCb);

    expect(explorationEngineService.isCurrentStateInitial()).toBe(true);
  });

  it('should return current state when calling \'getState\'', () => {
    let initSuccessCb = jasmine.createSpy('success');
    spyOn(contextService, 'isInExplorationEditorPage').and.returnValue(false);
    let lastStateNameSpy = spyOn(playerTranscriptService, 'getLastStateName');

    expect(() => {
      explorationEngineService.getState();
    }).toThrowError(
      'Cannot read properties of undefined (reading \'getState\')');

    explorationEngineService.init(
      explorationDict, 1, null, true, ['en'], [], initSuccessCb);

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

  it('should return language code when calling \'getLanguageCode\'', () => {
    let initSuccessCb = jasmine.createSpy('success');
    spyOn(contextService, 'isInExplorationEditorPage').and.returnValue(false);

    expect(() => {
      explorationEngineService.getLanguageCode();
    }).toThrowError(
      'Cannot read properties of undefined (reading \'getLanguageCode\')');

    // First exploration has language code 'en'.
    explorationEngineService.init(
      explorationDict, 1, null, true, ['en'], [], initSuccessCb);
    expect(explorationEngineService.getLanguageCode()).toBe('en');

    // Setting next exploration language code to 'bn'.
    explorationDict.language_code = 'bn';
    explorationEngineService.init(
      explorationDict, 1, null, true, ['en'], [], initSuccessCb);
    expect(explorationEngineService.getLanguageCode()).toBe('bn');
  });

  it('should get the update active state event emitter', () => {
    let mockEventEmitter = new EventEmitter();
    expect(explorationEngineService.onUpdateActiveStateIfInEditor)
      .toEqual(mockEventEmitter);
  });

  it('should throw error if we populate exploration data ' +
    'in exploration player page', () => {
    // Please note that 'initSettingsFromEditor' function is strictly
    // used for the exploration editor page before initialization.
    // This method should not be called from the exploration player page.
    let paramChanges = paramChangeObjectFactory.createFromBackendDict(
      paramChangeDict);

    // Checking if we are currently in exploration editor preview mode.
    expect(explorationEngineService.isInPreviewMode()).toBe(false);
    expect(() => {
      explorationEngineService.initSettingsFromEditor('Start', [paramChanges]);
    }).toThrowError('Cannot populate exploration in learner mode.');
  });

  it('should return state when calling \'getStateFromStateName\'', () => {
    let initSuccessCb = jasmine.createSpy('success');
    spyOn(contextService, 'isInExplorationEditorPage').and.returnValue(false);

    expect(() => {
      explorationEngineService.getStateFromStateName('Start');
    }).toThrowError(
      'Cannot read properties of undefined (reading \'getState\')'
    );

    explorationEngineService.init(
      explorationDict, 1, null, true, ['en'], [], initSuccessCb);

    // Check for first state.
    let state = explorationEngineService.getStateFromStateName('Start');

    expect(state.name).toBe('Start');

    // Check for second state.
    state = explorationEngineService.getStateFromStateName('Mid');

    expect(state.name).toBe('Mid');
  });

  it('should return state card when calling \'getStateCardByName\'', () => {
    let initSuccessCb = jasmine.createSpy('success');
    spyOn(contextService, 'isInExplorationEditorPage').and.returnValue(false);

    expect(() => {
      explorationEngineService.getStateCardByName('Start');
    }).toThrowError(
      'Cannot read properties of undefined (reading \'getInteraction\')'
    );

    explorationEngineService.init(
      explorationDict, 1, null, true, ['en'], [], initSuccessCb);

    // Check for first state.
    let stateCard = explorationEngineService.getStateCardByName('Start');

    expect(stateCard.getStateName()).toBe('Start');

    // Check for second state.
    stateCard = explorationEngineService.getStateCardByName('Mid');

    expect(stateCard.getStateName()).toBe('Mid');
  });

  it('should return shortest path to state when calling ' +
    '\'getShortestPathToState\'', () => {
    let initSuccessCb = jasmine.createSpy('success');
    spyOn(contextService, 'isInExplorationEditorPage').and.returnValue(false);

    explorationEngineService.init(
      explorationDict, 1, null, true, ['en'], [], initSuccessCb);

    // Check for first state.
    let shortestPathToState = explorationEngineService.getShortestPathToState(
      explorationDict.states, 'Mid');

    expect(shortestPathToState).toEqual(['Start', 'Mid']);
  });

  describe('on validating parameters ', () => {
    it('should create new parameters successfully', () => {
      paramChangeDict.customization_args.parse_with_jinja = true;
      paramChangeDict.generator_id = 'not_copier';

      let oldParams = {
        guess: '-1',
        answer: 'val'
      };

      let expectedParams = {
        guess: '-1',
        answer: 'val1, val2'
      };

      let paramChanges = paramChangeObjectFactory.createFromBackendDict(
        paramChangeDict);
      const newParams = explorationEngineService.makeParams(
        oldParams, [paramChanges], []);
      expect(newParams).toEqual(expectedParams);
    });

    it('should not create new parameters if paramater ' +
      'values are empty', () => {
      paramChangeDict.customization_args.parse_with_jinja = true;
      let oldParams = {};

      let paramChanges = paramChangeObjectFactory.createFromBackendDict(
        paramChangeDict);
      spyOn(expressionInterpolationService, 'processUnicode')
        .and.returnValue(null);

      const newParams = explorationEngineService.makeParams(
        oldParams, [paramChanges], []);

      expect(newParams).toBe(null);
    });

    it('should return old parameters', () => {
      paramChangeDict.customization_args.parse_with_jinja = true;
      let oldParams = {
        guess: '-1',
        answer: 'val'
      };

      let paramChanges = paramChangeObjectFactory.createFromBackendDict(
        paramChangeDict);
      const newParams = explorationEngineService
        .makeParams(oldParams, [paramChanges], []);

      expect(newParams).toEqual(oldParams);
    });
  });
});
