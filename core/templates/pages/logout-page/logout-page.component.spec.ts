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

import {
  ComponentFixture,
  fakeAsync,
  flush,
  flushMicrotasks,
  TestBed,
  tick,
} from '@angular/core/testing';

import {LogoutPageComponent} from 'pages/logout-page/logout-page.component';
import {AlertsService} from 'services/alerts.service';
import {AuthService} from 'services/auth.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {LoaderService} from 'services/loader.service';

class MockWindowRef {
  constructor(
    public location: string | null = null,
    public searchParams: string = ''
  ) {}

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
      },
    };
  }
}

class PendingPromise<T = void> {
  public readonly promise: Promise<T>;
  public readonly resolve: (_: T | PromiseLike<T>) => void;
  public readonly reject: (_?: Object) => void;

  constructor() {
    let resolve: (_: T | PromiseLike<T>) => void = () => {};
    let reject: (_?: Object) => void = () => {};
    this.promise = new Promise((res, rej) => {
      // Can't assign to this directly because resolve and reject are readonly.
      resolve = res;
      reject = rej;
    });
    this.resolve = resolve;
    this.reject = reject;
  }
}

describe('Logout Page', function () {
  let alertsService: jasmine.SpyObj<AlertsService>;
  let authService: jasmine.SpyObj<AuthService>;
  let loaderService: jasmine.SpyObj<LoaderService>;
  let windowRef: MockWindowRef;

  let component: LogoutPageComponent;
  let fixture: ComponentFixture<LogoutPageComponent>;

  const spyOnSignOutAsync = () => {
    const pending = new PendingPromise();
    authService.signOutAsync.and.returnValue(pending.promise);
    return pending;
  };

  beforeEach(() => {
    alertsService = jasmine.createSpyObj<AlertsService>('AlertsService', [
      'addWarning',
    ]);
    authService = jasmine.createSpyObj<AuthService>('AuthService', {
      signOutAsync: Promise.resolve(),
    });
    loaderService = jasmine.createSpyObj<LoaderService>('LoaderService', [
      'showLoadingScreen',
      'hideLoadingScreen',
    ]);
    windowRef = new MockWindowRef();

    TestBed.configureTestingModule({
      declarations: [LogoutPageComponent],
      providers: [
        {provide: AlertsService, useValue: alertsService},
        {provide: AuthService, useValue: authService},
        {provide: LoaderService, useValue: loaderService},
        {provide: WindowRef, useValue: windowRef},
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LogoutPageComponent);
    component = fixture.componentInstance;
  });

  it('should call to signOutAsync and then redirect', fakeAsync(() => {
    const signOutPromise = spyOnSignOutAsync();

    expect(windowRef.location).toBeNull();

    component.ngOnInit();

    expect(loaderService.showLoadingScreen).toHaveBeenCalled();
    expect(authService.signOutAsync).toHaveBeenCalled();

    signOutPromise.resolve();
    flushMicrotasks();

    expect(windowRef.location).toEqual('/');
  }));

  it('should redirect to specified url', fakeAsync(() => {
    windowRef.searchParams = '?redirect_url=/test';

    component.ngOnInit();
    flush();

    expect(windowRef.location).toEqual('/test');
  }));

  it('should add warning on error and redirect anyway', fakeAsync(() => {
    const signOutPromise = spyOnSignOutAsync();

    expect(windowRef.location).toBeNull();

    component.ngOnInit();

    expect(loaderService.showLoadingScreen).toHaveBeenCalled();
    expect(authService.signOutAsync).toHaveBeenCalled();

    signOutPromise.reject(new Error('uh-oh!'));
    flushMicrotasks();

    expect(loaderService.hideLoadingScreen).toHaveBeenCalled();
    expect(alertsService.addWarning).toHaveBeenCalledWith('uh-oh!');
    // We should still be on the same page for an opportunity to read the error.
    expect(windowRef.location).toBeNull();

    tick(3000);

    expect(windowRef.location).toEqual('/');
  }));

  it('should redirect to specified url after error', fakeAsync(() => {
    windowRef.searchParams = '?redirect_url=/test';
    authService.signOutAsync.and.rejectWith(new Error('uh-oh!'));

    component.ngOnInit();
    flush();

    expect(windowRef.location).toEqual('/test');
  }));
});
