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
 * @fileoverview Unit tests for the logout page.
 */

import { ComponentFixture, fakeAsync, flush, TestBed } from '@angular/core/testing';
import { AuthService } from 'services/auth.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { LogoutPageComponent } from './logout-page.component';

class MockWindowRef {
  constructor(
      public location: string = null, public searchParams: string = '') {}

  get nativeWindow() {
    const that = this;
    return {
      location: {
        get search() {
          return that.searchParams;
        },
        assign: (url: string) => {
          that.location = url;
        },
      }
    };
  }
}

describe('Logout Page', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let windowRef: MockWindowRef;

  let component: LogoutPageComponent;
  let fixture: ComponentFixture<LogoutPageComponent>;

  beforeEach(() => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', {
      signOutAsync: Promise.resolve(),
    });
    windowRef = new MockWindowRef();

    TestBed.configureTestingModule({
      declarations: [LogoutPageComponent],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: WindowRef, useValue: windowRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LogoutPageComponent);
    component = fixture.componentInstance;
  });

  it('should sign out and then redirect', fakeAsync(async() => {
    const initPromise = component.ngOnInit();

    expect(authService.signOutAsync).toHaveBeenCalled();
    expect(windowRef.location).toBeNull();

    flush();

    await expectAsync(initPromise).toBeResolved();
    expect(windowRef.location).toEqual('/');
  }));

  it('should redirects even if sign out failed', fakeAsync(async() => {
    const logSpy = spyOn(console, 'error');
    const error = new Error('uh-oh!');
    authService.signOutAsync.and.rejectWith(error);

    const initPromise = component.ngOnInit();

    expect(authService.signOutAsync).toHaveBeenCalled();
    expect(windowRef.location).toBeNull();

    flush();

    await expectAsync(initPromise).toBeResolved();
    expect(logSpy).toHaveBeenCalledWith(error);
    expect(windowRef.location).toEqual('/');
  }));
});
