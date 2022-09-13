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

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed, fakeAsync, tick, waitForAsync } from '@angular/core/testing';
import { APP_BASE_HREF } from '@angular/common';
import { RouterModule } from '@angular/router';

import { SmartRouterModule } from 'hybrid-router-module-provider';
import { ClassroomData } from 'domain/classroom/classroom-data.model';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { SideNavigationBarComponent } from './side-navigation-bar.component';
import { ClassroomBackendApiService } from 'domain/classroom/classroom-backend-api.service';
import { UserService } from 'services/user.service';
import { UserInfo } from 'domain/user/user-info.model';
import { SidebarStatusService } from 'services/sidebar-status.service';
import { CreatorTopicSummary } from 'domain/topic/creator-topic-summary.model';
import { AccessValidationBackendApiService } from 'pages/oppia-root/routing/access-validation-backend-api.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';

class MockWindowRef {
  nativeWindow = {
    location: {
      pathname: '/test',
      href: ''
    },
    gtag: () => {}
  };
}


describe('Side Navigation Bar Component', () => {
  let accessValidationBackendApiService: AccessValidationBackendApiService;
  let fixture: ComponentFixture<SideNavigationBarComponent>;
  let componentInstance: SideNavigationBarComponent;
  let currentUrl: string = '/test';
  let imageUrl: string = 'image_url';
  let mockWindowRef: MockWindowRef;
  let siteAnalyticsService: SiteAnalyticsService;
  let sidebarStatusService: SidebarStatusService;
  let classroomBackendApiService: ClassroomBackendApiService;
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
      imports: [
        HttpClientModule,
        HttpClientTestingModule,
        // TODO(#13443): Remove hybrid router module provider once all pages are
        // migrated to angular router.
        SmartRouterModule,
        RouterModule.forRoot([])
      ],
      declarations: [
        SideNavigationBarComponent,
        MockTranslatePipe
      ],
      providers: [
        {
          provide: WindowRef,
          useValue: mockWindowRef
        },
        {
          provide: UrlInterpolationService,
          useClass: MockUrlInterpolationService
        },
        {
          provide: APP_BASE_HREF,
          useValue: '/'
        }
      ]
    });
  }));

  beforeEach(() => {
    accessValidationBackendApiService = TestBed
      .inject(AccessValidationBackendApiService);
    fixture = TestBed.createComponent(SideNavigationBarComponent);
    sidebarStatusService = TestBed.inject(SidebarStatusService);
    siteAnalyticsService = TestBed.inject(SiteAnalyticsService);
    componentInstance = fixture.componentInstance;
    classroomBackendApiService = TestBed.inject(ClassroomBackendApiService);
    userService = TestBed.inject(UserService);
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);

    spyOn(i18nLanguageCodeService, 'isCurrentLanguageRTL').and.returnValue(
      true);
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

  it('should get static image url', () => {
    expect(componentInstance.getStaticImageUrl('test')).toEqual(imageUrl);
  });

  it('should close sidebar on swipe left', () => {
    spyOn(sidebarStatusService, 'closeSidebar');
    componentInstance.closeSidebarOnSwipeleft();
    expect(sidebarStatusService.closeSidebar).toHaveBeenCalled();
  });

  it('should navigate to learner dashboard when learner clicks on ' +
  'HOME, when not on the learner dashboard', () => {
    expect(mockWindowRef.nativeWindow.location.href).toBe('');

    spyOn(sidebarStatusService, 'closeSidebar');
    componentInstance.navigateToLearnerDashboard();

    expect(sidebarStatusService.closeSidebar).not.toHaveBeenCalled();
    expect(mockWindowRef.nativeWindow.location.href).toBe('/learner-dashboard');
  });

  it('should not navigate to learner dashboard when learner clicks on ' +
  'HOME, when on the learner dashboard', () => {
    componentInstance.currentUrl = '/learner-dashboard';

    spyOn(sidebarStatusService, 'closeSidebar');
    componentInstance.navigateToLearnerDashboard();

    expect(sidebarStatusService.closeSidebar).toHaveBeenCalled();
  });

  it('should navigate to classroom page when user clicks on' +
  '\'Basic Mathematics\'', fakeAsync(() => {
    expect(mockWindowRef.nativeWindow.location.href).toBe('');

    componentInstance.navigateToClassroomPage('/classroom/url');
    tick(151);

    expect(mockWindowRef.nativeWindow.location.href).toBe('/classroom/url');
  }));

  it('should registers classroom header click event when user clicks' +
  ' on \'Basic Mathematics\'', () => {
    spyOn(siteAnalyticsService, 'registerClassroomHeaderClickEvent');

    componentInstance.navigateToClassroomPage('/classroom/url');

    expect(siteAnalyticsService.registerClassroomHeaderClickEvent)
      .toHaveBeenCalled();
  });

  it('should populate properties properly on component initialization',
    fakeAsync(() => {
      let userInfo = new UserInfo(
        ['USER_ROLE'], true, false, false, false, true,
        'en', 'username1', 'tester@example.com', true
      );
      spyOn(
        classroomBackendApiService, 'fetchClassroomPromosAreEnabledStatusAsync')
        .and.resolveTo(true);
      spyOn(userService, 'getUserInfoAsync').and.resolveTo(userInfo);
      componentInstance.ngOnInit();
      tick();
      expect(componentInstance.userIsLoggedIn).toBeTrue();
      expect(componentInstance.CLASSROOM_PROMOS_ARE_ENABLED).toBe(true);
    }));

  it('should fetch classroom data when classroomPromos are enabled',
    fakeAsync(() => {
      spyOn(
        classroomBackendApiService,
        'fetchClassroomPromosAreEnabledStatusAsync').
        and.resolveTo(true);
      spyOn(accessValidationBackendApiService, 'validateAccessToClassroomPage')
        .and.returnValue(Promise.resolve());

      let cData1: CreatorTopicSummary = new CreatorTopicSummary(
        'dummy', 'addition', 3, 3, 3, 3, 1,
        'en', 'dummy', 1, 1, 1, 1, true,
        true, 'math', 'public/img.webp', 'red', 'add');
      let cData2: CreatorTopicSummary = new CreatorTopicSummary(
        'dummy2', 'division', 2, 2, 3, 3, 0,
        'es', 'dummy2', 1, 1, 1, 1, true,
        true, 'math', 'public/img1.png', 'green', 'div');

      let array: CreatorTopicSummary[] = [cData1, cData2];
      let classroomData = new ClassroomData('test', array, 'dummy', 'dummy');
      let topicTitlesTranslationKeys: string[] =
        ['I18N_TOPIC_dummy_TITLE', 'I18N_TOPIC_dummy2_TITLE'];
      spyOn(
        classroomBackendApiService, 'fetchClassroomDataAsync')
        .and.resolveTo(classroomData);

      componentInstance.ngOnInit();

      tick();

      expect(componentInstance.classroomData).toEqual(array);
      expect(componentInstance.topicTitlesTranslationKeys).toEqual(
        topicTitlesTranslationKeys);
    }));

  it('should check whether hacky translations are displayed or not', () => {
    spyOn(i18nLanguageCodeService, 'isHackyTranslationAvailable')
      .and.returnValues(false, true);
    spyOn(i18nLanguageCodeService, 'isCurrentLanguageEnglish')
      .and.returnValues(false, false);

    let hackyStoryTitleTranslationIsDisplayed =
      componentInstance.isHackyTopicTitleTranslationDisplayed(0);
    expect(hackyStoryTitleTranslationIsDisplayed).toBe(false);
    hackyStoryTitleTranslationIsDisplayed =
      componentInstance.isHackyTopicTitleTranslationDisplayed(0);
    expect(hackyStoryTitleTranslationIsDisplayed).toBe(true);
  });
});
