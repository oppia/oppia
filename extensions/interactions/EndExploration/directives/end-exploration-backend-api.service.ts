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
 * @fileoverview Backend api service for End Exploration;
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AppConstants } from 'app.constants';

export interface RecommendExplorationBackendDict {
  summaries: RecommendExplorationDict[];
}

export interface RecommendExplorationDict {
  id: string;
}

@Injectable({
  providedIn: 'root'
})
export class EndExplorationBackendApiService {
  constructor(private http: HttpClient) {}

  getRecommendExplorationsData(
      authorRecommendedExplorationIds: string[]
  ): Promise<RecommendExplorationBackendDict> {
    return this.http.get<RecommendExplorationBackendDict>(
      AppConstants.EXPLORATION_SUMMARY_DATA_URL_TEMPLATE, {
        params: {
          stringified_exp_ids: JSON.stringify(
            authorRecommendedExplorationIds)
        }
      }).toPromise();
  }
}
