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

import {SiteAnalyticsService} from 'services/site-analytics.service';
import {OppiaPlatformStatsData} from '../../oppia-platform-stats';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {DonationBoxModalComponent} from 'pages/donate-page/donation-box/donation-box-modal.component';
import {ThanksForDonatingModalComponent} from 'pages/donate-page/thanks-for-donating-modal.component';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {TranslateService} from '@ngx-translate/core';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
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
      customPanelClassNames: [
        'feature-panel',
        'e2e-test-about-page-features-panel',
      ],
      customTitleClassNames: [
        'feature-title',
        'oppia-about-platform-subtext',
        'e2e-test-about-page-features-panel-title-desktop',
      ],
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
        'oppia-about-platform-subtext',
        'free-of-cost-title',
      ],
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
  IMPACT_REPORT_LINK_2024 = AppConstants.IMPACT_REPORT_LINK_2024;
  screenType!: 'desktop' | 'tablet' | 'mobile';

  constructor(
    private siteAnalyticsService: SiteAnalyticsService,
    private urlInterpolationService: UrlInterpolationService,
    private windowRef: WindowRef,
    private ngbModal: NgbModal,
    private windowDimensionsService: WindowDimensionsService,
    private translateService: TranslateService,
    private i18nLanguageCodeService: I18nLanguageCodeService
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
    this.registerFirstTimePageViewEvent();
  }

  setScreenType(): void {
    const width = this.windowDimensionsService.getWidth();
    if (width < 581) {
      this.screenType = 'mobile';
    } else if (width < 976) {
      this.screenType = 'tablet';
    } else {
      this.screenType = 'desktop';
    }
  }

  setPartnershipsFormLink(): void {
    const userLang = this.translateService.currentLang || 'en';

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

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }

  isLanguageRTL(): boolean {
    return this.i18nLanguageCodeService.isCurrentLanguageRTL();
  }

  onClickExploreLessonsButton(): void {
    this.siteAnalyticsService.registerClickExploreLessonsButtonEvent();
  }

  onClickGetAndroidAppButton(): void {
    this.siteAnalyticsService.registerClickGetAndroidAppButtonEvent();
  }

  onClickDonateCTAButton(): void {
    this.siteAnalyticsService.registerClickDonateCTAButtonEvent();
    this.openDonationBoxModal();
  }

  onClickVolunteerCTAButton(): void {
    this.siteAnalyticsService.registerClickVolunteerCTAButtonEvent(
      'CTA button at the bottom of the About page'
    );
  }

  onClickPartnerCTAButton(): void {
    this.siteAnalyticsService.registerClickPartnerCTAButtonEvent(
      'CTA button at the bottom of the About page'
    );
  }

  onClickVolunteerLearnMoreButton(): void {
    this.siteAnalyticsService.registerClickLearnMoreVolunteerButtonEvent();
  }

  onClickPartnerLearnMoreButton(): void {
    this.siteAnalyticsService.registerClickLearnMorePartnerButtonEvent();
  }

  registerFirstTimePageViewEvent(): void {
    this.siteAnalyticsService.registerFirstTimePageViewEvent(
      AppConstants.LAST_PAGE_VIEW_TIME_LOCAL_STORAGE_KEYS_FOR_GA.ABOUT
    );
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
