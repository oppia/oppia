// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for user data.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { AppConstants } from 'app.constants';
import { UserInfo } from 'domain/user/user-info.model';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { UrlService } from 'services/contextual/url.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { PreferencesBackendDict, UserBackendApiService, UserContributionRightsDataBackendDict } from 'services/user-backend-api.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private urlService: UrlService,
    private windowRef: WindowRef,
    private userBackendApiService: UserBackendApiService
  ) {}

    private userContributionRightsInfo = null;
    private userInfo = null;
    private returnUrl = '';

    async getUserInfoAsync(): Promise<UserInfo> {
      const pathname = this.urlService.getPathname();
      if (['/logout', '/signup'].includes(pathname)) {
        return UserInfo.createDefault();
      }
      if (!this.userInfo) {
        this.userInfo = await this.userBackendApiService.getUserInfoAsync();
      }
      return this.userInfo;
    }

    async getProfileImageDataUrlAsync(): Promise<string> {
      let defaultUrl = (
        this.urlInterpolationService.getStaticImageUrl(
          AppConstants.DEFAULT_PROFILE_IMAGE_PATH));
      return this.getUserInfoAsync().then(
        (userInfo) => {
          if (userInfo.isLoggedIn()) {
            return this.userBackendApiService.getProfileImageDataUrlAsync(
              defaultUrl);
          } else {
            return new Promise((resolve, reject) => {
              resolve(defaultUrl);
            });
          }
        });
    }

    async setProfileImageDataUrlAsync(
        newProfileImageDataUrl: string): Promise<PreferencesBackendDict> {
      return this.userBackendApiService.setProfileImageDataUrlAsync(
        newProfileImageDataUrl);
    }

    async getLoginUrlAsync(): Promise<string> {
      return this.userBackendApiService.getLoginUrlAsync(
        this.returnUrl ||
        this.windowRef.nativeWindow.location.pathname);
    }

    setReturnUrl(newReturnUrl: string): void {
      this.returnUrl = newReturnUrl;
    }

    async getUserContributionRightsDataAsync():
      Promise<UserContributionRightsDataBackendDict> {
      if (this.userContributionRightsInfo) {
        return new Promise((resolve, reject) => {
          resolve(this.userContributionRightsInfo);
        });
      }
      return this.userBackendApiService.getUserContributionRightsDataAsync()
        .then((userContributionRightsInfo) => {
          this.userContributionRightsInfo = userContributionRightsInfo;
          return this.userContributionRightsInfo;
        });
    }
}

angular.module('oppia').factory(
  'UserService',
  downgradeInjectable(UserService));
