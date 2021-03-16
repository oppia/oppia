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

import { Pipe, EventEmitter } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { TranslateService } from 'services/translate.service';
import { LoaderService } from 'services/loader.service.ts';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { WindowDimensionsService } from
  'services/contextual/window-dimensions.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { UserInfo } from 'domain/user/user-info.model.ts';
import { UserService } from 'services/user.service';
import { SplashPageComponent } from './splash-page.component';
import { of } from 'rxjs';

@Pipe({name: 'translate'})
class MockTranslatePipe {
  transform(value: string, params: Object | undefined):string {
    return value;
  }
}
class MockTranslateService {
  languageCode = 'es';
  use(newLanguageCode: string): string {
    this.languageCode = newLanguageCode;
    return this.languageCode;
  }
}
class MockI18nLanguageCodeService {
  codeChangeEventEmitter = new EventEmitter<string>();
  getCurrentI18nLanguageCode() {
    return 'en';
  }

  get onI18nLanguageCodeChange() {
    return this.codeChangeEventEmitter;
  }
}

describe('Splash Page', () => {
  const siteAnalyticsServiceStub = new SiteAnalyticsService(
    new WindowRef());
  let loaderService: LoaderService = null;
  let userService: UserService;
  let windowDimensionsService: WindowDimensionsService;
  let resizeEvent = new Event('resize');
  beforeEach(async() => {
    TestBed.configureTestingModule({
      declarations: [SplashPageComponent, MockTranslatePipe],
      providers: [
        {
          provide: I18nLanguageCodeService,
          useClass: MockI18nLanguageCodeService
        },
        {
          provide: WindowDimensionsService,
          useValue: {
            isWindowNarrow: () => true,
            getResizeEvent: () => of(resizeEvent)
          }
        },
        { provide: TranslateService, useClass: MockTranslateService },
        { provide: SiteAnalyticsService, useValue: siteAnalyticsServiceStub },
        UrlInterpolationService,
        {
          provide: WindowRef,
          useValue: {
            nativeWindow: {
              location: {
                href: ''
              }
            }
          }
        }
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
  });

  let component;
  beforeEach(() => {
    const splashPageComponent = TestBed.createComponent(SplashPageComponent);
    component = splashPageComponent.componentInstance;
  });

  it('should get static image url', function() {
    expect(component.getStaticImageUrl('/path/to/image')).toBe(
      '/assets/images/path/to/image');
  });

  it('should record analytics when Browse Lessons is clicked', function() {
    spyOn(
      siteAnalyticsServiceStub, 'registerClickBrowseLessonsButtonEvent')
      .and.callThrough();
    component.onClickBrowseLessonsButton();
    expect(siteAnalyticsServiceStub.registerClickBrowseLessonsButtonEvent)
      .toHaveBeenCalled();
  });

  it('should record analytics when Start Contributing is clicked', function() {
    spyOn(
      siteAnalyticsServiceStub, 'registerClickStartContributingButtonEvent')
      .and.callThrough();
    component.onClickStartContributingButton();
    expect(siteAnalyticsServiceStub.registerClickStartContributingButtonEvent)
      .toHaveBeenCalled();
  });

  it('should record analytics when Start Teaching is clicked', function() {
    spyOn(
      siteAnalyticsServiceStub, 'registerClickStartTeachingButtonEvent'
    ).and.callThrough();
    component.onClickStartTeachingButton();
    expect(siteAnalyticsServiceStub.registerClickStartTeachingButtonEvent)
      .toHaveBeenCalled();
  });

  it('should increment and decrement testimonial IDs correctly', function() {
    component.ngOnInit();
    expect(component.displayedTestimonialId).toBe(0);
    component.incrementDisplayedTestimonialId();
    expect(component.displayedTestimonialId).toBe(1);
    component.incrementDisplayedTestimonialId();
    component.incrementDisplayedTestimonialId();
    component.incrementDisplayedTestimonialId();
    expect(component.displayedTestimonialId).toBe(0);

    component.decrementDisplayedTestimonialId();
    expect(component.displayedTestimonialId).toBe(3);
    component.decrementDisplayedTestimonialId();
    expect(component.displayedTestimonialId).toBe(2);
  });

  it('should get testimonials correctly', function() {
    component.ngOnInit();
    expect(component.getTestimonials().length).toBe(component.testimonialCount);
  });

  it('should evaluate if user is logged in', fakeAsync(() => {
    const UserInfoObject = {
      is_moderator: false,
      is_admin: false,
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

  it('should evaluate if user is not logged in', fakeAsync(() => {
    const UserInfoObject = {
      is_moderator: false,
      is_admin: false,
      is_super_admin: false,
      is_topic_manager: false,
      can_create_collections: true,
      preferred_site_language_code: null,
      username: 'tester',
      email: 'test@test.com',
      user_is_logged_in: false
    };
    spyOn(userService, 'getUserInfoAsync').and.returnValue(Promise.resolve(
      UserInfo.createFromBackendDict(UserInfoObject))
    );
    component.ngOnInit();
    flushMicrotasks();
    expect(component.userIsLoggedIn).toBe(false);
  }));

  it('should check if loader screen is working', fakeAsync(() => {
    spyOn(loaderService, 'showLoadingScreen').and.callThrough();
    component.ngOnInit();
    expect(loaderService.showLoadingScreen)
      .toHaveBeenCalledWith('Loading');
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
