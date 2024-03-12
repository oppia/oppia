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
 * @fileoverview Unit tests for Blog Card component.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {CapitalizePipe} from 'filters/string-utility-filters/capitalize.pipe';
import {MockTranslatePipe, MockCapitalizePipe} from 'tests/unit-test-utils';
import {BlogCardComponent} from './blog-card.component';
import {
  BlogPostSummaryBackendDict,
  BlogPostSummary,
} from 'domain/blog/blog-post-summary.model';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {ContextService} from 'services/context.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {UserService} from 'services/user.service';

describe('Blog Dashboard Tile Component', () => {
  let component: BlogCardComponent;
  let fixture: ComponentFixture<BlogCardComponent>;
  let urlInterpolationService: UrlInterpolationService;
  let contextService: ContextService;
  let sampleBlogPostSummary: BlogPostSummaryBackendDict;
  let userService: UserService;
  class MockWindowRef {
    nativeWindow = {
      location: {
        href: '',
        hash: '/',
        reload: () => {},
      },
    };
  }
  let mockWindowRef: MockWindowRef;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [BlogCardComponent, MockTranslatePipe],
      providers: [
        {
          provide: CapitalizePipe,
          useClass: MockCapitalizePipe,
        },
        {
          provide: WindowRef,
          useClass: MockWindowRef,
        },
        UrlInterpolationService,
        ContextService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BlogCardComponent);
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    contextService = TestBed.inject(ContextService);
    component = fixture.componentInstance;
    mockWindowRef = TestBed.inject(WindowRef) as unknown as MockWindowRef;
    userService = TestBed.inject(UserService);
    sampleBlogPostSummary = {
      id: 'sampleId',
      author_username: 'test_username',
      displayed_author_name: 'test_user',
      title: 'Title',
      summary: 'Hello World',
      tags: ['news'],
      thumbnail_filename: 'image.png',
      url_fragment: 'title',
      last_updated: '11/21/2014',
      published_on: '11/21/2014',
    };
    spyOn(userService, 'getProfileImageDataUrl').and.returnValue([
      'default-image-url-png',
      'default-image-url-webp',
    ]);
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should get formatted date string from the timestamp in milliseconds', () => {
    // This corresponds to Fri, 21 Nov 2014 09:45:00 GMT.
    let DATE = '11/21/2014';
    expect(component.getDateStringInWords(DATE)).toBe('November 21, 2014');

    DATE = '01/16/2027';
    expect(component.getDateStringInWords(DATE)).toBe('January 16, 2027');

    DATE = '02/02/2018';
    expect(component.getDateStringInWords(DATE)).toBe('February 2, 2018');
  });

  it('should initialize', () => {
    component.blogPostSummary = BlogPostSummary.createFromBackendDict(
      sampleBlogPostSummary
    );
    spyOn(contextService, 'isInBlogPostEditorPage').and.returnValue(true);

    component.ngOnInit();

    expect(component.authorProfilePicPngUrl).toEqual('default-image-url-png');
    expect(component.authorProfilePicWebpUrl).toEqual('default-image-url-webp');
    expect(component.thumbnailUrl).toBe(
      '/assetsdevhandler/blog_post/sampleId/assets/' + 'thumbnail/image.png'
    );
    expect(component.publishedDateString).toBe('November 21, 2014');
    expect(component.blogCardPreviewModeIsActive).toBeTrue();
  });

  it('should throw error if published date is not defined', () => {
    const invalidBlogPostSummary: BlogPostSummaryBackendDict = {
      id: 'sampleId',
      author_username: 'test_username',
      displayed_author_name: 'test_user',
      title: 'Title',
      summary: 'Hello World',
      tags: ['news'],
      thumbnail_filename: 'image.png',
      url_fragment: 'title',
      last_updated: '11/21/2014',
    };
    component.blogPostSummary = BlogPostSummary.createFromBackendDict(
      invalidBlogPostSummary
    );

    expect(() => {
      component.ngOnInit();
    }).toThrowError('Blog Post Summary published date is not defined');
  });

  it('should not show thumbnail if thumbnail filename is not given', () => {
    spyOn(contextService, 'isInBlogPostEditorPage').and.returnValue(true);
    sampleBlogPostSummary.thumbnail_filename = null;
    component.blogPostSummary = BlogPostSummary.createFromBackendDict(
      sampleBlogPostSummary
    );

    expect(component.thumbnailUrl).toBe('');

    component.ngOnInit();

    expect(component.thumbnailUrl).toBe('');
  });

  it('should navigate to the blog post page', () => {
    component.blogPostSummary = BlogPostSummary.createFromBackendDict(
      sampleBlogPostSummary
    );
    spyOn(contextService, 'isInBlogPostEditorPage').and.returnValue(false);
    spyOn(urlInterpolationService, 'interpolateUrl').and.returnValue(
      '/blog/sample-blog-post-url'
    );

    component.navigateToBlogPostPage();

    expect(mockWindowRef.nativeWindow.location.href).toEqual(
      '/blog/sample-blog-post-url'
    );
  });
});
