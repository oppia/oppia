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
 * @fileoverview Backend api service for fetching the learner data;
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AppConstants } from 'app.constants';

interface LearnerViewBackendDict {
  'summaries': string[];
}

interface LearnerViewResposne {
  summaries: string[];
}

@Injectable({
  providedIn: 'root'
})
export class LearnerViewInfoBackendApiService {
  constructor(
        private http: HttpClient
  ) {}

  async fetchLearnerInfoAsync(
      stringifiedExpIds: string,
      includePrivateExplorations: string): Promise<LearnerViewResposne> {
    return this.http.get<LearnerViewBackendDict>(
      AppConstants.EXPLORATION_SUMMARY_DATA_URL_TEMPLATE, {
        params: {
          stringified_exp_ids: stringifiedExpIds,
          include_private_explorations: includePrivateExplorations
        }}).toPromise();
  }
}

angular.module('oppia').factory(
  'LearnerViewInfoBackendApiService',
  downgradeInjectable(LearnerViewInfoBackendApiService));
