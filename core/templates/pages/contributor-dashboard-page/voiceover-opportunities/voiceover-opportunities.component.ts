// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the voiceover opportunities.
 */

require(
  'pages/contributor-dashboard-page/opportunities-list/' +
  'opportunities-list.component.ts');

require(
  'pages/contributor-dashboard-page/services/' +
  'contribution-opportunities.service.ts');
require(
  'pages/exploration-editor-page/translation-tab/services/' +
  'translation-language.service.ts');

import { Component, OnDestroy, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { ExplorationOpportunitySummary } from 'domain/opportunity/exploration-opportunity-summary.model';
import { TranslationLanguageService } from 'pages/exploration-editor-page/translation-tab/services/translation-language.service';
import { Subscription } from 'rxjs';
import { TranslationOpportunity } from '../modal-templates/translation-modal.component';
import { ContributionOpportunitiesService } from '../services/contribution-opportunities.service';

@Component({
  selector: 'voiceover-opportunities',
  templateUrl: './voiceover-opportunities.component.html'
})
export class VoiceoverOpportunitiesComponent implements OnInit, OnDestroy {
  progressBarRequired: boolean;
  constructor(
    private contributionOpportunitiesService:
      ContributionOpportunitiesService,
    private translationLanguageService: TranslationLanguageService
  ) {}

  directiveSubscriptions = new Subscription();
  opportunities: TranslationOpportunity[];
  moreOpportunitiesAvailable: boolean;
  opportunitiesAreLoading: boolean;

  updateWithNewOpportunities(
      opportunities: ExplorationOpportunitySummary[], more: boolean): void {
    for (let index in opportunities) {
      let opportunity = opportunities[index];

      this.opportunities.push({
        heading: opportunity.getOpportunityHeading(),
        subheading: opportunity.getOpportunitySubheading(),
        actionButtonTitle: 'Request to Voiceover',
        // These are not used in the code, but needed as the type expects it.
        id: opportunity.getExplorationId(),
        progressPercentage: '',
        inReviewCount: 0,
        totalCount: 0,
        translationsCount: 0
      });
    }
    this.moreOpportunitiesAvailable = more;
    this.opportunitiesAreLoading = false;
  }

  onLoadMoreOpportunities(): void {
    if (
      !this.opportunitiesAreLoading &&
      this.moreOpportunitiesAvailable) {
      this.opportunitiesAreLoading = true;
      this.contributionOpportunitiesService.getMoreVoiceoverOpportunitiesAsync(
        this.translationLanguageService.getActiveLanguageCode()).then(
        (value) => this.updateWithNewOpportunities(
          value.opportunities, value.more));
    }
  }

  ngOnInit(): void {
    this.directiveSubscriptions.add(
      this.translationLanguageService.onActiveLanguageChanged.subscribe(
        () => {
          this.opportunities = [];
          this.opportunitiesAreLoading = true;
          this.contributionOpportunitiesService.getVoiceoverOpportunitiesAsync(
            this.translationLanguageService.getActiveLanguageCode()).then(
            (value) => this.updateWithNewOpportunities(
              value.opportunities, value.more));
        }
      )
    );
    this.opportunities = [];
    this.opportunitiesAreLoading = true;
    this.moreOpportunitiesAvailable = true;
    this.progressBarRequired = false;
    this.contributionOpportunitiesService.getVoiceoverOpportunitiesAsync(
      this.translationLanguageService.getActiveLanguageCode()).then(
      (value) => this.updateWithNewOpportunities(
        value.opportunities, value.more));
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}

angular.module('oppia').directive('voiceoverOpportunities',
  downgradeComponent({
    component: VoiceoverOpportunitiesComponent
  }) as angular.IDirectiveFactory);
