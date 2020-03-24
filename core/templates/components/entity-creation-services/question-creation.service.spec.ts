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
 * @fileoverview Tests the service that creates the question.
 */
import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { QuestionCreationService } from
  'components/entity-creation-services/question-creation.service';

fdescribe('Question Creation Service', function() {
  let questionCreationService: QuestionCreationService = null;
  let httpTestingController: HttpTestingController;
  const sampleBody = {
    question_dict: {someKey: 'someValue'},
    skill_ids: ['skillId1'],
    skill_difficulties: [0.6]
  };
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    httpTestingController = TestBed.get(HttpTestingController);
    questionCreationService = TestBed.get(QuestionCreationService);
  });

  afterEach(() => {
    httpTestingController.verify();
  });
  fit('should create a new question successfully',
    fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');

      questionCreationService.createNew(sampleBody).then(
        successHandler, failHandler
      );
      const req = httpTestingController.expectOne(
        '/question_editor_handler/create_new');
      req.flush(sampleBody);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    })
  );
});
