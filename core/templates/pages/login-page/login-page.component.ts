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

import { AuthService } from 'services/auth.service';
import { WindowRef } from 'services/contextual/window-ref.service.ts';

@Component({
  selector: 'login-page',
  template: ''
})
export class LoginPageComponent implements OnInit {
  constructor(private authService: AuthService, private windowRef: WindowRef) {}

  ngOnInit(): void {
    this.authService.handleRedirectResultAsync()
      .then(() => this.redirectToSignUp(), () => this.redirectToHomePage());
    setTimeout(() => this.authService.signInWithRedirectAsync(), 150);
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
}

angular.module('oppia').directive(
  'loginPage', downgradeComponent({component: LoginPageComponent}));
