// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to retrieve information of learner dashboard from the
 * backend.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LearnerDashboardBackendApiService {
  constructor(private http: HttpClient) {}

  _fetchLearnerDashboardData(): Promise<Object> {
    // HttpClient returns an Observable, the toPromise converts it into a
    // Promise.
    return this.http.get('/learnerdashboardhandler/data').toPromise();
  }

  fetchLearnerDashboardData(): Promise<Object> {
    return this._fetchLearnerDashboardData();
  }
}

angular.module('oppia').factory(
  'LearnerDashboardBackendApiService',
  downgradeInjectable(LearnerDashboardBackendApiService));
