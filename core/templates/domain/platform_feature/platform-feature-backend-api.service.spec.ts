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
 * @fileoverview Unit tests for PlatformFeatureBackendApiService.
 */

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { ClientContextObjectFactory } from './client-context-object.factory';
import { FeatureStatusSummaryObjectFactory } from
  'domain/platform_feature/feature-status-summary-object.factory';
import { PlatformFeatureDomainConstants } from
  'domain/platform_feature/platform-feature-domain.constants';
import { PlatformFeatureBackendApiService } from
  'domain/platform_feature/platform-feature-backend-api.service';

describe('PlatformFeatureBackendApiService', () => {
  let httpTestingController: HttpTestingController;
  let platformFeatureBackendApiService: PlatformFeatureBackendApiService;
  let clientContextObjectFactory: ClientContextObjectFactory;
  let featureStatusSummaryObjectFactory: FeatureStatusSummaryObjectFactory;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    platformFeatureBackendApiService = TestBed.get(
      PlatformFeatureBackendApiService);
    httpTestingController = TestBed.get(HttpTestingController);
    clientContextObjectFactory = TestBed.get(ClientContextObjectFactory);
    featureStatusSummaryObjectFactory = TestBed.get(
      FeatureStatusSummaryObjectFactory);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  describe('.getCsrfTokenAsync', () => {
    it('should correctly fetch csrf token', fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');

      platformFeatureBackendApiService.getCsrfTokenAsync()
        .then(successHandler, failHandler);

      httpTestingController
        .expectOne('/csrfhandler')
        .flush({ token: 'mock_csrf_token' });

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith('mock_csrf_token');
      expect(failHandler).not.toHaveBeenCalled();
    }));
  });

  describe('.fetchFeatureFlags', () => {
    let spy: jasmine.Spy;

    beforeEach(() => {
      spy = spyOn(platformFeatureBackendApiService, 'getCsrfTokenAsync')
        .and.resolveTo('mock_csrf_token');
    });

    it('should correctly fetch feature flags',
      fakeAsync(() => {
        const successHandler = jasmine.createSpy('success');
        const failHandler = jasmine.createSpy('fail');

        const context = clientContextObjectFactory.create(
          'Web', 'Chrome', 'en');
        const responseDict = {
          feature_a: true,
          feature_b: false,
        };

        platformFeatureBackendApiService.fetchFeatureFlags(context)
          .then(successHandler, failHandler);

        flushMicrotasks();
        httpTestingController
          .expectOne(
            PlatformFeatureDomainConstants.PLATFORM_FEATURE_HANDLER_URL)
          .flush(responseDict);

        flushMicrotasks();
        expect(successHandler).toHaveBeenCalledWith(
          featureStatusSummaryObjectFactory.createFromBackendDict(responseDict)
        );
        expect(failHandler).not.toHaveBeenCalled();
        expect(spy).toHaveBeenCalled();
      })
    );
  });
});
