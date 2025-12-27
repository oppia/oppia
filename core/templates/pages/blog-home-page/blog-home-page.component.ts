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

import {Component, OnInit} from '@angular/core';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {Subject} from 'rxjs';
import {debounceTime, distinctUntilChanged} from 'rxjs/operators';
import {AlertsService} from 'services/alerts.service';
import {Subscription} from 'rxjs';
import {AppConstants} from 'app.constants';
import {
  UrlSearchQuery,
  BlogPostSearchService,
} from 'services/blog-search.service';
import {
  BlogHomePageData,
  BlogHomePageBackendApiService,
} from 'domain/blog/blog-homepage-backend-api.service';
import {SearchResponseData} from 'domain/blog/blog-homepage-backend-api.service';
import {BlogPostSummary} from 'domain/blog/blog-post-summary.model';
import {WindowRef} from 'services/contextual/window-ref.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {LoaderService} from 'services/loader.service';
import {UrlService} from 'services/contextual/url.service';
import {BlogHomePageConstants} from './blog-home-page.constants';

import './blog-home-page.component.css';

@Component({
  selector: 'oppia-blog-home-page',
  templateUrl: './blog-home-page.component.html',
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
  blogPostSummaries: (BlogPostSummary | null)[] = [];
  blogPostSummariesToShow: BlogPostSummary[] = [];
  searchedBlogPostSummaries: BlogPostSummary[] = [];
  page: number = 1;
  searchPageIsActive: boolean = false;
  directiveSubscriptions = new Subscription();
  firstPostOnPageNum: number = 1;
  searchOffset: number | null = 0;
  disableNextPageButton: boolean = false;
  filterWasUsed: boolean = false;
  isLoadingBlogPosts: boolean = false;

  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private windowDimensionsService: WindowDimensionsService,
    private windowRef: WindowRef,
    private blogPostSearchService: BlogPostSearchService,
    private blogHomePageBackendApiService: BlogHomePageBackendApiService,
    private alertsService: AlertsService,
    private loaderService: LoaderService,
    private urlService: UrlService
  ) {}

  ngOnInit(): void {
    this.loaderService.showLoadingScreen('Loading');
    this.oppiaAvatarImgUrl =
      this.urlInterpolationService.getStaticCopyrightedImageUrl(
        '/avatar/oppia_avatar_100px.svg'
      );
    this.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_HOMEPAGE =
      BlogHomePageConstants.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_HOMEPAGE;
    this.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_HOMEPAGE_SEARCH =
      BlogHomePageConstants.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_SEARCH_RESULTS_PAGE;
    if (this.urlService.getUrlParams().hasOwnProperty('q')) {
      this.searchPageIsActive = true;
      this.filterWasUsed = true;
      this.updateSearchFieldsBasedOnUrlQuery();
    } else {
      this.loadInitialBlogHomePageData();
    }
    this.searchQueryChanged
      .pipe(debounceTime(1000), distinctUntilChanged())
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

  getStaticCopyrightedImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticCopyrightedImageUrl(imagePath);
  }

  loadSearchResultsPageData(data: SearchResponseData): void {
    this.blogPostSummaries = this.blogPostSummaries.concat(
      data.blogPostSummariesList
    );
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
    if (this.filterWasUsed) {
      this.blogPostSearchService.resetSearchState();
      this.page = 1;
      this.firstPostOnPageNum = 1;
      this.blogPostSummaries = [];
      this.filterWasUsed = false;
      this.totalBlogPosts = 0;
      this.showBlogPostCardsLoadingScreen = false;
      this.searchPageIsActive = false;
      this.isLoadingBlogPosts = false;
    }
    this.blogHomePageBackendApiService.fetchBlogHomePageDataAsync('0').then(
      (data: BlogHomePageData) => {
        if (data.numOfPublishedBlogPosts) {
          this.totalBlogPosts = data.numOfPublishedBlogPosts;
          this.noResultsFound = false;
          this.blogPostSummaries = data.blogPostSummaryDicts;
          this.blogPostSummariesToShow = this.blogPostSummaries.filter(
            summary => summary !== null && summary !== undefined
          ) as BlogPostSummary[];
          this.calculateLastPostOnPageNum(
            this.page,
            this.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_HOMEPAGE
          );
        } else {
          this.noResultsFound = true;
          this.totalBlogPosts = 0;
        }
        this.listOfDefaultTags = data.listOfDefaultTags;
        this.loaderService.hideLoadingScreen();
      },
      errorResponse => {
        this.isLoadingBlogPosts = false;
        if (
          AppConstants.FATAL_ERROR_CODES.indexOf(errorResponse.status) !== -1
        ) {
          this.alertsService.addWarning(
            'Failed to get blog home page data.Error: ' +
              `${errorResponse.error?.error || errorResponse.status}`
          );
        } else {
          this.alertsService.addWarning(
            'Unable to load blog home page. Please try again.'
          );
        }
        this.loaderService.hideLoadingScreen();
      }
    );
  }

  loadMoreBlogPostSummaries(offset: number): void {
    // Prevent concurrent loads.
    if (this.isLoadingBlogPosts) {
      return;
    }

    // Validate offset is non-negative.
    if (offset < 0) {
      this.alertsService.addWarning('Invalid page offset. Please try again.');
      this.showBlogPostCardsLoadingScreen = false;
      this.isLoadingBlogPosts = false;
      return;
    }

    // Validate offset doesn't exceed total posts.
    if (this.totalBlogPosts > 0 && offset >= this.totalBlogPosts) {
      this.alertsService.addWarning('No more blog posts available.');
      this.showBlogPostCardsLoadingScreen = false;
      this.isLoadingBlogPosts = false;
      return;
    }

    this.isLoadingBlogPosts = true;
    this.blogHomePageBackendApiService
      .fetchBlogHomePageDataAsync(String(offset))
      .then(
        (data: BlogHomePageData) => {
          this.isLoadingBlogPosts = false;
          // If we're jumping to a non-consecutive page, we need to ensure
          // the array structure is correct. Pad with nulls up to the offset
          // to maintain correct indices, then append the new data.
          if (offset > this.blogPostSummaries.length) {
            const extendedArray = [...this.blogPostSummaries];
            // Pad the array to the required offset with nulls.
            while (extendedArray.length < offset) {
              extendedArray.push(null);
            }
            // Append the new page data.
            extendedArray.push(...data.blogPostSummaryDicts);
            this.blogPostSummaries = extendedArray;
          } else {
            // Check if we need to insert data at a specific offset (when array
            // has been padded with nulls) or append (normal consecutive loading).
            const currentLength = this.blogPostSummaries.length;
            if (offset < currentLength) {
              // Array has been padded, insert data at the correct offset.
              // Only replace nulls, don't overwrite valid data.
              const newArray = [...this.blogPostSummaries];
              // Replace nulls at the offset position with actual data.
              for (let i = 0; i < data.blogPostSummaryDicts.length; i++) {
                const targetIndex = offset + i;
                // Only replace if the position is null or undefined.
                if (
                  newArray[targetIndex] === null ||
                  newArray[targetIndex] === undefined
                ) {
                  newArray[targetIndex] = data.blogPostSummaryDicts[i];
                }
              }
              this.blogPostSummaries = newArray;
            } else {
              // Normal case: consecutive page loading, append to existing array.
              this.blogPostSummaries = this.blogPostSummaries.concat(
                data.blogPostSummaryDicts
              );
            }
          }
          this.selectBlogPostSummariesToShow();
          this.calculateLastPostOnPageNum(
            this.page,
            this.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_HOMEPAGE
          );
          this.showBlogPostCardsLoadingScreen = false;
        },
        errorResponse => {
          this.isLoadingBlogPosts = false;
          this.showBlogPostCardsLoadingScreen = false;
          if (
            AppConstants.FATAL_ERROR_CODES.indexOf(errorResponse.status) !== -1
          ) {
            this.alertsService.addWarning(
              'Failed to get blog home page data.Error: ' +
                `${errorResponse.error?.error || errorResponse.status}`
            );
          } else {
            // Handle non-fatal errors (like network issues).
            this.alertsService.addWarning(
              'Unable to load blog posts. Please try again.'
            );
          }
          // Still try to show what we have.
          this.selectBlogPostSummariesToShow();
        }
      );
  }

  loadPage(): void {
    // Prevent loading if already loading.
    if (this.isLoadingBlogPosts) {
      return;
    }

    if (this.blogPostSummaries.length < this.firstPostOnPageNum) {
      this.showBlogPostCardsLoadingScreen = true;
      if (!this.searchPageIsActive) {
        // Calculate the offset needed for the current page (0-indexed).
        const requiredOffset = this.firstPostOnPageNum - 1;
        // Validate offset before loading.
        if (requiredOffset < 0) {
          this.alertsService.addWarning(
            'Invalid page number. Please try again.'
          );
          this.showBlogPostCardsLoadingScreen = false;
          return;
        }
        if (this.totalBlogPosts > 0 && requiredOffset >= this.totalBlogPosts) {
          this.alertsService.addWarning('No more blog posts available.');
          this.showBlogPostCardsLoadingScreen = false;
          return;
        }
        this.loadMoreBlogPostSummaries(requiredOffset);
      } else {
        // For search pages, use the search service.
        // Check if we have more data to load before calling loadMoreData.
        if (this.searchOffset === null && this.blogPostSummaries.length > 0) {
          // No more search results available.
          this.alertsService.addWarning(
            'No more search results found. End of search results.'
          );
          this.showBlogPostCardsLoadingScreen = false;
          return;
        }
        this.blogPostSearchService.loadMoreData(
          data => {
            this.loadSearchResultsPageData(data);
          },
          isEndOfResults => {
            this.showBlogPostCardsLoadingScreen = false;
            if (isEndOfResults) {
              this.alertsService.addWarning(
                'No more search results found. End of search results.'
              );
            }
          }
        );
      }
    } else {
      this.selectBlogPostSummariesToShow();
    }
  }

  onPageChange(page = this.page): void {
    // Prevent page changes while loading.
    if (this.isLoadingBlogPosts) {
      return;
    }

    // Validate page number.
    if (page < 1) {
      this.alertsService.addWarning('Invalid page number.');
      return;
    }

    // Calculate max pages based on total posts.
    const pageSize = !this.searchPageIsActive
      ? this.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_HOMEPAGE
      : this.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_HOMEPAGE_SEARCH;
    const maxPages =
      this.totalBlogPosts > 0 ? Math.ceil(this.totalBlogPosts / pageSize) : 1;

    if (page > maxPages && this.totalBlogPosts > 0) {
      this.alertsService.addWarning('No more pages available.');
      return;
    }

    this.page = page;

    if (!this.searchPageIsActive) {
      this.calculateFirstPostOnPageNum(page, pageSize);
      this.calculateLastPostOnPageNum(page, pageSize);
      this.loadPage();
    } else {
      this.calculateFirstPostOnPageNum(page, pageSize);
      this.calculateLastPostOnPageNum(page, pageSize);
      this.loadPage();
    }
  }

  selectBlogPostSummariesToShow(): void {
    // Prevent recursive loading if already loading.
    if (this.isLoadingBlogPosts) {
      // Still try to show what we have, even if incomplete.
      const startIndex = this.firstPostOnPageNum - 1;
      const endIndex = this.lastPostOnPageNum;
      const pageData = this.blogPostSummaries.slice(startIndex, endIndex);
      this.blogPostSummariesToShow = pageData.filter(
        (summary): summary is BlogPostSummary =>
          summary !== null && summary !== undefined
      );
      return;
    }

    const startIndex = this.firstPostOnPageNum - 1;
    const endIndex = this.lastPostOnPageNum;
    const pageData = this.blogPostSummaries.slice(startIndex, endIndex);

    // Check if we have null values, which indicate missing page data.
    // If we do, we need to load the missing pages.
    const hasNulls = pageData.some(
      summary => summary === null || summary === undefined
    );

    if (hasNulls && !this.searchPageIsActive) {
      // Find the first null index to determine which page needs to be loaded.
      const firstNullIndex = pageData.findIndex(
        summary => summary === null || summary === undefined
      );
      if (firstNullIndex !== -1) {
        // Calculate the absolute index of the first missing item.
        const missingItemIndex = startIndex + firstNullIndex;
        // Calculate which page this item belongs to.
        const missingPage =
          Math.floor(
            missingItemIndex / this.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_HOMEPAGE
          ) + 1;
        // Load the missing page.
        const missingPageOffset =
          (missingPage - 1) * this.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_HOMEPAGE;
        // Validate offset before loading.
        if (
          missingPageOffset >= 0 &&
          (this.totalBlogPosts === 0 || missingPageOffset < this.totalBlogPosts)
        ) {
          this.loadMoreBlogPostSummaries(missingPageOffset);
          return;
        }
      }
    }

    // Filter out null values and set the data to show.
    this.blogPostSummariesToShow = pageData.filter(
      (summary): summary is BlogPostSummary =>
        summary !== null && summary !== undefined
    );
  }

  calculateFirstPostOnPageNum(pageNum: number, pageSize: number): void {
    this.firstPostOnPageNum = (pageNum - 1) * pageSize + 1;
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
    if (this.searchQuery === '' && this.selectedTags.length === 0) {
      this.searchPageIsActive = false;
      this.loadInitialBlogHomePageData();
      this.windowRef.nativeWindow.history.pushState({}, '', '/blog');
      return;
    }
    this.blogPostSearchService.executeSearchQuery(
      this.searchQuery,
      this.selectedTags,
      () => {
        let searchUrlQueryString =
          this.blogPostSearchService.getSearchUrlQueryString(
            this.searchQuery,
            this.selectedTags
          );
        let url = new URL(this.windowRef.nativeWindow.location.toString());
        let siteLangCode: string | null = url.searchParams.get('lang');
        url.search = '?q=' + searchUrlQueryString;
        if (
          this.windowRef.nativeWindow.location.pathname === '/blog/search/find'
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
      },
      errorResponse => {
        this.alertsService.addWarning(
          `Unable to fetch search results. Error: ${errorResponse}`
        );
      }
    );
  }

  isSmallScreenViewActive(): boolean {
    return this.windowDimensionsService.getWidth() <= 1024;
  }

  updateSearchFieldsBasedOnUrlQuery(): void {
    let newSearchQuery: UrlSearchQuery;
    newSearchQuery =
      this.blogPostSearchService.updateSearchFieldsBasedOnUrlQuery(
        this.windowRef.nativeWindow.location.search
      );

    if (
      this.searchQuery !== newSearchQuery.searchQuery ||
      this.selectedTags !== newSearchQuery.selectedTags
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
