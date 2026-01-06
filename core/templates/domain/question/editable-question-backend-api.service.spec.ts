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
 * @fileoverview Unit tests for EditableQuestionBackendApiService
 */

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {TestBed, fakeAsync, flushMicrotasks} from '@angular/core/testing';

import {
  EditableQuestionBackendApiService,
  SkillLinkageModificationsArray,
  FetchQuestionResponse,
  CreateQuestionResponse,
} from 'domain/question/editable-question-backend-api.service';
import {QuestionBackendDict, Question} from 'domain/question/question.model';
import {QuestionDomainConstants} from 'domain/question/question-domain.constants';

describe('EditableQuestionBackendApiService', () => {
  let httpTestingController: HttpTestingController;
  let service: EditableQuestionBackendApiService;

  const backendQuestionDict: QuestionBackendDict = {
    id: 'question_id',
    question_state_data: {
      content: {html: '<p>Question</p>', content_id: 'content'},
      interaction: {
        id: 'TextInput',
        answer_groups: [],
        confirmed_unclassified_answers: [],
        customization_args: {},
        default_outcome: null,
        param_changes: [],
        hints: [],
        solution: null,
      },
      param_changes: [],
    },
    question_state_data_schema_version: 1,
    linked_skill_ids: ['skill_id'],
    inapplicable_skill_misconception_ids: [],
    next_content_idid_index: 0,
    language_code: 'en',
    version: 1,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [EditableQuestionBackendApiService],
    });

    httpTestingController = TestBed.inject(HttpTestingController);
    service = TestBed.inject(EditableQuestionBackendApiService);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should fetch a question successfully', fakeAsync(() => {
    let result: Question | undefined;

    service
      .fetchQuestionAsync('question_id')
      .then((data: FetchQuestionResponse) => {
        result = data.questionObject;
      });

    const req = httpTestingController.expectOne(
      QuestionDomainConstants.EDITABLE_QUESTION_DATA_URL_TEMPLATE.replace(
        '<question_id>',
        'question_id'
      )
    );
    expect(req.request.method).toBe('GET');

    req.flush({
      question_dict: backendQuestionDict,
      associated_skill_dicts: [],
    });

    flushMicrotasks();

    expect(result).toBeDefined();
    if (!result) {
      fail('Expected question object');
      return;
    }
    expect(result.getId()).toBe('question_id');
  }));

  it('should handle fetch question failure', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const errorHandler = jasmine.createSpy('error');

    service
      .fetchQuestionAsync('question_id')
      .then(successHandler, errorHandler);

    const req = httpTestingController.expectOne(
      QuestionDomainConstants.EDITABLE_QUESTION_DATA_URL_TEMPLATE.replace(
        '<question_id>',
        'question_id'
      )
    );

    req.flush(
      {error: {error: 'Backend error'}},
      {status: 500, statusText: 'Server Error'}
    );

    flushMicrotasks();
    expect(successHandler).not.toHaveBeenCalled();
    expect(errorHandler).toHaveBeenCalled();
  }));

  it('should update a question successfully', fakeAsync(() => {
    let response: unknown = null;

    service
      .updateQuestionAsync('question_id', '1', 'commit', [])
      .then((res: unknown) => {
        response = res;
      });

    const req = httpTestingController.expectOne(
      QuestionDomainConstants.EDITABLE_QUESTION_DATA_URL_TEMPLATE.replace(
        '<question_id>',
        'question_id'
      )
    );
    expect(req.request.method).toBe('PUT');

    req.flush({questionDict: backendQuestionDict});
    flushMicrotasks();

    expect(response).not.toBeNull();
  }));

  it('should handle update question failure', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const errorHandler = jasmine.createSpy('error');

    service
      .updateQuestionAsync('question_id', '1', 'commit', [])
      .then(successHandler, errorHandler);

    const req = httpTestingController.expectOne(
      QuestionDomainConstants.EDITABLE_QUESTION_DATA_URL_TEMPLATE.replace(
        '<question_id>',
        'question_id'
      )
    );

    req.flush(
      {error: {error: 'Backend error'}},
      {status: 500, statusText: 'Server Error'}
    );

    flushMicrotasks();
    expect(successHandler).not.toHaveBeenCalled();
    expect(errorHandler).toHaveBeenCalled();
  }));

  it('should edit question skill links successfully', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');

    const skillIdsTaskArray: SkillLinkageModificationsArray[] = [
      {id: 'skillId', task: 'remove', difficulty: 0},
    ];

    service
      .editQuestionSkillLinksAsync('question_id', skillIdsTaskArray)
      .then(successHandler);

    const req = httpTestingController.expectOne(
      QuestionDomainConstants.QUESTION_SKILL_LINK_URL_TEMPLATE.replace(
        '<question_id>',
        'question_id'
      )
    );
    expect(req.request.method).toBe('PUT');

    req.flush({});
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
  }));

  it('should handle edit question skill links failure', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const errorHandler = jasmine.createSpy('error');

    const skillIdsTaskArray: SkillLinkageModificationsArray[] = [
      {id: 'skillId', task: 'remove', difficulty: 0},
    ];

    service
      .editQuestionSkillLinksAsync('question_id', skillIdsTaskArray)
      .then(successHandler, errorHandler);

    const req = httpTestingController.expectOne(
      QuestionDomainConstants.QUESTION_SKILL_LINK_URL_TEMPLATE.replace(
        '<question_id>',
        'question_id'
      )
    );

    req.flush(
      {error: {error: 'Backend error'}},
      {status: 500, statusText: 'Server Error'}
    );

    flushMicrotasks();
    expect(successHandler).not.toHaveBeenCalled();
    expect(errorHandler).toHaveBeenCalled();
  }));

  it('should create question successfully', fakeAsync(() => {
    let response: CreateQuestionResponse | null = null;

    service
      .createQuestionAsync([], [], backendQuestionDict, [])
      .then((res: CreateQuestionResponse) => {
        response = res;
      });

    const req = httpTestingController.expectOne(
      QuestionDomainConstants.QUESTION_CREATION_URL
    );
    expect(req.request.method).toBe('POST');

    req.flush({question_id: 'new_question_id'});
    flushMicrotasks();

    expect(response).toEqual({questionId: 'new_question_id'});
  }));

  it('should handle create question failure', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const errorHandler = jasmine.createSpy('error');

    service
      .createQuestionAsync([], [], backendQuestionDict, [])
      .then(successHandler, errorHandler);

    const req = httpTestingController.expectOne(
      QuestionDomainConstants.QUESTION_CREATION_URL
    );

    req.flush(
      {error: {error: 'Backend failure'}},
      {status: 500, statusText: 'Server Error'}
    );

    flushMicrotasks();
    expect(successHandler).not.toHaveBeenCalled();
    expect(errorHandler).toHaveBeenCalled();
  }));
});
