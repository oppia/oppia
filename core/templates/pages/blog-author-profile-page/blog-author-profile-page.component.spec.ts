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
 * @fileoverview Unit tests for the Blog Author Profile Page component.
 */

import {Pipe} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {MaterialModule} from 'modules/material.module';
import {FormsModule} from '@angular/forms';
import {BlogAuthorProfilePageComponent} from 'pages/blog-author-profile-page/blog-author-profile-page.component';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {LoaderService} from 'services/loader.service';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {
  BlogAuthorProfilePageData,
  BlogHomePageBackendApiService,
} from 'domain/blog/blog-homepage-backend-api.service';
import {UrlService} from 'services/contextual/url.service';
import {BlogCardComponent} from 'pages/blog-dashboard-page/blog-card/blog-card.component';
import {BlogAuthorProfilePageConstants} from './blog-author-profile-page.constants';
import {
  BlogPostSummary,
  BlogPostSummaryBackendDict,
} from 'domain/blog/blog-post-summary.model';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {AlertsService} from 'services/alerts.service';
import {UserService} from 'services/user.service';
// This throws "TS2307". We need to
// suppress this error because rte-text-components are not strictly typed yet.
// @ts-ignore
import {RichTextComponentsModule} from 'rich_text_components/rich-text-components.module';

@Pipe({name: 'truncate'})
class MockTruncatePipe {
  transform(value: string, params: Object | undefined): string {
    return value;
  }
}

class MockWindowDimensionsService {
  getWidth(): number {
    return 766;
  }
}

describe('Blog home page component', () => {
  let alertsService: AlertsService;
  let windowDimensionsService: WindowDimensionsService;
  let urlService: UrlService;
  let urlInterpolationService: UrlInterpolationService;
  let loaderService: LoaderService;
  let blogHomePageBackendApiService: BlogHomePageBackendApiService;
  let blogAuthorProfilePageDataObject: BlogAuthorProfilePageData;
  let blogPostSummaryObject: BlogPostSummary;
  let component: BlogAuthorProfilePageComponent;
  let fixture: ComponentFixture<BlogAuthorProfilePageComponent>;
  let userService: UserService;

  let blogPostSummary: BlogPostSummaryBackendDict = {
    id: 'sampleBlogId',
    displayed_author_name: 'test_user',
    author_username: 'test_username',
    title: 'sample_title',
    summary: 'hello',
    thumbnail_filename: 'image',
    tags: ['learners', 'news'],
    url_fragment: 'sample#url',
    last_updated: '3232323',
    published_on: '1212121',
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        FormsModule,
        NgbModule,
        MaterialModule,
        RichTextComponentsModule,
      ],
      declarations: [
        BlogAuthorProfilePageComponent,
        BlogCardComponent,
        MockTranslatePipe,
        MockTruncatePipe,
      ],
      providers: [
        {
          provide: WindowDimensionsService,
          useClass: MockWindowDimensionsService,
        },
        LoaderService,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BlogAuthorProfilePageComponent);
    component = fixture.componentInstance;
    windowDimensionsService = TestBed.inject(WindowDimensionsService);
    alertsService = TestBed.inject(AlertsService);
    blogHomePageBackendApiService = TestBed.inject(
      BlogHomePageBackendApiService
    );
    urlService = TestBed.inject(UrlService);
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    loaderService = TestBed.inject(LoaderService);
    userService = TestBed.inject(UserService);
    blogPostSummaryObject =
      BlogPostSummary.createFromBackendDict(blogPostSummary);
    blogAuthorProfilePageDataObject = {
      displayedAuthorName: 'author',
      authorBio: 'author Bio',
      numOfBlogPostSummaries: 0,
      blogPostSummaries: [],
    };
    spyOn(loaderService, 'showLoadingScreen');
    spyOn(loaderService, 'hideLoadingScreen');
    spyOn(urlService, 'getBlogAuthorUsernameFromUrl').and.returnValue(
      'authorUsername'
    );
  });

  it('should initialize', () => {
    spyOn(component, 'loadInitialBlogAuthorProfilePageData');

    component.ngOnInit();

    expect(loaderService.showLoadingScreen).toHaveBeenCalled();
    expect(component.authorUsername).toBe('authorUsername');
    expect(component.MAX_NUM_CARD_TO_DISPLAY_ON_PAGE).toBe(
      BlogAuthorProfilePageConstants.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_AUTHOR_PROFILE_PAGE
    );
    expect(component.loadInitialBlogAuthorProfilePageData).toHaveBeenCalled();
  });

  it(
    'should load blog author profile page data with no published blog post ' +
      'summary',
    fakeAsync(() => {
      spyOn(
        blogHomePageBackendApiService,
        'fetchBlogAuthorProfilePageDataAsync'
      ).and.returnValue(Promise.resolve(blogAuthorProfilePageDataObject));

      expect(component.noResultsFound).toBeUndefined();

      component.ngOnInit();
      component.loadInitialBlogAuthorProfilePageData();

      expect(
        blogHomePageBackendApiService.fetchBlogAuthorProfilePageDataAsync
      ).toHaveBeenCalledWith('authorUsername', '0');

      tick();
      expect(component.noResultsFound).toBeTrue();

      expect(loaderService.hideLoadingScreen).toHaveBeenCalled();
    })
  );

  it(
    'should load blog author profile page data with published blog post ' +
      'summary',
    fakeAsync(() => {
      blogAuthorProfilePageDataObject.blogPostSummaries = [
        blogPostSummaryObject,
      ];
      blogAuthorProfilePageDataObject.numOfBlogPostSummaries = 1;

      spyOn(
        blogHomePageBackendApiService,
        'fetchBlogAuthorProfilePageDataAsync'
      ).and.returnValue(Promise.resolve(blogAuthorProfilePageDataObject));
      spyOn(userService, 'getProfileImageDataUrl').and.returnValue([
        'default-image-url-png',
        'default-image-url-webp',
      ]);

      component.ngOnInit();
      component.loadInitialBlogAuthorProfilePageData();

      expect(
        blogHomePageBackendApiService.fetchBlogAuthorProfilePageDataAsync
      ).toHaveBeenCalledWith('authorUsername', '0');

      tick();

      expect(component.noResultsFound).toBeFalse();
      expect(component.totalBlogPosts).toBe(1);
      expect(component.authorName).toBe('author');
      expect(component.authorBio).toBe('author Bio');
      expect(component.blogPostSummaries).toEqual([blogPostSummaryObject]);
      expect(component.authorProfilePicPngUrl).toBe('default-image-url-png');
      expect(component.authorProfilePicWebpUrl).toBe('default-image-url-webp');
      expect(loaderService.hideLoadingScreen).toHaveBeenCalled();
    })
  );

  it('should succesfully load multiple blog home pages data', fakeAsync(() => {
    component.MAX_NUM_CARD_TO_DISPLAY_ON_PAGE = 1;
    component.authorUsername = 'authorUsername';
    blogAuthorProfilePageDataObject.numOfBlogPostSummaries = 3;
    blogAuthorProfilePageDataObject.blogPostSummaries = [blogPostSummaryObject];
    spyOn(alertsService, 'addWarning');
    spyOn(
      blogHomePageBackendApiService,
      'fetchBlogAuthorProfilePageDataAsync'
    ).and.returnValue(Promise.resolve(blogAuthorProfilePageDataObject));

    component.loadInitialBlogAuthorProfilePageData();
    tick();

    expect(component.totalBlogPosts).toBe(3);
    expect(component.noResultsFound).toBeFalse();
    expect(component.blogPostSummaries).toEqual([blogPostSummaryObject]);
    expect(component.blogPostSummariesToShow).toEqual([blogPostSummaryObject]);
    expect(component.lastPostOnPageNum).toBe(1);

    component.page = 2;
    component.loadMoreBlogPostSummaries(1);
    tick();

    expect(
      blogHomePageBackendApiService.fetchBlogAuthorProfilePageDataAsync
    ).toHaveBeenCalledWith('authorUsername', '1');
    expect(component.totalBlogPosts).toBe(3);
    expect(component.blogPostSummaries).toEqual([
      blogPostSummaryObject,
      blogPostSummaryObject,
    ]);
    expect(component.blogPostSummariesToShow).toEqual([blogPostSummaryObject]);
    expect(component.lastPostOnPageNum).toBe(2);

    expect(alertsService.addWarning).not.toHaveBeenCalled();
  }));

  it('should load data for page on changing page', () => {
    spyOn(component, 'loadMoreBlogPostSummaries');
    component.totalBlogPosts = 5;
    component.blogPostSummaries = [
      blogPostSummaryObject,
      blogPostSummaryObject,
    ];
    component.ngOnInit();
    component.MAX_NUM_CARD_TO_DISPLAY_ON_PAGE = 2;

    expect(component.page).toBe(1);
    expect(component.firstPostOnPageNum).toBe(1);
    expect(component.MAX_NUM_CARD_TO_DISPLAY_ON_PAGE).toBe(2);
    expect(component.showBlogPostCardsLoadingScreen).toBeFalse();

    // Changing to page number 2.
    component.page = 2;
    component.onPageChange();

    expect(component.firstPostOnPageNum).toBe(3);
    expect(component.showBlogPostCardsLoadingScreen).toBeTrue();
    expect(component.loadMoreBlogPostSummaries).toHaveBeenCalledWith(2);
    expect(component.lastPostOnPageNum).toBe(4);
    // Adding blog post summaries for page 2.
    component.blogPostSummaries = component.blogPostSummaries.concat([
      blogPostSummaryObject,
      blogPostSummaryObject,
    ]);
    component.showBlogPostCardsLoadingScreen = false;

    // Changing to page number 3.
    component.page = 3;
    component.onPageChange();

    expect(component.firstPostOnPageNum).toBe(5);
    expect(component.showBlogPostCardsLoadingScreen).toBeTrue();
    expect(component.loadMoreBlogPostSummaries).toHaveBeenCalledWith(4);
    expect(component.loadMoreBlogPostSummaries).toHaveBeenCalledTimes(2);
    expect(component.lastPostOnPageNum).toBe(5);
    // Adding blog post summaries for page 3.
    component.blogPostSummaries = component.blogPostSummaries.concat([
      blogPostSummaryObject,
    ]);
    component.showBlogPostCardsLoadingScreen = false;

    // Changing back to page number 2.
    component.page = 2;
    component.onPageChange();

    expect(component.firstPostOnPageNum).toBe(3);
    expect(component.showBlogPostCardsLoadingScreen).toBeFalse();
    // Function loadMoreBlogPostSummaries should not be called again.
    expect(component.loadMoreBlogPostSummaries).toHaveBeenCalledTimes(2);
    expect(component.lastPostOnPageNum).toBe(4);
    expect(component.blogPostSummaries.length).toBe(5);
    expect(component.blogPostSummariesToShow.length).toBe(2);
  });

  it('should use reject handler if fetching blog home page data fails', fakeAsync(() => {
    spyOn(alertsService, 'addWarning');
    spyOn(
      blogHomePageBackendApiService,
      'fetchBlogAuthorProfilePageDataAsync'
    ).and.returnValue(
      Promise.reject({
        error: {error: 'Backend error'},
        status: 500,
      })
    );
    component.authorUsername = 'authorUsername';

    component.loadInitialBlogAuthorProfilePageData();

    expect(
      blogHomePageBackendApiService.fetchBlogAuthorProfilePageDataAsync
    ).toHaveBeenCalledWith('authorUsername', '0');

    tick();

    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'Failed to get blog author profile page data.Error: Backend error'
    );
  }));

  it(
    'should use reject handler if fetching data for loading more published' +
      'blog post fails',
    fakeAsync(() => {
      spyOn(alertsService, 'addWarning');
      spyOn(
        blogHomePageBackendApiService,
        'fetchBlogAuthorProfilePageDataAsync'
      ).and.returnValue(
        Promise.reject({
          error: {error: 'Backend error'},
          status: 500,
        })
      );

      component.authorUsername = 'authorUsername';
      component.loadMoreBlogPostSummaries(1);

      expect(
        blogHomePageBackendApiService.fetchBlogAuthorProfilePageDataAsync
      ).toHaveBeenCalledWith('authorUsername', '1');

      tick();

      expect(alertsService.addWarning).toHaveBeenCalledWith(
        'Failed to get blog author page data.Error: Backend error'
      );
    })
  );

  it('should determine if small screen view is active', () => {
    const windowWidthSpy = spyOn(
      windowDimensionsService,
      'getWidth'
    ).and.returnValue(766);
    expect(component.isSmallScreenViewActive()).toBe(true);
    windowWidthSpy.and.returnValue(1028);
    expect(component.isSmallScreenViewActive()).toBe(false);
  });

  it('should get static asset image url', () => {
    spyOn(
      urlInterpolationService,
      'getStaticCopyrightedImageUrl'
    ).and.returnValue('image_url');

    expect(component.getStaticCopyrightedImageUrl('url')).toBe('image_url');
  });
});
