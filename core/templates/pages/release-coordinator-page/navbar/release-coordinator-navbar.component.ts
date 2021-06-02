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
 * @fileoverview Component for the navigation bar in the release-coordinator
 * panel.
 */

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { UserService } from 'services/user.service';
import { ReleaseCoordinatorPageConstants } from 'pages/release-coordinator-page/release-coordinator-page.constants';
import { AppConstants } from 'app.constants';

@Component({
  selector: 'oppia-release-coordinator-navbar',
  templateUrl: './release-coordinator-navbar.component.html',
})
export class ReleaseCoordinatorNavbarComponent implements OnInit {
  @Input() activeTab;
  @Output() activeTabChange = new EventEmitter();

  TAB_ID_JOBS: string = ReleaseCoordinatorPageConstants.TAB_ID_JOBS;
  TAB_ID_MISC: string = ReleaseCoordinatorPageConstants.TAB_ID_MISC;
  profilePictureDataUrl: string;
  username: string;
  profileUrl: string;
  logoutUrl: string = AppConstants.LOGOUT_URL;
  profileDropdownIsActive: boolean = false;
  logoWebpImageSrc: string;
  logoPngImageSrc: string;

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

  switchTab(tabName: string): void {
    if (tabName !== this.activeTab) {
      this.activeTabChange.emit(tabName);
      this.activeTab = tabName;
    }
  }

  async getProfileImageDataAsync(): Promise<void> {
    let dataUrl = await this.userService.getProfileImageDataUrlAsync();
    this.profilePictureDataUrl = decodeURIComponent(dataUrl);
  }

  async getUserInfoAsync(): Promise<void> {
    const userInfo = await this.userService.getUserInfoAsync();

    this.username = userInfo.getUsername();
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

    this.activeTab = this.TAB_ID_JOBS;
  }
}

angular.module('oppia').directive(
  'oppiaReleaseCoordinatorNavbar', downgradeComponent(
    {component: ReleaseCoordinatorNavbarComponent}));
