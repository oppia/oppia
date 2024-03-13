// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit test for ExplorationCreationBackendApiService.
 */

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {TestBed, fakeAsync, flushMicrotasks} from '@angular/core/testing';
import {ExplorationCreationBackendApiService} from 'components/entity-creation-services/exploration-creation-backend-api.service';

describe('ExplorationCreationBackendApiService', () => {
  let explorationCreationBackendApiService: ExplorationCreationBackendApiService;
  let httpTestingController: HttpTestingController;
  let SAMPLE_EXPLORATION_ID = 'hyuy4GUlvTqJ';
  let ERROR_STATUS_CODE = 500;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    explorationCreationBackendApiService = TestBed.inject(
      ExplorationCreationBackendApiService
    );
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should successfully create new exploration and obtain the exploration ID', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    explorationCreationBackendApiService
      .registerNewExplorationAsync({})
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/contributehandler/create_new');
    expect(req.request.method).toEqual('POST');
    req.flush({exploration_id: SAMPLE_EXPLORATION_ID});

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should fail to create a new exploration and call the fail handler', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    explorationCreationBackendApiService
      .registerNewExplorationAsync({})
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/contributehandler/create_new');
    expect(req.request.method).toEqual('POST');
    req.flush(
      {
        error: 'Error creating a new exploration.',
      },
      {
        status: ERROR_STATUS_CODE,
        statusText: 'Error creating a new exploration.',
      }
    );

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith(
      'Error creating a new exploration.'
    );
  }));

  it('should successfully upload new exploration and obtain the exploration ID', fakeAsync(() => {
    expectAsync(
      explorationCreationBackendApiService.uploadExploration('yaml')
    ).toBeResolvedTo({explorationId: SAMPLE_EXPLORATION_ID});

    let req = httpTestingController.expectOne('contributehandler/upload');
    expect(req.request.method).toEqual('POST');
    req.flush({exploration_id: SAMPLE_EXPLORATION_ID});

    flushMicrotasks();
  }));

  it('should fail to upload new exploration and reject the promise', fakeAsync(() => {
    expectAsync(
      explorationCreationBackendApiService.uploadExploration('yaml')
    ).toBeRejected();

    let req = httpTestingController.expectOne('contributehandler/upload');
    expect(req.request.method).toEqual('POST');
    req.error(new ErrorEvent('Error creating a new exploration.'));

    flushMicrotasks();
  }));
});
