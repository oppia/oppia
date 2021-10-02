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
 * @fileoverview Tests for StateDiffModal Backend API Service.
 */

import { HttpClientTestingModule, HttpTestingController }
  from '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { StateObjectFactory } from 'domain/state/StateObjectFactory';
import { StateDiffModalBackendApiService }
  from './state-diff-modal-backend-api.service';


describe('state diff modal backend api service', () => {
  let sdmbas: StateDiffModalBackendApiService;
  let http: HttpTestingController;
  let sof: StateObjectFactory;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    sdmbas = TestBed.inject(StateDiffModalBackendApiService);
    http = TestBed.inject(HttpTestingController);
    sof = TestBed.inject(StateObjectFactory);
  });

  afterEach(() => {
    http.verify();
  });

  it('should successfully fetch yaml data',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let errorHandler = jasmine.createSpy('error');

      let stateName = 'new state';
      let state = sof.createDefaultState(stateName);

      sdmbas.fetchYaml(
        state.toBackendDict(), 50, '/createhandler/state_yaml/exp1')
        .then(successHandler, errorHandler);

      let req = http.expectOne('/createhandler/state_yaml/exp1');
      expect(req.request.method).toBe('POST');
      req.flush('Success');

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(errorHandler).not.toHaveBeenCalled();
    }));
});
