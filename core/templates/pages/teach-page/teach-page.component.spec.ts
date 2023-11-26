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
 * @fileoverview Unit tests for the teach page.
 */
import { EventEmitter } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { TeachPageComponent } from './teach-page.component';
import { LoaderService } from 'services/loader.service';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { WindowDimensionsService } from
  'services/contextual/window-dimensions.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { UserInfo } from 'domain/user/user-info.model';
import { UserService } from 'services/user.service';
import { of } from 'rxjs';
import { MockTranslatePipe } from 'tests/unit-test-utils';
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
      replace: (val: string) => {}
    },
    sessionStorage: {
      last_uploaded_audio_lang: 'en',
      removeItem: (name: string) => {}
    },
    gtag: () => {}
  };

  get nativeWindow() {
    return this._window;
  }
}

class MockI18nLanguageCodeService {
  codeChangeEventEmiiter = new EventEmitter<string>();
  getCurrentI18nLanguageCode() {
    return 'en';
  }

  get onI18nLanguageCodeChange() {
    return this.codeChangeEventEmiiter;
  }
}

describe('Teach Page', () => {
  let siteAnalyticsService: SiteAnalyticsService;
  let loaderService: LoaderService;
  let userService: UserService;
  let windowDimensionsService: WindowDimensionsService;
  let windowRef: MockWindowRef;
  let resizeEvent = new Event('resize');
  beforeEach(async() => {
    windowRef = new MockWindowRef();
    TestBed.configureTestingModule({
      declarations: [TeachPageComponent, MockTranslatePipe],
      providers: [
        {
          provide: I18nLanguageCodeService,
          useClass: MockI18nLanguageCodeService
        },
        {
          provide: WindowRef,
          useValue: windowRef
        },
        {
          provide: WindowDimensionsService,
          useValue: {
            isWindowNarrow: () => true,
            getResizeEvent: () => of(resizeEvent)
          }
        },
        SiteAnalyticsService,
        UrlInterpolationService,
      ]
    }).compileComponents();
  });
  beforeEach(angular.mock.module('oppia'));

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    loaderService = TestBed.get(LoaderService);
    userService = TestBed.get(UserService);
    windowDimensionsService = TestBed.get(WindowDimensionsService);
    siteAnalyticsService = TestBed.inject(SiteAnalyticsService);
  });

  let component: TeachPageComponent;
  beforeEach(() => {
    let teachPageComponent = TestBed.createComponent(TeachPageComponent);
    component = teachPageComponent.componentInstance;
  });

  it('should successfully instantiate the component from beforeEach block',
    () => {
      expect(component).toBeDefined();
    });
  it('should get static image url', () => {
    expect(component.getStaticImageUrl('/path/to/image')).toBe(
      '/assets/images/path/to/image');
  });

  it('should set component properties when ngOnInit() is called', () => {
    component.ngOnInit();
    expect(component.displayedTestimonialId).toBe(0);
    expect(component.testimonialCount).toBe(3);
    expect(component.classroomUrl).toBe('/learn/math');
    spyOn(windowDimensionsService, 'isWindowNarrow').and.callThrough;
    expect(windowDimensionsService.isWindowNarrow()).toHaveBeenCalled;
    expect(component.isWindowNarrow).toBe(true);
  });

  it('should check if loader screen is working', () =>
    fakeAsync(() => {
      component.ngOnInit();
      spyOn(loaderService, 'showLoadingScreen').and.callThrough();
      expect(loaderService.showLoadingScreen)
        .toHaveBeenCalledWith('Loading');
    }));

  it('should check if user is logged in or not', fakeAsync(() => {
    const UserInfoObject = {
      roles: ['EXPLORATION_EDITOR'],
      is_moderator: false,
      is_curriculum_admin: false,
      is_super_admin: false,
      is_topic_manager: false,
      can_create_collections: true,
      preferred_site_language_code: null,
      username: 'tester',
      email: 'test@test.com',
      user_is_logged_in: true
    };
    spyOn(userService, 'getUserInfoAsync').and.returnValue(Promise.resolve(
      UserInfo.createFromBackendDict(UserInfoObject))
    );
    component.ngOnInit();
    flushMicrotasks();
    expect(component.userIsLoggedIn).toBe(true);
  }));

  it('should record analytics when Start Learning is clicked', () => {
    spyOn(
      siteAnalyticsService, 'registerClickStartLearningButtonEvent')
      .and.callThrough();
    component.onClickStartLearningButton();
    expect(siteAnalyticsService.registerClickStartLearningButtonEvent)
      .toHaveBeenCalled();
  });

  it('should record analytics when Visit Classroom is clicked', () => {
    spyOn(
      siteAnalyticsService, 'registerClickVisitClassroomButtonEvent')
      .and.callThrough();
    component.onClickVisitClassroomButton();
    expect(siteAnalyticsService.registerClickVisitClassroomButtonEvent)
      .toHaveBeenCalled();
  });

  it('should redirect to library page when Browse Library is clicked',
    () => {
      component.onClickBrowseLibraryButton();
      expect(windowRef.nativeWindow.location.href).toBe('/community-library');
    }
  );

  it('should record analytics when Browse Library is clicked', () => {
    spyOn(
      siteAnalyticsService, 'registerClickBrowseLibraryButtonEvent')
      .and.callThrough();
    component.onClickBrowseLibraryButton();
    expect(siteAnalyticsService.registerClickBrowseLibraryButtonEvent)
      .toHaveBeenCalled();
  });

  it('should redirect to teach page when Guide For Parents is clicked',
    () => {
      component.onClickGuideParentsButton();
      expect(windowRef.nativeWindow.location.href).toBe('/teach');
    }
  );

  it('should record analytics when Guide For Parents is clicked', () => {
    spyOn(
      siteAnalyticsService, 'registerClickGuideParentsButtonEvent')
      .and.callThrough();
    component.onClickGuideParentsButton();
    expect(siteAnalyticsService.registerClickGuideParentsButtonEvent)
      .toHaveBeenCalled();
  });

  it('should redirect to teach page when Tips For Parents is clicked',
    () => {
      component.onClickTipforParentsButton();
      expect(windowRef.nativeWindow.location.href).toBe('/teach');
    }
  );

  it('should record analytics when Tips For Parents is clicked', () => {
    spyOn(
      siteAnalyticsService, 'registerClickTipforParentsButtonEvent')
      .and.callThrough();
    component.onClickTipforParentsButton();
    expect(siteAnalyticsService.registerClickTipforParentsButtonEvent)
      .toHaveBeenCalled();
  });

  it('should record analytics when Explore Lessons is clicked', () => {
    spyOn(
      siteAnalyticsService, 'registerClickExploreLessonsButtonEvent')
      .and.callThrough();
    component.onClickExploreLessonsButton();
    expect(siteAnalyticsService.registerClickExploreLessonsButtonEvent)
      .toHaveBeenCalled();
  });

  it('should increment and decrement testimonial IDs correctly', () => {
    component.ngOnInit();
    expect(component.displayedTestimonialId).toBe(0);
    component.incrementDisplayedTestimonialId();
    expect(component.displayedTestimonialId).toBe(1);
    component.incrementDisplayedTestimonialId();
    // Add back after testimonials are complete.
    // component.incrementDisplayedTestimonialId();
    component.incrementDisplayedTestimonialId();
    expect(component.displayedTestimonialId).toBe(0);

    component.decrementDisplayedTestimonialId();
    expect(component.displayedTestimonialId).toBe(2);
    component.decrementDisplayedTestimonialId();
    expect(component.displayedTestimonialId).toBe(1);
  });

  it('should get testimonials correctly', () => {
    component.ngOnInit();
    expect(component.getTestimonials().length).toBe(component.testimonialCount);
  });

  it('should direct users to the android page on click', function() {
    expect(windowRef.nativeWindow.location.href).not.toEqual('/android');

    component.onClickAccessAndroidButton();

    expect(windowRef.nativeWindow.location.href).toEqual('/android');
  });
});
