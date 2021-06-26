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
import { ContributionOpportunitiesService } from '../services/contribution-opportunities.service';
import { ExplorationOpportunity } from '../opportunities-list-item/opportunities-list-item.component';
import constants from 'assets/constants';
import { Subscription } from 'rxjs';

@Component({
  selector: 'oppia-opportunities-list',
  templateUrl: './opportunities-list.component.html',
  styleUrls: []
})
export class OpportunitiesListComponent {
  @Input() loadOpportunities: () => Promise<{
    opportunitiesDicts: ExplorationOpportunity[], more: boolean}>;
  @Input() labelRequired: boolean;
  @Input() progressBarRequired: boolean;
  @Input() loadMoreOpportunities;
  @Output() clickActionButton: EventEmitter<string> = (
    new EventEmitter()
  );
  @Input() opportunityHeadingTruncationLength: number;

  loadingOpportunityData: boolean = true;
  lastPageNumber: number = 1000;
  opportunities: ExplorationOpportunity[] = [];
  visibleOpportunities = [];
  directiveSubscriptions = new Subscription();
  activePageNumber: number = 1;
  OPPORTUNITIES_PAGE_SIZE = constants.OPPORTUNITIES_PAGE_SIZE;

  constructor(
    private zone: NgZone,
    private readonly contributionOpportunitiesService:
      ContributionOpportunitiesService,
    private readonly translationLanguageService: TranslationLanguageService) {
    this.directiveSubscriptions.add(
      this.translationLanguageService.onActiveLanguageChanged.subscribe(
        () => this.ngOnInit()));

    this.directiveSubscriptions.add(
      this.contributionOpportunitiesService
        .reloadOpportunitiesEventEmitter.subscribe(() => this.ngOnInit()));

    this.directiveSubscriptions.add(
      this.contributionOpportunitiesService
        .removeOpportunitiesEventEmitter.subscribe((opportunityIds) => {
          this.opportunities = this.opportunities.filter((opportunity) => {
            return opportunityIds.indexOf(opportunity.id) < 0;
          });
          this.visibleOpportunities = this.opportunities.slice(
            0, this.OPPORTUNITIES_PAGE_SIZE);
          this.lastPageNumber = Math.ceil(
            this.opportunities.length / this.OPPORTUNITIES_PAGE_SIZE);
        }));
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }

  ngOnInit(): void {
    this.loadOpportunities().then(({opportunitiesDicts, more}) => {
      // This ngZone run closure will not be required after \
      // migration is complete.
      this.zone.run(() => {
        this.opportunities = opportunitiesDicts;
        // "more" returned from GAE storage is not always reliable if true.
        // TODO(#11900): The following may not work if the last fetched
        // page size == OPPORTUNITIES_PAGE_SIZE. Come up with a more
        // robust solution.
        more = more &&
        opportunitiesDicts.length === this.OPPORTUNITIES_PAGE_SIZE;
        this.visibleOpportunities = this.opportunities.slice(
          0, this.OPPORTUNITIES_PAGE_SIZE);
        this.lastPageNumber = more ? this.lastPageNumber : Math.ceil(
          this.opportunities.length / this.OPPORTUNITIES_PAGE_SIZE);
        this.loadingOpportunityData = false;
      });
    });
  }

  gotoPage(pageNumber: number): void {
    const startIndex = (pageNumber - 1) * this.OPPORTUNITIES_PAGE_SIZE;
    const endIndex = pageNumber * this.OPPORTUNITIES_PAGE_SIZE;
    if (startIndex >= this.opportunities.length) {
      this.visibleOpportunities = [];
      this.loadingOpportunityData = true;
      this.loadMoreOpportunities().then(
        ({opportunitiesDicts, more}) => {
          this.opportunities = this.opportunities.concat(opportunitiesDicts);
          // "more" returned from GAE storage is not always reliable if
          // true.
          // TODO(#11900): The following may not work if the last fetched
          // page size == OPPORTUNITIES_PAGE_SIZE. Come up with a more
          // robust solution.
          more = (
            more && opportunitiesDicts.length === this.OPPORTUNITIES_PAGE_SIZE);
          this.visibleOpportunities = this.opportunities.slice(
            startIndex, endIndex);
          this.lastPageNumber = more ? this.lastPageNumber : Math.ceil(
            this.opportunities.length / this.OPPORTUNITIES_PAGE_SIZE);
          this.loadingOpportunityData = false;
        });
    } else {
      this.visibleOpportunities =
        this.opportunities.slice(startIndex, endIndex);
    }
    this.activePageNumber = pageNumber;
  }
}

angular.module('oppia').directive(
  'oppiaOpportunitiesList', downgradeComponent(
    {component: OpportunitiesListComponent}));
