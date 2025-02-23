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
 * @fileoverview Tests for TopicsAndSkillsDashboardAuthGuard.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {TestBed} from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  NavigationExtras,
} from '@angular/router';

import {AppConstants} from 'app.constants';
import {UserInfo} from '../../domain/user/user-info.model.ts';
import {UserService} from 'services/user.service';
import {TopicsAndSkillsDashboardAuthGuard} from './topics-and-skills-dashboard-auth.guard';

class MockRouter {
  navigate(commands: string[], extras?: NavigationExtras): Promise<boolean> {
    return Promise.resolve(true);
  }
}

describe('TopicsAndSkillsDashboardAuthGuard', () => {
  let userService: UserService;
  let router: Router;
  let guard: TopicsAndSkillsDashboardAuthGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserService, {provide: Router, useClass: MockRouter}],
    }).compileComponents();

    guard = TestBed.inject(TopicsAndSkillsDashboardAuthGuard);
    userService = TestBed.inject(UserService);
    router = TestBed.inject(Router);
  });

  it('should redirect user to 401 page if user is not a curriculum admin', done => {
    const getUserInfoAsyncSpy = spyOn(
      userService,
      'getUserInfoAsync'
    ).and.returnValue(Promise.resolve(UserInfo.createDefault()));
    const navigateSpy = spyOn(router, 'navigate').and.callThrough();

    guard
      .canActivate(new ActivatedRouteSnapshot(), {} as RouterStateSnapshot)
      .then(canActivate => {
        expect(canActivate).toBe(false);
        expect(getUserInfoAsyncSpy).toHaveBeenCalledTimes(1);
        expect(navigateSpy).toHaveBeenCalledWith([
          `${AppConstants.PAGES_REGISTERED_WITH_FRONTEND.ERROR.ROUTE}/401`,
        ]);
        done();
      });
  });

  it('should not redirect user to 401 page if user is a curriculum admin', done => {
    const getUserInfoAsyncSpy = spyOn(
      userService,
      'getUserInfoAsync'
    ).and.returnValue(
      Promise.resolve(
        new UserInfo([], false, true, false, false, false, '', '', '', true)
      )
    );
    const navigateSpy = spyOn(router, 'navigate').and.callThrough();

    guard
      .canActivate(new ActivatedRouteSnapshot(), {} as RouterStateSnapshot)
      .then(canActivate => {
        expect(canActivate).toBe(true);
        expect(getUserInfoAsyncSpy).toHaveBeenCalledTimes(1);
        expect(navigateSpy).not.toHaveBeenCalled();
        done();
      });
  });
});
