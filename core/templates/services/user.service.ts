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
import { UserInfoObjectFactory } from 'domain/user/UserInfoObjectFactory.ts';
import { AppConstants } from 'app.constants';


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

    getUserInfoAsync(): Promise<Object> {
      if (this.urlService.getPathname() === '/signup'){
        return Promise.resolve(this.userInfoObjectFactory.createDefault())
      }
      if (this.userInfo) {
        return Promise.resolve(this.userInfo);
      }
      return this.http.get( //fix this method
        '/userinfohandler', { observe: 'response' }).toPromise().then(
          (response) => {
            if (response.body.user_is_logged_in) {
              this.userInfo = 
                this.userInfoObjectFactory.createFromBackendDict(
                  response.body);
              return Promise.resolve(this.userInfo);
            } else {
              return Promise.resolve(
                this.userInfoObjectFactory.createDefault());
            }
      });
    }
    getProfileImageDataUrlAsync(): Promise<Object> {
      let profilePictureDataUrl = (
        this.urlInterpolationService.getStaticImageUrl(
          AppConstants.DEFAULT_PROFILE_IMAGE_PATH));
      return this.getUserInfoAsync().then(
        () => {
          if (this.userInfo.isLoggedIn()){
            return this.http.get(
              '/preferenceshandler/profile_picture', { observe: 'response' }
            ).toPromise().then(
              (response) => {
                if (response.body.profile_picture_data_url){
                  profilePictureDataUrl = 
                    response.body.profile_picture_data_url;
                }
                return profilePictureDataUrl;
            });
          } else {
            return Promise.resolve(profilePictureDataUrl);
          }
        });
    }
    setProfileImageDataUrlAsync(newProfileImageDataUrl) { //need return type?
      return this.http.put(this.PREFERENCES_DATA_URL, {
        update_type: 'profile_picture_data_url',
        data: newProfileImageDataUrl
      });
    }
    getLoginUrlAsync(): Promise<Object> {
      let urlParameters = {
        current_url: this.windowRef.nativeWindow.location.pathname
      };
      return this.http.get('/url_handler', { params: urlParameters, 
        observe: 'response'}).toPromise().then(
          (response) => {
            return response.body.login_url;
        });
    }
    getUserCommunityRightsData(): Promise<Object> {
      if (this.userCommunityRightsInfo) {
        return Promise.resolve(this.userCommunityRightsInfo);
      } else {
        return this.http.get(
          this.USER_COMMUNITY_RIGHTS_DATA_URL, { observe: 'response' }).toPromise().then(
            (response) => {
              this.userCommunityRightsInfo = response.body;
              return Promise.resolve(this.userCommunityRightsInfo);
        });
      }
    }
}

angular.module('oppia').factory(
  'UserService',
   downgradeInjectable(UserService));