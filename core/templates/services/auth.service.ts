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
import 'firebase/auth';
import { md5 } from 'hash-wasm';

import { AppConstants } from 'app.constants';
import { AuthBackendApiService } from 'services/auth-backend-api.service';

abstract class AuthServiceImpl {
  abstract getRedirectResultAsync(): Promise<
    firebase.auth.UserCredential | null
  >;
  abstract signInWithRedirectAsync(): Promise<void>;
  abstract signOutAsync(): Promise<void>;
}

class NullAuthServiceImpl extends AuthServiceImpl {
  private error = new Error('AngularFireAuth is not available');

  async signInWithRedirectAsync(): Promise<void> {
    throw this.error;
  }

  async getRedirectResultAsync(): Promise<firebase.auth.UserCredential> {
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

  async getRedirectResultAsync(): Promise<firebase.auth.UserCredential | null> {
    return null;
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

  async getRedirectResultAsync(): Promise<firebase.auth.UserCredential> {
    return this.angularFireAuth.getRedirectResult();
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
  creds!: firebase.auth.UserCredential;

  constructor(
      @Optional() private angularFireAuth: AngularFireAuth | null,
      private authBackendApiService: AuthBackendApiService) {
    if (!this.angularFireAuth) {
      this.authServiceImpl = new NullAuthServiceImpl();
    } else if (AuthService.firebaseEmulatorIsEnabled) {
      this.authServiceImpl = new DevAuthServiceImpl(this.angularFireAuth);
    } else {
      this.authServiceImpl = new ProdAuthServiceImpl(this.angularFireAuth);
    }
  }

  static get firebaseEmulatorIsEnabled(): boolean {
    return AppConstants.EMULATOR_MODE;
  }

  static get firebaseConfig(): FirebaseOptions {
    return {
      apiKey: AppConstants.FIREBASE_CONFIG_API_KEY,
      authDomain: AppConstants.FIREBASE_CONFIG_AUTH_DOMAIN,
      projectId: AppConstants.FIREBASE_CONFIG_PROJECT_ID,
      storageBucket: AppConstants.FIREBASE_CONFIG_STORAGE_BUCKET,
      messagingSenderId: AppConstants.FIREBASE_CONFIG_MESSAGING_SENDER_ID,
      appId: AppConstants.FIREBASE_CONFIG_APP_ID,
    } as const;
  }

  static get firebaseEmulatorConfig(): readonly [string, number] | undefined {
    let firebaseHost = (
      process.env.OPPIA_IS_DOCKERIZED ? '0.0.0.0' : 'localhost');
    // TODO(#18260): Change this when we permanently move to the Docker Setup.
    return AuthService.firebaseEmulatorIsEnabled ?
      [firebaseHost, 9099] : undefined;
  }

  async handleRedirectResultAsync(): Promise<boolean> {
    const creds = await this.authServiceImpl.getRedirectResultAsync();
    if (creds?.user) {
      const idToken = await creds.user.getIdToken();
      await this.authBackendApiService.beginSessionAsync(idToken);
      return true;
    } else {
      return false;
    }
  }

  async signInWithEmail(email: string): Promise<void> {
    if (!AuthService.firebaseEmulatorIsEnabled) {
      throw new Error('signInWithEmail can only be called in emulator mode');
    }
    // The Firebase Admin SDK, used by our end-to-end tests, stores all emails
    // in lower case. To ensure that the developer email used to sign in is
    // consistent with these accounts, we manually change them to lower case.
    email = email.toLowerCase();
    // We've configured the Firebase emulator to use email/password for user
    // authentication. To save developers and end-to-end test authors the
    // trouble of providing passwords, we always use the md5 hash of the email
    // address instead. This will never be done in production, where the
    // emulator DOES NOT run. Instead, production takes the user to the Google
    // sign-in page, which eventually redirects them back to Oppia.
    const password = await md5(email);
    try {
      if (this.angularFireAuth !== null) {
        this.creds = await this.angularFireAuth.signInWithEmailAndPassword(
          email, password);
      }
    // We use unknown type because we are unsure of the type of error
    // that was thrown. Since the catch block cannot identify the
    // specific type of error, we are unable to further optimise the
    // code by introducing more types of errors.
    } catch (err: unknown) {
      if ((err as firebase.auth.Error).code === 'auth/user-not-found') {
        if (this.angularFireAuth !== null) {
          this.creds =
           await this.angularFireAuth.createUserWithEmailAndPassword(
             email, password);
        }
      } else {
        throw err;
      }
    }
    if (this.creds?.user !== null) {
      const idToken = await this.creds.user.getIdToken();
      await this.authBackendApiService.beginSessionAsync(idToken);
    }
  }

  async signInWithRedirectAsync(): Promise<void> {
    return this.authServiceImpl.signInWithRedirectAsync();
  }

  async signOutAsync(): Promise<void> {
    await this.authServiceImpl.signOutAsync();
    await this.authBackendApiService.endSessionAsync();
  }
}

angular.module('oppia').factory(
  'AuthService', downgradeInjectable(AuthService));
