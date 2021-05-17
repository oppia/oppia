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
 * @fileoverview Component for showing author/share footer
 * in exploration player.
 */

import { Component } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { ExplorationSummaryBackendApiService } from 'domain/summary/exploration-summary-backend-api.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { Subscription } from 'rxjs';
import { ContextService } from 'services/context.service';
import { UrlService } from 'services/contextual/url.service';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';

@Component({
  selector: 'oppia-exploration-footer',
  templateUrl: './exploration-footer.component.html'
})
export class ExplorationFooterComponent {
  explorationId: string;
  iframed: boolean;
  windowIsNarrow: boolean;
  contributorNames: string[] = [];
  resizeSubscription: Subscription;

  constructor(
    private contextService: ContextService,
    private explorationSummaryBackendApiService:
    ExplorationSummaryBackendApiService,
    private urlService: UrlService,
    private windowDimensionsService: WindowDimensionsService,
    private urlInterpolationService: UrlInterpolationService
  ) {}

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }

  ngOnInit(): void {
    this.explorationId = this.contextService.getExplorationId();
    this.iframed = this.urlService.isIframed();
    this.windowIsNarrow = this.windowDimensionsService.isWindowNarrow();
    this.resizeSubscription = this.windowDimensionsService.getResizeEvent()
      .subscribe(evt => {
        this.windowIsNarrow = this.windowDimensionsService.isWindowNarrow();
      });

    if (!this.contextService.isInQuestionPlayerMode() ||
        this.contextService.getQuestionPlayerIsManuallySet()) {
      this.explorationSummaryBackendApiService
        .loadPublicAndPrivateExplorationSummariesAsync([this.explorationId])
        .then((responseObject) => {
          let summaries = responseObject.summaries;
          if (summaries.length > 0) {
            let contributorSummary = (
              summaries[0].human_readable_contributors_summary);
            this.contributorNames = Object.keys(contributorSummary).sort(
              (contributorUsername1, contributorUsername2) => {
                let commitsOfContributor1 = contributorSummary[
                  contributorUsername1].num_commits;
                let commitsOfContributor2 = contributorSummary[
                  contributorUsername2].num_commits;
                return commitsOfContributor2 - commitsOfContributor1;
              }
            );
          }
        });
    }
  }

  ngOnDestroy(): void {
    if (this.resizeSubscription) {
      this.resizeSubscription.unsubscribe();
    }
  }
}

angular.module('oppia').directive('oppiaExplorationFooter',
  downgradeComponent({ component: ExplorationFooterComponent }));
