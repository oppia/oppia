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
 * @fileoverview Tests for ExplorationPlayerPageAuthGuard.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  convertToParamMap,
} from '@angular/router';
import {Location} from '@angular/common';

import {AppConstants} from '../../../app.constants';
import {AccessValidationBackendApiService} from '../../../pages/oppia-root/routing/access-validation-backend-api.service';
import {ExplorationPlayerPageAuthGuard} from './exploration-player-page-auth.guard';
import {PlatformFeatureService} from 'services/platform-feature.service';

class MockRouter {
  navigate(commands: string[]): Promise<boolean> {
    return Promise.resolve(true);
  }
  navigateByUrl(_url: string): Promise<boolean> {
    return Promise.resolve(true);
  }
  createUrlTree(commands: string[], _options?: object): string {
    return `/lesson/${commands[1]}`;
  }
}

class MockPlatformFeatureService {
  get status() {
    return {
      NewLessonPlayer: {isEnabled: false},
    };
  }
}

const createMockRoute = (explorationId: string): ActivatedRouteSnapshot => {
  const snapshot = new ActivatedRouteSnapshot();

  Object.defineProperty(snapshot, 'paramMap', {
    get: () => convertToParamMap({exploration_id: explorationId}),
  });

  snapshot.params = {exploration_id: explorationId};
  snapshot.queryParams = {v: '1'};

  return snapshot;
};

const createMockState = (url: string): RouterStateSnapshot => ({
  url,
  root: new ActivatedRouteSnapshot(),
});

describe('ExplorationPlayerPageAuthGuard', () => {
  let guard: ExplorationPlayerPageAuthGuard;
  let accessValidationBackendApiService: AccessValidationBackendApiService;
  let platformFeatureService: PlatformFeatureService;
  let router: Router;
  let location: jasmine.SpyObj<Location>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AccessValidationBackendApiService,
        {provide: Router, useClass: MockRouter},
        {provide: PlatformFeatureService, useClass: MockPlatformFeatureService},
        {
          provide: Location,
          useValue: jasmine.createSpyObj('Location', ['replaceState']),
        },
      ],
    });

    guard = TestBed.inject(ExplorationPlayerPageAuthGuard);
    accessValidationBackendApiService = TestBed.inject(
      AccessValidationBackendApiService
    );
    platformFeatureService = TestBed.inject(PlatformFeatureService);
    router = TestBed.inject(Router);
    location = TestBed.inject(Location) as jasmine.SpyObj<Location>;
  });

  it('should allow access if validation passes and flag is disabled', done => {
    spyOn(
      accessValidationBackendApiService,
      'validateAccessToExplorationPlayerPage'
    ).and.returnValue(Promise.resolve());

    spyOnProperty(platformFeatureService, 'status', 'get').and.returnValue({
      NewLessonPlayer: {isEnabled: false},
    });

    const route = {
      paramMap: convertToParamMap({exploration_id: 'exp123'}),
      queryParams: {},
    } as ActivatedRouteSnapshot;

    const routerSpy = spyOn(router, 'navigateByUrl');

    guard
      .canActivate(route, createMockState('/explore/exp123'))
      .then(result => {
        expect(result).toBeTrue();
        expect(routerSpy).not.toHaveBeenCalled();
        done();
      });
  });

  it('should redirect to /lesson/:id if flag is enabled', done => {
    spyOn(
      accessValidationBackendApiService,
      'validateAccessToExplorationPlayerPage'
    ).and.returnValue(Promise.resolve());

    spyOnProperty(platformFeatureService, 'status', 'get').and.returnValue({
      NewLessonPlayer: {isEnabled: true},
    });

    const route = createMockRoute('exp123');

    const navigateByUrlSpy = spyOn(router, 'navigateByUrl').and.callThrough();

    guard
      .canActivate(route, createMockState('/explore/exp123?v=1'))
      .then(result => {
        expect(result).toBeFalse();
        expect(navigateByUrlSpy).toHaveBeenCalledWith('/lesson/exp123');
        done();
      });
  });

  it('should redirect to /embed/lesson/:id if URL contains "embed" and flag is enabled', done => {
    spyOn(
      accessValidationBackendApiService,
      'validateAccessToExplorationPlayerPage'
    ).and.returnValue(Promise.resolve());

    spyOnProperty(platformFeatureService, 'status', 'get').and.returnValue({
      NewLessonPlayer: {isEnabled: true},
    });

    const route = createMockRoute('exp123');
    const routerNavigateSpy = spyOn(router, 'navigate');

    guard
      .canActivate(route, createMockState('/embed/exploration/exp123?v=1'))
      .then(result => {
        expect(result).toBeFalse();
        expect(routerNavigateSpy).toHaveBeenCalledWith(
          ['/embed/lesson', 'exp123'],
          {queryParams: {v: '1'}}
        );
        done();
      });
  });

  it('should redirect to embed error page if access is denied and URL includes embed', done => {
    spyOn(
      accessValidationBackendApiService,
      'validateAccessToExplorationPlayerPage'
    ).and.returnValue(Promise.reject({status: 403}));

    const navigateSpy = spyOn(router, 'navigate').and.callThrough();

    const route = {
      paramMap: convertToParamMap({exploration_id: 'exp123'}),
      queryParams: {},
    } as ActivatedRouteSnapshot;

    const state = createMockState('/embed/explore/exp123');

    guard.canActivate(route, state).then(result => {
      expect(result).toBeFalse();
      expect(navigateSpy).toHaveBeenCalledWith([
        `${AppConstants.PAGES_REGISTERED_WITH_FRONTEND.ERROR_IFRAMED.ROUTE}`,
      ]);
      expect(location.replaceState).toHaveBeenCalledWith(state.url);
      done();
    });
  });

  it('should redirect to error page with status if access is denied and not embedded', done => {
    spyOn(
      accessValidationBackendApiService,
      'validateAccessToExplorationPlayerPage'
    ).and.returnValue(Promise.reject({status: 401}));

    const navigateSpy = spyOn(router, 'navigate').and.callThrough();

    const route = {
      paramMap: convertToParamMap({exploration_id: 'exp123'}),
      queryParams: {},
    } as ActivatedRouteSnapshot;

    const state = createMockState('/explore/exp123');

    guard.canActivate(route, state).then(result => {
      expect(result).toBeFalse();
      expect(navigateSpy).toHaveBeenCalledWith([
        `${AppConstants.PAGES_REGISTERED_WITH_FRONTEND.ERROR.ROUTE}/401`,
      ]);
      expect(location.replaceState).toHaveBeenCalledWith(state.url);
      done();
    });
  });
});
