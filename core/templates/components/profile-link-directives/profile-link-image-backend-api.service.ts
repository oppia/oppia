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

interface ProfileDict {
  'profile_picture_data_url_for_username': string;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileLinkImageBackendApiService {
  constructor(
    private http: HttpClient
  ) {}

  fetchProfilePictureData(profileImageUrl: string): Promise<ProfileDict> {
    return this.http.get<ProfileDict>(profileImageUrl).toPromise();
  }
}

angular.module('oppia').factory('ProfileLinkImageBackendApiService',
  downgradeInjectable(ProfileLinkImageBackendApiService));
