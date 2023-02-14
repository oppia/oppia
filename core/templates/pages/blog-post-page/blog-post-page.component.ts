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

import { Component, OnInit, Input } from '@angular/core';
import { BlogPostPageData } from 'domain/blog/blog-homepage-backend-api.service';
import { BlogPostSummary } from 'domain/blog/blog-post-summary.model';
import { BlogPostData } from 'domain/blog/blog-post.model';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { UrlService } from 'services/contextual/url.service';
import { BlogPostPageConstants } from './blog-post-page.constants';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { BlogPostPageService } from './services/blog-post-page.service';
import { UserService } from 'services/user.service';
import dayjs from 'dayjs';

import './blog-post-page.component.css';

@Component({
  selector: 'oppia-blog-post-page',
  templateUrl: './blog-post-page.component.html'
})
export class BlogPostPageComponent implements OnInit {
  @Input() blogPostPageData!: BlogPostPageData;

  // These properties are initialized using Angular lifecycle hooks
  // and we need to do non-null assertion. For more information, see
  // https://github.com/oppia/oppia/wiki/Guide-on-defining-types#ts-7-1
  MAX_POSTS_TO_RECOMMEND_AT_END_OF_BLOG_POST!: number;
  blogPostUrlFragment!: string;
  blogPost!: BlogPostData;
  publishedDateString: string = '';
  authorProfilePicPngUrl!: string;
  authorProfilePicWebpUrl!: string;
  authorUsername!: string;
  postsToRecommend: BlogPostSummary[] = [];
  blogPostLinkCopied: boolean = false;

  constructor(
    private windowDimensionsService: WindowDimensionsService,
    private urlService: UrlService,
    private urlInterpolationService: UrlInterpolationService,
    private windowRef: WindowRef,
    private blogPostPageService: BlogPostPageService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.MAX_POSTS_TO_RECOMMEND_AT_END_OF_BLOG_POST = (
      BlogPostPageConstants.MAX_POSTS_TO_RECOMMEND_AT_END_OF_BLOG_POST);
    this.blogPostUrlFragment = this.urlService.getBlogPostUrlFromUrl();
    this.authorUsername = this.blogPostPageData.authorUsername;
    this.blogPost = this.blogPostPageData.blogPostDict;
    this.blogPostPageService.blogPostId = this.blogPostPageData.blogPostDict.id;
    this.postsToRecommend = this.blogPostPageData.summaryDicts;
    [this.authorProfilePicPngUrl, this.authorProfilePicWebpUrl] = (
      this.userService.getProfileImageDataUrl(this.authorUsername));
    if (this.blogPost.publishedOn) {
      this.publishedDateString = this.getDateStringInWords(
        this.blogPost.publishedOn);
    }
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

  getDateStringInWords(naiveDate: string): string {
    return dayjs(
      naiveDate.split(',')[0], 'MM-DD-YYYY').format('MMMM D, YYYY');
  }

  isSmallScreenViewActive(): boolean {
    return this.windowDimensionsService.getWidth() <= 900;
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
