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

import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

import {ServicesConstants} from 'services/services.constants';
import {
  StateTopAnswersStats,
  StateTopAnswersStatsBackendDict,
  StateTopAnswersStatsObjectFactory,
} from 'domain/statistics/state-top-answers-stats-object.factory';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';

@Injectable({providedIn: 'root'})
export class StateTopAnswersStatsBackendApiService {
  constructor(
    private http: HttpClient,
    private stateTopAnswersStatsObjectFactory: StateTopAnswersStatsObjectFactory,
    private urlInterpolationService: UrlInterpolationService
  ) {}

  async fetchStatsAsync(expId: string): Promise<StateTopAnswersStats> {
    return this.http
      .get<StateTopAnswersStatsBackendDict>(
        this.urlInterpolationService.interpolateUrl(
          ServicesConstants.STATE_ANSWER_STATS_URL,
          {exploration_id: expId}
        )
      )
      .toPromise()
      .then(
        d => this.stateTopAnswersStatsObjectFactory.createFromBackendDict(d),
        errorResponse => {
          throw new Error(errorResponse.error.error);
        }
      );
  }
}
