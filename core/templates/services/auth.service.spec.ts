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
    authBackendApiService = jasmine.createSpyObj<AuthBackendApiService>({
      beginSessionAsync: Promise.resolve(),
      endSessionAsync: Promise.resolve(),
    });

    TestBed.configureTestingModule({
      providers: [
        {provide: AngularFireAuth, useValue: angularFireAuth},
        {provide: AuthBackendApiService, useValue: authBackendApiService},
      ]
    });

    authService = TestBed.inject(AuthService);
  });

  it('should use firebase auth in unit tests', () => {
    expect(AuthService.firebaseAuthIsEnabled).toBeTrue();
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

  it('should throw if signInWithRedirectAsync is called without angular fire',
    async() => {
      await expectAsync(
        new AuthService(null, authBackendApiService).signInWithRedirectAsync()
      ).toBeRejectedWithError('AngularFireAuth is not available');
    });

  it('should throw if handleRedirectResultAsync is called without angular fire',
    async() => {
      await expectAsync(
        new AuthService(null, authBackendApiService).handleRedirectResultAsync()
      ).toBeRejectedWithError('AngularFireAuth is not available');
    });

  describe('Production mode', function() {
    beforeEach(async() => {
      spyOnProperty(AuthService, 'firebaseEmulatorIsEnabled', 'get')
        .and.returnValue(false);

      this.idToken = 'TKN';
      this.creds = {
        user: jasmine.createSpyObj({getIdToken: Promise.resolve(this.idToken)}),
        credential: null,
        additionalUserInfo: null,
      };

      authService = new AuthService(angularFireAuth, authBackendApiService);
    });

    it('should delegate to AngularFireAuth.signInWithRedirect', async() => {
      angularFireAuth.signInWithRedirect.and.resolveTo();

      await expectAsync(authService.signInWithRedirectAsync()).toBeResolvedTo();

      expect(angularFireAuth.signInWithRedirect).toHaveBeenCalled();
    });

    it('should delegate to AngularFireAuth.getRedirectResult', async() => {
      angularFireAuth.getRedirectResult.and.resolveTo(this.creds);

      await expectAsync(authService.handleRedirectResultAsync())
        .toBeResolvedTo();

      expect(angularFireAuth.getRedirectResult).toHaveBeenCalled();
      expect(authBackendApiService.beginSessionAsync)
        .toHaveBeenCalledWith(this.idToken);
    });

    it('should delegate to AngularFireAuth.signOut', async() => {
      angularFireAuth.signOut.and.resolveTo();

      await expectAsync(authService.signOutAsync()).toBeResolvedTo();

      expect(angularFireAuth.signOut).toHaveBeenCalled();
      expect(authBackendApiService.endSessionAsync).toHaveBeenCalled();
    });

    it('should reject with null if user is empty', async() => {
      this.creds.user = null;
      angularFireAuth.getRedirectResult.and.resolveTo(this.creds);

      await expectAsync(authService.handleRedirectResultAsync())
        .toBeRejectedWith(null);
    });
  });

  describe('Emulator mode', function() {
    beforeEach(async() => {
      spyOnProperty(AuthService, 'firebaseEmulatorIsEnabled', 'get')
        .and.returnValue(true);

      this.email = 'a@a.com';
      this.password = await md5(this.email);
      this.idToken = 'TKN';
      this.creds = {
        user: jasmine.createSpyObj({getIdToken: Promise.resolve(this.idToken)}),
        credential: null,
        additionalUserInfo: null,
      };

      authService = new AuthService(angularFireAuth, authBackendApiService);
    });

    it('should resolve immediately to emulate signInWithRedirectAsync',
      async() => {
        await expectAsync(authService.signInWithRedirectAsync())
          .toBeResolvedTo();
      });

    it('should use prompt to emulate handleRedirectResultAsync', async() => {
      spyOn(window, 'prompt').and.returnValue(this.email);
      angularFireAuth.signInWithEmailAndPassword.and.resolveTo(this.creds);

      await expectAsync(authService.handleRedirectResultAsync())
        .toBeResolvedTo();

      expect(angularFireAuth.signInWithEmailAndPassword)
        .toHaveBeenCalledWith(this.email, this.password);
      expect(authBackendApiService.beginSessionAsync)
        .toHaveBeenCalledWith(this.idToken);
    });

    it('should create new account when one does not exist', async() => {
      spyOn(window, 'prompt').and.returnValue(this.email);
      angularFireAuth.signInWithEmailAndPassword
        .and.rejectWith({code: 'auth/user-not-found'});
      angularFireAuth.createUserWithEmailAndPassword.and.resolveTo(this.creds);

      await expectAsync(authService.handleRedirectResultAsync())
        .toBeResolvedTo();

      expect(angularFireAuth.signInWithEmailAndPassword)
        .toHaveBeenCalledWith(this.email, this.password);
      expect(angularFireAuth.createUserWithEmailAndPassword)
        .toHaveBeenCalledWith(this.email, this.password);
      expect(authBackendApiService.beginSessionAsync)
        .toHaveBeenCalledWith(this.idToken);
    });

    it('should propogate signInWithEmailAndPassword errors', async() => {
      const unknownError = {code: 'auth/unknown-error'};
      spyOn(window, 'prompt').and.returnValue(this.email);
      angularFireAuth.signInWithEmailAndPassword.and.rejectWith(unknownError);

      await expectAsync(authService.handleRedirectResultAsync())
        .toBeRejectedWith(unknownError);
    });

    it('should propogate createUserWithEmailAndPassword errors', async() => {
      const unknownError = {code: 'auth/unknown-error'};
      spyOn(window, 'prompt').and.returnValue(this.email);
      angularFireAuth.signInWithEmailAndPassword
        .and.rejectWith({code: 'auth/user-not-found'});
      angularFireAuth.createUserWithEmailAndPassword
        .and.rejectWith(unknownError);

      await expectAsync(authService.handleRedirectResultAsync())
        .toBeRejectedWith(unknownError);
      expect(authBackendApiService.beginSessionAsync).not.toHaveBeenCalled();
    });

    it('should sign out and end session', async() => {
      await expectAsync(authService.signOutAsync()).toBeResolvedTo();
      expect(angularFireAuth.signOut).toHaveBeenCalled();
      expect(authBackendApiService.endSessionAsync).toHaveBeenCalled();
      expect(authBackendApiService.beginSessionAsync).not.toHaveBeenCalled();
    });
  });
});
