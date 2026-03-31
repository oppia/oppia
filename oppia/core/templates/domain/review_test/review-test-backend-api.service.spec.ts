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
 * @fileoverview Unit tests for ReviewTestBackendApiService.
 */

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {TestBed, fakeAsync, flushMicrotasks} from '@angular/core/testing';

import {ReviewTestBackendApiService} from 'domain/review_test/review-test-backend-api.service';
import {UrlService} from 'services/contextual/url.service';

describe('Review test backend API service', () => {
  let reviewTestBackendApiService: ReviewTestBackendApiService;
  let httpTestingController: HttpTestingController;
  let urlService: UrlService;

  var ERROR_STATUS_CODE = 500;

  var sampleDataResults = {
    story_name: 'Story Name',
    skill_descriptions: {},
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ReviewTestBackendApiService],
    });
    reviewTestBackendApiService = TestBed.inject(ReviewTestBackendApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
    urlService = TestBed.inject(UrlService);
    spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.callFake(
      () => 'abbrev-topic'
    );
    spyOn(urlService, 'getClassroomUrlFragmentFromLearnerUrl').and.callFake(
      () => 'math'
    );
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should successfully fetch an review test data from the backend', fakeAsync(() => {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    reviewTestBackendApiService
      .fetchReviewTestDataAsync('0')
      .then(successHandler, failHandler);

    var req = httpTestingController.expectOne(
      '/review_test_handler/data/math/abbrev-topic/0'
    );
    expect(req.request.method).toEqual('GET');
    req.flush(sampleDataResults);

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should use the rejection handler if the backend request failed', fakeAsync(() => {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    reviewTestBackendApiService
      .fetchReviewTestDataAsync('0')
      .then(successHandler, failHandler);

    var req = httpTestingController.expectOne(
      '/review_test_handler/data/math/abbrev-topic/0'
    );
    expect(req.request.method).toEqual('GET');
    req.flush('Error loading data.', {
      status: ERROR_STATUS_CODE,
      statusText: 'Invalid Request',
    });

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  }));
});
