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

import { TestBed } from '@angular/core/testing';
import { AnswerClassificationResult } from 'domain/classifier/answer-classification-result.model';
import { FetchExplorationBackendResponse, ReadOnlyExplorationBackendApiService } from 'domain/exploration/read-only-exploration-backend-api.service';
import { QuestionBackendDict, QuestionObjectFactory } from 'domain/question/QuestionObjectFactory';
import { StateCardObjectFactory } from 'domain/state_card/StateCardObjectFactory';
import { ExpressionInterpolationService } from 'expressions/expression-interpolation.service';
import { AlertsService } from 'services/alerts.service';
import { ContextService } from 'services/context.service';
import { UrlService } from 'services/contextual/url.service';
import { ExplorationHtmlFormatterService } from 'services/exploration-html-formatter.service';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { AnswerClassificationService, InteractionRulesService } from './answer-classification.service';
import { QuestionPlayerEngineService } from './question-player-engine.service';

fdescribe('Question player engine service ', () => {
  let alertsService: AlertsService;
  let answerClassificationService: AnswerClassificationService;
  let contextService: ContextService;
  let explorationHtmlFormatterService: ExplorationHtmlFormatterService;
  let expressionInterpolationService: ExpressionInterpolationService;
  let focusManagerService: FocusManagerService;
  let questionObjectFactory: QuestionObjectFactory;
  let readOnlyExplorationBackendApiService:
    ReadOnlyExplorationBackendApiService;
  let stateCardObjectFactory: StateCardObjectFactory;
  let questionPlayerEngineService: QuestionPlayerEngineService;
  let urlService: UrlService;

  let singleQuestionBackendDict = {
    id: 'id1',
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
            dest: 'State 6',
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

  let multipleQuestionBackendDict: QuestionBackendDict[] = [
    {
    id: 'id1',
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
  } as unknown as QuestionBackendDict,
  {
    id: 'id2',
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
    language_code: 'en',
    version: 1,
    linked_skill_ids: [],
    inapplicable_skill_misconception_ids: [],
  },
  {
    id: 'id3',
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
    language_code: 'en',
    version: 1,
    linked_skill_ids: [],
    inapplicable_skill_misconception_ids: [],
  }
];

  beforeEach(() => {
    alertsService = TestBed.inject(AlertsService);
    answerClassificationService = TestBed.inject(AnswerClassificationService);
    contextService = TestBed.inject(ContextService);
    explorationHtmlFormatterService =
      TestBed.inject(ExplorationHtmlFormatterService);
    expressionInterpolationService =
      TestBed.inject(ExpressionInterpolationService);
    focusManagerService = TestBed.inject(FocusManagerService);
    questionObjectFactory = TestBed.inject(QuestionObjectFactory);
    readOnlyExplorationBackendApiService = TestBed.inject(
      ReadOnlyExplorationBackendApiService);
    stateCardObjectFactory = TestBed.inject(StateCardObjectFactory);
    questionPlayerEngineService = TestBed.inject(QuestionPlayerEngineService);
    urlService = TestBed.inject(UrlService);
  });

  it('should load questions on initialization', () => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let exploration = {
      version: '1'
    } as unknown as FetchExplorationBackendResponse;

    let quesitonPlayerSpy =
      spyOn(contextService, 'setQuestionPlayerIsOpen').and.returnValue(null);
    let explorationIdSpy =
      spyOn(contextService, 'getExplorationId').and.returnValue('id1');
    let questionPlayerModeSpy =
      spyOn(contextService, 'isInQuestionPlayerMode').and.returnValue(false);
    let versionSpy =
      spyOn(urlService, 'getExplorationVersionFromUrl').and.returnValue(1);
    let readOnlySpy =
      spyOn(readOnlyExplorationBackendApiService, 'loadExplorationAsync')
        .and.returnValue(Promise.resolve(exploration));

    questionPlayerEngineService.init(
      multipleQuestionBackendDict, successHandler, failHandler);

    expect(quesitonPlayerSpy).toHaveBeenCalled();
    expect(explorationIdSpy).toHaveBeenCalled();
    expect(questionPlayerModeSpy).toHaveBeenCalled();
    expect(versionSpy).toHaveBeenCalled();
    expect(readOnlySpy).toHaveBeenCalled();
    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();

    // eslint-disable-next-line dot-notation
    expect(questionPlayerEngineService['explorationId']).toBe('id1');
    // eslint-disable-next-line dot-notation
    expect(questionPlayerEngineService['questionPlayerMode']).toBe(false);
    // eslint-disable-next-line dot-notation
    expect(questionPlayerEngineService['version']).toBe(1);
    // eslint-disable-next-line dot-notation
    expect(questionPlayerEngineService['questions'].length).toBe(3);
  });

  it('should record if new cards are added', () =>{
    // eslint-disable-next-line dot-notation
    questionPlayerEngineService['nextIndex'] = 1;

    questionPlayerEngineService.recordNewCardAdded()

    // eslint-disable-next-line dot-notation
    expect(questionPlayerEngineService['currentIndex']).toBe(1);
  });

  it('should get the current question', () =>{
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let exploration = {
      version: '1'
    } as unknown as FetchExplorationBackendResponse;

    spyOn(contextService, 'setQuestionPlayerIsOpen').and.returnValue(null);
    spyOn(contextService, 'getExplorationId').and.returnValue('id1');
    spyOn(contextService, 'isInQuestionPlayerMode').and.returnValue(false);
    spyOn(urlService, 'getExplorationVersionFromUrl').and.returnValue(1);
    spyOn(readOnlyExplorationBackendApiService, 'loadExplorationAsync')
      .and.returnValue(Promise.resolve(exploration));

    questionPlayerEngineService.init(
      multipleQuestionBackendDict, successHandler, failHandler);
    let currentQuestion = questionPlayerEngineService.getCurrentQuestion();

    expect(currentQuestion.getId()).toBe('id1');
  });

  it('should return number of questions', () =>{
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let exploration = {
      version: '1'
    } as unknown as FetchExplorationBackendResponse;

    spyOn(contextService, 'setQuestionPlayerIsOpen').and.returnValue(null);
    spyOn(contextService, 'getExplorationId').and.returnValue('id1');
    spyOn(contextService, 'isInQuestionPlayerMode').and.returnValue(false);
    spyOn(urlService, 'getExplorationVersionFromUrl').and.returnValue(1);
    spyOn(readOnlyExplorationBackendApiService, 'loadExplorationAsync')
      .and.returnValue(Promise.resolve(exploration));

    questionPlayerEngineService.init(
      multipleQuestionBackendDict, successHandler, failHandler);
    let totalQuestions = questionPlayerEngineService.getQuestionCount();

    expect(totalQuestions).toBe(3);
  });

  it('should return the exploration Id', () =>{
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let exploration = {
      version: '1'
    } as unknown as FetchExplorationBackendResponse;

    spyOn(contextService, 'setQuestionPlayerIsOpen').and.returnValue(null);
    spyOn(contextService, 'getExplorationId').and.returnValue('id1');
    spyOn(contextService, 'isInQuestionPlayerMode').and.returnValue(false);
    spyOn(urlService, 'getExplorationVersionFromUrl').and.returnValue(1);
    spyOn(readOnlyExplorationBackendApiService, 'loadExplorationAsync')
      .and.returnValue(Promise.resolve(exploration));

    questionPlayerEngineService.init(
      multipleQuestionBackendDict, successHandler, failHandler);
    let explorationId = questionPlayerEngineService.getExplorationId();
    console.log(explorationId)
    // expect(explorationId).toBe();
  });

  it('should return the version of exploration', () =>{
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let exploration = {
      version: '1'
    } as unknown as FetchExplorationBackendResponse;

    spyOn(contextService, 'setQuestionPlayerIsOpen').and.returnValue(null);
    spyOn(contextService, 'getExplorationId').and.returnValue('id1');
    spyOn(contextService, 'isInQuestionPlayerMode').and.returnValue(false);
    spyOn(urlService, 'getExplorationVersionFromUrl').and.returnValue(1);
    spyOn(readOnlyExplorationBackendApiService, 'loadExplorationAsync')
      .and.returnValue(Promise.resolve(exploration));

    questionPlayerEngineService.init(
      multipleQuestionBackendDict, successHandler, failHandler);
    let version = questionPlayerEngineService.getExplorationVersion();
    console.log(version)
    expect(version).toBe(1);
  });

  it('should clear all questions', () =>{
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let exploration = {
      version: '1'
    } as unknown as FetchExplorationBackendResponse;

    spyOn(contextService, 'setQuestionPlayerIsOpen').and.returnValue(null);
    spyOn(contextService, 'getExplorationId').and.returnValue('id1');
    spyOn(contextService, 'isInQuestionPlayerMode').and.returnValue(false);
    spyOn(urlService, 'getExplorationVersionFromUrl').and.returnValue(1);
    spyOn(readOnlyExplorationBackendApiService, 'loadExplorationAsync')
      .and.returnValue(Promise.resolve(exploration));

    questionPlayerEngineService.init(
      multipleQuestionBackendDict, successHandler, failHandler);

    // eslint-disable-next-line dot-notation
    expect(questionPlayerEngineService['questions'].length).toBe(3);

    questionPlayerEngineService.clearQuestions();

    // eslint-disable-next-line dot-notation
    expect(questionPlayerEngineService['questions'].length).toBe(0);
  });

  it('should return the language code', () =>{
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let exploration = {
      version: '1'
    } as unknown as FetchExplorationBackendResponse;

    spyOn(contextService, 'setQuestionPlayerIsOpen').and.returnValue(null);
    spyOn(contextService, 'getExplorationId').and.returnValue('id1');
    spyOn(contextService, 'isInQuestionPlayerMode').and.returnValue(false);
    spyOn(urlService, 'getExplorationVersionFromUrl').and.returnValue(1);
    spyOn(readOnlyExplorationBackendApiService, 'loadExplorationAsync')
      .and.returnValue(Promise.resolve(exploration));

    questionPlayerEngineService.init(
      multipleQuestionBackendDict, successHandler, failHandler);
    let languageCode = questionPlayerEngineService.getLanguageCode();

    expect(languageCode).toBe('en');
  });

  it('should check for preview mode', () =>{
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let exploration = {
      version: '1'
    } as unknown as FetchExplorationBackendResponse;

    spyOn(contextService, 'setQuestionPlayerIsOpen').and.returnValue(null);
    spyOn(contextService, 'getExplorationId').and.returnValue('id1');
    spyOn(contextService, 'isInQuestionPlayerMode').and.returnValue(false);
    spyOn(urlService, 'getExplorationVersionFromUrl').and.returnValue(1);
    spyOn(readOnlyExplorationBackendApiService, 'loadExplorationAsync')
      .and.returnValue(Promise.resolve(exploration));

    questionPlayerEngineService.init(
      multipleQuestionBackendDict, successHandler, failHandler);
    let previewMode = questionPlayerEngineService.isInPreviewMode();

    expect(previewMode).toBe(false);
  });

  it('should check if answers are being processed', () =>{
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let exploration = {
      version: '1'
    } as unknown as FetchExplorationBackendResponse;

    spyOn(contextService, 'setQuestionPlayerIsOpen').and.returnValue(null);
    spyOn(contextService, 'getExplorationId').and.returnValue('id1');
    spyOn(contextService, 'isInQuestionPlayerMode').and.returnValue(false);
    spyOn(urlService, 'getExplorationVersionFromUrl').and.returnValue(1);
    spyOn(readOnlyExplorationBackendApiService, 'loadExplorationAsync')
      .and.returnValue(Promise.resolve(exploration));

    questionPlayerEngineService.init(
      multipleQuestionBackendDict, successHandler, failHandler);
    let result = questionPlayerEngineService.isAnswerBeingProcessed();

    expect(result).toBe(false);
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
        classificationCategorization: "default_outcome",
        outcome: {
          dest: null,
          feedback: {
            _contentId: "feedback_id",
            _html: "<p>Dummy Feedback</p>",
            contentId: "feedback_id",
            html: "<p>Dummy Feedback</p>",
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
          .and.returnValue(answerClassificationResult)

      questionPlayerEngineService.init(
        multipleQuestionBackendDict, successHandler, failHandler);
      questionPlayerEngineService.submitAnswer(
        answer, interactionRulesService, successCallback);

      expect(answerClassificationServiceSpy).toHaveBeenCalled();
    });

    it('should return when the answer is still being processed', () => {
      let successCallback = jasmine.createSpy('success');
      let answer = 'ans';
      let interactionRulesService: InteractionRulesService;

      let answerClassificationServiceSpy =
        spyOn(answerClassificationService, 'getMatchingClassificationResult')

      // eslint-disable-next-line dot-notation
      questionPlayerEngineService['answerIsBeingProcessed'] = true;
      questionPlayerEngineService.submitAnswer(
        answer, interactionRulesService, successCallback)

      expect(answerClassificationServiceSpy).not.toHaveBeenCalled();
    });

    it('should show warning message given that feedback' +
      'html content is null', () => {
        let successCallback = jasmine.createSpy('success');
        let answer = 'answer';
        let interactionRulesService: InteractionRulesService;
        let answerClassificationResult: AnswerClassificationResult = {
          answerGroupIndex: 0,
          classificationCategorization: "default_outcome",
          outcome: {
            dest: null,
            feedback: {
              _contentId: "feedback_id",
              _html: null,
              contentId: "feedback_id",
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
            .and.returnValue(answerClassificationResult)
        let alertsServiceSpy =
          spyOn(alertsService, 'addWarning').and.returnValue();
        let expressionInterpolationServiceSpy =
          spyOn(expressionInterpolationService, 'processHtml')
            .and.callFake((html, envs) => {
              if(html === null) {
                return null;
              }
              return html;
            })

        // eslint-disable-next-line dot-notation
        questionPlayerEngineService['questions'] = [sampleQuestion];
        // eslint-disable-next-line dot-notation
        questionPlayerEngineService['currentIndex'] = 0;
        questionPlayerEngineService.submitAnswer(
          answer, interactionRulesService, successCallback);

      expect(answerClassificationServiceSpy).toHaveBeenCalled();
      expect(alertsServiceSpy).toHaveBeenCalledWith('Expression parsing error.');
      expect(expressionInterpolationServiceSpy).toHaveBeenCalled();
    });

    it('should show warning message given that question' +
      'html content is null', () => {
      let successCallback = jasmine.createSpy('success');
      let answer = 'answer';
      let interactionRulesService: InteractionRulesService;
      let answerClassificationResult: AnswerClassificationResult = {
        answerGroupIndex: 0,
        classificationCategorization: "default_outcome",
        outcome: {
          dest: null,
          feedback: {
            _contentId: "feedback_id",
            _html: "<p>Dummy Feedback</p>",
            contentId: "feedback_id",
            html: "<p>Dummy Feedback</p>",
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
          .and.returnValue(answerClassificationResult)
      let alertsServiceSpy =
        spyOn(alertsService, 'addWarning').and.returnValue();
      let expressionInterpolationServiceSpy =
        spyOn(expressionInterpolationService, 'processHtml')
          .and.callFake((html, envs) => {
            if(html === null) {
              return null;
            }
            return html;
          });

      // eslint-disable-next-line dot-notation
      questionPlayerEngineService['questions'] = [sampleQuestion];
      // eslint-disable-next-line dot-notation
      questionPlayerEngineService['currentIndex'] = 0;
      questionPlayerEngineService.submitAnswer(
        answer, interactionRulesService, successCallback);

    expect(answerClassificationServiceSpy).toHaveBeenCalled();
    expect(alertsServiceSpy).toHaveBeenCalledWith('Expression parsing error.');
    expect(expressionInterpolationServiceSpy).toHaveBeenCalled();
  });

    it('should go to the next question if multiple questions exists', () => {
      let successCallback = jasmine.createSpy('success');
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');
      let answer = 'answer';
      let interactionRulesService: InteractionRulesService;
      let answerClassificationResult: AnswerClassificationResult = {
        answerGroupIndex: 0,
        classificationCategorization: "default_outcome",
        outcome: {
          dest: null,
          feedback: {
            _contentId: "feedback_id",
            _html: "<p>Dummy Feedback</p>",
            contentId: "feedback_id",
            html: "<p>Dummy Feedback</p>",
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
          if(html === null) {
            return null;
          }
          return html;
        });

      questionPlayerEngineService.init(
        multipleQuestionBackendDict, successHandler, failHandler);
      questionPlayerEngineService.submitAnswer(
        answer, interactionRulesService, successCallback);

      let result = (
        questionPlayerEngineService['currentIndex'] <
          questionPlayerEngineService['questions'].length -1)

      expect(answerClassificationServiceSpy).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should not go to the next question if only one question exist', () => {
      let successCallback = jasmine.createSpy('success');
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');
      let answer = 'answer';
      let interactionRulesService: InteractionRulesService;
      let answerClassificationResult: AnswerClassificationResult = {
        answerGroupIndex: 0,
        classificationCategorization: "default_outcome",
        outcome: {
          dest: null,
          feedback: {
            _contentId: "feedback_id",
            _html: "<p>Dummy Feedback</p>",
            contentId: "feedback_id",
            html: "<p>Dummy Feedback</p>",
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
          .and.returnValue(answerClassificationResult)
        spyOn(expressionInterpolationService, 'processHtml')
        .and.callFake((html, envs) => {
          if(html === null) {
            return null;
          }
          return html;
        });

      questionPlayerEngineService.init(
        [singleQuestionBackendDict], successHandler, failHandler);
      questionPlayerEngineService.submitAnswer(
        answer, interactionRulesService, successCallback);

      let result = (
        questionPlayerEngineService['currentIndex'] <
          questionPlayerEngineService['questions'].length -1)

      expect(answerClassificationServiceSpy).toHaveBeenCalled();
      expect(result).toBe(false);
    });

    fit('should get the misconception Id', () => {
      let successCallback = jasmine.createSpy('success');
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');
      let answer = 'answer';
      let interactionRulesService: InteractionRulesService;
      let answerClassificationResult: AnswerClassificationResult = {
        answerGroupIndex: 0,
        classificationCategorization: "default_outcome",
        outcome: {
          dest: null,
          feedback: {
            _contentId: "feedback_id",
            _html: "<p>Dummy Feedback</p>",
            contentId: "feedback_id",
            html: "<p>Dummy Feedback</p>",
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
            if(html === null) {
              return null;
            }
            return html;
          });


      questionPlayerEngineService.init(
          [singleQuestionBackendDict], successHandler, failHandler);
      questionPlayerEngineService.submitAnswer(
        answer, interactionRulesService, successCallback);
      // eslint-disable-next-line dot-notation
      // let currentStateData = questionPlayerEngineService['getCurrentStateData'];

      expect(answerClassificationServiceSpy).toHaveBeenCalled();
      // console.log(currentStateData())
      // expect(currentStateData)
    });
  });
});
