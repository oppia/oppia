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
} from 'domain/question/editable-question-backend-api.service';

import {Question} from 'domain/question/question.model';

/**
 * Local backend dict shape.
 * (QuestionBackendDict is not exported in Oppia, so specs define it inline)
 */
interface QuestionBackendDict {
  id: string;
  question_state_data: unknown;
  question_state_data_schema_version: number;
  linked_skill_ids: string[];
  inapplicable_skill_misconception_ids: string[];
  next_content_id_index: number;
  language_code: string;
  version: number;
}

describe('Editable question backend API service', () => {
  let httpTestingController: HttpTestingController;
  let editableQuestionBackendApiService: EditableQuestionBackendApiService;

  const backendQuestionDict: QuestionBackendDict = {
    id: 'question_id',
    question_state_data: {
      content: {
        html: '<p>Question</p>',
      },
      interaction: {
        id: 'TextInput',
        answer_groups: [],
        confirmed_unclassified_answers: [],
        customization_args: {
          placeholder: {
            value: {
              content_id: 'placeholder',
              unicode_str: '',
            },
          },
          rows: {value: 1},
          catchMisspellings: {value: false},
        },
        default_outcome: null,
        hints: [],
        solution: null,
      },
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
    });

    httpTestingController = TestBed.get(HttpTestingController);
    editableQuestionBackendApiService = TestBed.get(
      EditableQuestionBackendApiService
    );
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should fetch a question successfully', fakeAsync(() => {
    let result!: Question;

    editableQuestionBackendApiService
      .fetchQuestionAsync('question_id')
      .then((data: FetchQuestionResponse) => {
        result = data.questionObject;
      });

    const req = httpTestingController.expectOne(
      '/question_editor_handler/data/question_id'
    );
    expect(req.request.method).toBe('GET');

    req.flush({
      question_dict: backendQuestionDict,
      associated_skill_dicts: [],
    });

    flushMicrotasks();

    expect(result.getId()).toBe('question_id');
  }));

  it('should update a question successfully', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');

    editableQuestionBackendApiService
      .updateQuestionAsync(
        backendQuestionDict.id,
        backendQuestionDict.version.toString(),
        'Question updated',
        []
      )
      .then(successHandler);

    const req = httpTestingController.expectOne(
      '/question_editor_handler/data/question_id'
    );
    expect(req.request.method).toBe('PUT');

    req.flush({
      questionDict: backendQuestionDict,
    });

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(backendQuestionDict);
  }));

  it('should edit an existing question skill links', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');

    const skillIdsTaskArray: SkillLinkageModificationsArray[] = [
      {
        id: 'skillId',
        task: 'remove',
        difficulty: 0,
      },
    ];

    editableQuestionBackendApiService
      .editQuestionSkillLinksAsync('question_id', skillIdsTaskArray)
      .then(successHandler);

    const req = httpTestingController.expectOne(
      '/manage_question_skill_link/question_id'
    );
    expect(req.request.method).toBe('PUT');

    req.flush({});
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
  }));
});
