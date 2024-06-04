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

import {Component} from '@angular/core';
import {downgradeComponent} from '@angular/upgrade/static';

import {SiteAnalyticsService} from 'services/site-analytics.service';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';

import './about-page.component.css';

@Component({
  selector: 'about-page',
  templateUrl: './about-page.component.html',
  styleUrls: ['./about-page.component.css'],
})
export class AboutPageComponent {
  features = [
    {
      i18nDescription: 'I18N_ABOUT_PAGE_AUDIO_SUBTITLES_FEATURE',
      imageFilename: '/about/cc.svg',
    },
    {
      i18nDescription: 'I18N_ABOUT_PAGE_LESSON_FEATURE',
      imageFilename: '/about/lesson_icon.svg',
    },
    {
      i18nDescription: 'I18N_ABOUT_PAGE_MOBILE_FEATURE',
      imageFilename: '/about/mobile_alt_solid.svg',
    },
    {
      i18nDescription: 'I18N_ABOUT_PAGE_WIFI_FEATURE',
      imageFilename: '/about/wifi_solid.svg',
    },
    {
      i18nDescription: 'I18N_ABOUT_PAGE_LANGUAGE_FEATURE',
      imageFilename: '/about/language_icon.svg',
    },
  ];

  oppiaWebsiteRawBarChartData = [
    {
      country: 'United States',
      userCount: 2400.0,
    },
    {country: 'India', userCount: 1100.0},
    {country: 'United Kingdom', userCount: 930.0},
    {country: 'Brazil', userCount: 650.0},
    {country: 'Canada', userCount: 420.0},
    {country: 'Nigeria', userCount: 250.0},
    {country: 'Netherlands', userCount: 250.0},
    {country: 'Egypt', userCount: 225.0},
    {country: 'Turkey', userCount: 225.0},
    {country: 'Belgium', userCount: 200.0},
  ];

  oppiaAndroidRawBarChartData = [
    {country: 'Brazil', userCount: 3250.0},
    {country: 'Pakistan', userCount: 1500.0},
    {country: 'Angola', userCount: 1270.0},
    {country: 'Kenya', userCount: 870.0},
    {country: 'Cameroon', userCount: 570.0},
    {country: 'Mozambique', userCount: 320.0},
    {country: 'India', userCount: 320.0},
    {country: 'Nigeria', userCount: 300.0},
    {country: 'Indonesia', userCount: 300.0},
    {country: 'Tanzania', userCount: 260.0},
  ];

  oppiaWebsiteBarChartData!: {
    country: string;
    userCount: number;
  }[];
  oppiaAndroidBarChartData!: {
    country: string;
    userCount: number;
  }[];

  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private siteAnalyticsService: SiteAnalyticsService
  ) {
    this.displayNormalizedUserCount();
  }

  displayNormalizedUserCount(): void {
    const maxWebsiteUserCount = Math.max(
      ...this.oppiaWebsiteRawBarChartData.map(dataPoint => dataPoint.userCount)
    );

    this.oppiaWebsiteBarChartData = this.oppiaWebsiteRawBarChartData.map(
      dataPoint => {
        const normalizedUserCount = (
          dataPoint.userCount / maxWebsiteUserCount
        ).toFixed(2);
        return {
          ...dataPoint,
          userCount: parseFloat(normalizedUserCount),
        };
      }
    );

    // Console.log(this.oppiaWebsiteBarChartData);

    const maxAndroidUserCount = Math.max(
      ...this.oppiaAndroidRawBarChartData.map(dataPoint => dataPoint.userCount)
    );

    this.oppiaAndroidBarChartData = this.oppiaAndroidRawBarChartData.map(
      dataPoint => {
        const normalizedUserCount = (
          dataPoint.userCount / maxAndroidUserCount
        ).toFixed(2);
        return {
          ...dataPoint,
          userCount: parseFloat(normalizedUserCount),
        };
      }
    );

    // Console.log(this.oppiaAndroidBarChartData);
  }

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }

  onClickVisitClassroomButton(): void {
    this.siteAnalyticsService.registerClickVisitClassroomButtonEvent();
  }

  onClickBrowseLibraryButton(): void {
    this.siteAnalyticsService.registerClickBrowseLibraryButtonEvent();
  }

  onClickCreateLessonButton(): void {
    this.siteAnalyticsService.registerCreateLessonButtonEvent();
  }
}
angular
  .module('oppia')
  .directive('aboutPage', downgradeComponent({component: AboutPageComponent}));
