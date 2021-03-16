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
import { AppConstants } from 'app.constants';

import firebase from 'firebase/app';
import { md5 } from 'hash-wasm';
import { AuthBackendApiService } from 'services/auth-backend-api.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(
      @Optional() private angularFireAuth: AngularFireAuth,
      private authBackendApiService: AuthBackendApiService) {}

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

  /**
   * Prompts the user to sign-in with a trusted identity provider, then fulfills
   * with true if the user is new, otherwise fulfills with false.
   * Rejects when sign-in failed.
   */
  async signInAsync(): Promise<boolean> {
    if (!this.angularFireAuth) {
      throw new Error('AngularFireAuth is not available');
    }

    const creds = AuthService.firebaseEmulatorIsEnabled ?
      await this.emulatorSignInAsync() : await this.productionSignInAsync();

    const idToken = await creds.user.getIdToken();
    await this.authBackendApiService.beginSessionAsync(idToken);

    return creds.additionalUserInfo.isNewUser;
  }

  async signOutAsync(): Promise<void> {
    if (!this.angularFireAuth) {
      throw new Error('AngularFireAuth is not available');
    }

    await this.angularFireAuth.signOut();
  }

  /** Assumes that angularFireAuth is not null. */
  private async emulatorSignInAsync(): Promise<firebase.auth.UserCredential> {
    const email = prompt('Please enter the email address to sign-in with');
    const password = await md5(email);
    try {
      return await this.angularFireAuth.signInWithEmailAndPassword(
        email, password);
    } catch (err) {
      if (err.code !== 'auth/user-not-found') {
        throw err;
      }
    }
    return await this.angularFireAuth.createUserWithEmailAndPassword(
      email, password);
  }

  /** Assumes that angularFireAuth is not null. */
  private async productionSignInAsync(): Promise<firebase.auth.UserCredential> {
    const provider = new firebase.auth.GoogleAuthProvider();
    // Oppia only needs an email address for account management.
    provider.addScope('email');
    // Always prompt the user to select an account, even when they only own one.
    provider.setCustomParameters({prompt: 'select_account'});
    await this.angularFireAuth.signInWithRedirect(provider);
    return await this.angularFireAuth.getRedirectResult();
  }
}

angular.module('oppia').factory(
  'AuthService', downgradeInjectable(AuthService));
