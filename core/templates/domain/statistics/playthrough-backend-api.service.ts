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
 * @fileoverview Backend API service for playthrough.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { Playthrough } from
  'domain/statistics/PlaythroughObjectFactory';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';

interface IStorePlaythroughBackendResponse {
  'playthrough_stored': boolean;
  'playthrough_id': string;
}

export class StorePlaythroughResponse {
  constructor(
    public playthroughStored: boolean,
    public playthroughId: string) {}
}

@Injectable({
  providedIn: 'root'
})
export class PlaythroughBackendApiService {
  STORE_PLAYTHROUGH_URL: string = (
    '/explorehandler/store_playthrough/<exploration_id>');

  constructor(
      private http: HttpClient,
      private urlInterpolationService: UrlInterpolationService) {}

  storePlaythrough(
      playthrough: Playthrough, issueSchemaVersion: number,
      playthroughId: string): Promise<StorePlaythroughResponse> {
    let playthroughUrl = this.urlInterpolationService.interpolateUrl(
      this.STORE_PLAYTHROUGH_URL, {
        exploration_id: playthrough.expId
      });

    return this.http.post<IStorePlaythroughBackendResponse>(playthroughUrl, {
      playthrough_data: playthrough.toBackendDict(),
      issue_schema_version: issueSchemaVersion,
      playthrough_id: playthroughId
    }).toPromise().then(response => {
      return new StorePlaythroughResponse(
        response.playthrough_stored, response.playthrough_id);
    });
  }
}

angular.module('oppia').factory(
  'PlaythroughBackendApiService',
  downgradeInjectable(PlaythroughBackendApiService));
