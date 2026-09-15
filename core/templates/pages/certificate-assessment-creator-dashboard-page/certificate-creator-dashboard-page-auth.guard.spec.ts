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
 * @fileoverview Tests for CertificateCreatorDashboardPageAuthGuard.
 */

import {Location} from '@angular/common';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {TestBed, fakeAsync, tick} from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import {RouterTestingModule} from '@angular/router/testing';

import {AppConstants} from 'app.constants';
import {UserInfo} from 'domain/user/user-info.model';
import {CertificateCreatorDashboardPageAuthGuard} from './certificate-creator-dashboard-page-auth.guard';
import {PlatformFeatureService} from 'services/platform-feature.service';
import {UserService} from 'services/user.service';

class MockRouter {
  navigate(commands: string[]): Promise<boolean> {
    return Promise.resolve(true);
  }
}

describe('CertificateCreatorDashboardPageAuthGuard', () => {
  let guard: CertificateCreatorDashboardPageAuthGuard;
  let platformFeatureService: PlatformFeatureService;
  let userService: UserService;
  let router: Router;
  let location: Location;

  beforeEach(() => {
    const platformFeatureServiceSpy = jasmine.createSpyObj(
      'PlatformFeatureService',
      [],
      {
        status: {
          EnableCertificateAssessment: {
            isEnabled: true,
          },
        },
      }
    );

    const userServiceSpy = jasmine.createSpyObj('UserService', [
      'getUserInfoAsync',
    ]);

    TestBed.configureTestingModule({
      imports: [RouterTestingModule, HttpClientTestingModule],
      providers: [
        CertificateCreatorDashboardPageAuthGuard,
        {
          provide: PlatformFeatureService,
          useValue: platformFeatureServiceSpy,
        },
        {provide: UserService, useValue: userServiceSpy},
        {provide: Router, useClass: MockRouter},
        Location,
      ],
    });

    guard = TestBed.inject(CertificateCreatorDashboardPageAuthGuard);
    platformFeatureService = TestBed.inject(PlatformFeatureService);
    userService = TestBed.inject(UserService);
    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
  });

  afterEach(() => {
    window.sessionStorage.clear();
  });

  it('should allow access when certificate assessment is enabled and user is curriculum admin', fakeAsync(() => {
    const navigateSpy = spyOn(router, 'navigate').and.returnValue(
      Promise.resolve(true)
    );
    (userService.getUserInfoAsync as jasmine.Spy).and.returnValue(
      Promise.resolve(
        new UserInfo([], false, true, false, false, false, '', '', '', true)
      )
    );

    let canActivateResult: boolean | null = null;

    guard
      .canActivate(new ActivatedRouteSnapshot(), {} as RouterStateSnapshot)
      .then(result => {
        canActivateResult = result;
      });

    tick();

    expect(canActivateResult).toBeTrue();
    expect(userService.getUserInfoAsync).toHaveBeenCalledTimes(1);
    expect(navigateSpy).not.toHaveBeenCalled();
  }));

  it('should redirect to 404 when certificate assessment is disabled', fakeAsync(() => {
    platformFeatureService.status.EnableCertificateAssessment.isEnabled = false;
    const navigateSpy = spyOn(router, 'navigate').and.returnValue(
      Promise.resolve(true)
    );
    const replaceStateSpy = spyOn(location, 'replaceState');

    let canActivateResult: boolean | null = null;
    const stateSnapshot = {
      url: '/certificate-creator-dashboard',
    } as RouterStateSnapshot;

    guard
      .canActivate(new ActivatedRouteSnapshot(), stateSnapshot)
      .then(result => {
        canActivateResult = result;
      });

    tick();

    expect(canActivateResult).toBeFalse();
    expect(navigateSpy).toHaveBeenCalledWith([
      `${AppConstants.PAGES_REGISTERED_WITH_FRONTEND.ERROR.ROUTE}/404`,
    ]);
    expect(replaceStateSpy).toHaveBeenCalledWith(
      '/certificate-creator-dashboard'
    );
  }));

  it('should redirect to 401 when user is not a curriculum admin', fakeAsync(() => {
    const navigateSpy = spyOn(router, 'navigate').and.returnValue(
      Promise.resolve(true)
    );
    const replaceStateSpy = spyOn(location, 'replaceState');
    (userService.getUserInfoAsync as jasmine.Spy).and.returnValue(
      Promise.resolve(UserInfo.createDefault())
    );

    let canActivateResult: boolean | null = null;
    const stateSnapshot = {
      url: '/certificate-creator-dashboard',
    } as RouterStateSnapshot;

    guard
      .canActivate(new ActivatedRouteSnapshot(), stateSnapshot)
      .then(result => {
        canActivateResult = result;
      });

    tick();

    expect(canActivateResult).toBeFalse();
    expect(navigateSpy).toHaveBeenCalledWith([
      `${AppConstants.PAGES_REGISTERED_WITH_FRONTEND.ERROR.ROUTE}/401`,
    ]);
    expect(window.sessionStorage.getItem('oppia_401_error_message')).toEqual(
      'You must be a curriculum admin to access this page.'
    );
    expect(replaceStateSpy).toHaveBeenCalledWith(
      '/certificate-creator-dashboard'
    );
  }));
});
