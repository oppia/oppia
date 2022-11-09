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
  private PROFILE_PICTURE_URL = '/preferenceshandler/profile_picture';
  private PREFERENCES_DATA_URL = '/preferenceshandler/data';
  private USER_CONTRIBUTION_RIGHTS_DATA_URL = (
    '/usercontributionrightsdatahandler');

  private SITE_LANGUAGE_URL = '/save_site_language';

  // Map from username to profile image.
  private profileImageCache: Map<string, Blob> = new Map();

  async getUserInfoAsync(): Promise<UserInfo> {
    return this.http.get<UserInfoBackendDict>(
      this.USER_INFO_URL).toPromise().then(
      (backendDict) => {
        return backendDict.user_is_logged_in ? UserInfo.createFromBackendDict(
          backendDict) : UserInfo.createDefault();
      });
  }

  async getProfileImageDataUrlAsync(): Promise<string> {
    return this.loadProfileImage().then(image => {
      return new Promise(resolve => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(image.data);
      });
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

  async loadProfileImage(username: string = ''): Promise<ImageFile> {
    // Artificially load an image from a random exploration where you
    // uploaded an image. We'll pretend that it is the profile image
    // that is retrieved from the backend.

    // Test image 1.
    const image_1 = this.assetsBackendApiService.loadImage(
      AppConstants.ENTITY_TYPE.EXPLORATION, 'lOZraTUa1x8b',
      'img_20221108_210419_1pse2cowr9_height_275_width_237.png');

    // Test image 2.
    const image_2 = this.assetsBackendApiService.loadImage(
      AppConstants.ENTITY_TYPE.EXPLORATION, 'sIW3TNaiFWQD',
      'img_20221108_111758_k26g4dj4h7_height_201_width_203.png');

    username = username || await this.getUserInfoAsync().then(
      userInfo => userInfo.getUsername());
    // All of this logic is just for testing.
    if (username === 'eric') {
      return image_1;
    } else {
      return image_2;
    }
    // ^^^ Delete everything above this line once merged with Hitesh's changes.

    // Fetch profile image for the current user if not specified.
    username = username || await this.getUserInfoAsync().then(
      userInfo => userInfo.getUsername());
    
    const filename = `${username}/profile_image.png`;
    let data = this.profileImageCache.get(filename);
    if (this.profileImageCache.has(filename) && data !== undefined) {
      return new ImageFile(filename, data);
    }
    return this.fetchProfileImage(username);
  }

  private async fetchProfileImage(username: string): Promise<ImageFile> {
    let onResolve!: (_: Blob) => void;
    let onReject!: () => void;
    const blobPromise = new Promise<Blob>((resolve, reject) => {
      onResolve = resolve;
      onReject = reject;
    });

    const subscription = this.http.get(
      this.urlInterpolationService.interpolateUrl(
        this.assetsBackendApiService.profileImageUrlTemplate, {username: username}), {
        responseType: 'blob'
      }).subscribe(onResolve, onReject);

    const filename = `${username}/profile_image.png`;
    try {
      const blob = await blobPromise;
      this.profileImageCache.set(filename, blob);
      return new ImageFile(filename, blob);
    } catch {
      return Promise.reject(filename);
    }  
  }
}
angular.module('oppia').factory(
  'UserBackendApiService',
  downgradeInjectable(UserBackendApiService));
