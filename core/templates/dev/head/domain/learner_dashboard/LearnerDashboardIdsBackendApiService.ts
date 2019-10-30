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
 * @fileoverview Backend services related to fetching the ids of the
 * activities present in the learner dashboard.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LearnerDashboardIdsBackendApiService {
  constructor(private http: HttpClient) {}

  _fetchLearnerDashboardIds(): Promise<Object> {
    // HttpClient returns an Observable, the toPromise converts it into a
    // Promise.
    return this.http.get('/learnerdashboardidshandler/data').toPromise();
  }

  fetchLearnerDashboardIds(): Promise<Object> {
    return this._fetchLearnerDashboardIds();
  }
}

angular.module('oppia').factory(
  'LearnerDashboardIdsBackendApiService',
  downgradeInjectable(LearnerDashboardIdsBackendApiService));
