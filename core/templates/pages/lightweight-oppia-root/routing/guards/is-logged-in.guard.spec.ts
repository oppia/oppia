// Copyright 2023 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for IsLoggedInGuard.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, NavigationExtras } from '@angular/router';
import { AppConstants } from 'app.constants';

import { UserInfo } from 'domain/user/user-info.model';
import { UserService } from 'services/user.service';
import { IsLoggedInGuard } from './is-logged-in.guard';

class MockRouter {
  navigate(commands: string[], extras?: NavigationExtras): Promise<boolean> {
    return Promise.resolve(true);
  }
}

describe('IsLoggedInGuard', () => {
  let userService: UserService;
  let router: Router;
  let guard: IsLoggedInGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserService, { provide: Router, useClass: MockRouter }],
    }).compileComponents();

    guard = TestBed.inject(IsLoggedInGuard);
    userService = TestBed.inject(UserService);
    router = TestBed.inject(Router);
  });

  it('should redirect user to login page if user is not logged in', (done) => {
    const getUserInfoAsyncSpy = spyOn(
      userService, 'getUserInfoAsync').and.returnValue(
      Promise.resolve(UserInfo.createDefault())
    );
    const navigateSpy = spyOn(router, 'navigate');
    const routerStateSnapshot = { url: 'url' } as RouterStateSnapshot;

    guard.canActivate(new ActivatedRouteSnapshot(), routerStateSnapshot).then(
      (canActivate) => {
        expect(canActivate).toBeFalse();
        expect(getUserInfoAsyncSpy).toHaveBeenCalledTimes(1);
        expect(navigateSpy).toHaveBeenCalledWith(
          [`/${AppConstants.PAGES_REGISTERED_WITH_FRONTEND.LOGIN.ROUTE}`],
          { queryParams: { return_url: routerStateSnapshot.url } }
        );
        done();
      });
  });

  it('should not redirect user to login page if user is logged in', (done) => {
    const getUserInfoAsyncSpy = spyOn(
      userService, 'getUserInfoAsync').and.returnValue(
      Promise.resolve(new UserInfo(
        [], false, false, false, false, false, '', '', '', true))
    );
    const navigateSpy = spyOn(router, 'navigate');
    const routerStateSnapshot = { url: 'url' } as RouterStateSnapshot;

    guard.canActivate(new ActivatedRouteSnapshot(), routerStateSnapshot).then(
      (canActivate) => {
        expect(canActivate).toBeTrue();
        expect(getUserInfoAsyncSpy).toHaveBeenCalledTimes(1);
        expect(navigateSpy).not.toHaveBeenCalled();
        done();
      });
  });
});
