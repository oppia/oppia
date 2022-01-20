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
import { HumanReadableContributorsSummary } from 'domain/summary/creator-exploration-summary.model';

export interface ExplorationSummaryBackendDict {
  'summaries': ExplorationSummaryDict[];
}

export interface ExplorationSummaryDict {
  'category': string;
  'community_owned': boolean;
  'human_readable_contributors_summary': (
    HumanReadableContributorsSummary);
  'id': string;
  'language_code': string;
  'num_views': number;
  'objective': string;
  'status': string;
  'tags': [];
  'thumbnail_bg_color': string;
  'thumbnail_icon_url': string;
  'title': string;
}

@Injectable({
  providedIn: 'root'
})
export class EndExplorationBackendApiService {
  constructor(
        private http: HttpClient
  ) {}

  getRecommendExplorationsData(
      explorationSummaryDataUrl: string,
      authorRecommendedExplorationIds: string[]):
        Promise<ExplorationSummaryBackendDict> {
    return this.http.get<ExplorationSummaryBackendDict>(
      explorationSummaryDataUrl, {
        params: {
          stringified_exp_ids: JSON.stringify(
            authorRecommendedExplorationIds)
        }
      }).toPromise();
  }
}
