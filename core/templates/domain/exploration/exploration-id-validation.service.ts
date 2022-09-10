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
import { ReadOnlyExplorationBackendApiService, FetchExplorationBackendResponse } from
  './read-only-exploration-backend-api.service';
import constants from 'assets/constants';

@Injectable({
  providedIn: 'root'
})
export class ExplorationIdValidationService {
  constructor(
    private explorationSummaryBackendApiService:
      ExplorationSummaryBackendApiService,
    private readOnlyExplorationBackendApiService:
      ReadOnlyExplorationBackendApiService) {}

  async isExpPublishedAsync(explorationId: string): Promise<boolean> {
    return this.explorationSummaryBackendApiService.
      loadPublicExplorationSummariesAsync([explorationId]).then(
        (response: ExplorationSummaryBackendDict) => {
          let summaries = response.summaries;
          return (summaries.length === 1 && summaries[0] !== null);
        });
  }

  async isCorrectnessFeedbackEnabled(explorationId: string): Promise<boolean> {
    return this.readOnlyExplorationBackendApiService
      .fetchExplorationAsync(explorationId, null).then(
        (response: FetchExplorationBackendResponse) => {
          return response.correctness_feedback_enabled;
        });
  }

  async isDefaultCategoryAsync(explorationId: string): Promise<boolean> {
    return this.explorationSummaryBackendApiService
      .loadPublicExplorationSummariesAsync([explorationId]).then(
        (response: ExplorationSummaryBackendDict) => {
          let summaries = response.summaries;
          let isCategoryPresent = false;
          if (summaries.length === 1) {
            let category = summaries[0].category;
            for (let i of constants.ALL_CATEGORIES) {
              if (i === category) {
                isCategoryPresent = true;
              }
            }
          }
          return isCategoryPresent;
        });
  }
}

angular.module('oppia').factory(
  'ExplorationIdValidationService',
  downgradeInjectable(ExplorationIdValidationService));
