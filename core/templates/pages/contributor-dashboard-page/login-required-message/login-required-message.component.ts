// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for login required message.
 */

import { SiteAnalyticsService } from 'services/site-analytics.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { UserService } from 'services/user.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { Component } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

@Component({
  selector: 'login-required-message',
  templateUrl: './login-required-message.component.html',
  styleUrls: []
})
export class LoginRequiredMessageComponent {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  OPPIA_AVATAR_IMAGE_URL!: string;

  constructor(
    private readonly siteAnalyticsService: SiteAnalyticsService,
    private readonly urlInterpolationService: UrlInterpolationService,
    private readonly userService: UserService,
    private readonly windowRef: WindowRef) {}

  ngOnInit(): void {
    this.OPPIA_AVATAR_IMAGE_URL = (
      this.urlInterpolationService.getStaticImageUrl(
        '/avatar/oppia_avatar_100px.svg'));
  }

  onLoginButtonClicked(): void {
    this.userService.getLoginUrlAsync().then(
      (loginUrl) => {
        if (loginUrl) {
          this.siteAnalyticsService.registerStartLoginEvent('loginButton');
          setTimeout(() => {
            this.windowRef.nativeWindow.location.href = loginUrl;
          }, 150);
        } else {
          this.windowRef.nativeWindow.location.reload();
        }
      }
    );
  }
}

angular.module('oppia').directive(
  'loginRequiredMessage', downgradeComponent(
    {component: LoginRequiredMessageComponent}));
