// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for QuestionBackendApiService.
 */

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { QuestionBackendApiService } from
  'domain/question/question-backend-api.service';
import { QuestionBackendDict, QuestionObjectFactory } from 'domain/question/QuestionObjectFactory';
import { DiagnosticTestQuestionsModel } from './diagnostic-test-questions.model';


describe('Question backend Api service', () => {
  let questionBackendApiService: QuestionBackendApiService;
  let httpTestingController: HttpTestingController;
  let questionObjectFactory: QuestionObjectFactory;
  let sampleResponse = {
    question_summary_dicts: [{
      skill_descriptions: [],
      summary: {
        creator_id: '1',
        created_on_msec: 0,
        last_updated_msec: 0,
        id: '0',
        question_content: ''
      }
    }],
    more: false
  };
  // Sample question object returnable from the backend.
  let sampleDataResults = {
    question_dicts: [{
      id: '0',
      question_state_data: {
        content: {
          html: 'Question 1'
        },
        recorded_voiceovers: {
          voiceovers_mapping: {}
        },
        interaction: {
          answer_groups: [],
          confirmed_unclassified_answers: [],
          customization_args: {},
          default_outcome: {
            dest: null,
            dest_if_really_stuck: null,
            feedback: {
              html: 'Correct Answer'
            },
            param_changes: [],
            labelled_as_correct: true
          },
          hints: [{
            hint_content: {
              html: 'Hint 1'
            }
          }],
          solution: {
            correct_answer: 'This is the correct answer',
            answer_is_exclusive: false,
            explanation: {
              html: 'Solution explanation'
            }
          },
          id: 'TextInput'
        },
        param_changes: [],
        solicit_answer_details: false
      },
      language_code: 'en',
      version: 1
    }]
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        QuestionObjectFactory
      ]
    });

    questionBackendApiService = TestBed.get(QuestionBackendApiService);
    questionObjectFactory = TestBed.inject(QuestionObjectFactory);
    httpTestingController = TestBed.get(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should successfully fetch questions from the backend', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    let questionPlayerHandlerUrl =
      '/question_player_handler?skill_ids=1&question_count=1' +
      '&fetch_by_difficulty=true';

    questionBackendApiService.fetchQuestionsAsync(
      ['1'], 1, true).then(successHandler, failHandler);

    let req = httpTestingController.expectOne(questionPlayerHandlerUrl);
    expect(req.request.method).toEqual('GET');
    req.flush(sampleDataResults);

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(
      sampleDataResults.question_dicts);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should successfully fetch questions from the backend when' +
      'sortedByDifficulty is false', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    let questionPlayerHandlerUrl =
      '/question_player_handler?skill_ids=1&question_count=1' +
      '&fetch_by_difficulty=false';

    questionBackendApiService.fetchQuestionsAsync(
      ['1'], 1, false).then(successHandler, failHandler);

    let req = httpTestingController.expectOne(questionPlayerHandlerUrl);
    expect(req.request.method).toEqual('GET');
    req.flush(sampleDataResults);

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(
      sampleDataResults.question_dicts);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should successfully fetch question count from the backend',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      let questionCountHandlerUrl = (
        '/question_count_handler/' + encodeURIComponent(1));

      questionBackendApiService.fetchTotalQuestionCountForSkillIdsAsync(
        ['1']).then(successHandler, failHandler);

      let req = httpTestingController.expectOne(questionCountHandlerUrl);
      expect(req.request.method).toEqual('GET');
      req.flush({
        total_question_count: 2
      });

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith(2);
      expect(failHandler).not.toHaveBeenCalled();
    }));

  it('should use the fail handler if fetch question count fails',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      let questionCountHandlerUrl = (
        '/question_count_handler/' + encodeURIComponent(1));

      questionBackendApiService.fetchTotalQuestionCountForSkillIdsAsync(
        ['1']).then(successHandler, failHandler);

      let req = httpTestingController.expectOne(questionCountHandlerUrl);
      expect(req.request.method).toEqual('GET');
      req.flush({
        error: 'Error fetching question count.'
      }, {
        status: 400, statusText: 'Invalid request'
      });

      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(
        'Error fetching question count.');
    }));

  it('should use the fail handler if the backend request failed',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      let questionPlayerHandlerUrl =
        '/question_player_handler?skill_ids=1&question_count=1' +
        '&fetch_by_difficulty=true';

      questionBackendApiService.fetchQuestionsAsync(
        ['1'], 1, true).then(successHandler, failHandler);

      let req = httpTestingController.expectOne(questionPlayerHandlerUrl);
      expect(req.request.method).toEqual('GET');
      req.flush({
        error: 'Error loading questions.'
      }, {
        status: 400, statusText: 'Invalid request'
      });

      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(
        'Error loading questions.');
    })
  );

  it('should use the fail handler if question count is in invalid format',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');
      questionBackendApiService.fetchQuestionsAsync(
        // This throws "Type string is not assignable to type
        // 'number'." We need to suppress this error
        // because of the need to test validations. This
        // throws an error only in the frontend test and
        // not in the backend test.
        // @ts-ignore
        ['1'], 'abc' as number, true
      ).then(successHandler, failHandler);
      flushMicrotasks();
      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(
        'Question count has to be a positive integer');
    })
  );

  it('should use the fail handler if question count is negative',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');
      questionBackendApiService.fetchQuestionsAsync(
        ['1'], -1, true).then(successHandler, failHandler);
      flushMicrotasks();
      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(
        'Question count has to be a positive integer');
    })
  );

  it('should use the fail handler if question count is not an integer',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');
      questionBackendApiService.fetchQuestionsAsync(
        ['1'], 1.5, true).then(successHandler, failHandler);
      flushMicrotasks();
      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(
        'Question count has to be a positive integer');
    })
  );

  it('should use the fail handler if skill ids is not a list',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');
      questionBackendApiService.fetchQuestionsAsync(
        // This throws "Type 'string' is not assignable to type 'string[]'."
        // We need to suppress this error because of the need to test
        // validations. This throws an error only in the frontend test and
        // not in the backend test.
        // @ts-ignore
        'x', 1, true).then(successHandler, failHandler);
      flushMicrotasks();
      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(
        'Skill ids should be a list of strings');
    })
  );

  it('should use the fail handler if skill ids is not a list of strings',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');
      questionBackendApiService.fetchQuestionsAsync(
        // This throws "Type 'number[]' is not assignable to type 'string[]'."
        // We need to suppress this error because of the need to test
        // validations. This throws an error only in the frontend test and
        // not in the backend test.
        // @ts-ignore
        [1, 2], 1, true
      ).then(successHandler, failHandler);
      flushMicrotasks();
      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(
        'Skill ids should be a list of strings');
    })
  );

  it('should use the fail handler if skill ids is sent as null',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');
      questionBackendApiService.fetchQuestionsAsync(
        // This throws "Type 'null' is not assignable to type 'string[]'."
        // We need to suppress this error because of the need to test
        // validations. This throws an error only in the frontend test and
        // not in the backend test.
        // @ts-ignore
        null, 1, true).then(successHandler, failHandler);
      flushMicrotasks();
      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(
        'Skill ids should be a list of strings');
    })
  );

  it('should use the fail handler if question count is sent as null',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');
      questionBackendApiService.fetchQuestionsAsync(
        ['1'], 0, true).then(successHandler, failHandler);
      flushMicrotasks();
      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(
        'Question count has to be a positive integer');
    })
  );

  it('should successfully fetch questions for editors from the backend',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      questionBackendApiService.fetchQuestionSummariesAsync(
        '1').then(successHandler, failHandler);
      let req = httpTestingController.expectOne(
        '/questions_list_handler/1?offset=0');
      expect(req.request.method).toEqual('GET');
      req.flush(sampleResponse);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith({
        questionSummaries: sampleResponse.question_summary_dicts,
        more: false
      });
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it('should use the rejection handler if the backend request failed',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      questionBackendApiService.fetchQuestionSummariesAsync(
        '1').then(successHandler, failHandler);
      let req = httpTestingController.expectOne(
        '/questions_list_handler/1?offset=0');
      expect(req.request.method).toEqual('GET');
      req.flush({
        error: 'Error loading questions.'
      }, {
        status: 500, statusText: 'Invaid request'
      });

      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Error loading questions.');
    })
  );

  it('should successfully fetch questions from the backend with cursor',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      questionBackendApiService.fetchQuestionSummariesAsync(
        '1', 1).then(successHandler, failHandler);
      let req = httpTestingController.expectOne(
        '/questions_list_handler/1?offset=1');
      expect(req.request.method).toEqual('GET');
      req.flush(sampleResponse);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith({
        questionSummaries: sampleResponse.question_summary_dicts,
        more: false
      });
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it('should successfully fetch diagnostic test skill id to questions dict' +
    ' from the backend', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let topicId = 'topicID1';

    let questionBackendDict1: QuestionBackendDict = {
      id: '',
      question_state_data: {
        classifier_model_id: null,
        param_changes: [],
        solicit_answer_details: false,
        content: {
          content_id: '1',
          html: 'Question 1'
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
          },
          {
            outcome: {
              dest: 'State 2',
              dest_if_really_stuck: null,
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
            training_data: [],
            tagged_skill_misconception_id: 'misconceptionId',
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
      next_content_id_index: 1,
      inapplicable_skill_misconception_ids: []
    };

    let questionBackendDict2: QuestionBackendDict = {
      id: '',
      question_state_data: {
        classifier_model_id: null,
        param_changes: [],
        solicit_answer_details: false,
        content: {
          content_id: '2',
          html: 'Question 2'
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
      next_content_id_index: 5,
      inapplicable_skill_misconception_ids: []
    };

    const question1 = questionObjectFactory.createFromBackendDict(
      questionBackendDict1);
    const question2 = questionObjectFactory.createFromBackendDict(
      questionBackendDict2);

    questionBackendApiService.fetchDiagnosticTestQuestionsAsync(
      topicId, ['questionId']).then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/diagnostic_test_questions_handler_url/topicID1' +
      '?excluded_question_ids=questionId'
    );
    expect(req.request.method).toEqual('GET');


    const backendResponse = {
      skill_id_to_questions_dict: {
        skillID1: {
          main_question: questionBackendDict1,
          backup_question: questionBackendDict2
        }
      }
    };

    const diagnosticTestQuestionsModel: DiagnosticTestQuestionsModel = (
      new DiagnosticTestQuestionsModel(question1, question2));

    const expectedResponse = {
      skillID1: diagnosticTestQuestionsModel
    };

    req.flush(backendResponse);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(expectedResponse);
    expect(failHandler).not.toHaveBeenCalledWith();
  }));

  it('should fail to fetch diagnostic test skill id to questions dict from ' +
    'the backend', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let topicId = 'topicID1';

    questionBackendApiService.fetchDiagnosticTestQuestionsAsync(
      topicId, ['questionId']).then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/diagnostic_test_questions_handler_url/topicID1' +
      '?excluded_question_ids=questionId'
    );
    expect(req.request.method).toEqual('GET');

    req.flush({
      error: 'Error loading topic id to diagnostic test skill ids.'
    }, {
      status: 500, statusText: 'Internal Server Error.'
    });
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith(
      'Error loading topic id to diagnostic test skill ids.');
  }));
});
