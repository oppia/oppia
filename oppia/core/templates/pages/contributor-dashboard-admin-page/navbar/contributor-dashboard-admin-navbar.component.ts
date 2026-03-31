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
 * @fileoverview Component for the navigation bar in the
 * contributor dashboard admin panel.
 */

import {Component, OnInit} from '@angular/core';

import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {UserService} from 'services/user.service';
import {AppConstants} from 'app.constants';

@Component({
  selector: 'oppia-contributor-dashboard-admin-navbar',
  templateUrl: './contributor-dashboard-admin-navbar.component.html',
})
export class ContributorDashboardAdminNavbarComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  profilePicturePngDataUrl!: string;
  profilePictureWebpDataUrl!: string;
  profileUrl!: string;
  logoWebpImageSrc!: string;
  logoPngImageSrc!: string;
  // User name is null if the user is not logged in.
  username: string | null = null;
  logoutUrl: string =
    '/' + AppConstants.PAGES_REGISTERED_WITH_FRONTEND.LOGOUT.ROUTE;

  profileDropdownIsActive: boolean = false;
  PAGES_REGISTERED_WITH_FRONTEND = AppConstants.PAGES_REGISTERED_WITH_FRONTEND;

  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private userService: UserService
  ) {}

  activateProfileDropdown(): void {
    this.profileDropdownIsActive = true;
  }

  deactivateProfileDropdown(): void {
    this.profileDropdownIsActive = false;
  }

  async getUserInfoAsync(): Promise<void> {
    const userInfo = await this.userService.getUserInfoAsync();
    this.username = userInfo.getUsername();
    if (this.username === null) {
      throw new Error('User name is null.');
    } else {
      this.profileUrl = this.urlInterpolationService.interpolateUrl(
        '/profile/<username>',
        {
          username: this.username,
        }
      );
      [this.profilePicturePngDataUrl, this.profilePictureWebpDataUrl] =
        this.userService.getProfileImageDataUrl(this.username);
    }
  }

  ngOnInit(): void {
    this.getUserInfoAsync();

    this.logoPngImageSrc = this.urlInterpolationService.getStaticImageUrl(
      '/logo/288x128_logo_white.png'
    );
    this.logoWebpImageSrc = this.urlInterpolationService.getStaticImageUrl(
      '/logo/288x128_logo_white.webp'
    );
  }
}
