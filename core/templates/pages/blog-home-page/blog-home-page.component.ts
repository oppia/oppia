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
import {Router, ActivatedRoute} from '@angular/router';

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
  pendingTagFilterInput: string = '';
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
  filterWasUsed: boolean = false;

  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private windowDimensionsService: WindowDimensionsService,
    private windowRef: WindowRef,
    private blogPostSearchService: BlogPostSearchService,
    private blogHomePageBackendApiService: BlogHomePageBackendApiService,
    private alertsService: AlertsService,
    private loaderService: LoaderService,
    private urlService: UrlService,
    private router: Router,
    private route: ActivatedRoute
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

    this.route.queryParams.subscribe(params => {
      this.page = params.page ? Number(params.page) : 1;

      this.calculateFirstPostOnPageNum(
        this.page,
        BlogHomePageConstants.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_HOMEPAGE
      );

      this.calculateLastPostOnPageNum(
        this.page,
        BlogHomePageConstants.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_HOMEPAGE
      );

      if (params.q || params.tags) {
        this.searchPageIsActive = true;
        this.filterWasUsed = true;

        this.searchQuery = params.q || '';
        this.selectedTags = params.tags
          ? params.tags.replace(/[()"]/g, '').split(' OR ')
          : [];

        this.loadPage();
      } else {
        this.loadInitialBlogHomePageData();
      }
    });

    this.searchQueryChanged
      .pipe(debounceTime(1000), distinctUntilChanged())
      .subscribe(model => {
        this.searchQuery = model;
        this.onSearchQueryChangeExec();
      });

    this.blogPostSearchService.onSearchBarLoaded.emit();

    this.directiveSubscriptions.add(
      this.blogPostSearchService.onInitialSearchResultsLoaded.subscribe(
        (response: SearchResponseData) => {
          this.blogPostSummaries = [];

          if (response.blogPostSummariesList.length > 0) {
            this.noResultsFound = false;
            this.totalBlogPosts = response.totalMatchingBlogPosts;
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
    this.blogPostSummaries = data.blogPostSummariesList;
    this.searchOffset = data.searchOffset;
    this.calculateLastPostOnPageNum(
      this.page,
      this.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_HOMEPAGE_SEARCH
    );
    this.selectBlogPostSummariesToShow();
    this.showBlogPostCardsLoadingScreen = false;
    this.loaderService.hideLoadingScreen();
  }

  loadInitialBlogHomePageData(): void {
    let offset =
      (this.page - 1) *
      BlogHomePageConstants.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_HOMEPAGE;
    if (this.filterWasUsed) {
      this.blogPostSearchService.resetSearchState();
      this.page = 1;
      this.firstPostOnPageNum = 1;
      this.blogPostSummaries = [];
      this.filterWasUsed = false;
      this.totalBlogPosts = 0;
      this.showBlogPostCardsLoadingScreen = false;
    }
    this.blogHomePageBackendApiService
      .fetchBlogHomePageDataAsync(String(offset))
      .then(
        (data: BlogHomePageData) => {
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
        },
        errorResponse => {
          if (
            AppConstants.FATAL_ERROR_CODES.indexOf(errorResponse.status) !== -1
          ) {
            this.alertsService.addWarning(
              'Failed to get blog home page data.Error: ' +
                `${errorResponse.error.error}`
            );
          }
        }
      );
  }

  loadMoreBlogPostSummaries(offset: number): void {
    this.blogHomePageBackendApiService
      .fetchBlogHomePageDataAsync(String(offset))
      .then(
        (data: BlogHomePageData) => {
          this.blogPostSummaries = data.blogPostSummaryDicts;
          this.selectBlogPostSummariesToShow();
          this.showBlogPostCardsLoadingScreen = false;
        },
        errorResponse => {
          if (
            AppConstants.FATAL_ERROR_CODES.indexOf(errorResponse.status) !== -1
          ) {
            this.alertsService.addWarning(
              'Failed to get blog home page data.Error:' +
                ` ${errorResponse.error.error}`
            );
          }
        }
      );
  }

  loadPage(): void {
    this.showBlogPostCardsLoadingScreen = true;

    if (!this.searchPageIsActive) {
      let offset = this.firstPostOnPageNum - 1;
      this.loadMoreBlogPostSummaries(offset);
    } else {
      const pageSize = this.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_HOMEPAGE_SEARCH;
      const offset = (this.page - 1) * pageSize;

      const params = new URLSearchParams();
      if (this.searchQuery) {
        params.set('q', this.searchQuery);
      }
      if (this.selectedTags.length > 0) {
        params.set(
          'tags',
          '(' + this.selectedTags.map(tag => `"${tag}"`).join(' OR ') + ')'
        );
      }
      params.set('offset', offset.toString());

      this.blogHomePageBackendApiService
        .fetchBlogPostSearchResultAsync('?' + params.toString())
        .then(data => {
          if (data.blogPostSummariesList.length === 0) {
            this.disableNextPageButton = true;
            this.showBlogPostCardsLoadingScreen = false;
            this.noResultsFound = true;
            return;
          }

          this.blogPostSummaries = data.blogPostSummariesList;
          this.blogPostSummariesToShow = this.blogPostSummaries;
          this.totalBlogPosts = data.totalMatchingBlogPosts;
          this.listOfDefaultTags = data.listOfDefaultTags;

          this.calculateLastPostOnPageNum(this.page, pageSize);
          this.showBlogPostCardsLoadingScreen = false;
          this.noResultsFound = false;
        })
        .catch(error => {
          if (this.blogPostSummaries.length === 0) {
            this.alertsService.addWarning(
              'No more search resutls found. End of search results.'
            );
          }

          this.showBlogPostCardsLoadingScreen = false;
          this.loaderService.hideLoadingScreen();
        });
    }
  }

  onPageChange(page = this.page): void {
    this.page = page;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {page: page},
      queryParamsHandling: 'merge',
    });
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
    this.blogPostSummariesToShow = this.blogPostSummaries;
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

    const hasUnselectedTagInput = this.pendingTagFilterInput.trim().length > 0;
    if (
      hasUnselectedTagInput &&
      this.selectedTags.length === 0 &&
      this.searchQuery === ''
    ) {
      this.alertsService.addWarning(
        'Please select a tag from the suggestions before searching by tags.'
      );
      this.loaderService.hideLoadingScreen();
      return;
    }

    let currentParams = this.route.snapshot.queryParams;

    const currentQuery = currentParams.q || '';
    const currentTags = currentParams.tags ? currentParams.tags.split(',') : [];
    const currentPage = currentParams.page || '1';

    const isQueryChanged =
      currentQuery !== this.searchQuery ||
      currentTags.join(',') !== this.selectedTags.join(',');

    if (this.searchQuery === '' && this.selectedTags.length === 0) {
      this.searchPageIsActive = false;
      this.filterWasUsed = false;
      this.page = 1;
      this.firstPostOnPageNum = 1;
      this.blogPostSummaries = [];
      this.totalBlogPosts = 0;

      this.router.navigate(['/blog']);
      return;
    }

    this.searchPageIsActive = true;

    this.blogPostSearchService.executeSearchQuery(
      this.searchQuery,
      this.selectedTags,
      () => {
        const pageToUse = isQueryChanged ? '1' : currentPage;

        if (isQueryChanged) {
          this.page = 1;
          this.firstPostOnPageNum = 1;
        }

        this.router.navigate(['/blog/search/find'], {
          queryParams: {
            q: this.searchQuery,
            tags:
              this.selectedTags.length > 0
                ? '(' +
                  this.selectedTags.map(tag => `"${tag}"`).join(' OR ') +
                  ')'
                : '',
            page: pageToUse,
          },
        });
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

  updateSearchFieldsBasedOnUrlQuery(loadPageAfterUpdate = false): void {
    const newSearchQuery: UrlSearchQuery =
      this.blogPostSearchService.updateSearchFieldsBasedOnUrlQuery(
        this.windowRef.nativeWindow.location.search
      );

    this.searchQuery = newSearchQuery.searchQuery;
    this.selectedTags = newSearchQuery.selectedTags;

    if (loadPageAfterUpdate) {
      this.loadPage();
    } else {
      this.onSearchQueryChangeExec();
    }
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
