// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Testing of Service Practice Sessions page.
 */

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {TestBed, fakeAsync, flushMicrotasks} from '@angular/core/testing';
import {PracticeSessionsBackendApiService} from './practice-session-backend-api.service';

describe('Review test backend API service', () => {
  let practiceSessionsBackendApiService: PracticeSessionsBackendApiService;
  let httpTestingController: HttpTestingController;
  let ERROR_STATUS_CODE = 500;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PracticeSessionsBackendApiService],
    });
    practiceSessionsBackendApiService = TestBed.inject(
      PracticeSessionsBackendApiService
    );
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should use the rejection handler if the backend request failed', fakeAsync(() => {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    practiceSessionsBackendApiService
      .fetchPracticeSessionsData('0')
      .then(successHandler, failHandler);

    var req = httpTestingController.expectOne('0');
    expect(req.request.method).toEqual('GET');
    req.flush('Error loading data.', {
      status: ERROR_STATUS_CODE,
      statusText: 'Invalid Request',
    });

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  }));

  it('should successfully fetch an practice test data from the backend', fakeAsync(() => {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    practiceSessionsBackendApiService
      .fetchPracticeSessionsData('0')
      .then(successHandler, failHandler);

    var sampleDataResults = {
      skill_ids_to_descriptions_map: {story: 'Story Name'},
      topic_name: 'topic_name',
    };
    var req = httpTestingController.expectOne('0');
    expect(req.request.method).toEqual('GET');
    req.flush(sampleDataResults);

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));
});
