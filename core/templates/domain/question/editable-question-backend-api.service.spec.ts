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
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';

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
      providers: [EditableQuestionBackendApiService, UrlInterpolationService],
    });

    httpTestingController = TestBed.inject(HttpTestingController);
    service = TestBed.inject(EditableQuestionBackendApiService);
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should fetch a question successfully', fakeAsync(() => {
    const fakeQuestion = {
      getId: () => 'question_id',
    } as Question;

    spyOn(Question, 'createFromBackendDict').and.returnValue(fakeQuestion);

    let result: FetchQuestionResponse | null = null;

    service.fetchQuestionAsync('question_id').then(
      (res: FetchQuestionResponse) => {
        result = res;
      },
      (err: string) => fail(err)
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

    expect(result).not.toBeNull();
    expect(result!.questionObject.getId()).toBe('question_id');
  }));

  it('should fail when associated_skill_dicts is missing', fakeAsync(() => {
    let errorResult: string | null = null;

    service.fetchQuestionAsync('question_id').catch((err: string) => {
      errorResult = err;
    });

    const req = httpTestingController.expectOne(
      urlInterpolationService.interpolateUrl(
        QuestionDomainConstants.EDITABLE_QUESTION_DATA_URL_TEMPLATE,
        {question_id: 'question_id'}
      )
    );

    req.flush({question_dict: backendQuestionDict});
    flushMicrotasks();

    expect(errorResult).toBe('Unknown backend error');
  }));

  it('should fail when fetchQuestionAsync backend request fails', fakeAsync(() => {
    let errorResult: string | null = null;

    service.fetchQuestionAsync('question_id').catch((err: string) => {
      errorResult = err;
    });

    const req = httpTestingController.expectOne(
      urlInterpolationService.interpolateUrl(
        QuestionDomainConstants.EDITABLE_QUESTION_DATA_URL_TEMPLATE,
        {question_id: 'question_id'}
      )
    );

    req.error(new ErrorEvent('Network error'));
    flushMicrotasks();

    expect(errorResult).toBe('Unknown backend error');
  }));

  it('should update a question successfully', fakeAsync(() => {
    let result: QuestionBackendDict | null = null;

    service.updateQuestionAsync('question_id', '1', 'commit', []).then(
      (res: QuestionBackendDict) => {
        result = res;
      },
      (err: string) => fail(err)
    );

    const req = httpTestingController.expectOne(
      urlInterpolationService.interpolateUrl(
        QuestionDomainConstants.EDITABLE_QUESTION_DATA_URL_TEMPLATE,
        {question_id: 'question_id'}
      )
    );

    expect(req.request.method).toBe('PUT');

    req.flush({question_dict: backendQuestionDict});
    flushMicrotasks();

    expect(result).not.toBeNull();
    expect(result!.id).toBe('question_id');
  }));

  it('should fail when updateQuestionAsync backend request fails', fakeAsync(() => {
    let errorResult: string | null = null;

    service
      .updateQuestionAsync('question_id', '1', 'commit', [])
      .catch((err: string) => {
        errorResult = err;
      });

    const req = httpTestingController.expectOne(
      urlInterpolationService.interpolateUrl(
        QuestionDomainConstants.EDITABLE_QUESTION_DATA_URL_TEMPLATE,
        {question_id: 'question_id'}
      )
    );

    req.error(new ErrorEvent('Network error'));
    flushMicrotasks();

    expect(errorResult).toBe('Unknown backend error');
  }));

  it('should edit question skill links successfully', fakeAsync(() => {
    const skillIdsTaskArray: SkillLinkageModificationsArray[] = [
      {id: 'skillId', task: 'remove', difficulty: 0},
    ];

    let success = false;

    service
      .editQuestionSkillLinksAsync('question_id', skillIdsTaskArray)
      .then(() => {
        success = true;
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

    expect(success).toBe(true);
  }));

  it('should fail when editQuestionSkillLinksAsync backend request fails', fakeAsync(() => {
    let errorResult: string | null = null;

    service
      .editQuestionSkillLinksAsync('question_id', [])
      .catch((err: string) => {
        errorResult = err;
      });

    const req = httpTestingController.expectOne(
      urlInterpolationService.interpolateUrl(
        QuestionDomainConstants.QUESTION_SKILL_LINK_URL_TEMPLATE,
        {question_id: 'question_id'}
      )
    );

    req.error(new ErrorEvent('Network error'));
    flushMicrotasks();

    expect(errorResult).toBe('Unknown backend error');
  }));

  it('should create question successfully', fakeAsync(() => {
    let result: CreateQuestionResponse | null = null;

    service.createQuestionAsync([], [], backendQuestionDict, []).then(
      (res: CreateQuestionResponse) => {
        result = res;
      },
      (err: string) => fail(err)
    );

    const req = httpTestingController.expectOne(
      QuestionDomainConstants.QUESTION_CREATION_URL
    );

    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);

    req.flush({question_id: 'new_question_id'});
    flushMicrotasks();

    expect(result).not.toBeNull();
    expect(result!.questionId).toBe('new_question_id');
  }));

  it('should fail when createQuestionAsync backend request fails', fakeAsync(() => {
    let errorResult: string | null = null;

    service
      .createQuestionAsync([], [], backendQuestionDict, [])
      .catch((err: string) => {
        errorResult = err;
      });

    const req = httpTestingController.expectOne(
      QuestionDomainConstants.QUESTION_CREATION_URL
    );

    req.error(new ErrorEvent('Network error'));
    flushMicrotasks();

    expect(errorResult).toBe('Unknown backend error');
  }));
});
