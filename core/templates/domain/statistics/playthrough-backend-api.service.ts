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

import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

import {Playthrough} from 'domain/statistics/playthrough.model';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';

@Injectable({
  providedIn: 'root',
})
export class PlaythroughBackendApiService {
  private readonly STORE_PLAYTHROUGH_URL: string =
    '/explorehandler/store_playthrough/<exploration_id>';

  constructor(
    private http: HttpClient,
    private urlInterpolationService: UrlInterpolationService
  ) {}

  async storePlaythroughAsync(
    playthrough: Playthrough,
    issueSchemaVersion: number
  ): Promise<void> {
    let playthroughUrl = this.urlInterpolationService.interpolateUrl(
      this.STORE_PLAYTHROUGH_URL,
      {
        exploration_id: playthrough.expId,
      }
    );

    return this.http
      .post<void>(playthroughUrl, {
        playthrough_data: playthrough.toBackendDict(),
        issue_schema_version: issueSchemaVersion,
      })
      .toPromise();
  }
}
