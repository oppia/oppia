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
 * @fileoverview Unit tests for LearnerViewRatingBackendApiService.
 */

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { MockTranslateService } from 'components/forms/schema-based-editors/integration-tests/schema-based-editors.integration.spec';
import { LearnerViewRatingBackendApiService } from './learner-view-rating-backend-api.service';

describe('Learner View Rating Backend Api Service', () => {
  let lvrbas: LearnerViewRatingBackendApiService;
  let httpTestingController: HttpTestingController;
  let successHandler = jasmine.createSpy('success');
  let failHandler = jasmine.createSpy('fail');

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        LearnerViewRatingBackendApiService,
        {
          provide: TranslateService,
          useClass: MockTranslateService
        }
      ]
    });
    httpTestingController = TestBed.inject(HttpTestingController);
    lvrbas = TestBed.inject(LearnerViewRatingBackendApiService);
  });
  afterEach(() => {
    httpTestingController.verify();
  });

  it('should fetch user rating', fakeAsync(() => {
    let jobOutput = {
      user_rating: 5
    };
    lvrbas.getUserRatingAsync().then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      lvrbas.ratingsUrl);
    expect(req.request.method).toEqual('GET');
    req.flush(jobOutput);

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should submit user rating', fakeAsync(() => {
    lvrbas.submitUserRatingAsync(3).then(successHandler, failHandler);
    let req = httpTestingController.expectOne(
      lvrbas.ratingsUrl);
    expect(req.request.method).toEqual('PUT');
    req.flush({});

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));
});
