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

import { Injectable } from '@angular/core';
import { FirebaseOptions } from '@angular/fire';
import { AngularFireAuth } from '@angular/fire/auth';
import { downgradeInjectable } from '@angular/upgrade/static';
import { firebase, firebaseui } from 'firebaseui-angular';
import { Observable } from 'rxjs';

import { AppConstants } from 'app.constants';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private angularFireAuth: AngularFireAuth) {}

  get idToken$(): Observable<string | null> {
    return this.angularFireAuth.idToken;
  }

  async signOutAsync(): Promise<void> {
    return this.angularFireAuth.signOut();
  }

  static get firebaseEmulatorIsEnabled(): boolean {
    return AppConstants.FIREBASE_EMULATOR_ENABLED;
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

  static get firebaseEmulatorConfig(): readonly [string, number] {
    return AuthService.firebaseEmulatorIsEnabled ?
      ['localhost', 9099] : undefined;
  }

  static get firebaseUiAuthConfig(): firebaseui.auth.Config {
    return {
      signInFlow: 'redirect',
      signInSuccessUrl: '/signup',
      queryParameterForSignInSuccessUrl: 'return_url',
      tosUrl: '/terms',
      privacyPolicyUrl: '/privacy-policy',
      signInOptions: AuthService.firebaseEmulatorIsEnabled ?
        [ // EMULATOR SIGN IN OPTIONS: Email links offer the most developer-
          // friendly interface (links are printed directly to the terminal).
          {
            provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
            requireDisplayName: false,
            signInMethod: (
              firebase.auth.EmailAuthProvider.EMAIL_LINK_SIGN_IN_METHOD),
          },
        ] : [
          // PRODUCTION SIGN IN OPTIONS: Require an authentic Google Account.
          {
            provider: firebase.auth.GoogleAuthProvider.PROVIDER_ID,
            clientId: AppConstants.FIREBASE_CONFIG_GOOGLE_CLIENT_ID,
            // We only need the user's email address.
            scopes: ['https://www.googleapis.com/auth/userinfo.email'],
            // Force account selection even when just one account is available.
            customParameters: {prompt: 'select_account'},
          },
        ],
    };
  }
}

angular.module('oppia').factory(
  'AuthService', downgradeInjectable(AuthService));
