// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for stewards landing page.
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { UrlService } from 'services/contextual/url.service';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { StewardsLandingPageComponent } from './stewards-landing-page.component';

describe('Stewards Landing Page Component', () => {
  let fixture: ComponentFixture<StewardsLandingPageComponent>;
  let componentInstance: StewardsLandingPageComponent;
  let urlService: UrlService;
  let urlInterpolationService: UrlInterpolationService;
  let siteAnalyticsService: SiteAnalyticsService;

  class MockWindowRef {
    nativeWindow = {
      location: {
        href: ''
      }
    };
  }

  class MockWindowDimensionsService {
    getResizeEvent() {
      return {
        subscribe(next) {
          next();
        }
      };
    }

    getWidth(): number {
      return 700;
    }
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [],
      declarations: [
        StewardsLandingPageComponent
      ],
      providers: [
        SiteAnalyticsService,
        UrlInterpolationService,
        UrlService,
        {
          provide: WindowDimensionsService,
          useClass: MockWindowDimensionsService
        },
        {
          provide: WindowRef,
          useClass: MockWindowRef
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StewardsLandingPageComponent);
    componentInstance = fixture.componentInstance;
    urlService = TestBed.inject(UrlService);
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    siteAnalyticsService = TestBed.inject(SiteAnalyticsService);
  });

  afterEach(() => {
    componentInstance.ngOnDestory();
  });

  it('should be defined', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should intialize', () => {
    const buttonDefinitions = [{
      text: 'button',
      href: 'test_href'
    }];
    spyOn(urlService, 'getPathname').and.returnValue('/parents');
    spyOn(componentInstance, 'getButtonDefinitions').and.returnValue(
      buttonDefinitions);
    spyOn(componentInstance, 'isWindowNarrow').and.returnValue(true);
    componentInstance.ngOnInit();
    expect(componentInstance.activeTabName).toEqual('Parents');
    expect(componentInstance.buttonDefinitions).toEqual(buttonDefinitions);
    expect(componentInstance.windowIsNarrow).toBeTrue();
  });

  it('should handle tab changes', () => {
    componentInstance.setActiveTabName(componentInstance.TAB_NAME_PARENTS);
    expect(componentInstance.getActiveTabNameInSingularForm()).toEqual(
      'Parent');
    expect(componentInstance.isActiveTab(
      componentInstance.TAB_NAME_PARENTS)).toBeTrue();
    componentInstance.setActiveTabName(componentInstance.TAB_NAME_NONPROFITS);
    expect(componentInstance.getActiveTabNameInSingularForm()).toEqual(
      'Nonprofit');
    componentInstance.setActiveTabName(componentInstance.TAB_NAME_TEACHERS);
    expect(componentInstance.getActiveTabNameInSingularForm()).toEqual(
      'Teacher');
    componentInstance.setActiveTabName(componentInstance.TAB_NAME_VOLUNTEERS);
    expect(componentInstance.getActiveTabNameInSingularForm()).toEqual(
      'Volunteer');
    expect(() => {
      componentInstance.setActiveTabName('NOT_VALID');
    }).toThrowError(
      'Invalid tab name: NOT_VALID');
    expect(() => {
      componentInstance.getActiveTabNameInSingularForm();
    }).toThrowError(
      'Invalid active tab name: NOT_VALID');
  });

  it('should get static image url', () => {
    let imageUrl = 'image_url';
    spyOn(urlInterpolationService, 'getStaticImageUrl').and.returnValue(
      imageUrl);
    expect(componentInstance.getStaticImageUrl('')).toEqual(imageUrl);
  });

  it('should get static subject image url', () => {
    let imageUrl = 'static_image_url';
    spyOn(urlInterpolationService, 'getStaticImageUrl').and.returnValue(
      imageUrl);
    expect(componentInstance.getStaticSubjectImageUrl('')).toEqual(imageUrl);
  });

  it('should handle click', fakeAsync(() => {
    spyOn(siteAnalyticsService, 'registerStewardsLandingPageEvent');
    let href = 'href';
    componentInstance.onClickButton({
      text: 'text',
      href: href
    });
    tick(200);
    expect(siteAnalyticsService.registerStewardsLandingPageEvent)
      .toHaveBeenCalled();
  }));

  it('should tell if window is narrow', () => {
    expect(componentInstance.isWindowNarrow(800)).toBeTrue();
    expect(componentInstance.isWindowNarrow(900)).toBeFalse();
  });
});
