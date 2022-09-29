// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the navigation bar in the classroom admin
 * panel.
 */

import { Component, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

import { AppConstants } from 'app.constants';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { UserService } from 'services/user.service';


@Component({
  selector: 'oppia-classroom-admin-navbar',
  templateUrl: './classroom-admin-navbar.component.html',
})
export class ClassroomAdminNavbarComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  profilePictureDataUrl!: string;
  profileUrl!: string;
  username!: string | null;
  logoWebpImageSrc!: string;
  logoPngImageSrc!: string;
  PAGES_REGISTERED_WITH_FRONTEND = (
    AppConstants.PAGES_REGISTERED_WITH_FRONTEND);

  profileDropdownIsActive: boolean = false;

  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private userService: UserService,
  ) {}

  activateProfileDropdown(): boolean {
    return this.profileDropdownIsActive = true;
  }

  deactivateProfileDropdown(): boolean {
    return this.profileDropdownIsActive = false;
  }

  async getProfileImageDataAsync(): Promise<void> {
    let dataUrl = await this.userService.getProfileImageDataUrlAsync();
    this.profilePictureDataUrl = decodeURIComponent(dataUrl);
  }

  async getUserInfoAsync(): Promise<void> {
    const userInfo = await this.userService.getUserInfoAsync();
    this.username = userInfo.getUsername();

    if (this.username === null) {
      throw new Error('Cannot fetch username.');
    }
    this.profileUrl = (
      this.urlInterpolationService.interpolateUrl(
        '/profile/<username>', {
          username: this.username
        }));
  }

  ngOnInit(): void {
    this.getProfileImageDataAsync();
    this.getUserInfoAsync();

    this.logoPngImageSrc = this.urlInterpolationService.getStaticImageUrl(
      '/logo/288x128_logo_white.png');
    this.logoWebpImageSrc = this.urlInterpolationService.getStaticImageUrl(
      '/logo/288x128_logo_white.webp');
  }
}

angular.module('oppia').directive(
  'oppiaClassroomAdminNavbar', downgradeComponent(
    {component: ClassroomAdminNavbarComponent}));
