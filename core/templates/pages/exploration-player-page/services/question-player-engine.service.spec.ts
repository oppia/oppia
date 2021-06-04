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

import { TestBed} from '@angular/core/testing';
import { AnswerClassificationResult } from 'domain/classifier/answer-classification-result.model';
import { OutcomeObjectFactory } from 'domain/exploration/OutcomeObjectFactory';
import { QuestionBackendDict, QuestionObjectFactory } from 'domain/question/QuestionObjectFactory';
import { ExpressionInterpolationService } from 'expressions/expression-interpolation.service';
import { AlertsService } from 'services/alerts.service';
import { ContextService } from 'services/context.service';
import { FocusManagerService } from 'services/stateful/focus-manager.service';
import { AnswerClassificationService, InteractionRulesService } from './answer-classification.service';
import { QuestionPlayerEngineService } from './question-player-engine.service';

describe('Question player engine service ', () => {
  let alertsService: AlertsService;
  let answerClassificationService: AnswerClassificationService;
  let contextService: ContextService;
  let expressionInterpolationService: ExpressionInterpolationService;
  let questionObjectFactory: QuestionObjectFactory;

  let questionPlayerEngineService: QuestionPlayerEngineService;
  let singleQuestionBackendDict: QuestionBackendDict;
  let multipleQuestionsBackendDict: QuestionBackendDict[];
  let outcomeObjectFactory: OutcomeObjectFactory;
  let focusManagerService: FocusManagerService;

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
              labelled_as_correct: true,
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
              labelled_as_correct: true,
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

    multipleQuestionsBackendDict = [{
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
  });

  beforeEach(() => {
    alertsService = TestBed.inject(AlertsService);
    answerClassificationService = TestBed.inject(AnswerClassificationService);
    contextService = TestBed.inject(ContextService);
    expressionInterpolationService =
      TestBed.inject(ExpressionInterpolationService);
    questionObjectFactory = TestBed.inject(QuestionObjectFactory);
    questionPlayerEngineService = TestBed.inject(QuestionPlayerEngineService);
    outcomeObjectFactory = TestBed.inject(OutcomeObjectFactory);
    focusManagerService = TestBed.inject(FocusManagerService);
  });

  it('should load questions when initialized', () => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    spyOn(contextService, 'setQuestionPlayerIsOpen').and.returnValue(null);
    spyOn(contextService, 'isInQuestionPlayerMode').and.returnValue(true);

    expect(questionPlayerEngineService.getQuestionCount()).toBe(0);

    questionPlayerEngineService.init(
      multipleQuestionsBackendDict, successHandler, failHandler);

    expect(questionPlayerEngineService.getQuestionCount()).toBe(3);
  });

  it('should update the current question ID when a new card is added', () => {
    let successCallback = jasmine.createSpy('success');
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let answer = 'answer';
    let interactionRulesService: InteractionRulesService;
    let answerClassificationResult = new AnswerClassificationResult(
      outcomeObjectFactory
        .createNew('default', '', '', []), 1, 0, 'default_outcome'
    );

    spyOn(contextService, 'setQuestionPlayerIsOpen').and.returnValue(null);
    spyOn(contextService, 'isInQuestionPlayerMode').and.returnValue(true);
    spyOn(answerClassificationService, 'getMatchingClassificationResult')
      .and.returnValue(answerClassificationResult);
    spyOn(expressionInterpolationService, 'processHtml')
      .and.callFake((html, envs) => html);

    questionPlayerEngineService.init(
      multipleQuestionsBackendDict, successHandler, failHandler);
    let currentQuestion1 = questionPlayerEngineService.getCurrentQuestion();
    expect(currentQuestion1.getId()).toBe('questionId1');

    questionPlayerEngineService.submitAnswer(
      answer, interactionRulesService, successCallback);
    questionPlayerEngineService.recordNewCardAdded();
    let currentQuestion2 = questionPlayerEngineService.getCurrentQuestion();

    expect(currentQuestion2.getId()).toBe('questionId2');
  });

  it('should return the current question Id', () => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    spyOn(contextService, 'setQuestionPlayerIsOpen').and.returnValue(null);
    spyOn(contextService, 'isInQuestionPlayerMode').and.returnValue(true);

    expect(() => {
      questionPlayerEngineService.getCurrentQuestionId();
    }).toThrowError('Cannot read property \'getId\' of undefined');

    questionPlayerEngineService.init(
      multipleQuestionsBackendDict, successHandler, failHandler);

    expect(questionPlayerEngineService.getCurrentQuestionId())
      .toBe('questionId1');
  });

  it('should return number of questions', () => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    spyOn(contextService, 'setQuestionPlayerIsOpen').and.returnValue(null);
    spyOn(contextService, 'isInQuestionPlayerMode').and.returnValue(true);

    questionPlayerEngineService.init(
      multipleQuestionsBackendDict, successHandler, failHandler);
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

  it('should clear all questions', () => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    spyOn(contextService, 'setQuestionPlayerIsOpen').and.returnValue(null);
    spyOn(contextService, 'isInQuestionPlayerMode').and.returnValue(true);

    questionPlayerEngineService.init(
      multipleQuestionsBackendDict, successHandler, failHandler);

    expect(questionPlayerEngineService.getQuestionCount()).toBe(3);

    questionPlayerEngineService.clearQuestions();

    expect(questionPlayerEngineService.getQuestionCount()).toBe(0);
  });

  it('should return the language code correctly when new card is added', () => {
    let successCallback = jasmine.createSpy('success');
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let answer = 'answer';
    let interactionRulesService: InteractionRulesService;
    let answerClassificationResult = new AnswerClassificationResult(
      outcomeObjectFactory
        .createNew('default', '', '', []), 1, 0, 'default_outcome'
    );

    spyOn(contextService, 'setQuestionPlayerIsOpen').and.returnValue(null);
    spyOn(contextService, 'isInQuestionPlayerMode').and.returnValue(true);
    spyOn(answerClassificationService, 'getMatchingClassificationResult')
      .and.returnValue(answerClassificationResult);
    spyOn(expressionInterpolationService, 'processHtml')
      .and.callFake((html, envs) => html);

    questionPlayerEngineService.init(
      multipleQuestionsBackendDict, successHandler, failHandler);
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

  it('should always return false when calling \'isInPreviewMode()\'', () => {
    let previewMode = questionPlayerEngineService.isInPreviewMode();

    expect(previewMode).toBe(false);
  });

  it('should show warning message while loading a question ' +
    'if the question name is empty', () => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    singleQuestionBackendDict.question_state_data
      .content.html = null;
    let alertsServiceSpy =
      spyOn(alertsService, 'addWarning').and.returnValue();
    spyOn(expressionInterpolationService, 'processHtml')
      .and.callFake((html, envs) => html);

    questionPlayerEngineService.init(
      [singleQuestionBackendDict], successHandler, failHandler);

    expect(alertsServiceSpy).toHaveBeenCalledWith(
      'Question name should not be empty.');
  });

  it('should not load questions if there are no questions', () => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    let alertsServiceSpy =
    spyOn(alertsService, 'addWarning').and.returnValue();

    questionPlayerEngineService.init(
      [], successHandler, failHandler);

    expect(alertsServiceSpy).toHaveBeenCalledWith(
      'Questions can not be empty.');
    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  });

  describe('on submitting answer ', () => {
    it('should call success callback if the submitted' +
      'answer is correct', () => {
      let successCallback = jasmine.createSpy('success');
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');
      let answer = 'answer';
      let interactionRulesService: InteractionRulesService;
      let answerClassificationResult = new AnswerClassificationResult(
        outcomeObjectFactory
          .createNew('default', '', '', []), 1, 0, 'default_outcome'
      );
      answerClassificationResult.outcome.labelledAsCorrect = true;

      spyOn(answerClassificationService, 'getMatchingClassificationResult')
        .and.returnValue(answerClassificationResult);

      questionPlayerEngineService.init(
        multipleQuestionsBackendDict, successHandler, failHandler);
      questionPlayerEngineService.submitAnswer(
        answer, interactionRulesService, successCallback);

      expect(questionPlayerEngineService.isAnswerBeingProcessed()).toBe(false);
      expect(successCallback).toHaveBeenCalled();
    });

    it('should not submit answer again if the answer ' +
      'is already being processed', () => {
      let successCallback = jasmine.createSpy('success');
      let answer = 'answer';
      let interactionRulesService: InteractionRulesService;

      spyOn(answerClassificationService, 'getMatchingClassificationResult');

      questionPlayerEngineService.setAnswerIsBeingProcessed(true);
      questionPlayerEngineService.submitAnswer(
        answer, interactionRulesService, successCallback);

      expect(successCallback).not.toHaveBeenCalled();
    });

    it('should show warning message if the feedback ' +
      'content is empty', () => {
      let successCallback = jasmine.createSpy('success');
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');
      let answer = 'answer';
      let interactionRulesService: InteractionRulesService;
      let answerClassificationResult = new AnswerClassificationResult(
        outcomeObjectFactory
          .createNew('default', null, null, []), 1, 0, 'default_outcome'
      );
      answerClassificationResult.outcome.labelledAsCorrect = true;

      spyOn(answerClassificationService, 'getMatchingClassificationResult')
        .and.returnValue(answerClassificationResult);
      let alertsServiceSpy =
        spyOn(alertsService, 'addWarning').and.returnValue();
      spyOn(expressionInterpolationService, 'processHtml')
        .and.callFake((html, envs) => html);

      singleQuestionBackendDict.question_state_data
        .interaction.default_outcome.feedback.html = null;
      questionPlayerEngineService.init(
        [singleQuestionBackendDict], successHandler, failHandler);

      questionPlayerEngineService.submitAnswer(
        answer, interactionRulesService, successCallback);

      expect(alertsServiceSpy)
        .toHaveBeenCalledWith('Feedback content should not be empty.');
    });

    it('should show warning message if the question ' +
      'name is empty', () => {
      let successCallback = jasmine.createSpy('success');
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');
      let answer = 'answer';
      let interactionRulesService: InteractionRulesService;
      let answerClassificationResult = new AnswerClassificationResult(
        outcomeObjectFactory
          .createNew('default', '', '', []), 1, 0, 'default_outcome'
      );
      answerClassificationResult.outcome.labelledAsCorrect = true;

      singleQuestionBackendDict.question_state_data
        .content.html = null;
      let sampleQuestion = questionObjectFactory.createFromBackendDict(
        singleQuestionBackendDict);

      spyOn(answerClassificationService, 'getMatchingClassificationResult')
        .and.returnValue(answerClassificationResult);
      let alertsServiceSpy =
        spyOn(alertsService, 'addWarning').and.returnValue();
      spyOn(questionPlayerEngineService, 'init').and.callFake(() => {
        questionPlayerEngineService.addQuestion(sampleQuestion);
      });

      spyOn(expressionInterpolationService, 'processHtml')
        .and.callFake((html, envs) => html);

      questionPlayerEngineService.init(
        [singleQuestionBackendDict], successHandler, failHandler);
      questionPlayerEngineService.setCurrentIndex(0);
      questionPlayerEngineService.submitAnswer(
        answer, interactionRulesService, successCallback);

      expect(alertsServiceSpy)
        .toHaveBeenCalledWith('Question name should not be empty.');
    });

    it('should update the current index when a card is added', () => {
      let successCallback = jasmine.createSpy('success');
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');
      let answer = 'answer';
      let interactionRulesService: InteractionRulesService;
      let answerClassificationResult = new AnswerClassificationResult(
        outcomeObjectFactory
          .createNew('default', '', '', []), 1, 0, 'default_outcome'
      );
      answerClassificationResult.outcome.labelledAsCorrect = true;

      spyOn(contextService, 'setQuestionPlayerIsOpen').and.returnValue(null);
      spyOn(contextService, 'isInQuestionPlayerMode').and.returnValue(true);
      spyOn(answerClassificationService, 'getMatchingClassificationResult')
        .and.returnValue(answerClassificationResult);
      spyOn(expressionInterpolationService, 'processHtml')
        .and.callFake((html, envs) => html);

      questionPlayerEngineService.init(
        multipleQuestionsBackendDict, successHandler, failHandler);
      questionPlayerEngineService.submitAnswer(
        answer, interactionRulesService, successCallback);

      expect(questionPlayerEngineService.getCurrentIndex()).toBe(0);

      questionPlayerEngineService.recordNewCardAdded();

      expect(questionPlayerEngineService.getCurrentIndex()).toBe(1);
    });

    it('should not create next question if the existing ' +
      'question is the last one', () => {
      let successCallback = jasmine.createSpy('success');
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');
      let answer = 'answer';
      let interactionRulesService: InteractionRulesService;
      let answerClassificationResult = new AnswerClassificationResult(
        outcomeObjectFactory
          .createNew('default', '', '', []), 1, 0, 'default_outcome'
      );
      answerClassificationResult.outcome.labelledAsCorrect = true;

      spyOn(answerClassificationService, 'getMatchingClassificationResult')
        .and.returnValue(answerClassificationResult);
      spyOn(expressionInterpolationService, 'processHtml')
        .and.callFake((html, envs) => html);
      spyOn(focusManagerService, 'generateFocusLabel')
        .and.returnValue('focusLabel');

      questionPlayerEngineService.init(
        [singleQuestionBackendDict], successHandler, failHandler);

      let nextQuestion = null;

      questionPlayerEngineService.submitAnswer(
        answer, interactionRulesService, successCallback);

      expect(successCallback).toHaveBeenCalledWith(
        nextQuestion, true, '', undefined, null,
        null, false, 'misconceptionId',
        null, null, true, 'focusLabel');
    });
  });
});
