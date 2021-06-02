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
import { WindowRef } from './contextual/window-ref.service';
import { Title } from '@angular/platform-browser';

interface SubscriptionSummary {
  'creator_picture_data_url': string;
  'creator_username': string;
  'creator_impact': number;
}

export interface PreferencesBackendDict {
  'preferred_language_codes': string[];
  'preferred_site_language_code': string;
  'preferred_audio_language_code': string;
  'profile_picture_data_url': string;
  'default_dashboard': string;
  'user_bio': string;
  'subject_interests': string;
  'can_receive_email_updates': boolean;
  'can_receive_editor_role_email': boolean;
  'can_receive_feedback_message_email': boolean;
  'can_receive_subscription_email': boolean;
  'subscription_list': SubscriptionSummary[];
}

interface LoginUrlResponseDict {
  'login_url': string;
}

export interface UserContributionRightsDataBackendDict {
  'can_review_translation_for_language_codes': boolean;
  'can_review_voiceover_for_language_codes': boolean;
  'can_review_questions': boolean;
}

interface UnseenNotifications {
  'num_unseen_notifications': number
}

@Injectable({
  providedIn: 'root'
})
export class UserBackendApiService {
  constructor(
    private http: HttpClient,
    private windowRef: WindowRef,
    private titleService: Title) {}

  private USER_INFO_URL = '/userinfohandler';
  private PROFILE_PICTURE_URL = '/preferenceshandler/profile_picture';
  private PREFERENCES_DATA_URL = '/preferenceshandler/data';
  private USER_CONTRIBUTION_RIGHTS_DATA_URL = (
    '/usercontributionrightsdatahandler');
  numUnseenNotifications: string | number;
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
    return this.http.get<PreferencesBackendDict>(
      this.PROFILE_PICTURE_URL).toPromise().then(
      (backendDict) => {
        return backendDict.profile_picture_data_url || defaultUrl;
      });
  }

  async setProfileImageDataUrlAsync(
      newProfileImageDataUrl: string): Promise<PreferencesBackendDict> {
    const profileImageUpdateUrlData = {
      update_type: 'profile_picture_data_url',
      data: newProfileImageDataUrl
    };
    return this.http.put<PreferencesBackendDict>(
      this.PREFERENCES_DATA_URL, profileImageUpdateUrlData).toPromise();
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

  showUnseenNotifications(): void {
    this.http.get<UnseenNotifications>(
      '/notificationshandler').toPromise().then(
      (response: UnseenNotifications) => {
        if (this.windowRef.nativeWindow.location.pathname !== '/') {
          this.numUnseenNotifications =
               response.num_unseen_notifications;
          if (this.numUnseenNotifications > 0) {
            this.titleService.setTitle(
              '(' + this.numUnseenNotifications + ') ' +
                  this.titleService.getTitle());
          }
        }
      });
  }
  async updatePreferredSiteLanguageAsync(
      currentLanguageCode: string
  ): Promise<Object> {
    return this.http.put(this.SITE_LANGUAGE_URL, {
      site_language_code: currentLanguageCode
    }).toPromise();
  }
}
angular.module('oppia').factory(
  'UserBackendApiService',
  downgradeInjectable(UserBackendApiService));
