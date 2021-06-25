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

import { fromEvent } from 'rxjs';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, flushMicrotasks, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { AppConstants } from 'app.constants';
import { ClassroomBackendApiService } from 'domain/classroom/classroom-backend-api.service';
import { DeviceInfoService } from 'services/contextual/device-info.service';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { NavigationService } from 'services/navigation.service';
import { SearchService } from 'services/search.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { UserService } from 'services/user.service';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { TopNavigationBarComponent } from './top-navigation-bar.component';

class MockWindowRef {
  _window = {
    location: {
      _pathname: '/learn/math',
      _href: '',
      get href() {
        return this._href;
      },
      set href(val) {
        this._href = val;
      },
      get pathname() {
        return this._pathname;
      },
      set pathname(val) {
        this._pathname = val;
      },
      reload: () => {}
    },
    localStorage: {
      last_uploaded_audio_lang: 'en',
      removeItem: (name: string) => {}
    }
  };
  get nativeWindow() {
    return this._window;
  }
}

describe('TopNavigationBarComponent', () => {
  let fixture: ComponentFixture<TopNavigationBarComponent>;
  let component: TopNavigationBarComponent;
  let mockWindowRef: MockWindowRef;
  let windowRef: WindowRef;
  let cbas: ClassroomBackendApiService;
  let searchService: SearchService;
  let wds: WindowDimensionsService;
  let userService: UserService;
  let siteAnalyticsService: SiteAnalyticsService;
  let navigationService: NavigationService;
  let deviceInfoService: DeviceInfoService;

  let mockOnSearchBarLoadedEventEmitter = new EventEmitter();
  let userInfo = {
    _isModerator: true,
    _isAdmin: true,
    _isTopicManager: false,
    _isSuperAdmin: false,
    _canCreateCollections: true,
    _preferredSiteLanguageCode: 'en',
    _username: 'username1',
    _email: 'tester@example.org',
    _isLoggedIn: true,
    isModerator: () => true,
    isAdmin: () => false,
    isSuperAdmin: () => false,
    isTopicManager: () => false,
    canCreateCollections: () => true,
    getPreferredSiteLanguageCode: () =>'en',
    getUsername: () => 'username1',
    getEmail: () => 'tester@example.org',
    isLoggedIn: () => true
  };

  beforeEach(waitForAsync(() => {
    mockWindowRef = new MockWindowRef();
    windowRef = new WindowRef();
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
        UserService,
        {
          provide: WindowRef,
          useValue: mockWindowRef
        },
        {
          provide: WindowDimensionsService,
          useValue: {
            getWidth: () => 700,
            getResizeEvent: () => fromEvent(windowRef.nativeWindow, 'resize'),
            isWindowNarrow: () => true
          }
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TopNavigationBarComponent);
    component = fixture.componentInstance;
    cbas = TestBed.inject(ClassroomBackendApiService);
    searchService = TestBed.inject(SearchService);
    wds = TestBed.inject(WindowDimensionsService);
    userService = TestBed.inject(UserService);
    siteAnalyticsService = TestBed.inject(SiteAnalyticsService);
    navigationService = TestBed.inject(NavigationService);
    deviceInfoService = TestBed.inject(DeviceInfoService);

    spyOn(userService, 'getUserInfoAsync').and.resolveTo(userInfo);
    spyOnProperty(searchService, 'onSearchBarLoaded').and.returnValue(
      mockOnSearchBarLoadedEventEmitter);
  });

  it('should set component properties on initialization', fakeAsync(() => {
    spyOn(cbas, 'fetchClassroomPromosAreEnabledStatusAsync')
      .and.resolveTo(true);
    spyOn(wds, 'isWindowNarrow').and.returnValue(true);
    spyOn(wds, 'getWidth').and.returnValue(700);

    expect(component.currentUrl).toBe(undefined);
    expect(component.labelForClearingFocus).toBe(undefined);
    expect(component.logoutUrl).toBe(undefined);
    expect(component.userMenuIsShown).toBe(undefined);
    expect(component.inClassroomPage).toBe(undefined);
    expect(component.windowIsNarrow).toBe(false);
    expect(component.navElementsVisibilityStatus).toEqual({});

    component.ngOnInit();
    tick();

    expect(component.currentUrl).toBe('learn');
    expect(component.labelForClearingFocus)
      .toBe(AppConstants.LABEL_FOR_CLEARING_FOCUS);
    expect(component.logoutUrl).toBe(AppConstants.LOGOUT_URL);
    expect(component.userMenuIsShown).toBe(true);
    expect(component.inClassroomPage).toBe(true);
    expect(component.windowIsNarrow).toBe(true);
    expect(component.navElementsVisibilityStatus).toEqual({
      I18N_TOPNAV_DONATE: true,
      I18N_TOPNAV_CLASSROOM: true,
      I18N_TOPNAV_ABOUT: true,
      I18N_CREATE_EXPLORATION_CREATE: true,
      I18N_TOPNAV_LIBRARY: true
    });

    component.ngOnDestroy();
  }));

  it('should get user info on initialization', fakeAsync(() => {
    spyOn(cbas, 'fetchClassroomPromosAreEnabledStatusAsync')
      .and.resolveTo(true);
    spyOn(wds, 'isWindowNarrow').and.returnValue(true);
    spyOn(wds, 'getWidth').and.returnValue(700);

    expect(component.isModerator).toBe(undefined);
    expect(component.isAdmin).toBe(undefined);
    expect(component.isTopicManager).toBe(undefined);
    expect(component.isSuperAdmin).toBe(undefined);
    expect(component.userIsLoggedIn).toBe(undefined);
    expect(component.username).toBe(undefined);
    expect(component.profilePageUrl).toBe(undefined);

    component.ngOnInit();
    tick();

    expect(component.isModerator).toBe(true);
    expect(component.isAdmin).toBe(false);
    expect(component.isTopicManager).toBe(false);
    expect(component.isSuperAdmin).toBe(false);
    expect(component.userIsLoggedIn).toBe(true);
    expect(component.username).toBe('username1');
    expect(component.profilePageUrl).toBe('/profile/username1');

    component.ngOnDestroy();
  }));

  it('should truncate navbar after search bar is loaded', (done) => {
    spyOn(component, 'truncateNavbar');

    component.ngOnInit();
    mockOnSearchBarLoadedEventEmitter.emit();

    setTimeout(() => {
      expect(component.truncateNavbar).toHaveBeenCalled();
      done();
    }, 100);

    component.ngOnDestroy();
  });

  it('should try displaying the hidden navbar elements if resized' +
    ' window is larger', waitForAsync(() => {
    let donateElement = 'I18N_TOPNAV_DONATE';
    spyOn(wds, 'getWidth').and.returnValue(700);
    component.ngOnInit();

    component.currentWindowWidth = 600;
    component.navElementsVisibilityStatus[donateElement] = false;

    windowRef.nativeWindow.dispatchEvent(new Event('resize'));

    fixture.whenStable().then(() => {
      fixture.detectChanges();
      expect(component.navElementsVisibilityStatus[donateElement]).toBe(true);
    });
    component.ngOnDestroy();
  }));

  it('should show user\'s profile picture on initialization', fakeAsync(() => {
    expect(component.profilePictureDataUrl).toBe(undefined);
    spyOn(userService, 'getProfileImageDataUrlAsync').and.resolveTo(
      '/profile-picture/user1.jpg');

    component.ngOnInit();
    tick();

    expect(component.profilePictureDataUrl).toBe('/profile-picture/user1.jpg');
  }));

  it('should show Oppia\'s logos', () => {
    expect(component.getStaticImageUrl('/logo/288x128_logo_white.webp'))
      .toBe('/assets/images/logo/288x128_logo_white.webp');

    expect(component.getStaticImageUrl('/logo/288x128_logo_white.png'))
      .toBe('/assets/images/logo/288x128_logo_white.png');
  });

  it('should fetch login URL and redirect user to login page when user' +
    ' clicks on \'Sign In\'', fakeAsync((done) => {
    spyOn(userService, 'getLoginUrlAsync').and.resolveTo('/login/url');

    expect(mockWindowRef.nativeWindow.location.href).toBe('');

    component.onLoginButtonClicked();
    flushMicrotasks();
    tick(151);

    expect(mockWindowRef.nativeWindow.location.href).toBe('/login/url');
  }));

  it('should reload window if fetched login URL is null', fakeAsync(() => {
    spyOn(userService, 'getLoginUrlAsync').and.resolveTo('');
    spyOn(mockWindowRef.nativeWindow.location, 'reload');

    expect(mockWindowRef.nativeWindow.location.href).toBe('');

    component.onLoginButtonClicked();
    flushMicrotasks();
    tick(151);

    expect(mockWindowRef.nativeWindow.location.reload).toHaveBeenCalled();
  }));

  it('should register start login event when user is being redirected to' +
    ' the login page', fakeAsync(() => {
    spyOn(userService, 'getLoginUrlAsync').and.resolveTo('/login/url');
    spyOn(siteAnalyticsService, 'registerStartLoginEvent');

    component.onLoginButtonClicked();
    flushMicrotasks();
    tick(151);

    expect(siteAnalyticsService.registerStartLoginEvent).toHaveBeenCalledWith(
      'loginButton');
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

    component.openSubmenu(mouseoverEvent, 'classroomMenu');

    expect(navigationService.openSubmenu).toHaveBeenCalledWith(
      mouseoverEvent, 'classroomMenu');
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
    });

    expect(component.activeMenuName).toBe('aboutMenu');
  });

  it('should toggle side bar', () => {
    expect(component.isSidebarShown()).toBe(false);

    component.toggleSidebar();

    expect(component.isSidebarShown()).toBe(true);
  });

  it('should navigate to classroom page when user clicks' +
    ' on \'Basic Mathematics\'', fakeAsync(() => {
    expect(mockWindowRef.nativeWindow.location.href).toBe('');

    component.navigateToClassroomPage('/classroom/url');
    tick(151);
    flushMicrotasks();

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
    // The function isWindowNarrow() returns true as defined in the mock. So,
    // the truncateNavbar() function return, as soon as the check for
    // narrow window passes.

    spyOn(component, 'checkIfI18NCompleted');
    spyOn(document, 'querySelector');

    // We also, check if the subsequent function calls have been made or not,
    // thus confirming that the returned 'undefined' value is because of
    // narrow window.
    expect(component.truncateNavbar()).toBe(undefined);
    expect(component.checkIfI18NCompleted).not.toHaveBeenCalled();
    expect(document.querySelector).not.toHaveBeenCalled();
  });

  it('should hide navbar if it\'s height more than 60px', () => {
    let donateElement = 'I18N_TOPNAV_DONATE';
    spyOn(wds, 'isWindowNarrow').and.returnValue(false);
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

    component.ngOnInit();

    // The first element is hidden and then truncate navbar is called again, to
    // hide the next element if necessary.
    expect(component.navElementsVisibilityStatus[donateElement])
      .toBe(true);

    component.truncateNavbar();

    expect(component.navElementsVisibilityStatus[donateElement])
      .toBe(false);
  });
});
