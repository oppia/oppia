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
 * @fileoverview Service for recording and scrutinizing playthroughs.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Playthrough } from 'domain/statistics/PlaythroughObjectFactory';
import { ServicesConstants } from 'services/services.constants';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';

interface IStorePlaythroughResponse {
  'playthrough_id': string;
  'playthrough_stored': boolean;
}

@Injectable({providedIn: 'root'})
export class PlaythroughBackendApiService {
  constructor(
      private httpClient: HttpClient,
      private urlInterpolationService: UrlInterpolationService) {}

  /** Commits a playthrough to the backend and returns the ID assigned to it. */
  storePlaythrough(playthrough: Playthrough): Promise<string> {
    const backendApiUrl = this.urlInterpolationService.interpolateUrl(
      ServicesConstants.STORE_PLAYTHROUGH_URL, {
        exploration_id: playthrough.expId
      });
    return this.httpClient.post<IStorePlaythroughResponse>(backendApiUrl, {
      playthrough_data: playthrough.toBackendDict(),
      issue_schema_version: ServicesConstants.CURRENT_ISSUE_SCHEMA_VERSION,
      playthrough_id: playthrough.playthroughId
    }).toPromise().then(
      response => response.playthrough_stored ?
        response.playthrough_id : playthrough.playthroughId);
  }
}

angular.module('oppia').factory(
  'PlaythroughBackendApiService',
  downgradeInjectable(PlaythroughBackendApiService));
