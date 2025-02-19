// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the login page.
 */

import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import firebase from 'firebase/app';

import {AppConstants} from 'app.constants';
import {AlertsService} from 'services/alerts.service';
import {AuthService} from 'services/auth.service';
import {LoaderService} from 'services/loader.service';
import {UserService} from 'services/user.service';
import {WindowRef} from 'services/contextual/window-ref.service';

@Component({
  selector: 'login-page',
  templateUrl: './login-page.component.html',
})
export class LoginPageComponent implements OnInit {
  email = new FormControl('', [Validators.email]);
  formGroup = new FormGroup({email: this.email});

  constructor(
    private alertsService: AlertsService,
    private authService: AuthService,
    private loaderService: LoaderService,
    private userService: UserService,
    private windowRef: WindowRef
  ) {}

  get emulatorModeIsEnabled(): boolean {
    return AppConstants.EMULATOR_MODE;
  }

  ngOnInit(): void {
    this.loaderService.showLoadingScreen('I18N_SIGNIN_LOADING');

    this.userService.getUserInfoAsync().then(
      async userInfo => {
        if (userInfo.isLoggedIn()) {
          this.redirectToPath('/');
          return;
        }

        if (this.emulatorModeIsEnabled) {
          this.loaderService.hideLoadingScreen();
          return;
        }

        let authSucceeded = false;
        try {
          authSucceeded = await this.authService.handleRedirectResultAsync();
          // We use unknown type because we are unsure of the type of error
          // that was thrown. Since the catch block cannot identify the
          // specific type of error, we are unable to further optimise the
          // code by introducing more types of errors.
        } catch (error: unknown) {
          this.onSignInError(error as firebase.auth.Error);
          return;
        }

        if (authSucceeded) {
          this.redirectToSignUp();
          return;
        }

        try {
          await this.authService.signInWithRedirectAsync();
          // We use unknown type because we are unsure of the type of error
          // that was thrown. Since the catch block cannot identify the
          // specific type of error, we are unable to further optimise the
          // code by introducing more types of errors.
        } catch (error: unknown) {
          this.onSignInError(error as firebase.auth.Error);
        }
      },
      error => {
        this.onSignInError(error);
      }
    );
  }

  async onClickSignInButtonAsync(email: string): Promise<void> {
    this.loaderService.showLoadingScreen('I18N_SIGNIN_LOADING');

    try {
      await this.authService.signInWithEmail(email);
      // We use unknown type because we are unsure of the type of error
      // that was thrown. Since the catch block cannot identify the
      // specific type of error, we are unable to further optimise the
      // code by introducing more types of errors.
    } catch (error: unknown) {
      this.onSignInError(error as firebase.auth.Error);
      return;
    }

    this.redirectToSignUp();
  }

  private onSignInError(error: firebase.auth.Error): void {
    if (error.code === 'auth/user-disabled') {
      this.redirectToPath('/pending-account-deletion');
      return;
    }

    this.alertsService.addWarning(error.message);

    if (this.emulatorModeIsEnabled) {
      this.email.setValue('');
      this.loaderService.hideLoadingScreen();
    } else {
      setTimeout(() => this.redirectToPath('/'), 2000);
    }
  }

  private redirectToSignUp(): void {
    const queryParams = this.windowRef.nativeWindow.location.search;
    const returnUrl = new URLSearchParams(queryParams).get('return_url') ?? '/';
    this.redirectToPath(`/signup?return_url=${returnUrl}`);
  }

  private redirectToPath(destination: string): void {
    this.windowRef.nativeWindow.location.assign(destination);
  }
}
