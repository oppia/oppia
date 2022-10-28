// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the about page.
 */

import { TestBed } from '@angular/core/testing';

import { AboutPageComponent } from './about-page.component';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { PlatformFeatureService } from 'services/platform-feature.service';

class MockPlatformFeatureService {
  status = {
    AndroidBetaLandingPage: {
      isEnabled: false
    }
  };
}

class MockWindowRef {
  nativeWindow = {
    location: {
      href: '',
    },
    sessionStorage: {
      last_uploaded_audio_lang: 'en',
      removeItem: (name: string) => {}
    },
    gtag: () => {}
  };
}

describe('About Page', () => {
  let windowRef: MockWindowRef;
  let component: AboutPageComponent;
  let siteAnalyticsService: SiteAnalyticsService;
  let i18nLanguageCodeService: I18nLanguageCodeService;
  let mockPlatformFeatureService = new MockPlatformFeatureService();

  beforeEach(async() => {
    windowRef = new MockWindowRef();
    TestBed.configureTestingModule({
      declarations: [
        AboutPageComponent,
        MockTranslatePipe
      ],
      providers: [
        SiteAnalyticsService,
        UrlInterpolationService,
        {
          provide: WindowRef,
          useValue: windowRef
        },
        {
          provide: PlatformFeatureService,
          useValue: mockPlatformFeatureService
        }
      ]
    }).compileComponents();
    const aboutPageComponent = TestBed.createComponent(AboutPageComponent);
    siteAnalyticsService = TestBed.inject(SiteAnalyticsService);
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
    component = aboutPageComponent.componentInstance;

    spyOn(i18nLanguageCodeService, 'isCurrentLanguageRTL').and.returnValue(
      true);
  });
  beforeEach(angular.mock.module('oppia'));

  it('should successfully instantiate the component',
    () => {
      expect(component).toBeDefined();
    });

  it('should return correct static image url when calling getStaticImageUrl',
    () => {
      expect(component.getStaticImageUrl('/path/to/image')).toBe(
        '/assets/images/path/to/image');
    });

  it('should redirect guest user to the login page when they click' +
  'create lesson button', () => {
    spyOn(
      siteAnalyticsService, 'registerCreateLessonButtonEvent')
      .and.callThrough();
    component.onClickCreateLessonButton();

    expect(siteAnalyticsService.registerCreateLessonButtonEvent)
      .toHaveBeenCalledWith();
    expect(windowRef.nativeWindow.location.href).toBe(
      '/creator-dashboard?mode=create');
  });

  it('should register correct event on calling onClickVisitClassroomButton',
    () => {
      spyOn(
        siteAnalyticsService, 'registerClickVisitClassroomButtonEvent')
        .and.callThrough();
      component.onClickVisitClassroomButton();

      expect(siteAnalyticsService.registerClickVisitClassroomButtonEvent)
        .toHaveBeenCalledWith();
      expect(windowRef.nativeWindow.location.href).toBe(
        '/learn/math');
    });

  it('should register correct event on calling onClickBrowseLibraryButton',
    () => {
      spyOn(
        siteAnalyticsService, 'registerClickBrowseLibraryButtonEvent')
        .and.callThrough();

      component.onClickBrowseLibraryButton();

      expect(siteAnalyticsService.registerClickBrowseLibraryButtonEvent)
        .toHaveBeenCalledWith();
      expect(windowRef.nativeWindow.location.href)
        .toBe('/community-library');
    });

  it('should direct users to the android page on click', function() {
    expect(windowRef.nativeWindow.location.href).not.toEqual('/android');

    component.onClickAccessAndroidButton();

    expect(windowRef.nativeWindow.location.href).toEqual('/android');
  });

  it('should show android button if the feature is enabled', () => {
    // The androidPageIsEnabled property is set when the component is
    // constructed and the value is not modified after that so there is no
    // pre-check for this test.
    mockPlatformFeatureService.status.AndroidBetaLandingPage.isEnabled = true;

    const component = TestBed.createComponent(AboutPageComponent);

    expect(component.componentInstance.androidPageIsEnabled).toBeTrue();
  });
});
