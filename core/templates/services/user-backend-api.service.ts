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
import { UserInfo, UserInfoBackendDict } from 'domain/user/user-info.model';

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

export interface NonEmailPreferencesBackendDict {
  'preferred_language_codes': string[];
  'preferred_site_language_code': string;
  'preferred_audio_language_code': string;
  'default_dashboard': string;
  'user_bio': string;
  'subject_interests': string;
}

export interface ProfilePictureDataBackendDict {
  'profile_picture_data_url': string;
  'subscription_list': SubscriptionSummary[];
}


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
    private http: HttpClient) {}

  private USER_INFO_URL = '/userinfohandler';
  private PROFILE_PICTURE_URL = '/preferenceshandler/profile_picture';
  private PREFERENCES_DATA_URL = '/preferenceshandler/data';
  private PREFERENCES_PROFILE_PICTURE_DATA_URL = (
    '/preferenceshandler/profile_picture_data');

  private EMAIL_PREFFERENCES = '/preferenceshandler/email_preferences';

  private USER_CONTRIBUTION_RIGHTS_DATA_URL = (
    '/usercontributionrightsdatahandler');

  private SITE_LANGUAGE_URL = '/save_site_language';

  async getUserInfoAsync(): Promise<UserInfo> {
    return this.http.get<UserInfoBackendDict>(
      this.USER_INFO_URL).toPromise().then(
      (backendDict) => {
        return backendDict.user_is_logged_in ? UserInfo.createFromBackendDict(
          backendDict) : UserInfo.createDefault();
      });
  }

  async getProfileImageDataUrlAsync(defaultUrl: string): Promise<string> {
    return this.http.get<ProfilePictureDataBackendDict>(
      this.PROFILE_PICTURE_URL).toPromise().then(
      (backendDict) => {
        return backendDict.profile_picture_data_url || defaultUrl;
      });
  }

  async setProfileImageDataUrlAsync(newProfileImageDataUrl: string):
    Promise<ProfilePictureDataBackendDict> {
    return this.updatePreferencesProfilePictureDataUrlAsync(
      newProfileImageDataUrl);
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

  async getPreferencesAsync():
    Promise<NonEmailPreferencesBackendDict> {
    return this.http.get<NonEmailPreferencesBackendDict>(
      this.PREFERENCES_DATA_URL).toPromise();
  }

  async getPreferencesProfilePictureDataUrlAsync():
    Promise<ProfilePictureDataBackendDict> {
    return this.http.get<ProfilePictureDataBackendDict>(
      this.PREFERENCES_PROFILE_PICTURE_DATA_URL).toPromise();
  }

  async getEmailPreferencesAsync():
    Promise<EmailPreferencesBackendDict> {
    return this.http.get<EmailPreferencesBackendDict>(
      this.EMAIL_PREFFERENCES).toPromise();
  }

  async updatePreferencesDataAsync(
      updateType: string,
      data: boolean | string | string[]
  ): Promise<NonEmailPreferencesBackendDict> {
    return this.http.put<NonEmailPreferencesBackendDict>(
      this.PREFERENCES_DATA_URL, {
        update_type: updateType,
        data: data
      }
    ).toPromise();
  }

  async updatePreferencesProfilePictureDataUrlAsync(
      data: string
  ): Promise<ProfilePictureDataBackendDict> {
    return this.http.put<ProfilePictureDataBackendDict>(
      this.PREFERENCES_PROFILE_PICTURE_DATA_URL, {
        data: data
      }
    ).toPromise();
  }

  async updateEmailPreferencesAsync(
      data: boolean | EmailPreferencesBackendDict
  ): Promise<UpdatePreferencesResponse> {
    return this.http.put<UpdatePreferencesResponse>(
      this.EMAIL_PREFFERENCES, {
        data: data
      }
    ).toPromise();
  }
}
angular.module('oppia').factory(
  'UserBackendApiService',
  downgradeInjectable(UserBackendApiService));
