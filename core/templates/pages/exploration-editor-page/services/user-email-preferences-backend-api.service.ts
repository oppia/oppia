// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview User exploration emails backend api service
 * for the exploration settings.
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { ExplorationDataService } from './exploration-data.service';
import { EmailPreferencesData, RequestParams } from './user-email-preferences.service';

@Injectable({
  providedIn: 'root'
})
export class UserEmailPreferencesBackendApiService {
  constructor(
    private http: HttpClient,
    private urlInterpolationService: UrlInterpolationService,
    private explorationDataService: ExplorationDataService
  ) { }

  async saveChangeToBackendAsync(
      requestParams: RequestParams
  ): Promise<EmailPreferencesData> {
    let emailPreferencesUrl = this.urlInterpolationService.interpolateUrl(
      '/createhandler/notificationpreferences/<exploration_id>', {
        exploration_id: this.explorationDataService.explorationId
      }
    );
    return this.http.put<EmailPreferencesData>(
      emailPreferencesUrl, requestParams).toPromise();
  }
}

angular.module('oppia').factory(
  'UserEmailPreferencesBackendApiService',
  downgradeInjectable(UserEmailPreferencesBackendApiService)
);
