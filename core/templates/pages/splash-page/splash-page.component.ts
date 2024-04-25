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

import {AppConstants} from 'app.constants';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {SiteAnalyticsService} from 'services/site-analytics.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {LoaderService} from 'services/loader.service';
import {UserService} from 'services/user.service';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import './splash-page.component.css';

@Component({
  selector: 'oppia-splash-page',
  templateUrl: './splash-page.component.html',
  styleUrls: ['./splash-page.component.css'],
})
export class SplashPageComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  classroomUrlFragment!: string;
  classroomUrl!: string;
  displayedTestimonialId!: number;
  testimonialCount!: number;
  isWindowNarrow: boolean = false;
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

  private _navigateToClassroomPage(): void {
    this.windowRef.nativeWindow.location.href = this.classroomUrl;
  }

  private _navigateToAccountCreationPage(): void {
    this.userService.getLoginUrlAsync().then(loginUrl => {
      if (loginUrl) {
        setTimeout(() => {
          this.windowRef.nativeWindow.location.href = loginUrl;
        }, 150);
      } else {
        this.windowRef.nativeWindow.location.reload();
      }
    });
  }

  onClickStartLearningButton(): void {
    this.siteAnalyticsService.registerClickHomePageStartLearningButtonEvent();
    this._navigateToClassroomPage();
  }

  onClickCreateAccountButton(): void {
    this.siteAnalyticsService.registerClickCreateAccountButtonEvent();
    this._navigateToAccountCreationPage();
  }

  onClickExploreClassroomButton(): void {
    this.siteAnalyticsService.registerClickExploreClassroomButtonEvent();
    this._navigateToClassroomPage();
  }

  onClickExploreLessonsButton(): void {
    this.siteAnalyticsService.registerClickExploreLessonsButtonEvent();
    this.windowRef.nativeWindow.location.href = '/community-library';
  }

  onClickStartTeachingButton(): void {
    this.siteAnalyticsService.registerClickStartTeachingButtonEvent();
    this._navigateToAccountCreationPage();
  }

  onClickStartExploringButton(): void {
    this.siteAnalyticsService.registerClickStartExploringButtonEvent();
    this._navigateToAccountCreationPage();
  }

  onClickStartContributingButton(): void {
    this.siteAnalyticsService.registerClickStartContributingButtonEvent();
    this.windowRef.nativeWindow.location.href = '/volunteer';
  }

  ngOnInit(): void {
    this.displayedTestimonialId = 0;
    this.testimonialCount = 4;
    this.classroomUrl = this.urlInterpolationService.interpolateUrl(
      '/learn/<classroomUrlFragment>',
      {
        classroomUrlFragment: AppConstants.DEFAULT_CLASSROOM_URL_FRAGMENT,
      }
    );
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
