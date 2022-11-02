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
 * @fileoverview Unit tests for the diagnostic test player engine service.
 */


import { HttpClientTestingModule } from '@angular/common/http/testing';
import { fakeAsync, TestBed, tick} from '@angular/core/testing';
import { DiagnosticTestQuestionsModel } from 'domain/question/diagnostic-test-questions.model';
import { QuestionBackendApiService } from 'domain/question/question-backend-api.service';
import { Question, QuestionObjectFactory, QuestionBackendDict } from 'domain/question/QuestionObjectFactory';
import { StateObjectFactory } from 'domain/state/StateObjectFactory';
import { DiagnosticTestTopicTrackerModel } from 'pages/diagnostic-test-player-page/diagnostic-test-topic-tracker.model';
import { DiagnosticTestPlayerEngineService } from './diagnostic-test-player-engine.service';
import { TextInputRulesService } from 'interactions/TextInput/directives/text-input-rules.service';
import { AnswerClassificationResult } from 'domain/classifier/answer-classification-result.model';
import { OutcomeObjectFactory } from 'domain/exploration/OutcomeObjectFactory';
import { AnswerClassificationService, InteractionRulesService } from './answer-classification.service';
import { AlertsService } from 'services/alerts.service';


describe('Diagnostic test engine service', () => {
  let diagnosticTestPlayerEngineService: DiagnosticTestPlayerEngineService;
  let questionBackendApiService: QuestionBackendApiService;
  let question1: Question, question2: Question, question3: Question;
  let question4: Question;
  let stateObject: StateObjectFactory;
  let textInputService: InteractionRulesService;
  let outcomeObjectFactory: OutcomeObjectFactory;
  let answerClassificationService: AnswerClassificationService;
  let alertsService: AlertsService;
  let questionObjectFactory: QuestionObjectFactory;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    diagnosticTestPlayerEngineService = TestBed.inject(
      DiagnosticTestPlayerEngineService);
    questionBackendApiService = TestBed.inject(QuestionBackendApiService);
    stateObject = TestBed.inject(StateObjectFactory);
    textInputService = TestBed.get(TextInputRulesService);
    outcomeObjectFactory = TestBed.inject(OutcomeObjectFactory);
    answerClassificationService = TestBed.inject(AnswerClassificationService);
    alertsService = TestBed.inject(AlertsService);
    questionObjectFactory = TestBed.inject(QuestionObjectFactory);

    let questionBackendDict1: QuestionBackendDict = {
      id: '',
      question_state_data: {
        classifier_model_id: null,
        param_changes: [],
        next_content_id_index: 1,
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
          answer_groups: [{
            outcome: {
              dest: 'State 1',
              dest_if_really_stuck: null,
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
            training_data: [],
            tagged_skill_misconception_id: '',
          }],
          default_outcome: {
            dest: '',
            dest_if_really_stuck: null,
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
      question_state_data_schema_version: 2,
      language_code: '',
      version: 1,
      linked_skill_ids: [],
      inapplicable_skill_misconception_ids: []
    };

    question1 = questionObjectFactory.createFromBackendDict(
      questionBackendDict1);
    question2 = new Question(
      'question2', stateObject.createDefaultState('state'), '', 1,
      ['skillID2'], []
    );
    question3 = new Question(
      'question3', stateObject.createDefaultState('state'), '', 1,
      ['skillID3'], []
    );
    question4 = new Question(
      'question4', stateObject.createDefaultState('state'), '', 1,
      ['skillID4'], []
    );
  });

  it(
    'should be able to load first card after initialization', fakeAsync(() => {
      let initSuccessCb = jasmine.createSpy('success');
      let initErrorCb = jasmine.createSpy('fail');

      // A linear graph with 3 nodes.
      const topicIdToPrerequisiteTopicIds = {
        topicId1: [],
        topicId2: ['topicId1'],
        topicId3: ['topicId2']
      };

      const diagnosticTestCurrentTopicStatusModel = {
        skillId1: new DiagnosticTestQuestionsModel(question1, question2),
        skillId2: new DiagnosticTestQuestionsModel(question3, question4)
      };

      const diagnosticTestTopicTrackerModel = (
        new DiagnosticTestTopicTrackerModel(topicIdToPrerequisiteTopicIds));

      spyOn(
        questionBackendApiService,
        'fetchDiagnosticTestQuestionsAsync').and.returnValue(
        Promise.resolve(diagnosticTestCurrentTopicStatusModel));

      // Initially, the current question should be undefined since the engine
      // is not initialized.
      expect(diagnosticTestPlayerEngineService.getCurrentQuestion()).toEqual(
        undefined);

      diagnosticTestPlayerEngineService.init(
        diagnosticTestTopicTrackerModel, initSuccessCb, initErrorCb);
      tick();

      expect(diagnosticTestPlayerEngineService.getCurrentSkillId()).toEqual(
        'skillId1');
      // Getting the main question from the current skill.
      expect(diagnosticTestPlayerEngineService.getCurrentQuestion()).toEqual(
        question1);
    }));

  it('should thorw warning when question html is empty', fakeAsync(() => {
    let initSuccessCb = jasmine.createSpy('success');
    let initErrorCb = jasmine.createSpy('fail');

    // A linear graph with 3 nodes.
    const topicIdToPrerequisiteTopicIds = {
      topicId1: [],
      topicId2: ['topicId1'],
      topicId3: ['topicId2']
    };

    const diagnosticTestCurrentTopicStatusModel = {
      skillId1: new DiagnosticTestQuestionsModel(question1, question2),
    };

    const diagnosticTestTopicTrackerModel = (
      new DiagnosticTestTopicTrackerModel(topicIdToPrerequisiteTopicIds));

    spyOn(
      questionBackendApiService,
      'fetchDiagnosticTestQuestionsAsync').and.returnValue(
      Promise.resolve(diagnosticTestCurrentTopicStatusModel));

    spyOn(
      alertsService, 'addWarning').and.callThrough();

    spyOn(diagnosticTestPlayerEngineService, 'makeQuestion').and.returnValue(
      null);

    // Initially, the current question should be undefined since the engine
    // is not initialized.
    expect(diagnosticTestPlayerEngineService.getCurrentQuestion()).toEqual(
      undefined);

    diagnosticTestPlayerEngineService.init(
      diagnosticTestTopicTrackerModel, initSuccessCb, initErrorCb);
    tick();

    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'Question name should not be empty.');
  }));

  it(
    'should be able to get the backup question if the main question of the ' +
    'current skill is answered incorrectly', fakeAsync(() => {
      let submitAnswerSuccessCb = jasmine.createSpy('success');
      let initSuccessCb = jasmine.createSpy('success');
      let initErrorCb = jasmine.createSpy('fail');

      // A linear graph with 3 nodes.
      const topicIdToPrerequisiteTopicIds = {
        topicId1: [],
        topicId2: ['topicId1'],
        topicId3: ['topicId2']
      };

      const diagnosticTestCurrentTopicStatusModel = {
        skillId1: new DiagnosticTestQuestionsModel(question1, question2),
        skillId2: new DiagnosticTestQuestionsModel(question3, question4)
      };

      const diagnosticTestTopicTrackerModel = (
        new DiagnosticTestTopicTrackerModel(topicIdToPrerequisiteTopicIds));

      spyOn(
        questionBackendApiService,
        'fetchDiagnosticTestQuestionsAsync').and.returnValue(
        Promise.resolve(diagnosticTestCurrentTopicStatusModel));

      // Initially, the current question should be undefined since the engine
      // is not initialized.
      expect(diagnosticTestPlayerEngineService.getCurrentQuestion()).toEqual(
        undefined);

      diagnosticTestPlayerEngineService.init(
        diagnosticTestTopicTrackerModel, initSuccessCb, initErrorCb);
      tick();

      expect(diagnosticTestPlayerEngineService.getCurrentSkillId()).toEqual(
        'skillId1');
      // Getting the main question from the current skill.
      expect(diagnosticTestPlayerEngineService.getCurrentQuestion()).toEqual(
        question1);

      let answer = 'answer';
      let answerClassificationResult = new AnswerClassificationResult(
        outcomeObjectFactory
          .createNew('default', '', '', []), 1, 0, 'default_outcome'
      );
      answerClassificationResult.outcome.labelledAsCorrect = false;

      spyOn(answerClassificationService, 'getMatchingClassificationResult')
        .and.returnValue(answerClassificationResult);

      // Submitting incorrect answer.
      diagnosticTestPlayerEngineService.submitAnswer(
        answer, textInputService, submitAnswerSuccessCb);

      expect(submitAnswerSuccessCb).toHaveBeenCalled();

      // An incorrect attempt does not change the skill, instead, the engine
      // presents the backup question of the same skill.
      expect(diagnosticTestPlayerEngineService.getCurrentSkillId()).toEqual(
        'skillId1');

      // Getting the backup question i.e., question2.
      expect(diagnosticTestPlayerEngineService.getCurrentQuestion()).toEqual(
        question2);
    }));

  it(
    'should be able to get the main question from next skill if the question ' +
    'from current skill is answered correctly', fakeAsync(() => {
      let submitAnswerSuccessCb = jasmine.createSpy('success');
      let initSuccessCb = jasmine.createSpy('success');
      let initErrorCb = jasmine.createSpy('fail');

      // A linear graph with 3 nodes.
      const topicIdToPrerequisiteTopicIds = {
        topicId1: [],
        topicId2: ['topicId1'],
        topicId3: ['topicId2']
      };

      const diagnosticTestCurrentTopicStatusModel = {
        skillId1: new DiagnosticTestQuestionsModel(question1, question2),
        skillId2: new DiagnosticTestQuestionsModel(question3, question4)
      };

      const diagnosticTestTopicTrackerModel = (
        new DiagnosticTestTopicTrackerModel(topicIdToPrerequisiteTopicIds));

      spyOn(
        questionBackendApiService,
        'fetchDiagnosticTestQuestionsAsync').and.returnValue(
        Promise.resolve(diagnosticTestCurrentTopicStatusModel));

      // Initially, the current question should be undefined since the engine
      // is not initialized.
      expect(diagnosticTestPlayerEngineService.getCurrentQuestion()).toEqual(
        undefined);

      diagnosticTestPlayerEngineService.init(
        diagnosticTestTopicTrackerModel, initSuccessCb, initErrorCb);
      tick();

      let answer = 'answer';
      let answerClassificationResult = new AnswerClassificationResult(
        outcomeObjectFactory
          .createNew('default', '', '', []), 1, 0, 'default_outcome'
      );
      answerClassificationResult.outcome.labelledAsCorrect = true;

      spyOn(answerClassificationService, 'getMatchingClassificationResult')
        .and.returnValue(answerClassificationResult);

      // Submitting the correct answer.
      diagnosticTestPlayerEngineService.submitAnswer(
        answer, textInputService, submitAnswerSuccessCb);

      expect(submitAnswerSuccessCb).toHaveBeenCalled();

      // A correct attempt presents another diagnostic test skill from
      // the same topic.
      expect(diagnosticTestPlayerEngineService.getCurrentSkillId()).toEqual(
        'skillId2');

      // Getting the main question from the next skill i.e., question3.
      expect(diagnosticTestPlayerEngineService.getCurrentQuestion()).toEqual(
        question3);
    }));

  it(
    'should be able to finish test if all the eligible topics are tested',
    fakeAsync(() => {
      let submitAnswerSuccessCb = jasmine.createSpy('success');
      let initSuccessCb = jasmine.createSpy('success');
      let initErrorCb = jasmine.createSpy('fail');

      // A linear graph with a single node.
      const topicIdToPrerequisiteTopicIds = {
        topicId1: []
      };

      const diagnosticTestCurrentTopicStatusModel = {
        skillId1: new DiagnosticTestQuestionsModel(question1, question2),
      };

      const diagnosticTestTopicTrackerModel = (
        new DiagnosticTestTopicTrackerModel(topicIdToPrerequisiteTopicIds));

      spyOn(
        questionBackendApiService,
        'fetchDiagnosticTestQuestionsAsync').and.returnValue(
        Promise.resolve(diagnosticTestCurrentTopicStatusModel));

      diagnosticTestPlayerEngineService.init(
        diagnosticTestTopicTrackerModel, initSuccessCb, initErrorCb);
      tick();

      let answer = 'answer';
      let answerClassificationResult = new AnswerClassificationResult(
        outcomeObjectFactory
          .createNew('default', '', '', []), 1, 0, 'default_outcome'
      );
      answerClassificationResult.outcome.labelledAsCorrect = true;

      spyOn(answerClassificationService, 'getMatchingClassificationResult')
        .and.returnValue(answerClassificationResult);

      expect(diagnosticTestPlayerEngineService.isDiagnosticTestFinished())
        .toBeFalse();

      // Submitting the correct answer.
      diagnosticTestPlayerEngineService.submitAnswer(
        answer, textInputService, submitAnswerSuccessCb);

      expect(diagnosticTestPlayerEngineService.isDiagnosticTestFinished())
        .toBeTrue();
    }));

  it(
    'should be able to finish test if the number of attempted questions has ' +
    'reached the upper limit', fakeAsync(() => {
      // For testing purposes only, the maximum number of questions in the
      // diagnostic test is set to 2.
      spyOnProperty(
        DiagnosticTestPlayerEngineService,
        'MAX_ALLOWED_QUESTIONS_IN_THE_DIAGNOSTIC_TEST', 'get'
      ).and.returnValue(2);

      let submitAnswerSuccessCb = jasmine.createSpy('success');
      let initSuccessCb = jasmine.createSpy('success');
      let initErrorCb = jasmine.createSpy('fail');

      // A linear graph with 3 nodes.
      const topicIdToPrerequisiteTopicIds = {
        topicId1: [],
        topicId2: ['topicId1'],
        topicId3: ['topicId2']
      };

      const diagnosticTestCurrentTopicStatusModel = {
        skillId1: new DiagnosticTestQuestionsModel(question1, question2),
        skillId2: new DiagnosticTestQuestionsModel(question3, question4)
      };

      const diagnosticTestTopicTrackerModel = (
        new DiagnosticTestTopicTrackerModel(topicIdToPrerequisiteTopicIds));

      spyOn(
        questionBackendApiService,
        'fetchDiagnosticTestQuestionsAsync').and.returnValue(
        Promise.resolve(diagnosticTestCurrentTopicStatusModel));

      // Initially, the current question should be undefined since the engine
      // is not initialized.
      expect(diagnosticTestPlayerEngineService.getCurrentQuestion()).toEqual(
        undefined);

      diagnosticTestPlayerEngineService.init(
        diagnosticTestTopicTrackerModel, initSuccessCb, initErrorCb);
      tick();

      let answer = 'answer';
      let answerClassificationResult = new AnswerClassificationResult(
        outcomeObjectFactory
          .createNew('default', '', '', []), 1, 0, 'default_outcome'
      );
      answerClassificationResult.outcome.labelledAsCorrect = false;

      spyOn(answerClassificationService, 'getMatchingClassificationResult')
        .and.returnValue(answerClassificationResult);

      // Encountering the main question from skill 1.
      expect(diagnosticTestPlayerEngineService.getCurrentQuestion())
        .toEqual(question1);

      // Submitting incorrect answer.
      diagnosticTestPlayerEngineService.submitAnswer(
        answer, textInputService, submitAnswerSuccessCb);

      // Encountering the backup question from skill 1, since the earlier
      // attempt was incorrect.
      expect(diagnosticTestPlayerEngineService.getCurrentQuestion())
        .toEqual(question2);

      expect(diagnosticTestPlayerEngineService.isDiagnosticTestFinished())
        .toBeFalse();

      expect(diagnosticTestPlayerEngineService.getCurrentTopicId()).toEqual(
        'topicId2');

      // Submitting incorrect answer.
      diagnosticTestPlayerEngineService.submitAnswer(
        answer, textInputService, submitAnswerSuccessCb);

      // Submitting two incorrect answers for the questions associated with a
      // topic marks the current topic as failed.
      expect(diagnosticTestPlayerEngineService.getFailedTopicIds()).toEqual(
        ['topicId2']);

      expect(
        diagnosticTestPlayerEngineService.getTotalNumberOfAttemptedQuestions()
      ).toEqual(2);
      // Since the learner has attempted the maximum number of questions (2) in
      // the test so the test should be terminated.
      expect(diagnosticTestPlayerEngineService.isDiagnosticTestFinished())
        .toBeTrue();
    }));

  it(
    'should return the language code correctly when an answer is ' +
    'submitted and a new card is recorded', fakeAsync(() => {
      let submitAnswerSuccessCb = jasmine.createSpy('success');
      let initSuccessCb = jasmine.createSpy('success');
      let initErrorCb = jasmine.createSpy('fail');

      // A linear graph with 3 nodes.
      const topicIdToPrerequisiteTopicIds = {
        topicId1: [],
        topicId2: ['topicId1'],
        topicId3: ['topicId2']
      };

      const diagnosticTestCurrentTopicStatusModel = {
        skillId1: new DiagnosticTestQuestionsModel(question1, question2),
        skillId2: new DiagnosticTestQuestionsModel(question3, question4)
      };

      const diagnosticTestTopicTrackerModel = (
        new DiagnosticTestTopicTrackerModel(topicIdToPrerequisiteTopicIds));

      spyOn(
        questionBackendApiService,
        'fetchDiagnosticTestQuestionsAsync').and.returnValue(
        Promise.resolve(diagnosticTestCurrentTopicStatusModel));

      // Initially, the current question should be undefined since the engine
      // is not initialized.
      expect(diagnosticTestPlayerEngineService.getCurrentQuestion()).toEqual(
        undefined);

      diagnosticTestPlayerEngineService.init(
        diagnosticTestTopicTrackerModel, initSuccessCb, initErrorCb);
      tick();

      let languageCode = diagnosticTestPlayerEngineService.getLanguageCode();
      expect(languageCode).toEqual(question1._languageCode);

      let answer = 'answer';
      let answerClassificationResult = new AnswerClassificationResult(
        outcomeObjectFactory
          .createNew('default', '', '', []), 1, 0, 'default_outcome'
      );
      answerClassificationResult.outcome.labelledAsCorrect = false;

      spyOn(answerClassificationService, 'getMatchingClassificationResult')
        .and.returnValue(answerClassificationResult);

      // Encountering the main question from skill 1.
      expect(diagnosticTestPlayerEngineService.getCurrentQuestion())
        .toEqual(question1);

      // Submitting incorrect answer.
      diagnosticTestPlayerEngineService.submitAnswer(
        answer, textInputService, submitAnswerSuccessCb);
      diagnosticTestPlayerEngineService.recordNewCardAdded();
    }));

  it('should progress through topics in the diagnostic test', fakeAsync(() => {
    let submitAnswerSuccessCb = jasmine.createSpy('success');
    let initSuccessCb = jasmine.createSpy('success');
    let initErrorCb = jasmine.createSpy('fail');

    // A linear graph with 3 nodes.
    const topicIdToPrerequisiteTopicIds = {
      topicId1: [],
      topicId2: ['topicId1'],
      topicId3: ['topicId2']
    };

    const diagnosticTestCurrentTopicStatusModel = {
      skillId1: new DiagnosticTestQuestionsModel(question1, question2),
    };

    const diagnosticTestTopicTrackerModel = (
      new DiagnosticTestTopicTrackerModel(topicIdToPrerequisiteTopicIds));

    spyOn(
      questionBackendApiService,
      'fetchDiagnosticTestQuestionsAsync').and.returnValue(
      Promise.resolve(diagnosticTestCurrentTopicStatusModel));

    diagnosticTestPlayerEngineService.init(
      diagnosticTestTopicTrackerModel, initSuccessCb, initErrorCb);
    tick();

    let answer = 'answer';
    let answerClassificationResult = new AnswerClassificationResult(
      outcomeObjectFactory
        .createNew('default', '', '', []), 1, 0, 'default_outcome'
    );
    answerClassificationResult.outcome.labelledAsCorrect = true;

    spyOn(answerClassificationService, 'getMatchingClassificationResult')
      .and.returnValue(answerClassificationResult);

    // Assuming L = min(length of ancestors, length of successors). Among all
    // the eligible topic IDs, topic2 and topic3 have the maximum value for L.
    // Since topic2 appears before topic3, thus topic2 should be selected as
    // the current eligible topic ID.
    expect(diagnosticTestPlayerEngineService.getCurrentTopicId()).toEqual(
      'topicId2');

    // Submitting the correct answer for the only question marks the topic as
    // passed and removes its ancestor (topicId1) from the eligible topic IDs
    // list.
    diagnosticTestPlayerEngineService.submitAnswer(
      answer, textInputService, submitAnswerSuccessCb);

    expect(diagnosticTestPlayerEngineService.getCurrentTopicId()).toEqual(
      'topicId3');
  }));
});
