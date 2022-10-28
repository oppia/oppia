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
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { LoaderService } from 'services/loader.service';
import { UserService } from 'services/user.service';
import { Subscription } from 'rxjs';
import { PlatformFeatureService } from 'services/platform-feature.service';

export interface Testimonial {
  quote: string;
  studentDetails: string;
  imageUrl: string;
  imageUrlWebp: string;
  borderPresent: boolean;
  altText: string;
}

@Component({
  selector: 'teach-page',
  templateUrl: './teach-page.component.html',
  styleUrls: []
})

export class TeachPageComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  classroomUrlFragment!: string;
  classroomUrl!: string;
  displayedTestimonialId!: number;
  libraryUrl!: string;
  testimonialCount!: number;
  testimonials: Testimonial[] = [];
  isWindowNarrow: boolean = false;
  userIsLoggedIn: boolean = false;
  directiveSubscriptions = new Subscription();
  androidPageIsEnabled: boolean = (
    this.platformFeatureService.status.AndroidBetaLandingPage.isEnabled
  );

  constructor(
    private siteAnalyticsService: SiteAnalyticsService,
    private urlInterpolationService: UrlInterpolationService,
    private windowDimensionService: WindowDimensionsService,
    private windowRef: WindowRef,
    private userService: UserService,
    private loaderService: LoaderService,
    private platformFeatureService: PlatformFeatureService
  ) {}

  ngOnInit(): void {
    this.displayedTestimonialId = 0;
    // Change count after all testimonials are available.
    this.testimonialCount = 3;
    this.testimonials = this.getTestimonials();
    this.classroomUrl = this.urlInterpolationService.interpolateUrl(
      '/learn/<classroomUrlFragment>', {
        classroomUrlFragment: splashConstants.DEFAULT_CLASSROOM_URL_FRAGMENT
      });
    this.libraryUrl = '/community-library';
    this.loaderService.showLoadingScreen('Loading');
    this.userService.getUserInfoAsync().then((userInfo) => {
      this.userIsLoggedIn = userInfo.isLoggedIn();
      this.loaderService.hideLoadingScreen();
    });
    this.isWindowNarrow = this.windowDimensionService.isWindowNarrow();
    this.directiveSubscriptions.add(
      this.windowDimensionService.getResizeEvent().subscribe(() => {
        this.isWindowNarrow = this.windowDimensionService.isWindowNarrow();
      }));
  }

  // TODO(#11657): Extract the testimonials code into a separate component.
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

  getTestimonials(): [Testimonial, Testimonial, Testimonial] {
    return [{
      quote: 'I18N_TEACH_TESTIMONIAL_1',
      studentDetails: 'I18N_TEACH_STUDENT_DETAILS_1',
      imageUrl: '/teach/riya.jpg',
      imageUrlWebp: '/teach/riya.webp',
      borderPresent: true,
      altText: 'Photo of Riya'
    }, {
      quote: 'I18N_TEACH_TESTIMONIAL_2',
      studentDetails: 'I18N_TEACH_STUDENT_DETAILS_2',
      imageUrl: '/teach/awad.jpg',
      imageUrlWebp: '/teach/awad.webp',
      borderPresent: true,
      altText: 'Photo of Awad'
    }, {
      quote: 'I18N_TEACH_TESTIMONIAL_3',
      studentDetails: 'I18N_TEACH_STUDENT_DETAILS_3',
      imageUrl: '/teach/himanshu.jpg',
      imageUrlWebp: '/teach/himanshu.webp',
      borderPresent: true,
      altText: 'Photo of Himanshu'
    }];
  }

  onClickAccessAndroidButton(): void {
    this.windowRef.nativeWindow.location.href = '/android';
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
    this.windowRef.nativeWindow.location.href = '/community-library';
    return;
  }

  onClickGuideParentsButton(): void {
    this.siteAnalyticsService.registerClickGuideParentsButtonEvent();
    this.windowRef.nativeWindow.location.href = '/teach';
    return;
  }

  onClickTipforParentsButton(): void {
    this.siteAnalyticsService.registerClickTipforParentsButtonEvent();
    this.windowRef.nativeWindow.location.href = '/teach';
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
