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
 * @fileoverview Unit tests for AuthService.
 */

import { TestBed } from '@angular/core/testing';
import { AngularFireAuth } from '@angular/fire/auth';
import { md5 } from 'hash-wasm';

import { AppConstants } from 'app.constants';
import { AuthService } from 'services/auth.service';
import { AuthBackendApiService } from 'services/auth-backend-api.service';

describe('Auth service', () => {
  let authService: AuthService;

  let authBackendApiService: jasmine.SpyObj<AuthBackendApiService>;
  let angularFireAuth: jasmine.SpyObj<AngularFireAuth>;

  beforeEach(() => {
    angularFireAuth = jasmine.createSpyObj<AngularFireAuth>([
      'createUserWithEmailAndPassword',
      'getRedirectResult',
      'signInWithEmailAndPassword',
      'signInWithRedirect',
      'signOut',
    ]);
    authBackendApiService = (
      jasmine.createSpyObj<AuthBackendApiService>(['beginSessionAsync']));

    TestBed.configureTestingModule({
      providers: [
        {provide: AngularFireAuth, useValue: angularFireAuth},
        {provide: AuthBackendApiService, useValue: authBackendApiService},
      ]
    });

    authService = TestBed.inject(AuthService);
  });

  it('should not use firebase auth in unit tests', () => {
    expect(AuthService.firebaseAuthIsEnabled).toBeFalse();
  });

  it('should be in emulator mode by default', () => {
    spyOnProperty(AuthService, 'firebaseAuthIsEnabled', 'get')
      .and.returnValue(true);

    expect(AuthService.firebaseEmulatorIsEnabled).toBeTrue();
  });

  it('should not provide firebase config if auth is disabled', () => {
    spyOnProperty(AuthService, 'firebaseAuthIsEnabled', 'get')
      .and.returnValue(false);

    expect(AuthService.firebaseConfig).toBeUndefined();
  });

  it('should use firebase constants for the config', () => {
    spyOnProperty(AuthService, 'firebaseAuthIsEnabled', 'get')
      .and.returnValue(true);

    expect(AuthService.firebaseConfig).toEqual({
      apiKey: AppConstants.FIREBASE_CONFIG_API_KEY,
      authDomain: AppConstants.FIREBASE_CONFIG_AUTH_DOMAIN,
      projectId: AppConstants.FIREBASE_CONFIG_PROJECT_ID,
      storageBucket: AppConstants.FIREBASE_CONFIG_STORAGE_BUCKET,
      messagingSenderId: AppConstants.FIREBASE_CONFIG_MESSAGING_SENDER_ID,
      appId: AppConstants.FIREBASE_CONFIG_APP_ID,
    });
  });

  it('should return emulator config when emulator is enabled', () => {
    spyOnProperty(AuthService, 'firebaseEmulatorIsEnabled', 'get')
      .and.returnValue(true);

    expect(AuthService.firebaseEmulatorConfig).toEqual(['localhost', 9099]);
  });

  it('should return undefined when emulator is disabled', () => {
    spyOnProperty(AuthService, 'firebaseEmulatorIsEnabled', 'get')
      .and.returnValue(false);

    expect(AuthService.firebaseEmulatorConfig).toBeUndefined();
  });

  it('should resolve when sign out succeeds', async() => {
    angularFireAuth.signOut.and.resolveTo();

    await expectAsync(authService.signOutAsync()).toBeResolvedTo();
  });

  it('should reject when sign out fails', async() => {
    angularFireAuth.signOut.and.rejectWith(new Error('fail'));

    await expectAsync(authService.signOutAsync()).toBeRejectedWithError('fail');
  });

  it('should throw if signOutAsync is called without angular fire', async() => {
    await expectAsync(
      new AuthService(null, authBackendApiService).signOutAsync()
    ).toBeRejectedWithError('AngularFireAuth is not available');
  });

  it('should throw if signInAsync is called without angular fire', async() => {
    await expectAsync(
      new AuthService(null, authBackendApiService).signInAsync()
    ).toBeRejectedWithError('AngularFireAuth is not available');
  });

  describe('Sign In Behavior', function() {
    beforeEach(async() => {
      authBackendApiService.beginSessionAsync.and.resolveTo();

      this.email = 'email@test.com';
      this.password = await md5(this.email);
      this.creds = {
        user: jasmine.createSpyObj(['getIdToken']),
        credential: null,
        additionalUserInfo: {isNewUser: false, profile: {}, providerId: null},
      };
    });

    describe('Production enabled', () => {
      beforeEach(() => {
        spyOnProperty(AuthService, 'firebaseEmulatorIsEnabled', 'get')
          .and.returnValue(false);
      });

      it('should sign in using redirect', async() => {
        angularFireAuth.signInWithRedirect.and.resolveTo();

        this.creds.user.getIdToken.and.resolveTo('TKN');
        this.creds.additionalUserInfo.isNewUser = false;
        angularFireAuth.getRedirectResult.and.resolveTo(this.creds);

        const signInPromise = authService.signInAsync();

        await expectAsync(signInPromise).toBeResolvedTo(false);

        expect(angularFireAuth.signInWithRedirect).toHaveBeenCalled();
      });

      it('should recognize new users', async() => {
        angularFireAuth.signInWithRedirect.and.resolveTo();

        this.creds.user.getIdToken.and.resolveTo('TKN');
        this.creds.additionalUserInfo.isNewUser = true;
        angularFireAuth.getRedirectResult.and.resolveTo(this.creds);

        const signInPromise = authService.signInAsync();

        await expectAsync(signInPromise).toBeResolvedTo(true);

        expect(angularFireAuth.signInWithRedirect).toHaveBeenCalled();
      });

      it('should propogate errors', async() => {
        angularFireAuth.signInWithRedirect.and.resolveTo();

        const error = {code: 'auth/operation-not-allowed'};
        angularFireAuth.getRedirectResult.and.rejectWith(error);

        await expectAsync(authService.signInAsync()).toBeRejectedWith(error);
      });
    });

    describe('Emulator enabled', () => {
      beforeEach(() => {
        spyOnProperty(AuthService, 'firebaseEmulatorIsEnabled', 'get')
          .and.returnValue(true);
      });

      it('should sign in using prompt', async() => {
        spyOn(window, 'prompt').and.returnValue(this.email);

        this.creds.user.getIdToken.and.resolveTo('TKN');
        this.creds.additionalUserInfo.isNewUser = false;
        angularFireAuth.signInWithEmailAndPassword.and.resolveTo(this.creds);

        const signInPromise = authService.signInAsync();

        await expectAsync(signInPromise).toBeResolvedTo(false);

        expect(angularFireAuth.signInWithEmailAndPassword.calls.first().args)
          .toEqual([this.email, this.password]);
      });

      it('should recognize new users', async() => {
        spyOn(window, 'prompt').and.returnValue(this.email);

        angularFireAuth.signInWithEmailAndPassword
          .and.rejectWith({code: 'auth/user-not-found'});

        this.creds.user.getIdToken.and.resolveTo('TKN');
        this.creds.additionalUserInfo.isNewUser = true;
        angularFireAuth.createUserWithEmailAndPassword
          .and.resolveTo(this.creds);

        const signInPromise = authService.signInAsync();

        await expectAsync(signInPromise).toBeResolvedTo(true);

        expect(angularFireAuth.signInWithEmailAndPassword.calls.first().args)
          .toEqual([this.email, this.password]);
      });

      it('should propogate errors', async() => {
        spyOn(window, 'prompt').and.returnValue(this.email);

        const error = {code: 'auth/operation-not-allowed'};
        angularFireAuth.signInWithEmailAndPassword.and.rejectWith(error);

        await expectAsync(authService.signInAsync()).toBeRejectedWith(error);
      });
    });
  });
});
