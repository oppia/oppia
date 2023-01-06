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

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import { AppConstants } from 'app.constants';
import { UserInfo, UserInfoBackendDict } from 'domain/user/user-info.model';
import { ImageFile } from 'domain/utilities/image-file.model';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { AssetsBackendApiService } from 'services/assets-backend-api.service';

export interface SubscriptionSummary {
  'creator_picture_data_url': string;
  'creator_username': string;
  'creator_impact': number;
}

export interface EmailPreferencesBackendDict {
  'can_receive_email_updates': boolean;
  'can_receive_editor_role_email': boolean;
  'can_receive_feedback_message_email': boolean;
  'can_receive_subscription_email': boolean;
}

interface NonEmailPreferencesBackendDict {
  'preferred_language_codes': string[];
  'preferred_site_language_code': string;
  'preferred_audio_language_code': string;
  'profile_picture_data_url': string;
  'default_dashboard': string;
  'user_bio': string;
  'subject_interests': string;
  'subscription_list': SubscriptionSummary[];
}

// The following type is an intersection of EmailPreferencesBackendDict
// and NonEmailPreferencesbackendDict and hence will have all the properties
// of both the interfaces.
// Note: Intersection in TypeScript is used differently compared to set theory,
// the latter implies that the type will include only the properties that are
// are the same in both the interfaces whereas the former includes all the
// properties from both the interfaces. For more information, check
// https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html#intersection-types
export type PreferencesBackendDict = (
  NonEmailPreferencesBackendDict &
  EmailPreferencesBackendDict
);

export interface UpdatePreferencesResponse {
  'bulk_email_signup_message_should_be_shown': boolean;
}

interface LoginUrlResponseDict {
  'login_url': string;
}

export interface UserContributionRightsDataBackendDict {
  'can_review_translation_for_language_codes': string[];
  'can_review_voiceover_for_language_codes': string[];
  'can_review_questions': boolean;
  'can_suggest_questions': boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UserBackendApiService {
  constructor(
    private assetsBackendApiService: AssetsBackendApiService,
    private urlInterpolationService: UrlInterpolationService,
    private http: HttpClient
  ) {}

  private USER_INFO_URL = '/userinfohandler';
  private PREFERENCES_DATA_URL = '/preferenceshandler/data';
  private USER_CONTRIBUTION_RIGHTS_DATA_URL = (
    '/usercontributionrightsdatahandler');

  private SITE_LANGUAGE_URL = '/save_site_language';

  // Cache of current user's profile image.
  private profileImageCache: Blob;

  async getUserInfoAsync(): Promise<UserInfo> {
    return this.http.get<UserInfoBackendDict>(
      this.USER_INFO_URL).toPromise().then(
      (backendDict) => {
        return backendDict.user_is_logged_in ? UserInfo.createFromBackendDict(
          backendDict) : UserInfo.createDefault();
      });
  }

  async setProfileImageDataUrlAsync(
      newProfileImageDataUrl: string): Promise<UpdatePreferencesResponse> {
    return this.updatePreferencesDataAsync(
      'profile_picture_data_url', newProfileImageDataUrl);
  }

  async getLoginUrlAsync(currentUrl: string): Promise<string> {
    const urlParameters = {
      current_url: currentUrl
    };
    return this.http.get<LoginUrlResponseDict>(
      '/url_handler', { params: urlParameters }).toPromise().then(
      (backendDict) => {
        return backendDict.login_url;
      });
  }

  async getUserContributionRightsDataAsync():
    Promise<UserContributionRightsDataBackendDict> {
    return this.http.get<UserContributionRightsDataBackendDict>(
      this.USER_CONTRIBUTION_RIGHTS_DATA_URL).toPromise();
  }

  async updatePreferredSiteLanguageAsync(
      currentLanguageCode: string
  ): Promise<Object> {
    return this.http.put(this.SITE_LANGUAGE_URL, {
      site_language_code: currentLanguageCode
    }).toPromise();
  }

  async getPreferencesAsync(): Promise<PreferencesBackendDict> {
    return this.http.get<PreferencesBackendDict>(this.PREFERENCES_DATA_URL)
      .toPromise();
  }

  async updatePreferencesDataAsync(
      updateType: string,
      data: boolean | string | string[] | EmailPreferencesBackendDict
  ): Promise<UpdatePreferencesResponse> {
    return this.http.put<UpdatePreferencesResponse>(this.PREFERENCES_DATA_URL, {
      update_type: updateType,
      data: data
    }).toPromise();
  }

  async loadProfileImage(username: string): Promise<ImageFile> {
    // Fetch profile image for the current user if not specified.
    let loginUserUsername = await this.getUserInfoAsync().then(
      userInfo => userInfo.getUsername());
    username = username || loginUserUsername;

    if (this.profileImageCache !== undefined && username === loginUserUsername) {
      return new ImageFile('profile_picture.png', this.profileImageCache);
    }
    return this._fetchProfileImage(username);
  }

  private async _fetchProfileImage(username: string): Promise<ImageFile> {
    let onResolve!: (_: Blob) => void;
    let onReject!: () => void;
    const blobPromise = new Promise<Blob>((resolve, reject) => {
      onResolve = resolve;
      onReject = reject;
    });

    const subscription = this.http.get(
      this.urlInterpolationService.interpolateUrl(
        this.assetsBackendApiService.profileImageUrlTemplate,
        {username: username}), {responseType: 'blob'}
    ).subscribe(onResolve, onReject);

    try {
      const blob = await blobPromise;
      this.profileImageCache = blob;
      return new ImageFile('profile_picture.png', blob);
    } catch {
      return Promise.reject('profile_picture.png');
    }
  }
}
angular.module('oppia').factory(
  'UserBackendApiService',
  downgradeInjectable(UserBackendApiService));
