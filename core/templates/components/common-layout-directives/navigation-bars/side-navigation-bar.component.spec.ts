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
 * @fileoverview Unit tests for SideNavigationBarComponent.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {HttpClientModule} from '@angular/common/http';
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {APP_BASE_HREF} from '@angular/common';
import {RouterModule} from '@angular/router';

import {SmartRouterModule} from 'hybrid-router-module-provider';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {SiteAnalyticsService} from 'services/site-analytics.service';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {SideNavigationBarComponent} from './side-navigation-bar.component';
import {UserService} from 'services/user.service';
import {UserInfo} from 'domain/user/user-info.model';
import {SidebarStatusService} from 'services/sidebar-status.service';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {NavbarAndFooterGATrackingPages} from 'app.constants';

class MockWindowRef {
  nativeWindow = {
    location: {
      pathname: '/test',
      href: '',
    },
    gtag: () => {},
  };
}

describe('Side Navigation Bar Component', () => {
  let fixture: ComponentFixture<SideNavigationBarComponent>;
  let componentInstance: SideNavigationBarComponent;
  let currentUrl: string = '/test';
  let imageUrl: string = 'image_url';
  let mockWindowRef: MockWindowRef;
  let siteAnalyticsService: SiteAnalyticsService;
  let sidebarStatusService: SidebarStatusService;
  let userService: UserService;
  let i18nLanguageCodeService: I18nLanguageCodeService;

  class MockUrlInterpolationService {
    getStaticImageUrl(imagePath: string): string {
      return imageUrl;
    }
  }

  beforeEach(waitForAsync(() => {
    mockWindowRef = new MockWindowRef();
    TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [
        HttpClientModule,
        HttpClientTestingModule,
        // TODO(#13443): Remove hybrid router module provider once all pages are
        // migrated to angular router.
        SmartRouterModule,
        RouterModule.forRoot([]),
      ],
      declarations: [SideNavigationBarComponent, MockTranslatePipe],
      providers: [
        {
          provide: WindowRef,
          useValue: mockWindowRef,
        },
        {
          provide: UrlInterpolationService,
          useClass: MockUrlInterpolationService,
        },
        {
          provide: APP_BASE_HREF,
          useValue: '/',
        },
      ],
    });
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SideNavigationBarComponent);
    siteAnalyticsService = TestBed.inject(SiteAnalyticsService);
    sidebarStatusService = TestBed.inject(SidebarStatusService);
    componentInstance = fixture.componentInstance;
    userService = TestBed.inject(UserService);
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);

    spyOn(i18nLanguageCodeService, 'isCurrentLanguageRTL').and.returnValue(
      true
    );
  });

  it('should create', () => {
    expect(componentInstance).toBeDefined();
  });

  it('should initialize', () => {
    componentInstance.ngOnInit();
    expect(componentInstance.currentUrl).toEqual(currentUrl);
  });

  it('should able to stop click propagation further', () => {
    const clickEvent = new CustomEvent('click');
    spyOn(clickEvent, 'stopPropagation');
    componentInstance.stopclickfurther(clickEvent);
    expect(clickEvent.stopPropagation).toHaveBeenCalled();
  });

  it('should toggle learn submenu', () => {
    componentInstance.learnSubmenuIsShown = false;
    componentInstance.togglelearnSubmenu();
    expect(componentInstance.learnSubmenuIsShown).toBeTrue();
    componentInstance.togglelearnSubmenu();
    expect(componentInstance.learnSubmenuIsShown).toBeFalse();
  });

  it('should toggle get involved submenu', () => {
    componentInstance.getinvolvedSubmenuIsShown = false;
    componentInstance.togglegetinvolvedSubmenu();
    expect(componentInstance.getinvolvedSubmenuIsShown).toBeTrue();
    componentInstance.togglegetinvolvedSubmenu();
    expect(componentInstance.getinvolvedSubmenuIsShown).toBeFalse();
  });

  it('should toggle about submenu', () => {
    componentInstance.aboutSubmenuIsShown = false;
    componentInstance.toggleAboutSubmenu();
    expect(componentInstance.aboutSubmenuIsShown).toBeTrue();
    componentInstance.toggleAboutSubmenu();
    expect(componentInstance.aboutSubmenuIsShown).toBeFalse();
  });

  it('should toggle impact-report submenu', () => {
    componentInstance.impactReportSubmenuIsShown = false;
    componentInstance.toggleImpactReportSubmenu();
    expect(componentInstance.impactReportSubmenuIsShown).toBeTrue();
    componentInstance.toggleImpactReportSubmenu();
    expect(componentInstance.impactReportSubmenuIsShown).toBeFalse();
  });

  it('should get static image url', () => {
    expect(componentInstance.getStaticImageUrl('test')).toEqual(imageUrl);
  });

  it('should close sidebar on swipe left', () => {
    spyOn(sidebarStatusService, 'closeSidebar');
    componentInstance.closeSidebarOnSwipeleft();
    expect(sidebarStatusService.closeSidebar).toHaveBeenCalled();
  });

  it(
    'should navigate to default dashboard when user clicks on ' +
      'HOME, when not on the default dashboard',
    fakeAsync(() => {
      expect(mockWindowRef.nativeWindow.location.href).toBe('');

      spyOn(userService, 'getUserPreferredDashboardAsync').and.returnValue(
        Promise.resolve('contributor')
      );
      spyOn(sidebarStatusService, 'closeSidebar');

      componentInstance.currentUrl = '/learner-dashboard';
      componentInstance.navigateToDefaultDashboard();
      tick();

      expect(sidebarStatusService.closeSidebar).not.toHaveBeenCalled();
      expect(mockWindowRef.nativeWindow.location.href).toBe('/');
    })
  );

  it(
    'should not navigate to default dashboard when user clicks on ' +
      'HOME, when on the default dashboard',
    fakeAsync(() => {
      expect(mockWindowRef.nativeWindow.location.href).toBe('');
      spyOn(userService, 'getUserPreferredDashboardAsync').and.returnValue(
        Promise.resolve('creator')
      );
      spyOn(sidebarStatusService, 'closeSidebar');

      componentInstance.currentUrl = '/creator-dashboard';
      componentInstance.navigateToDefaultDashboard();
      tick();

      expect(sidebarStatusService.closeSidebar).toHaveBeenCalled();
      expect(mockWindowRef.nativeWindow.location.href).toBe('');
    })
  );

  it('should populate properties properly on component initialization', fakeAsync(() => {
    let userInfo = new UserInfo(
      ['USER_ROLE'],
      true,
      false,
      false,
      false,
      true,
      'en',
      'username1',
      'tester@example.com',
      true
    );
    spyOn(userService, 'getUserInfoAsync').and.resolveTo(userInfo);
    componentInstance.ngOnInit();
    tick();
    expect(componentInstance.userIsLoggedIn).toBeTrue();
  }));

  it('should check whether hacky translations are displayed or not', () => {
    spyOn(
      i18nLanguageCodeService,
      'isHackyTranslationAvailable'
    ).and.returnValues(false, true);
    spyOn(i18nLanguageCodeService, 'isCurrentLanguageEnglish').and.returnValues(
      false,
      false
    );

    let hackyStoryTitleTranslationIsDisplayed =
      componentInstance.isHackyTopicTitleTranslationDisplayed(0);
    expect(hackyStoryTitleTranslationIsDisplayed).toBe(false);
    hackyStoryTitleTranslationIsDisplayed =
      componentInstance.isHackyTopicTitleTranslationDisplayed(0);
    expect(hackyStoryTitleTranslationIsDisplayed).toBe(true);
  });

  it('should register About header click event', () => {
    spyOn(siteAnalyticsService, 'registerClickNavbarButtonEvent');
    expect(mockWindowRef.nativeWindow.location.href).toBe('');

    componentInstance.navigateToAboutPage();

    expect(
      siteAnalyticsService.registerClickNavbarButtonEvent
    ).toHaveBeenCalledWith(NavbarAndFooterGATrackingPages.ABOUT);

    expect(mockWindowRef.nativeWindow.location.href).toBe('/about');
  });

  it('should register Volunteer header click event', () => {
    spyOn(siteAnalyticsService, 'registerClickNavbarButtonEvent');
    expect(mockWindowRef.nativeWindow.location.href).toBe('');

    componentInstance.navigateToVolunteerPage();

    expect(
      siteAnalyticsService.registerClickNavbarButtonEvent
    ).toHaveBeenCalledWith(NavbarAndFooterGATrackingPages.VOLUNTEER);

    expect(mockWindowRef.nativeWindow.location.href).toBe('/volunteer');
  });

  it('should register Teach header click event', () => {
    spyOn(siteAnalyticsService, 'registerClickNavbarButtonEvent');
    expect(mockWindowRef.nativeWindow.location.href).toBe('');

    componentInstance.navigateToTeachPage();

    expect(
      siteAnalyticsService.registerClickNavbarButtonEvent
    ).toHaveBeenCalledWith(NavbarAndFooterGATrackingPages.TEACH);

    expect(mockWindowRef.nativeWindow.location.href).toBe('/teach');
  });
});
