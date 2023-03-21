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
import { ExplorationRatings } from 'domain/summary/learner-exploration-summary.model';
import { CreatorDashboardStats } from 'domain/creator_dashboard/creator-dashboard-stats.model';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';

@Component({
  selector: 'oppia-creator-dashboard-page',
  templateUrl: './creator-dashboard-page.component.html'
})
export class CreatorDashboardPageComponent {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  activeTab!: string;
  myExplorationsView!: string;
  publishText!: string;
  currentSortType!: string;
  currentSubscribersSortType!: string;
  EXPLORATION_DROPDOWN_STATS!: string[];
  explorationsList!: CreatorExplorationSummary[];
  collectionsList!: CollectionSummary[];
  subscribersList!: ProfileSummary[];
  // 'lastWeekStats' is null for a new creator.
  lastWeekStats!: CreatorDashboardStats | null;
  dashboardStats!: CreatorDashboardStats;
  relativeChangeInTotalPlays!: number;
  getLocaleAbbreviatedDatetimeString!: (millisSinceEpoch: number) => string;
  getHumanReadableStatus!: (status: string) => string;
  emptyDashboardImgUrl!: string;
  getAverageRating!: (
    (ratingFrequencies: ExplorationRatings) => number | null);

  isCurrentSortDescending: boolean = false;
  isCurrentSubscriptionSortDescending: boolean = false;
  canReviewActiveThread: boolean = false;
  canCreateCollections: boolean = false;

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
    private windowDimensionsService: WindowDimensionsService,
    private dateTimeFormatService: DateTimeFormatService,
    private threadStatusDisplayService: ThreadStatusDisplayService,
    private explorationCreationService: ExplorationCreationService,
    private windowRef: WindowRef,
  ) {}

  EXP_PUBLISH_TEXTS = {
    defaultText: (
      'This exploration is private. Publish it to receive statistics.'),
    smText: 'Publish the exploration to receive statistics.'
  };

  userDashboardDisplayPreference = (
    AppConstants.ALLOWED_CREATOR_DASHBOARD_DISPLAY_PREFS.CARD);

  getProfileImagePngDataUrl(username: string): string {
    let [pngImageUrl, _] = this.userService.getProfileImageDataUrl(
      username);
    return pngImageUrl;
  }

  getProfileImageWebpDataUrl(username: string): string {
    let [_, webpImageUrl] = this.userService.getProfileImageDataUrl(
      username);
    return webpImageUrl;
  }

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

  getTrustedResourceUrl(imageFileName: string): string {
    return decodeURIComponent(imageFileName);
  }

  checkTabletView(): boolean {
    return (this.windowDimensionsService.getWidth() < 768);
  }

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

  sortSubscriptionFunction(): string {
    return this.currentSubscribersSortType;
  }

  sortByFunction(): string {
    if (
      this.currentSortType ===
        CreatorDashboardConstants.EXPLORATIONS_SORT_BY_KEYS.RATING) {
      // TODO(sll): Find a better way to sort explorations according to
      // average ratings. Currently there is no parameter as such
      // average ratings in entities received by SortByPipe.
      return 'default';
    } else {
      return this.currentSortType;
    }
  }

  getCompleteThumbnailIconUrl(iconUrl: string): string {
    return this.urlInterpolationService.getStaticImageUrl(iconUrl);
  }

  ngOnInit(): void {
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
    this.canReviewActiveThread = false;
    this.updatesGivenScreenWidth();
    angular.element(this.windowRef.nativeWindow).on('resize', () => {
      this.updatesGivenScreenWidth();
    });
  }

  createNewExploration(): void {
    this.explorationCreationService.createNewExploration();
  }

  returnZero(): number {
    // This function is used as a custom function to
    // sort heading in the list view. Directly assigning
    // keyvalue : 0 gives error "TypeError: The comparison function
    // must be either a function or undefined" .
    return 0;
  }
}

angular.module('oppia').directive('oppiaCreatorDashboardPage',
  downgradeComponent({
    component: CreatorDashboardPageComponent
  }) as angular.IDirectiveFactory);
