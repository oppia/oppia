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

import {EventEmitter, Pipe} from '@angular/core';
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
  BlogPostSearchService,
  UrlSearchQuery,
} from 'services/blog-search.service';
import {
  BlogHomePageBackendApiService,
  BlogHomePageData,
  SearchResponseData,
} from 'domain/blog/blog-homepage-backend-api.service';
import {UrlService} from 'services/contextual/url.service';
import {Subject} from 'rxjs/internal/Subject';
import {BlogCardComponent} from 'pages/blog-dashboard-page/blog-card/blog-card.component';
import {TagFilterComponent} from './tag-filter/tag-filter.component';
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

@Pipe({name: 'truncate'})
class MockTruncatePipe {
  transform(value: string, params: Object | undefined): string {
    return value;
  }
}

class MockWindowRef {
  nativeWindow = {
    location: {
      pathname: 'blog/search/find',
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
  let searchService: BlogPostSearchService;
  let windowRef: MockWindowRef;
  let alertsService: AlertsService;
  let windowDimensionsService: WindowDimensionsService;
  let urlService: UrlService;
  let loaderService: LoaderService;
  let urlInterpolationService: UrlInterpolationService;
  let blogHomePageBackendApiService: BlogHomePageBackendApiService;
  let blogHomePageDataObject: BlogHomePageData;
  let blogPostSummaryObject: BlogPostSummary;
  let searchResponseData: SearchResponseData;
  let component: BlogHomePageComponent;
  let fixture: ComponentFixture<BlogHomePageComponent>;
  let mockOnInitialSearchResultsLoaded = new EventEmitter<SearchResponseData>();

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
      ],
      declarations: [
        BlogHomePageComponent,
        BlogCardComponent,
        TagFilterComponent,
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
    searchService = TestBed.inject(BlogPostSearchService);
    alertsService = TestBed.inject(AlertsService);
    blogHomePageBackendApiService = TestBed.inject(
      BlogHomePageBackendApiService
    );
    windowRef = TestBed.inject(WindowRef);
    windowDimensionsService = TestBed.inject(WindowDimensionsService);
    urlService = TestBed.inject(UrlService);
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    loaderService = TestBed.inject(LoaderService);
    blogPostSummaryObject =
      BlogPostSummary.createFromBackendDict(blogPostSummary);
    spyOn(loaderService, 'showLoadingScreen');
    spyOn(loaderService, 'hideLoadingScreen');
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

  it('should handle search query change with language param in URL with empty search query and tag list', () => {
    spyOn(component, 'loadInitialBlogHomePageData');
    spyOn(windowRef.nativeWindow.history, 'pushState');
    windowRef.nativeWindow.location = new URL(
      'http://localhost/blog/search/find?lang=en'
    );

    component.onSearchQueryChangeExec();

    expect(loaderService.showLoadingScreen).toHaveBeenCalled();
    expect(component.loadInitialBlogHomePageData).toHaveBeenCalled();

    windowRef.nativeWindow.location = new URL(
      'http://localhost/blog/not/search/find?lang=en'
    );
    expect(windowRef.nativeWindow.history.pushState).toHaveBeenCalled();
    component.onSearchQueryChangeExec();
    component.searchQuery = '';
    component.selectedTags = [];

    expect(loaderService.showLoadingScreen).toHaveBeenCalled();
    expect(component.loadInitialBlogHomePageData).toHaveBeenCalled();
    expect(windowRef.nativeWindow.history.pushState).toHaveBeenCalledWith(
      {},
      '',
      '/blog'
    );
  });

  it('should handle search query change with language param in URL with non empty search query', () => {
    component.searchQuery = 'search_query';
    component.selectedTags = [];
    spyOn(searchService, 'executeSearchQuery').and.callFake(
      (searchQuery: string, tags: object, callb: () => void) => {
        callb();
      }
    );
    spyOn(searchService, 'getSearchUrlQueryString').and.returnValue(
      'search_query'
    );
    spyOn(windowRef.nativeWindow.history, 'pushState');
    windowRef.nativeWindow.location = new URL(
      'http://localhost/blog/search/find?lang=en'
    );

    component.onSearchQueryChangeExec();
    expect(loaderService.showLoadingScreen).toHaveBeenCalled();
    expect(windowRef.nativeWindow.history.pushState).toHaveBeenCalled();
    windowRef.nativeWindow.location = new URL(
      'http://localhost/blog/not/search/find?lang=en'
    );
    component.onSearchQueryChangeExec();
    expect(windowRef.nativeWindow.location.href).toEqual(
      'http://localhost/blog/search/find?q=search_query&lang=en'
    );
  });

  it('should handle search query change without language param in URL with empty search query and tag list', () => {
    spyOn(component, 'loadInitialBlogHomePageData');
    spyOn(windowRef.nativeWindow.history, 'pushState');
    windowRef.nativeWindow.location = new URL(
      'http://localhost/blog/search/find'
    );

    component.onSearchQueryChangeExec();

    expect(loaderService.showLoadingScreen).toHaveBeenCalled();
    expect(component.loadInitialBlogHomePageData).toHaveBeenCalled();

    windowRef.nativeWindow.location = new URL(
      'http://localhost/blog/not/search/find'
    );
    expect(windowRef.nativeWindow.history.pushState).toHaveBeenCalled();
    component.onSearchQueryChangeExec();
    component.searchQuery = '';
    component.selectedTags = [];

    expect(loaderService.showLoadingScreen).toHaveBeenCalled();
    expect(component.loadInitialBlogHomePageData).toHaveBeenCalled();
    expect(windowRef.nativeWindow.history.pushState).toHaveBeenCalledWith(
      {},
      '',
      '/blog'
    );
  });

  it('should handle search query change without language param in URL with non empty search query', () => {
    spyOn(searchService, 'executeSearchQuery').and.callFake(
      (searchQuery: string, tags: object, callb: () => void) => {
        callb();
      }
    );
    spyOn(searchService, 'getSearchUrlQueryString').and.returnValue(
      'search_query'
    );
    spyOn(windowRef.nativeWindow.history, 'pushState');
    windowRef.nativeWindow.location = new URL(
      'http://localhost/blog/search/find'
    );

    component.onSearchQueryChangeExec();
    component.searchQuery = 'search_query';
    component.selectedTags = [];
    expect(loaderService.showLoadingScreen).toHaveBeenCalled();
    expect(windowRef.nativeWindow.history.pushState).toHaveBeenCalled();
    windowRef.nativeWindow.location = new URL(
      'http://localhost/blog/not/search/find'
    );

    component.onSearchQueryChangeExec();

    expect(windowRef.nativeWindow.location.href).toEqual(
      'http://localhost/blog/search/find?q=search_query'
    );
  });

  it(
    'should display alert when fetching search results fail during search' +
      'query execution',
    () => {
      component.searchQuery = 'search_query';
      component.selectedTags = ['tag1', 'tag2'];
      spyOn(searchService, 'executeSearchQuery').and.callFake(
        (
          searchQuery: string,
          tags: object,
          callb: () => void,
          errorCallb: (reason: string) => void
        ) => {
          errorCallb('Internal Server Error');
        }
      );
      spyOn(alertsService, 'addWarning');

      component.onSearchQueryChangeExec();

      expect(loaderService.showLoadingScreen).toHaveBeenCalled();
      expect(alertsService.addWarning).toHaveBeenCalledWith(
        'Unable to fetch search results. Error: Internal Server Error'
      );
    }
  );

  it('should update search fields based on url query for new query', () => {
    let searchQuery: UrlSearchQuery = {
      searchQuery: 'search_query',
      selectedTags: ['tag1', 'tag2'],
    };
    spyOn(searchService, 'updateSearchFieldsBasedOnUrlQuery').and.returnValue(
      searchQuery
    );
    spyOn(component, 'onSearchQueryChangeExec');
    expect(component.searchQuery).toEqual('');
    expect(component.selectedTags).toEqual([]);

    component.updateSearchFieldsBasedOnUrlQuery();

    expect(component.onSearchQueryChangeExec).toHaveBeenCalled();
    expect(component.selectedTags.sort()).toEqual(['tag1', 'tag2']);
    expect(component.searchQuery).toBe('search_query');
  });

  it('should not update search fields based on url for same query', () => {
    spyOn(component, 'onSearchQueryChangeExec');

    let searchQuery: UrlSearchQuery = {
      searchQuery: 'search_query',
      selectedTags: ['tag1', 'tag2'],
    };
    spyOn(searchService, 'updateSearchFieldsBasedOnUrlQuery').and.returnValues(
      searchQuery,
      searchQuery
    );
    expect(component.searchQuery).toEqual('');
    expect(component.selectedTags).toEqual([]);

    component.updateSearchFieldsBasedOnUrlQuery();
    component.updateSearchFieldsBasedOnUrlQuery();

    // Function onSearchQueryChangeExec should only be called once.
    expect(component.onSearchQueryChangeExec).toHaveBeenCalledTimes(1);
    expect(component.selectedTags.sort()).toEqual(['tag1', 'tag2']);
    expect(component.searchQuery).toBe('search_query');
  });

  it('should execute search when search query changes', () => {
    spyOn(component, 'onSearchQueryChangeExec');
    spyOn(component, 'loadInitialBlogHomePageData');
    spyOn(component, 'updateSearchFieldsBasedOnUrlQuery');
    spyOn(urlService, 'getUrlParams').and.returnValue({});

    component.searchQueryChanged = {
      pipe: (param1: string, parm2: string) => {
        return {
          subscribe(callb: () => void) {
            callb();
          },
        };
      },
    } as Subject<string>;
    component.ngOnInit();

    expect(component.onSearchQueryChangeExec).toHaveBeenCalled();
    expect(component.loadInitialBlogHomePageData).toHaveBeenCalled();
    expect(component.searchPageIsActive).toBeFalse();
    expect(component.updateSearchFieldsBasedOnUrlQuery).not.toHaveBeenCalled();
  });

  describe('when loading search results page', () => {
    beforeEach(() => {
      spyOn(urlService, 'getUrlParams').and.returnValue({q: 'search_query'});
      spyOn(
        urlInterpolationService,
        'getStaticCopyrightedImageUrl'
      ).and.returnValue('image_url');
      spyOnProperty(
        searchService,
        'onInitialSearchResultsLoaded'
      ).and.returnValue(mockOnInitialSearchResultsLoaded);
      spyOn(component, 'onSearchQueryChangeExec');
      spyOn(component, 'updateSearchFieldsBasedOnUrlQuery');
      searchResponseData = {
        searchOffset: null,
        blogPostSummariesList: [],
        listOfDefaultTags: ['learners', 'news'],
      };
    });

    it('should initialize', () => {
      spyOn(component, 'loadInitialBlogHomePageData');
      spyOn(searchService.onSearchBarLoaded, 'emit');
      spyOn(searchService.onInitialSearchResultsLoaded, 'subscribe');

      component.ngOnInit();

      expect(loaderService.showLoadingScreen).toHaveBeenCalled();
      expect(component.oppiaAvatarImgUrl).toBe('image_url');
      expect(component.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_HOMEPAGE).toBe(
        BlogHomePageConstants.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_HOMEPAGE
      );
      expect(component.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_HOMEPAGE_SEARCH).toBe(
        BlogHomePageConstants.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_SEARCH_RESULTS_PAGE
      );
      expect(component.loadInitialBlogHomePageData).not.toHaveBeenCalled();
      expect(component.onSearchQueryChangeExec).not.toHaveBeenCalled();
      expect(component.searchPageIsActive).toBeTrue();
      expect(component.updateSearchFieldsBasedOnUrlQuery).toHaveBeenCalled();
      expect(searchService.onSearchBarLoaded.emit).toHaveBeenCalled();
      expect(
        searchService.onInitialSearchResultsLoaded.subscribe
      ).toHaveBeenCalled();
      expect(urlService.getUrlParams).toHaveBeenCalled();
    });

    it(
      'should load data after initial search is performed' +
        ' with no matching results',
      fakeAsync(() => {
        spyOn(component, 'loadSearchResultsPageData');
        component.ngOnInit();

        expect(component.searchPageIsActive).toBeTrue();
        expect(component.updateSearchFieldsBasedOnUrlQuery).toHaveBeenCalled();
        expect(component.noResultsFound).toBeUndefined();

        mockOnInitialSearchResultsLoaded.emit(searchResponseData);
        tick();

        expect(component.noResultsFound).toBeTrue();
        expect(component.loadSearchResultsPageData).not.toHaveBeenCalled();
        expect(component.searchPageIsActive).toBeTrue();
      })
    );

    it(
      'should load data after initial search is performed' +
        ' with one matching result and no offset',
      fakeAsync(() => {
        searchResponseData.blogPostSummariesList = [blogPostSummaryObject];

        component.ngOnInit();

        expect(loaderService.showLoadingScreen).toHaveBeenCalled();
        expect(component.searchPageIsActive).toBeTrue();
        expect(component.updateSearchFieldsBasedOnUrlQuery).toHaveBeenCalled();
        expect(component.noResultsFound).toBeUndefined();
        expect(component.blogPostSummaries.length).toBe(0);

        mockOnInitialSearchResultsLoaded.emit(searchResponseData);
        tick();

        expect(component.noResultsFound).toBeFalse();
        expect(component.searchPageIsActive).toBeTrue();
        expect(component.blogPostSummaries).toEqual([blogPostSummaryObject]);
        expect(component.searchOffset).toEqual(null);
        expect(component.totalBlogPosts).toBe(1);
        expect(component.lastPostOnPageNum).toBe(1);
        expect(component.blogPostSummariesToShow).toEqual([
          blogPostSummaryObject,
        ]);
        expect(loaderService.hideLoadingScreen).toHaveBeenCalled();
      })
    );

    it(
      'should load data after initial search is performed' +
        ' with one matching result and with search offset',
      fakeAsync(() => {
        searchResponseData.blogPostSummariesList = [blogPostSummaryObject];
        searchResponseData.searchOffset = 1;
        component.ngOnInit();

        expect(loaderService.showLoadingScreen).toHaveBeenCalled();
        expect(component.updateSearchFieldsBasedOnUrlQuery).toHaveBeenCalled();
        expect(component.noResultsFound).toBeUndefined();
        expect(component.blogPostSummaries.length).toBe(0);

        mockOnInitialSearchResultsLoaded.emit(searchResponseData);
        tick();

        expect(component.noResultsFound).toBeFalse();
        expect(component.listOfDefaultTags).toEqual(
          searchResponseData.listOfDefaultTags
        );
        expect(component.blogPostSummaries).toEqual([blogPostSummaryObject]);
        expect(component.searchOffset).toEqual(1);
        // As search offset is not null, there are more search result pages to
        // load. Therefore for pagination to show that more results are available,
        // total number of blog post is one more than the number of blog posts
        // loaded as number of pages is automatically calculated using total
        // collection size and number of blog posts to show on a page.
        expect(component.totalBlogPosts).toBe(2);
        expect(component.blogPostSummariesToShow).toEqual([
          blogPostSummaryObject,
        ]);
        expect(loaderService.hideLoadingScreen).toHaveBeenCalled();
      })
    );

    it('should succesfully load multiple search results pages data', fakeAsync(() => {
      searchResponseData.searchOffset = 1;
      searchResponseData.blogPostSummariesList = [
        blogPostSummaryObject,
        blogPostSummaryObject,
      ];
      spyOn(alertsService, 'addWarning');
      spyOn(searchService, 'loadMoreData').and.callFake(
        (callb: (SearchResponseData: SearchResponseData) => void) => {
          callb(searchResponseData);
        }
      );
      component.ngOnInit();
      component.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_HOMEPAGE_SEARCH = 2;

      // Loading page 1.
      mockOnInitialSearchResultsLoaded.emit(searchResponseData);
      tick();

      expect(component.blogPostSummaries.length).toBe(2);
      expect(component.searchOffset).toEqual(1);
      expect(component.blogPostSummariesToShow).toEqual([
        blogPostSummaryObject,
        blogPostSummaryObject,
      ]);
      expect(component.blogPostSummariesToShow.length).toBe(2);
      expect(component.lastPostOnPageNum).toBe(2);

      // Changing to page 2.
      component.page = 2;
      component.onPageChange();
      tick();

      expect(component.firstPostOnPageNum).toBe(3);
      expect(component.blogPostSummaries.length).toBe(4);
      expect(component.blogPostSummariesToShow.length).toBe(2);
      expect(component.lastPostOnPageNum).toBe(4);

      // Changing back to page 1.
      component.page = 1;
      component.onPageChange();

      expect(component.firstPostOnPageNum).toBe(1);
      expect(component.blogPostSummaries.length).toBe(4);
      expect(component.blogPostSummariesToShow.length).toBe(2);
      expect(component.lastPostOnPageNum).toBe(2);

      expect(alertsService.addWarning).not.toHaveBeenCalled();
    }));

    it(
      'should raise warning for trying to load more search after end of' +
        ' search results has been reached.',
      () => {
        component.ngOnInit();
        component.blogPostSummaries = [blogPostSummaryObject];
        component.firstPostOnPageNum = 3;
        spyOn(alertsService, 'addWarning');
        spyOn(searchService, 'loadMoreData').and.callFake(
          (
            callb: (SearchResponseData: SearchResponseData) => void,
            failCallb: (arg0: boolean) => void
          ) => {
            failCallb(true);
          }
        );

        component.loadPage();

        expect(alertsService.addWarning).toHaveBeenCalledWith(
          'No more search resutls found. End of search results.'
        );
      }
    );
  });

  it('should execute search query when search query changes', () => {
    spyOn(urlService, 'getUrlParams').and.returnValue({});
    spyOn(component, 'onSearchQueryChangeExec');

    component.searchQueryChanged = {
      pipe: (param1: string, parm2: string) => {
        return {
          subscribe(callb: () => void) {
            callb();
          },
        };
      },
    } as Subject<string>;
    component.ngOnInit();

    expect(component.onSearchQueryChangeExec).toHaveBeenCalled();
  });

  describe('when loading blog home page', () => {
    beforeEach(() => {
      spyOn(component, 'onSearchQueryChangeExec');
      spyOn(component, 'updateSearchFieldsBasedOnUrlQuery');
      spyOn(urlService, 'getUrlParams').and.returnValue({});
      blogHomePageDataObject = {
        numOfPublishedBlogPosts: 0,
        blogPostSummaryDicts: [],
        listOfDefaultTags: ['learners', 'news'],
      };
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should initialize', () => {
      spyOn(component, 'loadInitialBlogHomePageData');
      spyOn(searchService.onSearchBarLoaded, 'emit');
      spyOn(
        urlInterpolationService,
        'getStaticCopyrightedImageUrl'
      ).and.returnValue('image_url');
      spyOn(searchService, 'onInitialSearchResultsLoaded').and.returnValue(
        mockOnInitialSearchResultsLoaded
      );
      spyOn(searchService.onInitialSearchResultsLoaded, 'subscribe');

      component.ngOnInit();

      expect(loaderService.showLoadingScreen).toHaveBeenCalled();
      expect(component.oppiaAvatarImgUrl).toBe('image_url');
      expect(component.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_HOMEPAGE).toBe(
        BlogHomePageConstants.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_HOMEPAGE
      );
      expect(component.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_HOMEPAGE_SEARCH).toBe(
        BlogHomePageConstants.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_SEARCH_RESULTS_PAGE
      );
      expect(component.loadInitialBlogHomePageData).toHaveBeenCalled();
      expect(
        component.updateSearchFieldsBasedOnUrlQuery
      ).not.toHaveBeenCalled();
      expect(searchService.onSearchBarLoaded.emit).toHaveBeenCalled();
      expect(
        searchService.onInitialSearchResultsLoaded.subscribe
      ).toHaveBeenCalled();
      expect(urlService.getUrlParams).toHaveBeenCalled();
      expect(component.onSearchQueryChangeExec).not.toHaveBeenCalled();
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
      expect(component.noResultsFound).toBeTrue();

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
      expect(component.noResultsFound).toBeFalse();
      expect(component.blogPostSummaries).toEqual([blogPostSummaryObject]);
      expect(component.blogPostSummariesToShow).toEqual([
        blogPostSummaryObject,
      ]);
      expect(component.lastPostOnPageNum).toBe(1);

      expect(component.listOfDefaultTags).toEqual(
        blogHomePageDataObject.listOfDefaultTags
      );
      expect(loaderService.hideLoadingScreen).toHaveBeenCalled();
    }));

    it('should search', () => {
      component.searchButtonIsActive = true;
      const search = {
        target: {
          value: 'search',
        },
      };
      component.searchToBeExec(search);

      spyOn(component.searchQueryChanged, 'next');
      component.searchButtonIsActive = false;
      component.searchToBeExec(search);
      expect(component.searchQueryChanged.next).toHaveBeenCalled();
    });

    it('should succesfully load multiple blog home pages data', fakeAsync(() => {
      component.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_HOMEPAGE = 1;
      blogHomePageDataObject.numOfPublishedBlogPosts = 3;
      blogHomePageDataObject.blogPostSummaryDicts = [blogPostSummaryObject];
      spyOn(alertsService, 'addWarning');
      spyOn(
        blogHomePageBackendApiService,
        'fetchBlogHomePageDataAsync'
      ).and.returnValue(Promise.resolve(blogHomePageDataObject));

      component.loadInitialBlogHomePageData();
      tick();

      expect(component.totalBlogPosts).toBe(3);
      expect(component.noResultsFound).toBeFalse();
      expect(component.blogPostSummaries).toEqual([blogPostSummaryObject]);
      expect(component.blogPostSummariesToShow).toEqual([
        blogPostSummaryObject,
      ]);
      expect(component.lastPostOnPageNum).toBe(1);

      component.page = 2;
      component.loadMoreBlogPostSummaries(1);
      tick();

      expect(
        blogHomePageBackendApiService.fetchBlogHomePageDataAsync
      ).toHaveBeenCalledWith('1');
      expect(component.totalBlogPosts).toBe(3);
      expect(component.blogPostSummaries).toEqual([
        blogPostSummaryObject,
        blogPostSummaryObject,
      ]);
      expect(component.blogPostSummariesToShow).toEqual([
        blogPostSummaryObject,
      ]);
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
      component.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_HOMEPAGE = 2;

      expect(component.page).toBe(1);
      expect(component.firstPostOnPageNum).toBe(1);
      expect(component.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_HOMEPAGE).toBe(2);
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

        component.loadMoreBlogPostSummaries(1);

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

  it('should tell searching status', () => {
    spyOn(searchService, 'isSearchInProgress').and.returnValue(false);
    expect(component.isSearchInProgress()).toBeFalse();
  });

  it('should get static asset image url', () => {
    spyOn(
      urlInterpolationService,
      'getStaticCopyrightedImageUrl'
    ).and.returnValue('image_url');

    expect(component.getStaticCopyrightedImageUrl('url')).toBe('image_url');
  });
});
