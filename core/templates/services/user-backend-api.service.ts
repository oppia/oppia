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

import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

import {UserInfo, UserInfoBackendDict} from 'domain/user/user-info.model';

export interface SubscriptionSummary {
  creator_username: string;
  creator_impact: number;
}

export interface EmailPreferencesBackendDict {
  can_receive_email_updates: boolean;
  can_receive_editor_role_email: boolean;
  can_receive_feedback_message_email: boolean;
  can_receive_subscription_email: boolean;
}

interface NonEmailPreferencesBackendDict {
  preferred_language_codes: string[];
  preferred_site_language_code: string;
  preferred_audio_language_code: string;
  default_dashboard: string;
  user_bio: string;
  subject_interests: string;
  subscription_list: SubscriptionSummary[];
}

// The following type is an intersection of EmailPreferencesBackendDict
// and NonEmailPreferencesbackendDict and hence will have all the properties
// of both the interfaces.
// Note: Intersection in TypeScript is used differently compared to set theory,
// the latter implies that the type will include only the properties that are
// are the same in both the interfaces whereas the former includes all the
// properties from both the interfaces. For more information, check
// https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html#intersection-types
export type PreferencesBackendDict = NonEmailPreferencesBackendDict &
  EmailPreferencesBackendDict;

export interface UpdatePreferencesResponse {
  bulk_email_signup_message_should_be_shown: boolean;
}

interface LoginUrlResponseDict {
  login_url: string;
}

export type BackendPreferenceUpdateType =
  | 'profile_picture_data_url'
  | 'user_bio'
  | 'subject_interests'
  | 'default_dashboard'
  | 'preferred_language_codes'
  | 'preferred_site_language_code'
  | 'preferred_audio_language_code'
  | 'email_preferences';

type DataType<UpdateType extends BackendPreferenceUpdateType> =
  UpdateType extends 'email_preferences'
    ? EmailPreferencesBackendDict
    : UpdateType extends 'preferred_language_codes'
      ? string[]
      : string;

export interface UpdatePreferenceDict {
  update_type: BackendPreferenceUpdateType;
  data: DataType<BackendPreferenceUpdateType>;
}

export interface UserContributionRightsDataBackendDict {
  can_review_translation_for_language_codes: string[];
  can_review_voiceover_for_language_codes: string[];
  can_review_questions: boolean;
  can_suggest_questions: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class UserBackendApiService {
  constructor(private http: HttpClient) {}

  private USER_INFO_URL = '/userinfohandler';
  private PREFERENCES_DATA_URL = '/preferenceshandler/data';
  private USER_CONTRIBUTION_RIGHTS_DATA_URL =
    '/usercontributionrightsdatahandler';

  private SITE_LANGUAGE_URL = '/save_site_language';

  async getUserInfoAsync(): Promise<UserInfo> {
    return this.http
      .get<UserInfoBackendDict>(this.USER_INFO_URL)
      .toPromise()
      .then(backendDict => {
        return backendDict.user_is_logged_in
          ? UserInfo.createFromBackendDict(backendDict)
          : UserInfo.createDefault();
      });
  }

  async setProfileImageDataUrlAsync(
    newProfileImageDataUrl: string
  ): Promise<UpdatePreferencesResponse> {
    return this.updateMultiplePreferencesDataAsync([
      {
        update_type: 'profile_picture_data_url',
        data: newProfileImageDataUrl,
      },
    ]);
  }

  async getLoginUrlAsync(currentUrl: string): Promise<string> {
    const urlParameters = {
      current_url: currentUrl,
    };
    return this.http
      .get<LoginUrlResponseDict>('/url_handler', {params: urlParameters})
      .toPromise()
      .then(backendDict => {
        return backendDict.login_url;
      });
  }

  async getUserContributionRightsDataAsync(): Promise<UserContributionRightsDataBackendDict> {
    return this.http
      .get<UserContributionRightsDataBackendDict>(
        this.USER_CONTRIBUTION_RIGHTS_DATA_URL
      )
      .toPromise();
  }

  async updatePreferredSiteLanguageAsync(
    currentLanguageCode: string
  ): Promise<Object> {
    return this.http
      .put(this.SITE_LANGUAGE_URL, {
        site_language_code: currentLanguageCode,
      })
      .toPromise();
  }

  async getPreferencesAsync(): Promise<PreferencesBackendDict> {
    return this.http
      .get<PreferencesBackendDict>(this.PREFERENCES_DATA_URL)
      .toPromise();
  }

  async updateMultiplePreferencesDataAsync(
    updates: UpdatePreferenceDict[]
  ): Promise<UpdatePreferencesResponse> {
    return this.http
      .put<UpdatePreferencesResponse>(this.PREFERENCES_DATA_URL, {
        updates: updates,
      })
      .toPromise();
  }
}
