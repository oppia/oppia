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
 * @fileoverview Tests for BlogPostObjectFactory.
 */
import { TestBed } from '@angular/core/testing';

import { BlogPostData, BlogPostObjectFactory } from 'domain/blog/BlogPostObjectFactory';

describe( 'Blog Post Object Factory', () => {
  let blogPostObjectFactory: BlogPostObjectFactory;
  let _sampleBlogPostData: BlogPostData = null;

  beforeEach(() => {
    blogPostObjectFactory = TestBed.inject(BlogPostObjectFactory);
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
    _sampleBlogPostData = blogPostObjectFactory.createFromBackendDict(
      sampleBlogPostBackendDict);
  });

  it('should not find issues with a valid blog post', () => {
    expect(_sampleBlogPostData.validate()).toEqual([]);
  });

  it('should raise correct validation issues', () => {
    _sampleBlogPostData.setTitle('');
    _sampleBlogPostData.setContent('');

    expect(_sampleBlogPostData.validate()).toEqual([
      'Blog Post title should not be empty.',
      'Blog Post content should not be empty'
    ]);
  });

  it('should not find issues with a valid publishable blog post', () => {
    let maxTags = 2;
    expect(_sampleBlogPostData.prepublishValidate(maxTags)).toEqual([]);
  });

  it('should raise correct validation issues for pre publish' + 
  'validation', () => {
    _sampleBlogPostData.setTitle('');
    _sampleBlogPostData.setContent('');
    _sampleBlogPostData.removeTag('news');
    _sampleBlogPostData.setThumbnailFilename(null);
    let maxTags = 2;

    expect(_sampleBlogPostData.prepublishValidate(maxTags)).toEqual([
      'Blog Post title should not be empty.',
      'Blog Post should have a thumbnail',
      'Blog Post should have atleast one tag linked to it.',
      'Blog Post content should not be empty',
    ]);
  });

  it('should raise correct validation issues for' +
  'exceeding property limits', () => {
    _sampleBlogPostData.addTag('Learner');
    let maxTags = 1;

    expect(_sampleBlogPostData.prepublishValidate(maxTags)).toEqual([
      'Blog Post should atmost have 1 tag linked to it.'
    ]);
  });

  it('should be able to create an interstitial blog post object', () => {
    let blogPost = blogPostObjectFactory.createInterstitialBlogPost();
    expect(blogPost.getId()).toEqual(null);
    expect(blogPost.getAuthorUsername()).toEqual('loading');
    expect(blogPost.getTitle()).toEqual('Blog Post Title loading');
    expect(blogPost.getContent()).toEqual('');
    expect(blogPost.getTags()).toEqual([]);
    expect(blogPost.getThumbnailFilename()).toEqual(null);
    expect(blogPost.getUrlFragment()).toEqual('Url Fragment loading');
  });

  it('should return correct property values', () => {
    expect(_sampleBlogPostData.getLastUpdated()).toEqual(3454354354);
    expect(_sampleBlogPostData.getPublishedOn()).toEqual(3454354354)
  })
})