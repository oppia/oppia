
// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for QuestionSuggestionBackendApiService.
 */

import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { fakeAsync, flushMicrotasks, TestBed, waitForAsync } from '@angular/core/testing';
import { Question } from 'domain/question/QuestionObjectFactory';
import { SkillDifficulty } from 'domain/skill/skill-difficulty.model';
import { Skill } from 'domain/skill/SkillObjectFactory';
import { QuestionSuggestionBackendApiService } from './question-suggestion-backend-api.service';

const fakeImage = (): File => {
  const blob = new Blob([''], { type: 'image/jpeg' });
  return blob as File;
};

describe('Question Suggestion Backend Api Service', () => {
  let qsbas: QuestionSuggestionBackendApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        QuestionSuggestionBackendApiService
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    qsbas = TestBed.inject(QuestionSuggestionBackendApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  it('should suggest questions', fakeAsync(() => {
    let question = {
      toBackendDict: (isNewQuestion: boolean) => {
        return {};
      }
    };
    let associatedSkill = new Skill(
      'test_skill', 'description', [], [],
      null, 'en', 1, null, 'test_id', false, []);

    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    let skillDifficulty = new SkillDifficulty('test_id', 'test_description', 1);
    qsbas.submitSuggestionAsync(
      question as unknown as Question, associatedSkill, skillDifficulty, [{
        filename: 'image',
        imageBlob: fakeImage()
      }])
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/suggestionhandler/');
    expect(req.request.method).toEqual('POST');
    req.flush({});

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));
});
