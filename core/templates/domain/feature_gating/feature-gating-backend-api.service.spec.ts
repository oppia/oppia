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
 * @fileoverview Unit tests for FeatureGatingBackendApiService.
 */

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { ClientContextObjectFactory } from './ClientContextObjectFactory';
import { FeatureFlagResultsObjectFactory } from
  'domain/feature_gating/FeatureFlagResultsObjectFactory';
import { FeatureGatingDomainConstants } from
  'domain/feature_gating/feature-gating-domain.constants';
import { FeatureGatingBackendApiService } from
  'domain/feature_gating/feature-gating-backend-api.service';

describe('FeatureGatingBackendApiService', () => {
  let httpTestingController: HttpTestingController;
  let featureGatingBackendApiService: FeatureGatingBackendApiService = null;
  let clientContextObjectFactory: ClientContextObjectFactory = null;
  let featureFlagResultsObjectFactory: FeatureFlagResultsObjectFactory = null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    featureGatingBackendApiService = TestBed.get(
      FeatureGatingBackendApiService);
    httpTestingController = TestBed.get(HttpTestingController);
    clientContextObjectFactory = TestBed.get(ClientContextObjectFactory);
    featureFlagResultsObjectFactory = TestBed.get(
      FeatureFlagResultsObjectFactory);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should correctly fetch feature flags',
    fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');

      const context = clientContextObjectFactory.create(
        'Web', 'Chrome', null, 'en');
      const responseDict = {
        feature_a: true,
        feature_b: false,
      };

      featureGatingBackendApiService.fetchFeatureFlags(context)
        .then(successHandler, failHandler);
      const req = httpTestingController.expectOne(
        FeatureGatingDomainConstants.FEATURE_GATING_HANDLER_URL);
      req.flush(responseDict);

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalledWith(
        featureFlagResultsObjectFactory.createFromBackendDict(responseDict));
      expect(failHandler).not.toHaveBeenCalled();
    })
  );
});
