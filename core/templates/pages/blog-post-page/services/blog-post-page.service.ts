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
 * @fileoverview Service that handles data on blog post page.
 */

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { BlogPostPageConstants } from '../blog-post-page.constants';
import { ConvertToPlainTextPipe } from 'filters/string-utility-filters/convert-to-plain-text.pipe';

@Injectable({
  providedIn: 'root'
})
export class BlogPostPageService {
  private _blogPostId: string = '';

  constructor(
    private convertToPlainTextPipe: ConvertToPlainTextPipe,
  ) {}

  get blogPostId(): string {
    return this._blogPostId;
  }

  set blogPostId(id: string) {
    this._blogPostId = id;
  }

  calculateEstimatedBlogPostReadingTimeInMins(postContent: string): number {
    let NUM_WORDS_READ_PER_MIN = BlogPostPageConstants.NORMAL_READING_SPEED;
    let numOfWordsInBlogPostContent = (
      this.convertToPlainTextPipe.transform(postContent).split(' ').length
    );
    return (numOfWordsInBlogPostContent / NUM_WORDS_READ_PER_MIN);
  }

  // If user stays on the blog post for more than 45 minutes or for about
  // 5 times the estimated reading time, which ever is greater, is considered
  // to be the maximum time user will actively stay on the blog post and
  // once this time is exceeded blog post exited event is then fired .
  maximumBlogPostReadingTimeInMilliSeconds(postContent: string): number {
    let MILLISECS_IN_MIN: number = 60000;
    return Math.max(
      45 * MILLISECS_IN_MIN,
      this.calculateEstimatedBlogPostReadingTimeInMins(
        postContent) * 5 * MILLISECS_IN_MIN
    );
  }
}

angular.module('oppia').factory('BlogPostPageService',
  downgradeInjectable(BlogPostPageService));
