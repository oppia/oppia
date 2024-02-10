// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the new lesson player sidebar
 */

import { Component, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { MobileMenuService } from '../new-lesson-player-services/mobile-menu.service';
import './player-sidebar.component.css';
import { ContextService } from 'services/context.service';
import { I18nLanguageCodeService, TranslationKeyType } from
  'services/i18n-language-code.service';
import { ReadOnlyExplorationBackendApiService } from 'domain/exploration/read-only-exploration-backend-api.service';
import { UrlService } from 'services/contextual/url.service';
import { ExplorationRatings } from 'domain/summary/learner-exploration-summary.model';
import { RatingComputationService } from 'components/ratings/rating-computation/rating-computation.service';
import { LearnerViewRatingBackendApiService } from 'pages/exploration-player-page/services/learner-view-rating-backend-api.service';

@Component({
  selector: 'oppia-player-sidebar',
  templateUrl: './player-sidebar.component.html',
  styleUrls: ['./player-sidebar.component.css'],
})
export class PlayerSidebarComponent implements OnInit {
  mobileMenuVisible: boolean;
  isExpanded = false;
  explorationId!: string;
  expDesc!: string;
  expDescTranslationKey!: string;
  avgRating!: number | null;
  fullStars: number;
  blankStars: number;
  ratings!: ExplorationRatings;

  constructor(
    private mobileMenuService: MobileMenuService,
    private contextService: ContextService,
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private readOnlyExplorationBackendApiService:
    ReadOnlyExplorationBackendApiService,
    private urlService: UrlService,
    private ratingComputationService: RatingComputationService,
    private learnerViewRatingBackendApiService:
    LearnerViewRatingBackendApiService,
  ) {}

  ngOnInit(): void {
    this.mobileMenuService.getMenuVisibility().subscribe((visibility) => {
      this.mobileMenuVisible = visibility;
    });
    this.explorationId = this.contextService.getExplorationId();
    this.setRatings();
    this.expDesc = 'Loading...';
    this.readOnlyExplorationBackendApiService.fetchExplorationAsync(
      this.explorationId,
      this.urlService.getExplorationVersionFromUrl(),
      this.urlService.getPidFromUrl())
      .then((response) => {
        this.expDesc = response.exploration.objective;
      });
    this.expDescTranslationKey = (
      this.i18nLanguageCodeService.
        getExplorationTranslationKey(
          this.explorationId, TranslationKeyType.DESCRIPTION)
    );
  }

  setRatings(): void {
    this.learnerViewRatingBackendApiService.getUserRatingAsync()
      .then(response => {
        this.ratings = {
          1: response.overall_ratings[1],
          2: response.overall_ratings[2],
          3: response.overall_ratings[3],
          4: response.overall_ratings[4],
          5: response.overall_ratings[5],
        };
        this.avgRating = this.getAverageRating();
        this.fullStars = this.avgRating ? Math.floor(this.avgRating) : 0;
        this.blankStars = 5 - this.fullStars;
      });
  }

  toggleSidebar(): void {
    this.isExpanded = !this.isExpanded;
  }

  isHackyExpDescTranslationDisplayed(): boolean {
    return (
      this.i18nLanguageCodeService.isHackyTranslationAvailable(
        this.expDescTranslationKey
      ) && !this.i18nLanguageCodeService.isCurrentLanguageEnglish()
    );
  }

  getAverageRating(): number | null {
    if (this.ratings) {
      return this.ratingComputationService.computeAverageRating(
        this.ratings);
    }
    return null;
  }

  getRange(count: number): number[] {
    return new Array(count).fill(0).map((_, i) => i);
  }

  calculateStarPath(index: number, isFilled: boolean): string {
    const x = isFilled ? index * 24 : (this.fullStars + index) * 24;
    return `M${x + 6.5784} ${20.4616}L${x + 7.93714} ${14.5877}
    L${x + 8.00498} ${14.2944}L${x + 7.77753} ${14.0972}L${x + 3.2200} ${10.146}
    L${x + 9.24324} ${9.62313}L${x + 9.543} ${9.59708}L${x + 9.66056} ${9.31965}
    L${x + 12} ${3.78436}L${x + 14.3394} ${9.31965}L${x + 14.4567} ${9.59708}
    L${x + 14.7568} ${9.62313}L${x + 20.78} ${10.146}L${x + 16.2225} ${14.0972}
    L${x + 15.995} ${14.2944}L${x + 16.063} ${14.5877}L${x + 17.4216} ${20.4616}
    L${x + 12.2583} ${17.3469}L${x + 12} ${17.1911}L${x + 11.7417} ${17.3469}
    L${x + 6.5784} ${20.4616}Z`;
  }
}

angular.module('oppia').directive('oppiaPlayerHeader',
  downgradeComponent({
    component: PlayerSidebarComponent
  }) as angular.IDirectiveFactory);
