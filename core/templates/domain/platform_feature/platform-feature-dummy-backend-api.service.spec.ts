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
 * @fileoverview Unit tests for PlatformFeatureDummyBackendApiService.
 */

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { PlatformFeatureDomainConstants } from
  'domain/platform_feature/platform-feature-domain.constants';
import { PlatformFeatureDummyBackendApiService } from
  'domain/platform_feature/platform-feature-dummy-backend-api.service';

describe('PlatformFeatureDummyBackendApiService', () => {
  let httpTestingController: HttpTestingController;
  let apiService: PlatformFeatureDummyBackendApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    apiService = TestBed.get(PlatformFeatureDummyBackendApiService);
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
        .expectOne(PlatformFeatureDomainConstants.DUMMY_HANDLER_URL)
        .flush({ msg: 'ok' });

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
        .expectOne(PlatformFeatureDomainConstants.DUMMY_HANDLER_URL)
        .flush('Mock 404 Error', {
          status: 404,
          statusText: 'Not Found'
        });

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith(false);
      expect(failHandler).not.toHaveBeenCalled();
    }));

    it('should throw if the exception is not caused by a 404', fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');

      apiService.isHandlerEnabled()
        .then(successHandler, failHandler);

      httpTestingController
        .expectOne(PlatformFeatureDomainConstants.DUMMY_HANDLER_URL)
        .flush('Mock 500 Error', {
          status: 500,
          statusText: 'Some internal server error.'
        });

      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    }));
  });
});
