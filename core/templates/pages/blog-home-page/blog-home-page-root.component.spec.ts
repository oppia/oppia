// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the blog home page root component.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA, EventEmitter} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {TranslateService} from '@ngx-translate/core';

import {AppConstants} from 'app.constants';
import {AccessValidationBackendApiService} from 'pages/oppia-root/routing/access-validation-backend-api.service';
import {MetaTagCustomizationService} from 'services/contextual/meta-tag-customization.service';
import {LoaderService} from 'services/loader.service';
import {PageHeadService} from 'services/page-head.service';

import {MockTranslatePipe} from 'tests/unit-test-utils';
import {BlogHomePageRootComponent} from './blog-home-page-root.component';
import {UserService} from 'services/user.service';

class MockTranslateService {
  onLangChange: EventEmitter<string> = new EventEmitter();
  instant(key: string): string {
    return key;
  }
}

describe('Blog Home Page Root', () => {
  let fixture: ComponentFixture<BlogHomePageRootComponent>;
  let component: BlogHomePageRootComponent;
  let pageHeadService: PageHeadService;
  let accessValidationBackendApiService: AccessValidationBackendApiService;
  let loaderService: LoaderService;
  let userService: UserService;
  let translateService: TranslateService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [BlogHomePageRootComponent, MockTranslatePipe],
      providers: [
        PageHeadService,
        UserService,
        MetaTagCustomizationService,
        {
          provide: TranslateService,
          useClass: MockTranslateService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BlogHomePageRootComponent);
    component = fixture.componentInstance;
    pageHeadService = TestBed.inject(PageHeadService);
    loaderService = TestBed.inject(LoaderService);
    accessValidationBackendApiService = TestBed.inject(
      AccessValidationBackendApiService
    );
    userService = TestBed.inject(UserService);
    translateService = TestBed.inject(TranslateService);
  });

  it('should successfully instantiate the component', () => {
    expect(component).toBeDefined();
  });

  it('should initialize and show page when access is valid', fakeAsync(() => {
    spyOn(userService, 'canUserEditBlogPosts').and.returnValue(
      Promise.resolve(false)
    );
    spyOn(
      accessValidationBackendApiService,
      'validateAccessToBlogHomePage'
    ).and.returnValue(Promise.resolve());
    spyOn(loaderService, 'showLoadingScreen');
    spyOn(loaderService, 'hideLoadingScreen');

    component.ngOnInit();
    tick();
    tick();

    expect(loaderService.showLoadingScreen).toHaveBeenCalled();
    expect(
      accessValidationBackendApiService.validateAccessToBlogHomePage
    ).toHaveBeenCalled();
    expect(loaderService.hideLoadingScreen).toHaveBeenCalled();
  }));

  it('should initialize and show error page when server respond with error', fakeAsync(() => {
    spyOn(userService, 'canUserEditBlogPosts').and.returnValue(
      Promise.resolve(false)
    );
    spyOn(
      accessValidationBackendApiService,
      'validateAccessToBlogHomePage'
    ).and.returnValue(Promise.reject());
    spyOn(loaderService, 'showLoadingScreen');
    spyOn(loaderService, 'hideLoadingScreen');

    component.ngOnInit();
    tick();
    tick();

    expect(loaderService.showLoadingScreen).toHaveBeenCalled();
    expect(
      accessValidationBackendApiService.validateAccessToBlogHomePage
    ).toHaveBeenCalled();
    expect(component.pageIsShown).toBeFalse();
    expect(component.errorPageIsShown).toBeTrue();
    expect(loaderService.hideLoadingScreen).toHaveBeenCalled();
  }));

  it('should initialize and subscribe to onLangChange', fakeAsync(() => {
    spyOn(
      accessValidationBackendApiService,
      'validateAccessToBlogHomePage'
    ).and.returnValue(Promise.resolve());
    spyOn(component.directiveSubscriptions, 'add');
    spyOn(translateService.onLangChange, 'subscribe');

    component.ngOnInit();
    tick();

    expect(component.directiveSubscriptions.add).toHaveBeenCalled();
    expect(translateService.onLangChange.subscribe).toHaveBeenCalled();
  }));

  it('should update page title whenever the language changes', () => {
    spyOn(
      accessValidationBackendApiService,
      'validateAccessToBlogHomePage'
    ).and.returnValue(Promise.resolve());
    component.ngOnInit();
    spyOn(component, 'setPageTitleAndMetaTags');

    translateService.onLangChange.emit();

    expect(component.setPageTitleAndMetaTags).toHaveBeenCalled();
  });

  it('should obtain translated title and set the title and meta tags', () => {
    spyOn(translateService, 'instant').and.callThrough();
    spyOn(pageHeadService, 'updateTitleAndMetaTags');

    component.setPageTitleAndMetaTags();

    expect(translateService.instant).toHaveBeenCalledWith(
      AppConstants.PAGES_REGISTERED_WITH_FRONTEND.BLOG_HOMEPAGE.TITLE
    );
    expect(pageHeadService.updateTitleAndMetaTags).toHaveBeenCalledWith(
      AppConstants.PAGES_REGISTERED_WITH_FRONTEND.BLOG_HOMEPAGE.TITLE,
      AppConstants.PAGES_REGISTERED_WITH_FRONTEND.BLOG_HOMEPAGE.META
    );
  });

  it('should unsubscribe on component destruction', () => {
    spyOn(component.directiveSubscriptions, 'unsubscribe');

    component.ngOnDestroy();

    expect(component.directiveSubscriptions.unsubscribe).toHaveBeenCalled();
  });
});
