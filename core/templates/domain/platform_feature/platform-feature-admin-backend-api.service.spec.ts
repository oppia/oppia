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
 * @fileoverview Unit tests for PlatformFeatureAdminBackendApiService.
 */

import { HttpClientTestingModule, HttpTestingController } from
  '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { PlatformFeatureDomainConstants } from
  'domain/platform_feature/platform-feature-domain.constants';
import { PlatformParameterFilterType } from
  'domain/platform_feature/platform-parameter-filter.model';
import { FeatureStage, PlatformParameter } from
  'domain/platform_feature/platform-parameter.model';
import { PlatformFeatureAdminBackendApiService } from
  'domain/platform_feature/platform-feature-admin-backend-api.service';
import { PlatformParameterRule } from
  'domain/platform_feature/platform-parameter-rule.model';

describe('PlatformFeatureAdminBackendApiService', () => {
  let featureAdminService: PlatformFeatureAdminBackendApiService;
  let httpTestingController: HttpTestingController;
  let featureFlagsResponse = {
    feature_flags: [{
      name: 'dummy_feature',
      description: 'this is a dummy feature',
      data_type: 'bool',
      rules: [{
        filters: [{
          type: PlatformParameterFilterType.ServerMode,
          conditions: [['=', 'dev'] as [string, string]]
        }],
        value_when_matched: true
      }],
      rule_schema_version: 1,
      default_value: false,
      is_feature: true,
      feature_stage: FeatureStage.DEV
    }]
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    featureAdminService = TestBed.get(PlatformFeatureAdminBackendApiService);
    httpTestingController = TestBed.get(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should get feature flags data', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    let featureFlagsObject = {
      featureFlags: featureFlagsResponse.feature_flags.map(
        dict => PlatformParameter.createFromBackendDict(dict))
    };
    featureAdminService.getFeatureFlags().then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      PlatformFeatureDomainConstants.FEATURE_FLAGS_URL);
    expect(req.request.method).toEqual('GET');
    req.flush(featureFlagsResponse);

    flushMicrotasks();
    expect(successHandler).toHaveBeenCalledWith(featureFlagsObject);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should use rejection handler if backend request fails to fetch features',
    fakeAsync(() => {
      let successHandler = jasmine.createSpy('success');
      let failHandler = jasmine.createSpy('fail');

      featureAdminService.getFeatureFlags().then(
        successHandler, failHandler);

      var req = httpTestingController.expectOne(
        PlatformFeatureDomainConstants.FEATURE_FLAGS_URL);
      expect(req.request.method).toEqual('GET');

      req.flush({
        error: 'Some error in the backend.'
      }, {
        status: 500, statusText: 'Internal Server Error'
      });
      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Some error in the backend.');
    }));

  it('should make a request to update the feature flag rules',
    fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');

      const newRules = [
        PlatformParameterRule.createFromBackendDict({
          filters: [],
          value_when_matched: false
        })
      ];

      featureAdminService.updateFeatureFlag(
        'feature_name', 'update message', newRules
      ).then(successHandler, failHandler);

      const req = httpTestingController.expectOne(
        PlatformFeatureDomainConstants.FEATURE_FLAGS_URL);
      req.flush({});
      expect(req.request.method).toEqual('POST');

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    })
  );

  it('should reject if the request fails', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const failHandler = jasmine.createSpy('fail');

    const newRules = [
      PlatformParameterRule.createFromBackendDict({
        filters: [],
        value_when_matched: false
      })
    ];

    featureAdminService.updateFeatureFlag(
      'feature_name', 'update message', newRules
    ).then(successHandler, failHandler);

    const req = httpTestingController.expectOne(
      PlatformFeatureDomainConstants.FEATURE_FLAGS_URL);
    req.error(new ErrorEvent('Error'));

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  }));

  it('should make a request to update the platform param rules',
    fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');

      const newRules = [
        PlatformParameterRule.createFromBackendDict({
          filters: [],
          value_when_matched: false
        })
      ];

      featureAdminService.updatePlatformParameter(
        'param_name', 'update message', newRules
      ).then(successHandler, failHandler);

      const req = httpTestingController.expectOne('/adminhandler');
      req.flush({});
      expect(req.request.method).toEqual('POST');

      flushMicrotasks();

      expect(successHandler).toHaveBeenCalled();
      expect(failHandler).not.toHaveBeenCalled();
    }));

  it('should reject to update platform params if the request fails',
    fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');

      const newRules = [
        PlatformParameterRule.createFromBackendDict({
          filters: [],
          value_when_matched: false
        })
      ];

      featureAdminService.updatePlatformParameter(
        'param_name', 'update message', newRules
      ).then(successHandler, failHandler);

      const req = httpTestingController.expectOne('/adminhandler');
      req.error(new ErrorEvent('Error'));

      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    }));
});
