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

import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {AppConstants} from 'app.constants';
import {LearnerExplorationSummaryBackendDict} from 'domain/summary/learner-exploration-summary.model';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';

interface LearnerViewBackendDict {
  summaries: LearnerExplorationSummaryBackendDict[];
}

@Injectable({
  providedIn: 'root',
})
export class LearnerViewInfoBackendApiService {
  constructor(
    private http: HttpClient,
    private i18nLanguageCodeService: I18nLanguageCodeService
  ) {}

  async fetchLearnerInfoAsync(
    stringifiedExpIds: string,
    includePrivateExplorations: string
  ): Promise<LearnerViewBackendDict> {
    return this.http
      .get<LearnerViewBackendDict>(
        AppConstants.EXPLORATION_SUMMARY_DATA_URL_TEMPLATE,
        {
          params: {
            stringified_exp_ids: stringifiedExpIds,
            include_private_explorations: includePrivateExplorations,
            // The lesson information card shows this metadata alongside the
            // lesson itself, so it is displayed in the learner's site
            // language.
            display_in_language_code:
              this.i18nLanguageCodeService.getCurrentI18nLanguageCode(),
          },
        }
      )
      .toPromise();
  }
}
