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
 * @fileoverview Service for managing exploration-level statistics.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { ExplorationStats } from
  'domain/statistics/exploration-stats.model';
import { ExplorationStatsBackendApiService } from
  'services/exploration-stats-backend-api.service';

@Injectable({
  providedIn: 'root'
})
export class ExplorationStatsService {
  // 'statsCache' will be null until the exploration stats are fetched from
  // the backend.
  private statsCache: Promise<ExplorationStats> | null = null;

  constructor(
      private explorationStatsBackendApiService:
        ExplorationStatsBackendApiService) {}

  async getExplorationStatsAsync(expId: string): Promise<ExplorationStats> {
    if (this.statsCache === null) {
      this.statsCache = (
        this.explorationStatsBackendApiService.fetchExplorationStatsAsync(
          expId));
    }
    return this.statsCache;
  }
}

angular.module('oppia').factory(
  'ExplorationStatsService', downgradeInjectable(ExplorationStatsService));
