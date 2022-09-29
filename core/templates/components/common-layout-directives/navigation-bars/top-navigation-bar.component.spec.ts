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
 * @fileoverview Unit tests for TopNavigationBarComponent.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { DeviceInfoService } from 'services/contextual/device-info.service';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { EventToCodes, NavigationService } from 'services/navigation.service';
import { SearchService } from 'services/search.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { UserService } from 'services/user.service';
import { MockI18nService, MockTranslatePipe } from 'tests/unit-test-utils';
import { TopNavigationBarComponent } from './top-navigation-bar.component';
import { DebouncerService } from 'services/debouncer.service';
import { SidebarStatusService } from 'services/sidebar-status.service';
import { UserInfo } from 'domain/user/user-info.model';
import { ClassroomBackendApiService } from 'domain/classroom/classroom-backend-api.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { I18nService } from 'i18n/i18n.service';
import { CookieService } from 'ngx-cookie';
import { CreatorTopicSummary } from 'domain/topic/creator-topic-summary.model';
import { ClassroomData } from 'domain/classroom/classroom-data.model';
import { AccessValidationBackendApiService } from 'pages/oppia-root/routing/access-validation-backend-api.service';
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
      pathname: '/learn/math',
      href: '',
      reload: () => {},
      toString: () => {
        return 'http://localhost:8181/?lang=es';
      }
    },
    localStorage: {
      last_uploaded_audio_lang: 'en',
      removeItem: (name: string) => {}
    },
    sessionStorage: {
      last_uploaded_audio_lang: 'en',
      removeItem: (name: string) => {}
    },
    gtag: () => {},
    history: {
      pushState(data: object, title: string, url?: string | null) {}
    },
    document: {
      body: {
        style: {
          overflowY: 'auto',
        }
      }
    }
  };
}

describe('TopNavigationBarComponent', () => {
  let accessValidationBackendApiService: AccessValidationBackendApiService;
  let fixture: ComponentFixture<TopNavigationBarComponent>;
  let component: TopNavigationBarComponent;
  let mockWindowRef: MockWindowRef;
  let searchService: SearchService;
  let wds: WindowDimensionsService;
  let userService: UserService;
  let siteAnalyticsService: SiteAnalyticsService;
  let navigationService: NavigationService;
  let deviceInfoService: DeviceInfoService;
  let debouncerService: DebouncerService;
  let sidebarStatusService: SidebarStatusService;
  let classroomBackendApiService: ClassroomBackendApiService;
  let i18nLanguageCodeService: I18nLanguageCodeService;
  let i18nService: I18nService;
  let mockPlatformFeatureService = new MockPlatformFeatureService();

  let mockResizeEmitter: EventEmitter<void>;

  beforeEach(waitForAsync(() => {
    mockResizeEmitter = new EventEmitter();
    mockWindowRef = new MockWindowRef();
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      declarations: [
        TopNavigationBarComponent,
        MockTranslatePipe
      ],
      providers: [
        NavigationService,
        CookieService,
        UserService,
        {
          provide: I18nService,
          useClass: MockI18nService
        },
        {
          provide: WindowRef,
          useValue: mockWindowRef
        },
        {
          provide: WindowDimensionsService,
          useValue: {
            getWidth: () => 700,
            getResizeEvent: () => mockResizeEmitter,
            isWindowNarrow: () => false
          }
        },
        {
          provide: PlatformFeatureService,
          useValue: mockPlatformFeatureService
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TopNavigationBarComponent);
    component = fixture.componentInstance;
    searchService = TestBed.inject(SearchService);
    wds = TestBed.inject(WindowDimensionsService);
    userService = TestBed.inject(UserService);
    siteAnalyticsService = TestBed.inject(SiteAnalyticsService);
    navigationService = TestBed.inject(NavigationService);
    deviceInfoService = TestBed.inject(DeviceInfoService);
    debouncerService = TestBed.inject(DebouncerService);
    sidebarStatusService = TestBed.inject(SidebarStatusService);
    i18nService = TestBed.inject(I18nService);
    classroomBackendApiService = TestBed.inject(ClassroomBackendApiService);
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
    accessValidationBackendApiService = TestBed
      .inject(AccessValidationBackendApiService);

    spyOn(searchService, 'onSearchBarLoaded')
      .and.returnValue(new EventEmitter<string>());
  });

  it('should truncate navbar after search bar is loaded', fakeAsync(() => {
    spyOn(component, 'truncateNavbar').and.stub();

    component.ngOnInit();
    tick(10);

    searchService.onSearchBarLoaded.emit();
    tick(101);

    fixture.whenStable().then(() => {
      expect(component.truncateNavbar).toHaveBeenCalled();
    });
  }));

  it('should try displaying the hidden navbar elements if resized' +
    ' window is larger', fakeAsync(() => {
    let donateElement = 'I18N_TOPNAV_DONATE';
    spyOn(component, 'truncateNavbar').and.stub();
    spyOn(debouncerService, 'debounce').and.stub();

    component.ngOnInit();
    tick(10);

    component.currentWindowWidth = 600;
    component.navElementsVisibilityStatus[donateElement] = false;

    mockResizeEmitter.emit();
    tick(501);

    fixture.whenStable().then(() => {
      expect(component.navElementsVisibilityStatus[donateElement]).toBe(true);
    });
  }));

  it('should show Oppia\'s logos', () => {
    expect(component.getStaticImageUrl('/logo/288x128_logo_white.webp'))
      .toBe('/assets/images/logo/288x128_logo_white.webp');

    expect(component.getStaticImageUrl('/logo/288x128_logo_white.png'))
      .toBe('/assets/images/logo/288x128_logo_white.png');
  });

  it('should fetch login URL and redirect user to login page when user' +
    ' clicks on \'Sign In\'', fakeAsync(() => {
    spyOn(userService, 'getLoginUrlAsync').and.resolveTo('/login/url');

    expect(mockWindowRef.nativeWindow.location.href).toBe('');

    component.onLoginButtonClicked();
    tick(151);

    fixture.whenStable().then(() => {
      expect(mockWindowRef.nativeWindow.location.href).toBe('/login/url');
    });
  }));

  it('should reload window if fetched login URL is null', fakeAsync(() => {
    spyOn(userService, 'getLoginUrlAsync').and.resolveTo('');
    spyOn(mockWindowRef.nativeWindow.location, 'reload');

    expect(mockWindowRef.nativeWindow.location.href).toBe('');

    component.onLoginButtonClicked();
    tick(151);

    fixture.whenStable().then(() => {
      expect(mockWindowRef.nativeWindow.location.reload).toHaveBeenCalled();
    });
  }));

  it('should register start login event when user is being redirected to' +
    ' the login page', fakeAsync(() => {
    spyOn(userService, 'getLoginUrlAsync').and.resolveTo('/login/url');
    spyOn(siteAnalyticsService, 'registerStartLoginEvent');

    component.onLoginButtonClicked();
    tick(151);

    fixture.whenStable().then(() => {
      expect(siteAnalyticsService.registerStartLoginEvent)
        .toHaveBeenCalledWith('loginButton');
    });
  }));

  it('should clear last uploaded audio language on logout', () => {
    spyOn(mockWindowRef.nativeWindow.localStorage, 'removeItem');

    expect(mockWindowRef.nativeWindow.localStorage.last_uploaded_audio_lang)
      .toBe('en');

    component.onLogoutButtonClicked();

    expect(mockWindowRef.nativeWindow.localStorage.removeItem)
      .toHaveBeenCalledWith('last_uploaded_audio_lang');
  });

  it('should open submenu when user hovers over the menu button', () => {
    let mouseoverEvent = new KeyboardEvent('mouseover');
    spyOn(navigationService, 'openSubmenu');
    spyOn(deviceInfoService, 'isMobileDevice').and.returnValue(false);

    component.openSubmenu(mouseoverEvent, 'learnMenu');

    expect(navigationService.openSubmenu).toHaveBeenCalledWith(
      mouseoverEvent, 'learnMenu');
  });

  it('should close submenu when user moves the mouse away' +
    ' from the menu button', () => {
    let mouseleaveEvent = new KeyboardEvent('mouseleave');
    spyOn(navigationService, 'closeSubmenu');
    spyOn(deviceInfoService, 'isMobileDevice').and.returnValue(false);

    component.closeSubmenuIfNotMobile(mouseleaveEvent);

    expect(navigationService.closeSubmenu).toHaveBeenCalledWith(
      mouseleaveEvent);
  });

  it('should not close the submenu is the user is on a mobile device', () =>{
    spyOn(deviceInfoService, 'isMobileDevice').and.returnValue(true);
    spyOn(navigationService, 'closeSubmenu');

    component.closeSubmenuIfNotMobile(new KeyboardEvent('mouseleave'));

    expect(navigationService.closeSubmenu).not.toHaveBeenCalled();
  });

  it('should handle keydown events on menus', () => {
    let keydownEvent = new KeyboardEvent('click', {
      shiftKey: true,
      keyCode: 9
    });

    expect(component.activeMenuName).toBe(undefined);

    component.onMenuKeypress(keydownEvent, 'aboutMenu', {
      shiftTab: 'open',
    } as EventToCodes);

    expect(component.activeMenuName).toBe('aboutMenu');
  });

  it('should toggle side bar', () => {
    const clickEvent = new CustomEvent('click');
    spyOn(sidebarStatusService, 'isSidebarShown').and.returnValues(
      false, true, true, false, false);
    spyOn(wds, 'isWindowNarrow').and.returnValue(true);
    spyOn(sidebarStatusService, 'toggleHamburgerIconStatus');
    spyOn(clickEvent, 'stopPropagation');

    expect(component.isSidebarShown()).toBe(false);
    component.toggleSidebar(clickEvent);
    expect(sidebarStatusService.toggleHamburgerIconStatus).toHaveBeenCalled();
    expect(component.isSidebarShown()).toBe(true);
    component.toggleSidebar(clickEvent);
    expect(component.isSidebarShown()).toBe(false);
  });

  it('should navigate to classroom page when user clicks' +
    ' on \'Basic Mathematics\'', fakeAsync(() => {
    expect(mockWindowRef.nativeWindow.location.href).toBe('');

    component.navigateToClassroomPage('/classroom/url');
    tick(151);

    expect(mockWindowRef.nativeWindow.location.href).toBe('/classroom/url');
  }));

  it('should registers classroom header click event when user clicks' +
    ' on \'Basic Mathematics\'', () => {
    spyOn(siteAnalyticsService, 'registerClassroomHeaderClickEvent');

    component.navigateToClassroomPage('/classroom/url');

    expect(siteAnalyticsService.registerClassroomHeaderClickEvent)
      .toHaveBeenCalled();
  });

  it('should check if i18n has been run', () => {
    spyOn(document, 'querySelectorAll')
      .withArgs('.oppia-navbar-tab-content').and.returnValues(
        [
          {
            // This throws "Type '{ innerText: string; }' is not assignable to
            // type 'Element'.". We need to suppress this error because if i18n
            // has not run, then the tabs will not have text content and so
            // their innerText.length value will be 0.
            // @ts-expect-error
            innerText: ''
          }
        ],
        [
          {
            innerText: 'About'
          }
        ]
      );

    expect(component.checkIfI18NCompleted()).toBe(false);
    expect(component.checkIfI18NCompleted()).toBe(true);
  });

  it('should not truncate navbar if the window is narrow', () => {
    // The truncateNavbar() function returns, as soon as the check for
    // narrow window passes.
    spyOn(wds, 'isWindowNarrow').and.returnValue(true);
    spyOn(component, 'checkIfI18NCompleted');
    spyOn(document, 'querySelector');

    // We also, check if the subsequent function calls have been made or not,
    // thus confirming that the returned 'undefined' value is because of
    // narrow window.
    expect(component.truncateNavbar()).toBe(undefined);
    expect(component.checkIfI18NCompleted).not.toHaveBeenCalled();
    expect(document.querySelector).not.toHaveBeenCalled();
  });

  it('should retry calling truncate navbar if i18n is not' +
  ' complete', fakeAsync(() => {
    spyOn(wds, 'isWindowNarrow').and.returnValues(false, true);
    spyOn(document, 'querySelector').and.stub();
    spyOn(component, 'checkIfI18NCompleted').and.returnValue(false);

    component.truncateNavbar();
    tick(101);

    fixture.whenStable().then(() => {
      expect(document.querySelector).not.toHaveBeenCalled();
    });
  }));

  it('should hide navbar if it\'s height more than 60px', fakeAsync(() => {
    spyOn(wds, 'isWindowNarrow').and.returnValues(false, true);
    spyOn(document, 'querySelector')
    // This throws "Type '{ clientWidth: number; }' is missing the following
    // properties from type 'Element': assignedSlot, attributes, classList,
    // className, and 122 more.". We need to suppress this error because
    // typescript expects around 120 more properties than just one
    // (clientWidth). We need only one 'clientWidth' for
    // testing purposes.
    // @ts-expect-error
      .withArgs('div.collapse.navbar-collapse').and.returnValue({
        clientHeight: 61
      });

    component.navElementsVisibilityStatus = {
      I18N_TOPNAV_DONATE: true,
      I18N_TOPNAV_LEARN: true,
      I18N_TOPNAV_ABOUT: true,
      I18N_TOPNAV_LIBRARY: true,
      I18N_TOPNAV_HOME: true
    };

    component.truncateNavbar();
    tick(51);

    fixture.whenStable().then(() => {
      expect(component.navElementsVisibilityStatus).toEqual({
        I18N_TOPNAV_DONATE: false,
        I18N_TOPNAV_LEARN: true,
        I18N_TOPNAV_ABOUT: true,
        I18N_TOPNAV_LIBRARY: true,
        I18N_TOPNAV_HOME: true
      });
    });
  }));

  it('should get profile image data asynchronously', fakeAsync(() => {
    spyOn(userService, 'getProfileImageDataUrlAsync')
      .and.resolveTo('%2Fimages%2Furl%2F1');
    expect(component.profilePictureDataUrl).toBe(undefined);

    component.getProfileImageDataAsync();
    tick();

    expect(component.profilePictureDataUrl).toBe('/images/url/1');
  }));

  it('should change the language when user clicks on new language' +
    ' from dropdown', () => {
    let langCode = 'hi';
    spyOn(i18nService, 'updateUserPreferredLanguage');
    component.changeLanguage(langCode);
    expect(i18nService.updateUserPreferredLanguage).toHaveBeenCalledWith(
      langCode);
  });

  it('should check if classroom promos are enabled', fakeAsync(() => {
    spyOn(component, 'truncateNavbar').and.stub();
    spyOn(
      classroomBackendApiService, 'fetchClassroomPromosAreEnabledStatusAsync')
      .and.resolveTo(true);

    component.ngOnInit();
    tick();

    expect(component.CLASSROOM_PROMOS_ARE_ENABLED).toBe(true);
  }));

  it('should change current language code on' +
    ' I18nLanguageCode change', fakeAsync(() => {
    let onI18nLanguageCodeChangeEmitter = new EventEmitter();
    spyOnProperty(i18nLanguageCodeService, 'onI18nLanguageCodeChange')
      .and.returnValue(onI18nLanguageCodeChangeEmitter);
    spyOn(component, 'truncateNavbar').and.stub();

    component.ngOnInit();

    component.currentLanguageCode = 'hi';

    onI18nLanguageCodeChangeEmitter.emit('en');
    tick();

    expect(component.currentLanguageCode).toBe('en');
  }));

  it('should get user information on initialization', fakeAsync(() => {
    let userInfo = new UserInfo(
      ['USER_ROLE'], true, false, false, false, true,
      'en', 'username1', 'tester@example.com', true
    );
    spyOn(component, 'truncateNavbar').and.stub();
    spyOn(userService, 'getUserInfoAsync').and.resolveTo(userInfo);
    spyOn(i18nLanguageCodeService, 'getCurrentI18nLanguageCode')
      .and.returnValue('en');

    expect(component.isModerator).toBe(false);
    expect(component.isCurriculumAdmin).toBe(false);
    expect(component.isTopicManager).toBe(false);
    expect(component.isSuperAdmin).toBe(false);
    expect(component.userIsLoggedIn).toBe(false);
    expect(component.username).toBe(undefined);
    expect(component.profilePageUrl).toBe(undefined);

    component.ngOnInit();
    tick();

    expect(component.isModerator).toBe(true);
    expect(component.isCurriculumAdmin).toBe(false);
    expect(component.isTopicManager).toBe(false);
    expect(component.isSuperAdmin).toBe(false);
    expect(component.userIsLoggedIn).toBe(true);
    expect(component.username).toBe('username1');
    expect(component.profilePageUrl).toBe('/profile/username1');
  }));

  it('should return proper offset for dropdown', ()=>{
    var dummyElement = document.createElement('div');
    spyOn(document, 'querySelector').and.returnValue(dummyElement);

    spyOn(Element.prototype, 'getBoundingClientRect').and.callFake(
      jasmine.createSpy('getBoundingClientRect').and
        .returnValue({ top: 1, height: 100, left: 0, width: 200, right: 202 })
    );

    expect(component.getDropdownOffset('.dummy', 0)).toBe(0);
  });

  it('should return proper offset for learn dropdown when element is undefined',
    ()=>{
      spyOn(document, 'querySelector').and.returnValue(null);

      expect(component.getDropdownOffset('.dummy', 0)).toBe(0);
    });

  it('should check if dropdown offsets are updated', fakeAsync (()=>{
    spyOn(component, 'truncateNavbar').and.stub();
    spyOn(component, 'getDropdownOffset')
      .withArgs('.learn-tab', 688).and.returnValue(-10)
      .withArgs('.learn-tab', 300).and.returnValue(-10)
      .withArgs('.donate-tab', 286).and.returnValue(-10)
      .withArgs('.get-involved', 574).and.returnValue(-10);

    expect(component.learnDropdownOffset).toBe(0);
    expect(component.getInvolvedMenuOffset).toBe(0);
    expect(component.donateMenuOffset).toBe(0);

    component.ngAfterViewChecked();
    tick();

    expect(component.learnDropdownOffset).toBe(-10);
    expect(component.getInvolvedMenuOffset).toBe(-10);
    expect(component.donateMenuOffset).toBe(-10);
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

      component.ngOnInit();

      tick();

      expect(component.classroomData).toEqual(array);
      expect(component.topicTitlesTranslationKeys).toEqual(
        topicTitlesTranslationKeys);
    }));

  it('should check whether hacky translations are displayed or not', () => {
    spyOn(i18nLanguageCodeService, 'isHackyTranslationAvailable')
      .and.returnValues(false, true);
    spyOn(i18nLanguageCodeService, 'isCurrentLanguageEnglish')
      .and.returnValues(false, false);

    let hackyStoryTitleTranslationIsDisplayed =
      component.isHackyTopicTitleTranslationDisplayed(0);
    expect(hackyStoryTitleTranslationIsDisplayed).toBe(false);
    hackyStoryTitleTranslationIsDisplayed =
      component.isHackyTopicTitleTranslationDisplayed(0);
    expect(hackyStoryTitleTranslationIsDisplayed).toBe(true);
  });

  it('should show android button if the feature is enabled', () => {
    // The androidPageIsEnabled property is set when the component is
    // constructed and the value is not modified after that so there is no
    // pre-check for this test.
    mockPlatformFeatureService.status.AndroidBetaLandingPage.isEnabled = true;

    const component = TestBed.createComponent(TopNavigationBarComponent);

    expect(component.componentInstance.androidPageIsEnabled).toBeTrue();
  });
});
