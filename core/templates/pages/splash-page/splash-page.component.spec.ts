// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the splash page.
 */

import {EventEmitter} from '@angular/core';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {TestBed, fakeAsync, flushMicrotasks, tick} from '@angular/core/testing';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {LoaderService} from 'services/loader.service';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {SiteAnalyticsService} from 'services/site-analytics.service';
import {UserInfo} from 'domain/user/user-info.model';
import {UserService} from 'services/user.service';
import {SplashPageComponent} from './splash-page.component';
import {of} from 'rxjs';
import {MockTranslatePipe} from 'tests/unit-test-utils';

class MockWindowRef {
  _window = {
    location: {
      _href: '',
      get href() {
        return this._href;
      },
      set href(val) {
        this._href = val;
      },
      replace: (val: string) => {},
      reload: () => {},
    },
    sessionStorage: {
      last_uploaded_audio_lang: 'en',
      removeItem: (name: string) => {},
    },
    gtag: () => {},
  };

  get nativeWindow() {
    return this._window;
  }
}

class MockI18nLanguageCodeService {
  codeChangeEventEmitter = new EventEmitter<string>();
  getCurrentI18nLanguageCode() {
    return 'en';
  }

  isCurrentLanguageRTL() {
    return true;
  }

  get onI18nLanguageCodeChange() {
    return this.codeChangeEventEmitter;
  }
}

describe('Splash Page', () => {
  let siteAnalyticsService: SiteAnalyticsService;
  let loaderService: LoaderService;
  let userService: UserService;
  let windowDimensionsService: WindowDimensionsService;
  let resizeEvent = new Event('resize');
  let mockWindowRef = new MockWindowRef();

  beforeEach(async () => {
    TestBed.configureTestingModule({
      declarations: [SplashPageComponent, MockTranslatePipe],
      providers: [
        {
          provide: I18nLanguageCodeService,
          useClass: MockI18nLanguageCodeService,
        },
        {
          provide: WindowDimensionsService,
          useValue: {
            isWindowNarrow: () => true,
            getResizeEvent: () => of(resizeEvent),
          },
        },
        SiteAnalyticsService,
        UrlInterpolationService,
        {
          provide: WindowRef,
          useValue: mockWindowRef,
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    loaderService = TestBed.get(LoaderService);
    userService = TestBed.get(UserService);
    windowDimensionsService = TestBed.get(WindowDimensionsService);
    siteAnalyticsService = TestBed.inject(SiteAnalyticsService);
  });

  let component: SplashPageComponent;
  beforeEach(() => {
    const splashPageComponent = TestBed.createComponent(SplashPageComponent);
    component = splashPageComponent.componentInstance;
  });

  it('should get static image url', function () {
    expect(component.getStaticImageUrl('/path/to/image')).toBe(
      '/assets/images/path/to/image'
    );
  });

  it('should correctly construct image set string', function() {
    spyOn(component, 'getStaticImageUrl').and.callFake((path: string) => {
      return '/assets/images' + path;
    });

    const imageName = '/path/to/image';
    const imageExt = 'png';

    const result = component.getImageSet(imageName, imageExt);

    const expected = (
      '/assets/images/path/to/image1x.png 1x, ' +
      '/assets/images/path/to/image15x.png 1.5x, ' +
      '/assets/images/path/to/image2x.png 2x'
    );

    expect(result).toEqual(expected);
  });

  it('should record analytics when start learning is clicked', function () {
    spyOn(
      siteAnalyticsService,
      'registerClickHomePageStartLearningButtonEvent'
    ).and.callThrough();

    component.onClickStartLearningButton();

    expect(
      siteAnalyticsService.registerClickHomePageStartLearningButtonEvent
    ).toHaveBeenCalled();
  });

  it('should record analytics and direct to login page when Create account button is clicked', fakeAsync(async function () {
    spyOn(
      siteAnalyticsService,
      'registerClickCreateAccountButtonEvent'
    ).and.callThrough();
    spyOn(userService, 'getLoginUrlAsync').and.resolveTo('/login/url');

    component.onClickCreateAccountButton();
    tick(151);

    expect(
      siteAnalyticsService.registerClickCreateAccountButtonEvent
    ).toHaveBeenCalled();
    expect(mockWindowRef.nativeWindow.location.href).toBe('/login/url');
  }));

  it('should reload window if fetched login URL is null when Create account button is clicked', fakeAsync(async function () {
    spyOn(userService, 'getLoginUrlAsync').and.resolveTo('');
    spyOn(mockWindowRef.nativeWindow.location, 'reload');
    spyOn(
      siteAnalyticsService,
      'registerClickCreateAccountButtonEvent'
    ).and.callThrough();

    component.onClickCreateAccountButton();
    tick(151);

    expect(
      siteAnalyticsService.registerClickCreateAccountButtonEvent
    ).toHaveBeenCalled();
    expect(mockWindowRef.nativeWindow.location.reload).toHaveBeenCalled();
  }));

  it('should record analytics when Explore Classroom button is clicked', function () {
    spyOn(
      siteAnalyticsService,
      'registerClickExploreClassroomButtonEvent'
    ).and.callThrough();

    component.onClickExploreClassroomButton();

    expect(
      siteAnalyticsService.registerClickExploreClassroomButtonEvent
    ).toHaveBeenCalled();
  });

  it('should record analytics and direct to community library page when Explore Lessons button is clicked', function () {
    spyOn(
      siteAnalyticsService,
      'registerClickExploreLessonsButtonEvent'
    ).and.callThrough();
    expect(mockWindowRef.nativeWindow.location.href).not.toEqual(
      '/community-library'
    );

    component.onClickExploreLessonsButton();

    expect(
      siteAnalyticsService.registerClickExploreLessonsButtonEvent
    ).toHaveBeenCalled();
    expect(mockWindowRef.nativeWindow.location.href).toEqual(
      '/community-library'
    );
  });

  it('should record analytics when Start Contributing is clicked', function () {
    spyOn(
      siteAnalyticsService,
      'registerClickStartContributingButtonEvent'
    ).and.callThrough();
    component.onClickStartContributingButton();
    expect(
      siteAnalyticsService.registerClickStartContributingButtonEvent
    ).toHaveBeenCalled();
  });

  it('should record analytics when Start Teaching is clicked', function () {
    spyOn(
      siteAnalyticsService,
      'registerClickStartTeachingButtonEvent'
    ).and.callThrough();
    component.onClickStartTeachingButton();
    expect(
      siteAnalyticsService.registerClickStartTeachingButtonEvent
    ).toHaveBeenCalled();
  });

  it('should record analytics when Start exploring button is clicked', function () {
    spyOn(
      siteAnalyticsService,
      'registerClickStartExploringButtonEvent'
    ).and.callThrough();

    component.onClickStartExploringButton();

    expect(
      siteAnalyticsService.registerClickStartExploringButtonEvent
    ).toHaveBeenCalled();
  });

  it('should evaluate if user is logged in', fakeAsync(() => {
    const UserInfoObject = {
      roles: ['USER_ROLE'],
      is_moderator: false,
      is_curriculum_admin: false,
      is_super_admin: false,
      is_topic_manager: false,
      can_create_collections: true,
      preferred_site_language_code: null,
      username: 'tester',
      email: 'test@test.com',
      user_is_logged_in: true,
    };
    spyOn(userService, 'getUserInfoAsync').and.returnValue(
      Promise.resolve(UserInfo.createFromBackendDict(UserInfoObject))
    );
    component.ngOnInit();
    flushMicrotasks();
    expect(component.userIsLoggedIn).toBe(true);
  }));

  it('should evaluate if user is not logged in', fakeAsync(() => {
    const UserInfoObject = {
      roles: ['USER_ROLE'],
      is_moderator: false,
      is_curriculum_admin: false,
      is_super_admin: false,
      is_topic_manager: false,
      can_create_collections: true,
      preferred_site_language_code: null,
      username: 'tester',
      email: 'test@test.com',
      user_is_logged_in: false,
    };
    spyOn(userService, 'getUserInfoAsync').and.returnValue(
      Promise.resolve(UserInfo.createFromBackendDict(UserInfoObject))
    );
    component.ngOnInit();
    flushMicrotasks();
    expect(component.userIsLoggedIn).toBe(false);
  }));

  it('should check if loader screen is working', fakeAsync(() => {
    spyOn(loaderService, 'showLoadingScreen').and.callThrough();
    component.ngOnInit();
    expect(loaderService.showLoadingScreen).toHaveBeenCalledWith('Loading');
  }));

  it('should set component properties when ngOnInit() is called', () => {
    component.ngOnInit();
    expect(component.displayedTestimonialId).toBe(0);
    expect(component.testimonialCount).toBe(4);
    expect(component.classroomUrl).toBe('/learn/math');
    spyOn(windowDimensionsService, 'isWindowNarrow').and.callThrough;
    expect(windowDimensionsService.isWindowNarrow()).toHaveBeenCalled;
    expect(component.isWindowNarrow).toBe(true);
  });
});
