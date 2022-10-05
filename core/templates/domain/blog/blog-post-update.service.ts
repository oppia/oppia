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
 * @fileoverview Service to handle the updating of a blog post.
 */
import { Injectable } from '@angular/core';
import { BlogPostData } from 'domain/blog/blog-post.model';
import { downgradeInjectable } from '@angular/upgrade/static';
import { ImagesData } from 'services/image-local-storage.service';

export interface BlogPostChangeDict {
  'title'?: string;
  'thumbnail_filename'?: string;
  'content'?: string;
  'tags'?: string[];
}


@Injectable({
  providedIn: 'root',
})
export class BlogPostUpdateService {
  changeDict: BlogPostChangeDict = {};

  setBlogPostTitle(blogPost: BlogPostData, title: string): void {
    blogPost.title = title;
    this.changeDict.title = title;
  }

  setBlogPostThumbnail(blogPost: BlogPostData, image: ImagesData[]): void {
    let filename = image[0].filename;
    blogPost.thumbnailFilename = filename;
    this.changeDict.thumbnail_filename = filename;
  }

  setBlogPostTags(blogPost: BlogPostData, tags: string[]): void {
    blogPost.tags = tags;
    this.changeDict.tags = blogPost.tags;
  }

  setBlogPostContent(blogPost: BlogPostData, content: string): void {
    blogPost.content = content;
    this.changeDict.content = content;
  }

  getBlogPostChangeDict(): BlogPostChangeDict {
    return this.changeDict;
  }

  setBlogPostChangeDictToDefault(): void {
    this.changeDict = {};
  }
}

angular.module('oppia').factory(
  'BlogPostUpdateService',
  downgradeInjectable(BlogPostUpdateService));
