// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to retrieve information about exploration summaries
 * from the backend.
 */

import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

import {AppConstants} from 'app.constants';
import {AlertsService} from 'services/alerts.service';
import {
  LearnerExplorationSummary,
  LearnerExplorationSummaryBackendDict,
} from 'domain/summary/learner-exploration-summary.model';
import {ValidatorsService} from 'services/validators.service';

interface ExplorationSummaryBackendResponse {
  summaries: LearnerExplorationSummaryBackendDict[];
}

@Injectable({
  providedIn: 'root',
})
export class ExplorationSummaryBackendApiService {
  constructor(
    private httpClient: HttpClient,
    private alertsService: AlertsService,
    private validatorsService: ValidatorsService
  ) {}

  private _fetchExpSummaries(
    explorationIds: string[],
    includePrivateExplorations: boolean,
    successCallback: (value: LearnerExplorationSummary[]) => void,
    errorCallback: (reason: string | null[]) => void
  ): void {
    if (
      !explorationIds.every(expId =>
        this.validatorsService.isValidExplorationId(expId, true)
      )
    ) {
      this.alertsService.addWarning('Please enter a valid exploration ID.');
      let returnValue = [];
      for (let i = 0; i < explorationIds.length; i++) {
        returnValue.push(null);
      }
      errorCallback(returnValue);
      return;
    }
    const explorationSummaryDataUrl =
      AppConstants.EXPLORATION_SUMMARY_DATA_URL_TEMPLATE;
    this.httpClient
      .get<ExplorationSummaryBackendResponse>(explorationSummaryDataUrl, {
        params: {
          stringified_exp_ids: JSON.stringify(explorationIds),
          include_private_explorations: JSON.stringify(
            includePrivateExplorations
          ),
        },
      })
      .toPromise()
      .then(
        (response: ExplorationSummaryBackendResponse) => {
          if (response === null) {
            const summariesError =
              'Summaries fetched are null for explorationIds: ' +
              explorationIds;
            errorCallback(summariesError);
            return;
          }

          const summaries = response.summaries.map(summary =>
            LearnerExplorationSummary.createFromBackendDict(summary)
          );

          successCallback(summaries);
        },
        errorResponse => {
          errorCallback(errorResponse.error.error);
        }
      );
  }

  async loadPublicAndPrivateExplorationSummariesAsync(
    explorationIds: string[]
  ): Promise<LearnerExplorationSummary[]> {
    return new Promise((resolve, reject) => {
      this._fetchExpSummaries(explorationIds, true, resolve, reject);
    });
  }

  async loadPublicExplorationSummariesAsync(
    explorationIds: string[]
  ): Promise<LearnerExplorationSummary[]> {
    return new Promise((resolve, reject) => {
      this._fetchExpSummaries(explorationIds, false, resolve, reject);
    });
  }
}
