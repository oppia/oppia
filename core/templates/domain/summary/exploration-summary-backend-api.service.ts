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

import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { AlertsService } from 'services/alerts.service';
import { ValidatorsService } from 'services/validators.service';
import { AppConstants } from 'app.constants';

@Injectable({
  providedIn: 'root'
})
export class ExplorationSummaryBackendApiService {
  constructor(
    private httpClient: HttpClient,
    private alertsService: AlertsService,
    private validatorsService: ValidatorsService) {}

  _fetchExpSummaries(explorationIds: Array<string>,
      includePrivateExplorations: boolean,
      successCallback: (value?: Object | PromiseLike<Object>) => void,
      errorCallback: (reason?: Array<string>) => void): void {
    if (!explorationIds.every(expId =>
      this.validatorsService.isValidExplorationId(expId, true))) {
      this.alertsService.addWarning('Please enter a valid exploration ID.');

      var returnValue = [];
      for (var i = 0; i < explorationIds.length; i++) {
        returnValue.push(null);
      }

      if (errorCallback) {
        errorCallback(returnValue);
      }
      return;
    }
    var explorationSummaryDataUrl =
    AppConstants.EXPLORATION_SUMMARY_DATA_URL_TEMPLATE;

    this.httpClient.get(explorationSummaryDataUrl, {
      params: {
        stringified_exp_ids: JSON.stringify(explorationIds),
        include_private_explorations: JSON.stringify(
          includePrivateExplorations)
      }
    }).toPromise().then((response: any) => {
      console.log(response);
      var summaries = angular.copy(response.data.summaries);
      if (successCallback) {
        if (summaries === null) {
          var summariesError = (
            'Summaries fetched are null for explorationIds: ' + explorationIds
          );
          throw new Error(summariesError);
        }
        successCallback(summaries);
      }
    }, (errorResponse) =>{
      if (errorCallback) {
        errorCallback(errorResponse);
      }
    });
  }

  loadPublicAndPrivateExplorationSummaries(
      explorationIds: Array<string>): Promise<Object> {
    return new Promise((resolve, reject) => {
      this._fetchExpSummaries(explorationIds, true, resolve, reject);
    });
  }

  loadPublicExplorationSummaries(
      explorationIds: Array<string>): Promise<Object> {
    return new Promise((resolve, reject) => {
      this._fetchExpSummaries(explorationIds, false, resolve, reject);
    });
  }
}

angular.module('oppia').factory(
  'ExplorationSummaryBackendApiService',
  downgradeInjectable(ExplorationSummaryBackendApiService));
