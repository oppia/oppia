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
 * @fileoverview Unit tests for ReviewTestAuthGuard.
 */

import {Location} from '@angular/common';
import {TestBed, fakeAsync, tick} from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
  ParamMap,
  convertToParamMap,
} from '@angular/router';
import {RouterTestingModule} from '@angular/router/testing';

import {AppConstants} from 'app.constants';
import {ReviewTestAuthGuard} from './review-test-auth.guard';
import {AccessValidationBackendApiService} from 'pages/oppia-root/routing/access-validation-backend-api.service';
import {PlatformFeatureService} from 'services/platform-feature.service';

class MockPlatformFeatureService {
  get status() {
    return {
      EnableReadyForReviewTest: {isEnabled: true},
    };
  }
}

class MockAccessValidationBackendApiService {
  validateAccessToReviewTestPage(
    classroomUrlFragment: string,
    topicUrlFragment: string,
    storyUrlFragment: string
  ): Promise<void> {
    return Promise.resolve();
  }
}

class MockRouter {
  navigate(commands: string[]): Promise<boolean> {
    return Promise.resolve(true);
  }
}

class MockLocation {
  replaceState(url: string): void {}
}

describe('ReviewTestAuthGuard', () => {
  let guard: ReviewTestAuthGuard;
  let accessValidationBackendApiService: AccessValidationBackendApiService;
  let platformFeatureService: PlatformFeatureService;
  let router: Router;
  let location: Location;

  const createMockRoute = (
    classroomUrlFragment: string = 'math',
    topicUrlFragment: string = 'algebra',
    storyUrlFragment: string = 'story-1'
  ): ActivatedRouteSnapshot => {
    const route = new ActivatedRouteSnapshot();
    const paramMap: ParamMap = convertToParamMap({
      classroom_url_fragment: classroomUrlFragment,
      topic_url_fragment: topicUrlFragment,
      story_url_fragment: storyUrlFragment,
    });

    Object.defineProperty(route, 'paramMap', {
      get: () => paramMap,
    });

    return route;
  };

  const createMockState = (url: string): RouterStateSnapshot => {
    return {
      url: url,
      root: new ActivatedRouteSnapshot(),
    } as RouterStateSnapshot;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        ReviewTestAuthGuard,
        {
          provide: AccessValidationBackendApiService,
          useClass: MockAccessValidationBackendApiService,
        },
        {
          provide: PlatformFeatureService,
          useClass: MockPlatformFeatureService,
        },
        {provide: Router, useClass: MockRouter},
        {provide: Location, useClass: MockLocation},
      ],
    });

    guard = TestBed.inject(ReviewTestAuthGuard);
    accessValidationBackendApiService = TestBed.inject(
      AccessValidationBackendApiService
    );
    platformFeatureService = TestBed.inject(PlatformFeatureService);
    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should redirect to 404 when flag is disabled', fakeAsync(() => {
    spyOnProperty(platformFeatureService, 'status', 'get').and.returnValue({
      EnableReadyForReviewTest: {isEnabled: false},
    });

    const navigateSpy = spyOn(router, 'navigate').and.returnValue(
      Promise.resolve(true)
    );
    const locationSpy = spyOn(location, 'replaceState');

    const route = createMockRoute();
    const state = createMockState('/review-test/math/algebra/story-1');

    let canActivateResult: boolean | null = null;

    guard.canActivate(route, state).then(result => {
      canActivateResult = result;
    });

    tick();

    expect(canActivateResult).toBeFalse();
    expect(navigateSpy).toHaveBeenCalledWith([
      `${AppConstants.PAGES_REGISTERED_WITH_FRONTEND.ERROR.ROUTE}/404`,
    ]);
    expect(locationSpy).toHaveBeenCalledWith(state.url);
  }));

  it('should allow access if validation succeeds', fakeAsync(() => {
    const validateAccessSpy = spyOn(
      accessValidationBackendApiService,
      'validateAccessToReviewTestPage'
    ).and.returnValue(Promise.resolve());
    const navigateSpy = spyOn(router, 'navigate').and.returnValue(
      Promise.resolve(true)
    );

    const route = createMockRoute('math', 'algebra', 'story-1');
    const state = createMockState('/review-test/math/algebra/story-1');

    let canActivateResult: boolean | null = null;

    guard.canActivate(route, state).then(result => {
      canActivateResult = result;
    });

    tick();

    expect(canActivateResult).toBeTrue();
    expect(validateAccessSpy).toHaveBeenCalledWith(
      'math',
      'algebra',
      'story-1'
    );
    expect(navigateSpy).not.toHaveBeenCalled();
  }));

  it('should redirect to 404 page if validation fails', fakeAsync(() => {
    spyOn(
      accessValidationBackendApiService,
      'validateAccessToReviewTestPage'
    ).and.returnValue(Promise.reject(new Error('Validation failed')));
    const navigateSpy = spyOn(router, 'navigate').and.returnValue(
      Promise.resolve(true)
    );
    const locationSpy = spyOn(location, 'replaceState');

    const route = createMockRoute('math', 'algebra', 'story-1');
    const state = createMockState('/review-test/math/algebra/story-1');

    let canActivateResult: boolean | null = null;

    guard.canActivate(route, state).then(result => {
      canActivateResult = result;
    });

    tick();

    expect(canActivateResult).toBeFalse();
    expect(navigateSpy).toHaveBeenCalledWith([
      `${AppConstants.PAGES_REGISTERED_WITH_FRONTEND.ERROR.ROUTE}/404`,
    ]);
    expect(locationSpy).toHaveBeenCalledWith(state.url);
  }));
});
