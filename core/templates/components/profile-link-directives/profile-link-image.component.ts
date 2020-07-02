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
 * @fileoverview Directive for creating image links to a user's profile page.
 */

import { Component, Input, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

import { AppConstants } from 'app.constants';
import { IProfileResponse, ProfileLinkImageBackendApiService } from
  './profile-link-image-backend-api.service';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';



@Component({
  selector: 'profile-link-image',
  templateUrl: './profile-link-image.component.html',
  styleUrls: []
})
export class ProfileLinkImageComponent implements OnInit {
  @Input() username: string;

  constructor(
    private profileBackendApiService: ProfileLinkImageBackendApiService,
    private urlInterpolationService: UrlInterpolationService) {}

  DEFAULT_PROFILE_IMAGE_PATH: string = (
    this.urlInterpolationService.getStaticImageUrl(
      '/avatar/user_blue_72px.webp'));
  profileImageUrl: string;
  profilePicture: string;

  ngOnInit() {
    this.profileImageUrl = (
      '/preferenceshandler/profile_picture_by_username/' +
      this.username);
    this.profileBackendApiService.fetchProfilePicture(
      this.profileImageUrl).then((response: IProfileResponse) => {
      this.profilePicture = (
        response.profile_picture_data_url_for_username ||
        this.DEFAULT_PROFILE_IMAGE_PATH);
    }, (error) => {
      return error;
    });
  }

  isUsernameLinkable(): boolean {
    return AppConstants.SYSTEM_USER_IDS.indexOf(this.username) === -1;
  }
}

angular.module('oppia').directive('profileLinkImage', downgradeComponent(
  {component: ProfileLinkImageComponent}));
