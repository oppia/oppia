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

import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { EventEmitter, Pipe } from '@angular/core';
import { HttpClientTestingModule } from
  '@angular/common/http/testing';

import { AboutPageComponent } from './about-page.component';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { TranslateService } from 'services/translate.service';
import { WindowDimensionsService } from
  'services/contextual/window-dimensions.service';
import { UserInfo } from 'domain/user/user-info.model.ts';
import { UserService } from 'services/user.service';
import { LoaderService } from 'services/loader.service.ts';

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
  codeChangeEventEmiiter = new EventEmitter<string>();
  getCurrentI18nLanguageCode() {
    return 'en';
  }

  get onI18nLanguageCodeChange() {
    return this.codeChangeEventEmiiter;
  }
}

describe('About Page', () => {
  const siteAnalyticsServiceStub = new SiteAnalyticsService(
    new WindowRef());
  let loaderService: LoaderService = null;
  let userService: UserService;
  beforeEach(async() => {
    TestBed.configureTestingModule({
      declarations: [AboutPageComponent, MockTranslatePipe],
      providers: [
        {
          provide: I18nLanguageCodeService,
          useClass: MockI18nLanguageCodeService
        },
        {
          provide: WindowDimensionsService,
          useValue: {
            isWindowNarrow: () => true
          }
        },
        { provide: TranslateService, useClass: MockTranslateService },
        {provide: SiteAnalyticsService, useValue: siteAnalyticsServiceStub},
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
  });
  let component;
  beforeEach(() => {
    const aboutPageComponent = TestBed.createComponent(AboutPageComponent);
    component = aboutPageComponent.componentInstance;
  });

  it('should successfully instantiate the component from beforeEach block',
    () => {
      expect(component).toBeDefined();
      component.ngOnInit();
    });

  it('should get static image url', () => {
    expect(component.getStaticImageUrl('/path/to/image')).toBe(
      '/assets/images/path/to/image');
  });

  it('should check user is not logged in and navigate to create lesson page',
    fakeAsync(() => {
      const UserInfoObject = {
        is_moderator: false,
        is_admin: false,
        is_super_admin: false,
        is_topic_manager: false,
        can_create_collections: false,
        preferred_site_language_code: null,
        username: '',
        email: '',
        user_is_logged_in: null
      };
      spyOn(userService, 'getUserInfoAsync').and.returnValue(Promise.resolve(
        UserInfo.createFromBackendDict(UserInfoObject))
      );
      component.ngOnInit();
      flushMicrotasks();
      expect(component.userIsLoggedIn).toBe(null);
      spyOn(
        siteAnalyticsServiceStub, 'registerCreateLessonButtonEvent')
        .and.callThrough();
      spyOn(global, 'setTimeout');
      component.onClickCreateLessonButton();
      expect(siteAnalyticsServiceStub.registerCreateLessonButtonEvent)
        .toHaveBeenCalledWith();
      expect(component.loginUrl).toBe('/_ah/login');
    }));

  it('should set component properties when ngOnInit() is called', () => {
    component.ngOnInit();
    expect(component.userIsLoggedIn).toBe(null);
    expect(component.classroomUrl).toBe('/learn/math');
    expect(component.loginUrl).toBe('/_ah/login');
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

  it('should activate when Visit Classroom is clicked', function() {
    spyOn(
      siteAnalyticsServiceStub, 'registerClickVisitClassroomButtonEvent')
      .and.callThrough();
    component.onClickVisitClassroomButton();
    expect(siteAnalyticsServiceStub.registerClickVisitClassroomButtonEvent)
      .toHaveBeenCalledWith();
  });

  it('should activate when Browse Library is clicked', function() {
    spyOn(
      siteAnalyticsServiceStub, 'registerClickBrowseLibraryButtonEvent')
      .and.callThrough();
    spyOn(global, 'setTimeout');
    component.onClickBrowseLibraryButton();
    expect(siteAnalyticsServiceStub.registerClickBrowseLibraryButtonEvent)
      .toHaveBeenCalledWith();
  });

  it('should activate when Create Lesson is clicked', function() {
    spyOn(
      siteAnalyticsServiceStub, 'registerCreateLessonButtonEvent')
      .and.callThrough();
    spyOn(global, 'setTimeout');
    component.onClickCreateLessonButton();
    expect(siteAnalyticsServiceStub.registerCreateLessonButtonEvent)
      .toHaveBeenCalledWith();
  });

  it('should activate when Guide For Teacher is clicked', function() {
    spyOn(
      siteAnalyticsServiceStub, 'registerClickGuideForTeacherButtonEvent')
      .and.callThrough();
    component.onClickGuideForTeacherButton();
    expect(siteAnalyticsServiceStub.registerClickGuideForTeacherButtonEvent)
      .toHaveBeenCalledWith();
  });

  it('should activate when Tip For Parent is clicked', function() {
    spyOn(
      siteAnalyticsServiceStub, 'registerClickTipforParentsButtonEvent')
      .and.callThrough();
    component.onClickTipsForParentsButton();
    expect(siteAnalyticsServiceStub.registerClickTipforParentsButtonEvent)
      .toHaveBeenCalledWith();
  });
});
