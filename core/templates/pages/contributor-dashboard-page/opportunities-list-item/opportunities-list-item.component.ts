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
 * @fileoverview Component for the item view of an opportunity.
 */

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

import constants from 'assets/constants';
import { ContributorDashboardConstants } from 'pages/contributor-dashboard-page/contributor-dashboard-page.constants';

export interface ExplorationOpportunity {
  id: string;
  labelText: string;
  labelColor: string;
  progressPercentage: number;
  subheading?: string;
  inReviewCount: number;
  totalCount: number;
  translationsCount: number;
}

@Component({
  selector: 'oppia-opportunities-list-item',
  templateUrl: './opportunities-list-item.component.html',
  styleUrls: []
})
export class OpportunitiesListItemComponent {
  @Input() opportunity: ExplorationOpportunity;
  @Output() clickActionButton: EventEmitter<string> = (
    new EventEmitter());
  @Input() labelRequired: boolean;
  @Input() progressBarRequired: boolean;
  @Input() opportunityHeadingTruncationLength: number;
  @Input() opportunityType: string;

  opportunityDataIsLoading: boolean = true;
  labelText: string;
  labelStyle: { 'background-color': string };
  progressPercentage: string;
  progressBarStyle: { width: string };
  translatedProgressStyle: { width: string };
  inReviewProgressStyle: { width: string };
  untranslatedProgressStyle: { width: string };
  correspondingOpportunityDeleted: boolean = false;
  translationProgressBar: boolean = false;
  opportunityButtonDisabled: boolean = false;

  ngOnInit(): void {
    if (this.opportunity && this.labelRequired) {
      this.labelText = this.opportunity.labelText;
      this.labelStyle = {
        'background-color': this.opportunity.labelColor
      };
    }

    if (!this.opportunityHeadingTruncationLength) {
      this.opportunityHeadingTruncationLength = 40;
    }
    if (this.opportunity) {
      if (this.opportunity.progressPercentage) {
        this.progressPercentage = (
          this.opportunity.progressPercentage + '%');
        if (this.opportunityType === constants.OPPORTUNITY_TYPE_TRANSLATION) {
          this.translationProgressBar = true;
          const translatedPercentage = (
            this.opportunity.translationsCount / this.opportunity.totalCount
          ) * 100;
          const inReviewTranslationsPercentage = (
            this.opportunity.inReviewCount / this.opportunity.totalCount
          ) * 100;
          const untranslatedPercentage = (
            100 - (translatedPercentage + inReviewTranslationsPercentage));

          this.translatedProgressStyle = { width: translatedPercentage + '%' };
          this.untranslatedProgressStyle = {
            width: untranslatedPercentage + '%'
          };
          this.inReviewProgressStyle = {
            width: inReviewTranslationsPercentage + '%'
          };
          this.opportunityButtonDisabled = (
            this.opportunity.translationsCount +
            this.opportunity.inReviewCount === this.opportunity.totalCount);
        } else {
          this.progressBarStyle = { width: this.progressPercentage };
        }
      }
      this.opportunityDataIsLoading = false;
      if (this.opportunity.subheading ===
          ContributorDashboardConstants
            .CORRESPONDING_DELETED_OPPORTUNITY_TEXT) {
        this.correspondingOpportunityDeleted = true;
      }
    } else {
      this.opportunityDataIsLoading = true;
    }
  }
}

angular.module('oppia').directive(
  'oppiaOpportunitiesListItem', downgradeComponent(
    { component: OpportunitiesListItemComponent }));
