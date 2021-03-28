// Copyright 2016 The Oppia Authors. All Rights Reserved.
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

import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { downgradeComponent } from '@angular/upgrade/static';
import { AppConstants } from 'app.constants';
import { AlertsService } from 'services/alerts.service';
import { LoaderService } from 'services/loader.service';
import firebase from 'firebase/app';

import { AuthService } from 'services/auth.service';
import { WindowRef } from 'services/contextual/window-ref.service.ts';

@Component({
  selector: 'login-page',
  templateUrl: './login-page.component.html'
})
export class LoginPageComponent implements OnInit {
  email: FormControl = null;

  constructor(
      private alertsService: AlertsService, private authService: AuthService,
      private loaderService: LoaderService, private windowRef: WindowRef) {}

  static get isEnabled(): boolean {
    return AppConstants.ENABLE_LOGIN_PAGE;
  }

  ngOnInit(): void {
    if (!LoginPageComponent.isEnabled) {
      this.redirectToHomePage();
      return;
    }
    if (AuthService.firebaseEmulatorIsEnabled) {
      this.email = new FormControl('', [Validators.email]);
      this.email.setValue('');
    } else {
      this.loaderService.showLoadingScreen('Signing in');
      this.authService.handleRedirectResultAsync().then(
        redirectSucceeded => redirectSucceeded ?
          this.redirectToSignUp() : this.authService.signInWithRedirectAsync(),
        error => this.onSignInError(error));
    }
  }

  onClickSignInButton(): void {
    this.loaderService.showLoadingScreen('Signing in');
    this.authService.signInWithEmail(this.email.value).then(
      () => this.redirectToSignUp(), error => this.onSignInError(error));
  }

  private onSignInError(error: firebase.auth.Error): void {
    if (error.code === 'auth/user-disabled') {
      this.redirectToPendingAccountDeletionPage();
    } else {
      this.loaderService.hideLoadingScreen();
      this.alertsService.addWarning(error.message);
      this.email.setValue('');
    }
  }

  private redirectToSignUp(): void {
    const searchParams = (
      new URLSearchParams(this.windowRef.nativeWindow.location.search));
    const returnUrl = searchParams.get('return_url') ?? '/';
    this.windowRef.nativeWindow.location.assign(
      `/signup?return_url=${returnUrl}`);
  }

  private redirectToHomePage(): void {
    this.windowRef.nativeWindow.location.assign('/');
  }

  private redirectToPendingAccountDeletionPage(): void {
    this.windowRef.nativeWindow.location.assign('/pending-account-deletion');
  }
}

angular.module('oppia').directive(
  'loginPage', downgradeComponent({component: LoginPageComponent}));
