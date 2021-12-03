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
import { QuestionPlayerStateService } from 'components/question-directives/question-player/services/question-player-state.service';
import { ExplorationSummaryBackendApiService } from 'domain/summary/exploration-summary-backend-api.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { Subscription } from 'rxjs';
import { ContextService } from 'services/context.service';
import { UrlService } from 'services/contextual/url.service';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';

@Component({
  selector: 'oppia-exploration-footer',
  templateUrl: './exploration-footer.component.html'
})
export class ExplorationFooterComponent {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion, for more information see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  explorationId!: string;
  iframed!: boolean;
  windowIsNarrow!: boolean;
  resizeSubscription!: Subscription;
  contributorNames: string[] = [];
  hintsAndSolutionsAreSupported: boolean = true;

  constructor(
    private contextService: ContextService,
    private explorationSummaryBackendApiService:
    ExplorationSummaryBackendApiService,
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private urlService: UrlService,
    private windowDimensionsService: WindowDimensionsService,
    private urlInterpolationService: UrlInterpolationService,
    private questionPlayerStateService: QuestionPlayerStateService
  ) {}

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }

  ngOnInit(): void {
    // TODO(#13494): Implement a different footer for practice-session-page.
    // This component is used at 'exploration-player-page' and
    // 'practice-session-page' with different usage at both places.
    // 'contextService.getExplorationId()' throws an error when this component
    // is used at 'practice-session-page' because the author profiles section
    // does not exist and the URL does not contain a valid explorationId.
    // Try-catch is for catching the error thrown from context-service so
    // that the component behaves properly at both the places.
    try {
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
    } catch (err) { }

    if (this.contextService.isInQuestionPlayerMode()) {
      this.questionPlayerStateService.resultsPageIsLoadedEventEmitter
        .subscribe((resultsLoaded: boolean) => {
          this.hintsAndSolutionsAreSupported = !resultsLoaded;
        });
    }
  }

  ngOnDestroy(): void {
    if (this.resizeSubscription) {
      this.resizeSubscription.unsubscribe();
    }
  }

  isLanguageRTL(): boolean {
    return this.i18nLanguageCodeService.isCurrentLanguageRTL();
  }
}

angular.module('oppia').directive('oppiaExplorationFooter',
  downgradeComponent({ component: ExplorationFooterComponent }));
