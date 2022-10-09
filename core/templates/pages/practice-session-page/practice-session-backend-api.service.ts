// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to get data of Practice Sessions page.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

interface PracticeSessionsData {
  skill_ids_to_descriptions_map: Record<string, string>;
  topic_name: string;
}

@Injectable({
  providedIn: 'root'
})
export class PracticeSessionsBackendApiService {
  constructor(
     private http: HttpClient,
  ) {}

  async _fetchPracticeSessionsData(practiceSessionsDataUrl: string):
     Promise<PracticeSessionsData> {
    return this.http.get<PracticeSessionsData>(
      practiceSessionsDataUrl
    ).toPromise().then(backendResponse => {
      return backendResponse;
    }, errorResponse => {
      throw new Error(errorResponse.error.error);
    });
  }

  async fetchPracticeSessionsData(storyUrlFragment: string):
     Promise<PracticeSessionsData> {
    return this._fetchPracticeSessionsData(storyUrlFragment);
  }
}

angular.module('oppia').factory(
  'PracticeSessionsBackendApiService',
  downgradeInjectable(PracticeSessionsBackendApiService));
