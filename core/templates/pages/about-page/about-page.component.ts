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
import { UserBackendApiService } from 'services/user-backend-api.service';

@Component({
  selector: 'about-page',
  templateUrl: './about-page.component.html'
})
export class AboutPageComponent implements OnInit {
  aboutPageMascotImgUrl: string;
  canCreateCollections: null;
  classroomUrlFragment: string;
  classroomUrl :string;
  userIsLoggedIn: boolean | null;
  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private windowRef: WindowRef,
    private siteAnalyticsService: SiteAnalyticsService,
    private userBackendApiService: UserBackendApiService,) {
  }

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }

  onClickVisitClassroomButton(): boolean {
    this.siteAnalyticsService.registerClickVisitClassroomButtonEvent();
    setTimeout(() => {
      this.windowRef.nativeWindow.location.href = this.classroomUrl;
    }, 150);
    return false;
  }

  onClickBrowseLibraryButton(): boolean {
    this.siteAnalyticsService.registerClickBrowseLibraryButtonEvent();
    setTimeout(() => {
      this.windowRef.nativeWindow.location.href = this.classroomUrl;
    }, 150);
    return false;
  }

  onClickCreateLessonButton(): boolean {
    this.siteAnalyticsService.registerCreateLessonButtonEvent();
    this.userIsLoggedIn = null;
    this.userBackendApiService.getUserInfoAsync().then(function(userInfo) {
      this.canCreateCollections = userInfo.canCreateCollections();
      this.userIsLoggedIn = userInfo.isLoggedIn();
    });
    if (this.userIsLoggedIn === null) {
      window.location.replace('/_ah/login');
    } else {
      window.location.replace('/creator-dashboard?mode=create');
    }
    setTimeout(() => {
      this.windowRef.nativeWindow.location.href = this.classroomUrl;
    }, 150);
    return false;
  }

  onClickGuideForTeacherButton(): boolean {
    this.siteAnalyticsService.registerClickGuideForTeacherButtonEvent();
    setTimeout(() => {
      this.windowRef.nativeWindow.location.href = this.classroomUrl;
    }, 150);
    return false;
  }

  onClickTipsForParentsButton(): boolean {
    this.siteAnalyticsService.registerClickTipforParentsButtonEvent();
    setTimeout(() => {
      this.windowRef.nativeWindow.location.href = this.classroomUrl;
    }, 150);
    return false;
  }

  ngOnInit(): void {
    this.aboutPageMascotImgUrl = this.urlInterpolationService
      .getStaticImageUrl('/general/about_page_mascot.webp');
  }
}
angular.module('oppia').directive(
  'aboutPage', downgradeComponent({component: AboutPageComponent}));
