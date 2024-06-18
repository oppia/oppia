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

import {TestBed} from '@angular/core/testing';
import {AngularFireAuth} from '@angular/fire/auth';
import {md5} from 'hash-wasm';

import {AuthService} from 'services/auth.service';
import {AuthBackendApiService} from 'services/auth-backend-api.service';
import firebase from 'firebase';

describe('Auth service', function () {
  let authService: AuthService;
  let email: string;
  let password: string;
  let idToken: string;
  let creds: firebase.auth.UserCredential;
  let authBackendApiService: jasmine.SpyObj<AuthBackendApiService>;
  let angularFireAuth: jasmine.SpyObj<AngularFireAuth>;

  beforeEach(async () => {
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
      ],
    });

    authService = TestBed.inject(AuthService);

    email = 'a@a.com';
    password = await md5(email);
    idToken = 'TKN';
    creds = {
      user: jasmine.createSpyObj({getIdToken: Promise.resolve(idToken)}),
      credential: null,
      additionalUserInfo: null,
    };
  });

  it(
    'should return emulator config when using firebase endpoint in ' +
      'docker environment',
    () => {
      spyOnProperty(
        AuthService,
        'firebaseEmulatorIsEnabled',
        'get'
      ).and.returnValue(true);

      // TODO(#18260): Change this when we permanently move to the Docker Setup.
      process.env.USE_FIREBASE_ENDPOINT = 'true';
      expect(AuthService.firebaseEmulatorConfig).toEqual(['firebase', 9099]);
    }
  );

  it('should return undefined when emulator is disabled', () => {
    spyOnProperty(
      AuthService,
      'firebaseEmulatorIsEnabled',
      'get'
    ).and.returnValue(false);

    expect(AuthService.firebaseEmulatorConfig).toBeUndefined();
  });

  it('should resolve when sign out succeeds', async () => {
    angularFireAuth.signOut.and.resolveTo();

    await expectAsync(authService.signOutAsync()).toBeResolvedTo();
  });

  it('should reject when sign out fails', async () => {
    angularFireAuth.signOut.and.rejectWith(new Error('fail'));

    await expectAsync(authService.signOutAsync()).toBeRejectedWithError('fail');
  });

  it('should throw if signOutAsync is called without angular fire', async () => {
    await expectAsync(
      new AuthService(null, authBackendApiService).signOutAsync()
    ).toBeRejectedWithError('AngularFireAuth is not available');
  });

  it('should throw if signInWithRedirectAsync is called without angular fire', async () => {
    await expectAsync(
      new AuthService(null, authBackendApiService).signInWithRedirectAsync()
    ).toBeRejectedWithError('AngularFireAuth is not available');
  });

  it('should throw if handleRedirectResultAsync is called without angular fire', async () => {
    await expectAsync(
      new AuthService(null, authBackendApiService).handleRedirectResultAsync()
    ).toBeRejectedWithError('AngularFireAuth is not available');
  });

  it('should delegate to signInWithEmailAndPassword', async () => {
    angularFireAuth.signInWithEmailAndPassword.and.rejectWith({
      code: 'auth/user-not-found',
    });
    angularFireAuth.createUserWithEmailAndPassword.and.resolveTo(creds);

    await expectAsync(authService.signInWithEmail(email)).toBeResolvedTo();

    expect(angularFireAuth.signInWithEmailAndPassword).toHaveBeenCalledWith(
      email,
      password
    );
    expect(angularFireAuth.createUserWithEmailAndPassword).toHaveBeenCalledWith(
      email,
      password
    );
    expect(authBackendApiService.beginSessionAsync).toHaveBeenCalledWith(
      idToken
    );
  });

  it('should propogate signInWithEmailAndPassword errors', async () => {
    const unknownError = {code: 'auth/unknown-error'};
    spyOn(window, 'prompt').and.returnValue(email);
    angularFireAuth.signInWithEmailAndPassword.and.rejectWith(unknownError);

    await expectAsync(authService.signInWithEmail(email)).toBeRejectedWith(
      unknownError
    );
  });

  it('should propogate createUserWithEmailAndPassword errors', async () => {
    const unknownError = {code: 'auth/unknown-error'};
    spyOn(window, 'prompt').and.returnValue(email);
    angularFireAuth.signInWithEmailAndPassword.and.rejectWith({
      code: 'auth/user-not-found',
    });
    angularFireAuth.createUserWithEmailAndPassword.and.rejectWith(unknownError);

    await expectAsync(authService.signInWithEmail(email)).toBeRejectedWith(
      unknownError
    );
    expect(authBackendApiService.beginSessionAsync).not.toHaveBeenCalled();
  });

  describe('Production mode', () => {
    beforeEach(async () => {
      spyOnProperty(
        AuthService,
        'firebaseEmulatorIsEnabled',
        'get'
      ).and.returnValue(false);

      idToken = 'TKN';
      creds = {
        user: jasmine.createSpyObj({getIdToken: Promise.resolve(idToken)}),
        credential: null,
        additionalUserInfo: null,
      };

      authService = new AuthService(angularFireAuth, authBackendApiService);
    });

    it('should fail to call signInWithEmail', async () => {
      await expectAsync(
        authService.signInWithEmail(email)
      ).toBeRejectedWithError(
        'signInWithEmail can only be called in emulator mode'
      );

      expect(angularFireAuth.signInWithEmailAndPassword).not.toHaveBeenCalled();
      expect(
        angularFireAuth.createUserWithEmailAndPassword
      ).not.toHaveBeenCalled();
    });

    it('should delegate to AngularFireAuth.signInWithRedirect', async () => {
      angularFireAuth.signInWithRedirect.and.resolveTo();

      await expectAsync(authService.signInWithRedirectAsync()).toBeResolvedTo();

      expect(angularFireAuth.signInWithRedirect).toHaveBeenCalled();
    });

    it('should delegate to AngularFireAuth.getRedirectResult', async () => {
      angularFireAuth.getRedirectResult.and.resolveTo(creds);

      await expectAsync(authService.handleRedirectResultAsync()).toBeResolvedTo(
        true
      );

      expect(angularFireAuth.getRedirectResult).toHaveBeenCalled();
      expect(authBackendApiService.beginSessionAsync).toHaveBeenCalledWith(
        idToken
      );
    });

    it('should delegate to AngularFireAuth.signOut', async () => {
      angularFireAuth.signOut.and.resolveTo();

      await expectAsync(authService.signOutAsync()).toBeResolvedTo();

      expect(angularFireAuth.signOut).toHaveBeenCalled();
      expect(authBackendApiService.endSessionAsync).toHaveBeenCalled();
    });

    it('should resolve to false if user is missing', async () => {
      creds.user = null;
      angularFireAuth.getRedirectResult.and.resolveTo(creds);

      await expectAsync(authService.handleRedirectResultAsync()).toBeResolvedTo(
        false
      );
    });
  });

  describe('Emulator mode', () => {
    beforeEach(async () => {
      spyOnProperty(
        AuthService,
        'firebaseEmulatorIsEnabled',
        'get'
      ).and.returnValue(true);

      authService = new AuthService(angularFireAuth, authBackendApiService);
    });

    it('should not delegate to signInWithRedirectAsync', async () => {
      await expectAsync(authService.signInWithRedirectAsync()).toBeResolvedTo();

      expect(angularFireAuth.signInWithRedirect).not.toHaveBeenCalled();
    });

    it('should not delegate to handleRedirectResultAsync', async () => {
      await expectAsync(authService.handleRedirectResultAsync()).toBeResolvedTo(
        false
      );

      expect(angularFireAuth.getRedirectResult).not.toHaveBeenCalled();
    });

    it('should sign out and end session', async () => {
      await expectAsync(authService.signOutAsync()).toBeResolvedTo();
      expect(angularFireAuth.signOut).toHaveBeenCalled();
      expect(authBackendApiService.endSessionAsync).toHaveBeenCalled();
      expect(authBackendApiService.beginSessionAsync).not.toHaveBeenCalled();
    });

    it('should return firebase config', () => {
      expect(AuthService.firebaseConfig).toEqual({
        apiKey: 'fake-api-key',
        authDomain: '',
        projectId: 'dev-project-id',
        storageBucket: '',
        messagingSenderId: '',
        appId: '',
      });
    });
  });
});
