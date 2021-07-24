// Copyright 2020 The Oppia Authors. All Rights Reserved.
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

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { CapitalizePipe } from 'filters/string-utility-filters/capitalize.pipe';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { BlogCardComponent } from './blog-card.component';
import { BlogPostSummaryBackendDict, BlogPostSummary } from 'domain/blog/blog-post-summary.model';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';

class MockCapitalizePipe {
  transform(input: string): string {
    return input;
  }
}

describe('Blog Dashboard Tile Component', () => {
  let component: BlogCardComponent;
  let fixture: ComponentFixture<BlogCardComponent>;
  let urlInterpolationService: UrlInterpolationService;
  let sampleBlogPostSummary: BlogPostSummaryBackendDict;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      declarations: [
        BlogCardComponent,
        MockTranslatePipe
      ],
      providers: [
        {
          provide: CapitalizePipe,
          useClass: MockCapitalizePipe
        },
        UrlInterpolationService,
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BlogCardComponent);
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    component = fixture.componentInstance;

    sampleBlogPostSummary = {
      id: 'sampleId',
      author_username: 'test_user',
      title: 'Title',
      summary: 'Hello World',
      tags: ['news'],
      thumbnail_filename: 'image.png',
      url_fragment: 'title',
      last_updated: 3232323,
      published_on: 3232323,
    };
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should get formatted date string from the timestamp in milliseconds',
    () => {
      // This corresponds to Fri, 21 Nov 2014 09:45:00 GMT.
      let NOW_MILLIS = 1416563100000;

      expect(component.getDateStringInWords(NOW_MILLIS))
        .toBe('November 21, 2014');
    });

  it('should initialize', () => {
    component.authorProfilePicDataUrl = 'data_image_url';
    component.blogPostSummary = BlogPostSummary.createFromBackendDict(
      sampleBlogPostSummary);
    spyOn(urlInterpolationService, 'getStaticImageUrl')
      .and.returnValue('sample_url');

    component.ngOnInit();

    expect(component.authorProfilePictureUrl).toEqual('data_image_url');
    expect(component.DEFAULT_PROFILE_PICTURE_URL).toEqual('sample_url');
    expect(component.thumbnailUrl).toBe(
      '/assetsdevhandler/blog_post/sampleId/assets/thumbnail/image.png');
  });

  it('should not show thumbnail if thumbnail filename is not given', () => {
    sampleBlogPostSummary.thumbnail_filename = null;
    component.blogPostSummary = BlogPostSummary.createFromBackendDict(
      sampleBlogPostSummary);

    expect(component.thumbnailUrl).toBe('');

    component.ngOnInit();

    expect(component.thumbnailUrl).toBe('');
  });
});
