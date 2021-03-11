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
 * @fileoverview Unit tests for the login page.
 */

import { ComponentFixture, fakeAsync, flush, flushMicrotasks, TestBed, tick } from '@angular/core/testing';
import { AuthService } from 'services/auth.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { LoginPageComponent } from './login-page.component';

class MockWindowRef {
  constructor(public location: string = '', public searchParams: string = '') {}

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

class PendingPromise<T = void> {
  public readonly promise: Promise<T>;
  public readonly resolve: (_: T | PromiseLike<T>) => void;
  public readonly reject: (_?) => void;

  constructor() {
    let resolve: (_: T | PromiseLike<T>) => void;
    let reject: (_?) => void;
    this.promise = new Promise((res, rej) => {
      // Can't assign to this directly because resolve and reject are readonly.
      resolve = res;
      reject = rej;
    });
    this.resolve = resolve;
    this.reject = reject;
  }
}

describe('Login Page', () => {
  let redirectResultPromise: PendingPromise;
  let authService: jasmine.SpyObj<AuthService>;
  let windowRef: MockWindowRef;

  let component: LoginPageComponent;
  let fixture: ComponentFixture<LoginPageComponent>;

  const spyOnHandleRedirectResultAsync = () => {
    const pending = new PendingPromise();
    authService.handleRedirectResultAsync.and.returnValue(pending.promise);
    return pending;
  };

  beforeEach(() => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', {
      handleRedirectResultAsync: Promise.resolve(),
      signInWithRedirectAsync: Promise.resolve(),
    });
    windowRef = new MockWindowRef();

    TestBed.configureTestingModule({
      declarations: [LoginPageComponent],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: WindowRef, useValue: windowRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPageComponent);
    component = fixture.componentInstance;
  });

  it('should sign in after 150ms', fakeAsync(() => {
    component.ngOnInit();

    expect(authService.signInWithRedirectAsync).not.toHaveBeenCalled();

    tick(100);

    expect(authService.signInWithRedirectAsync).not.toHaveBeenCalled();

    tick(50);

    expect(authService.signInWithRedirectAsync).toHaveBeenCalled();

    flush();
  }));

  it('should redirect to sign-up after successful redirect', fakeAsync(() => {
    redirectResultPromise = spyOnHandleRedirectResultAsync();

    component.ngOnInit();

    expect(windowRef.location).toEqual('');

    redirectResultPromise.resolve();
    flushMicrotasks();

    expect(windowRef.location).toEqual('/signup');

    flush();
  }));

  it('should redirect to home page after failed redirect', fakeAsync(() => {
    redirectResultPromise = spyOnHandleRedirectResultAsync();

    component.ngOnInit();

    expect(windowRef.location).toEqual('');

    redirectResultPromise.reject();
    flushMicrotasks();

    expect(windowRef.location).toEqual('/');

    flush();
  }));

  it('should redirect to given url', fakeAsync(() => {
    redirectResultPromise = spyOnHandleRedirectResultAsync();
    windowRef.searchParams = '?return_url=/admin';

    component.ngOnInit();

    expect(windowRef.location).toEqual('');

    redirectResultPromise.resolve();
    flushMicrotasks();

    expect(windowRef.location).toEqual('/signup?return_url=/admin');

    flush();
  }));
});
