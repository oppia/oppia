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

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {TestBed, fakeAsync, flushMicrotasks} from '@angular/core/testing';

import {FeatureFlagBackendApiService} from 'domain/feature-flag/feature-flag-backend-api.service';
import {FeatureFlagDomainConstants} from 'domain/feature-flag/feature-flag-domain.constants';
import {FeatureFlag} from 'domain/feature-flag/feature-flag.model';
import {FeatureStage} from 'domain/platform-parameter/platform-parameter.model';
import {FeatureStatusSummary} from 'domain/feature-flag/feature-status-summary.model';
import {UserGroup} from 'domain/release_coordinator/user-group.model';

describe('FeatureFlagBackendApiService', () => {
  let httpTestingController: HttpTestingController;
  let featureFlagBackendApiService: FeatureFlagBackendApiService;
  let featureFlagsResponse = {
    feature_flags: [
      {
        description: 'This is a dummy feature flag.',
        feature_stage: FeatureStage.DEV,
        name: 'dummy_feature_flag_for_e2e_tests',
        force_enable_for_all_users: false,
        rollout_percentage: 0,
        user_group_ids: [],
        last_updated: null,
      },
    ],
    server_stage: 'dev',
    user_group_dicts: [
      {
        user_group_id: 'userGroupId1',
        name: 'UserGroup1',
        member_usernames: ['User1', 'User2', 'User3'],
      },
    ],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });

    featureFlagBackendApiService = TestBed.get(FeatureFlagBackendApiService);
    httpTestingController = TestBed.get(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should get feature flags data', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    let featureFlagsObject = {
      featureFlags: featureFlagsResponse.feature_flags.map(dict =>
        FeatureFlag.createFromBackendDict(dict)
      ),
      serverStage: featureFlagsResponse.server_stage,
      userGroups: featureFlagsResponse.user_group_dicts.map(dict =>
        UserGroup.createFromBackendDict(dict)
      ),
    };
    featureFlagBackendApiService
      .getFeatureFlags()
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      FeatureFlagDomainConstants.FEATURE_FLAGS_URL
    );
    expect(req.request.method).toEqual('GET');
    req.flush(featureFlagsResponse);

    flushMicrotasks();
    expect(successHandler).toHaveBeenCalledWith(featureFlagsObject);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should use rejection handler if backend request fails to fetch features', fakeAsync(() => {
    let successHandler = jasmine.createSpy('success');
    let failHandler = jasmine.createSpy('fail');

    featureFlagBackendApiService
      .getFeatureFlags()
      .then(successHandler, failHandler);

    var req = httpTestingController.expectOne(
      FeatureFlagDomainConstants.FEATURE_FLAGS_URL
    );
    expect(req.request.method).toEqual('GET');

    req.flush(
      {
        error: 'Some error in the backend.',
      },
      {
        status: 500,
        statusText: 'Internal Server Error',
      }
    );
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith('Some error in the backend.');
  }));

  it('should make a request to update the feature flag rules', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const failHandler = jasmine.createSpy('fail');

    featureFlagBackendApiService
      .updateFeatureFlag('feature_name', true, 0, [])
      .then(successHandler, failHandler);

    const req = httpTestingController.expectOne(
      FeatureFlagDomainConstants.FEATURE_FLAGS_URL
    );
    req.flush({});
    expect(req.request.method).toEqual('PUT');

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should reject if the request fails', fakeAsync(() => {
    const successHandler = jasmine.createSpy('success');
    const failHandler = jasmine.createSpy('fail');

    featureFlagBackendApiService
      .updateFeatureFlag('feature_name', true, 0, [])
      .then(successHandler, failHandler);

    const req = httpTestingController.expectOne(
      FeatureFlagDomainConstants.FEATURE_FLAGS_URL
    );
    req.error(new ErrorEvent('Error'));

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  }));

  describe('.fetchFeatureFlags', () => {
    it('should correctly fetch feature flags', fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');

      const responseDict = {
        feature_a: true,
        feature_b: false,
      };

      featureFlagBackendApiService
        .fetchFeatureFlags()
        .then(successHandler, failHandler);

      flushMicrotasks();

      const url =
        FeatureFlagDomainConstants.FEATURE_FLAGS_EVALUATION_HANDLER_URL;
      httpTestingController.expectOne(url).flush(responseDict);

      flushMicrotasks();
      expect(successHandler).toHaveBeenCalledWith(
        FeatureStatusSummary.createFromBackendDict(responseDict)
      );
      expect(failHandler).not.toHaveBeenCalled();
    }));

    it('should reject if the request fails', fakeAsync(() => {
      const successHandler = jasmine.createSpy('success');
      const failHandler = jasmine.createSpy('fail');

      featureFlagBackendApiService
        .fetchFeatureFlags()
        .then(successHandler, failHandler);

      flushMicrotasks();

      const url =
        FeatureFlagDomainConstants.FEATURE_FLAGS_EVALUATION_HANDLER_URL;
      httpTestingController.expectOne(url).error(new ErrorEvent('Error'));

      flushMicrotasks();
      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalled();
    }));
  });
});
