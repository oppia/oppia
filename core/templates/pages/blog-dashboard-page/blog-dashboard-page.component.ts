// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the navbar breadcrumb of the blog dashboard.
 */

import {Component, OnDestroy, OnInit} from '@angular/core';
import {AppConstants} from 'app.constants';
import {AlertsService} from 'services/alerts.service';
import {
  BlogDashboardData,
  BlogDashboardBackendApiService,
} from 'domain/blog/blog-dashboard-backend-api.service';
import {LoaderService} from 'services/loader.service';
import {Subscription} from 'rxjs';
import {BlogDashboardPageService} from 'pages/blog-dashboard-page/services/blog-dashboard-page.service';
import {BlogPostSummary} from 'domain/blog/blog-post-summary.model';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {BlogAuthorDetailsEditorComponent} from './modal-templates/author-detail-editor-modal.component';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {UserService} from 'services/user.service';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
@Component({
  selector: 'oppia-blog-dashboard-page',
  templateUrl: './blog-dashboard-page.component.html',
})
export class BlogDashboardPageComponent implements OnInit, OnDestroy {
  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  activeTab!: string;
  authorName!: string;
  authorBio!: string;
  authorProfilePicPngUrl!: string;
  authorProfilePicWebpUrl!: string;
  blogDashboardData!: BlogDashboardData;
  username!: string | null;
  windowIsNarrow: boolean = false;
  activeView: string = 'gridView';
  directiveSubscriptions = new Subscription();
  constructor(
    private alertsService: AlertsService,
    private blogDashboardBackendService: BlogDashboardBackendApiService,
    private blogDashboardPageService: BlogDashboardPageService,
    private loaderService: LoaderService,
    private userService: UserService,
    private ngbModal: NgbModal,
    private windowDimensionService: WindowDimensionsService,
    private urlInterpolationService: UrlInterpolationService
  ) {}

  ngOnInit(): void {
    this.activeTab = this.blogDashboardPageService.activeTab;
    if (this.activeTab === 'main') {
      this.initMainTab();
    }

    this.windowIsNarrow = this.windowDimensionService.isWindowNarrow();
    this.windowDimensionService.getResizeEvent().subscribe(() => {
      this.windowIsNarrow = this.windowDimensionService.isWindowNarrow();
    });

    this.directiveSubscriptions.add(
      this.blogDashboardPageService.updateViewEventEmitter.subscribe(() => {
        this.activeTab = this.blogDashboardPageService.activeTab;
        if (this.activeTab === 'main') {
          this.initMainTab();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }

  async getUserInfoAsync(): Promise<void> {
    const userInfo = await this.userService.getUserInfoAsync();
    this.username = userInfo.getUsername();

    if (this.username !== null) {
      [this.authorProfilePicPngUrl, this.authorProfilePicWebpUrl] =
        this.userService.getProfileImageDataUrl(this.username);
    } else {
      this.authorProfilePicWebpUrl =
        this.urlInterpolationService.getStaticImageUrl(
          AppConstants.DEFAULT_PROFILE_IMAGE_WEBP_PATH
        );
      this.authorProfilePicPngUrl =
        this.urlInterpolationService.getStaticImageUrl(
          AppConstants.DEFAULT_PROFILE_IMAGE_PNG_PATH
        );
    }
  }

  async initMainTab(): Promise<void> {
    this.loaderService.showLoadingScreen('Loading');
    await this.getUserInfoAsync();
    this.blogDashboardBackendService.fetchBlogDashboardDataAsync().then(
      dashboardData => {
        this.blogDashboardData = dashboardData;
        this.authorName = dashboardData.displayedAuthorName;
        this.authorBio = dashboardData.authorBio;
        this.loaderService.hideLoadingScreen();
        if (this.authorBio.length === 0) {
          this.showAuthorDetailsEditor();
        }
      },
      errorResponse => {
        if (AppConstants.FATAL_ERROR_CODES.indexOf(errorResponse) !== -1) {
          this.alertsService.addWarning('Failed to get blog dashboard data');
        }
      }
    );
  }

  createNewBlogPost(): void {
    this.blogDashboardBackendService.createBlogPostAsync().then(
      blogPostId => {
        this.blogDashboardPageService.navigateToEditorTabWithId(blogPostId);
      },
      error => {
        this.alertsService.addWarning(
          `Unable to create new blog post.Error: ${error}`
        );
      }
    );
  }

  unpublishedBlogPost(blogPostSummary: BlogPostSummary): void {
    let summaryDicts = this.blogDashboardData.publishedBlogPostSummaryDicts;
    let index = summaryDicts.indexOf(blogPostSummary);
    if (index > -1) {
      summaryDicts.splice(index, 1);
    }
    this.blogDashboardData.draftBlogPostSummaryDicts.unshift(blogPostSummary);
    this.blogDashboardData.numOfDraftBlogPosts += 1;
    this.blogDashboardData.numOfPublishedBlogPosts -= 1;
  }

  removeBlogPost(
    blogPostSummary: BlogPostSummary,
    blogPostWasPublished: boolean
  ): void {
    let summaryDicts: BlogPostSummary[];
    if (blogPostWasPublished) {
      summaryDicts = this.blogDashboardData.publishedBlogPostSummaryDicts;
      this.blogDashboardData.numOfPublishedBlogPosts -= 1;
    } else {
      summaryDicts = this.blogDashboardData.draftBlogPostSummaryDicts;
      this.blogDashboardData.numOfDraftBlogPosts -= 1;
    }
    let index = summaryDicts.indexOf(blogPostSummary);
    if (index > -1) {
      summaryDicts.splice(index, 1);
    }
  }

  showAuthorDetailsEditor(): void {
    let modelRef = this.ngbModal.open(BlogAuthorDetailsEditorComponent, {
      backdrop: 'static',
      keyboard: false,
    });
    modelRef.componentInstance.authorName = this.authorName;
    modelRef.componentInstance.authorBio = this.authorBio;
    modelRef.componentInstance.prevAuthorBio = this.authorBio;
    modelRef.result.then(
      authorDetails => {
        this.authorName = authorDetails.authorName;
        this.authorBio = authorDetails.authorBio;
        this.updateAuthorDetails();
      },
      () => {
        // Note to developers:
        // This callback is triggered when the Cancel button is clicked.
        // No further action is needed.
      }
    );
  }

  updateAuthorDetails(): void {
    this.blogDashboardBackendService
      .updateAuthorDetailsAsync(this.authorName, this.authorBio)
      .then(
        () => {
          this.alertsService.addSuccessMessage(
            'Author Details saved successfully.'
          );
        },
        error => {
          this.alertsService.addWarning(
            `Unable to update author details. Error: ${error}`
          );
        }
      );
  }
}
