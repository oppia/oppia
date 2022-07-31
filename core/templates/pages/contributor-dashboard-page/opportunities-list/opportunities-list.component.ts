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
 * @fileoverview Component for the list view of opportunities.
 */

import { Component, Input, Output, EventEmitter, NgZone } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

import { TranslationLanguageService } from 'pages/exploration-editor-page/translation-tab/services/translation-language.service';
import { TranslationTopicService } from 'pages/exploration-editor-page/translation-tab/services/translation-topic.service';
import { ContributionOpportunitiesService } from '../services/contribution-opportunities.service';
import { ExplorationOpportunity } from '../opportunities-list-item/opportunities-list-item.component';
import constants from 'assets/constants';
import { Subscription } from 'rxjs';

type ExplorationOpportunitiesFetcherFunction = () => Promise<{
  opportunitiesDicts: ExplorationOpportunity[];
  more: boolean;
}>;

@Component({
  selector: 'oppia-opportunities-list',
  templateUrl: './opportunities-list.component.html',
  styleUrls: []
})
export class OpportunitiesListComponent {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() loadOpportunities!: ExplorationOpportunitiesFetcherFunction;
  @Input() loadMoreOpportunities!: ExplorationOpportunitiesFetcherFunction;
  @Input() opportunityHeadingTruncationLength!: number;
  @Input() opportunityType!: string;

  @Input() labelRequired: boolean = false;
  @Input() progressBarRequired: boolean = false;

  @Input() showOpportunityButton: boolean = true;

  @Output() clickActionButton: EventEmitter<string> = (
    new EventEmitter()
  );


  loadingOpportunityData: boolean = true;
  opportunities: ExplorationOpportunity[] = [];
  visibleOpportunities: ExplorationOpportunity[] = [];
  directiveSubscriptions = new Subscription();
  activePageNumber: number = 1;
  OPPORTUNITIES_PAGE_SIZE = constants.OPPORTUNITIES_PAGE_SIZE;
  more: boolean = false;
  userIsOnLastPage: boolean = true;

  constructor(
    private zone: NgZone,
    private readonly contributionOpportunitiesService:
      ContributionOpportunitiesService,
    private readonly translationLanguageService: TranslationLanguageService,
    private readonly translationTopicService: TranslationTopicService) {
    this.init();
  }

  init(): void {
    this.directiveSubscriptions.add(
      this.translationLanguageService.onActiveLanguageChanged.subscribe(
        () => this.ngOnInit()));

    this.directiveSubscriptions.add(
      this.translationTopicService.onActiveTopicChanged.subscribe(
        () => this.ngOnInit()));

    this.directiveSubscriptions.add(
      this.contributionOpportunitiesService
        .reloadOpportunitiesEventEmitter.subscribe(() => this.ngOnInit()));

    this.directiveSubscriptions.add(
      this.contributionOpportunitiesService
        .removeOpportunitiesEventEmitter.subscribe((opportunityIds) => {
          if (opportunityIds.length === 0) {
            return;
          }
          this.opportunities = this.opportunities.filter((opportunity) => {
            return opportunityIds.indexOf(opportunity.id) < 0;
          });
          this.visibleOpportunities = this.opportunities.slice(
            0, this.OPPORTUNITIES_PAGE_SIZE);
          this.userIsOnLastPage = this.calculateUserIsOnLastPage(
            this.opportunities,
            this.OPPORTUNITIES_PAGE_SIZE,
            this.activePageNumber,
            this.more);
        }));
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }

  ngOnInit(): void {
    this.loadingOpportunityData = true;
    this.activePageNumber = 1;
    this.loadOpportunities().then(({opportunitiesDicts, more}) => {
      // This ngZone run closure will not be required after \
      // migration is complete.
      this.zone.run(() => {
        this.opportunities = opportunitiesDicts;
        this.more = more;
        this.visibleOpportunities = this.opportunities.slice(
          0, this.OPPORTUNITIES_PAGE_SIZE);
        this.userIsOnLastPage = this.calculateUserIsOnLastPage(
          this.opportunities,
          this.OPPORTUNITIES_PAGE_SIZE,
          this.activePageNumber,
          this.more);
        this.loadingOpportunityData = false;
      });
    });
  }

  gotoPage(pageNumber: number): void {
    const startIndex = (pageNumber - 1) * this.OPPORTUNITIES_PAGE_SIZE;
    const endIndex = pageNumber * this.OPPORTUNITIES_PAGE_SIZE;
    // Load new opportunities based on endIndex as the backend can return
    // opportunities greater than the page size. See issue #14004.
    if (endIndex >= this.opportunities.length && this.more) {
      this.visibleOpportunities = [];
      this.loadingOpportunityData = true;
      this.loadMoreOpportunities().then(
        ({opportunitiesDicts, more}) => {
          this.more = more;
          this.opportunities = this.opportunities.concat(opportunitiesDicts);
          this.visibleOpportunities = this.opportunities.slice(
            startIndex, endIndex);
          this.userIsOnLastPage = this.calculateUserIsOnLastPage(
            this.opportunities,
            this.OPPORTUNITIES_PAGE_SIZE,
            pageNumber,
            this.more);
          this.loadingOpportunityData = false;
        });
    } else {
      this.visibleOpportunities = this.opportunities.slice(
        startIndex, endIndex);
    }
    this.activePageNumber = pageNumber;
  }

  calculateUserIsOnLastPage(
      opportunities: ExplorationOpportunity[],
      pageSize: number,
      activePageNumber: number,
      moreResults: boolean): boolean {
    const lastPageNumber = Math.ceil(opportunities.length / pageSize);
    return activePageNumber >= lastPageNumber && !moreResults;
  }
}

angular.module('oppia').directive(
  'oppiaOpportunitiesList', downgradeComponent(
    {component: OpportunitiesListComponent}));
