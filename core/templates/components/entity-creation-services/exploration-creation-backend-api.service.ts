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

interface ExplorationResponse {
  'exploration_id': string
}

@Injectable({
  providedIn: 'root'
})
export class ExplorationCreationBackendApiService {
  constructor(
    private http: HttpClient,
  ) {}

  registerNewExploration(): Promise<ExplorationResponse> {
    return this.http.post<ExplorationResponse>(
      '/contributehandler/create_new', {
      }).toPromise();
  }
}

angular.module('oppia').factory(
  'ExplorationCreationBackendApiService',
  downgradeInjectable(ExplorationCreationBackendApiService)
);
