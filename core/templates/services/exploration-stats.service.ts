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

import { ContextService } from 'services/context.service';
import { ExplorationStats } from
  'domain/statistics/ExplorationStatsObjectFactory';
import { ExplorationStatsBackendApiService } from
  'services/exploration-stats-backend-api.service';

@Injectable({
  providedIn: 'root'
})
export class ExplorationStatsService {
  private statsCache: Promise<ExplorationStats> = null;

  constructor(
      private contextService: ContextService,
      private explorationStatsBackendApiService:
        ExplorationStatsBackendApiService) {}

  getExplorationStats(): Promise<ExplorationStats> {
    if (this.statsCache === null) {
      this.statsCache = (
        this.explorationStatsBackendApiService.fetchExplorationStats(
          this.contextService.getExplorationId()));
    }
    return this.statsCache;
  }
}

angular.module('oppia').factory(
  'ExplorationStatsService', downgradeInjectable(ExplorationStatsService));
