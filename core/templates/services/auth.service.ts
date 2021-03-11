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
 * @fileoverview Service for managing the authorizations of logged-in users.
 */

import { Injectable, Optional } from '@angular/core';
import { FirebaseOptions } from '@angular/fire';
import { AngularFireAuth } from '@angular/fire/auth';
import { downgradeInjectable } from '@angular/upgrade/static';
import firebase from 'firebase/app';
import { md5 } from 'hash-wasm';

import { AppConstants } from 'app.constants';
import { AuthBackendApiService } from 'services/auth-backend-api.service';

abstract class AuthServiceImpl {
  abstract getRedirectResultAsync(): Promise<string>;
  abstract signInWithRedirectAsync(): Promise<void>;
  abstract signOutAsync(): Promise<void>;
}

class NullAuthServiceImpl extends AuthServiceImpl {
  private error = new Error('AngularFireAuth is not available');

  async signInWithRedirectAsync(): Promise<void> {
    throw this.error;
  }

  async getRedirectResultAsync(): Promise<string> {
    throw this.error;
  }

  async signOutAsync(): Promise<void> {
    throw this.error;
  }
}

class DevAuthServiceImpl extends AuthServiceImpl {
  constructor(private angularFireAuth: AngularFireAuth) {
    super();
  }

  async signInWithRedirectAsync(): Promise<void> {
  }

  async getRedirectResultAsync(): Promise<string> {
    const email = prompt('Please enter the email address to sign-in with');
    const password = await md5(email);
    let creds: firebase.auth.UserCredential;
    try {
      creds = await this.angularFireAuth.signInWithEmailAndPassword(
        email, password);
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        creds = await this.angularFireAuth.createUserWithEmailAndPassword(
          email, password);
      } else {
        throw err;
      }
    }
    return creds.user.getIdToken();
  }

  async signOutAsync(): Promise<void> {
    return this.angularFireAuth.signOut();
  }
}

class ProdAuthServiceImpl extends AuthServiceImpl {
  private provider: firebase.auth.GoogleAuthProvider;

  constructor(private angularFireAuth: AngularFireAuth) {
    super();
    this.provider = new firebase.auth.GoogleAuthProvider();
    // Oppia only needs an email address for account management.
    this.provider.addScope('email');
    // Always prompt the user to select an account, even when they only own one.
    this.provider.setCustomParameters({prompt: 'select_account'});
  }

  /** Returns a promise that never resolves or rejects. */
  async signInWithRedirectAsync(): Promise<void> {
    return this.angularFireAuth.signInWithRedirect(this.provider);
  }

  async getRedirectResultAsync(): Promise<string> {
    const creds = await this.angularFireAuth.getRedirectResult();
    return creds.user.getIdToken();
  }

  async signOutAsync(): Promise<void> {
    return this.angularFireAuth.signOut();
  }
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authServiceImpl: AuthServiceImpl;

  constructor(
      @Optional() private angularFireAuth: AngularFireAuth,
      private authBackendApiService: AuthBackendApiService) {
    if (!this.angularFireAuth) {
      this.authServiceImpl = new NullAuthServiceImpl();
    } else if (AuthService.firebaseEmulatorIsEnabled) {
      this.authServiceImpl = new DevAuthServiceImpl(this.angularFireAuth);
    } else {
      this.authServiceImpl = new ProdAuthServiceImpl(this.angularFireAuth);
    }
  }

  static get firebaseAuthIsEnabled(): boolean {
    return AppConstants.FIREBASE_AUTH_ENABLED;
  }

  static get firebaseEmulatorIsEnabled(): boolean {
    return (
      AuthService.firebaseAuthIsEnabled &&
      AppConstants.FIREBASE_EMULATOR_ENABLED);
  }

  static get firebaseConfig(): FirebaseOptions {
    return !AuthService.firebaseAuthIsEnabled ? undefined : {
      apiKey: AppConstants.FIREBASE_CONFIG_API_KEY,
      authDomain: AppConstants.FIREBASE_CONFIG_AUTH_DOMAIN,
      projectId: AppConstants.FIREBASE_CONFIG_PROJECT_ID,
      storageBucket: AppConstants.FIREBASE_CONFIG_STORAGE_BUCKET,
      messagingSenderId: AppConstants.FIREBASE_CONFIG_MESSAGING_SENDER_ID,
      appId: AppConstants.FIREBASE_CONFIG_APP_ID,
    } as const;
  }

  static get firebaseEmulatorConfig(): readonly [string, number] {
    return AuthService.firebaseEmulatorIsEnabled ?
      ['localhost', 9099] : undefined;
  }

  async handleRedirectResultAsync(): Promise<void> {
    const idToken = await this.authServiceImpl.getRedirectResultAsync();
    return this.authBackendApiService.beginSessionAsync(idToken);
  }

  async signInWithRedirectAsync(): Promise<void> {
    return this.authServiceImpl.signInWithRedirectAsync();
  }

  async signOutAsync(): Promise<void> {
    await Promise.all([
      this.authServiceImpl.signOutAsync(),
      this.authBackendApiService.endSessionAsync(),
    ]);
  }
}

angular.module('oppia').factory(
  'AuthService', downgradeInjectable(AuthService));
