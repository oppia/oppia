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
 * @fileoverview Service that handles data and routing on blog dashboard page.
 */

import { Injectable, EventEmitter } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { AlertsService } from 'services/alerts.service';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { UrlService } from 'services/contextual/url.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { BlogDashboardPageConstants } from 'pages/blog-dashboard-page/blog-dashboard-page.constants';
import { BlogPostEditorBackendApiService } from 'domain/blog/blog-post-editor-backend-api.service';
import { BlogPostData } from 'domain/blog/blog-post.model';

@Injectable({
  providedIn: 'root'
})
export class BlogDashboardPageService {
  private _blogPostId: string;
  private _BLOG_POST_EDITOR_URL_TEMPLATE = (
    BlogDashboardPageConstants.BLOG_DASHBOARD_TAB_URLS.BLOG_POST_EDITOR);
  private _DRAFT_TAB_URL = (
    BlogDashboardPageConstants.BLOG_DASHBOARD_TAB_URLS.DRAFTS
  );
  private _activeTab = 'main';
  private _blogPostAction: string;
  private _blogPostData: BlogPostData;
  private _maxTags: number;
  private _updateViewEventEmitter= new EventEmitter<void>();

  constructor(
    private alertsService: AlertsService,
    private blogPostEditorBackendService: BlogPostEditorBackendApiService,
    private urlInterpolationService: UrlInterpolationService,
    private urlService: UrlService,
    private windowRef: WindowRef,
  ) {
    let currentHash: string = this.windowRef.nativeWindow.location.hash;
    this._setActiveTab(currentHash);
  }

  private _setActiveTab(hash: string) {
    if (hash.startsWith('#/blog_post_editor')) {
      this._activeTab = 'editor_tab';
      this._blogPostId = this.urlService.getBlogPostIdFromUrl();
    } else {
      this._activeTab = 'main';
    }
    this.updateViewEventEmitter.emit();
  }

  navigateToEditorTabWithId(blogPostId: string): void {
    let blogPostEditorUrl = this.urlInterpolationService.interpolateUrl(
      this._BLOG_POST_EDITOR_URL_TEMPLATE, {
        blog_post_id: blogPostId
      });
    this.windowRef.nativeWindow.location.hash = blogPostEditorUrl;
    this._setActiveTab(blogPostEditorUrl);
  }

  navigateToMainTab(): void {
    this.windowRef.nativeWindow.location.hash = '/';
    this._setActiveTab('/');
    // // The reload is needed in order to flush the blog post data from
    // // blog post update service and dashboard page service.
    // this.windowRef.nativeWindow.location.reload();
  }

  set blogPostAction(action: string) {
    this._blogPostAction = action;
  }

  get blogPostAction(): string {
    return this._blogPostAction;
  }

  get activeTab(): string {
    return this._activeTab;
  }

  get blogPostId(): string {
    return this._blogPostId;
  }

  set blogPostId(blogPostId: string) {
    this._blogPostId = blogPostId;
  }

  set maxTags(maxTags: number) {
    this._maxTags = maxTags;
  }

  get interstitialBlogPost(): BlogPostData {
    return BlogPostData.createInterstitialBlogPost();
  }

  get updateViewEventEmitter(): EventEmitter<void> {
    return this._updateViewEventEmitter;
  }

  fetchBlogPost(blogPostId: string): void {
    this.blogPostEditorBackendService.fetchBlogPostEditorData(blogPostId).then(
      (editorData) => {
        this._blogPostData = editorData.blogPostDict;
        this._maxTags = editorData.maxNumOfTags;
      }, (error) => {
        this.alertsService.addWarning('Failed to get blog dashboard data.');
      });
  }

  deleteBlogPost(): void {
    this.blogPostEditorBackendService.deleteBlogPostAsync(this._blogPostId)
      .then(
        () => {
          this.alertsService.addSuccessMessage(
            'Blog Post Deleted Successfully.', 5000);
          this.navigateToMainTab();
        }, (errorResponse) => {
          this.alertsService.addWarning('Failed to delete blog post.');
        }
      );
  }

  isBlogPostPublishable(): boolean {
    let validationErrors = this._blogPostData.prepublishValidate(this._maxTags);
    if (validationErrors.length === 0) {
      return true;
    } else {
      return false;
    }
  }
}

angular.module('oppia').factory('BlogDashboardPageService',
  downgradeInjectable(BlogDashboardPageService));
