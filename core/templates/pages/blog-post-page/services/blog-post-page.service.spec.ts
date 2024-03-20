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

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {TestBed, waitForAsync} from '@angular/core/testing';
import {BlogPostPageService} from 'pages/blog-post-page/services/blog-post-page.service';

describe('Blog Post Page service', () => {
  let blogPostPageService: BlogPostPageService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [],
    }).compileComponents();
  }));

  beforeEach(() => {
    blogPostPageService = TestBed.inject(BlogPostPageService);
  });

  it('should set and retrieve blogPostId correctly', () => {
    blogPostPageService.blogPostId = 'abc123456abc';

    expect(blogPostPageService.blogPostId).toEqual('abc123456abc');
  });
});
