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
 * @fileoverview Component for the creator dashboard.
 */

import { Component } from '@angular/core';
import { AppConstants } from 'app.constants';
import { CreatorDashboardBackendApiService } from 'domain/creator_dashboard/creator-dashboard-backend-api.service';
import { CreatorDashboardConstants } from './creator-dashboard-page.constants';
import { RatingComputationService } from 'components/ratings/rating-computation/rating-computation.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { LoaderService } from 'services/loader.service';
import { UserService } from 'services/user.service';
import { AlertsService } from 'services/alerts.service';
import { DateTimeFormatService } from 'services/date-time-format.service';
import { ThreadStatusDisplayService } from 'pages/exploration-editor-page/feedback-tab/services/thread-status-display.service';
import { ExplorationCreationService } from 'components/entity-creation-services/exploration-creation.service';
import { downgradeComponent } from '@angular/upgrade/static';
import { forkJoin } from 'rxjs';
import { WindowRef } from 'services/contextual/window-ref.service';
import { CreatorDashboardData } from 'domain/creator_dashboard/creator-dashboard-backend-api.service';
import { ProfileSummary } from 'domain/user/profile-summary.model';
import { CreatorExplorationSummary } from 'domain/summary/creator-exploration-summary.model';
import { CollectionSummary } from 'domain/collection/collection-summary.model';

@Component({
  selector: 'oppia-creator-dashboard-page',
  templateUrl: './creator-dashboard-page.component.html'
})
export class CreatorDashboardPageComponent {
  activeTab: string;
  myExplorationsView: string;
  publishText: string;
  currentSortType: string;
  isCurrentSortDescending: boolean;
  currentSubscribersSortType: string;
  isCurrentSubscriptionSortDescending: boolean;
  canReviewActiveThread: boolean;
  EXPLORATION_DROPDOWN_STATS;
  canCreateCollections: boolean;
  explorationsList: CreatorExplorationSummary[];
  collectionsList: CollectionSummary[];
  subscribersList: ProfileSummary[];
  lastWeekStats: { totalPlays: number; };
  dashboardStats: { totalPlays: number; };
  relativeChangeInTotalPlays: number;
  getLocaleAbbreviatedDatetimeString: (millisSinceEpoch: number) => string;
  getHumanReadableStatus: (status: string) => string;
  emptyDashboardImgUrl: string;
  getAverageRating;
  SUBSCRIPTION_SORT_BY_KEYS =
    CreatorDashboardConstants.SUBSCRIPTION_SORT_BY_KEYS;
  EXPLORATIONS_SORT_BY_KEYS =
    CreatorDashboardConstants.EXPLORATIONS_SORT_BY_KEYS;
  DEFAULT_EMPTY_TITLE = 'Untitled';
  HUMAN_READABLE_EXPLORATIONS_SORT_BY_KEYS =
    CreatorDashboardConstants.HUMAN_READABLE_EXPLORATIONS_SORT_BY_KEYS;
  HUMAN_READABLE_SUBSCRIPTION_SORT_BY_KEYS =
    CreatorDashboardConstants.HUMAN_READABLE_SUBSCRIPTION_SORT_BY_KEYS;
  DEFAULT_TWITTER_SHARE_MESSAGE_DASHBOARD =
    AppConstants.DEFAULT_TWITTER_SHARE_MESSAGE_EDITOR;

  constructor(
    private creatorDashboardBackendApiService:
      CreatorDashboardBackendApiService,
    private ratingComputationService: RatingComputationService,
    private urlInterpolationService: UrlInterpolationService,
    private loaderService: LoaderService,
    private userService: UserService,
    private alertsService: AlertsService,
    private dateTimeFormatService: DateTimeFormatService,
    private threadStatusDisplayService: ThreadStatusDisplayService,
    private explorationCreationService: ExplorationCreationService,
    private windowRef: WindowRef
  ) {}

  EXP_PUBLISH_TEXTS = {
    defaultText: (
      'This exploration is private. Publish it to receive statistics.'),
    smText: 'Publish the exploration to receive statistics.'
  };

  userDashboardDisplayPreference = (
    AppConstants.ALLOWED_CREATOR_DASHBOARD_DISPLAY_PREFS.CARD);

  setActiveTab(newActiveTabName: string): void {
    this.activeTab = newActiveTabName;
  }

  getExplorationUrl(explorationId: string): string {
    return '/create/' + explorationId;
  }

  getCollectionUrl(collectionId: string): string {
    return '/collection_editor/create/' + collectionId;
  }

  setMyExplorationsView(newViewType: string): void {
    this.myExplorationsView = newViewType;
    this.creatorDashboardBackendApiService.postExplorationViewAsync(
      newViewType).then(() => {});
  }

  checkMobileView(): boolean {
    return (this.windowRef.nativeWindow.innerWidth < 500);
  }

  showUsernamePopover(subscriberUsername: string | string[]): string {
    // The popover on the subscription card is only shown if the length
    // of the subscriber username is greater than 10 and the user hovers
    // over the truncated username.
    if (subscriberUsername.length > 10) {
      return 'mouseenter';
    } else {
      return 'none';
    }
  }

  // @HostListener('window:resize', [])
  updatesGivenScreenWidth(): void {
    if (this.checkMobileView()) {
      // For mobile users, the view of the creators
      // exploration list is shown only in
      // the card view and can't be switched to list view.
      this.myExplorationsView = (
        AppConstants.ALLOWED_CREATOR_DASHBOARD_DISPLAY_PREFS.CARD);
      this.publishText = this.EXP_PUBLISH_TEXTS.smText;
    } else {
      // For computer users or users operating in larger screen size
      // the creator exploration list will come back to its previously
      // selected view (card or list) when resized from mobile view.
      this.myExplorationsView = this.userDashboardDisplayPreference;
      this.publishText = this.EXP_PUBLISH_TEXTS.defaultText;
    }
  }

  setExplorationsSortingOptions(sortType: string): void {
    if (sortType === this.currentSortType) {
      this.isCurrentSortDescending = !this.isCurrentSortDescending;
    } else {
      this.currentSortType = sortType;
    }
  }

  setSubscriptionSortingOptions(sortType: string): void {
    if (sortType === this.currentSubscribersSortType) {
      this.isCurrentSubscriptionSortDescending = (
        !this.isCurrentSubscriptionSortDescending);
    } else {
      this.currentSubscribersSortType = sortType;
    }
  }

  sortSubscriptionFunction(
      entity: { [x: string]: number }): number {
    // This function is passed as a custom comparator function to
    // `orderBy`, so that special cases can be handled while sorting
    // subscriptions.
    let value = entity[this.currentSubscribersSortType];
    if (this.currentSubscribersSortType ===
          this.SUBSCRIPTION_SORT_BY_KEYS.IMPACT) {
      value = (value || 0);
    }
    return value;
  }

  sortByFunction(
      entity: { [x: string]: number | string; status: string; }
  ): string | number {
    // This function is passed as a custom comparator function to
    // `orderBy`, so that special cases can be handled while sorting
    // explorations.
    let value = entity[this.currentSortType];
    if (entity.status === 'private') {
      if (this.currentSortType ===
            CreatorDashboardConstants.EXPLORATIONS_SORT_BY_KEYS.TITLE) {
        value = (value || this.DEFAULT_EMPTY_TITLE);
      } else if (this.currentSortType !==
        CreatorDashboardConstants.EXPLORATIONS_SORT_BY_KEYS.LAST_UPDATED) {
        value = 0;
      }
    } else if (
      this.currentSortType ===
        CreatorDashboardConstants.EXPLORATIONS_SORT_BY_KEYS.RATING) {
      let averageRating = (
        this.getAverageRating(value));
      value = (averageRating || 0);
    }
    return value;
  }

  getCompleteThumbnailIconUrl(iconUrl: string): string {
    return this.urlInterpolationService.getStaticImageUrl(iconUrl);
  }

  ngOnInit(): void {
    this.canCreateCollections = null;
    this.loaderService.showLoadingScreen('Loading');
    let userInfoPromise = this.userService.getUserInfoAsync();
    userInfoPromise.then((userInfo) => {
      this.canCreateCollections = userInfo.canCreateCollections();
    });

    let dashboardDataPromise = (
      this.creatorDashboardBackendApiService.fetchDashboardDataAsync());
    dashboardDataPromise.then(
      (response: CreatorDashboardData) => {
        // The following condition is required for Karma testing. The
        // Angular HttpClient returns an Observable which when converted
        // to a promise does not have the 'data' key but the AngularJS
        // mocks of services using HttpClient use $http which return
        // promise and the content is contained in the 'data' key.
        // Therefore the following condition checks for presence of
        // 'response.data' which would be the case in AngularJS testing
        // but assigns 'response' if the former is not present which is
        // the case with HttpClient.
        let responseData = response;
        this.currentSortType = (
          CreatorDashboardConstants.
            EXPLORATIONS_SORT_BY_KEYS.OPEN_FEEDBACK);
        this.currentSubscribersSortType =
          CreatorDashboardConstants.SUBSCRIPTION_SORT_BY_KEYS.USERNAME;
        this.isCurrentSortDescending = true;
        this.isCurrentSubscriptionSortDescending = true;
        this.explorationsList = responseData.explorationsList;
        this.collectionsList = responseData.collectionsList;
        this.subscribersList = responseData.subscribersList;
        this.dashboardStats = responseData.dashboardStats;
        this.lastWeekStats = responseData.lastWeekStats;
        this.myExplorationsView = responseData.displayPreference;

        if (this.dashboardStats && this.lastWeekStats) {
          this.relativeChangeInTotalPlays = (
            this.dashboardStats.totalPlays - (
              this.lastWeekStats.totalPlays)
          );
        }

        if (this.explorationsList.length === 0 &&
          this.collectionsList.length > 0) {
          this.activeTab = 'myCollections';
        } else {
          this.activeTab = 'myExplorations';
        }
      },
      (errorResponse) => {
        if (AppConstants.FATAL_ERROR_CODES.indexOf(
          errorResponse.status) !== -1) {
          this.alertsService.addWarning('Failed to get dashboard data');
        }
      }
    );

    forkJoin([userInfoPromise, dashboardDataPromise]).subscribe(() => {
      this.loaderService.hideLoadingScreen();
    });

    this.getAverageRating = this.ratingComputationService
      .computeAverageRating;
    this.getLocaleAbbreviatedDatetimeString = (
      this.dateTimeFormatService.getLocaleAbbreviatedDatetimeString);
    this.getHumanReadableStatus = (
      this.threadStatusDisplayService.getHumanReadableStatus);

    this.emptyDashboardImgUrl = this.urlInterpolationService
      .getStaticImageUrl('/general/empty_dashboard.svg');
    this.canReviewActiveThread = null;
    this.updatesGivenScreenWidth();
    angular.element(this.windowRef.nativeWindow).on('resize', () => {
      this.updatesGivenScreenWidth();
    });
  }

  createNewExploration(): void {
    this.explorationCreationService.createNewExploration();
  }
}

angular.module('oppia').directive('oppiaCreatorDashboardPage',
  downgradeComponent({
    component: CreatorDashboardPageComponent
  }) as angular.IDirectiveFactory);
