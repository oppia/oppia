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
 * @fileoverview Component for the logout page.
 */

import {Component, OnInit} from '@angular/core';
import firebase from 'firebase/app';

import {AlertsService} from 'services/alerts.service';
import {AuthService} from 'services/auth.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {LoaderService} from 'services/loader.service';
import {UtilsService} from 'services/utils.service';

@Component({
  selector: 'logout-page',
  template: '',
})
export class LogoutPageComponent implements OnInit {
  constructor(
    private alertsService: AlertsService,
    private authService: AuthService,
    private loaderService: LoaderService,
    private windowRef: WindowRef,
    private utilsService: UtilsService
  ) {}

  ngOnInit(): void {
    this.loaderService.showLoadingScreen('I18N_LOGOUT_LOADING');
    this.authService.signOutAsync().then(
      () => this.redirect(),
      error => this.onSignOutError(error)
    );
  }

  private redirect(): void {
    const searchParams = new URLSearchParams(
      this.windowRef.nativeWindow.location.search
    );
    const redirectUrl = searchParams.get('redirect_url') ?? '/';
    this.windowRef.nativeWindow.location.assign(
      this.utilsService.getSafeReturnUrl(redirectUrl)
    );
  }

  private onSignOutError(error: firebase.auth.Error): void {
    this.loaderService.hideLoadingScreen();
    this.alertsService.addWarning(error.message);
    setTimeout(() => this.redirect(), 3000);
  }
}
