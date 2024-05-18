// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for EditableQuestionBackendApiService.
 */

import {fakeAsync, flushMicrotasks, TestBed} from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {importAllAngularServices} from 'tests/unit-test-utils.ajs';
import {QuestionObjectFactory} from 'domain/question/QuestionObjectFactory';
import {
  EditableQuestionBackendApiService,
  SkillLinkageModificationsArray,
} from 'domain/question/editable-question-backend-api.service';
import {CsrfTokenService} from 'services/csrf-token.service';

describe('Editable question backend API service', function () {
  let editableQuestionBackendApiService: EditableQuestionBackendApiService;
  let questionObjectFactory: QuestionObjectFactory = null;
  let sampleDataResults = null;
  let sampleDataResultsObjects = null;
  let httpTestingController: HttpTestingController = null;
  let csrfService = null;

  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [EditableQuestionBackendApiService],
    });
    editableQuestionBackendApiService = TestBed.get(
      EditableQuestionBackendApiService
    );
    questionObjectFactory = TestBed.get(QuestionObjectFactory);
    httpTestingController = TestBed.get(HttpTestingController);
    csrfService = TestBed.get(CsrfTokenService);
    spyOn(csrfService, 'getTokenAsync').and.callFake(async () => {
      return Promise.resolve('sample-csrf-token');
    });
    // Sample question object returnable from the backend.
    sampleDataResults = {
      questionDict: {
        id: '0',
        question_state_data: {
          content: {
            html: 'Question 1',
          },
          recorded_voiceovers: {
            voiceovers_mapping: {},
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

    sampleDataResultsObjects = {
      questionObject: questionObjectFactory.createFromBackendDict(
        sampleDataResults.questionDict
      ),
      associated_skill_dicts: [],
    };
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should successfully create a new question', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    let imageBlob = new Blob(['data:image/png;base64,xyz'], {
      type: 'image/png',
    });
    let imageData = {
      filename: 'image.png',
      imageBlob: imageBlob,
    };
    let skillsId = ['0', '01', '02'];
    let skillDifficulties = [1, 1, 2];
    let questionObject = sampleDataResultsObjects.questionObject;

    editableQuestionBackendApiService
      .createQuestionAsync(skillsId, skillDifficulties, questionObject, [
        imageData,
      ])
      .then(successHandler, failHandler);
    var req = httpTestingController.expectOne(
      '/question_editor_handler/create_new'
    );
    expect(req.request.method).toEqual('POST');
    req.flush({question_id: '0'});
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith({questionId: '0'});
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should use the rejection handler when create question fails', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    let skillsId = ['0', '01', '02'];
    let skillDifficulties = [1, 1, 2];
    let questionObject = sampleDataResultsObjects.questionObject;
    let imageBlob = new Blob(['data:image/png;base64,xyz'], {
      type: 'image/png',
    });
    let imageData = {
      filename: 'image.png',
      imageBlob: imageBlob,
    };

    editableQuestionBackendApiService
      .createQuestionAsync(skillsId, skillDifficulties, questionObject, [
        imageData,
      ])
      .then(successHandler, failHandler);
    var req = httpTestingController.expectOne(
      '/question_editor_handler/create_new'
    );
    expect(req.request.method).toEqual('POST');

    req.flush(
      {
        error: 'Error creating a new question.',
      },
      {status: 500, statusText: 'Internal Server Error'}
    );
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith('Error creating a new question.');
  }));

  it('should successfully fetch an existing question from the backend', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    editableQuestionBackendApiService
      .fetchQuestionAsync('0')
      .then(successHandler, failHandler);
    var req = httpTestingController.expectOne(
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
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    editableQuestionBackendApiService
      .fetchQuestionAsync('1')
      .then(successHandler, failHandler);
    var req = httpTestingController.expectOne(
      '/question_editor_handler/data/1'
    );
    expect(req.request.method).toEqual('GET');
    req.flush(
      {
        error: 'Error loading question 1.',
      },
      {status: 500, statusText: 'Internal Server Error'}
    );
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith('Error loading question 1.');
  }));

  it('should update a question after fetching it from the backend', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');
    let question = null;

    // Loading a question the first time should fetch it from the backend.
    editableQuestionBackendApiService.fetchQuestionAsync('0').then(data => {
      question = data.questionObject.toBackendDict(false);
    });
    var req = httpTestingController.expectOne(
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
    let questionWrapper = {
      questionDict: question,
    };

    // Send a request to update question.
    editableQuestionBackendApiService
      .updateQuestionAsync(
        question.id,
        question.version,
        'Question Data is updated',
        []
      )
      .then(successHandler, failHandler);
    req = httpTestingController.expectOne('/question_editor_handler/data/0');
    expect(req.request.method).toEqual('PUT');
    req.flush(questionWrapper);
    flushMicrotasks();
    expect(successHandler).toHaveBeenCalledWith(question);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it(
    'should use the rejection handler if the question to update ' +
      "doesn't exist",
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');
      editableQuestionBackendApiService
        .updateQuestionAsync('1', '1', 'Update an invalid question.', [])
        .then(successHandler, failHandler);

      var req = httpTestingController.expectOne(
        '/question_editor_handler/data/1'
      );
      expect(req.request.method).toEqual('PUT');
      req.flush(
        {
          error: "Question with given id doesn't exist.",
        },
        {status: 404, statusText: 'Not Found'}
      );
      flushMicrotasks();
      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(
        "Question with given id doesn't exist."
      );
    })
  );

  it('should edit an existing question', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    let questionId = '0';
    let skillIdsTaskArray = [
      {
        id: 'skillId',
        task: 'remove',
      } as SkillLinkageModificationsArray,
    ];

    editableQuestionBackendApiService
      .editQuestionSkillLinksAsync(questionId, skillIdsTaskArray)
      .then(successHandler, failHandler);
    let req = httpTestingController.expectOne(
      '/manage_question_skill_link/' + questionId
    );
    expect(req.request.method).toEqual('PUT');
    req.flush({status: 200});
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it(
    'should use the rejection handler when editing an existing' +
      ' question fails',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      let questionId = '0';
      let skillIdsTaskArray = [
        {
          id: 'skillId',
          task: 'remove',
        } as SkillLinkageModificationsArray,
      ];

      editableQuestionBackendApiService
        .editQuestionSkillLinksAsync(questionId, skillIdsTaskArray)
        .then(successHandler, failHandler);
      let req = httpTestingController.expectOne(
        '/manage_question_skill_link/' + questionId
      );
      expect(req.request.method).toEqual('PUT');
      req.flush(
        {
          error: 'Error loading question 0.',
        },
        {status: 500, statusText: 'Internal Server Error'}
      );
      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Error loading question 0.');
    })
  );
});
