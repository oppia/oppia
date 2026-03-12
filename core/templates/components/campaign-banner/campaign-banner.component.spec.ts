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
  };
}

describe('CampaignBannerComponent', () => {
  let component: CampaignBannerComponent;
  let fixture: ComponentFixture<CampaignBannerComponent>;
  let platformFeatureService: MockPlatformFeatureService;

  beforeEach(async () => {
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
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CampaignBannerComponent);
    component = fixture.componentInstance;

    platformFeatureService = TestBed.inject(
      PlatformFeatureService
    ) as unknown as MockPlatformFeatureService;

    component.campaignConfig.startDate = new Date(Date.now() - 100000);
    component.campaignConfig.endDate = new Date(Date.now() + 100000);
    component.campaignConfig.bannerReRenderIntervalMs = 100000;

    fixture.detectChanges();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should return static image url correctly', () => {
    const url = component.getStaticImageUrl('test.png');

    expect(url).toBe('/assets/test.png');
  });

  it('should set campaign end text correctly', () => {
    component.setCampaignEndText();

    expect(component.campaignEndMonth).toBeDefined();
    expect(component.campaignEndDay).toBeDefined();
  });

  it('should show banner when campaign active and feature enabled', () => {
    spyOn(localStorage, 'getItem').and.returnValue(null);

    platformFeatureService.status.EnableCampaignBanner.isEnabled = true;

    component.computeBannerVisibility();

    expect(component.shouldShowBanner).toBeTrue();
  });

  it('should hide banner if recently closed', () => {
    const now = Date.now();
    spyOn(localStorage, 'getItem').and.returnValue(now.toString());

    component.bannerReRenderInterval = 100000;

    component.computeBannerVisibility();

    expect(component.shouldShowBanner).toBeFalse();
  });

  it('should show banner if closed long ago', () => {
    const oldTime = Date.now() - 99999999;
    spyOn(localStorage, 'getItem').and.returnValue(oldTime.toString());

    component.bannerReRenderInterval = 1000;

    component.computeBannerVisibility();

    expect(component.shouldShowBanner).toBeTrue();
  });

  it('should close banner and store timestamp', () => {
    const setItemSpy = spyOn(localStorage, 'setItem');

    component.closeBanner();

    expect(setItemSpy).toHaveBeenCalled();
  });

  it('should initialize campaign config on init', () => {
    component.ngOnInit();

    expect(component.campaignBannerImagePath).toBeDefined();
  });
});
