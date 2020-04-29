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

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { ExplorationCreationBackendService } from
  'components/entity-creation-services/exploration-creation-backend-api.service.ts';

describe('Exploration Creation backend service', () => {
  let explorationCreationBackendService: ExplorationCreationBackendService = null;
  let httpTestingController: HttpTestingController;
  let SAMPLE_EXPLORATION_ID = 'id_1';
  let SUCCESS_STATUS_CODE = 200;
  let ERROR_STATUS_CODE = 500;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    explorationCreationBackendService = TestBed.get(
      ExplorationCreationBackendService);
    httpTestingController = TestBed.get(HttpTestingController);
  });
  
  afterEach(() => {
    httpTestingController.verify();
  });

  fit('should successfully create a new exploration and obtain the exploration ID',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      explorationCreationBackendService.createExploration().then(
        successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/contributehandler/create_new');
      expect(req.request.method).toEqual('POST');
      req.flush({explorationId: SAMPLE_EXPLORATION_ID});

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  fit('should fail to create a new exploration and call the fail handler',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      explorationCreationBackendService.createExploration().then(
        successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/contributehandler/create_new');
      expect(req.request.method).toEqual('POST');
      req.flush('Error creating a new exploration.', {
        status: ERROR_STATUS_CODE,
        statusText: 'Error creating a new exploration.'
      });

      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    })
  );
});
