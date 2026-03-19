// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the signin page root.
 */

import {Component, OnInit} from '@angular/core';
import {downgradeComponent} from '@angular/upgrade/static';
import {PageHeadService} from '../../services/page-head.service';
import {WindowRef} from '../../services/contextual/window-ref.service';
import {SigninAnalyticsService} from '../../services/signin-analytics.service';

@Component({
  selector: 'oppia-signin-page-root',
  templateUrl: './signin-page-root.component.html',
  styleUrls: ['./signin-page-root.component.css'],
})
export class SigninPageRootComponent implements OnInit {
  constructor(
    private pageHeadService: PageHeadService,
    private windowRef: WindowRef,
    private signinAnalyticsService: SigninAnalyticsService
  ) {}

  ngOnInit(): void {
    this.pageHeadService.updateTitleAndMetaTags(
      'Sign In - Oppia',
      'Sign in to your Oppia account.'
    );
    this.signinAnalyticsService.logSigninPageLoadedEvent();
  }
}

angular.module('oppia').directive(
  'oppiaSigninPageRoot',
  downgradeComponent({
    component: SigninPageRootComponent,
  }) as angular.IDirectiveFactory
);
