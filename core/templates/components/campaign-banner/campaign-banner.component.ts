// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the financial campaign banner displayed on the top of the page during
 */

import {Component, OnInit} from '@angular/core';
import './campaign-banner.component.css';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {PlatformFeatureService} from 'services/platform-feature.service';
import {SiteAnalyticsService} from 'services/site-analytics.service';
import {AppConstants} from 'app.constants';
import {WindowRef} from 'services/contextual/window-ref.service';

@Component({
  selector: 'campaign-banner',
  templateUrl: './campaign-banner.component.html',
  styleUrls: ['./campaign-banner.component.css'],
})
export class CampaignBannerComponent implements OnInit {
  constructor(
    private windowRef: WindowRef,
    private platformFeaturesService: PlatformFeatureService,
    private urlInterpolationService: UrlInterpolationService,
    private siteAnalyticsService: SiteAnalyticsService
  ) {}

  shouldShowBanner = false;

  STORAGE_KEY = 'campaignBannerClosedAt';
  LANGUAGE_CODE_KEY = 'lang';

  campaignEndMonth!: string;
  campaignEndDay!: string;
  campaignBannerImagePath!: string;
  bannerReRenderInterval!: number;

  campaignConfig!: typeof AppConstants.FINANCIAL_LITERACY_CAMPAIGN_CONFIG_TEST;

  ngOnInit(): void {
    this.setCampaignConfig();
    this.initializeCampaignConfig();
    this.setCampaignEndText();
    this.computeBannerVisibility();
  }
  setCampaignConfig(): void {
    const isProdMode =
      this.platformFeaturesService.status.EnableCampaignBanner.isEnabled;
    this.campaignConfig = isProdMode
      ? AppConstants.FINANCIAL_LITERACY_CAMPAIGN_CONFIG_PROD
      : AppConstants.FINANCIAL_LITERACY_CAMPAIGN_CONFIG_TEST;
  }

  private initializeCampaignConfig(): void {
    this.bannerReRenderInterval = this.campaignConfig.bannerReRenderIntervalMs;

    this.campaignBannerImagePath = this.campaignConfig.bannerImageRelativePath;
  }

  computeBannerVisibility(): void {
    const featureEnabled =
      this.platformFeaturesService.status.EnableCampaignBanner.isEnabled ||
      this.platformFeaturesService.status.EnableCampaignBannerTestMode
        .isEnabled;

    const active = this.isCampaignActive();

    const closedAt = localStorage.getItem(this.STORAGE_KEY);
    let recentlyClosed = false;
    if (closedAt) {
      const timeSinceClosed = Date.now() - Number(closedAt);
      recentlyClosed = timeSinceClosed < this.bannerReRenderInterval;
    }

    this.shouldShowBanner =
      featureEnabled && this.isLanguageEnglish() && active && !recentlyClosed;

    if (this.shouldShowBanner) {
      this.registerBannerVisibility();
    }
  }

  isCampaignActive(): boolean {
    const now = new Date();

    return (
      now >= this.campaignConfig.startDate && now <= this.campaignConfig.endDate
    );
  }

  setCampaignEndText(): void {
    const endDate = this.campaignConfig.endDate;

    this.campaignEndMonth = endDate.toLocaleDateString('en-US', {
      month: 'long',
    });

    this.campaignEndDay = endDate.toLocaleDateString('en-US', {day: 'numeric'});
  }

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticImageUrl(imagePath);
  }

  closeBanner(): void {
    localStorage.setItem(this.STORAGE_KEY, Date.now().toString());
    this.computeBannerVisibility();
  }

  navigateToDonatePage(): void {
    this.siteAnalyticsService.registerCampaignBannerDonateButtonClick();
    this.windowRef.nativeWindow.location.href = '/donate';
    this.closeBanner();
  }

  isLanguageEnglish(): boolean {
    const languageCode = localStorage.getItem(this.LANGUAGE_CODE_KEY);
    return languageCode === 'en';
  }

  registerBannerVisibility(): void {
    this.siteAnalyticsService.registerCampaignBannerVisibility();
  }
}
