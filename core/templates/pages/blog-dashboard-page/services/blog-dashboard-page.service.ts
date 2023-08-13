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
import { PreventPageUnloadEventService } from 'services/prevent-page-unload-event.service';
import { BlogPostData } from 'domain/blog/blog-post.model';

@Injectable({
  providedIn: 'root'
})
export class BlogDashboardPageService {
  // This property is initialized using getters and setters
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  private _blogPostData!: BlogPostData;
  private _blogPostId: string = '';
  private _BLOG_POST_EDITOR_URL_TEMPLATE = (
    BlogDashboardPageConstants.BLOG_DASHBOARD_TAB_URLS.BLOG_POST_EDITOR);

  private _activeTab = 'main';
  private _blogPostAction: string = '';
  private _updateViewEventEmitter = new EventEmitter<void>();
  private _updateNavTitleEventEmitter = new EventEmitter<string>();
  private _imageUploaderIsNarrow: boolean = false;

  constructor(
    private alertsService: AlertsService,
    private blogPostEditorBackendService: BlogPostEditorBackendApiService,
    private urlInterpolationService: UrlInterpolationService,
    private urlService: UrlService,
    private windowRef: WindowRef,
    private preventPageUnloadEventService: PreventPageUnloadEventService,
  ) {
    let currentHash: string = this.windowRef.nativeWindow.location.hash;
    this._setActiveTab(currentHash);
    this.detectUrlChange();
  }

  private _setActiveTab(hash: string) {
    if (hash.startsWith('#/blog_post_editor')) {
      this._activeTab = 'editor_tab';
      this._blogPostId = this.urlService.getBlogPostIdFromUrl();
    } else {
      this._activeTab = 'main';
      this.preventPageUnloadEventService.removeListener();
    }
    this.updateViewEventEmitter.emit();
  }

  detectUrlChange(): void {
    this.windowRef.nativeWindow.onhashchange = () => {
      let newHash: string = this.windowRef.nativeWindow.location.hash;
      this._setActiveTab(newHash);
    };
  }

  navigateToEditorTabWithId(blogPostId: string): void {
    let blogPostEditorUrl = this.urlInterpolationService.interpolateUrl(
      this._BLOG_POST_EDITOR_URL_TEMPLATE, {
        blog_post_id: blogPostId
      });
    this.windowRef.nativeWindow.location.hash = blogPostEditorUrl;
  }

  navigateToMainTab(): void {
    this.windowRef.nativeWindow.location.href = '/blog-dashboard';
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

  set blogPostId(id: string) {
    this._blogPostId = id;
  }

  set blogPostData(data: BlogPostData) {
    this._blogPostData = data;
  }

  get blogPostData(): BlogPostData {
    return this._blogPostData;
  }

  set imageUploaderIsNarrow(value: boolean) {
    this._imageUploaderIsNarrow = value;
  }

  get imageUploaderIsNarrow(): boolean {
    return this._imageUploaderIsNarrow;
  }

  get updateViewEventEmitter(): EventEmitter<void> {
    return this._updateViewEventEmitter;
  }

  get updateNavTitleEventEmitter(): EventEmitter<string> {
    return this._updateNavTitleEventEmitter;
  }

  deleteBlogPost(): void {
    this.blogPostEditorBackendService.deleteBlogPostAsync(this._blogPostId)
      .then(
        () => {
          this.alertsService.addSuccessMessage(
            'Blog Post Deleted Successfully.', 5000);
          if (this.activeTab === 'editor_tab') {
            this.navigateToMainTab();
          }
        }, (errorResponse) => {
          this.alertsService.addWarning('Failed to delete blog post.');
        }
      );
  }

  setNavTitle(
      blogPostIsPublished: boolean, title: string): void {
    if (title) {
      if (blogPostIsPublished) {
        return this.updateNavTitleEventEmitter.emit(`Published - ${title}`);
      } else {
        return this.updateNavTitleEventEmitter.emit(`Draft - ${title}`);
      }
    } else {
      return this.updateNavTitleEventEmitter.emit('New Post - Untitled');
    }
  }
}

angular.module('oppia').factory('BlogDashboardPageService',
  downgradeInjectable(BlogDashboardPageService));
