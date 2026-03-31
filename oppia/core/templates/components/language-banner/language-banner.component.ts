// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for language banner.
 */

import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {Component, OnInit} from '@angular/core';
import {UserService} from 'services/user.service';
import {LanguageBannerService} from './language-banner.service';
import {Router} from '@angular/router';

@Component({
  selector: 'language-banner',
  templateUrl: './language-banner.component.html',
})
export class LanguageBannerComponent implements OnInit {
  bannerIsVisible: boolean = false;

  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private userService: UserService,
    private languageBannerService: LanguageBannerService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.bannerIsVisible = false;

    this.userService.getUserInfoAsync().then(userInfo => {
      if (userInfo.isLoggedIn()) {
        return;
      }

      if (this.router.url.startsWith('/login')) {
        return;
      }

      if (this.router.url.startsWith('/signup')) {
        return;
      }

      if (!this.languageBannerService.hasAcceptedCookies()) {
        return;
      }

      if (
        this.languageBannerService.getNumRemainingTimesToShowLanguageBanner() >
        0
      ) {
        // We are only planning to show the "can change language" banner to users whose browser language is not English.
        if (navigator.language.slice(0, 2) !== 'en') {
          this.bannerIsVisible = true;

          // Every time the banner is loaded, this number is decreased by 1 (starting at 4).
          // This makes sure the banner is shown a maximum of 5 times for the user and
          // then disappears forever.
          let remainingTimesToShowLanguageBanner =
            this.languageBannerService.getNumRemainingTimesToShowLanguageBanner();

          this.languageBannerService.setNumTimesRemainingToShowLanguageBanner(
            remainingTimesToShowLanguageBanner - 1
          );
        }
      }
    });
  }

  onButtonClick(): void {
    this.languageBannerService.markLanguageBannerAsDismissed();
    this.bannerIsVisible = false;
  }

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }
}
