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
 * @fileoverview Component for the Oppia splash page.
 */
import {Component, OnInit} from '@angular/core';

import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {SiteAnalyticsService} from 'services/site-analytics.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {LoaderService} from 'services/loader.service';
import {UserService} from 'services/user.service';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import './splash-page.component.css';

export interface Testimonial {
  quote: string;
  studentDetails: string;
  imageUrl: string;
  imageUrlWebp: string;
  borderPresent: boolean;
}

@Component({
  selector: 'oppia-splash-page',
  templateUrl: './splash-page.component.html',
  styleUrls: ['./splash-page.component.css'],
})
export class SplashPageComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  displayedTestimonialId!: number;
  testimonialCount!: number;
  isWindowNarrow: boolean = false;
  testimonials: Testimonial[] = [];
  userIsLoggedIn: boolean = false;

  constructor(
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private siteAnalyticsService: SiteAnalyticsService,
    private urlInterpolationService: UrlInterpolationService,
    private windowDimensionService: WindowDimensionsService,
    private windowRef: WindowRef,
    private userService: UserService,
    private loaderService: LoaderService
  ) {}

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }

  getImageSet(imageName: string, imageExt: string): string {
    return (
      this.getStaticImageUrl(imageName + '1x.' + imageExt) +
      ' 1x, ' +
      this.getStaticImageUrl(imageName + '15x.' + imageExt) +
      ' 1.5x, ' +
      this.getStaticImageUrl(imageName + '2x.' + imageExt) +
      ' 2x'
    );
  }

  private _nagivateToClassroomPage(): void {
    this.windowRef.nativeWindow.location.href = '/learn';
  }

  onClickStartLearningButton(): void {
    this.siteAnalyticsService.registerClickHomePageStartLearningButtonEvent();
    this._nagivateToClassroomPage();
  }

  onClickBrowseLessonsButton(): void {
    this.siteAnalyticsService.registerClickBrowseLessonsButtonEvent();
    this._nagivateToClassroomPage();
  }

  onClickAccessAndroidButton(): void {
    this.windowRef.nativeWindow.location.href = '/android';
  }

  onClickStartContributingButton(): void {
    this.siteAnalyticsService.registerClickStartContributingButtonEvent();
    this.windowRef.nativeWindow.location.href = '/volunteer';
  }

  onClickStartTeachingButton(): void {
    this.siteAnalyticsService.registerClickStartTeachingButtonEvent();
    this.windowRef.nativeWindow.location.href = '/creator-guidelines';
  }

  // TODO(#11657): Extract the testimonials code into a separate component.
  // The 2 functions below are to cycle between values:
  // 0 to (testimonialCount - 1) for displayedTestimonialId.
  incrementDisplayedTestimonialId(): void {
    // This makes sure that incrementing from (testimonialCount - 1)
    // returns 0 instead of testimonialCount,since we want the testimonials
    // to cycle through.
    this.displayedTestimonialId =
      (this.displayedTestimonialId + 1) % this.testimonialCount;
  }

  decrementDisplayedTestimonialId(): void {
    // This makes sure that decrementing from 0, returns
    // (testimonialCount - 1) instead of -1, since we want the testimonials
    // to cycle through.
    this.displayedTestimonialId =
      (this.displayedTestimonialId + this.testimonialCount - 1) %
      this.testimonialCount;
  }

  getTestimonials(): [Testimonial, Testimonial, Testimonial, Testimonial] {
    return [
      {
        quote: 'I18N_SPLASH_TESTIMONIAL_1',
        studentDetails: 'I18N_SPLASH_STUDENT_DETAILS_1',
        imageUrl: this.getImageSet('/splash/mira', 'png'),
        imageUrlWebp: this.getImageSet('/splash/mira', 'webp'),
        borderPresent: false,
      },
      {
        quote: 'I18N_SPLASH_TESTIMONIAL_2',
        studentDetails: 'I18N_SPLASH_STUDENT_DETAILS_2',
        imageUrl: this.getImageSet('/splash/Dheeraj', 'png'),
        imageUrlWebp: this.getImageSet('/splash/Dheeraj', 'webp'),
        borderPresent: true,
      },
      {
        quote: 'I18N_SPLASH_TESTIMONIAL_3',
        studentDetails: 'I18N_SPLASH_STUDENT_DETAILS_3',
        imageUrl: this.getImageSet('/splash/sama', 'png'),
        imageUrlWebp: this.getImageSet('/splash/sama', 'webp'),
        borderPresent: false,
      },
      {
        quote: 'I18N_SPLASH_TESTIMONIAL_4',
        studentDetails: 'I18N_SPLASH_STUDENT_DETAILS_4',
        imageUrl: this.getImageSet('/splash/Gaurav', 'png'),
        imageUrlWebp: this.getImageSet('/splash/Gaurav', 'webp'),
        borderPresent: true,
      },
    ];
  }

  ngOnInit(): void {
    this.displayedTestimonialId = 0;
    this.testimonialCount = 4;
    this.testimonials = this.getTestimonials();
    this.loaderService.showLoadingScreen('Loading');
    this.userService.getUserInfoAsync().then(userInfo => {
      this.userIsLoggedIn = userInfo.isLoggedIn();
      this.loaderService.hideLoadingScreen();
    });
    this.isWindowNarrow = this.windowDimensionService.isWindowNarrow();
    this.windowDimensionService.getResizeEvent().subscribe(() => {
      this.isWindowNarrow = this.windowDimensionService.isWindowNarrow();
    });
  }
}
