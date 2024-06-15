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
 * @fileoverview Backend api service for fetching and resolving contribution
 * and review stats.
 */

import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {ContributorStatsSummaryBackendDict} from './contribution-and-review-stats.service';

@Injectable({
  providedIn: 'root',
})
export class ContributionAndReviewStatsBackendApiService {
  private CONTRIBUTOR_STATS_SUMMARIES_URL =
    '/contributorstatssummaries/<contribution_type>/<contribution_subtype>' +
    '/<username>';

  private CONTRIBUTOR_ALL_STATS_SUMMARIES_URL =
    '/contributorallstatssummaries/<username>';

  constructor(
    private http: HttpClient,
    private urlInterpolationService: UrlInterpolationService
  ) {}

  async fetchContributionAndReviewStatsAsync(
    contributionType: string,
    contributionSubtype: string,
    username: string
  ): Promise<ContributorStatsSummaryBackendDict> {
    const url = this.urlInterpolationService.interpolateUrl(
      this.CONTRIBUTOR_STATS_SUMMARIES_URL,
      {
        contribution_type: contributionType,
        contribution_subtype: contributionSubtype,
        username: username,
      }
    );
    return this.http.get<ContributorStatsSummaryBackendDict>(url).toPromise();
  }

  async fetchAllContributionAndReviewStatsAsync(
    username: string
  ): Promise<ContributorStatsSummaryBackendDict> {
    const url = this.urlInterpolationService.interpolateUrl(
      this.CONTRIBUTOR_ALL_STATS_SUMMARIES_URL,
      {
        username: username,
      }
    );
    return this.http.get<ContributorStatsSummaryBackendDict>(url).toPromise();
  }
}
