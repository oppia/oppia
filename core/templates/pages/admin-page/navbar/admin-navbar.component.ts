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
 * @fileoverview Component for the navigation bar in the admin panel.
 */

import {Component, OnInit} from '@angular/core';

import {AdminRouterService} from 'pages/admin-page/services/admin-router.service';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {UserService} from 'services/user.service';
import {AdminPageConstants} from 'pages/admin-page/admin-page.constants';
import {AppConstants} from 'app.constants';

@Component({
  selector: 'oppia-admin-navbar',
  templateUrl: './admin-navbar.component.html',
})
export class AdminNavbarComponent implements OnInit {
  // This property is initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  imagePath!: string;
  // Username is set to null if the user is not logged in.
  username: string | null = null;
  profilePicturePngDataUrl!: string;
  profilePictureWebpDataUrl!: string;
  isModerator: boolean = false;
  isSuperAdmin: boolean = false;
  profileUrl: string = '';
  ADMIN_TAB_URLS = AdminPageConstants.ADMIN_TAB_URLS;
  logoutUrl = '/' + AppConstants.PAGES_REGISTERED_WITH_FRONTEND.LOGOUT.ROUTE;
  profileDropdownIsActive = false;
  dropdownMenuIsActive = false;
  PAGES_REGISTERED_WITH_FRONTEND = AppConstants.PAGES_REGISTERED_WITH_FRONTEND;

  constructor(
    private adminRouterService: AdminRouterService,
    private urlInterpolationService: UrlInterpolationService,
    private userService: UserService
  ) {}

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }

  isActivitiesTabOpen(): boolean {
    return this.adminRouterService.isActivitiesTabOpen();
  }

  isPlatformParamsTabOpen(): boolean {
    return this.adminRouterService.isPlatformParamsTabOpen();
  }

  isRolesTabOpen(): boolean {
    return this.adminRouterService.isRolesTabOpen();
  }

  isMiscTabOpen(): boolean {
    return this.adminRouterService.isMiscTabOpen();
  }

  activateProfileDropdown(): boolean {
    return (this.profileDropdownIsActive = true);
  }

  deactivateProfileDropdown(): boolean {
    return (this.profileDropdownIsActive = false);
  }

  activateDropdownMenu(): boolean {
    return (this.dropdownMenuIsActive = true);
  }

  deactivateDropdownMenu(): boolean {
    return (this.dropdownMenuIsActive = false);
  }

  async getUserInfoAsync(): Promise<void> {
    const userInfo = await this.userService.getUserInfoAsync();
    this.username = userInfo.getUsername();

    if (this.username === null) {
      throw new Error('Cannot fetch username.');
    }
    this.isModerator = userInfo.isModerator();
    this.isSuperAdmin = userInfo.isSuperAdmin();

    this.profileUrl = this.urlInterpolationService.interpolateUrl(
      AdminPageConstants.PROFILE_URL_TEMPLATE,
      {
        username: this.username,
      }
    );
    [this.profilePicturePngDataUrl, this.profilePictureWebpDataUrl] =
      this.userService.getProfileImageDataUrl(this.username);
  }

  ngOnInit(): void {
    this.getUserInfoAsync();
  }
}
