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
  'displayed_author_name': string;
  'tags': string[];
  'url_fragment': string;
  'thumbnail_filename': string | null;
  'published_on'?: string;
  'last_updated': string;
  'profile_pic_url'?: string;
}

export class BlogPostSummary {
  _id: string;
  _authorUsername: string;
  _displayedAuthorName: string;
  _title: string;
  _summary: string;
  _tags: string[];
  _thumbnailFilename: string | null;
  _urlFragment: string;
  _lastUpdated?: string;
  _publishedOn?: string;
  _authorProfilePicUrl?: string;
  constructor(
      id: string,
      authorUsername: string,
      displayedAuthorName: string,
      title: string,
      summary: string,
      tags: string[],
      thumbnailFilename: string | null,
      urlFragment: string,
      lastUpdated?: string,
      publishedOn?: string,
      authorProfilePicUrl?: string) {
    this._id = id;
    this._authorUsername = authorUsername;
    this._displayedAuthorName = displayedAuthorName;
    this._title = title;
    this._summary = summary;
    this._tags = tags;
    this._thumbnailFilename = thumbnailFilename;
    this._urlFragment = urlFragment;
    this._lastUpdated = lastUpdated;
    this._publishedOn = publishedOn;
    this._authorProfilePicUrl = authorProfilePicUrl;
  }

  get id(): string {
    return this._id;
  }

  get authorUsername(): string {
    return this._authorUsername;
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

  get authorProfilePicUrl(): string | undefined {
    return this._authorProfilePicUrl;
  }

  get title(): string {
    return this._title;
  }

  get tags(): string[] {
    return this._tags.slice();
  }

  get urlFragment(): string {
    return this._urlFragment;
  }

  get summary(): string {
    return this._summary;
  }

  get thumbnailFilename(): string | null {
    return this._thumbnailFilename;
  }

  static createFromBackendDict(
      blogPostSummaryBackendDict: BlogPostSummaryBackendDict
  ): BlogPostSummary {
    return new BlogPostSummary (
      blogPostSummaryBackendDict.id,
      blogPostSummaryBackendDict.author_username,
      blogPostSummaryBackendDict.displayed_author_name,
      blogPostSummaryBackendDict.title,
      blogPostSummaryBackendDict.summary,
      blogPostSummaryBackendDict.tags,
      blogPostSummaryBackendDict.thumbnail_filename,
      blogPostSummaryBackendDict.url_fragment,
      blogPostSummaryBackendDict.last_updated,
      blogPostSummaryBackendDict.published_on,
      blogPostSummaryBackendDict.profile_pic_url
    );
  }
}
