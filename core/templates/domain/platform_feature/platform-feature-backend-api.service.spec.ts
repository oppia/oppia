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

import { PlatformFeatureBackendApiService } from
  'domain/platform_feature/platform-feature-backend-api.service';
import { PlatformFeatureDomainConstants } from
  'domain/platform_feature/platform-feature-domain.constants';
import { ClientContext } from 'domain/platform_feature/client-context.model';
import { FeatureStatusSummary } from 'domain/platform_feature/feature-status-summary.model';

describe('PlatformFeatureBackendApiService', () => {
  let httpTestingController: HttpTestingController;
  let platformFeatureBackendApiService: PlatformFeatureBackendApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    platformFeatureBackendApiService = TestBed.get(
      PlatformFeatureBackendApiService);
    httpTestingController = TestBed.get(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  describe('.fetchFeatureFlags', () => {
    it('should correctly fetch feature flags',
      fakeAsync(() => {
        const successHandler = jasmine.createSpy('success');
        const failHandler = jasmine.createSpy('fail');

        const context = ClientContext.create('Web', 'Chrome');
        const contextDict = context.toBackendDict();
        const responseDict = {
          feature_a: true,
          feature_b: false,
        };

        platformFeatureBackendApiService.fetchFeatureFlags(context)
          .then(successHandler, failHandler);

        flushMicrotasks();

        const url = PlatformFeatureDomainConstants
          .PLATFORM_FEATURES_EVALUATION_HANDLER_URL;
        const urlWithParams = url + '?' +
          Object.entries(contextDict).map(([k, v]) => `${k}=${v}`).join('&');
        httpTestingController.expectOne(urlWithParams).flush(responseDict);

        flushMicrotasks();
        expect(successHandler).toHaveBeenCalledWith(
          FeatureStatusSummary.createFromBackendDict(responseDict)
        );
        expect(failHandler).not.toHaveBeenCalled();
      })
    );

    it('should reject if the request fails', fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');

      const context = ClientContext.create('Web', 'Chrome');
      const contextDict = context.toBackendDict();

      platformFeatureBackendApiService.fetchFeatureFlags(context)
        .then(successHandler, failHandler);

      flushMicrotasks();

      const url = PlatformFeatureDomainConstants
        .PLATFORM_FEATURES_EVALUATION_HANDLER_URL;
      const urlWithParams = url + '?' +
        Object.entries(contextDict).map(([k, v]) => `${k}=${v}`).join('&');
      httpTestingController
        .expectOne(urlWithParams)
        .error(new ErrorEvent('Error'));

      flushMicrotasks();
      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    }));
  });
});
