// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the Oppia profile page.
 */

import {Component} from '@angular/core';

import {AppConstants} from 'app.constants';
import {RatingComputationService} from 'components/ratings/rating-computation/rating-computation.service';
import {LearnerExplorationSummary} from 'domain/summary/learner-exploration-summary.model';
import {UserProfile} from 'domain/user/user-profile.model';
import {LoggerService} from 'services/contextual/logger.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {DateTimeFormatService} from 'services/date-time-format.service';
import {LoaderService} from 'services/loader.service';
import {UserService} from 'services/user.service';
import {ProfilePageBackendApiService} from './profile-page-backend-api.service';

import './profile-page.component.css';

interface ViewedProfileUsername {
  title: string;
  value: string;
  helpText: string;
}

interface UserDisplayedStatistic {
  title: string;
  value: number;
  helpText: string | null;
}

@Component({
  selector: 'oppia-profile-page',
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.css'],
})
export class ProfilePageComponent {
  username: ViewedProfileUsername = {
    title: '',
    value: '',
    helpText: '',
  };

  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  data!: UserProfile;
  numUserPortfolioExplorations!: number;
  explorationIndexEnd!: number;
  explorationIndexStart!: number;
  // The time in milliseconds when the user first contributed to Oppia.
  // This property is initially set as null for a new user .
  firstContributionMsec!: number | null;
  usernameIsLong: boolean = false;
  userBio: string = '';
  userDisplayedStatistics: UserDisplayedStatistic[] = [];
  userEditedExplorations: LearnerExplorationSummary[] = [];
  userNotLoggedIn: boolean = false;
  isAlreadySubscribed: boolean = false;
  isUserVisitingOwnProfile: boolean = false;
  subscriptionButtonPopoverText: string = '';
  currentPageNumber: number = 0;
  PAGE_SIZE: number = 6;
  startingExplorationNumber: number = 1;
  endingExplorationNumber: number = 6;
  profileIsOfCurrentUser: boolean = false;
  explorationsOnPage: LearnerExplorationSummary[] = [];
  subjectInterests: string[] = [];
  profilePicturePngDataUrl!: string;
  profilePictureWebpDataUrl!: string;
  preferencesUrl =
    '/' + AppConstants.PAGES_REGISTERED_WITH_FRONTEND.PREFERENCES.ROUTE;

  constructor(
    private dateTimeFormatService: DateTimeFormatService,
    private loaderService: LoaderService,
    private loggerService: LoggerService,
    private profilePageBackendApiService: ProfilePageBackendApiService,
    private ratingComputationService: RatingComputationService,
    private userService: UserService,
    private windowRef: WindowRef
  ) {}

  ngOnInit(): void {
    this.loaderService.showLoadingScreen('Loading');
    this.profilePageBackendApiService.fetchProfileDataAsync().then(data => {
      this.data = data;
      this.username = {
        title: 'Username',
        value: data.usernameOfViewedProfile,
        helpText: data.usernameOfViewedProfile,
      };
      this.usernameIsLong = data.usernameOfViewedProfile.length > 16;
      this.userBio = data.userBio;
      this.userDisplayedStatistics = [
        {
          title: 'Impact',
          value: data.userImpactScore,
          helpText:
            'A rough measure of the impact of explorations created by ' +
            'this user. Better ratings and more playthroughs improve ' +
            'this score.',
        },
        {
          title: 'Created',
          value: data.createdExpSummaries.length,
          helpText: null,
        },
        {
          title: 'Edited',
          value: data.createdExpSummaries.length,
          helpText: null,
        },
      ];

      this.userEditedExplorations = data.editedExpSummaries.sort(
        (exploration1, exploration2) => {
          const avgRating1 = this.ratingComputationService.computeAverageRating(
            exploration1.ratings
          );
          const avgRating2 = this.ratingComputationService.computeAverageRating(
            exploration2.ratings
          );
          if (avgRating2 === null) {
            return 1;
          }
          if (avgRating1 !== null && avgRating1 > avgRating2) {
            return 1;
          } else if (avgRating1 === avgRating2) {
            if (exploration1.numViews > exploration2.numViews) {
              return 1;
            } else if (exploration1.numViews === exploration2.numViews) {
              return 0;
            } else {
              return -1;
            }
          } else {
            return -1;
          }
        }
      );

      this.userNotLoggedIn = !data.username;
      this.isAlreadySubscribed = data.isAlreadySubscribed;
      this.isUserVisitingOwnProfile = data.isUserVisitingOwnProfile;

      this.subscriptionButtonPopoverText = '';
      this.currentPageNumber = 0;
      this.PAGE_SIZE = 6;
      this.startingExplorationNumber = 1;
      this.endingExplorationNumber = 6;
      this.profileIsOfCurrentUser = data.profileIsOfCurrentUser;

      this.updateSubscriptionButtonPopoverText();
      this.numUserPortfolioExplorations = data.editedExpSummaries.length;
      this.subjectInterests = data.subjectInterests;
      this.firstContributionMsec = data.firstContributionMsec;

      [this.profilePicturePngDataUrl, this.profilePictureWebpDataUrl] =
        this.userService.getProfileImageDataUrl(this.username.value);
      this.loaderService.hideLoadingScreen();
    });
  }

  changeSubscriptionStatus(): void {
    if (this.userNotLoggedIn) {
      this.userService.getLoginUrlAsync().then(loginUrl => {
        if (loginUrl) {
          this.windowRef.nativeWindow.location.href = loginUrl;
        } else {
          this.windowRef.nativeWindow.location.reload();
        }
      });
    } else {
      if (!this.isAlreadySubscribed) {
        this.profilePageBackendApiService
          .subscribeAsync(this.data.usernameOfViewedProfile)
          .then(() => {
            this.isAlreadySubscribed = true;
            this.updateSubscriptionButtonPopoverText();
          });
      } else {
        this.profilePageBackendApiService
          .unsubscribeAsync(this.data.usernameOfViewedProfile)
          .then(() => {
            this.isAlreadySubscribed = false;
            this.updateSubscriptionButtonPopoverText();
          });
      }
    }
  }

  updateSubscriptionButtonPopoverText(): void {
    if (this.userNotLoggedIn) {
      this.subscriptionButtonPopoverText =
        'Log in or sign up to subscribe to your ' + 'favorite creators.';
    } else if (this.isAlreadySubscribed) {
      this.subscriptionButtonPopoverText =
        'Unsubscribe to stop receiving email notifications ' +
        'regarding new explorations published by ' +
        this.username.value +
        '.';
    } else {
      this.subscriptionButtonPopoverText =
        'Receive email notifications, whenever ' +
        this.username.value +
        ' publishes a new exploration.';
    }
  }

  goToPreviousPage(): void {
    if (this.currentPageNumber === 0) {
      this.loggerService.error('Error: cannot decrement page');
    } else {
      this.currentPageNumber--;
      this.startingExplorationNumber =
        this.currentPageNumber * this.PAGE_SIZE + 1;
      this.endingExplorationNumber =
        (this.currentPageNumber + 1) * this.PAGE_SIZE;
    }
  }

  goToNextPage(): void {
    let summariesLength = this.data.editedExpSummaries.length;
    if ((this.currentPageNumber + 1) * this.PAGE_SIZE >= summariesLength) {
      this.loggerService.error('Error: Cannot increment page');
    } else {
      this.currentPageNumber++;
      this.startingExplorationNumber =
        this.currentPageNumber * this.PAGE_SIZE + 1;
      this.endingExplorationNumber = Math.min(
        this.numUserPortfolioExplorations,
        (this.currentPageNumber + 1) * this.PAGE_SIZE
      );
    }
  }

  getExplorationsToDisplay(): Object[] {
    this.explorationsOnPage = [];
    if (this.userEditedExplorations.length === 0) {
      return this.explorationsOnPage;
    }
    this.explorationIndexStart = this.currentPageNumber * this.PAGE_SIZE;
    this.explorationIndexEnd = this.explorationIndexStart + this.PAGE_SIZE - 1;
    for (
      let ind = this.explorationIndexStart;
      ind <= this.explorationIndexEnd;
      ind++
    ) {
      this.explorationsOnPage.push(this.userEditedExplorations[ind]);
      if (ind === this.userEditedExplorations.length - 1) {
        break;
      }
    }
    return this.explorationsOnPage;
  }

  getLocaleDateString(millisSinceEpoch: number): string {
    return this.dateTimeFormatService.getLocaleDateString(millisSinceEpoch);
  }
}
