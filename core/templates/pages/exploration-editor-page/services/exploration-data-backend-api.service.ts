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
 * @fileoverview Service for handling all interactions
 * with the exploration-data backend.
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { ResolveAnswerResponse, ExplorationAutosaveChangeListRequest, ExplorationAutosaveChangeListResponse} from 'pages/exploration-editor-page/services/exploration-data.service';

@Injectable({
  providedIn: 'root'
})
export class ExplorationDataBackendApiService {
  constructor(private httpClient: HttpClient) {}

  setDiscardDraft(explorationDraftAutosaveUrl: string)
  : Promise<Object> {
    return new Promise((resolve, reject) => {
      return this.httpClient.post(
        explorationDraftAutosaveUrl, {})
        .toPromise().then(response => {
          resolve(response);
        }, errorResponse => {
          reject(errorResponse);
        });
    });
  }

  setResolveAnswer(
      resolveAnswerUrl: string,
      resolveAnswerDict: ResolveAnswerResponse)
    : Promise<Object> {
    return new Promise((resolve, reject) => {
      return this.httpClient.put(
        resolveAnswerUrl, resolveAnswerDict)
        .toPromise().then(response => {
          resolve(response);
        }, errorResponse => {
          reject(errorResponse);
        });
    });
  }

  setAutoSaveChangeList(
      autoSaveChangeListUrl: string,
      autoSaveChangeListRequest: ExplorationAutosaveChangeListRequest)
    : Promise<ExplorationAutosaveChangeListResponse> {
    return new Promise((resolve, reject) => {
      return this.httpClient.put<ExplorationAutosaveChangeListResponse>(
        autoSaveChangeListUrl, autoSaveChangeListRequest)
        .toPromise().then(response => {
          resolve(response);
        }, errorResponse =>{
          reject(errorResponse);
        });
    });
  }
}

angular.module('oppia').factory(
  'ExplorationDataBackendApiService',
  downgradeInjectable(ExplorationDataBackendApiService));
