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
import {QuestionBackendDict} from 'domain/question/question.model';
import {QuestionDomainConstants} from 'domain/question/question-domain.constants';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {CsrfTokenService} from 'services/csrf-token.service';

class MockCsrfTokenService {
  getTokenAsync(): Promise<string> {
    return Promise.resolve('csrf-token');
  }
}

describe('EditableQuestionBackendApiService', () => {
  let httpTestingController: HttpTestingController;
  let service: EditableQuestionBackendApiService;
  let urlInterpolationService: UrlInterpolationService;

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
      providers: [
        EditableQuestionBackendApiService,
        UrlInterpolationService,
        {
          provide: CsrfTokenService,
          useClass: MockCsrfTokenService,
        },
      ],
    });

    httpTestingController = TestBed.inject(HttpTestingController);
    service = TestBed.inject(EditableQuestionBackendApiService);
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should fetch a question successfully', fakeAsync(() => {
    let result: FetchQuestionResponse | undefined;
    let errorResult: unknown;

    service.fetchQuestionAsync('question_id').then(
      (res: FetchQuestionResponse) => {
        result = res;
      },
      (err: unknown) => {
        errorResult = err;
      }
    );

    const req = httpTestingController.expectOne(
      urlInterpolationService.interpolateUrl(
        QuestionDomainConstants.EDITABLE_QUESTION_DATA_URL_TEMPLATE,
        {question_id: 'question_id'}
      )
    );
    expect(req.request.method).toBe('GET');

    req.flush({
      question_dict: backendQuestionDict,
      associated_skill_dicts: [],
    });

    flushMicrotasks();

    expect(errorResult).toBeUndefined();
    if (result === undefined) {
      fail('Expected result to be defined');
    }
    expect(result.questionObject.getId()).toBe('question_id');
  }));

  it('should handle missing associated_skill_dicts', fakeAsync(() => {
    let result: FetchQuestionResponse | undefined;

    service
      .fetchQuestionAsync('question_id')
      .then((res: FetchQuestionResponse) => {
        result = res;
      });

    const req = httpTestingController.expectOne(
      urlInterpolationService.interpolateUrl(
        QuestionDomainConstants.EDITABLE_QUESTION_DATA_URL_TEMPLATE,
        {question_id: 'question_id'}
      )
    );

    req.flush({
      question_dict: backendQuestionDict,
    });

    flushMicrotasks();

    if (result === undefined) {
      fail('Expected result to be defined');
    }
    expect(result.associated_skill_dicts).toEqual([]);
  }));

  it('should handle fetch question failure', fakeAsync(() => {
    const errorHandler = jasmine.createSpy('error');

    service.fetchQuestionAsync('question_id').then(
      () => {},
      (err: unknown) => {
        errorHandler(err);
      }
    );

    const req = httpTestingController.expectOne(
      urlInterpolationService.interpolateUrl(
        QuestionDomainConstants.EDITABLE_QUESTION_DATA_URL_TEMPLATE,
        {question_id: 'question_id'}
      )
    );

    req.flush(
      {error: {error: 'Backend error'}},
      {status: 500, statusText: 'Server Error'}
    );

    flushMicrotasks();
    expect(errorHandler).toHaveBeenCalled();
  }));

  it('should update a question successfully', fakeAsync(() => {
    let result: QuestionBackendDict | undefined;

    service
      .updateQuestionAsync('question_id', '1', 'commit', [])
      .then((res: QuestionBackendDict) => {
        result = res;
      });

    const req = httpTestingController.expectOne(
      urlInterpolationService.interpolateUrl(
        QuestionDomainConstants.EDITABLE_QUESTION_DATA_URL_TEMPLATE,
        {question_id: 'question_id'}
      )
    );
    expect(req.request.method).toBe('PUT');

    req.flush({question_dict: backendQuestionDict});
    flushMicrotasks();

    if (result === undefined) {
      fail('Expected result to be defined');
    }
    expect(result.id).toBe('question_id');
  }));

  it('should edit question skill links successfully', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');

    const skillIdsTaskArray: SkillLinkageModificationsArray[] = [
      {id: 'skillId', task: 'remove', difficulty: 0},
    ];

    service
      .editQuestionSkillLinksAsync('question_id', skillIdsTaskArray)
      .then(() => {
        successHandler();
      });

    const req = httpTestingController.expectOne(
      urlInterpolationService.interpolateUrl(
        QuestionDomainConstants.QUESTION_SKILL_LINK_URL_TEMPLATE,
        {question_id: 'question_id'}
      )
    );
    expect(req.request.method).toBe('PUT');

    req.flush({});
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
  }));

  it('should create question successfully', fakeAsync(() => {
    let result: CreateQuestionResponse | undefined;

    service
      .createQuestionAsync([], [], backendQuestionDict, [])
      .then((res: CreateQuestionResponse) => {
        result = res;
      });

    const req = httpTestingController.expectOne(
      QuestionDomainConstants.QUESTION_CREATION_URL
    );
    expect(req.request.method).toBe('POST');

    req.flush({question_id: 'new_question_id'});
    flushMicrotasks();

    expect(result).toEqual({questionId: 'new_question_id'});
  }));
});
