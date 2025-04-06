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

import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

import {AppConstants} from 'app.constants';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {ReleaseCoordinatorPageConstants} from 'pages/release-coordinator-page/release-coordinator-page.constants';
import {UserService} from 'services/user.service';

@Component({
  selector: 'oppia-release-coordinator-navbar',
  templateUrl: './release-coordinator-navbar.component.html',
})
export class ReleaseCoordinatorNavbarComponent implements OnInit {
  @Output() activeTabChange = new EventEmitter();
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() activeTab!: string;
  profilePicturePngDataUrl!: string;
  profilePictureWebpDataUrl!: string;
  // User name is null if the user is not logged in.
  username!: string | null;
  profileUrl!: string;
  logoWebpImageSrc!: string;
  logoPngImageSrc!: string;
  logoutUrl: string =
    '/' + AppConstants.PAGES_REGISTERED_WITH_FRONTEND.LOGOUT.ROUTE;
  dropdownMenuIsActive: boolean = false;

  profileDropdownIsActive: boolean = false;
  TAB_ID_BEAM_JOBS: string = ReleaseCoordinatorPageConstants.TAB_ID_BEAM_JOBS;
  TAB_ID_FEATURES: string = ReleaseCoordinatorPageConstants.TAB_ID_FEATURES;
  TAB_ID_MISC: string = ReleaseCoordinatorPageConstants.TAB_ID_MISC;
  PAGES_REGISTERED_WITH_FRONTEND = AppConstants.PAGES_REGISTERED_WITH_FRONTEND;

  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private userService: UserService
  ) {}

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

  switchTab(tabName: string): void {
    if (tabName !== this.activeTab) {
      this.activeTabChange.emit(tabName);
      this.activeTab = tabName;
    }
    this.dropdownMenuIsActive = false;
  }

  async getUserInfoAsync(): Promise<void> {
    const userInfo = await this.userService.getUserInfoAsync();
    this.username = userInfo.getUsername();
    if (this.username) {
      this.profileUrl = this.urlInterpolationService.interpolateUrl(
        '/profile/<username>',
        {
          username: this.username,
        }
      );
      [this.profilePicturePngDataUrl, this.profilePictureWebpDataUrl] =
        this.userService.getProfileImageDataUrl(this.username);
    } else {
      this.profilePictureWebpDataUrl =
        this.urlInterpolationService.getStaticImageUrl(
          AppConstants.DEFAULT_PROFILE_IMAGE_WEBP_PATH
        );
      this.profilePicturePngDataUrl =
        this.urlInterpolationService.getStaticImageUrl(
          AppConstants.DEFAULT_PROFILE_IMAGE_PNG_PATH
        );
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

    this.activeTab = this.TAB_ID_BEAM_JOBS;
  }
}
