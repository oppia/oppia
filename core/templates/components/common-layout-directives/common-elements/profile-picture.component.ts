// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Displays profile image with a fallback when the user does not
 * exist.
 */

import { Component, ElementRef, Input, OnChanges, ViewChild } from
  '@angular/core';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { downgradeComponent } from '@angular/upgrade/static';

@Component({
  selector: 'profile-picture',
  templateUrl: './profile-picture.component.html',
  styleUrls: []
})
export class ProfilePictureComponent implements OnChanges {
  @Input() username: string;
  profilePictureUrl: string;
  profilePictureIsLoaded: boolean = false;
  profilePictureIsLoading: boolean = false;

  spinnerDiameter: number = 10;
  @ViewChild('parentDiv') parentDiv: ElementRef;

  constructor(
    private urlInterpolationService: UrlInterpolationService
  ) {}

  ngOnChanges(): void {
    if (this.username) {
      this.profilePictureUrl = (
        this.urlInterpolationService.getProfilePictureUrl(this.username));
      this.profilePictureIsLoading = true;
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.adjustSpinnerSize(), 100);
  }

  adjustSpinnerSize(): void {
    let offsetHeight = 0;
    const refreshInterval = setInterval(() => {
      if (offsetHeight === 0) {
        offsetHeight = Math.max(this.parentDiv.nativeElement.offsetHeight, 0);
        this.spinnerDiameter = offsetHeight - (offsetHeight / 10);
      } else {
        clearInterval(refreshInterval);
      }
    }, 100);
  }

  setDefaultPicture(): void {
    this.profilePictureUrl = (
      this.urlInterpolationService.getStaticImageUrl(
        '/avatar/user_blue_150px.png'
      )
    );
  }

  showPicture(): void {
    this.profilePictureIsLoaded = true;
  }
}

angular.module('oppia').directive('profilePicture', downgradeComponent(
  {component: ProfilePictureComponent}));
