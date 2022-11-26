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

import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { BlogPostPageData } from 'domain/blog/blog-homepage-backend-api.service';
import { BlogPostSummary } from 'domain/blog/blog-post-summary.model';
import { BlogPostData } from 'domain/blog/blog-post.model';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { UrlService } from 'services/contextual/url.service';
import { BlogPostPageConstants } from './blog-post-page.constants';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { BlogHomePageBackendApiService } from 'domain/blog/blog-homepage-backend-api.service';
import { ConvertToPlainTextPipe } from 'filters/string-utility-filters/convert-to-plain-text.pipe';
import { WindowRef } from 'services/contextual/window-ref.service';
import { BlogPostPageService } from './services/blog-post-page.service';
import dayjs from 'dayjs';

import './blog-post-page.component.css';

@Component({
  selector: 'oppia-blog-post-page',
  templateUrl: './blog-post-page.component.html'
})
export class BlogPostPageComponent implements OnInit, OnDestroy {
  @Input() blogPostPageData!: BlogPostPageData;

  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  MAX_POSTS_TO_RECOMMEND_AT_END_OF_BLOG_POST!: number;
  NUM_WORDS_READ_PER_MIN = BlogPostPageConstants.NORMAL_READING_SPEED;
  blogPostUrlFragment!: string;
  blogPost!: BlogPostData;
  publishedDateString: string = '';
  authorProfilePicUrl!: string;
  authorUsername!: string;
  DEFAULT_PROFILE_PICTURE_URL!: string;
  postsToRecommend: BlogPostSummary[] = [];
  blogPostLinkCopied: boolean = false;
  hiddenPropertyString!: string;
  visibilityChangeEvent!: string;
  timeUserStartedViewingPost!: number;
  activeTimeUserStayedOnPostInMinutes: number = 0;
  blogPostExitedEventFired: boolean = false;
  blogPostReadEventFired: boolean = false;

  constructor(
    private windowDimensionsService: WindowDimensionsService,
    private urlService: UrlService,
    private urlInterpolationService: UrlInterpolationService,
    private blogHomePageBackendApiService: BlogHomePageBackendApiService,
    private convertToPlainTextPipe: ConvertToPlainTextPipe,
    private windowRef: WindowRef,
    private blogPostPageService: BlogPostPageService,
  ) {
    this.startListening();
  }

  private startListening(): void {
    window.addEventListener('beforeunload', this.ngOnDestroy.bind(this));
  }

  private stopListening(): void {
    console.error('me');
    window.removeEventListener('beforeunload', this.ngOnDestroy.bind(this));
  }

  ngOnInit(): void {
    this.MAX_POSTS_TO_RECOMMEND_AT_END_OF_BLOG_POST = (
      BlogPostPageConstants.MAX_POSTS_TO_RECOMMEND_AT_END_OF_BLOG_POST);
    this.blogPostUrlFragment = this.urlService.getBlogPostUrlFromUrl();
    this.authorUsername = this.blogPostPageData.authorUsername;
    this.blogPost = this.blogPostPageData.blogPostDict;
    this.blogPostPageService.blogPostId = this.blogPostPageData.blogPostDict.id;
    this.postsToRecommend = this.blogPostPageData.summaryDicts;
    this.decodeAuthorProfilePicUrl(
      this.blogPostPageData.profilePictureDataUrl
    );
    if (this.blogPost.publishedOn) {
      this.publishedDateString = this.getDateStringInWords(
        this.blogPost.publishedOn);
    }
    this.blogHomePageBackendApiService.recordBlogPostViewedEventAsync(
      this.blogPostUrlFragment
    );
    const self = this;
    document.addEventListener(
      'visibilitychange', () => this.handleVisibilityChange(self), false
    );
    this.timeUserStartedViewingPost = new Date().getTime();
    // If user stays on the blog post for more than 45 minutes or
    // 5 time estimated reading time, which ever is greater, we fire the blog
    // post exited event.
    let MILLISECS_IN_MIN = 60000;
    setTimeout(() => {
      this.recordBlogPostExitedEvent();
    }, Math.max(
      45 * MILLISECS_IN_MIN,
      this.calculateEstimatedReadingTimeInMinutes() * 5 * MILLISECS_IN_MIN
    ));
  }

  ngOnDestroy(): void {
    if (!this.blogPostExitedEventFired) {
      this.recordBlogPostExitedEvent();
    }
    if (this.isBlogPostRead() && !this.blogPostReadEventFired) {
      this.recordBlogPostReadEvent();
    }
    this.stopListening();
  }

  recordBlogPostExitedEvent(): void {
    let timeUserExitedFromPost: number = new Date().getTime();
    this.activeTimeUserStayedOnPostInMinutes += (
      (timeUserExitedFromPost - this.timeUserStartedViewingPost) / 60000);
    this.blogHomePageBackendApiService.recordBlogPostExitedEventAsync(
      this.blogPostUrlFragment, this.activeTimeUserStayedOnPostInMinutes
    );
    this.blogPostExitedEventFired = true;
  }

  recordBlogPostReadEvent(): void {
    this.blogHomePageBackendApiService.recordBlogPostReadEventAsync(
      this.blogPostUrlFragment
    );
  }

  getPageUrl(): string {
    return this.urlService.getCurrentLocation().href;
  }

  copyLink(className: string): void {
    const codeDiv = document.getElementsByClassName(className)[0];
    const range = document.createRange();
    range.setStartBefore((codeDiv as HTMLDivElement).firstChild as Node);
    range.setEndAfter((codeDiv as HTMLDivElement).lastChild as Node);
    // 'getSelection()' will not return 'null' since it is not called on an
    // undisplayed <iframe>. That is why we can use '?'.
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    document.execCommand('copy');
    selection?.removeAllRanges();
  }

  decodeAuthorProfilePicUrl(url: string): void {
    this.DEFAULT_PROFILE_PICTURE_URL = this.urlInterpolationService
      .getStaticImageUrl('/general/no_profile_picture.png');
    this.authorProfilePicUrl = decodeURIComponent((
      url || this.DEFAULT_PROFILE_PICTURE_URL));
  }

  getDateStringInWords(naiveDate: string): string {
    return dayjs(
      naiveDate.split(',')[0], 'MM-DD-YYYY').format('MMMM D, YYYY');
  }

  isSmallScreenViewActive(): boolean {
    return this.windowDimensionsService.getWidth() <= 900;
  }

  isBlogPostRead(): boolean {
    // If a user actively stays on a blog post for more than 50% of the
    // calculated reading time of the blog post, we consider blogpost to be
    // read by the user.
    return (
      (
        this.activeTimeUserStayedOnPostInMinutes
      ) > (
        this.calculateEstimatedReadingTimeInMinutes() * 0.5
      )
    );
  }

  handleVisibilityChange(self: this): void {
    if (document.hidden) {
      let timeUserMovedAwayFromPost: number = new Date().getTime();
      this.activeTimeUserStayedOnPostInMinutes += (
        (timeUserMovedAwayFromPost - this.timeUserStartedViewingPost) / 60000);
      let blogPostIsRead = self.isBlogPostRead();
      if (blogPostIsRead && !this.blogPostReadEventFired) {
        this.recordBlogPostReadEvent();
      }
    } else {
      this.timeUserStartedViewingPost = new Date().getTime();
    }
  }

  calculateEstimatedReadingTimeInMinutes(): number {
    let numOfWordsInBlogPostContent = (
      this.convertToPlainTextPipe.transform(
        this.blogPost.content).split(' ').length
    );
    return (numOfWordsInBlogPostContent / this.NUM_WORDS_READ_PER_MIN);
  }

  navigateToAuthorProfilePage(): void {
    this.windowRef.nativeWindow.location.href = (
      this.urlInterpolationService.interpolateUrl(
        BlogPostPageConstants.BLOG_AUTHOR_PROFILE_PAGE_URL_TEMPLATE,
        { author_username: this.authorUsername }
      )
    );
  }
}
