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
import {AccordionPanelData} from './data.model';

@Component({
  selector: 'about-page',
  templateUrl: './about-page.component.html',
  styleUrls: ['./about-page.component.css'],
})
export class AboutPageComponent {
  featuresData: AccordionPanelData[] = [
    {
      title: 'I18N_ABOUT_PAGE_FEATURE_TITLE1',
      text: 'I18N_ABOUT_PAGE_FEATURE_SUBTEXT1',
      customPanelClassNames: ['feature-panel'],
      customTitleClassNames: ['feature-title', 'oppia-about-platform-subtext'],
      panelIsCollapsed: true,
    },
    {
      title: 'I18N_ABOUT_PAGE_FEATURE_TITLE2',
      text: 'I18N_ABOUT_PAGE_FEATURE_SUBTEXT2',
      customPanelClassNames: ['feature-panel'],
      customTitleClassNames: ['feature-title', 'oppia-about-platform-subtext'],
      panelIsCollapsed: true,
    },
    {
      title: 'I18N_ABOUT_PAGE_FEATURE_TITLE3',
      text: 'I18N_ABOUT_PAGE_FEATURE_SUBTEXT3',
      customPanelClassNames: ['feature-panel'],
      customTitleClassNames: ['feature-title', 'oppia-about-platform-subtext'],
      panelIsCollapsed: true,
    },
    {
      title: 'I18N_ABOUT_PAGE_FEATURE_TITLE4',
      text: 'I18N_ABOUT_PAGE_FEATURE_SUBTEXT4',
      customPanelClassNames: ['feature-panel', 'free-of-cost-panel'],
      customTitleClassNames: [
        'feature-title',
        'free-of-cost-title',
        'oppia-about-platform-subtext',
      ],
      panelIsCollapsed: true,
    },
  ];

  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private siteAnalyticsService: SiteAnalyticsService
  ) {}

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

  expandPanel(index: number): void {
    this.featuresData[index].panelIsCollapsed = false;
  }

  closePanel(index: number): void {
    this.featuresData[index].panelIsCollapsed = true;
  }
}
angular
  .module('oppia')
  .directive('aboutPage', downgradeComponent({component: AboutPageComponent}));
