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
 * @fileoverview Unit tests for Blog Home Page Component.
 */

import {Pipe, PipeTransform} from '@angular/core';
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
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {BlogHomePageComponent} from 'pages/blog-home-page/blog-home-page.component';
import {WindowRef} from 'services/contextual/window-ref.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {LoaderService} from 'services/loader.service';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {
  BlogHomePageBackendApiService,
  BlogHomePageData,
} from 'domain/blog/blog-homepage-backend-api.service';
import {UrlService} from 'services/contextual/url.service';
import {BlogCardComponent} from 'pages/blog-dashboard-page/blog-card/blog-card.component';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {BlogHomePageConstants} from './blog-home-page.constants';
import {
  BlogPostSummary,
  BlogPostSummaryBackendDict,
} from 'domain/blog/blog-post-summary.model';
import {AlertsService} from 'services/alerts.service';
// This throws "TS2307". We need to
// suppress this error because rte-text-components are not strictly typed yet.
// @ts-ignore
import {RichTextComponentsModule} from 'rich_text_components/rich-text-components.module';
import {RouterTestingModule} from '@angular/router/testing';

@Pipe({name: 'truncate'})
class MockTruncatePipe implements PipeTransform {
  transform(value: string, params: Object | undefined): string {
    return value;
  }
}

class MockWindowRef {
  nativeWindow = {
    location: {
      pathname: '/blog',
      href: '',
      toString() {
        return 'http://localhost/test_path';
      },
    },
    history: {
      pushState(data: object, title: string, url?: string | null) {},
    },
  };
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
  let loaderService: LoaderService;
  let urlInterpolationService: UrlInterpolationService;
  let blogHomePageBackendApiService: BlogHomePageBackendApiService;
  let blogHomePageDataObject: BlogHomePageData;
  let blogPostSummaryObject: BlogPostSummary;
  let component: BlogHomePageComponent;
  let fixture: ComponentFixture<BlogHomePageComponent>;

  let blogPostSummary: BlogPostSummaryBackendDict = {
    id: 'sampleBlogId',
    author_username: 'test_username',
    displayed_author_name: 'test_user',
    title: 'sample_title',
    summary: 'hello',
    thumbnail_filename: 'image',
    tags: ['learners', 'news'],
    url_fragment: 'sample#url',
    last_updated: '3232323',
    published_on: '1212121',
    profile_pic_url: 'sample_url',
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        FormsModule,
        NgbModule,
        ReactiveFormsModule,
        MaterialModule,
        RichTextComponentsModule,
        RouterTestingModule,
      ],
      declarations: [
        BlogHomePageComponent,
        BlogCardComponent,
        MockTranslatePipe,
        MockTruncatePipe,
      ],
      providers: [
        {
          provide: WindowRef,
          useClass: MockWindowRef,
        },
        {
          provide: WindowDimensionsService,
          useClass: MockWindowDimensionsService,
        },
        LoaderService,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BlogHomePageComponent);
    component = fixture.componentInstance;
    alertsService = TestBed.inject(AlertsService);
    blogHomePageBackendApiService = TestBed.inject(
      BlogHomePageBackendApiService
    );
    windowDimensionsService = TestBed.inject(WindowDimensionsService);
    urlService = TestBed.inject(UrlService);
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    loaderService = TestBed.inject(LoaderService);

    blogPostSummaryObject =
      BlogPostSummary.createFromBackendDict(blogPostSummary);

    spyOn(loaderService, 'showLoadingScreen');
    spyOn(loaderService, 'hideLoadingScreen');

    spyOn(urlService, 'getUrlParams').and.returnValue({});
  });

  it('should determine if small screen view is active', () => {
    const windowWidthSpy = spyOn(
      windowDimensionsService,
      'getWidth'
    ).and.returnValue(766);
    expect(component.isSmallScreenViewActive()).toBe(true);
    windowWidthSpy.and.returnValue(1028);
    expect(component.isSmallScreenViewActive()).toBe(false);
  });

  describe('when loading blog home page', () => {
    beforeEach(() => {
      (urlService.getUrlParams as jasmine.Spy).and.returnValue({});
      blogHomePageDataObject = {
        numOfPublishedBlogPosts: 0,
        blogPostSummaryDicts: [],
        listOfDefaultTags: ['learners', 'news'],
      };
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should initialize blog home page (not search page)', () => {
      spyOn(component, 'loadInitialBlogHomePageData');

      spyOn(
        urlInterpolationService,
        'getStaticCopyrightedImageUrl'
      ).and.returnValue('image_url');

      component.ngOnInit();

      expect(loaderService.showLoadingScreen).toHaveBeenCalled();
      expect(component.oppiaAvatarImgUrl).toBe('image_url');

      expect(component.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_HOMEPAGE).toBe(
        BlogHomePageConstants.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_HOMEPAGE
      );

      expect(component.loadInitialBlogHomePageData).toHaveBeenCalled();
    });

    it('should load blog home page data with no published blog post summary', fakeAsync(() => {
      spyOn(
        blogHomePageBackendApiService,
        'fetchBlogHomePageDataAsync'
      ).and.returnValue(Promise.resolve(blogHomePageDataObject));
      expect(component.noResultsFound).toBeUndefined();

      component.loadInitialBlogHomePageData();

      expect(
        blogHomePageBackendApiService.fetchBlogHomePageDataAsync
      ).toHaveBeenCalledWith('0');

      tick();
      expect(component.noResultsFound).toBe(true);

      expect(loaderService.hideLoadingScreen).toHaveBeenCalled();
    }));

    it('should load blog home page data with 1 published blog post summary', fakeAsync(() => {
      blogHomePageDataObject.numOfPublishedBlogPosts = 1;
      blogHomePageDataObject.blogPostSummaryDicts = [blogPostSummaryObject];
      spyOn(
        blogHomePageBackendApiService,
        'fetchBlogHomePageDataAsync'
      ).and.returnValue(Promise.resolve(blogHomePageDataObject));

      component.loadInitialBlogHomePageData();

      expect(
        blogHomePageBackendApiService.fetchBlogHomePageDataAsync
      ).toHaveBeenCalledWith('0');

      tick();
      expect(component.totalBlogPosts).toBe(1);
      expect(component.noResultsFound).toBe(false);
      expect(component.blogPostSummaries).toEqual([blogPostSummaryObject]);
      expect(component.blogPostSummariesToShow).toEqual([
        blogPostSummaryObject,
      ]);
      expect(component.lastPostOnPageNum).toBe(1);

      expect(loaderService.hideLoadingScreen).toHaveBeenCalled();
    }));

    it('should succesfully load multiple blog home pages data', fakeAsync(() => {
      component.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_HOMEPAGE = 1;
      blogHomePageDataObject.numOfPublishedBlogPosts = 3;

      const blogPostSummary2 = BlogPostSummary.createFromBackendDict({
        ...blogPostSummary,
        id: 'sampleBlogId2',
      });

      const blogPostSummary3 = BlogPostSummary.createFromBackendDict({
        ...blogPostSummary,
        id: 'sampleBlogId3',
      });

      blogHomePageDataObject.blogPostSummaryDicts = [
        blogPostSummaryObject,
        blogPostSummary2,
        blogPostSummary3,
      ];

      spyOn(alertsService, 'addWarning');
      spyOn(
        blogHomePageBackendApiService,
        'fetchBlogHomePageDataAsync'
      ).and.callFake((offset: string) => {
        const index = parseInt(offset);
        return Promise.resolve({
          numOfPublishedBlogPosts: 3,
          blogPostSummaryDicts: [
            blogHomePageDataObject.blogPostSummaryDicts[index],
          ],
          listOfDefaultTags: ['learners', 'news'],
        });
      });

      component.loadInitialBlogHomePageData();
      tick();
      component.selectBlogPostSummariesToShow();

      expect(component.blogPostSummariesToShow).toEqual([
        blogPostSummaryObject,
      ]);
      expect(component.totalBlogPosts).toBe(3);
      expect(component.lastPostOnPageNum).toBe(1);

      component.page = 2;
      component.loadMoreBlogPostSummaries(1);
      tick();
      component.selectBlogPostSummariesToShow();

      expect(component.blogPostSummariesToShow).toEqual([blogPostSummary2]);
      expect(component.lastPostOnPageNum).toBe(1);

      component.page = 3;
      component.loadMoreBlogPostSummaries(2);
      tick();
      component.selectBlogPostSummariesToShow();

      expect(component.blogPostSummariesToShow).toEqual([blogPostSummary3]);

      expect(alertsService.addWarning).not.toHaveBeenCalled();
    }));

    it('should load data for page on changing page', () => {
      (urlService.getUrlParams as jasmine.Spy).and.returnValue({});

      const constantsRef = BlogHomePageConstants as {
        MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_HOMEPAGE: number;
      };

      const originalPageSize =
        constantsRef.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_HOMEPAGE;

      constantsRef.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_HOMEPAGE = 2;

      spyOn(component, 'loadPage').and.callFake(() => {
        const page = component.page;

        if (page === 2) {
          component.blogPostSummaries = [
            blogPostSummaryObject,
            blogPostSummaryObject,
          ];
        } else if (page === 3) {
          component.blogPostSummaries = [blogPostSummaryObject];
        }

        component.showBlogPostCardsLoadingScreen = false;
        component.selectBlogPostSummariesToShow();
      });

      component.blogPostSummaries = [
        blogPostSummaryObject,
        blogPostSummaryObject,
      ];
      component.totalBlogPosts = 5;

      component.ngOnInit();

      (component.loadPage as jasmine.Spy).calls.reset();

      expect(component.firstPostOnPageNum).toBe(1);
      expect(component.lastPostOnPageNum).toBe(2);

      component.page = 2;
      component.onPageChange();

      expect(component.firstPostOnPageNum).toBe(3);
      expect(component.loadPage).toHaveBeenCalledTimes(1);
      expect(component.lastPostOnPageNum).toBe(4);

      component.page = 3;
      component.onPageChange();

      expect(component.firstPostOnPageNum).toBe(5);
      expect(component.loadPage).toHaveBeenCalledTimes(2);
      expect(component.lastPostOnPageNum).toBe(5);

      constantsRef.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_HOMEPAGE = originalPageSize;
    });

    it('should use reject handler if fetching blog home page data fails', fakeAsync(() => {
      spyOn(alertsService, 'addWarning');
      spyOn(
        blogHomePageBackendApiService,
        'fetchBlogHomePageDataAsync'
      ).and.returnValue(
        Promise.reject({
          error: {error: 'Backend error'},
          status: 500,
        })
      );

      component.loadInitialBlogHomePageData();

      expect(
        blogHomePageBackendApiService.fetchBlogHomePageDataAsync
      ).toHaveBeenCalledWith('0');

      tick();

      expect(alertsService.addWarning).toHaveBeenCalledWith(
        'Failed to get blog home page data.Error: Backend error'
      );
    }));

    it(
      'should use reject handler if fetching data for loading more published' +
        'blog post fails',
      fakeAsync(() => {
        spyOn(alertsService, 'addWarning');
        spyOn(
          blogHomePageBackendApiService,
          'fetchBlogHomePageDataAsync'
        ).and.returnValue(
          Promise.reject({
            error: {error: 'Backend error'},
            status: 500,
          })
        );

        component.firstPostOnPageNum = 2;
        component.blogPostSummaries = [];
        component.loadPage();

        expect(
          blogHomePageBackendApiService.fetchBlogHomePageDataAsync
        ).toHaveBeenCalledWith('1');

        tick();

        expect(alertsService.addWarning).toHaveBeenCalledWith(
          'Failed to get blog home page data.Error: Backend error'
        );
      })
    );
  });

  it('should get static asset image url', () => {
    spyOn(
      urlInterpolationService,
      'getStaticCopyrightedImageUrl'
    ).and.returnValue('image_url');

    expect(component.getStaticCopyrightedImageUrl('url')).toBe('image_url');
  });

  it('should unsubscribe directiveSubscriptions on destroy', () => {
    spyOn(component.directiveSubscriptions, 'unsubscribe');

    component.ngOnDestroy();

    expect(component.directiveSubscriptions.unsubscribe).toHaveBeenCalled();
  });

  it('should show warning if loadBlogPostsForPage fails', fakeAsync(() => {
    spyOn(alertsService, 'addWarning');
    spyOn(
      blogHomePageBackendApiService,
      'fetchBlogHomePageDataAsync'
    ).and.returnValue(
      Promise.reject({
        error: {error: 'Backend error'},
        status: 500,
      })
    );

    component.loadMoreBlogPostSummaries(0);
    tick();

    expect(alertsService.addWarning).toHaveBeenCalled();
  }));

  it('should not show warning if non-fatal error occurs while fetching homepage data', fakeAsync(() => {
    spyOn(alertsService, 'addWarning');

    spyOn(
      blogHomePageBackendApiService,
      'fetchBlogHomePageDataAsync'
    ).and.returnValue(
      Promise.reject({
        error: {error: 'Some error'},
        status: 0,
      })
    );

    component.loadInitialBlogHomePageData();
    tick();

    expect(alertsService.addWarning).not.toHaveBeenCalled();
  }));

  it('should calculate last post correctly when exceeding total posts', () => {
    component.totalBlogPosts = 3;

    component.calculateLastPostOnPageNum(2, 5);

    expect(component.lastPostOnPageNum).toBe(3);
  });
});
