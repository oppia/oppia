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
 * @fileoverview Unit tests for FeatureFlagDummyBackendApiService.
 */

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { FeatureFlagDomainConstants } from
  'domain/feature-flag/feature-flag-domain.constants';
import { FeatureFlagDummyBackendApiService } from
  'domain/feature-flag/feature-flag-dummy-backend-api.service';

describe('FeatureFlagDummyBackendApiService', () => {
  let httpTestingController: HttpTestingController;
  let apiService: FeatureFlagDummyBackendApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    apiService = TestBed.get(FeatureFlagDummyBackendApiService);
    httpTestingController = TestBed.get(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  describe('.isHandlerEnabled', () => {
    it('should resolve to true if the handler is enabled', fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');

      apiService.isHandlerEnabled()
        .then(successHandler, failHandler);

      httpTestingController
        .expectOne(FeatureFlagDomainConstants.DUMMY_HANDLER_URL)
        .flush({ msg: 'ok', is_enabled: true });

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith(true);
      expect(failHandler).not.toHaveBeenCalled();
    }));

    it('should resolve to false if the handler is disabled', fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');

      apiService.isHandlerEnabled()
        .then(successHandler, failHandler);

      httpTestingController
        .expectOne(FeatureFlagDomainConstants.DUMMY_HANDLER_URL)
        .flush({ msg: 'ok', is_enabled: false });

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith(false);
      expect(failHandler).not.toHaveBeenCalled();
    }));
  });
});
