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
 * @fileoverview Component for the teach page.
 */
import { Component, OnInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

import splashConstants from 'assets/constants';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service.ts';
import { LoaderService } from 'services/loader.service.ts';
import { UserService } from 'services/user.service';
@Component({
  selector: 'teach-page',
  templateUrl: './teach-page.component.html',
  styleUrls: []
})
export class TeachPageComponent implements OnInit {
  isWindowNarrow: boolean = false;
  classroomUrlFragment: string;
  classroomUrl :string;
  displayedTestimonialId: number;
  testimonialCount: number;
  testimonials = [];
  userIsLoggedIn: boolean = null;
  constructor(
    private siteAnalyticsService: SiteAnalyticsService,
    private urlInterpolationService: UrlInterpolationService,
    private windowDimensionService: WindowDimensionsService,
    private windowRef: WindowRef,
    private userService: UserService,
    private loaderService: LoaderService
  ) {}

  ngOnInit(): void {
    this.isWindowNarrow = this.windowDimensionService.isWindowNarrow();
    this.displayedTestimonialId = 0;
    this.testimonialCount = 4;
    this.testimonials = this.getTestimonials();
    this.classroomUrl = this.urlInterpolationService.interpolateUrl(
      '/learn/<classroomUrlFragment>', {
        classroomUrlFragment: splashConstants.DEFAULT_CLASSROOM_URL_FRAGMENT
      });
    this.loaderService.showLoadingScreen('Loading');
    this.userService.getUserInfoAsync().then((userInfo) => {
      this.userIsLoggedIn = userInfo.isLoggedIn();
      this.loaderService.hideLoadingScreen();
    });
  }

  // The 2 functions below are to cycle between values:
  // 0 to (testimonialCount - 1) for displayedTestimonialId.
  incrementDisplayedTestimonialId(): void {
  // This makes sure that incrementing from (testimonialCount - 1)
  // returns 0 instead of testimonialCount,since we want the testimonials
  // to cycle through.
    this.displayedTestimonialId = (
      this.displayedTestimonialId + 1) % this.testimonialCount;
  }

  decrementDisplayedTestimonialId(): void {
  // This makes sure that decrementing from 0, returns
  // (testimonialCount - 1) instead of -1, since we want the testimonials
  // to cycle through.
    this.displayedTestimonialId = (
      this.displayedTestimonialId + this.testimonialCount - 1) %
      this.testimonialCount;
  }

  getTestimonials():[{}, {}, {}, {}] {
    return [{
      quote: 'I18N_TEACH_TESTIMONIAL_1',
      studentDetails: 'I18N_TEACH_STUDENT_DETAILS_1',
      imageUrl: '/splash/mira.png',
      imageUrlWebp: '/splash/mira.webp',
      borderPresent: false
    }, {
      quote: 'I18N_TEACH_TESTIMONIAL_2',
      studentDetails: 'I18N_TEACH_STUDENT_DETAILS_2',
      imageUrl: '/teach/awad.jpg',
      imageUrlWebp: '/teach/awad.webp',
      borderPresent: true
    }, {
      quote: 'I18N_TEACH_TESTIMONIAL_3',
      studentDetails: 'I18N_TEACH_STUDENT_DETAILS_3',
      imageUrl: '/splash/sama.png',
      imageUrlWebp: '/splash/sama.webp',
      borderPresent: false
    }, {
      quote: 'I18N_TEACH_TESTIMONIAL_4',
      studentDetails: 'I18N_TEACH_STUDENT_DETAILS_4',
      imageUrl: '/splash/Gaurav_2.png',
      imageUrlWebp: '/splash/Gaurav_2.webp',
      borderPresent: true
    }];
  }

  onClickStartLearningButton(): void {
    this.siteAnalyticsService.registerClickStartLearningButtonEvent();
    this.windowRef.nativeWindow.location.href = this.classroomUrl;
    return;
  }

  onClickVisitClassroomButton(): void {
    this.siteAnalyticsService.registerClickVisitClassroomButtonEvent();
    this.windowRef.nativeWindow.location.href = this.classroomUrl;
    return;
  }

  onClickBrowseLibraryButton(): void {
    this.siteAnalyticsService.registerClickBrowseLibraryButtonEvent();
    return;
  }

  onClickGuideParentsButton(): void {
    this.siteAnalyticsService.registerClickGuideParentsButtonEvent();
    this.windowRef.nativeWindow.location.href = ('/teach');
    return;
  }

  onClickTipforParentsButton(): void {
    this.siteAnalyticsService.registerClickTipforParentsButtonEvent();
    this.windowRef.nativeWindow.location.href = ('/teach');
    return;
  }

  onClickExploreLessonsButton(): void {
    this.siteAnalyticsService.registerClickExploreLessonsButtonEvent();
    this.windowRef.nativeWindow.location.href = this.classroomUrl;
    return;
  }

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }
}

angular.module('oppia').directive('teachPage',
  downgradeComponent({component: TeachPageComponent}));
