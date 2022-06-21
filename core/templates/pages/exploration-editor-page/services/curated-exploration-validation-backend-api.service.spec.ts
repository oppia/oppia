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
 * @fileoverview Unit tests for curated exploration validation backend api
 * service.
 */

import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { CuratedExplorationValidationBackendApiService } from './curated-exploration-validation-backend-api.service';

describe('Curated exploration validation backend api service', () => {
  let cevbas: CuratedExplorationValidationBackendApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UrlInterpolationService]
    });

    http = TestBed.inject(HttpTestingController);
    cevbas = TestBed.inject(CuratedExplorationValidationBackendApiService);
  });

  afterEach(() => {
    http.verify();
  });

  it('should correctly fetch whether exploration can be curated',
    fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failureHandler = jasmine.createSpy('failure');

      const explorationId = 'exp1';
      const canBeCuratedResult = {
        can_be_curated: true,
        error_message: ''
      };

      cevbas.canExplorationBeCuratedAsync(explorationId).then(
        successHandler, failureHandler);

      const req = http.expectOne(
        '/explorehandler/curated_exploration_validation/exp1');
      expect(req.request.method).toEqual('GET');
      req.flush(canBeCuratedResult);
      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failureHandler).not.toHaveBeenCalled();
    }));
});
