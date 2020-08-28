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
 * @fileoverview Service for fetching exploration-level statistics from the
 *    backend.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import {
  ExplorationStats,
  ExplorationStatsObjectFactory,
  ExplorationStatsBackendDict
} from 'domain/statistics/ExplorationStatsObjectFactory';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';

@Injectable({providedIn: 'root'})
export class ExplorationStatsBackendApiService {
  constructor(
      private explorationStatsObjectFactory: ExplorationStatsObjectFactory,
      private http: HttpClient,
      private urlInterpolationService: UrlInterpolationService) {}

  fetchExplorationStats(expId: string): Promise<ExplorationStats> {
    return this.http.get<ExplorationStatsBackendDict>(
      this.urlInterpolationService.interpolateUrl(
        '/createhandler/statistics/<exploration_id>', {
          exploration_id: expId
        })).toPromise()
      .then((dict: ExplorationStatsBackendDict) => {
        return this.explorationStatsObjectFactory.createFromBackendDict(dict);
      });
  }
}

angular.module('oppia').factory(
  'ExplorationStatsBackendApiService',
  downgradeInjectable(ExplorationStatsBackendApiService));
