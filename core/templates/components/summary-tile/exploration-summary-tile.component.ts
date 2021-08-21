// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for an exploration summary tile.
 */

import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

import constants from 'assets/constants';
import { RatingComputationService } from 'components/ratings/rating-computation/rating-computation.service';
import { ExplorationRatings } from 'domain/summary/learner-exploration-summary.model';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { UrlService } from 'services/contextual/url.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { DateTimeFormatService } from 'services/date-time-format.service';
import { UserService } from 'services/user.service';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { Subscription } from 'rxjs';
import { HumanReadableContributorsSummary } from 'domain/summary/creator-exploration-summary.model';

@Component({
  selector: 'oppia-exploration-summary-tile',
  templateUrl: './exploration-summary-tile.component.html',
})
export class ExplorationSummaryTileComponent implements OnInit, OnDestroy {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion, for more information see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  @Input() getCollectionId!: string;
  @Input() getExplorationId!: string;
  @Input() getExplorationTitle!: string;
  @Input() getStoryNodeId!: string;
  @Input() getLastUpdatedMsec!: number;
  @Input() getNumViews!: string;
  @Input() getObjective!: string;
  @Input() getCategory!: string;
  @Input() getRatings!: ExplorationRatings;
  @Input() getContributorsSummary!: HumanReadableContributorsSummary;
  @Input() getThumbnailIconUrl!: string;
  @Input() getThumbnailBgColor!: string;
  // If this is not null, the new exploration opens in a new window when
  // the summary tile is clicked.
  @Input() openInNewWindow!: string;
  @Input() getParentExplorationIds!: string;
  // If the screen width is below the threshold defined here, the mobile
  // version of the summary tile is displayed. This attribute is optional:
  // if it is not specified, it is treated as 0, which means that the
  // desktop version of the summary tile is always displayed.
  @Input() mobileCutoffPx!: number;
  @Input() isCommunityOwned: boolean = false;
  // If this is true, collection preview tile for mobile
  // will be displayed.
  @Input() isCollectionPreviewTile: boolean = false;
  @Input() isPlaylistTile: boolean = false;
  @Input() showLearnerDashboardIconsIfPossible!: string;
  @Input() isContainerNarrow: boolean = false;
  @Input() isOwnedByCurrentUser: boolean = false;

  activityType!: string;
  resizeSubscription!: Subscription;
  explorationIsCurrentlyHoveredOver: boolean = false;
  isWindowLarge: boolean = false;
  userIsLoggedIn: boolean = false;
  isRefresherExploration: boolean = false;
  contributors!: object;
  // A null value for 'lastUpdatedDateTime' indicates that lastUpdatedMsecs
  // received after component interactions is empty or does not exist.
  lastUpdatedDateTime: string | null = '';
  // 'avgRating' will be null if the exploration has no ratings.
  avgRating!: number | null;
  thumbnailIcon!: string;

  constructor(
    private ratingComputationService: RatingComputationService,
    private urlInterpolationService: UrlInterpolationService,
    private urlService: UrlService,
    private windowRef: WindowRef,
    private dateTimeFormatService: DateTimeFormatService,
    private userService: UserService,
    private windowDimensionsService: WindowDimensionsService,
  ) {}

  ngOnInit(): void {
    this.userService.getUserInfoAsync().then(userInfo => {
      this.userIsLoggedIn = userInfo.isLoggedIn();
    });
    this.activityType = constants.ACTIVITY_TYPE_EXPLORATION;
    let contributorsSummary: HumanReadableContributorsSummary = (
      this.getContributorsSummary || {});
    this.contributors = Object.keys(
      contributorsSummary).sort(
      (contributorUsername1, contributorUsername2) => {
        let commitsOfContributor1 = contributorsSummary[
          contributorUsername1].num_commits;
        let commitsOfContributor2 = contributorsSummary[
          contributorUsername2].num_commits;
        return commitsOfContributor2 - commitsOfContributor1;
      }
    );

    this.isRefresherExploration = false;
    if (this.getParentExplorationIds) {
      this.isRefresherExploration = (
        this.getParentExplorationIds.length > 0);
    }

    if (!this.mobileCutoffPx) {
      this.mobileCutoffPx = 0;
    }
    this.isWindowLarge = (
      this.windowDimensionsService.getWidth() >= this.mobileCutoffPx);

    this.resizeSubscription = this.windowDimensionsService.getResizeEvent().
      subscribe(evt => {
        this.isWindowLarge = (
          this.windowDimensionsService.getWidth() >= this.mobileCutoffPx);
      });
    this.lastUpdatedDateTime = this.getLastUpdatedDatetime();
    this.avgRating = this.getAverageRating();
    this.thumbnailIcon = this.getCompleteThumbnailIconUrl();
  }

  ngOnDestroy(): void {
    if (this.resizeSubscription) {
      this.resizeSubscription.unsubscribe();
    }
  }

  setHoverState(hoverState: boolean): void {
    this.explorationIsCurrentlyHoveredOver = hoverState;
  }

  loadParentExploration(): void {
    this.windowRef.nativeWindow.location.href = this.getExplorationLink();
  }

  // Function will return null when Exploration Ratings are not present.
  getAverageRating(): number | null {
    if (this.getRatings) {
      return this.ratingComputationService.computeAverageRating(
        this.getRatings);
    }
    return null;
  }

  // Function will return null when the property 'getLastUpdatedMsec' is null
  // or undefined.
  getLastUpdatedDatetime(): string | null {
    if (this.getLastUpdatedMsec) {
      return this.dateTimeFormatService.getLocaleAbbreviatedDatetimeString(
        this.getLastUpdatedMsec);
    }
    return null;
  }

  getExplorationLink(): string {
    if (!this.getExplorationId) {
      return '#';
    } else {
      let result = '/explore/' + this.getExplorationId;
      let urlParams = this.urlService.getUrlParams();
      let parentExplorationIds = this.getParentExplorationIds;

      let collectionIdToAdd = this.getCollectionId;
      let storyIdToAdd = null;
      let storyNodeIdToAdd = null;
      // Replace the collection ID with the one in the URL if it exists
      // in urlParams.
      if (parentExplorationIds &&
          urlParams.hasOwnProperty('collection_id')) {
        collectionIdToAdd = urlParams.collection_id;
      } else if (
        this.urlService.getPathname().match(/\/story\/(\w|-){12}/g) &&
        this.getStoryNodeId) {
        storyIdToAdd = this.urlService.getStoryIdFromViewerUrl();
        storyNodeIdToAdd = this.getStoryNodeId;
      } else if (
        urlParams.hasOwnProperty('story_id') &&
        urlParams.hasOwnProperty('node_id')) {
        storyIdToAdd = urlParams.story_id;
        storyNodeIdToAdd = this.getStoryNodeId;
      }

      if (collectionIdToAdd) {
        result = this.urlService.addField(
          result, 'collection_id', collectionIdToAdd);
      }
      if (parentExplorationIds) {
        for (let i = 0; i < parentExplorationIds.length - 1; i++) {
          result = this.urlService.addField(
            result, 'parent', parentExplorationIds[i]);
        }
      }
      if (storyIdToAdd && storyNodeIdToAdd) {
        result = this.urlService.addField(result, 'story_id', storyIdToAdd);
        result = this.urlService.addField(
          result, 'node_id', storyNodeIdToAdd);
      }
      return result;
    }
  }

  getCompleteThumbnailIconUrl(): string {
    return this.urlInterpolationService.getStaticImageUrl(
      this.getThumbnailIconUrl);
  }
}

angular.module('oppia').directive(
  'oppiaExplorationSummaryTile', downgradeComponent(
    {component: ExplorationSummaryTileComponent}));
