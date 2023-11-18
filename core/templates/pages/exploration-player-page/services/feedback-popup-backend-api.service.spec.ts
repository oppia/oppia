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
 * @fileoverview Unit tests for FeedbackPopupBackendApiService.
 */

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { MockTranslateService } from 'components/forms/schema-based-editors/integration-tests/schema-based-editors.integration.spec';
import { FeedbackPopupBackendApiService } from './feedback-popup-backend-api.service';

describe('Feedback Popup Backend Api Service', () => {
  let fbpas: FeedbackPopupBackendApiService;
  let httpTestingController: HttpTestingController;
  let successHandler = jasmine.createSpy('success');
  let failHandler = jasmine.createSpy('fail');

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        FeedbackPopupBackendApiService,
        {
          provide: TranslateService,
          useClass: MockTranslateService
        }
      ]
    });
    httpTestingController = TestBed.inject(HttpTestingController);
    fbpas = TestBed.inject(FeedbackPopupBackendApiService);
  });
  afterEach(() => {
    httpTestingController.verify();
  });

  it('should submit feedback', fakeAsync(() => {
    let subject: string = 'Feedback';
    let feedback: string = 'test feedback';
    let includeAuthor: boolean = true;
    let stateName: string = 'test state name';
    fbpas.submitFeedbackAsync(subject, feedback, includeAuthor, stateName)
      .then(successHandler, failHandler);
    let req = httpTestingController.expectOne(fbpas.feedbackUrl);
    expect(req.request.method).toEqual('POST');
    req.flush({});

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }
  ));
});
