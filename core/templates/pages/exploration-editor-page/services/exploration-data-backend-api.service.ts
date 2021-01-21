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
 * @fileoverview Service for handling all http calls
 * with the exploration editor backend.
 */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { ExplorationChange } from 'domain/exploration/exploration-draft.model';
import { Observable } from 'rxjs';
import { DraftAutoSaveResponse } from './exploration-data.service';

@Injectable({
  providedIn: 'root'
})
export class ExplorationDataBackendApiService {
  constructor(private httpClient: HttpClient) {}

  discardDraft(url: string): Observable<void> {
    return this.httpClient.post<void>(
      url, {});
  }

  saveChangeList(
      url: string,
      changeList: ExplorationChange[],
      version: string): Observable<DraftAutoSaveResponse> {
    return this.httpClient.put<DraftAutoSaveResponse>(
      url, {
        change_list: changeList,
        version: version
      });
  }
}

angular.module('oppia').factory('ExplorationDataBackendApiService',
  downgradeInjectable(ExplorationDataBackendApiService));
