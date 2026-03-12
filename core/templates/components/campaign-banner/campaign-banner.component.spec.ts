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

import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import {CampaignBannerComponent} from './campaign-banner.component';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {PlatformFeatureService} from 'services/platform-feature.service';
import {AppConstants} from 'app.constants';

class MockUrlInterpolationService {
  getStaticImageUrl(path: string) {
    return `mocked_url/${path}`;
  }
}

class MockPlatformFeatureService {
  status = {
    EnableCampaignBanner: {isEnabled: true},
  };
}

describe('CampaignBannerComponent', () => {
  let component: CampaignBannerComponent;
  let fixture: ComponentFixture<CampaignBannerComponent>;
  let platformFeatureService: PlatformFeatureService;
  let urlInterpolationService: UrlInterpolationService;

  const mockCampaignConfig = {
    startDate: new Date(Date.now() - 1000 * 60 * 60),
    endDate: new Date(Date.now() + 1000 * 60 * 60),
    bannerImageRelativePath: 'banner.png',
    bannerReRenderIntervalMs: 1000 * 60 * 60,
  };

  beforeEach(async () => {
    spyOnProperty(AppConstants, 'CAMPAIGN_CONFIG', 'get').and.returnValue(
      mockCampaignConfig
    );

    await TestBed.configureTestingModule({
      declarations: [CampaignBannerComponent],
      providers: [
        {
          provide: UrlInterpolationService,
          useClass: MockUrlInterpolationService,
        },
        {provide: PlatformFeatureService, useClass: MockPlatformFeatureService},
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CampaignBannerComponent);
    component = fixture.componentInstance;
    platformFeatureService = TestBed.inject(PlatformFeatureService);
    urlInterpolationService = TestBed.inject(UrlInterpolationService);

    localStorage.clear();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize campaign config and set text on ngOnInit', () => {
    component.ngOnInit();

    expect(component.bannerReRenderInterval).toBe(
      mockCampaignConfig.bannerReRenderIntervalMs
    );
    expect(component.campaignBannerImagePath).toBe(
      mockCampaignConfig.bannerImageRelativePath
    );
    expect(component.campaignEndMonth).toBe(
      mockCampaignConfig.endDate.toLocaleDateString('en-US', {month: 'long'})
    );
    expect(component.campaignEndDay).toBe(
      mockCampaignConfig.endDate.toLocaleDateString('en-US', {day: 'numeric'})
    );
  });

  it('should compute banner visibility correctly when feature is enabled and campaign active', () => {
    component.ngOnInit();
    expect(component.shouldShowBanner).toBeTrue();
  });

  it('should hide banner if feature is disabled', () => {
    platformFeatureService.status.EnableCampaignBanner.isEnabled = false;
    component.ngOnInit();
    expect(component.shouldShowBanner).toBeFalse();
  });

  it('should hide banner if campaign is inactive', () => {
    const pastConfig = {
      ...mockCampaignConfig,
      startDate: new Date(Date.now() - 1000 * 60 * 60 * 24),
      endDate: new Date(Date.now() - 1000 * 60 * 60),
    };
    spyOnProperty(AppConstants, 'CAMPAIGN_CONFIG', 'get').and.returnValue(
      pastConfig
    );

    component.ngOnInit();
    expect(component.shouldShowBanner).toBeFalse();
  });

  it('should hide banner if recently closed', () => {
    localStorage.setItem(component['STORAGE_KEY'], Date.now().toString());
    component.ngOnInit();
    expect(component.shouldShowBanner).toBeFalse();
  });

  it('should compute banner as active correctly', () => {
    expect(component['isCampaignActive']()).toBeTrue();

    const oldConfig = {
      ...mockCampaignConfig,
      startDate: new Date(Date.now() - 1000 * 60 * 60 * 24),
      endDate: new Date(Date.now() - 1000 * 60 * 60 * 12),
    };
    spyOnProperty(AppConstants, 'CAMPAIGN_CONFIG', 'get').and.returnValue(
      oldConfig
    );
    expect(component['isCampaignActive']()).toBeFalse();
  });

  it('should return static image url correctly', () => {
    const url = component.getStaticImageUrl('banner.png');
    expect(url).toBe('mocked_url/banner.png');
  });

  it('should close banner and store timestamp', fakeAsync(() => {
    component.ngOnInit();
    expect(component.shouldShowBanner).toBeTrue();

    component.closeBanner();
    tick();

    const storedTime = Number(localStorage.getItem(component['STORAGE_KEY']));
    expect(storedTime).toBeGreaterThan(0);
    expect(component.shouldShowBanner).toBeFalse();
  }));
});
