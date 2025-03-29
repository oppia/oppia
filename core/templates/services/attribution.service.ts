// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to handle the attribution experience.
 */

import {ApplicationRef, Injectable} from '@angular/core';

import {ExplorationSummaryBackendApiService} from 'domain/summary/exploration-summary-backend-api.service';
import {HumanReadableContributorsSummary} from 'domain/summary/creator-exploration-summary.model';
import {ContextService} from 'services/context.service';

@Injectable({
  providedIn: 'root',
})
export class AttributionService {
  attributionModalIsShown: boolean = false;
  authors: string[] = [];
  explorationTitle: string = '';
  constructor(
    private applicationRef: ApplicationRef,
    private contextService: ContextService,
    private explorationSummaryBackendApiService: ExplorationSummaryBackendApiService
  ) {}

  init(): void {
    this.explorationSummaryBackendApiService
      .loadPublicAndPrivateExplorationSummariesAsync([
        this.contextService.getExplorationId(),
      ])
      .then(
        responseObject => {
          let summaries = responseObject.summaries;
          let contributorSummary = summaries.length
            ? summaries[0].human_readable_contributors_summary
            : ({} as HumanReadableContributorsSummary);
          this.authors = Object.keys(contributorSummary).sort(
            (contributorUsername1, contributorUsername2) => {
              let {num_commits: commitsOfContributor1} =
                contributorSummary[contributorUsername1];
              let {num_commits: commitsOfContributor2} =
                contributorSummary[contributorUsername2];
              return commitsOfContributor2 - commitsOfContributor1;
            }
          );
          this.explorationTitle = summaries.length ? summaries[0].title : '';
          this.applicationRef.tick();
        },
        () => {}
      );
  }

  isGenerateAttributionAllowed(): boolean {
    return this.contextService.isInExplorationPlayerPage();
  }

  showAttributionModal(): void {
    this.attributionModalIsShown = true;
  }

  hideAttributionModal(): void {
    this.attributionModalIsShown = false;
  }

  isAttributionModalShown(): boolean {
    return this.attributionModalIsShown;
  }

  getAuthors(): string[] {
    return this.authors;
  }

  getExplorationTitle(): string {
    return this.explorationTitle;
  }
}
