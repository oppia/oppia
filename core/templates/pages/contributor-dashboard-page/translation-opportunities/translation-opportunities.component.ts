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
 * @fileoverview Component for the translation opportunities.
 */

import { Component, Injector } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { TranslationLanguageService } from 'pages/exploration-editor-page/translation-tab/services/translation-language.service';
import { ContextService } from 'services/context.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { UserService } from 'services/user.service';
import { TranslationModalContent, TranslationOpportunityDict } from 'pages/contributor-dashboard-page/modal-templates/translation-modal.component';
import { ContributionOpportunitiesService, ExplorationOpportunitiesDict } from '../services/contribution-opportunities.service';

@Component({
  selector: 'translation-opportunities',
  templateUrl: './translation-opportunities.component.html',
})
export class TranslationOpportunitiesComponent {
  allOpportunities: {[id: string]: TranslationOpportunityDict} = {};
  userIsLoggedIn = false;
  constructor(
    private readonly contextService: ContextService,
    private readonly contributionOpportunitiesService:
      ContributionOpportunitiesService,
    private readonly modalService: NgbModal,
    private readonly siteAnalyticsService: SiteAnalyticsService,
    private readonly translationLanguageService: TranslationLanguageService,
    private readonly urlInterpolationService: UrlInterpolationService,
    private readonly userService: UserService,
    private readonly injector: Injector
  ) {}

  getOpportunitySummary(expId: string): TranslationOpportunityDict {
    return this.allOpportunities[expId];
  }

  getPresentableOpportunitiesData(
      {opportunities, more}: ExplorationOpportunitiesDict): {
    opportunitiesDicts: TranslationOpportunityDict[];
    more: boolean;
  } {
    const opportunitiesDicts: TranslationOpportunityDict[] = [];
    for (let index in opportunities) {
      const opportunity = opportunities[index];
      const subheading = opportunity.getOpportunitySubheading();
      const heading = opportunity.getOpportunityHeading();
      const languageCode = (
        this.translationLanguageService.getActiveLanguageCode());
      const progressPercentage = (
        opportunity.getTranslationProgressPercentage(languageCode));
      const opportunityDict: TranslationOpportunityDict = {
        id: opportunity.getExplorationId(),
        heading: heading,
        subheading: subheading,
        progressPercentage: progressPercentage.toFixed(2),
        actionButtonTitle: 'Translate'
      };
      this.allOpportunities[opportunityDict.id] = opportunityDict;
      opportunitiesDicts.push(opportunityDict);
    }
    return {opportunitiesDicts, more};
  }

  onClickButton(expId: string): void {
    if (!this.userIsLoggedIn) {
      this.contributionOpportunitiesService.showRequiresLoginModal();
      return;
    }
    this.siteAnalyticsService.registerContributorDashboardSuggestEvent(
      'Translation');
    const opportunity = this.getOpportunitySummary(expId);
    this.modalService.open(
      TranslationModalContent, {
        size: 'lg',
        backdrop: 'static',
        injector: Injector.create({
          providers: [
            {provide: TranslationOpportunityDict, useValue: opportunity
            }
          ],
          parent: this.injector
        })
      });
  }

  ngOnInit(): void {
    this.userService.getUserInfoAsync().then((userInfo) => {
      this.userIsLoggedIn = userInfo.isLoggedIn();
    });
  }

  loadMoreOpportunities(): Promise<{
    opportunitiesDicts: TranslationOpportunityDict[];
    more: boolean;
  }> {
    return this.contributionOpportunitiesService
      .getMoreTranslationOpportunitiesAsync(
        this.translationLanguageService.getActiveLanguageCode())
      .then(this.getPresentableOpportunitiesData.bind(this));
  }

  loadOpportunities(): Promise<{
    opportunitiesDicts: TranslationOpportunityDict[];
    more: boolean;
  }> {
    return this.contributionOpportunitiesService
      .getTranslationOpportunitiesAsync(
        this.translationLanguageService.getActiveLanguageCode())
      .then(this.getPresentableOpportunitiesData.bind(this));
  }
}

angular.module('oppia').directive(
  'translationOpportunities', downgradeComponent(
    {component: TranslationOpportunitiesComponent}));

