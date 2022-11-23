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
 * @fileoverview Model for creating and mutating instances of frontend
 * blog post domain objects.
 */

import { AppConstants } from 'app.constants';
export interface BlogPostBackendDict {
  'id': string ;
  'displayed_author_name': string;
  'title': string;
  'content': string;
  'thumbnail_filename': string | null;
  'tags': string[];
  'url_fragment': string;
  'last_updated'?: string;
  'published_on'?: string;
}
export class BlogPostData {
  _id: string;
  _displayedAuthorName: string;
  _title: string;
  _content: string;
  _tags: string[];
  _thumbnailFilename: string | null;
  _urlFragment: string;
  _lastUpdated?: string;
  _publishedOn?: string;
  constructor(
      id: string,
      displayedAuthorName: string,
      title: string,
      content: string,
      tags: string[],
      thumbnailFilename: string | null,
      urlFragment: string,
      lastUpdated?: string,
      publishedOn?: string) {
    this._id = id;
    this._displayedAuthorName = displayedAuthorName;
    this._title = title;
    this._content = content;
    this._tags = tags;
    this._thumbnailFilename = thumbnailFilename;
    this._urlFragment = urlFragment;
    this._lastUpdated = lastUpdated;
    this._publishedOn = publishedOn;
  }

  get id(): string {
    return this._id;
  }

  get displayedAuthorName(): string {
    return this._displayedAuthorName;
  }

  get lastUpdated(): string | undefined {
    return this._lastUpdated;
  }

  get publishedOn(): string | undefined {
    return this._publishedOn;
  }

  set title(title: string) {
    this._title = title;
  }

  get title(): string {
    return this._title;
  }

  get tags(): string[] {
    return this._tags;
  }

  set tags(tags: string[]) {
    this._tags = tags;
  }

  addTag(tag: string): void {
    this._tags.push(tag);
  }

  removeTag(tag: string): void {
    let index = this._tags.indexOf(tag);
    this._tags.splice(index, 1);
  }

  get urlFragment(): string {
    return this._urlFragment;
  }

  set thumbnailFilename(thumbnailFilename: string | null) {
    this._thumbnailFilename = thumbnailFilename;
  }

  get thumbnailFilename(): string | null {
    return this._thumbnailFilename;
  }

  get content(): string {
    return this._content;
  }

  set content(content: string) {
    this._content = content;
  }

  validate(): string[] {
    let issues = [];
    if (this._title === '') {
      issues.push(
        'Blog Post title should not be empty.');
    } else if (this._title.length < AppConstants.MIN_CHARS_IN_BLOG_POST_TITLE) {
      issues.push(
        'Blog Post title should not be less than ' +
        `${AppConstants.MIN_CHARS_IN_BLOG_POST_TITLE} characters.`
      );
    }
    if (this._content === '') {
      issues.push(
        'Blog Post content should not be empty.');
    }
    return issues;
  }

  prepublishValidate(maxTags: number): string[] {
    let issues = [];
    if (this._title === '') {
      issues.push(
        'Blog Post title should not be empty.');
    } else if (this._title.length > AppConstants.MAX_CHARS_IN_BLOG_POST_TITLE) {
      issues.push(
        'Blog Post title should not exceed ' +
        `${AppConstants.MAX_CHARS_IN_BLOG_POST_TITLE} characters.`
      );
    } else if (this._title.length < AppConstants.MIN_CHARS_IN_BLOG_POST_TITLE) {
      issues.push(
        'Blog Post title should not be less than ' +
        `${AppConstants.MIN_CHARS_IN_BLOG_POST_TITLE} characters.`
      );
    }
    if (!this._thumbnailFilename) {
      issues.push(
        'Blog Post should have a thumbnail.');
    }
    if (this._tags.length === 0) {
      issues.push(
        'Blog Post should have atleast one tag linked to it.');
    }
    if (this._tags.length > maxTags) {
      issues.push(
        `Blog Post should atmost have ${maxTags} tag(s) linked to it.`);
    }
    if (this._content === '') {
      issues.push(
        'Blog Post content should not be empty.');
    }
    return issues;
  }

  static createFromBackendDict(
      blogPostBackendDict: BlogPostBackendDict): BlogPostData {
    return new BlogPostData (
      blogPostBackendDict.id,
      blogPostBackendDict.displayed_author_name,
      blogPostBackendDict.title,
      blogPostBackendDict.content,
      blogPostBackendDict.tags,
      blogPostBackendDict.thumbnail_filename,
      blogPostBackendDict.url_fragment,
      blogPostBackendDict.last_updated,
      blogPostBackendDict.published_on);
  }
}
