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

describe('Question backend Api service', () => {
  let questionBackendApiService: QuestionBackendApiService;
  let httpTestingController: HttpTestingController;
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
      imports: [HttpClientTestingModule]
    });

    questionBackendApiService = TestBed.get(QuestionBackendApiService);
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
        ['1'], 'abc' as unknown as number, true
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
        // Use unknown type conversion to check input invalidity.
        'x' as unknown as string[], 1, true).then(successHandler, failHandler);
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
        // Use unknown type conversion to check input invalidity.
        [1, 2] as unknown as string[], 1, true
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
        // Use unknown type conversion to check input invalidity.
        null as unknown as string[], 1, true).then(successHandler, failHandler);
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
});
