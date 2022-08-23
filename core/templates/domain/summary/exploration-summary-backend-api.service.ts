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

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

import { AppConstants } from 'app.constants';
import { AlertsService } from 'services/alerts.service';
import { HumanReadableContributorsSummary } from 'domain/summary/creator-exploration-summary.model';
import { ValidatorsService } from 'services/validators.service';

export interface ExplorationSummaryBackendDict {
  'summaries': ExplorationSummaryDict[];
}

export interface ExplorationSummaryDict {
  'category': string;
  'community_owned': boolean;
  'human_readable_contributors_summary': (
    HumanReadableContributorsSummary);
  'id': string;
  'language_code': string;
  'num_views': number;
  'objective': string;
  'status': string;
  'tags': [];
  'thumbnail_bg_color': string;
  'thumbnail_icon_url': string;
  'title': string;
}

@Injectable({
  providedIn: 'root'
})
export class ExplorationSummaryBackendApiService {
  constructor(
    private httpClient: HttpClient,
    private alertsService: AlertsService,
    private validatorsService: ValidatorsService) {}

  private _fetchExpSummaries(
      explorationIds: string[],
      includePrivateExplorations: boolean,
      successCallback: (value: ExplorationSummaryBackendDict) => void,
      errorCallback: (reason: string | null[]) => void): void {
    if (!explorationIds.every(expId =>
      this.validatorsService.isValidExplorationId(expId, true))) {
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
    this.httpClient.get<ExplorationSummaryBackendDict>(
      explorationSummaryDataUrl, {
        params: {
          stringified_exp_ids: JSON.stringify(explorationIds),
          include_private_explorations: JSON.stringify(
            includePrivateExplorations)
        }
      }
    ).toPromise().then((summaries: ExplorationSummaryBackendDict) => {
      if (summaries === null) {
        const summariesError = (
          'Summaries fetched are null for explorationIds: ' + explorationIds
        );
        errorCallback(summariesError);
      }
      successCallback(summaries);
    }, (errorResponse) =>{
      errorCallback(errorResponse.error.error);
    });
  }

  async loadPublicAndPrivateExplorationSummariesAsync(
      explorationIds: string[]): Promise<ExplorationSummaryBackendDict> {
    return new Promise((resolve, reject) => {
      this._fetchExpSummaries(explorationIds, true, resolve, reject);
    });
  }

  async loadPublicExplorationSummariesAsync(
      explorationIds: string[]): Promise<ExplorationSummaryBackendDict> {
    return new Promise((resolve, reject) => {
      this._fetchExpSummaries(explorationIds, false, resolve, reject);
    });
  }
}

angular.module('oppia').factory(
  'ExplorationSummaryBackendApiService',
  downgradeInjectable(ExplorationSummaryBackendApiService));
