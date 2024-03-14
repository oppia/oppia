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

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {AnswerClassificationResult} from 'domain/classifier/answer-classification-result.model';
import {OutcomeObjectFactory} from 'domain/exploration/OutcomeObjectFactory';
import {
  Question,
  QuestionBackendDict,
  QuestionObjectFactory,
} from 'domain/question/QuestionObjectFactory';
import {StateCard} from 'domain/state_card/state-card.model';
import {ExpressionInterpolationService} from 'expressions/expression-interpolation.service';
import {TextInputRulesService} from 'interactions/TextInput/directives/text-input-rules.service';
import {AlertsService} from 'services/alerts.service';
import {ContextService} from 'services/context.service';
import {FocusManagerService} from 'services/stateful/focus-manager.service';
import {
  AnswerClassificationService,
  InteractionRulesService,
} from './answer-classification.service';
import {QuestionPlayerEngineService} from './question-player-engine.service';
import {AudioTranslationLanguageService} from 'pages/exploration-player-page/services/audio-translation-language.service';

describe('Question player engine service ', () => {
  let audioTranslationLanguageService: AudioTranslationLanguageService;
  let alertsService: AlertsService;
  let answerClassificationService: AnswerClassificationService;
  let contextService: ContextService;
  let expressionInterpolationService: ExpressionInterpolationService;
  let focusManagerService: FocusManagerService;
  let multipleQuestionsBackendDict: QuestionBackendDict[];
  let outcomeObjectFactory: OutcomeObjectFactory;
  let questionObjectFactory: QuestionObjectFactory;
  let questionPlayerEngineService: QuestionPlayerEngineService;
  let singleQuestionBackendDict: QuestionBackendDict;
  let singleQuestionObject: Question;
  let multipleQuestionsObjects: Question[];
  let textInputService: InteractionRulesService;

  beforeEach(() => {
    singleQuestionBackendDict = {
      id: 'questionId1',
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
              training_data: null,
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
              training_data: null,
              tagged_skill_misconception_id: 'misconceptionId',
            },
          ],
          default_outcome: {
            dest: null,
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
      question_state_data_schema_version: 45,
      next_content_id_index: 5,
      language_code: 'en',
      version: 1,
      linked_skill_ids: [],
      inapplicable_skill_misconception_ids: [],
    };

    multipleQuestionsBackendDict = [
      {
        id: 'questionId1',
        question_state_data: {
          classifier_model_id: null,
          param_changes: [],
          solicit_answer_details: false,
          content: {
            content_id: '1',
            html: 'Question 1',
          },
          interaction: {
            answer_groups: [],
            default_outcome: {
              dest: null,
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
        question_state_data_schema_version: 45,
        language_code: 'en',
        next_content_id_index: 6,
        version: 1,
        linked_skill_ids: [],
        inapplicable_skill_misconception_ids: [],
      },
      {
        id: 'questionId2',
        question_state_data: {
          classifier_model_id: null,
          param_changes: [],
          solicit_answer_details: false,
          content: {
            content_id: '2',
            html: 'Question 2',
          },
          interaction: {
            answer_groups: [],
            default_outcome: {
              dest: null,
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
        question_state_data_schema_version: 45,
        language_code: 'br',
        next_content_id_index: 2,
        version: 1,
        linked_skill_ids: [],
        inapplicable_skill_misconception_ids: [],
      },
      {
        id: 'questionId3',
        question_state_data: {
          classifier_model_id: null,
          param_changes: [],
          solicit_answer_details: false,
          content: {
            content_id: '3',
            html: 'Question 3',
          },
          interaction: {
            answer_groups: [],
            default_outcome: {
              dest: null,
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
        question_state_data_schema_version: 45,
        language_code: 'ab',
        version: 1,
        next_content_id_index: 6,
        linked_skill_ids: [],
        inapplicable_skill_misconception_ids: [],
      },
    ];
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    audioTranslationLanguageService = TestBed.inject(
      AudioTranslationLanguageService
    );
    alertsService = TestBed.inject(AlertsService);
    answerClassificationService = TestBed.inject(AnswerClassificationService);
    contextService = TestBed.inject(ContextService);
    expressionInterpolationService = TestBed.inject(
      ExpressionInterpolationService
    );
    questionObjectFactory = TestBed.inject(QuestionObjectFactory);
    questionPlayerEngineService = TestBed.inject(QuestionPlayerEngineService);
    outcomeObjectFactory = TestBed.inject(OutcomeObjectFactory);
    focusManagerService = TestBed.inject(FocusManagerService);
    textInputService = TestBed.get(TextInputRulesService);

    singleQuestionObject = questionObjectFactory.createFromBackendDict(
      singleQuestionBackendDict
    );
    multipleQuestionsObjects = multipleQuestionsBackendDict.map(
      function (questionDict) {
        return questionObjectFactory.createFromBackendDict(questionDict);
      }
    );
  });

  it('should load questions when initialized', () => {
    let initSuccessCb = jasmine.createSpy('success');
    let initErrorCb = jasmine.createSpy('fail');

    spyOn(contextService, 'setQuestionPlayerIsOpen');
    spyOn(contextService, 'isInQuestionPlayerMode').and.returnValue(true);

    expect(questionPlayerEngineService.getQuestionCount()).toBe(0);

    questionPlayerEngineService.init(
      multipleQuestionsObjects,
      initSuccessCb,
      initErrorCb
    );

    expect(questionPlayerEngineService.getQuestionCount()).toBe(3);
  });

  it('should set question player mode to true when initialized', () => {
    let initSuccessCb = jasmine.createSpy('success');
    let initErrorCb = jasmine.createSpy('fail');

    expect(contextService.isInQuestionPlayerMode()).toBe(false);

    questionPlayerEngineService.init(
      multipleQuestionsObjects,
      initSuccessCb,
      initErrorCb
    );

    expect(contextService.isInQuestionPlayerMode()).toBe(true);
  });

  it(
    'should update the current question ID when an answer is ' +
      'submitted and a new card is recorded',
    () => {
      let submitAnswerSuccessCb = jasmine.createSpy('success');
      let initSuccessCb = jasmine.createSpy('success');
      let initErrorCb = jasmine.createSpy('fail');
      let answer = 'answer';
      let answerClassificationResult = new AnswerClassificationResult(
        outcomeObjectFactory.createNew('default', '', '', []),
        1,
        0,
        'default_outcome'
      );

      spyOn(contextService, 'setQuestionPlayerIsOpen');
      spyOn(contextService, 'isInQuestionPlayerMode').and.returnValue(true);
      spyOn(
        answerClassificationService,
        'getMatchingClassificationResult'
      ).and.returnValue(answerClassificationResult);
      spyOn(expressionInterpolationService, 'processHtml').and.callFake(
        (html, envs) => html
      );

      questionPlayerEngineService.init(
        multipleQuestionsObjects,
        initSuccessCb,
        initErrorCb
      );
      let currentQuestion1 = questionPlayerEngineService.getCurrentQuestion();
      expect(currentQuestion1.getId()).toBe(multipleQuestionsObjects[0]._id);

      questionPlayerEngineService.submitAnswer(
        answer,
        textInputService,
        submitAnswerSuccessCb
      );
      questionPlayerEngineService.recordNewCardAdded();
      let currentQuestion2 = questionPlayerEngineService.getCurrentQuestion();
      expect(currentQuestion2.getId()).toBe(multipleQuestionsObjects[1]._id);
    }
  );

  it('should return the current question Id', () => {
    let initSuccessCb = jasmine.createSpy('success');
    let initErrorCb = jasmine.createSpy('fail');

    spyOn(contextService, 'setQuestionPlayerIsOpen');
    spyOn(contextService, 'isInQuestionPlayerMode').and.returnValue(true);

    expect(() => {
      questionPlayerEngineService.getCurrentQuestionId();
    }).toThrowError("Cannot read properties of undefined (reading 'getId')");

    questionPlayerEngineService.init(
      multipleQuestionsObjects,
      initSuccessCb,
      initErrorCb
    );

    expect(questionPlayerEngineService.getCurrentQuestionId()).toBe(
      multipleQuestionsObjects[0]._id
    );
  });

  it('should return number of questions', () => {
    let initSuccessCb = jasmine.createSpy('success');
    let initErrorCb = jasmine.createSpy('fail');

    spyOn(contextService, 'setQuestionPlayerIsOpen');
    spyOn(contextService, 'isInQuestionPlayerMode').and.returnValue(true);

    questionPlayerEngineService.init(
      multipleQuestionsObjects,
      initSuccessCb,
      initErrorCb
    );
    let totalQuestions = questionPlayerEngineService.getQuestionCount();
    expect(totalQuestions).toBe(3);

    questionPlayerEngineService.clearQuestions();
    totalQuestions = questionPlayerEngineService.getQuestionCount();
    expect(totalQuestions).toBe(0);

    questionPlayerEngineService.init(
      [singleQuestionObject],
      initSuccessCb,
      initErrorCb
    );
    totalQuestions = questionPlayerEngineService.getQuestionCount();
    expect(totalQuestions).toBe(1);
  });

  it('should clear all questions', () => {
    let initSuccessCb = jasmine.createSpy('success');
    let initErrorCb = jasmine.createSpy('fail');

    spyOn(contextService, 'setQuestionPlayerIsOpen');
    spyOn(contextService, 'isInQuestionPlayerMode').and.returnValue(true);

    questionPlayerEngineService.init(
      multipleQuestionsObjects,
      initSuccessCb,
      initErrorCb
    );

    expect(questionPlayerEngineService.getQuestionCount()).toBe(3);

    questionPlayerEngineService.clearQuestions();

    expect(questionPlayerEngineService.getQuestionCount()).toBe(0);
  });

  it(
    'should return the language code correctly when an answer is ' +
      'submitted and a new card is recorded',
    () => {
      let submitAnswerSuccessCb = jasmine.createSpy('success');
      let initSuccessCb = jasmine.createSpy('success');
      let initErrorCb = jasmine.createSpy('fail');
      let answer = 'answer';
      let answerClassificationResult = new AnswerClassificationResult(
        outcomeObjectFactory.createNew('default', '', '', []),
        1,
        0,
        'default_outcome'
      );

      spyOn(contextService, 'setQuestionPlayerIsOpen');
      spyOn(contextService, 'isInQuestionPlayerMode').and.returnValue(true);
      spyOn(
        answerClassificationService,
        'getMatchingClassificationResult'
      ).and.returnValue(answerClassificationResult);
      spyOn(expressionInterpolationService, 'processHtml').and.callFake(
        (html, envs) => html
      );

      questionPlayerEngineService.init(
        multipleQuestionsObjects,
        initSuccessCb,
        initErrorCb
      );
      let languageCode = questionPlayerEngineService.getLanguageCode();

      expect(languageCode).toBe(multipleQuestionsObjects[0]._languageCode);

      questionPlayerEngineService.submitAnswer(
        answer,
        textInputService,
        submitAnswerSuccessCb
      );
      questionPlayerEngineService.recordNewCardAdded();

      languageCode = questionPlayerEngineService.getLanguageCode();
      expect(languageCode).toBe(multipleQuestionsObjects[1]._languageCode);

      questionPlayerEngineService.submitAnswer(
        answer,
        textInputService,
        submitAnswerSuccessCb
      );
      questionPlayerEngineService.recordNewCardAdded();

      languageCode = questionPlayerEngineService.getLanguageCode();
      expect(languageCode).toBe(multipleQuestionsObjects[2]._languageCode);
    }
  );

  it("should always return false when calling 'isInPreviewMode()'", () => {
    let previewMode = questionPlayerEngineService.isInPreviewMode();

    expect(previewMode).toBe(false);
  });

  it(
    'should show warning message while loading a question ' +
      'if the question name is empty',
    () => {
      let initSuccessCb = jasmine.createSpy('success');
      let initErrorCb = jasmine.createSpy('fail');

      singleQuestionBackendDict.question_state_data.content.html = null;
      let alertsServiceSpy = spyOn(
        alertsService,
        'addWarning'
      ).and.callThrough();
      spyOn(expressionInterpolationService, 'processHtml').and.callFake(
        (html, envs) => html
      );

      questionPlayerEngineService.init(
        [
          questionObjectFactory.createFromBackendDict(
            singleQuestionBackendDict
          ),
        ],
        initSuccessCb,
        initErrorCb
      );

      expect(alertsServiceSpy).toHaveBeenCalledWith(
        'Question name should not be empty.'
      );
    }
  );

  it('should not load questions if there are no questions', () => {
    let initSuccessCb = jasmine.createSpy('success');
    let initErrorCb = jasmine.createSpy('fail');

    let alertsServiceSpy = spyOn(alertsService, 'addWarning').and.callThrough();

    questionPlayerEngineService.init([], initSuccessCb, initErrorCb);

    expect(alertsServiceSpy).toHaveBeenCalledWith(
      'There are no questions to display.'
    );
    expect(initSuccessCb).not.toHaveBeenCalled();
    expect(initErrorCb).toHaveBeenCalled();
  });

  describe('on submitting answer ', () => {
    it(
      'should call success callback if the submitted ' + 'answer is correct',
      () => {
        let submitAnswerSuccessCb = jasmine.createSpy('success');
        let initSuccessCb = jasmine.createSpy('success');
        let initErrorCb = jasmine.createSpy('fail');
        let answer = 'answer';
        let answerClassificationResult = new AnswerClassificationResult(
          outcomeObjectFactory.createNew('default', '', '', []),
          1,
          0,
          'default_outcome'
        );
        answerClassificationResult.outcome.labelledAsCorrect = true;

        spyOn(
          answerClassificationService,
          'getMatchingClassificationResult'
        ).and.returnValue(answerClassificationResult);

        questionPlayerEngineService.init(
          multipleQuestionsObjects,
          initSuccessCb,
          initErrorCb
        );
        questionPlayerEngineService.submitAnswer(
          answer,
          textInputService,
          submitAnswerSuccessCb
        );

        expect(questionPlayerEngineService.isAnswerBeingProcessed()).toBe(
          false
        );
        expect(submitAnswerSuccessCb).toHaveBeenCalled();
      }
    );

    it(
      'should not submit answer again if the answer ' +
        'is already being processed',
      () => {
        let submitAnswerSuccessCb = jasmine.createSpy('success');
        let answer = 'answer';
        let answerClassificationResult = new AnswerClassificationResult(
          outcomeObjectFactory.createNew('default', '', '', []),
          1,
          0,
          'default_outcome'
        );

        spyOn(
          answerClassificationService,
          'getMatchingClassificationResult'
        ).and.returnValue(answerClassificationResult);

        questionPlayerEngineService.setAnswerIsBeingProcessed(true);
        questionPlayerEngineService.submitAnswer(
          answer,
          textInputService,
          submitAnswerSuccessCb
        );

        expect(submitAnswerSuccessCb).not.toHaveBeenCalled();
      }
    );

    it(
      'should show warning message if the feedback ' + 'content is empty',
      () => {
        let submitAnswerSuccessCb = jasmine.createSpy('success');
        let initSuccessCb = jasmine.createSpy('success');
        let initErrorCb = jasmine.createSpy('fail');
        let answer = 'answer';
        let answerClassificationResult = new AnswerClassificationResult(
          outcomeObjectFactory.createNew('default', null, null, []),
          1,
          0,
          'default_outcome'
        );
        answerClassificationResult.outcome.labelledAsCorrect = true;

        spyOn(
          answerClassificationService,
          'getMatchingClassificationResult'
        ).and.returnValue(answerClassificationResult);
        let alertsServiceSpy = spyOn(
          alertsService,
          'addWarning'
        ).and.callThrough();
        spyOn(expressionInterpolationService, 'processHtml').and.callFake(
          (html, envs) => html
        );

        singleQuestionBackendDict.question_state_data.interaction.default_outcome.feedback.html =
          null;
        questionPlayerEngineService.init(
          [
            questionObjectFactory.createFromBackendDict(
              singleQuestionBackendDict
            ),
          ],
          initSuccessCb,
          initErrorCb
        );

        questionPlayerEngineService.submitAnswer(
          answer,
          textInputService,
          submitAnswerSuccessCb
        );

        expect(alertsServiceSpy).toHaveBeenCalledWith(
          'Feedback content should not be empty.'
        );
      }
    );

    it('should show warning message if the question ' + 'name is empty', () => {
      let submitAnswerSuccessCb = jasmine.createSpy('success');
      let initSuccessCb = jasmine.createSpy('success');
      let initErrorCb = jasmine.createSpy('fail');
      let answer = 'answer';
      let answerClassificationResult = new AnswerClassificationResult(
        outcomeObjectFactory.createNew('default', '', '', []),
        1,
        0,
        'default_outcome'
      );
      answerClassificationResult.outcome.labelledAsCorrect = true;

      singleQuestionBackendDict.question_state_data.content.html = null;
      let sampleQuestion = questionObjectFactory.createFromBackendDict(
        singleQuestionBackendDict
      );

      spyOn(
        answerClassificationService,
        'getMatchingClassificationResult'
      ).and.returnValue(answerClassificationResult);
      let alertsServiceSpy = spyOn(
        alertsService,
        'addWarning'
      ).and.callThrough();
      spyOn(questionPlayerEngineService, 'init').and.callFake(() => {
        questionPlayerEngineService.addQuestion(sampleQuestion);
      });

      spyOn(expressionInterpolationService, 'processHtml').and.callFake(
        (html, envs) => html
      );

      questionPlayerEngineService.init(
        [sampleQuestion],
        initSuccessCb,
        initErrorCb
      );
      questionPlayerEngineService.setCurrentIndex(0);
      questionPlayerEngineService.submitAnswer(
        answer,
        textInputService,
        submitAnswerSuccessCb
      );

      expect(alertsServiceSpy).toHaveBeenCalledWith(
        'Question name should not be empty.'
      );
    });

    it('should update the current index when a card is added', () => {
      let submitAnswerSuccessCb = jasmine.createSpy('success');
      let initSuccessCb = jasmine.createSpy('success');
      let initErrorCb = jasmine.createSpy('fail');
      let answer = 'answer';
      let answerClassificationResult = new AnswerClassificationResult(
        outcomeObjectFactory.createNew('default', '', '', []),
        1,
        0,
        'default_outcome'
      );
      answerClassificationResult.outcome.labelledAsCorrect = true;

      spyOn(contextService, 'setQuestionPlayerIsOpen');
      spyOn(contextService, 'isInQuestionPlayerMode').and.returnValue(true);
      spyOn(
        answerClassificationService,
        'getMatchingClassificationResult'
      ).and.returnValue(answerClassificationResult);
      spyOn(expressionInterpolationService, 'processHtml').and.callFake(
        (html, envs) => html
      );

      questionPlayerEngineService.init(
        multipleQuestionsObjects,
        initSuccessCb,
        initErrorCb
      );
      questionPlayerEngineService.submitAnswer(
        answer,
        textInputService,
        submitAnswerSuccessCb
      );

      expect(questionPlayerEngineService.getCurrentIndex()).toBe(0);

      questionPlayerEngineService.recordNewCardAdded();

      expect(questionPlayerEngineService.getCurrentIndex()).toBe(1);
    });

    it(
      'should not create next card if the existing ' + 'card is the last one',
      () => {
        let submitAnswerSuccessCb = jasmine.createSpy('success');
        let initSuccessCb = jasmine.createSpy('success');
        let initErrorCb = jasmine.createSpy('fail');
        let answer = 'answer';
        let answerClassificationResult = new AnswerClassificationResult(
          outcomeObjectFactory.createNew('default', '', '', []),
          1,
          0,
          'default_outcome'
        );
        let sampleCard = StateCard.createNewCard(
          'Card 1',
          'Content html',
          'Interaction text',
          null,
          null,
          'content_id',
          audioTranslationLanguageService
        );

        answerClassificationResult.outcome.labelledAsCorrect = true;

        spyOn(
          answerClassificationService,
          'getMatchingClassificationResult'
        ).and.returnValue(answerClassificationResult);
        spyOn(expressionInterpolationService, 'processHtml').and.callFake(
          (html, envs) => html
        );
        spyOn(focusManagerService, 'generateFocusLabel').and.returnValue(
          'focusLabel'
        );

        // We are using a stub backend dict which consists of three questions.
        questionPlayerEngineService.init(
          multipleQuestionsObjects,
          initSuccessCb,
          initErrorCb
        );

        let createNewCardSpy = spyOn(
          StateCard,
          'createNewCard'
        ).and.returnValue(sampleCard);

        expect(createNewCardSpy).toHaveBeenCalledTimes(0);

        // Submitting answer to the first question.
        questionPlayerEngineService.submitAnswer(
          answer,
          textInputService,
          submitAnswerSuccessCb
        );

        expect(questionPlayerEngineService.getCurrentQuestionId()).toBe(
          multipleQuestionsObjects[0]._id
        );
        expect(createNewCardSpy).toHaveBeenCalledTimes(1);

        questionPlayerEngineService.recordNewCardAdded();
        // Submitting answer to the second question.
        questionPlayerEngineService.submitAnswer(
          answer,
          textInputService,
          submitAnswerSuccessCb
        );

        expect(questionPlayerEngineService.getCurrentQuestionId()).toBe(
          multipleQuestionsObjects[1]._id
        );
        expect(createNewCardSpy).toHaveBeenCalledTimes(2);

        questionPlayerEngineService.recordNewCardAdded();
        // Submitting answer to the last question.
        questionPlayerEngineService.submitAnswer(
          answer,
          textInputService,
          submitAnswerSuccessCb
        );

        expect(questionPlayerEngineService.getCurrentQuestionId()).toBe(
          multipleQuestionsObjects[2]._id
        );
        // Please note that after submitting answer to the final question,
        // a new card was not created, hence createNewCardSpy was not called.
        expect(createNewCardSpy).toHaveBeenCalledTimes(2);
      }
    );
  });
});
