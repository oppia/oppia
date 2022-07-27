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
 * @fileoverview Backend api service for history tab component;
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

interface HistoryTabBackendDict {
  'summaries': string[];
}

interface HistoryTabResponse {
  summaries: string[];
}

interface HistoryTabCheckRevertValidBackendDict {
  'valid': boolean;
  'details': string | null;
}

interface HistoryTabCheckRevertValidResponse {
  valid: boolean;
  details: string | null;
}

interface HistoryTabData{
  revertExplorationUrl: string;
  currentVersion: number;
  revertToVersion: number;
}

@Injectable({
  providedIn: 'root'
})
export class HistoryTabBackendApiService {
  constructor(
        private http: HttpClient
  ) {}

  getData(explorationAllSnapshotsUrl: string): Promise<HistoryTabResponse> {
    return this.http.get<HistoryTabBackendDict>(
      explorationAllSnapshotsUrl
    ).toPromise();
  }

  getCheckRevertValidData(revertExplorationUrl: string):
      Promise<HistoryTabCheckRevertValidResponse> {
    return this.http.get<HistoryTabCheckRevertValidBackendDict>(
      revertExplorationUrl).toPromise();
  }

  postData(data: HistoryTabData): Promise<HistoryTabResponse> {
    return this.http.post<HistoryTabBackendDict>(
      data.revertExplorationUrl,
      {
        current_version: data.currentVersion,
        revert_to_version: data.revertToVersion
      }
    ).toPromise();
  }
}

angular.module('oppia').factory(
  'HistoryTabBackendApiService',
  downgradeInjectable(HistoryTabBackendApiService));
