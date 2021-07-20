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
 * @fileoverview Model for creating frontend instances of
 * blog post summary.
 */

export interface BlogPostSummaryBackendDict {
  'id': string;
  'title': string;
  'summary': string;
  'author_username': string;
  'tags': string[];
  'url_fragment': string;
  'thumbnail_filename': string;
  'published_on'?: number;
  'last_updated': number;
}

export class BlogPostSummary {
  _id: string;
  _author_username: string;
  _title: string;
  _summary: string;
  _tags: string[];
  _thumbnailFilename: string;
  _urlFragment: string;
  _lastUpdated: number;
  _publishedOn: number
  constructor(
      id: string,
      author_username: string,
      title: string,
      summary: string,
      tags: string[],
      thumbnailFilename: string,
      urlFragment: string,
      lastUpdated?: number,
      publishedOn?: number) {
    this._id = id;
    this._author_username = author_username;
    this._title = title;
    this._summary = summary;
    this._tags = tags;
    this._thumbnailFilename = thumbnailFilename;
    this._urlFragment = urlFragment;
    this._lastUpdated = lastUpdated;
    this._publishedOn = publishedOn
  }

  getId(): string {
    return this._id;
  }

  getAuthorUsername(): string {
    return this._author_username;
  }

  getLastUpdated(): number {
    return this._lastUpdated;
  }

  getPublishedOn(): number {
    return this._publishedOn;
  }

  getTitle(): string {
    return this._title;
  }

  getTags(): string[] {
    return this._tags.slice();
  }

  getUrlFragment(): string {
    return this._urlFragment;
  }

  getSummary(): string {
    return this._summary
  }

  getThumbnailFilename(): string {
    return this._thumbnailFilename;
  }

  static createFromBackendDict(
      blogPostSummaryBackendDict: BlogPostSummaryBackendDict
  ): BlogPostSummary {
    return new BlogPostSummary (
      blogPostSummaryBackendDict.id,
      blogPostSummaryBackendDict.author_username,
      blogPostSummaryBackendDict.title,
      blogPostSummaryBackendDict.summary,
      blogPostSummaryBackendDict.tags,
      blogPostSummaryBackendDict.thumbnail_filename,
      blogPostSummaryBackendDict.url_fragment,
      blogPostSummaryBackendDict.last_updated,
      blogPostSummaryBackendDict.published_on
    );
  }
}