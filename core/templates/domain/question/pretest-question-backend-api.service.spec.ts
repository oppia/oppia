// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for PretestQuestionBackendApiService.
 */

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { PretestQuestionBackendApiService } from
  'domain/question/pretest-question-backend-api.service';
import { QuestionBackendDict, QuestionObjectFactory } from
  'domain/question/QuestionObjectFactory';

describe('Pretest question backend API service', function() {
  let pretestQuestionBackendApiService: PretestQuestionBackendApiService;
  let httpTestingController: HttpTestingController;
  let questionObjectFactory: QuestionObjectFactory;

  var ERROR_STATUS_CODE = 500;

  var responseDictionaries = {
    pretest_question_dicts: [{
      id: '0',
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
            tagged_skill_misconception_id: null,
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
            training_data: null,
            tagged_skill_misconception_id: 'misconceptionId',
          }],
          default_outcome: {
            dest: 'default',
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
            },
            catchMisspellings: {
              value: false
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
      language_code: 'en',
      version: 1,
      question_state_data_schema_version: 0,
      linked_skill_ids: [],
      next_content_id_index: 1,
      inapplicable_skill_misconception_ids: []
    }]
  };

  var sampleDataResultsObjects: {pretest_question_objects: {}};

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PretestQuestionBackendApiService]
    });
    pretestQuestionBackendApiService = TestBed.inject(
      PretestQuestionBackendApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
    questionObjectFactory = TestBed.inject(QuestionObjectFactory);

    sampleDataResultsObjects = {
      pretest_question_objects: [
        questionObjectFactory.createFromBackendDict(
          responseDictionaries.pretest_question_dicts[0] as QuestionBackendDict)
      ]
    };
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should successfully fetch pretest questions from the backend',
    fakeAsync(() => {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      pretestQuestionBackendApiService.fetchPretestQuestionsAsync(
        'expId', 'story-fragment').then(successHandler, failHandler);

      var req = httpTestingController.expectOne(
        '/pretest_handler/expId?story_url_fragment=story-fragment');
      expect(req.request.method).toEqual('GET');
      req.flush(responseDictionaries);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith(
        sampleDataResultsObjects.pretest_question_objects);
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it('should use the rejection handler if the backend request failed',
    fakeAsync(() => {
      var successHandler = jasmine.createSpy('success');
      var failHandler = jasmine.createSpy('fail');

      pretestQuestionBackendApiService.fetchPretestQuestionsAsync(
        'expId', 'story-fragment').then(successHandler, failHandler);

      var req = httpTestingController.expectOne(
        '/pretest_handler/expId?story_url_fragment=story-fragment');
      expect(req.request.method).toEqual('GET');
      req.flush('Error loading data.', {
        status: ERROR_STATUS_CODE, statusText: 'Invalid Request'
      });

      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    })
  );

  it('should return empty list if we fetch pretest ' +
    'question with invalid url fragment', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let invalidUrl = '-invalid-url-';
    let emptyList: string[] = [];

    pretestQuestionBackendApiService.fetchPretestQuestionsAsync(
      'expId', invalidUrl).then(successHandler, failHandler);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(emptyList);
    expect(failHandler).not.toHaveBeenCalled();
  }));
});
