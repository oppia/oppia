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
 * @fileoverview Data and component for the blog post page.
 */

import { Component, OnInit } from '@angular/core';
import { BlogPostSummary } from 'domain/blog/blog-post-summary.model';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { BlogAuthorProfilePageData, BlogHomePageBackendApiService } from 'domain/blog/blog-homepage-backend-api.service';
import { BlogAuthorProfilePageConstants } from './blog-author-profile-page.constants';
import { LoaderService } from 'services/loader.service';
import { UrlService } from 'services/contextual/url.service';
import { AlertsService } from 'services/alerts.service';
import { AppConstants } from 'app.constants';
import { UserService } from 'services/user.service';

import './blog-author-profile-page.component.css';

@Component({
  selector: 'oppia-blog-author-page',
  templateUrl: './blog-author-profile-page.component.html'
})
export class BlogAuthorProfilePageComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  MAX_NUM_CARD_TO_DISPLAY_ON_PAGE!: number;
  authorName!: string;
  authorUsername!: string;
  authorBio!: string;
  authorProfilePicPngUrl!: string;
  authorProfilePicWebpUrl!: string;
  lastPostOnPageNum!: number;
  noResultsFound!: boolean;
  blogPostSummaries: BlogPostSummary[] = [];
  blogPostSummariesToShow: BlogPostSummary[] = [];
  totalBlogPosts: number = 0;
  page: number = 1;
  firstPostOnPageNum: number = 1;
  showBlogPostCardsLoadingScreen: boolean = false;
  constructor(
    private windowDimensionsService: WindowDimensionsService,
    private loaderService: LoaderService,
    private blogHomePageBackendApiService: BlogHomePageBackendApiService,
    private urlService: UrlService,
    private alertsService: AlertsService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loaderService.showLoadingScreen('Loading');
    this.MAX_NUM_CARD_TO_DISPLAY_ON_PAGE = (
      BlogAuthorProfilePageConstants
        .MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_AUTHOR_PROFILE_PAGE
    );
    this.authorUsername = this.urlService.getBlogAuthorUsernameFromUrl();
    this.loadInitialBlogAuthorProfilePageData();
  }

  loadInitialBlogAuthorProfilePageData(): void {
    this.blogHomePageBackendApiService.fetchBlogAuthorProfilePageDataAsync(
      this.authorUsername, '0'
    ).then((data: BlogAuthorProfilePageData) => {
      if (data.numOfBlogPostSummaries) {
        this.totalBlogPosts = data.numOfBlogPostSummaries;
        this.authorName = data.displayedAuthorName;
        this.authorBio = data.authorBio;
        this.noResultsFound = false;
        this.blogPostSummaries = data.blogPostSummaries;
        this.blogPostSummariesToShow = this.blogPostSummaries;
        this.calculateLastPostOnPageNum();
        [this.authorProfilePicPngUrl, this.authorProfilePicWebpUrl] = (
          this.userService.getProfileImageDataUrl(this.authorUsername));
      } else {
        this.noResultsFound = true;
      }
      this.loaderService.hideLoadingScreen();
    }, (errorResponse) => {
      if (AppConstants.FATAL_ERROR_CODES.indexOf(errorResponse.status) !== -1) {
        this.alertsService.addWarning(
          'Failed to get blog author profile page data.Error: ' +
          `${errorResponse.error.error}`);
      }
    });
  }

  loadMoreBlogPostSummaries(offset: number): void {
    this.blogHomePageBackendApiService.fetchBlogAuthorProfilePageDataAsync(
      this.authorUsername, String(offset)
    ).then((data: BlogAuthorProfilePageData) => {
      this.blogPostSummaries = this.blogPostSummaries.concat(
        data.blogPostSummaries);
      this.blogPostSummariesToShow = data.blogPostSummaries;
      this.calculateLastPostOnPageNum();
      this.showBlogPostCardsLoadingScreen = false;
    }, (errorResponse) => {
      if (AppConstants.FATAL_ERROR_CODES.indexOf(errorResponse.status) !== -1) {
        this.alertsService.addWarning(
          'Failed to get blog author page data.Error:' +
          ` ${errorResponse.error.error}`);
      }
    });
  }

  loadPage(): void {
    if (this.blogPostSummaries.length < this.firstPostOnPageNum) {
      this.showBlogPostCardsLoadingScreen = true;
      this.loadMoreBlogPostSummaries(this.firstPostOnPageNum - 1);
    } else {
      this.blogPostSummariesToShow = this.blogPostSummaries.slice(
        (this.firstPostOnPageNum - 1), this.lastPostOnPageNum);
    }
  }

  calculateFirstPostOnPageNum(page = this.page): void {
    this.firstPostOnPageNum = (
      ((page - 1) * this.MAX_NUM_CARD_TO_DISPLAY_ON_PAGE) + 1);
  }

  calculateLastPostOnPageNum(page = this.page): void {
    this.lastPostOnPageNum = Math.min(
      page * this.MAX_NUM_CARD_TO_DISPLAY_ON_PAGE, this.totalBlogPosts);
  }

  onPageChange(): void {
    this.calculateFirstPostOnPageNum();
    this.calculateLastPostOnPageNum();
    this.loadPage();
  }

  isSmallScreenViewActive(): boolean {
    return this.windowDimensionsService.getWidth() <= 768;
  }
}
