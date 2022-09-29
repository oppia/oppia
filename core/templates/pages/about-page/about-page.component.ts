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

import { Component } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';

import constants from 'assets/constants';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { WindowRef } from
  'services/contextual/window-ref.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { PlatformFeatureService } from 'services/platform-feature.service';

import './about-page.component.css';


@Component({
  selector: 'about-page',
  templateUrl: './about-page.component.html'
})
export class AboutPageComponent {
  features = [{
    i18nDescription: 'I18N_ABOUT_PAGE_AUDIO_SUBTITLES_FEATURE',
    imageFilename: '/about/cc.svg',
  }, {
    i18nDescription: 'I18N_ABOUT_PAGE_LESSON_FEATURE',
    imageFilename: '/about/lesson_icon.svg'
  }, {
    i18nDescription: 'I18N_ABOUT_PAGE_MOBILE_FEATURE',
    imageFilename: '/about/mobile_alt_solid.svg'
  }, {
    i18nDescription: 'I18N_ABOUT_PAGE_WIFI_FEATURE',
    imageFilename: '/about/wifi_solid.svg'
  }, {
    i18nDescription: 'I18N_ABOUT_PAGE_LANGUAGE_FEATURE',
    imageFilename: '/about/language_icon.svg'
  }];

  androidPageIsEnabled: boolean = (
    this.platformFeatureService.status.AndroidBetaLandingPage.isEnabled
  );

  constructor(
    private i18nLanguageCodeService: I18nLanguageCodeService,
    private urlInterpolationService: UrlInterpolationService,
    private windowRef: WindowRef,
    private siteAnalyticsService: SiteAnalyticsService,
    private platformFeatureService: PlatformFeatureService
  ) {}

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }

  onClickAccessAndroidButton(): void {
    this.windowRef.nativeWindow.location.href = '/android';
  }

  onClickVisitClassroomButton(): void {
    let classroomUrl = this.urlInterpolationService.interpolateUrl(
      '/learn/<classroomUrlFragment>', {
        classroomUrlFragment: constants.DEFAULT_CLASSROOM_URL_FRAGMENT
      });
    this.siteAnalyticsService.registerClickVisitClassroomButtonEvent();
    this.windowRef.nativeWindow.location.href = classroomUrl;
  }

  onClickBrowseLibraryButton(): void {
    this.siteAnalyticsService.registerClickBrowseLibraryButtonEvent();
    this.windowRef.nativeWindow.location.href = '/community-library';
  }

  onClickCreateLessonButton(): void {
    this.siteAnalyticsService.registerCreateLessonButtonEvent();
    this.windowRef.nativeWindow.location.href = (
      '/creator-dashboard?mode=create');
  }
}
angular.module('oppia').directive(
  'aboutPage', downgradeComponent({component: AboutPageComponent}));
