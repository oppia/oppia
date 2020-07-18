// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to save changes to backend given
 *  a set of request parameters.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service.ts';
import { ExplorationDataService } from
  'pages/exploration-editor-page/services/exploration-data.service.ts';
import { AlertsService } from 'services/alerts.service.ts';

// require('domain/utilities/url-interpolation.service.ts')
// require('pages/exploration-editor-page/services/exploration-data.service.ts')
// require('services/alerts.service.ts')

@Injectable({
  providedIn: 'root'
})
export class UserEmailPreferencesBackendApiService {
  constructor(
        private http: HttpClient,
        private urlInterpolationService: UrlInterpolationService,
        private explorationDataService: ExplorationDataService,
        private alertsService: AlertsService
  ) {

  }
  saveChangeToBackend(requestParams) :Promise< void |Object> {
    var emailPreferencesUrl = this.urlInterpolationService.interpolateUrl(
      '/createhandler/notificationpreferences/<exploration_id>', {
        exploration_id: ExplorationDataService.explorationId
      }
    );
    return this.http.put(emailPreferencesUrl, requestParams).toPromise();
  }
}


angular.module('oppia').factory(
  'QuestionBackendApiService',
  downgradeInjectable(UserEmailPreferencesBackendApiService));
