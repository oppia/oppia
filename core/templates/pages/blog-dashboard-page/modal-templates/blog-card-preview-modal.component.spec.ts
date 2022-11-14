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
 * @fileoverview Unit tests for blog card preview modal component.
 */

import { NgbActiveModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { BlogCardPreviewModalComponent } from './blog-card-preview-modal.component';
import { BlogDashboardPageService } from 'pages/blog-dashboard-page/services/blog-dashboard-page.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TruncatePipe } from 'filters/string-utility-filters/truncate.pipe';
import { RichTextComponentsModule } from 'rich_text_components/rich-text-components.module';
import { Pipe } from '@angular/core';
import { BlogPostBackendDict, BlogPostData } from 'domain/blog/blog-post.model';
import { BlogPostSummary } from 'domain/blog/blog-post-summary.model';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { BlogCardComponent } from '../blog-card/blog-card.component';
import { MockTranslatePipe } from 'tests/unit-test-utils';

class MockActiveModal {
  dismiss(): void {
    return;
  }

  close(): void {
    return;
  }
}

@Pipe({name: 'truncate'})
class MockTruncatePipe {
  transform(value: string, params: number): string {
    return value;
  }
}


describe('Blog Card Preview Modal Component', () => {
  let component: BlogCardPreviewModalComponent;
  let blogDashboardPageService: BlogDashboardPageService;
  let fixture: ComponentFixture<BlogCardPreviewModalComponent>;
  let blogPostData: BlogPostData;
  let sampleBlogPostBackendDict: BlogPostBackendDict = {
    id: 'sampleBlogId',
    displayed_author_name: 'test_user',
    title: 'sample_title',
    content: '<p>hello</p><strong>HEllo</strong>',
    thumbnail_filename: 'image.png',
    tags: ['learners', 'news'],
    url_fragment: 'sample#url',
    last_updated: '11/21/2014, 09:45:00',
    published_on: '',
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        NgbModalModule,
        MatCardModule,
        MatIconModule,
        RichTextComponentsModule,
      ],
      declarations: [
        BlogCardPreviewModalComponent,
        BlogCardComponent,
        MockTranslatePipe],
      providers: [
        BlogDashboardPageService,
        {
          provide: NgbActiveModal,
          useClass: MockActiveModal
        },
        {
          provide: TruncatePipe,
          useClass: MockTruncatePipe,
        }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(
      BlogCardPreviewModalComponent);
    component = fixture.componentInstance;
    blogDashboardPageService = TestBed.inject(BlogDashboardPageService);
  }));

  it('should initialize correctly when blog post is not published', () => {
    sampleBlogPostBackendDict.published_on = '';
    blogPostData = BlogPostData.createFromBackendDict(
      sampleBlogPostBackendDict);
    let expectedBlogPostSummary = new BlogPostSummary (
      blogPostData.id,
      '',
      blogPostData.displayedAuthorName,
      blogPostData.title,
      '<p>hello</p> ',
      blogPostData.tags,
      blogPostData.thumbnailFilename,
      blogPostData.urlFragment,
      blogPostData.lastUpdated,
      blogPostData.lastUpdated);
    blogDashboardPageService.blogPostData = blogPostData;
    blogDashboardPageService.authorPictureUrl = 'sample-url';

    component.ngOnInit();

    expect(component.blogPostSummary).toEqual(
      expectedBlogPostSummary);
    expect(component.profilePicUrl).toBe('sample-url');
  });

  it('should initialize correctly when blog post is published', () => {
    sampleBlogPostBackendDict.published_on = '11/21/2014, 09:45:00';
    blogPostData = BlogPostData.createFromBackendDict(
      sampleBlogPostBackendDict);
    let expectedBlogPostSummary = new BlogPostSummary (
      blogPostData.id,
      '',
      blogPostData.displayedAuthorName,
      blogPostData.title,
      '<p>hello</p> ',
      blogPostData.tags,
      blogPostData.thumbnailFilename,
      blogPostData.urlFragment,
      blogPostData.lastUpdated,
      blogPostData.publishedOn);
    blogDashboardPageService.blogPostData = blogPostData;
    blogDashboardPageService.authorPictureUrl = 'sample-url';

    component.ngOnInit();

    expect(component.blogPostSummary).toEqual(
      expectedBlogPostSummary);
    expect(component.profilePicUrl).toBe('sample-url');
  });
});
