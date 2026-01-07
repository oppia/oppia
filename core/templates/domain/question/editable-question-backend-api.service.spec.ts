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
 * @fileoverview Unit tests for EditableQuestionBackendApiService.
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
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';

describe('EditableQuestionBackendApiService', () => {
  let httpTestingController: HttpTestingController;
  let service: EditableQuestionBackendApiService;

  const backendQuestionDict: QuestionBackendDict = {
    id: 'question_id',
    question_state_data: {
      content: {
        html: '<p>Question</p>',
        content_id: 'content',
      },
      interaction: {
        id: 'TextInput',
        answer_groups: [],
        confirmed_unclassified_answers: [],
        customization_args: {},
        default_outcome: null,
        hints: [],
        solution: null,
      },
      param_changes: [],
      classifier_model_id: null,
      solicit_answer_details: false,
      card_is_checkpoint: false,
      linked_skill_id: null,
      inapplicable_skill_misconception_ids: [],
    },
    question_state_data_schema_version: 1,
    linked_skill_ids: ['skill_id'],
    inapplicable_skill_misconception_ids: [],
    next_content_id_index: 0,
    language_code: 'en',
    version: 1,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [EditableQuestionBackendApiService, UrlInterpolationService],
    });

    httpTestingController = TestBed.inject(HttpTestingController);
    service = TestBed.inject(EditableQuestionBackendApiService);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should fetch a question successfully', fakeAsync(() => {
    let result!: Question;

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

    expect(result.getId()).toBe('question_id');
  }));

  it('should handle fetch question failure', fakeAsync(() => {
    const errorHandler = jasmine.createSpy('error');

    service.fetchQuestionAsync('question_id').then(() => {}, errorHandler);

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
    expect(errorHandler).toHaveBeenCalled();
  }));

  it('should handle missing associated_skill_dicts', fakeAsync(() => {
    let response!: FetchQuestionResponse;

    service
      .fetchQuestionAsync('question_id')
      .then((res: FetchQuestionResponse) => {
        response = res;
      });

    const req = httpTestingController.expectOne(
      QuestionDomainConstants.EDITABLE_QUESTION_DATA_URL_TEMPLATE.replace(
        '<question_id>',
        'question_id'
      )
    );

    req.flush({
      question_dict: backendQuestionDict,
    });

    flushMicrotasks();

    expect(response.associated_skill_dicts).toEqual([]);
  }));

  it('should update a question successfully', fakeAsync(() => {
    let response!: QuestionBackendDict;

    service
      .updateQuestionAsync('question_id', '1', 'commit', [])
      .then((res: QuestionBackendDict) => {
        response = res;
      });

    const req = httpTestingController.expectOne(
      QuestionDomainConstants.EDITABLE_QUESTION_DATA_URL_TEMPLATE.replace(
        '<question_id>',
        'question_id'
      )
    );
    expect(req.request.method).toBe('PUT');

    req.flush({question_dict: backendQuestionDict});
    flushMicrotasks();

    expect(response.id).toBe('question_id');
  }));

  it('should handle update question failure', fakeAsync(() => {
    const errorHandler = jasmine.createSpy('error');

    service
      .updateQuestionAsync('question_id', '1', 'commit', [])
      .then(() => {}, errorHandler);

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
    const errorHandler = jasmine.createSpy('error');

    service
      .editQuestionSkillLinksAsync('question_id', [])
      .then(() => {}, errorHandler);

    const req = httpTestingController.expectOne(
      QuestionDomainConstants.QUESTION_SKILL_LINK_URL_TEMPLATE.replace(
        '<question_id>',
        'question_id'
      )
    );

    req.flush({}, {status: 500, statusText: 'Server Error'});

    flushMicrotasks();
    expect(errorHandler).toHaveBeenCalled();
  }));

  it('should create question successfully', fakeAsync(() => {
    let response!: CreateQuestionResponse;

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
    const errorHandler = jasmine.createSpy('error');

    service
      .createQuestionAsync([], [], backendQuestionDict, [])
      .then(() => {}, errorHandler);

    const req = httpTestingController.expectOne(
      QuestionDomainConstants.QUESTION_CREATION_URL
    );

    req.flush(
      {error: {error: 'Backend error'}},
      {status: 500, statusText: 'Server Error'}
    );

    flushMicrotasks();
    expect(errorHandler).toHaveBeenCalled();
  }));
});
