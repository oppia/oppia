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
 * @fileoverview Tests for ExplorationPlayerPageAuthGuard
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  NavigationExtras,
} from '@angular/router';
import {Location} from '@angular/common';

import {AppConstants} from '../../app.constants';
import {AccessValidationBackendApiService} from 'pages/oppia-root/routing/access-validation-backend-api.service';
import {ExplorationPlayerPageAuthGuard} from './exploration-player-page-auth.guard';

class MockRouter {
  navigate(commands: string[], extras?: NavigationExtras): Promise<boolean> {
    return Promise.resolve(true);
  }
}

describe('ExplorationPlayerPageAuthGuard', () => {
  let accessValidationBackendApiService: AccessValidationBackendApiService;
  let router: Router;
  let guard: ExplorationPlayerPageAuthGuard;
  let location: Location;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AccessValidationBackendApiService,
        {provide: Router, useClass: MockRouter},
        {
          provide: Location,
          useValue: jasmine.createSpyObj('Location', ['replaceState']),
        },
      ],
    }).compileComponents();

    guard = TestBed.inject(ExplorationPlayerPageAuthGuard);
    accessValidationBackendApiService = TestBed.inject(
      AccessValidationBackendApiService
    );
    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
  });

  it('should allow access if backend validation passes', done => {
    spyOn(
      accessValidationBackendApiService,
      'validateAccessToExplorationPlayerPage'
    ).and.returnValue(Promise.resolve());
    const navigateSpy = spyOn(router, 'navigate').and.callThrough();

    guard
      .canActivate(
        {
          queryParams: {},
          paramMap: new Map([['explorationId', 'exp123']]),
        } as unknown as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot
      )
      .then(canActivate => {
        expect(canActivate).toBeTrue();
        expect(navigateSpy).not.toHaveBeenCalled();
      });
    done();
  });

  it('should redirect to embed error page if URL contains "embed"', done => {
    spyOn(
      accessValidationBackendApiService,
      'validateAccessToExplorationPlayerPage'
    ).and.returnValue(Promise.reject({status: 404}));
    const navigateSpy = spyOn(router, 'navigate').and.callThrough();

    guard
      .canActivate(
        {
          queryParams: {},
          paramMap: new Map([['exploration_id', 'exp123']]),
        } as unknown as ActivatedRouteSnapshot,
        {url: '/embed/exploration/exp123'} as RouterStateSnapshot
      )
      .then(canActivate => {
        expect(canActivate).toBeFalse();
        expect(navigateSpy).toHaveBeenCalledWith([
          `${AppConstants.PAGES_REGISTERED_WITH_FRONTEND.ERROR_IFRAMED.ROUTE}`,
        ]);
        expect(location.replaceState).toHaveBeenCalledWith(
          '/embed/exploration/exp123'
        );
        done();
      });
  });

  it('should redirect to error page with status code on failure', done => {
    spyOn(
      accessValidationBackendApiService,
      'validateAccessToExplorationPlayerPage'
    ).and.returnValue(Promise.reject({status: 404}));
    const navigateSpy = spyOn(router, 'navigate').and.callThrough();

    guard
      .canActivate(
        {
          queryParams: {},
          paramMap: new Map([['exploration_id', 'exp123']]),
        } as unknown as ActivatedRouteSnapshot,
        {url: '/exp123'} as RouterStateSnapshot
      )
      .then(canActivate => {
        expect(canActivate).toBeFalse();
        expect(navigateSpy).toHaveBeenCalledWith([
          `${AppConstants.PAGES_REGISTERED_WITH_FRONTEND.ERROR.ROUTE}/404`,
        ]);
        expect(location.replaceState).toHaveBeenCalledWith('/exp123');
        done();
      });
  });
});
