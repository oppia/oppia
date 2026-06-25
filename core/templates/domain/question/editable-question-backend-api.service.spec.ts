// Copyright 2020 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// you may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit tests for EditableQuestionBackendApiService.
 */

import {fakeAsync, flushMicrotasks, TestBed} from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {Question, QuestionBackendDict} from 'domain/question/question.model';
import {
  EditableQuestionBackendApiService,
  SkillLinkageModificationsArray,
} from 'domain/question/editable-question-backend-api.service';
import {SkillBackendDict} from 'domain/skill/skill.model';
import {CsrfTokenService} from 'services/csrf-token.service';

describe('EditableQuestionBackendApiService', () => {
  let editableQuestionBackendApiService: EditableQuestionBackendApiService;
  let httpTestingController: HttpTestingController;
  let csrfService: CsrfTokenService;

  const sampleDataResults = {
    questionDict: {
      id: '0',
      question_state_data: {
        content: {
          content_id: 'content_0',
          html: 'Question 1',
        },
        interaction: {
          answer_groups: [],
          confirmed_unclassified_answers: [],
          customization_args: {
            placeholder: {
              value: {
                content_id: 'ca_placeholder_0',
                unicode_str: '',
              },
            },
            rows: {value: 1},
            catchMisspellings: {
              value: false,
            },
          },
          default_outcome: {
            dest: null,
            dest_if_really_stuck: null,
            feedback: {
              content_id: 'default_outcome_0',
              html: 'Correct Answer',
            },
            param_changes: [],
            labelled_as_correct: true,
            refresher_exploration_id: null,
            missing_prerequisite_skill_id: null,
          },
          hints: [
            {
              hint_content: {
                content_id: 'hint_0',
                html: 'Hint 1',
              },
            },
          ],
          solution: {
            correct_answer: 'This is the correct answer',
            answer_is_exclusive: false,
            explanation: {
              content_id: 'solution_0',
              html: 'Solution explanation',
            },
          },
          id: 'TextInput',
        },
        param_changes: [],
        solicit_answer_details: false,
        classifier_model_id: null,
        card_is_checkpoint: false,
        linked_skill_id: null,
        inapplicable_skill_misconception_ids: [],
      },
      language_code: 'en',
      version: 1,
      question_state_data_schema_version: 1,
      linked_skill_ids: [],
      inapplicable_skill_misconception_ids: [],
      next_content_id_index: 1,
    },
    associated_skill_dicts: [],
  };

  const sampleDataResultsObjects: {
    questionObject: Question | null;
    associated_skill_dicts: SkillBackendDict[];
  } = {
    questionObject: null,
    associated_skill_dicts: [],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [EditableQuestionBackendApiService, CsrfTokenService],
    });

    editableQuestionBackendApiService = TestBed.inject(
      EditableQuestionBackendApiService
    );
    httpTestingController = TestBed.inject(HttpTestingController);
    csrfService = TestBed.inject(CsrfTokenService);

    spyOn(csrfService, 'getTokenAsync').and.returnValue(
      Promise.resolve('sample-csrf-token')
    );

    sampleDataResultsObjects.questionObject = Question.createFromBackendDict(
      sampleDataResults.questionDict
    );
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should successfully create a new question', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const failHandler = jasmine.createSpy('fail');

    const imageBlob = new Blob(['data:image/png;base64,xyz'], {
      type: 'image/png',
    });
    const imageData = {
      filename: 'image.png',
      imageBlob: imageBlob,
    };
    const skillsId = ['0', '01', '02'];
    const skillDifficulties = [1, 1, 2];
    const questionObject = sampleDataResultsObjects.questionObject;
    if (questionObject === null) {
      throw new Error('Question object should not be null');
    }
    const questionDict = questionObject.toBackendDict(true);

    editableQuestionBackendApiService
      .createQuestionAsync(skillsId, skillDifficulties, questionDict, [
        imageData,
      ])
      .then(successHandler, failHandler);

    const req = httpTestingController.expectOne(
      '/question_editor_handler/create_new'
    );
    expect(req.request.method).toEqual('POST');
    req.flush({question_id: '0'});
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith({questionId: '0'});
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should use the rejection handler when create question fails', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const failHandler = jasmine.createSpy('fail');

    const skillsId = ['0', '01', '02'];
    const skillDifficulties = [1, 1, 2];
    const questionObject = sampleDataResultsObjects.questionObject;
    if (questionObject === null) {
      throw new Error('Question object should not be null');
    }
    const questionDict = questionObject.toBackendDict(true);
    const imageBlob = new Blob(['data:image/png;base64,xyz'], {
      type: 'image/png',
    });
    const imageData = {
      filename: 'image.png',
      imageBlob: imageBlob,
    };

    editableQuestionBackendApiService
      .createQuestionAsync(skillsId, skillDifficulties, questionDict, [
        imageData,
      ])
      .then(successHandler, failHandler);

    const req = httpTestingController.expectOne(
      '/question_editor_handler/create_new'
    );
    expect(req.request.method).toEqual('POST');

    req.flush(
      {error: 'Error creating a new question.'},
      {status: 500, statusText: 'Internal Server Error'}
    );
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith('Error creating a new question.');
  }));

  it('should successfully fetch an existing question from the backend', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const failHandler = jasmine.createSpy('fail');

    editableQuestionBackendApiService
      .fetchQuestionAsync('0')
      .then(successHandler, failHandler);

    const req = httpTestingController.expectOne(
      '/question_editor_handler/data/0'
    );
    expect(req.request.method).toEqual('GET');
    req.flush({
      question_dict: sampleDataResults.questionDict,
      associated_skill_dicts: sampleDataResults.associated_skill_dicts,
    });
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith({
      questionObject: sampleDataResultsObjects.questionObject,
      associated_skill_dicts: sampleDataResults.associated_skill_dicts,
    });
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should use the rejection handler if the backend request failed', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const failHandler = jasmine.createSpy('fail');

    editableQuestionBackendApiService
      .fetchQuestionAsync('1')
      .then(successHandler, failHandler);

    const req = httpTestingController.expectOne(
      '/question_editor_handler/data/1'
    );
    expect(req.request.method).toEqual('GET');
    req.flush(
      {error: 'Error loading question 1.'},
      {status: 500, statusText: 'Internal Server Error'}
    );
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith('Error loading question 1.');
  }));

  it('should update a question after fetching it from the backend', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const failHandler = jasmine.createSpy('fail');
    let question!: QuestionBackendDict;

    editableQuestionBackendApiService.fetchQuestionAsync('0').then(data => {
      question = data.questionObject.toBackendDict(false);
    });

    const req = httpTestingController.expectOne(
      '/question_editor_handler/data/0'
    );
    expect(req.request.method).toEqual('GET');
    req.flush({
      question_dict: sampleDataResults.questionDict,
      associated_skill_dicts: sampleDataResults.associated_skill_dicts,
    });
    flushMicrotasks();

    question.question_state_data.content.html = 'New Question Content';
    question.version = 2;
    const questionWrapper = {
      question_dict: question,
    };

    editableQuestionBackendApiService
      .updateQuestionAsync(
        question.id ?? '',
        String(question.version),
        'Question Data is updated',
        []
      )
      .then(successHandler, failHandler);

    const updateReq = httpTestingController.expectOne(
      '/question_editor_handler/data/0'
    );
    expect(updateReq.request.method).toEqual('PUT');
    updateReq.flush(questionWrapper);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(
      Question.createFromBackendDict(question)
    );
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it("should use the rejection handler if the question to update doesn't exist", fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const failHandler = jasmine.createSpy('fail');

    editableQuestionBackendApiService
      .updateQuestionAsync('1', '1', 'Update an invalid question.', [])
      .then(successHandler, failHandler);

    const req = httpTestingController.expectOne(
      '/question_editor_handler/data/1'
    );
    expect(req.request.method).toEqual('PUT');
    req.flush(
      {error: "Question with given id doesn't exist."},
      {status: 404, statusText: 'Not Found'}
    );
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith(
      "Question with given id doesn't exist."
    );
  }));

  it('should edit an existing question', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const failHandler = jasmine.createSpy('fail');

    const questionId = '0';
    const skillIdsTaskArray: SkillLinkageModificationsArray[] = [
      {
        id: 'skillId',
        task: 'remove',
        difficulty: 0.3,
      },
    ];

    editableQuestionBackendApiService
      .editQuestionSkillLinksAsync(questionId, skillIdsTaskArray)
      .then(successHandler, failHandler);

    const req = httpTestingController.expectOne(
      `/manage_question_skill_link/${questionId}`
    );
    expect(req.request.method).toEqual('PUT');
    req.flush({
      question_dict: sampleDataResults.questionDict,
    });
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(
      Question.createFromBackendDict(sampleDataResults.questionDict)
    );
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should use the rejection handler when editing an existing question fails', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const failHandler = jasmine.createSpy('fail');

    const questionId = '0';
    const skillIdsTaskArray: SkillLinkageModificationsArray[] = [
      {
        id: 'skillId',
        task: 'remove',
        difficulty: 0.3,
      },
    ];

    editableQuestionBackendApiService
      .editQuestionSkillLinksAsync(questionId, skillIdsTaskArray)
      .then(successHandler, failHandler);

    const req = httpTestingController.expectOne(
      `/manage_question_skill_link/${questionId}`
    );
    expect(req.request.method).toEqual('PUT');
    req.flush(
      {error: 'Error loading question 0.'},
      {status: 500, statusText: 'Internal Server Error'}
    );
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith('Error loading question 0.');
  }));
});
