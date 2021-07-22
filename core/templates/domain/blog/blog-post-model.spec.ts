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
 * @fileoverview Tests for blog post model.
 */
import { BlogPostData } from 'domain/blog/blog-post-model';

describe('Blog Post Object Factory', () => {
  let sampleBlogPostData: BlogPostData;

  beforeEach(() => {
    let sampleBlogPostBackendDict = {
      id: 'sampleId',
      author_username: 'testUsername',
      title: 'sampleTitle',
      content: '<p>Hello</p>',
      thumbnail_filename: 'image',
      url_fragment: 'sampleUrl',
      tags: ['news'],
      last_updated: 3454354354,
      published_on: 3454354354,
    };
    sampleBlogPostData = BlogPostData.createFromBackendDict(
      sampleBlogPostBackendDict);
  });

  it('should not find issues with a valid blog post', () => {
    expect(sampleBlogPostData.validate()).toEqual([]);
  });

  it('should raise correct validation issues', () => {
    sampleBlogPostData.Title = '';
    sampleBlogPostData.Content = '';

    expect(sampleBlogPostData.validate()).toEqual([
      'Blog Post title should not be empty.',
      'Blog Post content should not be empty.'
    ]);
  });

  it('should not find issues with a valid publishable blog post', () => {
    let maxTags = 2;
    expect(sampleBlogPostData.prepublishValidate(maxTags)).toEqual([]);
  });

  it('should raise correct validation issues for pre publish' +
  'validation', () => {
    sampleBlogPostData.Title = '';
    sampleBlogPostData.Content = '';
    sampleBlogPostData.removeTag('news');
    sampleBlogPostData.ThumbnailFilename = null;
    let maxTags = 2;

    expect(sampleBlogPostData.prepublishValidate(maxTags)).toEqual([
      'Blog Post title should not be empty.',
      'Blog Post should have a thumbnail.',
      'Blog Post should have atleast one tag linked to it.',
      'Blog Post content should not be empty.',
    ]);
  });

  it('should raise correct validation issues for' +
  'exceeding property limits', () => {
    sampleBlogPostData.addTag('Learner');
    sampleBlogPostData.Title = 'Title exceeding character limit of 40' +
      ' characters should raise error.';
    let maxTags = 1;

    expect(sampleBlogPostData.prepublishValidate(maxTags)).toEqual([
      'Blog Post title should not exceed 40 characters.',
      'Blog Post should atmost have 1 tag(s) linked to it.'
    ]);
  });

  it('should be able to create an interstitial blog post object', () => {
    let blogPost = BlogPostData.createInterstitialBlogPost();
    expect(blogPost.Id).toEqual(null);
    expect(blogPost.AuthorUsername).toEqual('loading');
    expect(blogPost.Title).toEqual('Blog Post Title loading');
    expect(blogPost.Content).toEqual('');
    expect(blogPost.Tags).toEqual([]);
    expect(blogPost.ThumbnailFilename).toEqual(null);
    expect(blogPost.UrlFragment).toEqual('Url Fragment loading');
  });

  it('should return correct property values', () => {
    expect(sampleBlogPostData.LastUpdated).toEqual(3454354354);
    expect(sampleBlogPostData.PublishedOn).toEqual(3454354354);
  });
});
