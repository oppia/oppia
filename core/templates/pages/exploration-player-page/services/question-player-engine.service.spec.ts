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
 * @fileoverview Unit tests for the question player engine service.
 */

import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { AnswerClassificationResult } from 'domain/classifier/answer-classification-result.model';
import { FetchExplorationBackendResponse, ReadOnlyExplorationBackendApiService } from 'domain/exploration/read-only-exploration-backend-api.service';
import { QuestionBackendDict, QuestionObjectFactory } from 'domain/question/QuestionObjectFactory';
import { ExpressionInterpolationService } from 'expressions/expression-interpolation.service';
import { AlertsService } from 'services/alerts.service';
import { ContextService } from 'services/context.service';
import { UrlService } from 'services/contextual/url.service';
import { AnswerClassificationService, InteractionRulesService } from './answer-classification.service';
import { QuestionPlayerEngineService } from './question-player-engine.service';

describe('Question player engine service ', () => {
  let alertsService: AlertsService;
  let answerClassificationService: AnswerClassificationService;
  let contextService: ContextService;
  let expressionInterpolationService: ExpressionInterpolationService;
  let questionObjectFactory: QuestionObjectFactory;
  let readOnlyExplorationBackendApiService:
    ReadOnlyExplorationBackendApiService;
  let questionPlayerEngineService: QuestionPlayerEngineService;
  let urlService: UrlService;

  let singleQuestionBackendDict: QuestionBackendDict;
  let multipleQuestionBackendDict: QuestionBackendDict[];
  let sampleExplorationDict: FetchExplorationBackendResponse;

  beforeEach(() => {
    singleQuestionBackendDict = {
      id: 'questionId1',
      question_state_data: {
        classifier_model_id: null,
        param_changes: [],
        next_content_id_index: 1,
        solicit_answer_details: false,
        content: {
          content_id: '1',
          html: 'Question 1'
        },
        written_translations: {
          translations_mapping: {
            1: {},
            ca_placeholder_0: {},
            feedback_id: {},
            solution: {},
            hint_1: {}
          }
        },
        interaction: {
          answer_groups: [{
            outcome: {
              dest: 'State 1',
              feedback: {
                content_id: 'feedback_1',
                html: '<p>Try Again.</p>'
              },
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null,
              labelled_as_correct: null,
            },
            rule_specs: [{
              rule_type: 'Equals',
              inputs: {x: 0}
            }],
            training_data: null,
            tagged_skill_misconception_id: null,
          },
          {
            outcome: {
              dest: 'State 2',
              feedback: {
                content_id: 'feedback_2',
                html: '<p>Try Again.</p>'
              },
              param_changes: [],
              refresher_exploration_id: null,
              missing_prerequisite_skill_id: null,
              labelled_as_correct: null,
            },
            rule_specs: [{
              rule_type: 'Equals',
              inputs: {x: 0}
            }],
            training_data: null,
            tagged_skill_misconception_id: 'misconceptionId',
          }],
          default_outcome: {
            dest: null,
            labelled_as_correct: true,
            missing_prerequisite_skill_id: null,
            refresher_exploration_id: null,
            param_changes: [],
            feedback: {
              content_id: 'feedback_id',
              html: '<p>Dummy Feedback</p>'
            }
          },
          id: 'TextInput',
          customization_args: {
            rows: {
              value: 1
            },
            placeholder: {
              value: {
                unicode_str: '',
                content_id: 'ca_placeholder_0'
              }
            }
          },
          confirmed_unclassified_answers: [],
          hints: [
            {
              hint_content: {
                content_id: 'hint_1',
                html: '<p>This is a hint.</p>'
              }
            }
          ],
          solution: {
            correct_answer: 'Solution',
            explanation: {
              content_id: 'solution',
              html: '<p>This is a solution.</p>'
            },
            answer_is_exclusive: false
          }
        },
        linked_skill_id: null,
        card_is_checkpoint: true,
        recorded_voiceovers: {
          voiceovers_mapping: {
            1: {},
            ca_placeholder_0: {},
            feedback_id: {},
            solution: {},
            hint_1: {}
          }
        }
      },
      question_state_data_schema_version: 45,
      language_code: 'en',
      version: 1,
      linked_skill_ids: [],
      inapplicable_skill_misconception_ids: [],
    };

    multipleQuestionBackendDict = [{
      id: 'questionId1',
      question_state_data: {
        classifier_model_id: null,
        param_changes: [],
        next_content_id_index: 1,
        solicit_answer_details: false,
        content: {
          content_id: '1',
          html: 'Question 1'
        },
        written_translations: {
          translations_mapping: {
            1: {},
            ca_placeholder_0: {},
            feedback_id: {},
            solution: {},
            hint_1: {}
          }
        },
        interaction: {
          answer_groups: [],
          default_outcome: {
            dest: null,
            labelled_as_correct: true,
            missing_prerequisite_skill_id: null,
            refresher_exploration_id: null,
            param_changes: [],
            feedback: {
              content_id: 'feedback_id',
              html: '<p>Dummy Feedback</p>'
            }
          },
          id: 'TextInput',
          customization_args: {
            rows: {
              value: 1
            },
            placeholder: {
              value: {
                unicode_str: '',
                content_id: 'ca_placeholder_0'
              }
            }
          },
          confirmed_unclassified_answers: [],
          hints: [
            {
              hint_content: {
                content_id: 'hint_1',
                html: '<p>This is a hint.</p>'
              }
            }
          ],
          solution: {
            correct_answer: 'Solution',
            explanation: {
              content_id: 'solution',
              html: '<p>This is a solution.</p>'
            },
            answer_is_exclusive: false
          }
        },
        linked_skill_id: null,
        card_is_checkpoint: true,
        recorded_voiceovers: {
          voiceovers_mapping: {
            1: {},
            ca_placeholder_0: {},
            feedback_id: {},
            solution: {},
            hint_1: {}
          }
        }
      },
      question_state_data_schema_version: 45,
      language_code: 'en',
      version: 1,
      linked_skill_ids: [],
      inapplicable_skill_misconception_ids: [],
    },
    {
      id: 'questionId2',
      question_state_data: {
        classifier_model_id: null,
        param_changes: [],
        next_content_id_index: 2,
        solicit_answer_details: false,
        content: {
          content_id: '2',
          html: 'Question 2'
        },
        written_translations: {
          translations_mapping: {
            1: {},
            ca_placeholder_0: {},
            feedback_id: {},
            solution: {},
            hint_1: {}
          }
        },
        interaction: {
          answer_groups: [],
          default_outcome: {
            dest: null,
            labelled_as_correct: true,
            missing_prerequisite_skill_id: null,
            refresher_exploration_id: null,
            param_changes: [],
            feedback: {
              content_id: 'feedback_id',
              html: '<p>Dummy Feedback</p>'
            }
          },
          id: 'TextInput',
          customization_args: {
            rows: {
              value: 1
            },
            placeholder: {
              value: {
                unicode_str: '',
                content_id: 'ca_placeholder_0'
              }
            }
          },
          confirmed_unclassified_answers: [],
          hints: [
            {
              hint_content: {
                content_id: 'hint_1',
                html: '<p>This is a hint.</p>'
              }
            }
          ],
          solution: {
            correct_answer: 'Solution',
            explanation: {
              content_id: 'solution',
              html: '<p>This is a solution.</p>'
            },
            answer_is_exclusive: false
          }
        },
        linked_skill_id: null,
        card_is_checkpoint: true,
        recorded_voiceovers: {
          voiceovers_mapping: {
            1: {},
            ca_placeholder_0: {},
            feedback_id: {},
            solution: {},
            hint_1: {}
          }
        }
      },
      question_state_data_schema_version: 45,
      language_code: 'br',
      version: 1,
      linked_skill_ids: [],
      inapplicable_skill_misconception_ids: [],
    },
    {
      id: 'questionId3',
      question_state_data: {
        classifier_model_id: null,
        param_changes: [],
        next_content_id_index: 1,
        solicit_answer_details: false,
        content: {
          content_id: '3',
          html: 'Question 3'
        },
        written_translations: {
          translations_mapping: {
            1: {},
            ca_placeholder_0: {},
            feedback_id: {},
            solution: {},
            hint_1: {}
          }
        },
        interaction: {
          answer_groups: [],
          default_outcome: {
            dest: null,
            labelled_as_correct: true,
            missing_prerequisite_skill_id: null,
            refresher_exploration_id: null,
            param_changes: [],
            feedback: {
              content_id: 'feedback_id',
              html: '<p>Dummy Feedback</p>'
            }
          },
          id: 'TextInput',
          customization_args: {
            rows: {
              value: 1
            },
            placeholder: {
              value: {
                unicode_str: '',
                content_id: 'ca_placeholder_0'
              }
            }
          },
          confirmed_unclassified_answers: [],
          hints: [
            {
              hint_content: {
                content_id: 'hint_1',
                html: '<p>This is a hint.</p>'
              }
            }
          ],
          solution: {
            correct_answer: 'Solution',
            explanation: {
              content_id: 'solution',
              html: '<p>This is a solution.</p>'
            },
            answer_is_exclusive: false
          }
        },
        linked_skill_id: null,
        card_is_checkpoint: true,
        recorded_voiceovers: {
          voiceovers_mapping: {
            1: {},
            ca_placeholder_0: {},
            feedback_id: {},
            solution: {},
            hint_1: {}
          }
        }
      },
      question_state_data_schema_version: 45,
      language_code: 'ab',
      version: 1,
      linked_skill_ids: [],
      inapplicable_skill_misconception_ids: [],
    }];
    sampleExplorationDict = {
      exploration_id: 'explorationId1',
      is_logged_in: true,
      session_id: 'KERH',
      exploration: {
        init_state_name: 'Introduction',
        param_changes: [],
        param_specs: null,
        title: 'Exploration',
        language_code: 'en',
        correctness_feedback_enabled: true,
        objective: 'To learn',
        states: {
          Introduction: {
            param_changes: [],
            classifier_model_id: null,
            recorded_voiceovers: null,
            solicit_answer_details: true,
            card_is_checkpoint: true,
            written_translations: null,
            linked_skill_id: null,
            next_content_id_index: null,
            content: {
              html: '',
              content_id: 'content'
            },
            interaction: {
              customization_args: {},
              answer_groups: [],
              solution: null,
              hints: [],
              default_outcome: {
                param_changes: [],
                dest: 'Introduction',
                feedback: {
                  html: '',
                  content_id: 'content'
                },
                labelled_as_correct: true,
                refresher_exploration_id: 'exp',
                missing_prerequisite_skill_id: null
              },
              confirmed_unclassified_answers: [],
              id: null
            }
          }
        }
      },
      version: 1,
      can_edit: true,
      preferred_audio_language_code: 'en',
      preferred_language_codes: [],
      auto_tts_enabled: true,
      correctness_feedback_enabled: true,
      record_playthrough_probability: 1
    };
  });

  beforeEach(() => {
    alertsService = TestBed.inject(AlertsService);
    answerClassificationService = TestBed.inject(AnswerClassificationService);
    contextService = TestBed.inject(ContextService);
    expressionInterpolationService =
      TestBed.inject(ExpressionInterpolationService);
    questionObjectFactory = TestBed.inject(QuestionObjectFactory);
    readOnlyExplorationBackendApiService = TestBed.inject(
      ReadOnlyExplorationBackendApiService);
    questionPlayerEngineService = TestBed.inject(QuestionPlayerEngineService);
    urlService = TestBed.inject(UrlService);
  });

  it('should load questions when initialized', () => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    let questionPlayerSpy =
      spyOn(contextService, 'setQuestionPlayerIsOpen').and.returnValue(null);
    let explorationIdSpy = spyOn(contextService, 'getExplorationId')
      .and.returnValue('explorationId1');
    let questionPlayerModeSpy =
      spyOn(contextService, 'isInQuestionPlayerMode').and.returnValue(true);
    let versionSpy =
      spyOn(urlService, 'getExplorationVersionFromUrl').and.returnValue(1);

    questionPlayerEngineService.init(
      multipleQuestionBackendDict, successHandler, failHandler);

    expect(questionPlayerSpy).toHaveBeenCalled();
    expect(explorationIdSpy).toHaveBeenCalled();
    expect(questionPlayerModeSpy).toHaveBeenCalled();
    expect(versionSpy).toHaveBeenCalled();
    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
    expect(questionPlayerEngineService.getExplorationId())
      .toBe('explorationId1');
    expect(questionPlayerEngineService.questionPlayerMode).toBe(true);
    expect(questionPlayerEngineService.getExplorationVersion()).toBe(1);
    expect(questionPlayerEngineService.questions.length).toBe(3);
  });

  it('should update the exploration version if it' +
    'is not in question player mode when initialized', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let exploration = sampleExplorationDict;
    exploration.version = 2;

    spyOn(contextService, 'setQuestionPlayerIsOpen').and.returnValue(null);
    spyOn(contextService, 'getExplorationId').and.returnValue('explorationId1');
    spyOn(contextService, 'isInQuestionPlayerMode').and.returnValue(false);
    spyOn(urlService, 'getExplorationVersionFromUrl').and.returnValue(1);

    let readOnlySpy =
      spyOn(readOnlyExplorationBackendApiService, 'loadExplorationAsync')
        .and.callFake((expID, version) => {
          expect(version).toBe(1);
          return Promise.resolve(exploration);
        });

    questionPlayerEngineService.init(
      multipleQuestionBackendDict, successHandler, failHandler);
    tick();

    expect(questionPlayerEngineService.questionPlayerMode).toBe(false);
    expect(readOnlySpy).toHaveBeenCalled();
    expect(questionPlayerEngineService.getExplorationVersion()).toBe(2);
  }));

  it('should return the current question', () => {
    let successCallback = jasmine.createSpy('success');
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let exploration = sampleExplorationDict;
    let answer = 'answer';
    let interactionRulesService: InteractionRulesService;
    let answerClassificationResult: AnswerClassificationResult = {
      answerGroupIndex: 0,
      classificationCategorization: 'default_outcome',
      outcome: {
        dest: null,
        feedback: {
          _contentId: 'feedback_id',
          _html: '<p>Dummy Feedback</p>',
          contentId: 'feedback_id',
          html: '<p>Dummy Feedback</p>',
        },
        labelledAsCorrect: true,
        missingPrerequisiteSkillId: null,
        paramChanges: [],
        refresherExplorationId: null,
      },
      ruleIndex: 0
    } as unknown as AnswerClassificationResult;

    spyOn(contextService, 'setQuestionPlayerIsOpen').and.returnValue(null);
    spyOn(contextService, 'getExplorationId').and.returnValue('explorationId1');
    spyOn(contextService, 'isInQuestionPlayerMode').and.returnValue(true);
    spyOn(urlService, 'getExplorationVersionFromUrl').and.returnValue(1);
    spyOn(readOnlyExplorationBackendApiService, 'loadExplorationAsync')
      .and.returnValue(Promise.resolve(exploration));
    let answerClassificationServiceSpy =
      spyOn(answerClassificationService, 'getMatchingClassificationResult')
        .and.returnValue(answerClassificationResult);
    spyOn(expressionInterpolationService, 'processHtml')
      .and.callFake((html, envs) => {
        if (html === null) {
          return null;
        }
        return html;
      });

    questionPlayerEngineService.init(
      multipleQuestionBackendDict, successHandler, failHandler);
    let currentQuestion1 = questionPlayerEngineService.getCurrentQuestion();
    expect(currentQuestion1.getId()).toBe('questionId1');

    questionPlayerEngineService.submitAnswer(
      answer, interactionRulesService, successCallback);
    questionPlayerEngineService.recordNewCardAdded();
    let currentQuestion2 = questionPlayerEngineService.getCurrentQuestion();

    expect(answerClassificationServiceSpy).toHaveBeenCalled();
    expect(currentQuestion2.getId()).toBe('questionId2');
  });

  it('should return the current question Id', () => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let exploration = sampleExplorationDict;

    spyOn(contextService, 'setQuestionPlayerIsOpen').and.returnValue(null);
    spyOn(contextService, 'getExplorationId').and.returnValue('explorationId1');
    spyOn(contextService, 'isInQuestionPlayerMode').and.returnValue(true);
    spyOn(urlService, 'getExplorationVersionFromUrl').and.returnValue(1);
    spyOn(readOnlyExplorationBackendApiService, 'loadExplorationAsync')
      .and.returnValue(Promise.resolve(exploration));

    questionPlayerEngineService.init(
      multipleQuestionBackendDict, successHandler, failHandler);
    let currentQuestionId = questionPlayerEngineService.getCurrentQuestionId();

    expect(currentQuestionId).toBe('questionId1');
  });

  it('should return number of questions', () => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let exploration = sampleExplorationDict;

    spyOn(contextService, 'setQuestionPlayerIsOpen').and.returnValue(null);
    spyOn(contextService, 'getExplorationId').and.returnValue('explorationId1');
    spyOn(contextService, 'isInQuestionPlayerMode').and.returnValue(true);
    spyOn(urlService, 'getExplorationVersionFromUrl').and.returnValue(1);
    spyOn(readOnlyExplorationBackendApiService, 'loadExplorationAsync')
      .and.returnValue(Promise.resolve(exploration));

    questionPlayerEngineService.init(
      multipleQuestionBackendDict, successHandler, failHandler);
    let totalQuestions = questionPlayerEngineService.getQuestionCount();
    expect(totalQuestions).toBe(3);

    questionPlayerEngineService.clearQuestions();
    totalQuestions = questionPlayerEngineService.getQuestionCount();
    expect(totalQuestions).toBe(0);

    questionPlayerEngineService.init(
      [singleQuestionBackendDict], successHandler, failHandler);
    totalQuestions = questionPlayerEngineService.getQuestionCount();
    expect(totalQuestions).toBe(1);
  });

  it('should return the exploration Id', () => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let exploration = sampleExplorationDict;

    spyOn(contextService, 'setQuestionPlayerIsOpen').and.returnValue(null);
    spyOn(contextService, 'getExplorationId').and.returnValue('explorationId1');
    spyOn(contextService, 'isInQuestionPlayerMode').and.returnValue(true);
    spyOn(urlService, 'getExplorationVersionFromUrl').and.returnValue(1);
    spyOn(readOnlyExplorationBackendApiService, 'loadExplorationAsync')
      .and.returnValue(Promise.resolve(exploration));

    questionPlayerEngineService.init(
      multipleQuestionBackendDict, successHandler, failHandler);
    let explorationId = questionPlayerEngineService.getExplorationId();

    expect(explorationId).toBe('explorationId1');
  });

  it('should return the version of exploration', () => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let exploration = sampleExplorationDict;

    spyOn(contextService, 'setQuestionPlayerIsOpen').and.returnValue(null);
    spyOn(contextService, 'getExplorationId').and.returnValue('explorationId1');
    spyOn(contextService, 'isInQuestionPlayerMode').and.returnValue(true);
    spyOn(urlService, 'getExplorationVersionFromUrl').and.returnValue(1);
    spyOn(readOnlyExplorationBackendApiService, 'loadExplorationAsync')
      .and.returnValue(Promise.resolve(exploration));

    questionPlayerEngineService.init(
      multipleQuestionBackendDict, successHandler, failHandler);
    let version = questionPlayerEngineService.getExplorationVersion();
    expect(version).toBe(1);
  });

  it('should clear all questions', () => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let exploration = sampleExplorationDict;

    spyOn(contextService, 'setQuestionPlayerIsOpen').and.returnValue(null);
    spyOn(contextService, 'getExplorationId').and.returnValue('explorationId1');
    spyOn(contextService, 'isInQuestionPlayerMode').and.returnValue(true);
    spyOn(urlService, 'getExplorationVersionFromUrl').and.returnValue(1);
    spyOn(readOnlyExplorationBackendApiService, 'loadExplorationAsync')
      .and.returnValue(Promise.resolve(exploration));

    questionPlayerEngineService.init(
      multipleQuestionBackendDict, successHandler, failHandler);

    expect(questionPlayerEngineService.questions.length).toBe(3);

    questionPlayerEngineService.clearQuestions();

    expect(questionPlayerEngineService.questions.length).toBe(0);
  });

  it('should return the language code', () => {
    let successCallback = jasmine.createSpy('success');
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let answer = 'answer';
    let exploration = sampleExplorationDict;
    let interactionRulesService: InteractionRulesService;
    let answerClassificationResult: AnswerClassificationResult = {
      answerGroupIndex: 1,
      classificationCategorization: 'default_outcome',
      outcome: {
        dest: null,
        feedback: {
          _contentId: 'feedback_id',
          _html: '<p>Dummy Feedback</p>',
          contentId: 'feedback_id',
          html: '<p>Dummy Feedback</p>',
        },
        labelledAsCorrect: true,
        missingPrerequisiteSkillId: null,
        paramChanges: [],
        refresherExplorationId: null,
      },
      ruleIndex: 0
    } as unknown as AnswerClassificationResult;

    spyOn(contextService, 'setQuestionPlayerIsOpen').and.returnValue(null);
    spyOn(contextService, 'getExplorationId').and.returnValue('explorationId1');
    spyOn(contextService, 'isInQuestionPlayerMode').and.returnValue(true);
    spyOn(urlService, 'getExplorationVersionFromUrl').and.returnValue(1);
    spyOn(readOnlyExplorationBackendApiService, 'loadExplorationAsync')
      .and.returnValue(Promise.resolve(exploration));
    spyOn(answerClassificationService, 'getMatchingClassificationResult')
      .and.returnValue(answerClassificationResult);
    spyOn(expressionInterpolationService, 'processHtml')
      .and.callFake((html, envs) => {
        if (html === null) {
          return null;
        }
        return html;
      });

    questionPlayerEngineService.init(
      multipleQuestionBackendDict, successHandler, failHandler);
    let languageCode = questionPlayerEngineService.getLanguageCode();

    expect(languageCode).toBe('en');

    questionPlayerEngineService.submitAnswer(
      answer, interactionRulesService, successCallback);
    questionPlayerEngineService.recordNewCardAdded();

    languageCode = questionPlayerEngineService.getLanguageCode();
    expect(languageCode).toBe('br');

    questionPlayerEngineService.submitAnswer(
      answer, interactionRulesService, successCallback);
    questionPlayerEngineService.recordNewCardAdded();

    languageCode = questionPlayerEngineService.getLanguageCode();
    expect(languageCode).toBe('ab');
  });

  it('should check for preview mode', () => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let exploration = sampleExplorationDict;

    spyOn(contextService, 'setQuestionPlayerIsOpen').and.returnValue(null);
    spyOn(contextService, 'getExplorationId').and.returnValue('explorationId1');
    spyOn(contextService, 'isInQuestionPlayerMode').and.returnValue(true);
    spyOn(urlService, 'getExplorationVersionFromUrl').and.returnValue(1);
    spyOn(readOnlyExplorationBackendApiService, 'loadExplorationAsync')
      .and.returnValue(Promise.resolve(exploration));

    questionPlayerEngineService.init(
      multipleQuestionBackendDict, successHandler, failHandler);
    let previewMode = questionPlayerEngineService.isInPreviewMode();

    expect(previewMode).toBe(false);
  });

  it('should return true if answers are being processed', () => {
    let successCallback = jasmine.createSpy('success');
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let answer = 'answer';
    let exploration = sampleExplorationDict;
    let interactionRulesService: InteractionRulesService;
    let answerClassificationResult: AnswerClassificationResult = {
      answerGroupIndex: 1,
      classificationCategorization: 'default_outcome',
      outcome: {
        dest: null,
        feedback: {
          _contentId: 'feedback_id',
          _html: '<p>Dummy Feedback</p>',
          contentId: 'feedback_id',
          html: '<p>Dummy Feedback</p>',
        },
        labelledAsCorrect: true,
        missingPrerequisiteSkillId: null,
        paramChanges: [],
        refresherExplorationId: null,
      },
      ruleIndex: 0
    } as unknown as AnswerClassificationResult;

    spyOn(contextService, 'setQuestionPlayerIsOpen').and.returnValue(null);
    spyOn(contextService, 'getExplorationId').and.returnValue('explorationId1');
    spyOn(contextService, 'isInQuestionPlayerMode').and.returnValue(true);
    spyOn(urlService, 'getExplorationVersionFromUrl').and.returnValue(1);
    spyOn(readOnlyExplorationBackendApiService, 'loadExplorationAsync')
      .and.returnValue(Promise.resolve(exploration));
    spyOn(expressionInterpolationService, 'processHtml')
      .and.callFake((html, envs) => {
        if (html === null) {
          return null;
        }
        return html;
      });

    let answerClassificationServiceSpy =
      spyOn(answerClassificationService, 'getMatchingClassificationResult')
        .and.callFake(() => {
          expect(questionPlayerEngineService.isAnswerBeingProcessed())
            .toBe(true);
          return answerClassificationResult;
        });

    questionPlayerEngineService.init(
      multipleQuestionBackendDict, successHandler, failHandler);
    questionPlayerEngineService.submitAnswer(
      answer, interactionRulesService, successCallback);

    expect(answerClassificationServiceSpy).toHaveBeenCalled();
    expect(questionPlayerEngineService.isAnswerBeingProcessed()).toBe(false);
  });


  it('should return false if answers are not being processed', () => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let exploration = sampleExplorationDict;

    spyOn(contextService, 'setQuestionPlayerIsOpen').and.returnValue(null);
    spyOn(contextService, 'getExplorationId').and.returnValue('explorationId1');
    spyOn(contextService, 'isInQuestionPlayerMode').and.returnValue(true);
    spyOn(urlService, 'getExplorationVersionFromUrl').and.returnValue(1);
    spyOn(readOnlyExplorationBackendApiService, 'loadExplorationAsync')
      .and.returnValue(Promise.resolve(exploration));

    questionPlayerEngineService.init(
      multipleQuestionBackendDict, successHandler, failHandler);

    expect(questionPlayerEngineService.isAnswerBeingProcessed()).toBe(false);
  });

  it('should show warning message while loading a question' +
    'when question html content is null', () => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    singleQuestionBackendDict.question_state_data
      .content.html = null;
    let alertsServiceSpy =
      spyOn(alertsService, 'addWarning').and.returnValue();
    let expressionInterpolationServiceSpy =
      spyOn(expressionInterpolationService, 'processHtml')
        .and.callFake((html, envs) => {
          if (html === null) {
            return null;
          }
          return html;
        });

    questionPlayerEngineService.init(
      [singleQuestionBackendDict], successHandler, failHandler);

    expect(alertsServiceSpy).toHaveBeenCalledWith('Expression parsing error.');
    expect(expressionInterpolationServiceSpy).toHaveBeenCalled();
  });

  it('should call error callback if there are no questions', () => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    questionPlayerEngineService.init(
      [], successHandler, failHandler);
    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  });

  describe('on submiting answer ', () => {
    it('should submit answer correctly', () => {
      let successCallback = jasmine.createSpy('success');
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');
      let answer = 'answer';
      let interactionRulesService: InteractionRulesService;
      let answerClassificationResult: AnswerClassificationResult = {
        answerGroupIndex: 0,
        classificationCategorization: 'default_outcome',
        outcome: {
          dest: null,
          feedback: {
            _contentId: 'feedback_id',
            _html: '<p>Dummy Feedback</p>',
            contentId: 'feedback_id',
            html: '<p>Dummy Feedback</p>',
          },
          labelledAsCorrect: true,
          missingPrerequisiteSkillId: null,
          paramChanges: [],
          refresherExplorationId: null,
        },
        ruleIndex: 0
      } as unknown as AnswerClassificationResult;

      let answerClassificationServiceSpy =
        spyOn(answerClassificationService, 'getMatchingClassificationResult')
          .and.returnValue(answerClassificationResult);

      questionPlayerEngineService.init(
        multipleQuestionBackendDict, successHandler, failHandler);
      questionPlayerEngineService.submitAnswer(
        answer, interactionRulesService, successCallback);

      expect(answerClassificationServiceSpy).toHaveBeenCalled();
      expect(successCallback).toHaveBeenCalled();
    });

    it('should return when the answer is still being processed', () => {
      let successCallback = jasmine.createSpy('success');
      let answer = 'answer';
      let interactionRulesService: InteractionRulesService;

      let answerClassificationServiceSpy =
        spyOn(answerClassificationService, 'getMatchingClassificationResult');

      questionPlayerEngineService.answerIsBeingProcessed = true;
      questionPlayerEngineService.submitAnswer(
        answer, interactionRulesService, successCallback);

      expect(answerClassificationServiceSpy).not.toHaveBeenCalled();
    });

    it('should show warning message given that feedback' +
      'html content is null', () => {
      let successCallback = jasmine.createSpy('success');
      let answer = 'answer';
      let interactionRulesService: InteractionRulesService;
      let answerClassificationResult: AnswerClassificationResult = {
        answerGroupIndex: 0,
        classificationCategorization: 'default_outcome',
        outcome: {
          dest: null,
          feedback: {
            _contentId: 'feedback_id',
            _html: null,
            contentId: 'feedback_id',
            html: null,
          },
          labelledAsCorrect: true,
          missingPrerequisiteSkillId: null,
          paramChanges: [],
          refresherExplorationId: null,
        },
        ruleIndex: 0
      } as unknown as AnswerClassificationResult;
      singleQuestionBackendDict.question_state_data
        .interaction.default_outcome.feedback.html = null;
      let sampleQuestion = questionObjectFactory.createFromBackendDict(
        singleQuestionBackendDict);

      let answerClassificationServiceSpy =
        spyOn(answerClassificationService, 'getMatchingClassificationResult')
          .and.returnValue(answerClassificationResult);
      let alertsServiceSpy =
        spyOn(alertsService, 'addWarning').and.returnValue();
      let expressionInterpolationServiceSpy =
        spyOn(expressionInterpolationService, 'processHtml')
          .and.callFake((html, envs) => {
            if (html === null) {
              return null;
            }
            return html;
          });

      questionPlayerEngineService.questions = [sampleQuestion];
      questionPlayerEngineService.currentIndex = 0;
      questionPlayerEngineService.submitAnswer(
        answer, interactionRulesService, successCallback);

      expect(answerClassificationServiceSpy).toHaveBeenCalled();
      expect(alertsServiceSpy)
        .toHaveBeenCalledWith('Expression parsing error.');
      expect(expressionInterpolationServiceSpy).toHaveBeenCalled();
    });

    it('should show warning message given that question' +
      'html content is null', () => {
      let successCallback = jasmine.createSpy('success');
      let answer = 'answer';
      let interactionRulesService: InteractionRulesService;
      let answerClassificationResult: AnswerClassificationResult = {
        answerGroupIndex: 0,
        classificationCategorization: 'default_outcome',
        outcome: {
          dest: null,
          feedback: {
            _contentId: 'feedback_id',
            _html: '<p>Dummy Feedback</p>',
            contentId: 'feedback_id',
            html: '<p>Dummy Feedback</p>',
          },
          labelledAsCorrect: true,
          missingPrerequisiteSkillId: null,
          paramChanges: [],
          refresherExplorationId: null,
        },
        ruleIndex: 0
      } as unknown as AnswerClassificationResult;

      singleQuestionBackendDict.question_state_data
        .content.html = null;
      let sampleQuestion = questionObjectFactory.createFromBackendDict(
        singleQuestionBackendDict);

      let answerClassificationServiceSpy =
        spyOn(answerClassificationService, 'getMatchingClassificationResult')
          .and.returnValue(answerClassificationResult);
      let alertsServiceSpy =
        spyOn(alertsService, 'addWarning').and.returnValue();
      let expressionInterpolationServiceSpy =
        spyOn(expressionInterpolationService, 'processHtml')
          .and.callFake((html, envs) => {
            if (html === null) {
              return null;
            }
            return html;
          });

      questionPlayerEngineService.questions = [sampleQuestion];
      questionPlayerEngineService.currentIndex = 0;
      questionPlayerEngineService.submitAnswer(
        answer, interactionRulesService, successCallback);

      expect(answerClassificationServiceSpy).toHaveBeenCalled();
      expect(alertsServiceSpy)
        .toHaveBeenCalledWith('Expression parsing error.');
      expect(expressionInterpolationServiceSpy).toHaveBeenCalled();
    });

    it('should return the next question if multiple questions exists', () => {
      let successCallback = jasmine.createSpy('success');
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');
      let answer = 'answer';
      let interactionRulesService: InteractionRulesService;
      let answerClassificationResult: AnswerClassificationResult = {
        answerGroupIndex: 0,
        classificationCategorization: 'default_outcome',
        outcome: {
          dest: null,
          feedback: {
            _contentId: 'feedback_id',
            _html: '<p>Dummy Feedback</p>',
            contentId: 'feedback_id',
            html: '<p>Dummy Feedback</p>',
          },
          labelledAsCorrect: true,
          missingPrerequisiteSkillId: null,
          paramChanges: [],
          refresherExplorationId: null,
        },
        ruleIndex: 0
      } as unknown as AnswerClassificationResult;

      let answerClassificationServiceSpy =
        spyOn(answerClassificationService, 'getMatchingClassificationResult')
          .and.returnValue(answerClassificationResult);
      spyOn(expressionInterpolationService, 'processHtml')
        .and.callFake((html, envs) => {
          if (html === null) {
            return null;
          }
          return html;
        });

      questionPlayerEngineService.init(
        multipleQuestionBackendDict, successHandler, failHandler);
      questionPlayerEngineService.submitAnswer(
        answer, interactionRulesService, successCallback);

      let result = (
        questionPlayerEngineService.currentIndex <
          questionPlayerEngineService.questions.length - 1);

      expect(answerClassificationServiceSpy).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should not return the next question if only one question exist', () => {
      let successCallback = jasmine.createSpy('success');
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');
      let answer = 'answer';
      let interactionRulesService: InteractionRulesService;
      let answerClassificationResult: AnswerClassificationResult = {
        answerGroupIndex: 0,
        classificationCategorization: 'default_outcome',
        outcome: {
          dest: null,
          feedback: {
            _contentId: 'feedback_id',
            _html: '<p>Dummy Feedback</p>',
            contentId: 'feedback_id',
            html: '<p>Dummy Feedback</p>',
          },
          labelledAsCorrect: true,
          missingPrerequisiteSkillId: null,
          paramChanges: [],
          refresherExplorationId: null,
        },
        ruleIndex: 0
      } as unknown as AnswerClassificationResult;

      let answerClassificationServiceSpy =
        spyOn(answerClassificationService, 'getMatchingClassificationResult')
          .and.returnValue(answerClassificationResult);
      spyOn(expressionInterpolationService, 'processHtml')
        .and.callFake((html, envs) => {
          if (html === null) {
            return null;
          }
          return html;
        });

      questionPlayerEngineService.init(
        [singleQuestionBackendDict], successHandler, failHandler);
      questionPlayerEngineService.submitAnswer(
        answer, interactionRulesService, successCallback);

      let result = (
        questionPlayerEngineService.currentIndex <
          questionPlayerEngineService.questions.length - 1);

      expect(answerClassificationServiceSpy).toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('should return the misconception Id correctly', () => {
      let successCallback = jasmine.createSpy('success');
      let answer = 'answer';
      let interactionRulesService: InteractionRulesService;
      let answerClassificationResult: AnswerClassificationResult = {
        answerGroupIndex: 1,
        classificationCategorization: 'default_outcome',
        outcome: {
          dest: null,
          feedback: {
            _contentId: 'feedback_id',
            _html: '<p>Dummy Feedback</p>',
            contentId: 'feedback_id',
            html: '<p>Dummy Feedback</p>',
          },
          labelledAsCorrect: true,
          missingPrerequisiteSkillId: null,
          paramChanges: [],
          refresherExplorationId: null,
        },
        ruleIndex: 0
      } as unknown as AnswerClassificationResult;
      let answerGroupIndex = answerClassificationResult.answerGroupIndex;

      let sampleQuestion = questionObjectFactory.createFromBackendDict(
        singleQuestionBackendDict);

      let answerClassificationServiceSpy =
        spyOn(answerClassificationService, 'getMatchingClassificationResult')
          .and.returnValue(answerClassificationResult);
      spyOn(expressionInterpolationService, 'processHtml')
        .and.callFake((html, envs) => {
          if (html === null) {
            return null;
          }
          return html;
        });

      questionPlayerEngineService.questions = [sampleQuestion];
      questionPlayerEngineService.currentIndex = 0;
      questionPlayerEngineService.submitAnswer(
        answer, interactionRulesService, successCallback);

      let misconceptionId = sampleQuestion.getStateData()
        .interaction.answerGroups[answerGroupIndex].taggedSkillMisconceptionId;

      expect(answerClassificationServiceSpy).toHaveBeenCalled();
      expect(misconceptionId).toBe('misconceptionId');
    });

    it('should update the current index when a card is added', () => {
      let successCallback = jasmine.createSpy('success');
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');
      let answer = 'answer';
      let exploration = sampleExplorationDict;
      let interactionRulesService: InteractionRulesService;
      let answerClassificationResult: AnswerClassificationResult = {
        answerGroupIndex: 1,
        classificationCategorization: 'default_outcome',
        outcome: {
          dest: null,
          feedback: {
            _contentId: 'feedback_id',
            _html: '<p>Dummy Feedback</p>',
            contentId: 'feedback_id',
            html: '<p>Dummy Feedback</p>',
          },
          labelledAsCorrect: true,
          missingPrerequisiteSkillId: null,
          paramChanges: [],
          refresherExplorationId: null,
        },
        ruleIndex: 0
      } as unknown as AnswerClassificationResult;

      spyOn(contextService, 'setQuestionPlayerIsOpen').and.returnValue(null);
      spyOn(contextService, 'getExplorationId')
        .and.returnValue('explorationId1');
      spyOn(contextService, 'isInQuestionPlayerMode').and.returnValue(true);
      spyOn(urlService, 'getExplorationVersionFromUrl').and.returnValue(1);
      spyOn(readOnlyExplorationBackendApiService, 'loadExplorationAsync')
        .and.returnValue(Promise.resolve(exploration));
      spyOn(answerClassificationService, 'getMatchingClassificationResult')
        .and.returnValue(answerClassificationResult);
      spyOn(expressionInterpolationService, 'processHtml')
        .and.callFake((html, envs) => {
          if (html === null) {
            return null;
          }
          return html;
        });

      questionPlayerEngineService.init(
        multipleQuestionBackendDict, successHandler, failHandler);
      questionPlayerEngineService.submitAnswer(
        answer, interactionRulesService, successCallback);

      expect(questionPlayerEngineService.currentIndex).toBe(0);

      questionPlayerEngineService.recordNewCardAdded();

      expect(questionPlayerEngineService.currentIndex).toBe(1);
    });
  });
});
