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
 * @fileoverview Unit Tests for Blog Post Page service.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed, waitForAsync} from '@angular/core/testing';
import { BlogPostPageService } from 'pages/blog-post-page/services/blog-post-page.service';
import { BlogPostPageConstants } from '../blog-post-page.constants';

describe('Blog Post Page service', () => {
  let blogPostPageService: BlogPostPageService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
      ],
      providers: []
    }).compileComponents();
  }));

  beforeEach(() => {
    blogPostPageService = TestBed.inject(BlogPostPageService);
  });

  it('should set and retrieve blogPostId correctly', () => {
    blogPostPageService.blogPostId = 'abc123456abc';

    expect(blogPostPageService.blogPostId).toEqual('abc123456abc');
  });

  it('should calculate estimated blog post reading time correctly', () =>{
    let postContent = 'This is a test blog post content.';
    let NUM_WORDS_READ_PER_MIN = BlogPostPageConstants.NORMAL_READING_SPEED;
    let expectedReadingTime = (
      postContent.split(' ').length / NUM_WORDS_READ_PER_MIN
    );
    expect(
      blogPostPageService.calculateEstimatedBlogPostReadingTimeInMins(
        postContent
      )
    ).toEqual(expectedReadingTime);
  });

  it('should calculate maximum blog post reading time correctly', () => {
    let postContent = 'Content with reading time less than 45 minutes.';
    let MILLISECS_IN_MIN: number = 60000;
    expect(
      blogPostPageService.maximumBlogPostReadingTimeInMilliSeconds(postContent)
    ).toEqual(45 * MILLISECS_IN_MIN);

    postContent = 'Text with reading time greater than 45 minutes.'.repeat(
      BlogPostPageConstants.NORMAL_READING_SPEED).repeat(45);
    let expectedReadingTime = (
      blogPostPageService.calculateEstimatedBlogPostReadingTimeInMins(
        postContent
      )
    );
    expect(
      blogPostPageService.maximumBlogPostReadingTimeInMilliSeconds(postContent)
    ).toEqual(expectedReadingTime);
  });
});
