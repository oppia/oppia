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

// Sort these
import { Component, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { ProfilePageBackendApiService } from './profile-page-backend-api.service';
import { DateTimeFormatService } from 'services/date-time-format.service';
import { LoggerService } from 'services/contextual/logger.service';
import { LoaderService } from 'services/loader.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';


@Component({
  selector: 'profile-page',
  templateUrl: './profile-page.component.html',
  styleUrls: []
})
export class ProfilePageComponent implements OnInit {
  DEFAULT_PROFILE_PICTURE_URL: string = '';
  username;
  usernameIsLong: boolean = false;
  userBio;
  userDisplayedStatistics;
  userEditedExplorations;
  constructor(
    // Sort these
    private profilePageBackendApiService: ProfilePageBackendApiService,
    private dateTimeFormatService: DateTimeFormatService,
    private loggerService: LoggerService,
    private loaderService: LoaderService,
    private windowRef: WindowRef,
    private urlInterpolationService: UrlInterpolationService,
    private userService: UserService
  ) {
    this.DEFAULT_PROFILE_PICTURE_URL = urlInterpolationService.
      getStaticImageUrl('/general/no_profile_picture.png');
  }

  ngOnInit(): void {
    this.loaderService.showLoadingScreen('Loading');
    this.profilePageBackendApiService.fetchProfileData().then(
      (data) => {
        this.loaderService.hideLoadingScreen();
        this.username = {
          title: 'Username',
          value: data.profile_username,
          helpText: (data.profile_username)
        };
        this.usernameIsLong = data.profile_username.length > 16;
        this.userBio = data.userBio;
        this.userDisplayedStatistics = [{
          title: 'Impact',
          value: data.user_impact_score,
          helpText: (
            'A rough measure of the impact of explorations created by ' +
            'this user. Better ratings and more playthroughs improve ' +
            'this score.')
        }, {
          title: 'Created',
          value: data.created_exp_summary_dicts.length
        }, {
          title: 'Edited',
          value: data.edited_exp_summary_dicts.length
        }];
        this.userEditedExplorations = data.edited_exp_summary_dicts.sort(
          (exploration1, exploration2) => {
            if (exploration1.ratings > exploration2.ratings) {
              return 1;
            } else if (exploration1.ratings === exploration2.ratings) {
              if (exploration1.playthroughs > exploration2.playthroughs) {
                return 1;
              } else if (
                exploration1.playthroughs === exploration2.playthroughs) {
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

        this.isAlreadySubscribed = data.is_already_subscribed;
        this.isUserVisitingOwnProfile = data.is_user_visiting_own_profile;

        this.subscriptionButtonPopoverText = '';

        this.currentPageNumber = 0;
        this.PAGE_SIZE = 6;
        this.startingExplorationNumber = 1;
        this.endingExplorationNumber = 6;
        this.Math = window.Math;
        this.profileIsOfCurrentUser = data.profile_is_of_current_user;

        var changeSubscriptionStatus = () => {
          if (this.userNotLoggedIn) {
            this.userService.getLoginUrlAsync().then(
              function(loginUrl) {
                if (loginUrl) {
                  WindowRef.nativeWindow.location.href = loginUrl;
                } else {
                  WindowRef.nativeWindow.location.reload();
                }
              }
            );
          } else {
            if (!this.isAlreadySubscribed) {
              ProfilePageBackendApiService.subscribe(data.profile_username)
                .then(() => {
                  this.isAlreadySubscribed = true;
                  this.updateSubscriptionButtonPopoverText();
                });
            } else {
              ProfilePageBackendApiService.unsubscribe(data.profile_username)
                .then(() => {
                  this.isAlreadySubscribed = false;
                  this.updateSubscriptionButtonPopoverText();
                });
            }
          }
        };
      }
    );
  }

  getLocaleDateString(millisSinceEpoch: number): string {
    return this.dateTimeFormatService.getLocaleDateString(millisSinceEpoch);
  }
}

angular.module('oppia').directive(
  'profilePage', downgradeComponent(
    {component: ProfilePageComponent}));
