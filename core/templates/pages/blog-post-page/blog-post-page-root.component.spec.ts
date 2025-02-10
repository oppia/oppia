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
import {
  BlogHomePageBackendApiService,
  BlogPostPageData,
} from 'domain/blog/blog-homepage-backend-api.service';

import {BlogPostBackendDict, BlogPostData} from 'domain/blog/blog-post.model';
import {AccessValidationBackendApiService} from 'pages/oppia-root/routing/access-validation-backend-api.service';
import {AlertsService} from 'services/alerts.service';
import {MetaTagCustomizationService} from 'services/contextual/meta-tag-customization.service';
import {UrlService} from 'services/contextual/url.service';
import {LoaderService} from 'services/loader.service';
import {PageHeadService} from 'services/page-head.service';
import {PageTitleService} from 'services/page-title.service';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {BlogPostPageRootComponent} from './blog-post-page-root.component';
import {UserService} from 'services/user.service';

class MockTranslateService {
  onLangChange: EventEmitter<string> = new EventEmitter();
  instant(key: string): string {
    return key;
  }
}

describe('Blog Post Page Root', () => {
  let fixture: ComponentFixture<BlogPostPageRootComponent>;
  let component: BlogPostPageRootComponent;
  let pageHeadService: PageHeadService;
  let accessValidationBackendApiService: AccessValidationBackendApiService;
  let loaderService: LoaderService;
  let translateService: TranslateService;
  let urlService: UrlService;
  let pageTitleService: PageTitleService;
  let blogHomePageBackendApiService: BlogHomePageBackendApiService;
  let sampleBlogPost: BlogPostData;
  let userService: UserService;
  let alertsService: AlertsService;
  let sampleBlogPostBackendDict: BlogPostBackendDict = {
    id: 'sampleId',
    displayed_author_name: 'testUsername',
    title: 'sampleTitle',
    content: '<p>Hello</p>',
    thumbnail_filename: 'image',
    url_fragment: 'sample-post',
    tags: ['news', 'pandas'],
    last_updated: '3454354354',
    published_on: '3454354354',
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [BlogPostPageRootComponent, MockTranslatePipe],
      providers: [
        PageHeadService,
        MetaTagCustomizationService,
        UrlService,
        UserService,
        PageTitleService,
        BlogHomePageBackendApiService,
        {
          provide: TranslateService,
          useClass: MockTranslateService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BlogPostPageRootComponent);
    component = fixture.componentInstance;
    alertsService = TestBed.inject(AlertsService);
    pageHeadService = TestBed.inject(PageHeadService);
    pageTitleService = TestBed.inject(PageTitleService);
    blogHomePageBackendApiService = TestBed.inject(
      BlogHomePageBackendApiService
    );
    loaderService = TestBed.inject(LoaderService);
    urlService = TestBed.inject(UrlService);
    accessValidationBackendApiService = TestBed.inject(
      AccessValidationBackendApiService
    );
    translateService = TestBed.inject(TranslateService);
    sampleBlogPost = BlogPostData.createFromBackendDict(
      sampleBlogPostBackendDict
    );
    userService = TestBed.inject(UserService);
    spyOn(urlService, 'getBlogPostUrlFromUrl').and.returnValue('sample-post');
  });

  it('should successfully instantiate the component', () => {
    expect(component).toBeDefined();
  });

  it(
    'should initialize and show page when access is valid and blog project' +
      ' feature is enabled',
    fakeAsync(() => {
      spyOn(userService, 'canUserEditBlogPosts').and.returnValue(
        Promise.resolve(false)
      );
      spyOn(
        accessValidationBackendApiService,
        'validateAccessToBlogPostPage'
      ).and.returnValue(Promise.resolve());
      spyOn(loaderService, 'showLoadingScreen');
      spyOn(loaderService, 'hideLoadingScreen');
      spyOn(component, 'fetchBlogPostData');

      component.ngOnInit();
      tick();
      tick();

      expect(loaderService.showLoadingScreen).toHaveBeenCalled();
      expect(component.blogPostUrlFragment).toBe('sample-post');
      expect(
        accessValidationBackendApiService.validateAccessToBlogPostPage
      ).toHaveBeenCalled();
      expect(component.fetchBlogPostData).toHaveBeenCalledWith('sample-post');
      expect(component.errorPageIsShown).toBeFalse();
      expect(loaderService.hideLoadingScreen).not.toHaveBeenCalled();
    })
  );

  it('should initialize and show error page when server respond with error', fakeAsync(() => {
    spyOn(userService, 'canUserEditBlogPosts').and.returnValue(
      Promise.resolve(false)
    );
    spyOn(
      accessValidationBackendApiService,
      'validateAccessToBlogPostPage'
    ).and.returnValue(Promise.reject());
    spyOn(loaderService, 'showLoadingScreen');
    spyOn(loaderService, 'hideLoadingScreen');
    spyOn(component, 'fetchBlogPostData');

    component.ngOnInit();
    tick();
    tick();
    tick();

    expect(loaderService.showLoadingScreen).toHaveBeenCalled();
    expect(
      accessValidationBackendApiService.validateAccessToBlogPostPage
    ).toHaveBeenCalledWith('sample-post');
    expect(component.fetchBlogPostData).not.toHaveBeenCalled();
    expect(component.errorPageIsShown).toBeTrue();
    expect(loaderService.hideLoadingScreen).toHaveBeenCalled();
  }));

  it('should initialize and subscribe to onLangChange', fakeAsync(() => {
    spyOn(
      accessValidationBackendApiService,
      'validateAccessToBlogPostPage'
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
      'validateAccessToBlogPostPage'
    ).and.returnValue(Promise.resolve());
    component.ngOnInit();
    spyOn(component, 'setPageTitleAndMetaTags');

    translateService.onLangChange.emit();

    expect(component.setPageTitleAndMetaTags).toHaveBeenCalled();
  });

  it('should obtain translated title and set the title and meta tags', () => {
    spyOn(translateService, 'instant').and.callThrough();
    spyOn(pageHeadService, 'updateTitleAndMetaTags');
    spyOn(pageTitleService, 'addMetaTag');
    component.blogPost = sampleBlogPost;

    component.setPageTitleAndMetaTags();

    expect(translateService.instant).toHaveBeenCalledWith(
      AppConstants.PAGES_REGISTERED_WITH_FRONTEND.BLOG_POST_PAGE.TITLE,
      {blogPostTitle: 'sampleTitle'}
    );
    expect(pageHeadService.updateTitleAndMetaTags).toHaveBeenCalledWith(
      'I18N_BLOG_POST_PAGE_TITLE',
      AppConstants.PAGES_REGISTERED_WITH_FRONTEND.BLOG_POST_PAGE.META
    );
    expect(pageTitleService.addMetaTag).toHaveBeenCalledWith({
      name: 'keywords',
      content: 'news, pandas',
    });
  });

  it('should successfully load fetch blog post data from backend', fakeAsync(() => {
    let sampleBlogPostPageData: BlogPostPageData = {
      authorUsername: 'test_username',
      blogPostDict: sampleBlogPost,
      summaryDicts: [],
    };
    spyOn(
      blogHomePageBackendApiService,
      'fetchBlogPostPageDataAsync'
    ).and.returnValue(Promise.resolve(sampleBlogPostPageData));
    spyOn(component, 'setPageTitleAndMetaTags');
    spyOn(loaderService, 'hideLoadingScreen');

    component.fetchBlogPostData('sample-post');

    expect(
      blogHomePageBackendApiService.fetchBlogPostPageDataAsync
    ).toHaveBeenCalledWith('sample-post');

    tick();

    expect(component.blogPost).toEqual(sampleBlogPost);
    expect(component.blogPostPageData).toEqual(sampleBlogPostPageData);
    expect(component.setPageTitleAndMetaTags).toHaveBeenCalled();
    expect(loaderService.hideLoadingScreen).toHaveBeenCalled();
  }));

  it('should use reject handler if fetching blog post data', fakeAsync(() => {
    spyOn(alertsService, 'addWarning');
    spyOn(
      blogHomePageBackendApiService,
      'fetchBlogPostPageDataAsync'
    ).and.returnValue(
      Promise.reject({
        error: {error: 'Backend error'},
        status: 500,
      })
    );

    component.fetchBlogPostData('sample-post');

    expect(
      blogHomePageBackendApiService.fetchBlogPostPageDataAsync
    ).toHaveBeenCalledWith('sample-post');

    tick();

    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'Unable to fetch blog post data.Error: Backend error'
    );
  }));

  it('should unsubscribe on component destruction', () => {
    spyOn(component.directiveSubscriptions, 'unsubscribe');

    component.ngOnDestroy();

    expect(component.directiveSubscriptions.unsubscribe).toHaveBeenCalled();
  });
});
