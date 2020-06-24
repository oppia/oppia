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
 * @fileoverview Service to retrieve information of profile from the
 * backend.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { ProfilePageDomainConstants } from
  'pages/profile-page/profile-page-domain.constants';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { UrlService } from 'services/contextual/url.service.ts';

@Injectable({
  providedIn: 'root'
})
export class ProfilePageBackendApiService {
  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private http: HttpClient,
    private urlService: UrlService
  ) {}

  _postSubscribe(creatorUsername: string): Promise<Object> {
    return this.http.post(
      ProfilePageDomainConstants.PROFILE_SUBSCRIBE_URL,
      { creator_username: creatorUsername }
    ).toPromise();
  }

  _postUnsubscribe(creatorUsername: string): Promise<Object> {
    return this.http.post(
      ProfilePageDomainConstants.PROFILE_UNSUBSCRIBE_URL,
      { creator_username: creatorUsername }
    ).toPromise();
  }

  _fetchProfileData(): Promise<Object> {
    return this.http.get(
      this.urlInterpolationService.interpolateUrl(
        ProfilePageDomainConstants.PROFILE_DATA_URL,
        {username: this.urlService.getUsernameFromProfileUrl()}
      )
    ).toPromise();
  }

  /**
   * Subscribes to a profile for the given username.
   * @param {String} creatorUsername - username of profile to be subscribed.
   */
  subscribe(creatorUsername: string): Promise<Object> {
    return this._postSubscribe(creatorUsername);
  }

  /**
   * Unsubscribes from a profile for the given username.
   * @param {String} creatorUsername - username of profile to be unsubscribed.
   */
  unsubscribe(creatorUsername: string): Promise<Object> {
    return this._postUnsubscribe(creatorUsername);
  }

  /**
   * Fetches the profile for username in URL.
   */
  fetchProfileData(): Promise<any> {
    return this._fetchProfileData();
  }
}

angular.module('oppia').factory(
  'ProfilePageBackendApiService',
  downgradeInjectable(ProfilePageBackendApiService));
