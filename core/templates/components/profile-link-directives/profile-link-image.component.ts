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

import { Component, OnInit, Input } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { ProfileLinkImageBackendApiService } from
  'components/profile-link-directives/profile-link-image-backend-api.service';

interface ProfileDict {
  'profile_picture_data_url_for_username': string;
}

@Component({
  selector: 'profile-link-image',
  templateUrl: './profile-link-image.component.html',
  styleUrls: []
})
export class ProfileLinkImageComponent implements OnInit {
  @Input() username: string;
  profileImageUrl: string;
  profilePicture: string;
  constructor(
    private profileLinkImageBackendApiService:
      ProfileLinkImageBackendApiService,
    private urlInterpolationService: UrlInterpolationService,
  ) {}

  isUsernameLinkable(username: string): boolean {
    return ['admin', 'OppiaMigrationBot'].indexOf(username) === -1;
  }

  ngOnInit(): void {
    this.profileImageUrl = (
      '/preferenceshandler/profile_picture_by_username/' +
      this.username);
    var DEFAULT_PROFILE_IMAGE_PATH = (
      this.urlInterpolationService.getStaticImageUrl(
        '/avatar/user_blue_72px.webp'));
    this.profilePicture = DEFAULT_PROFILE_IMAGE_PATH;

    // Returns a promise for the user profile picture, or the default
    // image if user is not logged in or has not uploaded a profile
    // picture, or the player is in preview mode.
    this.profileLinkImageBackendApiService.fetchProfilePictureData(
      this.profileImageUrl).then((response: ProfileDict) => {
      this.profilePicture = (
        response.profile_picture_data_url_for_username ||
        DEFAULT_PROFILE_IMAGE_PATH);
    });
  }
}

angular.module('oppia').directive('profileLinkImage', downgradeComponent(
  {component: ProfileLinkImageComponent}));
