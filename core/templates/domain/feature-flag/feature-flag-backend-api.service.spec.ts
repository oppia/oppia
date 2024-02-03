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
 * @fileoverview Unit tests for FeatureFlagBackendApiService.
 */

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { FeatureFlagBackendApiService } from
  'domain/feature-flag/feature-flag-backend-api.service';
import { FeatureFlagDomainConstants } from
  'domain/feature-flag/feature-flag-domain.constants';
import { FeatureStatusSummary } from 'domain/feature-flag/feature-status-summary.model';

describe('FeatureFlagBackendApiService', () => {
  let httpTestingController: HttpTestingController;
  let featureFlagBackendApiService: FeatureFlagBackendApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    featureFlagBackendApiService = TestBed.get(
      FeatureFlagBackendApiService);
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

        const responseDict = {
          feature_a: true,
          feature_b: false,
        };

        featureFlagBackendApiService.fetchFeatureFlags()
          .then(successHandler, failHandler);

        flushMicrotasks();

        const url = FeatureFlagDomainConstants
          .FEATURE_FLAGS_EVALUATION_HANDLER_URL;
        httpTestingController.expectOne(url).flush(responseDict);

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

      featureFlagBackendApiService.fetchFeatureFlags()
        .then(successHandler, failHandler);

      flushMicrotasks();

      const url = FeatureFlagDomainConstants
        .FEATURE_FLAGS_EVALUATION_HANDLER_URL;
      httpTestingController
        .expectOne(url)
        .error(new ErrorEvent('Error'));

      flushMicrotasks();
      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    }));
  });
});
