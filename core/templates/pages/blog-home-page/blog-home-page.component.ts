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
 * @fileoverview Data and component for the blog home page.
 */

import { Component, OnInit } from '@angular/core';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AlertsService } from 'services/alerts.service';
import { Subscription } from 'rxjs';
import { AppConstants } from 'app.constants';
import { UrlSearchQuery, BlogPostSearchService } from 'services/blog-search.service';
import { BlogHomePageData, BlogHomePageBackendApiService } from 'domain/blog/blog-homepage-backend-api.service';
import { SearchResponseData } from 'domain/blog/blog-homepage-backend-api.service';
import { BlogPostSummary } from 'domain/blog/blog-post-summary.model';
import { WindowRef } from 'services/contextual/window-ref.service';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { LoaderService } from 'services/loader.service';
import { UrlService } from 'services/contextual/url.service';
import { BlogHomePageConstants } from './blog-home-page.constants';

import './blog-home-page.component.css';

@Component({
  selector: 'oppia-blog-home-page',
  templateUrl: './blog-home-page.component.html'
})
export class BlogHomePageComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_HOMEPAGE!: number;
  MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_HOMEPAGE_SEARCH!: number;
  searchBarPlaceholder!: string;
  lastPostOnPageNum!: number;
  totalBlogPosts!: number;
  noResultsFound!: boolean;
  oppiaAvatarImgUrl!: string;
  searchQuery: string = '';
  activeMenuName: string = '';
  searchButtonIsActive: boolean = false;
  searchQueryChanged: Subject<string> = new Subject<string>();
  listOfDefaultTags: string[] = [];
  selectedTags: string[] = [];
  showBlogPostCardsLoadingScreen: boolean = false;
  blogPostSummaries: BlogPostSummary[] = [];
  blogPostSummariesToShow: BlogPostSummary[] = [];
  searchedBlogPostSummaries: BlogPostSummary[] = [];
  page: number = 1;
  searchPageIsActive: boolean = false;
  directiveSubscriptions = new Subscription();
  firstPostOnPageNum: number = 1;
  searchOffset: number | null = 0;
  disableNextPageButton: boolean = false;

  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private windowDimensionsService: WindowDimensionsService,
    private windowRef: WindowRef,
    private blogPostSearchService: BlogPostSearchService,
    private blogHomePageBackendApiService: BlogHomePageBackendApiService,
    private alertsService: AlertsService,
    private loaderService: LoaderService,
    private urlService: UrlService,
  ) {}

  ngOnInit(): void {
    this.loaderService.showLoadingScreen('Loading');
    this.oppiaAvatarImgUrl = this.urlInterpolationService.getStaticImageUrl(
      '/avatar/oppia_avatar_100px.svg');
    this.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_HOMEPAGE = (
      BlogHomePageConstants.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_HOMEPAGE);
    this.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_HOMEPAGE_SEARCH = (
      BlogHomePageConstants.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_SEARCH_RESULTS_PAGE
    );
    if (this.urlService.getUrlParams().hasOwnProperty('q')) {
      this.searchPageIsActive = true;
      this.updateSearchFieldsBasedOnUrlQuery();
    } else {
      this.loadInitialBlogHomePageData();
    }
    this.searchQueryChanged.pipe(debounceTime(1000), distinctUntilChanged())
      .subscribe(model => {
        this.searchQuery = model;
        this.onSearchQueryChangeExec();
      });

    // Notify the function that handles overflow in case the
    // search elements load after it has already been run.
    this.blogPostSearchService.onSearchBarLoaded.emit();

    // Called when the first batch of search results is retrieved from
    // the server.
    this.directiveSubscriptions.add(
      this.blogPostSearchService.onInitialSearchResultsLoaded.subscribe(
        (response: SearchResponseData) => {
          this.blogPostSummaries = [];
          this.page = 1;
          this.firstPostOnPageNum = 1;
          if (response.blogPostSummariesList.length > 0) {
            this.noResultsFound = false;
            this.loadSearchResultsPageData(response);
          } else {
            this.noResultsFound = true;
          }
          this.listOfDefaultTags = response.listOfDefaultTags;
          this.loaderService.hideLoadingScreen();
        }
      )
    );
  }

  getStaticImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticAssetUrl(imagePath);
  }

  loadSearchResultsPageData(data: SearchResponseData): void {
    this.blogPostSummaries = this.blogPostSummaries.concat(
      data.blogPostSummariesList);
    this.searchOffset = data.searchOffset;
    if (this.searchOffset) {
      // As search offset is not null, there are more search result pages to
      // load. Therefore for pagination to show that more results are available,
      // total number of blog post is one more than the number of blog posts
      // loaded as number of pages is automatically calculated using total
      // collection size and number of blog posts to show on a page.
      this.totalBlogPosts = this.blogPostSummaries.length + 1;
    } else {
      this.totalBlogPosts = this.blogPostSummaries.length;
    }
    this.calculateLastPostOnPageNum(
      this.page,
      this.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_HOMEPAGE_SEARCH
    );
    this.selectBlogPostSummariesToShow();
    this.showBlogPostCardsLoadingScreen = false;
    this.loaderService.hideLoadingScreen();
  }

  loadInitialBlogHomePageData(): void {
    this.blogHomePageBackendApiService.fetchBlogHomePageDataAsync(
      '0').then((data: BlogHomePageData) => {
      if (data.numOfPublishedBlogPosts) {
        this.totalBlogPosts = data.numOfPublishedBlogPosts;
        this.noResultsFound = false;
        this.blogPostSummaries = data.blogPostSummaryDicts;
        this.blogPostSummariesToShow = this.blogPostSummaries;
        this.calculateLastPostOnPageNum(
          this.page,
          this.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_HOMEPAGE
        );
      } else {
        this.noResultsFound = true;
      }
      this.listOfDefaultTags = data.listOfDefaultTags;
      this.loaderService.hideLoadingScreen();
    }, (errorResponse) => {
      if (AppConstants.FATAL_ERROR_CODES.indexOf(errorResponse.status) !== -1) {
        this.alertsService.addWarning(
          'Failed to get blog home page data.Error: ' +
          `${errorResponse.error.error}`);
      }
    });
  }

  loadMoreBlogPostSummaries(offset: number): void {
    this.blogHomePageBackendApiService.fetchBlogHomePageDataAsync(
      String(offset)
    ).then((data: BlogHomePageData) => {
      this.blogPostSummaries = this.blogPostSummaries.concat(
        data.blogPostSummaryDicts);
      this.selectBlogPostSummariesToShow();
      this.calculateLastPostOnPageNum(
        this.page,
        this.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_HOMEPAGE
      );
      this.showBlogPostCardsLoadingScreen = false;
    }, (errorResponse) => {
      if (AppConstants.FATAL_ERROR_CODES.indexOf(errorResponse.status) !== -1) {
        this.alertsService.addWarning(
          'Failed to get blog home page data.Error:' +
          ` ${errorResponse.error.error}`);
      }
    });
  }

  loadPage(): void {
    if (this.blogPostSummaries.length < this.firstPostOnPageNum) {
      this.showBlogPostCardsLoadingScreen = true;
      if (!this.searchPageIsActive) {
        this.loadMoreBlogPostSummaries(this.firstPostOnPageNum - 1);
      } else {
        this.blogPostSearchService.loadMoreData((data) => {
          this.loadSearchResultsPageData(data);
        }, (_isCurrentlyFetchingResults) => {
          this.alertsService.addWarning(
            'No more search resutls found. End of search results.');
        });
      }
    } else {
      this.selectBlogPostSummariesToShow();
    }
  }

  onPageChange(page = this.page): void {
    if (!this.searchPageIsActive) {
      this.calculateFirstPostOnPageNum(
        page,
        this.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_HOMEPAGE
      );
      this.calculateLastPostOnPageNum(
        page,
        this.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_HOMEPAGE
      );
      this.loadPage();
    } else {
      this.calculateFirstPostOnPageNum(
        page,
        this.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_HOMEPAGE_SEARCH
      );
      this.calculateLastPostOnPageNum(
        page,
        this.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_HOMEPAGE_SEARCH
      );
      this.loadPage();
    }
  }

  selectBlogPostSummariesToShow(): void {
    this.blogPostSummariesToShow = this.blogPostSummaries.slice(
      (this.firstPostOnPageNum - 1), this.lastPostOnPageNum);
  }

  calculateFirstPostOnPageNum(pageNum: number, pageSize: number): void {
    this.firstPostOnPageNum = ((pageNum - 1) * pageSize) + 1;
  }

  calculateLastPostOnPageNum(pageNum: number, pageSize: number): void {
    this.lastPostOnPageNum = Math.min(pageNum * pageSize, this.totalBlogPosts);
  }

  isSearchInProgress(): boolean {
    return false;
  }

  searchToBeExec(e: {target: {value: string}}): void {
    if (!this.searchButtonIsActive) {
      this.searchQueryChanged.next(e.target.value);
    }
  }

  onSearchQueryChangeExec(): void {
    this.loaderService.showLoadingScreen('Loading');
    this.blogPostSearchService.executeSearchQuery(
      this.searchQuery, this.selectedTags, () => {
        let searchUrlQueryString = (
          this.blogPostSearchService.getSearchUrlQueryString(
            this.searchQuery, this.selectedTags
          )
        );
        let url = new URL(this.windowRef.nativeWindow.location.toString());
        let siteLangCode: string | null = url.searchParams.get('lang');
        url.search = '?q=' + searchUrlQueryString;
        if (
          this.windowRef.nativeWindow.location.pathname === (
            '/blog/search/find')
        ) {
          if (siteLangCode) {
            url.searchParams.append('lang', siteLangCode);
          }
          this.windowRef.nativeWindow.history.pushState({}, '', url.toString());
        } else {
          url.pathname = 'blog/search/find';
          if (siteLangCode) {
            url.searchParams.append('lang', siteLangCode);
          }
          this.windowRef.nativeWindow.location.href = url.toString();
        }
      }, (errorResponse) => {
        this.alertsService.addWarning(
          `Unable to fetch search results.Error: ${errorResponse}`);
      });
  }

  isSmallScreenViewActive(): boolean {
    return this.windowDimensionsService.getWidth() <= 1024;
  }

  updateSearchFieldsBasedOnUrlQuery(): void {
    let newSearchQuery: UrlSearchQuery;
    newSearchQuery = (
      this.blogPostSearchService.updateSearchFieldsBasedOnUrlQuery(
        this.windowRef.nativeWindow.location.search)
    );

    if (
      this.searchQuery !== newSearchQuery.searchQuery || (
        this.selectedTags !== newSearchQuery.selectedTags)
    ) {
      this.searchQuery = newSearchQuery.searchQuery;
      this.selectedTags = newSearchQuery.selectedTags;
      this.onSearchQueryChangeExec();
    }
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
