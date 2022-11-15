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
 * @fileoverview Unit tests for blog-post-summary-model.
 */

import { TestBed } from '@angular/core/testing';

import { BlogPostSummary } from 'domain/blog/blog-post-summary.model';

describe('Blog post summary object factory', () => {
  let sampleSummary: BlogPostSummary;
  let sampleSummaryBackendObject = {
    id: 'sampleId',
    author_username: 'test_user',
    displayed_author_name: 'test_user_name',
    title: 'Title',
    summary: 'Hello World',
    tags: ['news'],
    thumbnail_filename: 'image.png',
    url_fragment: 'title',
    last_updated: '3232323',
    published_on: '3232323',
    profile_pic_url: 'sample_url',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BlogPostSummary]
    });
  });

  it('should create correct BlogPostSummary object from' +
    ' backend dict', () => {
    sampleSummary = BlogPostSummary.createFromBackendDict(
      sampleSummaryBackendObject);

    expect(sampleSummary.id).toEqual('sampleId');
    expect(sampleSummary.authorUsername).toEqual('test_user');
    expect(sampleSummary.displayedAuthorName).toEqual('test_user_name');
    expect(sampleSummary.title).toEqual('Title');
    expect(sampleSummary.tags).toEqual(['news']);
    expect(sampleSummary.summary).toEqual('Hello World');
    expect(sampleSummary.urlFragment).toEqual('title');
    expect(sampleSummary.lastUpdated).toEqual('3232323');
    expect(sampleSummary.publishedOn).toEqual('3232323');
    expect(sampleSummary.thumbnailFilename).toEqual('image.png');
    expect(sampleSummary.authorProfilePicUrl).toEqual('sample_url');
  });
});
