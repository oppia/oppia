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
 * @fileoverview Unit tests for StateTopAnswersStatsBackendApiService.
 */

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {TestBed, fakeAsync, flushMicrotasks} from '@angular/core/testing';

import {StateTopAnswersStatsBackendApiService} from 'services/state-top-answers-stats-backend-api.service';

describe('StateTopAnswersStatsBackendApiService', () => {
  let httpTestingController: HttpTestingController;
  let stateTopAnswersStatsBackendApiService: StateTopAnswersStatsBackendApiService;

  var ERROR_STATUS_CODE = 500;

  var sampleDataResults = {
    answers: {
      Hola: [
        {answer: 'hola', frequency: 7},
        {answer: 'adios', frequency: 5},
        {answer: 'que?', frequency: 2},
      ],
    },
    interaction_ids: {Hola: 'TextInput'},
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [StateTopAnswersStatsBackendApiService],
    });
    stateTopAnswersStatsBackendApiService = TestBed.get(
      StateTopAnswersStatsBackendApiService
    );
    httpTestingController = TestBed.get(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should successfully fetch data from the backend', fakeAsync(() => {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    stateTopAnswersStatsBackendApiService
      .fetchStatsAsync('7')
      .then(successHandler, failHandler);

    var req = httpTestingController.expectOne(
      '/createhandler/state_answer_stats/7'
    );
    expect(req.request.method).toEqual('GET');
    req.flush(sampleDataResults);

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should use rejection handler if data backend request failed', fakeAsync(() => {
    var successHandler = jasmine.createSpy('success');
    var failHandler = jasmine.createSpy('fail');

    stateTopAnswersStatsBackendApiService
      .fetchStatsAsync('7')
      .then(successHandler, failHandler);

    var req = httpTestingController.expectOne(
      '/createhandler/state_answer_stats/7'
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
