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
 * @fileoverview Backend Api Service for learner local nav.
 */

import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {ExplorationPlayerConstants} from '../exploration-player-page.constants';
import {FlagExplorationModalResult} from '../modals/flag-exploration-modal.component';

@Injectable({
  providedIn: 'root',
})
export class LearnerLocalNavBackendApiService {
  // These properties are initialized using postReportAsync method and we
  // need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  flagExplorationUrl!: string;

  constructor(
    private httpClient: HttpClient,
    private urlInterpolationService: UrlInterpolationService
  ) {}

  async postReportAsync(
    explorationId: string,
    result: FlagExplorationModalResult
  ): Promise<Object> {
    this.flagExplorationUrl = this.urlInterpolationService.interpolateUrl(
      ExplorationPlayerConstants.FLAG_EXPLORATION_URL_TEMPLATE,
      {
        exploration_id: explorationId,
      }
    );
    let report =
      '[' +
      result.state +
      '] (' +
      result.report_type +
      ')' +
      result.report_text;
    return this.httpClient
      .post(this.flagExplorationUrl, {
        report_text: report,
      })
      .toPromise();
  }
}
