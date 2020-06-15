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
 * @fileoverview Service to fetch statistics about an exploration's states.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { ServicesConstants } from 'services/services.constants';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';

@Injectable({
  providedIn: 'root'
})
export class StateTopAnswersStatsBackendApiService {
  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private http: HttpClient
  ) {}

  _fetchStats(explorationId: string): Promise<Object> {
    return this.http.get(
      this.urlInterpolationService.interpolateUrl(
        ServicesConstants.STATE_ANSWER_STATS_URL,
        {exploration_id: explorationId}
      )
    ).toPromise();
  }

  fetchStats(explorationId: string): Promise<Object> {
    return this._fetchStats(explorationId);
  }
}

angular.module('oppia').factory(
  'StateTopAnswersStatsBackendApiService',
  downgradeInjectable(StateTopAnswersStatsBackendApiService));
