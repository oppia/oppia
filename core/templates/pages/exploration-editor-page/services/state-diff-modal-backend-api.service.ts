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
 * @fileoverview Backend API for StateDiffModal.
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { downgradeInjectable } from '@angular/upgrade/static';
import { StateBackendDict } from 'domain/state/StateObjectFactory';

interface resInterface {
  yaml: string;
}

@Injectable({
  providedIn: 'root'
})
export class StateDiffModalBackendApiService {
  constructor(
    private http: HttpClient,
  ) {}

  async fetchYaml(
      stateDict: StateBackendDict, width: number, url: string
  ): Promise<resInterface> {
    return this.http.post<resInterface>(url, {
      state_dict: stateDict,
      width: width
    }).toPromise();
  }
}

angular.module('oppia').factory(
  'StateDiffModalBackendApiService',
  downgradeInjectable(StateDiffModalBackendApiService));
