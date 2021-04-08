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
import { ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AlertsService } from 'services/alerts.service';
import { AuthService } from 'services/auth.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { LoaderService } from 'services/loader.service';
import { LoginPageComponent } from './login-page.component';

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
  let alertsService: jasmine.SpyObj<AlertsService>;
  let authService: jasmine.SpyObj<AuthService>;
  let loaderService: jasmine.SpyObj<LoaderService>;
  let windowRef: MockWindowRef;

  let loginPageComponent: LoginPageComponent;
  let fixture: ComponentFixture<LoginPageComponent>;

  const spyOnHandleRedirectResultAsync = () => {
    const pending = new PendingPromise<boolean>();
    authService.handleRedirectResultAsync.and.returnValue(pending.promise);
    return pending;
  };

  const spyOnSignInWithEmail = () => {
    const pending = new PendingPromise();
    authService.signInWithEmail.and.returnValue(pending.promise);
    return pending;
  };

  beforeEach(() => {
    alertsService = jasmine.createSpyObj<AlertsService>('AlertsService', [
      'addWarning',
    ]);
    authService = jasmine.createSpyObj<AuthService>('AuthService', {
      handleRedirectResultAsync: Promise.resolve(false),
      signInWithRedirectAsync: Promise.resolve(),
      signInWithEmail: Promise.resolve(),
    });
    loaderService = jasmine.createSpyObj<LoaderService>('LoaderService', [
      'showLoadingScreen',
      'hideLoadingScreen',
    ]);
    windowRef = new MockWindowRef();

    TestBed.configureTestingModule({
      imports: [
        MatAutocompleteModule,
        MatCardModule,
        MatButtonModule,
        MatInputModule,
        MatFormFieldModule,
        ReactiveFormsModule,
      ],
      declarations: [LoginPageComponent],
      providers: [
        { provide: AlertsService, useValue: alertsService },
        { provide: AuthService, useValue: authService },
        { provide: LoaderService, useValue: loaderService },
        { provide: WindowRef, useValue: windowRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPageComponent);
    loginPageComponent = fixture.componentInstance;
  });

  it('should be enabled by default', () => {
    expect(loginPageComponent.enabled).toBeTrue();
  });

  it('should be in emulator mode by default', () => {
    expect(loginPageComponent.emulatorModeIsEnabled).toBeTrue();
  });

  it('should redirect immediately if login page disabled', fakeAsync(() => {
    spyOnProperty(loginPageComponent, 'enabled', 'get').and.returnValue(false);

    loginPageComponent.ngOnInit();
    flush();

    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'Sign-in is temporarily disabled. Please try again later.');
    expect(windowRef.location).toEqual('/');
    expect(authService.handleRedirectResultAsync).not.toHaveBeenCalled();
    expect(authService.signInWithRedirectAsync).not.toHaveBeenCalled();
  }));

  describe('Emulator mode', function() {
    beforeEach(() => {
      this.email = 'a@a.com';
      spyOnProperty(loginPageComponent, 'emulatorModeIsEnabled', 'get')
        .and.returnValue(true);
    });

    it('should not handle redirect results', fakeAsync(() => {
      loginPageComponent.ngOnInit();

      expect(loaderService.showLoadingScreen).not.toHaveBeenCalled();
      expect(authService.handleRedirectResultAsync).not.toHaveBeenCalled();
    }));

    it('should redirect to sign up after successful sign in', fakeAsync(() => {
      const signInPromise = spyOnSignInWithEmail();

      loginPageComponent.onClickSignInButtonAsync(this.email);

      flushMicrotasks();

      expect(loaderService.showLoadingScreen).toHaveBeenCalled();
      expect(authService.signInWithEmail).toHaveBeenCalled();
      expect(windowRef.location).toBeNull();

      signInPromise.resolve();
      flush();

      expect(windowRef.location).toEqual('/signup?return_url=/');
    }));

    it('should acknowledge a user pending account deletion', fakeAsync(() => {
      const signInPromise = spyOnSignInWithEmail();

      loginPageComponent.onClickSignInButtonAsync(this.email);

      expect(windowRef.location).toBeNull();

      signInPromise.reject({code: 'auth/user-disabled', message: '!'});
      flushMicrotasks();

      expect(windowRef.location).toEqual('/pending-account-deletion');

      flush();
    }));

    it('should add a warning message when signin fails', fakeAsync(() => {
      const signInPromise = spyOnSignInWithEmail();

      loginPageComponent.onClickSignInButtonAsync(this.email);

      expect(windowRef.location).toBeNull();

      signInPromise.reject({code: 'auth/unknown-error', message: '?'});
      flush();

      expect(windowRef.location).toBeNull();
      expect(alertsService.addWarning).toHaveBeenCalledWith('?');
      expect(loaderService.hideLoadingScreen).toHaveBeenCalled();

      flush();
    }));

    it('should redirect to given url', fakeAsync(() => {
      const signInPromise = spyOnSignInWithEmail();
      windowRef.searchParams = '?return_url=/admin';

      loginPageComponent.onClickSignInButtonAsync(this.email);

      expect(windowRef.location).toBeNull();

      signInPromise.resolve();
      flushMicrotasks();

      expect(windowRef.location).toEqual('/signup?return_url=/admin');

      flush();
    }));
  });

  describe('Production mode', () => {
    beforeEach(() => {
      spyOnProperty(loginPageComponent, 'emulatorModeIsEnabled', 'get')
        .and.returnValue(false);
    });

    it('should redirect to sign-up after successful redirect', fakeAsync(() => {
      const redirectResultPromise = spyOnHandleRedirectResultAsync();

      loginPageComponent.ngOnInit();

      expect(windowRef.location).toBeNull();

      redirectResultPromise.resolve(true);
      flushMicrotasks();

      expect(windowRef.location).toEqual('/signup?return_url=/');

      flush();
    }));

    it('should acknowledge a user pending account deletion', fakeAsync(() => {
      const redirectResultPromise = spyOnHandleRedirectResultAsync();

      loginPageComponent.ngOnInit();

      expect(windowRef.location).toBeNull();

      redirectResultPromise.reject({code: 'auth/user-disabled', message: '!'});
      flushMicrotasks();

      expect(windowRef.location).toEqual('/pending-account-deletion');

      flush();
    }));

    it('should redirect to home page after failed login', fakeAsync(() => {
      const redirectResultPromise = spyOnHandleRedirectResultAsync();

      loginPageComponent.ngOnInit();

      expect(windowRef.location).toBeNull();

      redirectResultPromise.reject({code: 'auth/unknown-error', message: '?'});

      // An error should have appeared, but it will not redirect immediately.
      flushMicrotasks();
      expect(windowRef.location).toBeNull();
      expect(alertsService.addWarning).toHaveBeenCalledWith('?');

      // The user will be given 2 seconds to acknowledge the warning.
      tick(2000);
      expect(windowRef.location).toEqual('/');

      flush();
    }));

    it('should redirect to auth service when not logged in', fakeAsync(() => {
      const redirectResultPromise = spyOnHandleRedirectResultAsync();

      loginPageComponent.ngOnInit();

      expect(authService.signInWithRedirectAsync).not.toHaveBeenCalled();

      redirectResultPromise.resolve(null);
      flushMicrotasks();

      expect(authService.signInWithRedirectAsync).toHaveBeenCalled();

      flush();
    }));

    it('should redirect to given url', fakeAsync(() => {
      const redirectResultPromise = spyOnHandleRedirectResultAsync();
      windowRef.searchParams = '?return_url=/admin';

      loginPageComponent.ngOnInit();

      expect(windowRef.location).toBeNull();

      redirectResultPromise.resolve(true);
      flushMicrotasks();

      expect(windowRef.location).toEqual('/signup?return_url=/admin');
    }));
  });
});
