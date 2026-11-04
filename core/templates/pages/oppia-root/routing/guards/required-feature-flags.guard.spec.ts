// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for RequiredFeatureFlagsGuard.
 */

import {Location} from '@angular/common';
import {TestBed} from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
} from '@angular/router';

import {AppConstants} from 'app.constants';
import {
  FeatureNames,
  FeatureNamesKeys,
  FeatureStatusChecker,
} from 'domain/feature-flag/feature-status-summary.model';
import {PlatformFeatureService} from 'services/platform-feature.service';
import {routes} from '../app.routing.module';
import {RequiredFeatureFlagsGuard} from './required-feature-flags.guard';

const buildStatusChecker = (
  disabledFeatureFlags: FeatureNames[] = []
): FeatureStatusChecker => {
  const checker: Record<string, {isEnabled: boolean}> = {};
  (Object.keys(FeatureNames) as FeatureNamesKeys).forEach(key => {
    checker[key] = {
      isEnabled: !disabledFeatureFlags.includes(FeatureNames[key]),
    };
  });
  return checker as FeatureStatusChecker;
};

class MockPlatformFeatureService {
  status: FeatureStatusChecker = buildStatusChecker();
}

class MockRouter {
  navigate(_commands: string[]): Promise<boolean> {
    return Promise.resolve(true);
  }
}

class MockLocation {
  replaceState(_url: string): void {}
}

const createMockRoute = (
  requiredFeatureFlags?: FeatureNames[]
): ActivatedRouteSnapshot => {
  const route = new ActivatedRouteSnapshot();
  route.data = requiredFeatureFlags === undefined ? {} : {requiredFeatureFlags};
  return route;
};

describe('RequiredFeatureFlagsGuard', () => {
  let guard: RequiredFeatureFlagsGuard;
  let platformFeatureService: MockPlatformFeatureService;
  let router: Router;
  let location: Location;

  const routerStateSnapshot = {url: '/practice/1'} as RouterStateSnapshot;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {provide: PlatformFeatureService, useClass: MockPlatformFeatureService},
        {provide: Router, useClass: MockRouter},
        {provide: Location, useClass: MockLocation},
      ],
    });

    guard = TestBed.inject(RequiredFeatureFlagsGuard);
    platformFeatureService = TestBed.inject(
      PlatformFeatureService
    ) as MockPlatformFeatureService;
    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
  });

  it('should allow activation when the route declares no required flags', async () => {
    const navigateSpy = spyOn(router, 'navigate');

    expect(
      await guard.canActivate(createMockRoute(), routerStateSnapshot)
    ).toBeTrue();
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('should allow activation when every required flag is enabled', async () => {
    const navigateSpy = spyOn(router, 'navigate');

    expect(
      await guard.canActivate(
        createMockRoute([
          FeatureNames.StoryEditorArcs,
          FeatureNames.NewLessonPlayer,
        ]),
        routerStateSnapshot
      )
    ).toBeTrue();
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('should redirect to 404 when a required flag is disabled', async () => {
    platformFeatureService.status = buildStatusChecker([
      FeatureNames.StoryEditorArcs,
    ]);
    const navigateSpy = spyOn(router, 'navigate').and.callThrough();
    const replaceStateSpy = spyOn(location, 'replaceState');

    expect(
      await guard.canActivate(
        createMockRoute([FeatureNames.StoryEditorArcs]),
        routerStateSnapshot
      )
    ).toBeFalse();
    expect(navigateSpy).toHaveBeenCalledWith([
      `/${AppConstants.PAGES_REGISTERED_WITH_FRONTEND.ERROR.ROUTE}/404`,
    ]);
    expect(replaceStateSpy).toHaveBeenCalledWith(routerStateSnapshot.url);
  });

  it('should redirect to 404 when one of several required flags is disabled', async () => {
    platformFeatureService.status = buildStatusChecker([
      FeatureNames.NewLessonPlayer,
    ]);
    const navigateSpy = spyOn(router, 'navigate').and.callThrough();

    expect(
      await guard.canActivate(
        createMockRoute([
          FeatureNames.StoryEditorArcs,
          FeatureNames.NewLessonPlayer,
        ]),
        routerStateSnapshot
      )
    ).toBeFalse();
    expect(navigateSpy).toHaveBeenCalled();
  });

  it('should still replace the URL when the redirect fails', async () => {
    platformFeatureService.status = buildStatusChecker([
      FeatureNames.StoryEditorArcs,
    ]);
    spyOn(router, 'navigate').and.returnValue(
      Promise.reject(new Error('navigation failed'))
    );
    const replaceStateSpy = spyOn(location, 'replaceState');

    expect(
      await guard.canActivate(
        createMockRoute([FeatureNames.StoryEditorArcs]),
        routerStateSnapshot
      )
    ).toBeFalse();
    expect(replaceStateSpy).toHaveBeenCalledWith(routerStateSnapshot.url);
  });

  it('should throw when the route requires an unknown flag', async () => {
    await expectAsync(
      guard.canActivate(
        createMockRoute(['not_a_feature_flag' as FeatureNames]),
        routerStateSnapshot
      )
    ).toBeRejectedWithError("Feature 'not_a_feature_flag' does not exist.");
  });

  it('should be attached to every route that declares required flags', () => {
    const routesWithRequiredFlags = routes.filter(
      route => route.data?.requiredFeatureFlags !== undefined
    );

    expect(routesWithRequiredFlags.length).toBeGreaterThan(0);
    routesWithRequiredFlags.forEach(route => {
      expect(route.canActivate).toContain(RequiredFeatureFlagsGuard);
    });
  });
});
