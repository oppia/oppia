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
import { UpdatePreferencesResponse, UserBackendApiService, UserContributionRightsDataBackendDict } from 'services/user-backend-api.service';

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

  // This property will be null when the user does not have
  // enough rights to review translations, voiceover and questions.
  private userContributionRightsInfo:
    UserContributionRightsDataBackendDict | null = null;

  // This property will be null when the user is not logged in.
  private userInfo: UserInfo | null = null;
  private returnUrl = '';

  async getUserInfoAsync(): Promise<UserInfo> {
    const pathname = this.urlService.getPathname();
    if (['/logout', '/signup'].includes(pathname)) {
      return UserInfo.createDefault();
    }
    if (this.userInfo === null) {
      this.userInfo = await this.userBackendApiService.getUserInfoAsync();
    }
    return this.userInfo;
  }

  async getProfileImageDataUrlAsync(): Promise<string> {
    let defaultUrl = (
      this.urlInterpolationService.getStaticImageUrl(
        AppConstants.DEFAULT_PROFILE_IMAGE_PATH));
    return this.getUserInfoAsync().then(
      async(userInfo) => {
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
      newProfileImageDataUrl: string): Promise<UpdatePreferencesResponse> {
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
    Promise<UserContributionRightsDataBackendDict | null> {
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

  async getUserPreferredDashboardAsync(): Promise<string> {
    return this.userBackendApiService.getPreferencesAsync().then((data) => {
      return data.default_dashboard;
    });
  }

  async canUserAccessTopicsAndSkillsDashboard(): Promise<boolean> {
    return this.getUserInfoAsync().then((userInfo) => {
      return (
        userInfo.isLoggedIn() &&
        (userInfo.isCurriculumAdmin() || userInfo.isTopicManager())
      );
    });
  }

  async canUserEditBlogPosts(): Promise<boolean> {
    return this.getUserInfoAsync().then((info) => {
      return (info.isBlogAdmin() || info.isBlogPostEditor());
    });
  }
}

angular.module('oppia').factory(
  'UserService',
  downgradeInjectable(UserService));
