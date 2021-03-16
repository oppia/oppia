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
import { downgradeComponent } from '@angular/upgrade/static';
import { AppConstants } from 'app.constants';
import { AlertsService } from 'services/alerts.service';

import { AuthService } from 'services/auth.service';
import { WindowRef } from 'services/contextual/window-ref.service.ts';

@Component({
  selector: 'login-page',
  template: ''
})
export class LoginPageComponent implements OnInit {
  constructor(
      private alertsService: AlertsService, private authService: AuthService,
      private windowRef: WindowRef) {}

  static get isEnabled(): boolean {
    return AppConstants.ENABLE_LOGIN_PAGE;
  }

  ngOnInit(): void {
    if (!LoginPageComponent.isEnabled) {
      alert('Sign-in is temporarily disabled. Please try again later.');
      this.redirectToHomePage();
      return;
    }
    this.authService.handleRedirectResultAsync().then(
      () => this.redirectToSignUp(),
      rejectionReason => {
        if (rejectionReason === null) {
          // Null rejections are used to signal that a user is not logged in.
          this.authService.signInWithRedirectAsync();
        } else if (rejectionReason.code === 'auth/user-disabled') {
          // Disabled Firebase accounts are reserved for users that are pending
          // account deletion.
          this.redirectToPendingAccountDeletionPage();
        } else {
          this.alertsService.addWarning(rejectionReason.message);
          setTimeout(() => this.redirectToHomePage(), 2000);
        }
      });
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
