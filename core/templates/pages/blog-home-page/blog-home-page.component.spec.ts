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
import {RouterTestingModule} from '@angular/router/testing';
import {Router, ActivatedRoute} from '@angular/router';

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
  let router: Router;
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
        RouterTestingModule,
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
    router = TestBed.inject(Router);
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

  it('should set filterWasUsed and activate search page when query params exist', () => {
    const params = {
      q: 'search query',
      tags: 'Community',
    };

    spyOn(component, 'loadPage');

    spyOn(
      (component as unknown as {route: ActivatedRoute}).route.queryParams,
      'subscribe'
    ).and.callFake((fn: (params: {q: string; tags: string}) => void) => {
      fn(params);
    });

    component.ngOnInit();

    expect(component.filterWasUsed).toBeTrue();
    expect(component.searchPageIsActive).toBeTrue();
    expect(component.searchQuery).toBe('search query');
    expect(component.selectedTags).toEqual(['Community']);
    expect(component.loadPage).toHaveBeenCalled();
  });

  it('should reset all component state when filterWasUsed is set true and loadInitialHomePageData is called', () => {
    component.filterWasUsed = true;
    component.page = 3;
    component.firstPostOnPageNum = 21;
    component.blogPostSummaries = [
      {
        _id: '1',
        _authorUsername: 'user1',
        _displayedAuthorName: 'User One',
        _title: 'Test Post Title',
        _summary: 'A short summary.',
        _tags: ['test', 'dev'],
        _thumbnailFilename: 'thumb1.svg',
        _urlFragment: 'test-post',
      },
    ] as BlogPostSummary[];
    component.totalBlogPosts = 50;
    component.showBlogPostCardsLoadingScreen = true;

    const resetSearchStateSpy = spyOn(searchService, 'resetSearchState');

    component.loadInitialBlogHomePageData();

    expect(resetSearchStateSpy).toHaveBeenCalled();
    expect(component.page).toBe(1);
    expect(component.firstPostOnPageNum).toBe(1);
    expect(component.blogPostSummaries).toEqual([]);
    expect(component.filterWasUsed).toBe(false);
    expect(component.totalBlogPosts).toBe(0);
    expect(component.showBlogPostCardsLoadingScreen).toBe(false);
  });
  it('should handle search query change with language param in URL with empty search query and tag list', () => {
    spyOn(component, 'loadInitialBlogHomePageData');

    windowRef.nativeWindow.location = new URL(
      'http://localhost/blog/not/search/find?query=&page=1'
    );

    component.searchQuery = '';
    component.selectedTags = [];

    component.onSearchQueryChangeExec();

    expect(loaderService.showLoadingScreen).toHaveBeenCalled();
    expect(windowRef.nativeWindow.location.href).toContain(
      '/blog/not/search/find'
    );
    expect(windowRef.nativeWindow.location.href).toContain('page=1');
  });

  it('should handle search query change with language param in URL with non empty search query', () => {
    spyOn(component, 'loadInitialBlogHomePageData').and.callFake(() => {});
    spyOn(searchService, 'executeSearchQuery').and.callFake(
      (query: string, tags: string[], successCallback: () => void): void => {
        successCallback();
      }
    );

    const routerNavigateSpy = spyOn(router, 'navigate');

    windowRef.nativeWindow.location = new URL(
      'http://localhost/blog/search/find?q=&page=1'
    );

    component.searchQuery = 'search_query';
    component.selectedTags = [];

    component.onSearchQueryChangeExec();

    expect(loaderService.showLoadingScreen).toHaveBeenCalled();

    expect(component.loadInitialBlogHomePageData).not.toHaveBeenCalled();

    expect(routerNavigateSpy).toHaveBeenCalledWith(
      ['/blog/search/find'],
      jasmine.objectContaining({
        queryParams: jasmine.objectContaining({
          q: 'search_query',
          page: '1',
        }),
      })
    );
  });

  it('should handle search query change without language param in URL with empty search query and tag list', () => {
    spyOn(component, 'loadInitialBlogHomePageData');

    windowRef.nativeWindow.location = new URL(
      'http://localhost/blog/search/find?query=&page=1'
    );

    component.searchQuery = '';
    component.selectedTags = [];

    component.onSearchQueryChangeExec();

    expect(loaderService.showLoadingScreen).toHaveBeenCalled();
    expect(windowRef.nativeWindow.location.href).toContain('/blog/search/find');
    expect(windowRef.nativeWindow.location.href).toContain('page=1');
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

    const routerSpy = spyOn(router, 'navigate');

    windowRef.nativeWindow.location = new URL(
      'http://localhost/blog/search/find'
    ) as unknown as Location;

    component.searchQuery = 'search_query';
    component.selectedTags = [];

    component.onSearchQueryChangeExec();

    expect(loaderService.showLoadingScreen).toHaveBeenCalled();

    expect(routerSpy).toHaveBeenCalledWith(['/blog/search/find'], {
      queryParams: {
        q: 'search_query',
        tags: '',
        page: '1',
      },
    });
  });

  it('should show warning when only free text is entered in tag filter', () => {
    spyOn(searchService, 'executeSearchQuery');
    spyOn(alertsService, 'addWarning');
    const routerSpy = spyOn(router, 'navigate');

    component.searchQuery = '';
    component.selectedTags = [];
    component.pendingTagFilterInput = 'Community';

    component.onSearchQueryChangeExec();

    expect(loaderService.showLoadingScreen).toHaveBeenCalled();
    expect(loaderService.hideLoadingScreen).toHaveBeenCalled();
    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'Please select a tag from the suggestions before searching by tags.'
    );
    expect(searchService.executeSearchQuery).not.toHaveBeenCalled();
    expect(routerSpy).not.toHaveBeenCalled();
  });

  it('should search by keyword even when tag filter has pending free text', () => {
    spyOn(searchService, 'executeSearchQuery').and.callFake(
      (_query: string, _tags: string[], successCallback: () => void): void => {
        successCallback();
      }
    );
    const routerSpy = spyOn(router, 'navigate');

    component.searchQuery = 'Education';
    component.selectedTags = [];
    component.pendingTagFilterInput = 'Community';

    component.onSearchQueryChangeExec();

    expect(searchService.executeSearchQuery).toHaveBeenCalledWith(
      'Education',
      [],
      jasmine.any(Function),
      jasmine.any(Function)
    );
    expect(routerSpy).toHaveBeenCalled();
  });

  it('should correctly format selectedTags into OR query string', () => {
    component.searchQuery = 'test';
    component.selectedTags = ['news', 'learners'];

    spyOn(searchService, 'executeSearchQuery').and.callFake(
      (_q, _t, successCallback) => {
        successCallback();
      }
    );

    const navigateSpy = spyOn(router, 'navigate');

    component.onSearchQueryChangeExec();

    expect(navigateSpy).toHaveBeenCalledWith(
      ['/blog/search/find'],
      jasmine.objectContaining({
        queryParams: jasmine.objectContaining({
          tags: '("news" OR "learners")',
        }),
      })
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

    const searchQuery: UrlSearchQuery = {
      searchQuery: 'search_query',
      selectedTags: ['tag1', 'tag2'],
    };

    spyOn(searchService, 'updateSearchFieldsBasedOnUrlQuery').and.returnValue(
      searchQuery
    );

    expect(component.searchQuery).toEqual('');
    expect(component.selectedTags).toEqual([]);

    component.updateSearchFieldsBasedOnUrlQuery();
    component.updateSearchFieldsBasedOnUrlQuery();

    expect(component.onSearchQueryChangeExec).toHaveBeenCalledTimes(2);

    expect(component.selectedTags.sort()).toEqual(['tag1', 'tag2']);
    expect(component.searchQuery).toBe('search_query');
  });

  it('should call loadPage when loadPageAfterUpdate is true', () => {
    const searchQuery = {
      searchQuery: 'test',
      selectedTags: ['news'],
    };

    spyOn(searchService, 'updateSearchFieldsBasedOnUrlQuery').and.returnValue(
      searchQuery
    );

    const loadPageSpy = spyOn(component, 'loadPage');

    component.updateSearchFieldsBasedOnUrlQuery(true);

    expect(component.searchQuery).toBe('test');
    expect(component.selectedTags).toEqual(['news']);
    expect(loadPageSpy).toHaveBeenCalled();
  });

  it('should execute search when search query changes', () => {
    spyOn(component, 'onSearchQueryChangeExec');
    spyOn(component, 'loadInitialBlogHomePageData');
    spyOn(component, 'updateSearchFieldsBasedOnUrlQuery');
    (urlService.getUrlParams as jasmine.Spy).and.returnValue({});

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
    expect(component.searchPageIsActive).toBe(false);
    expect(component.updateSearchFieldsBasedOnUrlQuery).not.toHaveBeenCalled();
  });

  describe('when loading search results page', () => {
    beforeEach(() => {
      (urlService.getUrlParams as jasmine.Spy).and.returnValue({
        q: 'search_query',
      });
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
        totalMatchingBlogPosts: 0,
      };
    });

    it('should initialize search page', () => {
      if (!(urlService.getUrlParams as jasmine.Spy)) {
        spyOn(urlService, 'getUrlParams');
      }
      (urlService.getUrlParams as jasmine.Spy).and.returnValue({
        q: 'search_query',
      });

      spyOn(component, 'loadInitialBlogHomePageData');
      spyOn(searchService.onSearchBarLoaded, 'emit');
      spyOn(searchService.onInitialSearchResultsLoaded, 'subscribe');

      component.ngOnInit();

      expect(loaderService.showLoadingScreen).toHaveBeenCalled();

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
    });

    it('should load data after initial search is performed with no matching results', fakeAsync(() => {
      spyOn(component, 'loadSearchResultsPageData');

      component.searchPageIsActive = true;

      component.ngOnInit();

      expect(component.searchPageIsActive).toBe(true);
      expect(component.noResultsFound).toBeUndefined();

      mockOnInitialSearchResultsLoaded.emit(searchResponseData);
      tick();

      expect(component.noResultsFound).toBe(true);
      expect(component.loadSearchResultsPageData).not.toHaveBeenCalled();
      expect(component.searchPageIsActive).toBe(true);
    }));

    it('should load data after initial search is performed with one matching result and no offset', fakeAsync(() => {
      searchResponseData.blogPostSummariesList = [blogPostSummaryObject];
      searchResponseData.totalMatchingBlogPosts = 1;
      searchResponseData.searchOffset = null;

      component.searchPageIsActive = true;

      component.ngOnInit();

      expect(loaderService.showLoadingScreen).toHaveBeenCalled();
      expect(component.noResultsFound).toBeUndefined();
      expect(component.blogPostSummaries.length).toBe(0);

      mockOnInitialSearchResultsLoaded.emit(searchResponseData);
      tick();

      expect(component.noResultsFound).toBe(false);
      expect(component.blogPostSummaries).toEqual([blogPostSummaryObject]);
      expect(component.searchOffset).toEqual(null);
      expect(component.totalBlogPosts).toBe(1);
      expect(component.lastPostOnPageNum).toBe(1);
      expect(component.blogPostSummariesToShow).toEqual([
        blogPostSummaryObject,
      ]);
      expect(loaderService.hideLoadingScreen).toHaveBeenCalled();
    }));

    it('should load data after initial search is performed with one matching result and with search offset', fakeAsync(() => {
      searchResponseData.blogPostSummariesList = [blogPostSummaryObject];
      searchResponseData.searchOffset = 1;
      searchResponseData.totalMatchingBlogPosts = 2;

      component.ngOnInit();

      expect(loaderService.showLoadingScreen).toHaveBeenCalled();
      expect(component.blogPostSummaries).toEqual([]);
      expect(component.noResultsFound).toBeUndefined();

      mockOnInitialSearchResultsLoaded.emit(searchResponseData);
      tick();

      expect(component.noResultsFound).toBe(false);
      expect(component.listOfDefaultTags).toEqual(
        searchResponseData.listOfDefaultTags
      );
      expect(component.blogPostSummaries).toEqual([blogPostSummaryObject]);
      expect(component.blogPostSummariesToShow).toEqual([
        blogPostSummaryObject,
      ]);
      expect(component.searchOffset).toEqual(1);
      expect(component.totalBlogPosts).toBe(2);
      expect(loaderService.hideLoadingScreen).toHaveBeenCalled();
    }));

    it('should successfully load multiple search results pages data', fakeAsync(() => {
      const constantsRef = BlogHomePageConstants as {
        MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_SEARCH_RESULTS_PAGE: number;
      };

      const originalPageSize =
        constantsRef.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_SEARCH_RESULTS_PAGE;

      constantsRef.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_SEARCH_RESULTS_PAGE = 2;

      searchResponseData.searchOffset = 1;
      searchResponseData.totalMatchingBlogPosts = 4;
      searchResponseData.blogPostSummariesList = [
        blogPostSummaryObject,
        blogPostSummaryObject,
      ];

      spyOn(alertsService, 'addWarning');
      spyOn(searchService, 'loadMoreData').and.callFake(
        (callback: (response: SearchResponseData) => void) => {
          callback(searchResponseData);
        }
      );

      component.searchPageIsActive = true;
      component.ngOnInit();

      mockOnInitialSearchResultsLoaded.emit(searchResponseData);
      tick();

      component.page = 2;
      component.onPageChange();
      tick();

      component.page = 1;
      component.onPageChange();
      tick();

      expect(alertsService.addWarning).not.toHaveBeenCalled();

      constantsRef.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_SEARCH_RESULTS_PAGE =
        originalPageSize;
    }));

    it('should raise warning for trying to load more search after end of search results has been reached.', fakeAsync(() => {
      component.searchPageIsActive = true;
      component.searchQuery = 'search_query';
      component.selectedTags = [];
      component.page = 2;

      spyOn(alertsService, 'addWarning');

      spyOn(
        blogHomePageBackendApiService,
        'fetchBlogPostSearchResultAsync'
      ).and.returnValue(Promise.reject('error'));

      component.loadPage();
      tick();

      expect(alertsService.addWarning).toHaveBeenCalledWith(
        'No more search resutls found. End of search results.'
      );
    }));
  });

  it('should execute search query when search query changes', () => {
    (urlService.getUrlParams as jasmine.Spy).and.returnValue({});
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
      component.searchPageIsActive = false;

      spyOn(component, 'loadInitialBlogHomePageData');
      spyOn(searchService.onSearchBarLoaded, 'emit');
      spyOn(searchService.onInitialSearchResultsLoaded, 'subscribe');

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

  it('should tell searching status', () => {
    expect(component.isSearchInProgress()).toBe(false);
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

  it('should redirect when pathname does not match search path', () => {
    spyOnProperty(router, 'url', 'get').and.returnValue('/different-path');

    const navigateSpy = spyOn(router, 'navigateByUrl');

    component.searchQuery = 'test';
    component.selectedTags = [];

    component.onSearchQueryChangeExec();

    expect(navigateSpy).toHaveBeenCalled();
    expect(navigateSpy.calls.mostRecent().args[0]).toMatch('/blog/search/find');
    expect(loaderService.showLoadingScreen).toHaveBeenCalled();
  });

  it('should call onSearchQueryChangeExec even if search fields are unchanged', () => {
    const sameTags: string[] = [];

    const sameQuery = {
      searchQuery: '',
      selectedTags: sameTags,
    };

    component.searchQuery = '';
    component.selectedTags = sameTags;

    spyOn(searchService, 'updateSearchFieldsBasedOnUrlQuery').and.returnValue(
      sameQuery
    );

    spyOn(component, 'onSearchQueryChangeExec');

    component.updateSearchFieldsBasedOnUrlQuery();

    expect(component.onSearchQueryChangeExec).toHaveBeenCalled();
  });

  it('should not emit search query if search button is active', () => {
    component.searchButtonIsActive = true;
    spyOn(component.searchQueryChanged, 'next');

    component.searchToBeExec({
      target: {value: 'test'},
    });

    expect(component.searchQueryChanged.next).not.toHaveBeenCalled();
  });

  it('should preserve current page if search query is unchanged', () => {
    spyOn(searchService, 'executeSearchQuery').and.callFake(
      (_query: string, _tags: string[], successCallback: () => void) => {
        successCallback();
      }
    );

    const navigateSpy = spyOn(router, 'navigateByUrl');

    spyOnProperty(router, 'url', 'get').and.returnValue(
      '/blog/search/find?q=test&page=3'
    );

    component.searchQuery = 'test';
    component.selectedTags = [];

    spyOn(searchService, 'getSearchUrlQueryString').and.returnValue('test');

    component.onSearchQueryChangeExec();

    expect(navigateSpy).toHaveBeenCalled();
    expect(navigateSpy.calls.mostRecent().args[0]).toMatch(/page=1/);
  });

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

  it('should load more search data when in search mode', fakeAsync(() => {
    component.searchPageIsActive = true;
    component.searchQuery = 'search_query';
    component.selectedTags = [];
    component.page = 1;
    component.totalBlogPosts = 1;

    searchResponseData = {
      blogPostSummariesList: [blogPostSummaryObject],
      searchOffset: null,
      totalMatchingBlogPosts: 1,
      listOfDefaultTags: ['learners', 'news'],
    };

    const fetchSpy = spyOn(
      blogHomePageBackendApiService,
      'fetchBlogPostSearchResultAsync'
    ).and.returnValue(Promise.resolve(searchResponseData));

    component.loadPage();
    tick();

    expect(fetchSpy).toHaveBeenCalled();
    expect(component.blogPostSummaries).toEqual(
      searchResponseData.blogPostSummariesList
    );
    expect(component.blogPostSummariesToShow).toEqual(
      searchResponseData.blogPostSummariesList
    );
  }));

  it('should navigate if already on search path', () => {
    spyOnProperty(router, 'url', 'get').and.returnValue('/blog/search/find');

    const navigateSpy = spyOn(router, 'navigateByUrl');

    spyOn(searchService, 'executeSearchQuery').and.callFake(
      (_q: string, _t: string[], successCallback: () => void) => {
        successCallback();
      }
    );

    component.searchQuery = 'test';
    component.selectedTags = [];

    component.onSearchQueryChangeExec();

    expect(navigateSpy).toHaveBeenCalled();
  });

  it('should pushState and reload homepage if clearing search on blog path', () => {
    windowRef.nativeWindow.location = {
      href: 'http://localhost/blog',
      pathname: '/blog',
    } as unknown as Location;

    const routerSpy = spyOn(router, 'navigate');

    component.searchQuery = '';
    component.selectedTags = [];

    component.onSearchQueryChangeExec();

    expect(routerSpy).toHaveBeenCalledWith(['/blog']);
  });

  it('should calculate last post correctly when exceeding total posts', () => {
    component.totalBlogPosts = 3;

    component.calculateLastPostOnPageNum(2, 5);

    expect(component.lastPostOnPageNum).toBe(3);
  });

  it('should activate search page when query params exist', () => {
    const queryParams = {q: 'search query', tags: 'Community'};

    const route = (component as unknown as {route: ActivatedRoute}).route;

    route.queryParams = {
      subscribe(fn: (params: {q?: string; tags?: string}) => void): void {
        fn(queryParams);
      },
    } as ActivatedRoute['queryParams'];

    spyOn(component, 'loadPage');

    component.ngOnInit();

    expect(component.filterWasUsed).toBeTrue();
    expect(component.searchPageIsActive).toBeTrue();
    expect(component.searchQuery).toBe('search query');
    expect(component.selectedTags).toEqual(['Community']);
    expect(component.loadPage).toHaveBeenCalled();
  });

  it('should add tags to search params when selectedTags exist', fakeAsync(() => {
    component.searchPageIsActive = true;
    component.page = 1;
    component.searchQuery = 'test';
    component.selectedTags = ['news', 'learners'];

    const response = {
      blogPostSummariesList: [],
      totalMatchingBlogPosts: 0,
      listOfDefaultTags: [],
      searchOffset: null,
    };

    spyOn(
      blogHomePageBackendApiService,
      'fetchBlogPostSearchResultAsync'
    ).and.returnValue(Promise.resolve(response));

    component.loadPage();
    tick();

    expect(
      blogHomePageBackendApiService.fetchBlogPostSearchResultAsync
    ).toHaveBeenCalled();
  }));

  it('should disable next page button when search returns empty results', fakeAsync(() => {
    component.searchPageIsActive = true;
    component.page = 1;
    component.searchQuery = 'test';
    component.selectedTags = [];

    const response = {
      blogPostSummariesList: [],
      totalMatchingBlogPosts: 0,
      listOfDefaultTags: [],
      searchOffset: null,
    };

    spyOn(
      blogHomePageBackendApiService,
      'fetchBlogPostSearchResultAsync'
    ).and.returnValue(Promise.resolve(response));

    component.loadPage();
    tick();

    expect(component.disableNextPageButton).toBeTrue();
    expect(component.noResultsFound).toBeTrue();
    expect(component.showBlogPostCardsLoadingScreen).toBeFalse();
  }));
});
