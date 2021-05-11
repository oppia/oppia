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

import { TestBed, fakeAsync } from '@angular/core/testing';
import { EventEmitter, Pipe } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { AboutPageComponent } from './about-page.component';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { LoaderService } from 'services/loader.service';
import { SiteAnalyticsService } from 'services/site-analytics.service';
import { TranslateService } from 'services/translate.service';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';
import { UserInfo } from 'domain/user/user-info.model';
import { UserService } from 'services/user.service';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { WindowRef } from 'services/contextual/window-ref.service';

@Pipe({name: 'translate'})
class MockTranslatePipe {
  transform(value: string, params: Object | undefined): string {
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

fdescribe('About Page', () => {
  const siteAnalyticsService = new SiteAnalyticsService(
    new WindowRef());
  let loaderService: LoaderService = null;
  let userService: UserService;
  beforeEach(async() => {
    TestBed.configureTestingModule({
      declarations: [AboutPageComponent,
        MockTranslatePipe],
      imports: [HttpClientTestingModule],
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
        { provide: SiteAnalyticsService, useValue: siteAnalyticsService },
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
    loaderService = TestBed.get(LoaderService);
    userService = TestBed.get(UserService);
    const aboutPageComponent = TestBed.createComponent(AboutPageComponent);
    component = aboutPageComponent.componentInstance;
  });
  beforeEach(angular.mock.module('oppia'));
  let component = null;

  it('should successfully instantiate the component',
    () => {
      expect(component).toBeDefined();
      component.ngOnInit();
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
    expect(component.windowRef.nativeWindow.location.href).toBe(
      '/creator-dashboard?mode=create');
  });

  it('should show and hide loading screen with the correct text', () =>
    fakeAsync(() => {
      component.ngOnInit();
      spyOn(loaderService, 'showLoadingScreen').and.callThrough();
      expect(loaderService.showLoadingScreen)
        .toHaveBeenCalledWith('Loading');
    }));

  it('should register correct event on calling onClickVisitClassroomButton',
    () => {
      const userInfoBackendDict = {
        is_moderator: false,
        is_admin: false,
        is_super_admin: false,
        is_topic_manager: false,
        can_create_collections: false,
        preferred_site_language_code: null,
        username: '',
        email: '',
        user_is_logged_in: true
      };
      spyOn(userService, 'getUserInfoAsync').and.returnValue(Promise.resolve(
        UserInfo.createFromBackendDict(userInfoBackendDict))
      );
      spyOn(
        siteAnalyticsService, 'registerClickVisitClassroomButtonEvent')
        .and.callThrough();
      component.onClickVisitClassroomButton();

      expect(siteAnalyticsService.registerClickVisitClassroomButtonEvent)
        .toHaveBeenCalledWith();
      expect(component.classroomUrl).toBe('/learn/math');
      expect(component.windowRef.nativeWindow.location.href).toBe(
        component.classroomUrl);
    });

  it('should register correct event on calling onClickBrowseLibraryButton',
    () => {
      spyOn(
        siteAnalyticsService, 'registerClickBrowseLibraryButtonEvent')
        .and.callThrough();

      component.onClickBrowseLibraryButton();

      expect(siteAnalyticsService.registerClickBrowseLibraryButtonEvent)
        .toHaveBeenCalledWith();
      expect(component.windowRef.nativeWindow.location.href)
        .toBe('/community-library');
    });
});
