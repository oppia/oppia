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

import {Component, OnInit, OnDestroy} from '@angular/core';
import {downgradeComponent} from '@angular/upgrade/static';

import {SiteAnalyticsService} from 'services/site-analytics.service';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {OppiaPlatformStatsData} from '../../oppia-platform-stats';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {WindowRef} from 'services/contextual/window-ref.service';
import {DonationBoxModalComponent} from 'pages/donate-page/donation-box/donation-box-modal.component';
import {ThanksForDonatingModalComponent} from 'pages/donate-page/thanks-for-donating-modal.component';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {TranslateService} from '@ngx-translate/core';
import {Subscription} from 'rxjs';
import {AppConstants} from 'app.constants';

import './about-page.component.css';
import {AccordionPanelData} from './data.model';

@Component({
  selector: 'about-page',
  templateUrl: './about-page.component.html',
  styleUrls: ['./about-page.component.css'],
})
export class AboutPageComponent implements OnInit, OnDestroy {
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
  ];

  partnersData = OppiaPlatformStatsData.OPPIA_PARTNERS_DATA;

  oppiaWebRawBarChartData: readonly {
    country: string;
    userCount: number;
    annotationText?: string;
  }[] = OppiaPlatformStatsData.OPPIA_WEB_RAW_BAR_CHART_DATA;

  oppiaAndroidRawBarChartData: readonly {
    country: string;
    userCount: number;
    annotationText?: string;
  }[] = OppiaPlatformStatsData.OPPIA_ANDROID_RAW_BAR_CHART_DATA;

  oppiaWebBarChartTicks: readonly {
    value: string;
    width: string;
  }[] = OppiaPlatformStatsData.OPPIA_WEB_BAR_CHART_TICKS;

  oppiaAndroidBarChartTicks: readonly {
    value: string;
    width: string;
  }[] = OppiaPlatformStatsData.OPPIA_ANDROID_BAR_CHART_TICKS;

  directiveSubscriptions = new Subscription();
  partnershipsFormLink: string = '';
  volunteerFormLink = AppConstants.VOLUNTEER_FORM_LINK;
  IMPACT_REPORT_LINK = AppConstants.IMPACT_REPORT_LINK;
  // Volunteer CTA is the default tab.
  selectedTabIndex = 1;
  volunteerRolesDetails = [
    {
      title: 'I18N_ABOUT_PAGE_CTA_GROWTH_TITLE',
      iconUrl: '/icons/growth-icon',
      description: 'I18N_ABOUT_PAGE_CTA_GROWTH_DESCRIPTION',
      listItems: [
        'I18N_ABOUT_PAGE_CTA_GROWTH_LIST_ITEM1',
        'I18N_ABOUT_PAGE_CTA_GROWTH_LIST_ITEM2',
        'I18N_ABOUT_PAGE_CTA_GROWTH_LIST_ITEM3',
      ],
    },
    {
      title: 'I18N_ABOUT_PAGE_CTA_DEV_TITLE',
      iconUrl: '/icons/dev-icon',
      description: 'I18N_ABOUT_PAGE_CTA_DEV_DESCRIPTION',
      listItems: [
        'I18N_ABOUT_PAGE_CTA_DEV_LIST_ITEM1',
        'I18N_ABOUT_PAGE_CTA_DEV_LIST_ITEM2',
        'I18N_ABOUT_PAGE_CTA_DEV_LIST_ITEM3',
      ],
    },
    {
      title: 'I18N_ABOUT_PAGE_CTA_ART_TITLE',
      iconUrl: '/icons/art-icon',
      description: 'I18N_ABOUT_PAGE_CTA_ART_DESCRIPTION',
      listItems: [
        'I18N_ABOUT_PAGE_CTA_ART_LIST_ITEM1',
        'I18N_ABOUT_PAGE_CTA_ART_LIST_ITEM2',
      ],
    },
    {
      title: 'I18N_ABOUT_PAGE_CTA_TRANSLATION_TITLE',
      iconUrl: '/icons/translation-icon',
      description: 'I18N_ABOUT_PAGE_CTA_TRANSLATION_DESCRIPTION',
      listItems: [
        'I18N_ABOUT_PAGE_CTA_TRANSLATION_LIST_ITEM1',
        'I18N_ABOUT_PAGE_CTA_TRANSLATION_LIST_ITEM2',
        'I18N_ABOUT_PAGE_CTA_TRANSLATION_LIST_ITEM3',
      ],
    },
    {
      title: 'I18N_ABOUT_PAGE_CTA_LESSON_TITLE',
      iconUrl: '/icons/lesson-icon',
      description: 'I18N_ABOUT_PAGE_CTA_LESSON_DESCRIPTION',
      listItems: [
        'I18N_ABOUT_PAGE_CTA_LESSON_LIST_ITEM1',
        'I18N_ABOUT_PAGE_CTA_LESSON_LIST_ITEM2',
        'I18N_ABOUT_PAGE_CTA_LESSON_LIST_ITEM3',
      ],
    },
  ];
  volunteerRolesIndices = {
    desktop: [
      [0, 1, 2],
      [2, 3, 4],
    ],
    tablet: [
      [0, 1],
      [2, 3],
      [3, 4],
    ],
    mobile: [[0], [1], [2], [3], [4]],
  };
  screenType!: 'desktop' | 'tablet' | 'mobile';
  showNavigationArrowsForCarousel = false;

  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private siteAnalyticsService: SiteAnalyticsService,
    private windowRef: WindowRef,
    private ngbModal: NgbModal,
    private windowDimensionsService: WindowDimensionsService,
    private translateService: TranslateService
  ) {}

  ngOnInit(): void {
    const searchParams = new URLSearchParams(
      this.windowRef.nativeWindow.location.search
    );
    const params = Object.fromEntries(searchParams.entries());
    if (params.hasOwnProperty('thanks')) {
      this.openThanksForDonatingModal();
    }

    this.setScreenType();
    this.setPartnershipsFormLink();
    this.directiveSubscriptions.add(
      this.translateService.onLangChange.subscribe(() => {
        this.setPartnershipsFormLink();
      })
    );
    this.directiveSubscriptions.add(
      this.windowDimensionsService.getResizeEvent().subscribe(() => {
        this.setScreenType();
      })
    );
  }

  setScreenType(): void {
    const width = this.windowDimensionsService.getWidth();
    if (width < 376) {
      this.screenType = 'mobile';
    } else if (width < 769) {
      this.screenType = 'tablet';
    } else {
      this.screenType = 'desktop';
    }
    this.showNavigationArrowsForCarousel = width < 641;
  }

  setPartnershipsFormLink(): void {
    const userLang = this.translateService.currentLang;

    if (userLang === 'en' || userLang === 'pcm' || userLang === 'kab') {
      this.partnershipsFormLink = AppConstants.PARTNERSHIPS_FORM_LINK;
    } else {
      let interpolatedLanguage = userLang === 'pt-br' ? 'pt' : userLang;
      this.partnershipsFormLink =
        AppConstants.PARTNERSHIPS_FORM_TRANSLATED_LINK.PREFIX +
        interpolatedLanguage +
        AppConstants.PARTNERSHIPS_FORM_TRANSLATED_LINK.SUFFIX;
    }
  }

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }

  /*
   * Returns a string that contains the image set for the srcset attribute.
   * @param {string} imagePrefix - The prefix name of the images
   * @param {string} imageExt - The extension of the images
   * @param {number[]} sizes - The sizes of the images.Eg: [1,1.5,2]
   */
  getImageSet(imagePrefix: string, imageExt: string, sizes: number[]): string {
    var imageSet = '';
    for (let i = 0; i < sizes.length; i++) {
      const sizeAfterRemovingPeriod = sizes[i].toString().replace('.', '');
      imageSet +=
        this.getStaticImageUrl(
          `${imagePrefix}${sizeAfterRemovingPeriod}x.${imageExt}`
        ) +
        ' ' +
        sizes[i] +
        'x';
      if (i < sizes.length - 1) {
        imageSet += ', ';
      }
    }
    return imageSet;
  }

  openDonationBoxModal(): void {
    this.ngbModal.open(DonationBoxModalComponent, {
      backdrop: 'static',
      size: 'xl',
      windowClass: 'donation-box-modal',
    });
  }

  openThanksForDonatingModal(): void {
    this.ngbModal.open(ThanksForDonatingModalComponent, {
      backdrop: 'static',
      size: 'xl',
    });
  }

  expandPanel(index: number): void {
    this.featuresData[index].panelIsCollapsed = false;
  }

  closePanel(index: number): void {
    this.featuresData[index].panelIsCollapsed = true;
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
angular
  .module('oppia')
  .directive('aboutPage', downgradeComponent({component: AboutPageComponent}));
