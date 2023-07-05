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
 * @fileoverview Root component for blog author profile page.
 */

import { Component, OnDestroy, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { AppConstants } from 'app.constants';
import { AccessValidationBackendApiService } from 'pages/oppia-root/routing/access-validation-backend-api.service';
import { LoaderService } from 'services/loader.service';
import { PageHeadService } from 'services/page-head.service';
import { UrlService } from 'services/contextual/url.service';
import { PlatformFeatureService } from 'services/platform-feature.service';
import { UserService } from 'services/user.service';

@Component({
  selector: 'oppia-blog-author-profile-page-root',
  templateUrl: './blog-author-profile-page-root.component.html'
})
export class BlogAuthorProfilePageRootComponent implements OnDestroy, OnInit {
  directiveSubscriptions = new Subscription();
  errorPageIsShown: boolean = false;
  pageIsShown: boolean = false;
  authorUsername!: string;

  constructor(
    private accessValidationBackendApiService:
    AccessValidationBackendApiService,
    private loaderService: LoaderService,
    private pageHeadService: PageHeadService,
    private translateService: TranslateService,
    private urlService: UrlService,
    private userService: UserService,
    private platformFeatureService: PlatformFeatureService,
  ) {}

  ngOnInit(): void {
    this.setPageTitleAndMetaTags();

    this.directiveSubscriptions.add(
      this.translateService.onLangChange.subscribe(() => {
        this.setPageTitleAndMetaTags();
      })
    );

    this.authorUsername = this.urlService.getBlogAuthorUsernameFromUrl();
    this.loaderService.showLoadingScreen('Loading');
    this.userService.canUserEditBlogPosts().then((userCanEditBlogPost) => {
      if (
        this.platformFeatureService.status.BlogPages.isEnabled ||
        userCanEditBlogPost
      ) {
        this.accessValidationBackendApiService
          .validateAccessToBlogAuthorProfilePage(this.authorUsername)
          .then(() => {
            this.pageIsShown = true;
          }, () => {
            this.errorPageIsShown = true;
          }).then(() => {
            this.loaderService.hideLoadingScreen();
          });
      } else {
        this.errorPageIsShown = true;
        this.loaderService.hideLoadingScreen();
      }
    });
  }

  setPageTitleAndMetaTags(): void {
    const blogAuthorProfilePage =
      AppConstants.PAGES_REGISTERED_WITH_FRONTEND.BLOG_AUTHOR_PROFILE_PAGE;
    const translatedTitle = this.translateService.instant(
      blogAuthorProfilePage.TITLE);
    this.pageHeadService.updateTitleAndMetaTags(
      translatedTitle, blogAuthorProfilePage.META);
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
