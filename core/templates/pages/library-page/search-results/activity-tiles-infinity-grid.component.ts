// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for an infinitely-scrollable view of activity tiles
 */

import { Subscription } from 'rxjs';
import { SearchService } from 'services/search.service';
import { downgradeComponent } from '@angular/upgrade/static';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { LoaderService } from 'services/loader.service';
import { ExplorationSummaryBackendDict } from 'domain/summary/exploration-summary-backend-api.service';
@Component({
  selector: 'activity-tiles-infinity-grid',
  templateUrl: './activity-tiles-infinity-grid.component.html'
})

export class ActivityTilesInfinityGridComponent implements OnInit, OnDestroy {
  loadingMessage: string = '';
  endOfPageIsReached: boolean;
  directiveSubscriptions: Subscription = new Subscription();
  allActivitiesInOrder: ExplorationSummaryBackendDict[];
  libraryWindowIsNarrow: boolean;
  searchResultsAreLoading: boolean;
  constructor(
    private loaderService: LoaderService,
    private searchService: SearchService,
    private windowDimensionsService: WindowDimensionsService,
  ) {}

  showMoreActivities() {
    if (!this.loadingMessage && !this.endOfPageIsReached) {
      this.searchResultsAreLoading = true;
      this.searchService.loadMoreData((data, endOfPageIsReached) => {
        this.allActivitiesInOrder = (
          this.allActivitiesInOrder.concat(
            data.activity_list));
        this.endOfPageIsReached = endOfPageIsReached;
        this.searchResultsAreLoading = false;
      }, (endOfPageIsReached) => {
        this.endOfPageIsReached = endOfPageIsReached;
        this.searchResultsAreLoading = false;
      });
    }
  };

  ngOnInit(): void {
    this.directiveSubscriptions.add(
      this.loaderService.onLoadingMessageChange.subscribe(
        (message: string) => this.loadingMessage = message));
    // Called when the first batch of search results is retrieved from
    // the server.
    this.directiveSubscriptions.add(
      this.searchService.onInitialSearchResultsLoaded.subscribe(
        (activityList) => {
          this.allActivitiesInOrder = activityList;
          this.endOfPageIsReached = false;
        })
    );
    this.endOfPageIsReached = false;
    this.allActivitiesInOrder = [];
    var libraryWindowCutoffPx = 530;
    this.libraryWindowIsNarrow = (
      this.windowDimensionsService.getWidth() <= libraryWindowCutoffPx);

    this.directiveSubscriptions.add(
      this.windowDimensionsService.getResizeEvent().subscribe(evt => {
        this.libraryWindowIsNarrow = (
          this.windowDimensionsService.getWidth() <= libraryWindowCutoffPx);
      })
    );
  };

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  };
}

angular.module('oppia').directive(
  'activityTilesInfinityGrid', downgradeComponent({component: ActivityTilesInfinityGridComponent }));
