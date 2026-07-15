// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for LearnerAnswerDetailsBackendApiService
 */
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {fakeAsync, flushMicrotasks, TestBed} from '@angular/core/testing';

import {LearnerAnswerDetailsBackendApiService} from 'domain/statistics/learner-answer-details-backend-api.service';

describe('Learner answer info backend Api service', () => {
  let httpTestingController: HttpTestingController;
  let learnerAnswerDetailsBackendApiService: LearnerAnswerDetailsBackendApiService;
  let ERROR_STATUS_CODE = 500;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    httpTestingController = TestBed.get(HttpTestingController);
    learnerAnswerDetailsBackendApiService = TestBed.get(
      LearnerAnswerDetailsBackendApiService
    );
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should successfully record the learner answer details', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    learnerAnswerDetailsBackendApiService
      .recordLearnerAnswerDetailsAsync(
        'exp123',
        'Introduction',
        'TextInput',
        'sample answer',
        'sample answer details'
      )
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/learneranswerdetailshandler/exploration/exp123'
    );
    expect(req.request.method).toEqual('PUT');
    req.flush(200);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should use rejection handler if learner answer backend request failed', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    learnerAnswerDetailsBackendApiService
      .recordLearnerAnswerDetailsAsync(
        'exp123',
        'Introduction',
        'TextInput',
        'sample answer',
        'sample answer details'
      )
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/learneranswerdetailshandler/exploration/exp123'
    );
    expect(req.request.method).toEqual('PUT');

    req.flush('Error loading learner answer details data.', {
      status: ERROR_STATUS_CODE,
      statusText: 'Invalid Request',
    });

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  }));
});
