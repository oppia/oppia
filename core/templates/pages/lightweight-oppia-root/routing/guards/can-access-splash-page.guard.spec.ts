// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for can access splash page guard.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {fakeAsync, TestBed, tick} from '@angular/core/testing';
import {Route} from '@angular/router';

import {UserInfo} from 'domain/user/user-info.model';
import {WindowRef} from 'services/contextual/window-ref.service';
import {UserService} from 'services/user.service';
import {CanAccessSplashPageGuard} from './can-access-splash-page.guard';

class MockWindowRef {
  nativeWindow = {
    location: {
      href: '',
    },
  };
}

describe('Can access splash page guard', () => {
  let caspg: CanAccessSplashPageGuard;
  let windowRef: MockWindowRef;
  let userService: UserService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: WindowRef,
          useClass: MockWindowRef,
        },
        UserService,
      ],
    }).compileComponents();
    caspg = TestBed.inject(CanAccessSplashPageGuard);
    windowRef = TestBed.inject(WindowRef);
    userService = TestBed.inject(UserService);
  });

  it('should redirect user to default dashboard', fakeAsync(() => {
    let defaultDashboard = 'learner';
    spyOn(userService, 'getUserInfoAsync').and.returnValue(
      Promise.resolve(
        new UserInfo([], false, false, false, false, false, '', '', '', true)
      )
    );
    spyOn(userService, 'getUserPreferredDashboardAsync').and.returnValue(
      Promise.resolve('learner')
    );
    caspg.canLoad({} as Route, []);
    tick();
    tick();
    expect(windowRef.nativeWindow.location.href).toEqual(
      '/' + defaultDashboard + '-dashboard'
    );
  }));

  it('should allow user to access page if not logged in', fakeAsync(() => {
    spyOn(userService, 'getUserInfoAsync').and.returnValue(
      Promise.resolve(
        new UserInfo([], false, false, false, false, false, '', '', '', false)
      )
    );
    caspg.canLoad({} as Route, []).then(value => {
      expect(value).toEqual(true);
    });
    tick();
  }));

  it('should show user splash page if request to user hander fails', fakeAsync(() => {
    spyOn(userService, 'getUserInfoAsync').and.returnValue(Promise.reject());
    caspg.canLoad({} as Route, []).then(value => {
      expect(value).toEqual(true);
    });
    tick();
  }));
});
