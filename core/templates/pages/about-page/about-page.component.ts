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
 * @fileoverview Component for the about page.
 */

import { Component, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service.ts';
import { WindowRef } from
  'services/contextual/window-ref.service.ts';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { UserService } from 'services/user.service';
import { LoaderService } from 'services/loader.service.ts';
import constants from 'assets/constants';

@Component({
  selector: 'about-page',
  templateUrl: './about-page.component.html'
})
export class AboutPageComponent implements OnInit {
  classroomUrlFragment: string;
  classroomUrl :string;
  userIsLoggedIn: boolean | null;
  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private windowRef: WindowRef,
    private siteAnalyticsService: SiteAnalyticsService,
    private userService: UserService,
    private loaderService: LoaderService) {
  }

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }

  onClickVisitClassroomButton(): void {
    this.siteAnalyticsService.registerClickVisitClassroomButtonEvent();
    this.windowRef.nativeWindow.location.href = this.classroomUrl;
  }

  onClickBrowseLibraryButton(): void {
    this.siteAnalyticsService.
      registerClickBrowseLibraryButtonEvent();
    this.windowRef.nativeWindow.location.href = ('/community-library');
  }

  onClickCreateLessonButton(): void {
    this.siteAnalyticsService.registerCreateLessonButtonEvent();
    if (this.userIsLoggedIn === null) {
      this.windowRef.nativeWindow.location.href = ('/_ah/login');
    } else {
      this.windowRef.nativeWindow.location.href = (
        '/creator-dashboard?mode=create');
    }
  }

  onClickGuideForTeacherButton(): void {
    this.siteAnalyticsService.registerClickGuideForTeacherButtonEvent();
    this.windowRef.nativeWindow.location.href = ('/teach');
  }

  onClickTipsForParentsButton(): void {
    this.siteAnalyticsService.registerClickTipforParentsButtonEvent();
    this.windowRef.nativeWindow.location.href = ('/teach');
  }

  ngOnInit(): void {
    this.userIsLoggedIn = null;
    this.classroomUrl = this.urlInterpolationService.interpolateUrl(
      '/learn/<classroomUrlFragment>', {
        classroomUrlFragment: constants.DEFAULT_CLASSROOM_URL_FRAGMENT
      });
    this.loaderService.showLoadingScreen('Loading');
    this.userService.getUserInfoAsync().then((userInfo) => {
      this.userIsLoggedIn = userInfo.isLoggedIn();
      this.loaderService.hideLoadingScreen();
    });
  }
}
angular.module('oppia').directive(
  'aboutPage', downgradeComponent({component: AboutPageComponent}));
