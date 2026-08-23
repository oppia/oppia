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

import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {AlertsService} from 'services/alerts.service';
import {Subscription} from 'rxjs';
import {AppConstants} from 'app.constants';
import {
  BlogHomePageData,
  BlogHomePageBackendApiService,
} from 'domain/blog/blog-homepage-backend-api.service';
import {BlogPostSummary} from 'domain/blog/blog-post-summary.model';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {LoaderService} from 'services/loader.service';
import {BlogHomePageConstants} from './blog-home-page.constants';
import {Router, ActivatedRoute} from '@angular/router';

@Component({
  selector: 'oppia-blog-home-page',
  templateUrl: './blog-home-page.component.html',
  styleUrls: ['./blog-home-page.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class BlogHomePageComponent implements OnInit {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1

  MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_HOMEPAGE!: number;
  lastPostOnPageNum!: number;
  totalBlogPosts!: number;
  noResultsFound!: boolean;
  oppiaAvatarImgUrl!: string;
  showBlogPostCardsLoadingScreen: boolean = false;
  blogPostSummaries: BlogPostSummary[] = [];
  blogPostSummariesToShow: BlogPostSummary[] = [];
  page: number = 1;
  directiveSubscriptions = new Subscription();
  firstPostOnPageNum: number = 1;

  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private windowDimensionsService: WindowDimensionsService,
    private blogHomePageBackendApiService: BlogHomePageBackendApiService,
    private alertsService: AlertsService,
    private loaderService: LoaderService,
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

      this.loadInitialBlogHomePageData();
    });
  }

  getStaticCopyrightedImageUrl(imagePath: string): string {
    return this.urlInterpolationService.getStaticCopyrightedImageUrl(imagePath);
  }

  loadInitialBlogHomePageData(): void {
    let offset =
      (this.page - 1) *
      BlogHomePageConstants.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_HOMEPAGE;

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
    let offset = this.firstPostOnPageNum - 1;
    this.loadMoreBlogPostSummaries(offset);
  }

  onPageChange(page = this.page): void {
    this.page = page;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {page: page},
      queryParamsHandling: 'merge',
    });
    this.calculateFirstPostOnPageNum(
      page,
      this.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_HOMEPAGE
    );
    this.calculateLastPostOnPageNum(
      page,
      this.MAX_NUM_CARDS_TO_DISPLAY_ON_BLOG_HOMEPAGE
    );
    this.loadPage();
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

  isSmallScreenViewActive(): boolean {
    return this.windowDimensionsService.getWidth() <= 1024;
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
