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

import { AppConstants } from 'app.constants';
import { ContributorDashboardConstants } from 'pages/contributor-dashboard-page/contributor-dashboard-page.constants';
import { Subscription } from 'rxjs';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';


export interface ExplorationOpportunity {
  id: string;
  labelText: string;
  labelColor: string;
  progressPercentage: number;
  subheading?: string;
  inReviewCount: number;
  totalCount: number;
  translationsCount: number;
  heading?: string;
  actionButtonTitle?: string;
  translationWordCount?: number;
  isPinned?: boolean;
  topicName: string;
}

@Component({
  selector: 'oppia-opportunities-list-item',
  templateUrl: './opportunities-list-item.component.html',
  styleUrls: []
})
export class OpportunitiesListItemComponent {
  constructor(
    private windowDimensionsService: WindowDimensionsService
  ) {}

  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() opportunity!: ExplorationOpportunity;
  @Input() opportunityHeadingTruncationLength!: number;
  @Input() opportunityType!: string;
  @Input() labelRequired: boolean = false;
  @Input() progressBarRequired: boolean = false;
  @Input() showOpportunityButton: boolean = true;
  @Input() showPinUnpinButton: boolean = false;

  labelText!: string;
  labelStyle!: { 'background-color': string };
  progressPercentage!: string;
  progressBarStyle!: { width: string };
  translatedProgressStyle!: { width: string };
  inReviewProgressStyle!: { width: string };
  untranslatedProgressStyle!: { width: string };
  targetNumQuestionsPerSkill: number = AppConstants.MAX_QUESTIONS_PER_SKILL;
  cardsAvailable: number = 0;
  onMobile!: boolean;
  resizeSubscription!: Subscription;
  mobileBreakpoint: number = (
    AppConstants.OPPORTUNITIES_LIST_ITEM_MOBILE_BREAKPOINT);

  @Output() clickActionButton: EventEmitter<string> = (
    new EventEmitter());

  @Output() clickPinButton: EventEmitter<{
    'topic_name': string;
    'exploration_id': string;
  }> = (
      new EventEmitter());

  @Output() clickUnpinButton: EventEmitter<{
    'topic_name': string;
    'exploration_id': string;
  }> = (
      new EventEmitter());

  pinOpportunity(): void {
    this.clickPinButton.emit({
      topic_name: this.opportunity.topicName,
      exploration_id: this.opportunity.id
    });
  }

  unpinOpportunity(): void {
    this.clickUnpinButton.emit({
      topic_name: this.opportunity.topicName,
      exploration_id: this.opportunity.id
    });
  }

  opportunityDataIsLoading: boolean = true;
  correspondingOpportunityDeleted: boolean = false;
  translationProgressBar: boolean = false;
  opportunityButtonDisabled: boolean = false;

  ngOnInit(): void {
    this.onMobile = (
      this.windowDimensionsService.getWidth() <= this.mobileBreakpoint);
    this.resizeSubscription = this.windowDimensionsService.getResizeEvent()
      .subscribe(event => {
        this.onMobile = (
          this.windowDimensionsService.getWidth() <= this.mobileBreakpoint);
      });

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
        this.progressPercentage =
          `${Math.floor(this.opportunity.progressPercentage)}%`;
        if (
          this.opportunityType ===
          AppConstants.OPPORTUNITY_TYPE_TRANSLATION
        ) {
          this.translationProgressBar = true;
          const translatedPercentage = (
            this.opportunity.translationsCount / this.opportunity.totalCount
          ) * 100;
          const inReviewTranslationsPercentage = (
            this.opportunity.inReviewCount / this.opportunity.totalCount
          ) * 100;
          const untranslatedPercentage = (
            100 - (translatedPercentage + inReviewTranslationsPercentage));

          this.cardsAvailable = (
            this.opportunity.totalCount -
              (
                this.opportunity.translationsCount +
                this.opportunity.inReviewCount
              )
          );

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

  ngOnDestroy(): void {
    if (this.resizeSubscription) {
      this.resizeSubscription.unsubscribe();
    }
  }
}

angular.module('oppia').directive(
  'oppiaOpportunitiesListItem', downgradeComponent(
    { component: OpportunitiesListItemComponent }));
