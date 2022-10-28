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
 * @fileoverview Root component for blog home page.
 */

import { Component, OnDestroy, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { AppConstants } from 'app.constants';
import { AlertsService } from 'services/alerts.service';
import { AccessValidationBackendApiService } from 'pages/oppia-root/routing/access-validation-backend-api.service';
import { BlogPostPageData, BlogHomePageBackendApiService } from 'domain/blog/blog-homepage-backend-api.service';
import { LoaderService } from 'services/loader.service';
import { PageHeadService } from 'services/page-head.service';
import { UrlService } from 'services/contextual/url.service';
import { BlogPostData } from 'domain/blog/blog-post.model';
import { PageTitleService } from 'services/page-title.service';
import { PlatformFeatureService } from 'services/platform-feature.service';
import { UserService } from 'services/user.service';

@Component({
  selector: 'oppia-blog-post-page-root',
  templateUrl: './blog-post-page-root.component.html'
})
export class BlogPostPageRootComponent implements OnDestroy, OnInit {
  directiveSubscriptions = new Subscription();
  pageIsShown: boolean = false;
  errorPageIsShown: boolean = false;
  blogPostUrlFragment!: string;
  blogPost!: BlogPostData;
  blogPostPageData!: BlogPostPageData;

  constructor(
    private accessValidationBackendApiService:
    AccessValidationBackendApiService,
    private blogHomePageBackendApiService: BlogHomePageBackendApiService,
    private loaderService: LoaderService,
    private alertsService: AlertsService,
    private pageHeadService: PageHeadService,
    private translateService: TranslateService,
    private pageTitleService: PageTitleService,
    private urlService: UrlService,
    private userService: UserService,
    private platformFeatureService: PlatformFeatureService,
  ) {}

  ngOnInit(): void {
    this.directiveSubscriptions.add(
      this.translateService.onLangChange.subscribe(() => {
        this.setPageTitleAndMetaTags();
      })
    );
    this.blogPostUrlFragment = this.urlService.getBlogPostUrlFromUrl();
    this.loaderService.showLoadingScreen('Loading');
    this.userService.canUserEditBlogPosts().then((userCanEditBlogPost) => {
      if (
        this.platformFeatureService.status.BlogPages.isEnabled ||
        userCanEditBlogPost
      ) {
        this.accessValidationBackendApiService
          .validateAccessToBlogPostPage(this.blogPostUrlFragment)
          .then((resp) => {
            this.fetchBlogPostData(this.blogPostUrlFragment);
          }, (err) => {
            this.errorPageIsShown = true;
            this.loaderService.hideLoadingScreen();
          });
      } else {
        this.errorPageIsShown = true;
        this.loaderService.hideLoadingScreen();
      }
    });
  }

  setPageTitleAndMetaTags(): void {
    let blogPostPage =
      AppConstants.PAGES_REGISTERED_WITH_FRONTEND.BLOG_POST_PAGE;
    const translatedTitle = this.translateService.instant(
      blogPostPage.TITLE, {
        blogPostTitle: this.blogPost.title
      });
    this.pageHeadService.updateTitleAndMetaTags(
      translatedTitle, blogPostPage.META);
    this.pageTitleService.addMetaTag({
      name: 'keywords',
      content: this.blogPost.tags.join(', ')
    });
  }

  // We fetch the blog post data in root component as we need to set page title
  // and meta tags.
  fetchBlogPostData(blogPostUrl: string): void {
    this.blogHomePageBackendApiService.fetchBlogPostPageDataAsync(
      blogPostUrl
    ).then((response: BlogPostPageData) => {
      this.blogPost = response.blogPostDict;
      this.blogPostPageData = response;
      this.pageIsShown = true;
      this.setPageTitleAndMetaTags();
      this.loaderService.hideLoadingScreen();
    }, (error) => {
      this.alertsService.addWarning(
        `Unable to fetch blog post data.Error: ${error.error.error}`);
    });
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
