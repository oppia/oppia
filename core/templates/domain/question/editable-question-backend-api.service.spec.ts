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
import {QuestionObjectFactory} from 'domain/question/QuestionObjectFactory';
import {
  EditableQuestionBackendApiService,
  SkillLinkageModificationsArray,
} from 'domain/question/editable-question-backend-api.service';
import {CsrfTokenService} from 'services/csrf-token.service';

describe('EditableQuestionBackendApiService', () => {
  let editableQuestionBackendApiService: EditableQuestionBackendApiService;
  let questionObjectFactory: QuestionObjectFactory;
  let httpTestingController: HttpTestingController;
  let csrfService: CsrfTokenService;

  const sampleDataResults = {
    questionDict: {
      id: '0',
      question_state_data: {
        content: {
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
              html: 'Correct Answer',
            },
            param_changes: [],
            labelled_as_correct: true,
          },
          hints: [
            {
              hint_content: {
                html: 'Hint 1',
              },
            },
          ],
          solution: {
            correct_answer: 'This is the correct answer',
            answer_is_exclusive: false,
            explanation: {
              html: 'Solution explanation',
            },
          },
          id: 'TextInput',
        },
        param_changes: [],
        solicit_answer_details: false,
      },
      language_code: 'en',
      version: 1,
    },
    associated_skill_dicts: [],
  };

  const sampleDataResultsObjects = {
    questionObject: null,
    associated_skill_dicts: [],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        EditableQuestionBackendApiService,
        QuestionObjectFactory,
        CsrfTokenService,
      ],
    });

    editableQuestionBackendApiService = TestBed.inject(
      EditableQuestionBackendApiService
    );
    questionObjectFactory = TestBed.inject(QuestionObjectFactory);
    httpTestingController = TestBed.inject(HttpTestingController);
    csrfService = TestBed.inject(CsrfTokenService);

    spyOn(csrfService, 'getTokenAsync').and.returnValue(
      Promise.resolve('sample-csrf-token')
    );

    sampleDataResultsObjects.questionObject =
      questionObjectFactory.createFromBackendDict(
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

    editableQuestionBackendApiService
      .createQuestionAsync(skillsId, skillDifficulties, questionObject, [
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
    const imageBlob = new Blob(['data:image/png;base64,xyz'], {
      type: 'image/png',
    });
    const imageData = {
      filename: 'image.png',
      imageBlob: imageBlob,
    };

    editableQuestionBackendApiService
      .createQuestionAsync(skillsId, skillDifficulties, questionObject, [
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
    let question;

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
    question.version = '2';
    const questionWrapper = {
      questionDict: question,
    };

    editableQuestionBackendApiService
      .updateQuestionAsync(
        question.id,
        question.version,
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

    expect(successHandler).toHaveBeenCalledWith(question);
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
      },
    ];

    editableQuestionBackendApiService
      .editQuestionSkillLinksAsync(questionId, skillIdsTaskArray)
      .then(successHandler, failHandler);

    const req = httpTestingController.expectOne(
      `/manage_question_skill_link/${questionId}`
    );
    expect(req.request.method).toEqual('PUT');
    req.flush({status: 200});
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
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
