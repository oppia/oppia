// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for new lesson player flag guard
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  convertToParamMap,
} from '@angular/router';

import {AppConstants} from 'app.constants';
import {LessonPlayerPageAuthGuard} from './lesson-player-auth.guard';
import {PlatformFeatureService} from 'services/platform-feature.service';
import {AccessValidationBackendApiService} from 'pages/oppia-root/routing/access-validation-backend-api.service';
import {Location} from '@angular/common';

class MockPlatformFeatureService {
  get status() {
    return {
      NewLessonPlayer: {isEnabled: true},
    };
  }
}

class MockRouter {
  navigate(commands: string[]): Promise<boolean> {
    return Promise.resolve(true);
  }
}

class MockAccessValidationBackendApiService {
  validateAccessToExplorationPlayerPage(
    id: string,
    version: string | null
  ): Promise<void> {
    return Promise.resolve();
  }
}

class MockLocation {
  replaceState(_url: string): void {}
}

const createMockRoute = (explorationId: string): ActivatedRouteSnapshot => {
  const route = new ActivatedRouteSnapshot();
  Object.defineProperty(route, 'paramMap', {
    get: () => convertToParamMap({exploration_id: explorationId}),
  });
  Object.defineProperty(route, 'queryParams', {
    get: () => ({}),
  });
  return route;
};

describe('LessonPlayerPageAuthGuard', () => {
  let guard: LessonPlayerPageAuthGuard;
  let platformFeatureService: PlatformFeatureService;
  let router: Router;
  let backendApiService: AccessValidationBackendApiService;
  let location: Location;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {provide: PlatformFeatureService, useClass: MockPlatformFeatureService},
        {
          provide: AccessValidationBackendApiService,
          useClass: MockAccessValidationBackendApiService,
        },
        {provide: Router, useClass: MockRouter},
        {provide: Location, useClass: MockLocation},
      ],
    });

    guard = TestBed.inject(LessonPlayerPageAuthGuard);
    platformFeatureService = TestBed.inject(PlatformFeatureService);
    backendApiService = TestBed.inject(AccessValidationBackendApiService);
    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
  });

  it('should redirect to 404 when flag is disabled', done => {
    spyOnProperty(platformFeatureService, 'status', 'get').and.returnValue({
      NewLessonPlayer: {isEnabled: false},
    });

    const navigateSpy = spyOn(router, 'navigate').and.callThrough();

    const route = createMockRoute('123');
    const state: RouterStateSnapshot = {
      url: '/explore/123',
      root: new ActivatedRouteSnapshot(),
    };

    guard.canActivate(route, state).then(result => {
      expect(result).toBeFalse();
      expect(navigateSpy).toHaveBeenCalledWith([
        `${AppConstants.PAGES_REGISTERED_WITH_FRONTEND.ERROR.ROUTE}/404`,
      ]);
      done();
    });
  });

  it('should allow activation when flag is enabled and access is validated', done => {
    spyOn(
      backendApiService,
      'validateAccessToExplorationPlayerPage'
    ).and.returnValue(Promise.resolve());

    const route = createMockRoute('exp123');
    const state: RouterStateSnapshot = {
      url: '/explore/exp123',
      root: new ActivatedRouteSnapshot(),
    };

    guard.canActivate(route, state).then(result => {
      expect(result).toBeTrue();
      done();
    });
  });

  it('should redirect to iframe error page if access denied and URL includes embed', done => {
    spyOn(
      backendApiService,
      'validateAccessToExplorationPlayerPage'
    ).and.returnValue(Promise.reject({status: 403}));

    const navigateSpy = spyOn(router, 'navigate').and.callThrough();
    const replaceStateSpy = spyOn(location, 'replaceState');

    const route = createMockRoute('exp123');
    const state: RouterStateSnapshot = {
      url: '/embed/explore/exp123',
      root: new ActivatedRouteSnapshot(),
    };

    guard.canActivate(route, state).then(result => {
      expect(result).toBeFalse();
      expect(navigateSpy).toHaveBeenCalledWith([
        `${AppConstants.PAGES_REGISTERED_WITH_FRONTEND.ERROR_IFRAMED.ROUTE}`,
      ]);
      expect(replaceStateSpy).toHaveBeenCalledWith(state.url);
      done();
    });
  });

  it('should redirect to status error page if access denied and URL does not include embed', done => {
    spyOn(
      backendApiService,
      'validateAccessToExplorationPlayerPage'
    ).and.returnValue(Promise.reject({status: 403}));

    const navigateSpy = spyOn(router, 'navigate').and.callThrough();
    const replaceStateSpy = spyOn(location, 'replaceState');

    const route = createMockRoute('exp123');
    const state: RouterStateSnapshot = {
      url: '/explore/exp123',
      root: new ActivatedRouteSnapshot(),
    };

    guard.canActivate(route, state).then(result => {
      expect(result).toBeFalse();
      expect(navigateSpy).toHaveBeenCalledWith([
        `${AppConstants.PAGES_REGISTERED_WITH_FRONTEND.ERROR.ROUTE}/403`,
      ]);
      expect(replaceStateSpy).toHaveBeenCalledWith(state.url);
      done();
    });
  });
});
