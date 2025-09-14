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

import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {ExplorationSnapshot} from '../history-tab/services/version-tree.service';

export interface HistoryTabDict {
  summaries: string[];
  snapshots: ExplorationSnapshot[];
}

interface HistoryTabCheckRevertValidDict {
  valid: boolean;
  details: string;
}

interface HistoryTabData {
  revertExplorationUrl: string;
  currentVersion: number;
  revertToVersion: number;
}

@Injectable({
  providedIn: 'root',
})
export class HistoryTabBackendApiService {
  constructor(private http: HttpClient) {}

  getData(explorationAllSnapshotsUrl: string): Promise<HistoryTabDict> {
    return this.http
      .get<HistoryTabDict>(explorationAllSnapshotsUrl)
      .toPromise();
  }

  getCheckRevertValidData(
    revertExplorationUrl: string
  ): Promise<HistoryTabCheckRevertValidDict> {
    return this.http
      .get<HistoryTabCheckRevertValidDict>(revertExplorationUrl)
      .toPromise();
  }

  postData(data: HistoryTabData): Promise<HistoryTabDict> {
    return this.http
      .post<HistoryTabDict>(data.revertExplorationUrl, {
        current_version: data.currentVersion,
        revert_to_version: data.revertToVersion,
      })
      .toPromise();
  }
}
