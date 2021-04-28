// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Functionality for the create exploration button and upload
 * modal.
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';

interface ExplorationCreationBackendDict {
  'exploration_id': string
}

interface ExplorationCreationResponse {
  explorationId: string
}

@Injectable({
  providedIn: 'root'
})
export class ExplorationCreationBackendApiService {
  constructor(private http: HttpClient) {}

  private _createExploration(
      successCallback: (value: ExplorationCreationResponse) => void,
      errorCallback: (reason: string) => void): void {
    this.http.post<ExplorationCreationBackendDict>(
      '/contributehandler/create_new', {}).toPromise()
      .then(response => {
        if (successCallback) {
          successCallback({
            explorationId: response.exploration_id
          });
        }
      }, errorResponse => {
        if (errorCallback) {
          errorCallback(errorResponse.error.error);
        }
      });
  }

  async registerNewExplorationAsync(): Promise<ExplorationCreationResponse> {
    return new Promise((resolve, reject) => {
      this._createExploration(resolve, reject);
    });
  }
}

angular.module('oppia').factory(
  'ExplorationCreationBackendApiService',
  downgradeInjectable(ExplorationCreationBackendApiService)
);
