// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Backend api service for profile image url.
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import { map } from 'rxjs/operators';

interface ProfileDict {
  'profile_picture_data_url_for_username': string | null;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileLinkImageBackendApiService {
  constructor(
    private http: HttpClient
  ) {}

  // This function will return a 'null' Promise in the following cases:
  // 1. The user is not logged in
  // 2. The user didn't upload a profile picture
  // 3. The user uses preview mode inside the exploration editor.
  async fetchProfilePictureDataAsync(profileImageUrl: string):
      Promise<string | null> {
    return this.http.get<ProfileDict>(profileImageUrl).pipe(
      // A URL encoded base64 image is treated as unsafe by Angular. This is
      // because angular's security doesn't allow anything outside the following
      // regex: [a-z0-9+\/]+=*$/i in the image data, i.e., the string after
      // "data:image/png;base64,". But URL encoded data contains "%" (%2B for
      // "+" and "%3D" for ="). Hence the image is decoded here to conform to
      // the security restrictions imposed by angular.
      // TODO(#10463): Remove the 'replace newlines' logic after moving
      // profile pictures to GCS.
      map(response => {
        return (
          response.profile_picture_data_url_for_username &&
          decodeURIComponent(
            response.profile_picture_data_url_for_username
          ).replace(/\n/g, ''));
      })).toPromise();
  }
}

angular.module('oppia').factory('ProfileLinkImageBackendApiService',
  downgradeInjectable(ProfileLinkImageBackendApiService));
