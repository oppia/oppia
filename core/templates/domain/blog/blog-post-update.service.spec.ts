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
 * @fileoverview Tests for Blog Post update service.
 */

import { BlogPostUpdateService } from 'domain/blog/blog-post-update.service';
import { BlogPostData } from 'domain/blog/blog-post.model';
import { TestBed } from '@angular/core/testing';

describe('Blog Post update service', () => {
  let blogPostUpdateService: BlogPostUpdateService;
  let sampleBlogPost: BlogPostData;

  beforeEach(() => {
    blogPostUpdateService = TestBed.inject(BlogPostUpdateService);
    let sampleBlogPostBackendDict = {
      id: 'sampleId',
      author_username: 'testUsername',
      title: 'sampleTitle',
      content: '<p>Hello</p>',
      thumbnail_filename: 'image',
      url_fragment: 'sampleUrl',
      tags: ['news'],
      last_updated: '3454354354',
      published_on: '3454354354',
    };
    sampleBlogPost = BlogPostData.createFromBackendDict(
      sampleBlogPostBackendDict);
  });

  it('should update the blog post title and add the change in change dict',
    () => {
      let expectedChangeDict = {
        title: 'story'
      };
      expect(sampleBlogPost.title).toEqual('sampleTitle');

      blogPostUpdateService.setBlogPostTitle(sampleBlogPost, 'story');

      expect(sampleBlogPost.title).toEqual('story');
      expect(blogPostUpdateService.getBlogPostChangeDict()).toEqual(
        expectedChangeDict);
    });

  it('should update the blog post thumbnail and add the change', () => {
    let imageBlob = new Blob(
      ['data:image/png;base64,xyz'], {type: 'image/png'});
    let image = [{
      filename: 'sample_image',
      imageBlob: imageBlob
    }];
    let expectedChangeDict = {
      thumbnail_filename: 'sample_image'
    };

    expect(sampleBlogPost.thumbnailFilename).toEqual('image');

    blogPostUpdateService.setBlogPostThumbnail(sampleBlogPost, image);

    expect(sampleBlogPost.thumbnailFilename).toEqual('sample_image');
    expect(blogPostUpdateService.getBlogPostChangeDict()).toEqual(
      expectedChangeDict);
  });

  it('should update the blog post tags and add the change', () => {
    expect(sampleBlogPost.tags).toEqual(['news']);

    blogPostUpdateService.setBlogPostTags(sampleBlogPost, ['news', 'learners']);

    expect(sampleBlogPost.tags).toEqual(['news', 'learners']);
    expect(blogPostUpdateService.getBlogPostChangeDict()).toEqual(
      { tags: ['news', 'learners'] });
  });

  it('should update the blog post content and add the change in change dict',
    () => {
      let expectedChangeDict = {
        content: '<p>Hello World</p>'
      };
      expect(sampleBlogPost.content).toEqual('<p>Hello</p>');

      blogPostUpdateService.setBlogPostContent(
        sampleBlogPost, '<p>Hello World</p>');

      expect(sampleBlogPost.content).toEqual('<p>Hello World</p>');
      expect(blogPostUpdateService.getBlogPostChangeDict()).toEqual(
        expectedChangeDict);
    });

  it('should return the correct blog post change dict with multiple changes',
    () => {
      let expectedChangeDict = {
        title: 'story',
        tags: ['news', 'learners'],
        content: '<p>Hello World</p>',
      };

      blogPostUpdateService.setBlogPostContent(
        sampleBlogPost, '<p>Hello World</p>');
      blogPostUpdateService.setBlogPostTags(
        sampleBlogPost, ['news', 'learners']);
      blogPostUpdateService.setBlogPostTitle(sampleBlogPost, 'story');

      expect(blogPostUpdateService.getBlogPostChangeDict()).toEqual(
        expectedChangeDict);
    });


  it('should set change dict to default when' +
  ' setBlogPostChangeDictToDefault is called.', () => {
    blogPostUpdateService.setBlogPostChangeDictToDefault();

    expect(blogPostUpdateService.changeDict).toEqual({});
  });
});
