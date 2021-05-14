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
 * @fileoverview Service to validate exploration id
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import { ExplorationSummaryBackendApiService, ExplorationSummaryBackendDict } from
  'domain/summary/exploration-summary-backend-api.service';

@Injectable({
  providedIn: 'root'
})
export class ExplorationIdValidationService {
  constructor(
    private explorationSummartBackendApiService:
      ExplorationSummaryBackendApiService) {}

  async isExpPublishedAsync(explorationId: string): Promise<boolean> {
    return this.explorationSummartBackendApiService.
      loadPublicExplorationSummariesAsync([explorationId]).then(
        (response: ExplorationSummaryBackendDict) => {
          let summaries = response.summaries;
          return (summaries.length === 1 && summaries[0] !== null);
        });
  }
}

angular.module('oppia').factory(
  'ExplorationIdValidationService',
  downgradeInjectable(ExplorationIdValidationService));
