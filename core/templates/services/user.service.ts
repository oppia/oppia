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

import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { WindowRef } from 'services/contextual/window-ref.service';

import { UrlInterpolationService } from 
  'domain/utilities/url-interpolation.service';
import { UrlService } from 'services/contextual/url.service.ts';
import { UserInfoObjectFactory, UserInfo, IUserInfoBackendDict } from 
  'domain/user/UserInfoObjectFactory.ts';
import { AppConstants } from 'app.constants';
import { List } from 'lodash';

interface subscription_summary {
  'creator_picture_data_url': string;
  'creator_username': string;
  'creator_impact': number;
}
interface IPreferencesBackendDict {
  'preferred_language_codes': string;
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
  'subscription_list': List<subscription_summary>;
}
interface IUrlBackendDict {
  'login_url': string;
}
interface IUserCommunityRightsDataBackendDict {
  'can_review_translation_for_language_codes': boolean;
  'can_review_voiceover_for_language_codes': boolean;
  'can_review_questions': boolean;
}


@Injectable({
  providedIn: 'root'  
})
export class UserService{
  constructor(
    private http: HttpClient,
    private windowRef: WindowRef,
    private urlInterpolationService: UrlInterpolationService,
    private urlService: UrlService,
    private userInfoObjectFactory: UserInfoObjectFactory) {}

    private PREFERENCES_DATA_URL = '/preferenceshandler/data';
    private USER_COMMUNITY_RIGHTS_DATA_URL = '/usercommunityrightsdatahandler';

    private userInfo = null;
    private userCommunityRightsInfo = null;

    getUserInfoAsync(): Promise<UserInfo> {
      if (this.urlService.getPathname() === '/signup'){
        return Promise.resolve(this.userInfoObjectFactory.createDefault())
      }
      if (this.userInfo) {
        return Promise.resolve(this.userInfo);
      }
      return this.http.get<IUserInfoBackendDict>(
        '/userinfohandler').toPromise().then(
          (backendDict) => {
            if (backendDict.user_is_logged_in) {
              this.userInfo = 
                this.userInfoObjectFactory.createFromBackendDict(
                  backendDict);
              return Promise.resolve(this.userInfo);
            } else {
              return Promise.resolve(
                this.userInfoObjectFactory.createFromBackendDict(
                  backendDict));
                //this.userInfoObjectFactory.createDefault());
            }
      });
    }
    getProfileImageDataUrlAsync(): Promise<string> {
      let profilePictureDataUrl = (
        this.urlInterpolationService.getStaticImageUrl(
          AppConstants.DEFAULT_PROFILE_IMAGE_PATH));
      return this.getUserInfoAsync().then(
        (userInfo) => {
          if (userInfo.isLoggedIn()){
            return this.http.get<IPreferencesBackendDict>(
              '/preferenceshandler/profile_picture'
            ).toPromise().then(
              (backendDict) => {
                if (backendDict.profile_picture_data_url){
                  profilePictureDataUrl = 
                    backendDict.profile_picture_data_url;
                }
                return profilePictureDataUrl;
            });
          } else {
            return Promise.resolve(profilePictureDataUrl);
          }
        });
    }
    setProfileImageDataUrlAsync(newProfileImageDataUrl: string): 
      Promise<IPreferencesBackendDict> {
      let putData = {
        update_type: 'profile_picture_data_url',
        data: newProfileImageDataUrl
      }
      return this.http.put<IPreferencesBackendDict>(
        this.PREFERENCES_DATA_URL, putData).toPromise();
    }
    getLoginUrlAsync(): Promise<string> {
      let urlParameters = {
        current_url: this.windowRef.nativeWindow.location.pathname
      };
      return this.http.get<IUrlBackendDict>('/url_handler', 
        { params: urlParameters }).toPromise().then(
          (backendDict) => {
            return backendDict.login_url;
        });
    }
    getUserCommunityRightsData(): Promise<IUserCommunityRightsDataBackendDict>{
      if (this.userCommunityRightsInfo) {
        return Promise.resolve(this.userCommunityRightsInfo);
      } else {
        return this.http.get<IUserCommunityRightsDataBackendDict>(
          this.USER_COMMUNITY_RIGHTS_DATA_URL).toPromise().then(
            (backendDict) => {
              this.userCommunityRightsInfo = backendDict;
              return Promise.resolve(this.userCommunityRightsInfo);
        });
      }
    }
}

angular.module('oppia').factory(
  'UserService',
   downgradeInjectable(UserService));