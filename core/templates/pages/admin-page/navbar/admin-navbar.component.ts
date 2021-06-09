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

import { Component, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

import { AdminRouterService } from 'pages/admin-page/services/admin-router.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { UserService } from 'services/user.service';
import { AdminPageConstants } from 'pages/admin-page/admin-page.constants';
import { AppConstants } from 'app.constants';

@Component({
  selector: 'oppia-admin-navbar',
  templateUrl: './admin-navbar.component.html',
})
export class AdminNavbarComponent implements OnInit {
  profilePictureDataUrl: string = '';
  imagePath: string;
  username: string = '';
  isModerator: boolean = null;
  isSuperAdmin: boolean = null;
  profileUrl: string = '';
  ADMIN_TAB_URLS = AdminPageConstants.ADMIN_TAB_URLS;
  logoutUrl = AppConstants.LOGOUT_URL;
  profileDropdownIsActive = false;
  dropdownMenuIsActive = false;

  constructor(
    private adminRouterService: AdminRouterService,
    private urlInterpolationService: UrlInterpolationService,
    private userService: UserService,
  ) {}

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }

  isActivitiesTabOpen(): boolean {
    return this.adminRouterService.isActivitiesTabOpen();
  }

  isConfigTabOpen(): boolean {
    return this.adminRouterService.isConfigTabOpen();
  }

  isFeaturesTabOpen(): boolean {
    return this.adminRouterService.isFeaturesTabOpen();
  }

  isRolesTabOpen(): boolean {
    return this.adminRouterService.isRolesTabOpen();
  }

  isMiscTabOpen(): boolean {
    return this.adminRouterService.isMiscTabOpen();
  }

  activateProfileDropdown(): boolean {
    return this.profileDropdownIsActive = true;
  }

  deactivateProfileDropdown(): boolean {
    return this.profileDropdownIsActive = false;
  }

  activateDropdownMenu(): boolean {
    return this.dropdownMenuIsActive = true;
  }

  deactivateDropdownMenu(): boolean {
    return this.dropdownMenuIsActive = false;
  }

  async getProfileImageDataAsync(): Promise<void> {
    let dataUrl = await this.userService.getProfileImageDataUrlAsync();
    this.profilePictureDataUrl = decodeURIComponent(dataUrl);
  }

  async getUserInfoAsync(): Promise<void> {
    const userInfo = await this.userService.getUserInfoAsync();

    this.username = userInfo.getUsername();
    this.isModerator = userInfo.isModerator();
    this.isSuperAdmin = userInfo.isSuperAdmin();

    this.profileUrl = (
      this.urlInterpolationService.interpolateUrl(
        AdminPageConstants.PROFILE_URL_TEMPLATE, {
          username: this.username
        })
    );
  }

  ngOnInit(): void {
    this.getProfileImageDataAsync();
    this.getUserInfoAsync();
  }
}

angular.module('oppia').directive(
  'oppiaAdminNavbar', downgradeComponent(
    {component: AdminNavbarComponent}));
