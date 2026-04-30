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
 * @fileoverview Unit tests for CampaignBannerComponent.
 */

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';

import {CampaignBannerComponent} from './campaign-banner.component';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {PlatformFeatureService} from 'services/platform-feature.service';
import {AppConstants} from 'app.constants';
import {SiteAnalyticsService} from 'services/site-analytics.service';
import {WindowRef} from 'services/contextual/window-ref.service';

interface CampaignConfig {
  startDate: Date;
  endDate: Date;
  bannerReRenderIntervalMs: number;
  bannerImageRelativePath: string;
}

class MockUrlInterpolationService {
  getStaticImageUrl(imagePath: string): string {
    return `/assets/${imagePath}`;
  }
}

class MockPlatformFeatureService {
  status = {
    EnableCampaignBanner: {
      isEnabled: true,
    },
    EnableCampaignBannerTestMode: {
      isEnabled: false,
    },
  };
}

class MockWindowRef {
  nativeWindow = {
    location: {
      pathname: '/learn/math',
      href: '',
    },
    gtag: () => {},
  };
}

class MockSiteAnalyticsService {
  registerCampaignBannerDonateButtonClick(): void {}
  registerCampaignBannerVisibility(): void {}
}

describe('CampaignBannerComponent', () => {
  let component: CampaignBannerComponent;
  let fixture: ComponentFixture<CampaignBannerComponent>;
  let platformFeatureService: MockPlatformFeatureService;
  let siteAnalyticsService: SiteAnalyticsService;
  let mockWindowRef: MockWindowRef;

  beforeEach(async () => {
    mockWindowRef = new MockWindowRef();
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [CampaignBannerComponent],
      providers: [
        {
          provide: UrlInterpolationService,
          useClass: MockUrlInterpolationService,
        },
        {
          provide: PlatformFeatureService,
          useClass: MockPlatformFeatureService,
        },
        {
          provide: WindowRef,
          useValue: mockWindowRef,
        },
        {
          provide: SiteAnalyticsService,
          useClass: MockSiteAnalyticsService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CampaignBannerComponent);
    component = fixture.componentInstance;

    platformFeatureService = TestBed.inject(
      PlatformFeatureService
    ) as unknown as MockPlatformFeatureService;
    siteAnalyticsService = TestBed.inject(SiteAnalyticsService);
    spyOn(localStorage, 'getItem').and.callFake((key: string) => {
      if (key === 'lang') {
        return 'en';
      }
      return null;
    });

    fixture.detectChanges();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should check if language is English correctly', () => {
    (localStorage.getItem as jasmine.Spy).and.returnValue('en');
    expect(component.isLanguageEnglish()).toBe(true);

    (localStorage.getItem as jasmine.Spy).and.returnValue('hi');
    expect(component.isLanguageEnglish()).toBe(false);
  });

  it('should return static image url correctly', () => {
    expect(component.getStaticImageUrl('test.webp')).toBe('/assets/test.webp');
  });

  it('should set campaign end text correctly', () => {
    component.setCampaignEndText();
    expect(component.campaignEndMonth).toBeDefined();
    expect(component.campaignEndDay).toBeDefined();
  });

  it('should show banner when campaign active and lang is English', () => {
    platformFeatureService.status.EnableCampaignBanner.isEnabled = true;

    component.setCampaignConfig();

    const config = component.campaignConfig as CampaignConfig;
    config.startDate = new Date(Date.now() - 100000);
    config.endDate = new Date(Date.now() + 100000);

    component.computeBannerVisibility();

    expect(component.shouldShowBanner).toBe(true);
  });

  it('should hide banner if language is not English', () => {
    (localStorage.getItem as jasmine.Spy).and.returnValue('pt');

    component.setCampaignConfig();
    component.computeBannerVisibility();

    expect(component.shouldShowBanner).toBe(false);
  });

  it('should hide banner if recently closed', () => {
    const now = Date.now();

    (localStorage.getItem as jasmine.Spy).and.callFake((key: string) => {
      if (key === 'lang') {
        return 'en';
      }
      if (key === 'campaignBannerClosedAt') {
        return now.toString();
      }
      return null;
    });

    component.setCampaignConfig();
    component.bannerReRenderInterval = 100000;

    component.computeBannerVisibility();
    expect(component.shouldShowBanner).toBe(false);
  });

  it('should show banner if closed long ago', () => {
    const oldTime = Date.now() - 99999999;
    (localStorage.getItem as jasmine.Spy).and.callFake((key: string) => {
      if (key === 'lang') {
        return 'en';
      }
      if (key === 'campaignBannerClosedAt') {
        return oldTime.toString();
      }
      return null;
    });
    component.setCampaignConfig();
    const config = component.campaignConfig as CampaignConfig;
    config.startDate = new Date(Date.now() - 100000);
    config.endDate = new Date(Date.now() + 100000);

    component.bannerReRenderInterval = 1000;

    component.computeBannerVisibility();

    expect(component.shouldShowBanner).toBe(true);
  });

  it('should hide banner if feature flag is disabled', () => {
    platformFeatureService.status.EnableCampaignBanner.isEnabled = false;
    component.setCampaignConfig();
    component.computeBannerVisibility();
    expect(component.shouldShowBanner).toBe(false);
  });

  it('should hide banner if campaign is not active', () => {
    component.setCampaignConfig();

    const config = component.campaignConfig as CampaignConfig;

    config.startDate = new Date(Date.now() - 200000);
    config.endDate = new Date(Date.now() - 100000);

    component.computeBannerVisibility();
    expect(component.shouldShowBanner).toBe(false);
  });

  it('should close banner and store timestamp', () => {
    const setItemSpy = spyOn(localStorage, 'setItem');
    const computeVisibilitySpy = spyOn(component, 'computeBannerVisibility');

    component.closeBanner();

    expect(setItemSpy).toHaveBeenCalledWith(
      'campaignBannerClosedAt',
      jasmine.any(String)
    );

    expect(computeVisibilitySpy).toHaveBeenCalled();
  });

  it('should initialize campaign config on init', () => {
    spyOn(component, 'setCampaignConfig').and.callThrough();

    component.ngOnInit();

    expect(component.setCampaignConfig).toHaveBeenCalled();

    expect(component.campaignBannerImagePath).toBe(
      AppConstants.FINANCIAL_LITERACY_CAMPAIGN_CONFIG_PROD
        .bannerImageRelativePath
    );

    expect(component.bannerReRenderInterval).toBe(
      AppConstants.FINANCIAL_LITERACY_CAMPAIGN_CONFIG_PROD
        .bannerReRenderIntervalMs
    );
  });

  it('should set campaign config to PROD when prod flag enabled', () => {
    platformFeatureService.status.EnableCampaignBanner.isEnabled = true;
    platformFeatureService.status.EnableCampaignBannerTestMode.isEnabled =
      false;

    component.setCampaignConfig();

    expect(component.campaignConfig).toEqual(
      AppConstants.FINANCIAL_LITERACY_CAMPAIGN_CONFIG_PROD
    );
  });

  it('should set campaign config to TEST when prod flag disabled', () => {
    platformFeatureService.status.EnableCampaignBanner.isEnabled = false;

    component.setCampaignConfig();

    expect(component.campaignConfig).toEqual(
      AppConstants.FINANCIAL_LITERACY_CAMPAIGN_CONFIG_TEST
    );
  });

  it('should show banner when test mode flag enabled', () => {
    platformFeatureService.status.EnableCampaignBanner.isEnabled = false;
    platformFeatureService.status.EnableCampaignBannerTestMode.isEnabled = true;

    component.setCampaignConfig();
    component.computeBannerVisibility();

    expect(component.shouldShowBanner).toBe(true);
  });
  it('should navigate to donate page and register analytics event', () => {
    spyOn(siteAnalyticsService, 'registerCampaignBannerDonateButtonClick');
    expect(mockWindowRef.nativeWindow.location.href).toBe('');

    component.navigateToDonatePage();

    expect(
      siteAnalyticsService.registerCampaignBannerDonateButtonClick
    ).toHaveBeenCalled();

    expect(mockWindowRef.nativeWindow.location.href).toBe('/donate');
  });
  it('should call registerBannerVisibility when banner is visible', () => {
    spyOn(siteAnalyticsService, 'registerCampaignBannerVisibility');

    platformFeatureService.status.EnableCampaignBanner.isEnabled = true;
    (localStorage.getItem as jasmine.Spy).and.callFake((key: string) => {
      if (key === 'lang') {
        return 'en';
      }
      return null;
    });

    component.setCampaignConfig();

    const config = component.campaignConfig as CampaignConfig;
    config.startDate = new Date(Date.now() - 100000);
    config.endDate = new Date(Date.now() + 100000);

    component.computeBannerVisibility();

    expect(component.shouldShowBanner).toBe(true);
    expect(
      siteAnalyticsService.registerCampaignBannerVisibility
    ).toHaveBeenCalled();
  });
});
